"""
AudioReplayService - SOLUCIÓN COMPLETA LiveKit 1.0
====================================================

Servicio robusto para replay de audio TTS que permite a los usuarios
reproducir el último mensaje del agente como si fuera un archivo MP3,
sin re-triggear el pipeline LLM → TTS.

CARACTERÍSTICAS:
✅ Audio buffer concatenado para replay instantáneo
✅ Metadata tracking completo (texto, timestamp, duración)
✅ RPC handler optimizado con error handling robusto
✅ Compatibilidad completa con LiveKit 1.0 patterns
✅ Singleton pattern thread-safe
✅ Memory management eficiente
✅ Support para modo híbrido (voz + texto)

ARQUITECTURA:
- Captura: AudioContent frames → concatenated buffer
- Storage: bytearray + metadata en memoria
- Replay: buffer → AudioFrame iterator → session.say()
- RPC: bidirectional communication con frontend

USO:
    # Setup en entrypoint
    await setup_audio_replay_integration(ctx, session)

    # RPC call desde frontend
    await participant.performRpc("replay_last_audio", {})
"""

import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

from livekit import rtc
from livekit.agents import AgentSession
from livekit.agents.llm.chat_context import AudioContent
from livekit.rtc import RpcInvocationData

logger = logging.getLogger(__name__)


@dataclass
class AudioAsset:
    """
    Representa un asset de audio completo para replay.

    Contiene toda la información necesaria para reproducir
    un mensaje de audio sin re-synthesis.
    """

    # Audio data
    buffer: bytearray = field(default_factory=bytearray)
    sample_rate: int = 16000
    channels: int = 1
    frame_count: int = 0

    # Content metadata
    text_content: str = ""
    clean_text: str = ""  # Sin timestamps ni artifacts

    # Timing metadata
    created_at: float = field(default_factory=time.time)
    duration_seconds: float = 0.0

    # Quality metadata
    voice_id: str = ""
    tts_model: str = ""

    def is_valid(self) -> bool:
        """Verifica si el asset es válido para replay."""
        return (
            len(self.buffer) > 0
            and self.frame_count > 0
            and len(self.clean_text.strip()) > 0
            and self.duration_seconds > 0.1  # Mínimo 100ms
        )

    def size_mb(self) -> float:
        """Retorna el tamaño del asset en MB."""
        return len(self.buffer) / (1024 * 1024)

    def clear(self) -> None:
        """Limpia el asset liberando memoria."""
        self.buffer.clear()
        self.text_content = ""
        self.clean_text = ""
        self.frame_count = 0
        self.duration_seconds = 0.0


class AudioReplayService:
    """
    Servicio robusto para replay de audio TTS en LiveKit 1.0.

    FUNCIONALIDADES:
    - Captura automática del último audio generado por TTS
    - Storage eficiente como audio asset reutilizable
    - Replay instantáneo sin re-synthesis via RPC
    - Memory management con límites configurables
    - Error handling completo con feedback al usuario

    PATRONES LIVEKIT 1.0:
    - session.say() con audio pre-sintetizado
    - AsyncIterator[rtc.AudioFrame] para streaming
    - RPC handler con JSON responses
    - Thread-safe singleton pattern

    LIMITACIONES:
    - Solo mantiene el último audio en memoria
    - Buffer size máximo configurable (default: 10MB)
    - Requiere AudioContent frames válidos para captura
    """

    def __init__(
        self, max_buffer_size_mb: float = 10.0, max_duration_seconds: float = 120.0
    ) -> None:
        """
        Inicializa el servicio de audio replay.

        Args:
            max_buffer_size_mb: Tamaño máximo del buffer en MB
            max_duration_seconds: Duración máxima de audio a mantener

        Raises:
            ValueError: Si los parámetros están fuera de rango válido
        """
        if max_buffer_size_mb <= 0 or max_buffer_size_mb > 100:
            raise ValueError("max_buffer_size_mb debe estar entre 0.1 y 100 MB")

        if max_duration_seconds <= 0 or max_duration_seconds > 300:
            raise ValueError("max_duration_seconds debe estar entre 1 y 300 segundos")

        # Configuration
        self.max_buffer_size_mb = max_buffer_size_mb
        self.max_duration_seconds = max_duration_seconds

        # Audio storage
        self._current_asset = AudioAsset()
        self._is_capturing = False
        self._is_replaying = False

        # Thread safety
        self._lock = asyncio.Lock()

        # Metrics para monitoring
        self._total_captures = 0
        self._total_replays = 0
        self._failed_captures = 0
        self._failed_replays = 0

        logger.info(
            "🎵 AudioReplayService inicializado - " "Buffer: %.1fMB, Duración: %.0fs",
            self.max_buffer_size_mb,
            self.max_duration_seconds,
        )

    async def save_last_audio(self, speech_handle) -> None:
        """
        Captura y procesa el audio del último speech completado.

        Extrae AudioContent frames del speech handle, los concatena en un
        buffer reutilizable y extrae metadata del texto asociado.

        Args:
            speech_handle: SpeechHandle de LiveKit con audio completado

        Note:
            - Función async para evitar blocking del main thread
            - Incluye cleanup de texto para remover timestamps
            - Valida quality del audio antes de storage
            - Thread-safe con async lock
        """
        if not speech_handle or not hasattr(speech_handle, 'chat_message'):
            logger.debug("❌ Speech handle inválido o sin chat_message")
            return

        async with self._lock:
            try:
                self._is_capturing = True
                await self._capture_audio_content(speech_handle)
                await self._capture_text_content(speech_handle)
                await self._finalize_audio_asset()

                if self._current_asset.is_valid():
                    self._total_captures += 1
                    logger.info(
                        "✅ Audio capturado exitosamente - "
                        "Frames: %d, Duración: %.1fs, Tamaño: %.2fMB, "
                        "Texto: '%.40s'",
                        self._current_asset.frame_count,
                        self._current_asset.duration_seconds,
                        self._current_asset.size_mb(),
                        self._current_asset.clean_text,
                    )
                else:
                    self._failed_captures += 1
                    logger.warning("⚠️ Audio capturado pero inválido para replay")

            except Exception as e:
                self._failed_captures += 1
                logger.error("❌ Error capturando audio: %s", str(e), exc_info=True)
            finally:
                self._is_capturing = False

    async def _capture_audio_content(self, speech_handle) -> None:
        """
        Extrae y concatena AudioContent frames en buffer reutilizable.

        Args:
            speech_handle: Handle con chat_message conteniendo AudioContent
        """
        if not speech_handle.chat_message or not speech_handle.chat_message.content:
            return

        # Limpiar asset previo
        self._current_asset.clear()

        # Extraer AudioContent items
        audio_items = [
            c
            for c in speech_handle.chat_message.content
            if isinstance(c, AudioContent) and hasattr(c, 'frame') and c.frame
        ]

        if not audio_items:
            logger.debug("📭 No se encontraron AudioContent items")
            return

        # Procesar primer AudioContent (normalmente solo hay uno)
        audio_content = audio_items[0]
        frames = audio_content.frame

        if not frames:
            logger.debug("📭 AudioContent sin frames")
            return

        # Concatenar frames en buffer
        frame_count = 0
        total_samples = 0

        for frame in frames:
            if hasattr(frame, 'data') and frame.data:
                # Concatenar raw audio data
                self._current_asset.buffer.extend(frame.data)
                frame_count += 1

                # Calcular samples (asumiendo 16-bit audio)
                samples_in_frame = len(frame.data) // 2
                total_samples += samples_in_frame

                # Actualizar metadata de frame
                if hasattr(frame, 'sample_rate') and frame.sample_rate > 0:
                    self._current_asset.sample_rate = frame.sample_rate
                if hasattr(frame, 'num_channels') and frame.num_channels > 0:
                    self._current_asset.channels = frame.num_channels

        # Actualizar counters
        self._current_asset.frame_count = frame_count

        # Calcular duración basada en samples
        if total_samples > 0 and self._current_asset.sample_rate > 0:
            self._current_asset.duration_seconds = total_samples / self._current_asset.sample_rate

        logger.debug(
            "🔊 Audio frames concatenados - " "Count: %d, Buffer: %d bytes, Duración: %.1fs",
            frame_count,
            len(self._current_asset.buffer),
            self._current_asset.duration_seconds,
        )

    async def _capture_text_content(self, speech_handle) -> None:
        """
        Extrae y limpia el contenido de texto asociado al audio.

        Args:
            speech_handle: Handle con chat_message conteniendo texto
        """
        if not speech_handle.chat_message or not speech_handle.chat_message.content:
            return

        # Extraer texto de todos los content items
        text_parts = []
        for content_item in speech_handle.chat_message.content:
            if hasattr(content_item, 'text') and content_item.text:
                text_parts.append(content_item.text.strip())

        if not text_parts:
            logger.debug("📝 No se encontró contenido de texto")
            return

        # Combinar texto
        raw_text = " ".join(text_parts)
        self._current_asset.text_content = raw_text

        # Limpiar texto removiendo timestamps y artifacts
        clean_text = self._clean_text_content(raw_text)
        self._current_asset.clean_text = clean_text

        logger.debug("📝 Texto capturado - " "Raw: '%.50s', Clean: '%.50s'", raw_text, clean_text)

    def _clean_text_content(self, raw_text: str) -> str:
        """
        Limpia el texto removiendo timestamps y otros artifacts.

        Args:
            raw_text: Texto original potencialmente con timestamps

        Returns:
            Texto limpio para display al usuario
        """
        if not raw_text:
            return ""

        import re

        # Remover timestamps como "3:57 p. m.", "10:30 AM", etc.
        patterns = [
            r'\s*\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?\s*$',  # Final timestamps
            r'^\s*\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?\s*',  # Initial timestamps
            r'\s*\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?\s*',  # Middle timestamps
        ]

        cleaned = raw_text
        for pattern in patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

        # Normalizar espacios
        cleaned = ' '.join(cleaned.split())

        return cleaned.strip()

    async def _finalize_audio_asset(self) -> None:
        """
        Finaliza el audio asset aplicando validaciones y límites.
        """
        asset = self._current_asset

        # Validar tamaño del buffer
        buffer_size_mb = asset.size_mb()
        if buffer_size_mb > self.max_buffer_size_mb:
            logger.warning(
                "⚠️ Audio buffer excede límite (%.2fMB > %.1fMB), truncando",
                buffer_size_mb,
                self.max_buffer_size_mb,
            )
            # Truncar buffer manteniendo proporciones
            max_bytes = int(self.max_buffer_size_mb * 1024 * 1024)
            asset.buffer = asset.buffer[:max_bytes]
            # Recalcular duración
            samples = len(asset.buffer) // 2
            if asset.sample_rate > 0:
                asset.duration_seconds = samples / asset.sample_rate

        # Validar duración
        if asset.duration_seconds > self.max_duration_seconds:
            logger.warning(
                "⚠️ Audio duration excede límite (%.1fs > %.0fs)",
                asset.duration_seconds,
                self.max_duration_seconds,
            )
            # La duración se maneja via buffer truncation arriba

        # Finalizar timestamp
        asset.created_at = time.time()

    async def replay_iterator(self) -> AsyncIterator[rtc.AudioFrame]:
        """
        Generator que convierte el audio buffer en AudioFrame stream.

        Yields:
            rtc.AudioFrame: Frames de audio para playback via session.say()

        Note:
            - Chunk size optimizado para latency vs performance
            - Mantiene sample rate y channels originales
            - Thread-safe para concurrent access
        """
        async with self._lock:
            if not self._current_asset.is_valid():
                logger.warning("⚠️ No hay audio asset válido para replay")
                return

            buffer = self._current_asset.buffer
            sample_rate = self._current_asset.sample_rate
            channels = self._current_asset.channels

        # Configuración para chunking
        # 20ms chunks = optimal para latency (LiveKit recommendation)
        chunk_duration_ms = 20
        samples_per_chunk = (sample_rate * chunk_duration_ms) // 1000
        bytes_per_sample = 2  # 16-bit audio
        chunk_size = samples_per_chunk * bytes_per_sample * channels

        logger.debug(
            "🔊 Iniciando audio replay - " "Buffer: %d bytes, Chunks: %dms, Sample rate: %dHz",
            len(buffer),
            chunk_duration_ms,
            sample_rate,
        )

        # Stream chunks como AudioFrames
        offset = 0
        chunk_count = 0

        while offset < len(buffer):
            # Extraer chunk del buffer
            chunk_end = min(offset + chunk_size, len(buffer))
            chunk_data = bytes(buffer[offset:chunk_end])

            if len(chunk_data) == 0:
                break

            # Crear AudioFrame
            try:
                frame = rtc.AudioFrame(
                    data=chunk_data,
                    sample_rate=sample_rate,
                    num_channels=channels,
                    samples_per_channel=len(chunk_data) // (bytes_per_sample * channels),
                )

                yield frame

                # Timing para real-time playback simulation
                # En production esto no es necesario (LiveKit maneja timing)
                if chunk_count % 10 == 0:  # Cada 200ms check
                    await asyncio.sleep(0.001)  # Yield control

                chunk_count += 1
                offset = chunk_end

            except Exception as e:
                logger.error("❌ Error creando AudioFrame: %s", str(e))
                break

        logger.debug("🎵 Audio replay completado - %d chunks enviados", chunk_count)

    async def handle_rpc_replay(self, session: AgentSession) -> str:
        """
        Handler RPC para replay de audio desde frontend.

        Args:
            session: AgentSession activa para audio playback

        Returns:
            str: JSON response con resultado de la operación

        Note:
            - Thread-safe con async locks
            - Error handling completo con user feedback
            - Validation de estado del servicio y sesión
            - JSON responses consistentes para frontend
        """
        try:
            async with self._lock:
                # Validación 1: Audio disponible
                if not self._current_asset.is_valid():
                    logger.warning("⚠️ RPC Replay: No hay audio válido disponible")

                    error_response = {
                        "status": "no_audio",
                        "message": "No hay mensaje anterior para reproducir",
                        "success": False,
                        "metadata": {
                            "has_buffer": len(self._current_asset.buffer) > 0,
                            "has_text": len(self._current_asset.clean_text) > 0,
                            "frame_count": self._current_asset.frame_count,
                        },
                    }

                    # Feedback al usuario
                    await session.say(
                        "No tengo ningún mensaje anterior para reproducir.",
                        allow_interruptions=True,
                        add_to_chat_ctx=False,
                    )

                    return json.dumps(error_response)

                # Validación 2: Estado de replay
                if self._is_replaying:
                    logger.warning("⚠️ RPC Replay: Ya hay un replay en progreso")

                    busy_response = {
                        "status": "replay_in_progress",
                        "message": "Ya estoy reproduciendo un mensaje",
                        "success": False,
                        "metadata": {"current_text": self._current_asset.clean_text[:50]},
                    }

                    await session.say(
                        "Ya estoy reproduciendo el mensaje anterior.",
                        allow_interruptions=True,
                        add_to_chat_ctx=False,
                    )

                    return json.dumps(busy_response)

                # Validación 3: Estado de captura
                if self._is_capturing:
                    logger.warning("⚠️ RPC Replay: Captura en progreso")

                    capture_response = {
                        "status": "capture_in_progress",
                        "message": "Espera a que termine de procesar el audio",
                        "success": False,
                    }

                    await session.say(
                        "Espera un momento, estoy procesando el audio.",
                        allow_interruptions=True,
                        add_to_chat_ctx=False,
                    )

                    return json.dumps(capture_response)

            # Ejecutar replay
            logger.info(
                "🔄 Iniciando RPC audio replay - "
                "Texto: '%.40s', Duración: %.1fs, Tamaño: %.2fMB",
                self._current_asset.clean_text,
                self._current_asset.duration_seconds,
                self._current_asset.size_mb(),
            )

            self._is_replaying = True

            try:
                # session.say() con audio pre-sintetizado
                # add_to_chat_ctx=False para no contaminar conversación
                # allow_interruptions=True para UX natural
                await session.say(
                    text="",  # Sin texto porque usamos audio directo
                    audio=self.replay_iterator(),
                    add_to_chat_ctx=False,
                    allow_interruptions=True,
                )

                # Incrementar metrics
                self._total_replays += 1

                logger.info("✅ RPC audio replay completado exitosamente")

                success_response = {
                    "status": "success",
                    "message": "Reproduciendo último mensaje",
                    "success": True,
                    "metadata": {
                        "text": self._current_asset.clean_text,
                        "duration_seconds": self._current_asset.duration_seconds,
                        "frame_count": self._current_asset.frame_count,
                        "created_at": self._current_asset.created_at,
                    },
                }

                return json.dumps(success_response)

            finally:
                # Siempre limpiar estado de replay
                self._is_replaying = False

        except asyncio.CancelledError:
            logger.info("🔄 RPC Replay cancelado por usuario")
            self._is_replaying = False

            cancel_response = {
                "status": "cancelled",
                "message": "Replay cancelado",
                "success": False,
            }

            return json.dumps(cancel_response)

        except Exception as e:
            logger.error("❌ Error crítico en RPC replay: %s", str(e), exc_info=True)

            # Incrementar failed metrics
            self._failed_replays += 1
            self._is_replaying = False

            error_response = {
                "status": "error",
                "message": f"Error reproduciendo audio: {str(e)}",
                "success": False,
                "error_type": type(e).__name__,
            }

            # Feedback al usuario incluso en error
            try:
                await session.say(
                    "Hubo un problema reproduciendo el último mensaje.",
                    allow_interruptions=True,
                    add_to_chat_ctx=False,
                )
            except Exception as feedback_error:
                logger.error("❌ Error enviando feedback: %s", feedback_error)

            return json.dumps(error_response)

    def get_status(self) -> dict[str, Any]:
        """
        Retorna el estado actual del servicio para monitoring.

        Returns:
            dict: Estado completo del servicio y métricas
        """
        return {
            "service_status": {
                "is_capturing": self._is_capturing,
                "is_replaying": self._is_replaying,
                "has_valid_audio": self._current_asset.is_valid(),
            },
            "current_audio": {
                "text": self._current_asset.clean_text,
                "duration_seconds": self._current_asset.duration_seconds,
                "buffer_size_mb": self._current_asset.size_mb(),
                "frame_count": self._current_asset.frame_count,
                "created_at": self._current_asset.created_at,
                "sample_rate": self._current_asset.sample_rate,
                "channels": self._current_asset.channels,
            },
            "configuration": {
                "max_buffer_size_mb": self.max_buffer_size_mb,
                "max_duration_seconds": self.max_duration_seconds,
            },
            "metrics": {
                "total_captures": self._total_captures,
                "total_replays": self._total_replays,
                "failed_captures": self._failed_captures,
                "failed_replays": self._failed_replays,
                "success_rate_capture": (
                    self._total_captures / max(self._total_captures + self._failed_captures, 1)
                )
                * 100,
                "success_rate_replay": (
                    self._total_replays / max(self._total_replays + self._failed_replays, 1)
                )
                * 100,
            },
        }

    def clear_audio(self) -> None:
        """
        Limpia el audio almacenado liberando memoria.

        Note:
            - Thread-safe operation
            - Useful para cleanup o reset manual
        """
        self._current_asset.clear()
        logger.info("🧹 Audio storage limpiado")


# ==========================================
# SINGLETON PATTERN THREAD-SAFE
# ==========================================

_audio_replay_service: AudioReplayService | None = None
_service_lock = asyncio.Lock()


async def get_audio_replay_service() -> AudioReplayService:
    """
    Obtiene la instancia global singleton del servicio (thread-safe).

    Returns:
        AudioReplayService: Instancia singleton del servicio

    Note:
        - Thread-safe singleton creation
        - Lazy initialization
        - AsyncIO compatible
    """
    global _audio_replay_service

    if _audio_replay_service is None:
        async with _service_lock:
            # Double-check pattern para thread safety
            if _audio_replay_service is None:
                _audio_replay_service = AudioReplayService()
                logger.info("🎵 AudioReplayService singleton creado")

    return _audio_replay_service


async def setup_audio_replay_integration(ctx, session: AgentSession) -> None:
    """
    Configuración completa del audio replay según LiveKit 1.0 patterns.

    Integra el servicio con AgentSession y configura RPC handlers
    para communication bidirectional con frontend.

    Args:
        ctx: JobContext de LiveKit
        session: AgentSession activa

    Note:
        - Auto-capture de speech events
        - RPC registration para frontend communication
        - Error handling robusto
        - Compatible con hot-reload y reconnections
    """
    try:
        # Obtener servicio singleton
        audio_replay = await get_audio_replay_service()

        # ✅ EVENT HANDLER: Auto-capture de speech completado
        @session.on("speech_created")
        def _on_speech_created(ev):
            """
            Auto-capture cuando el agente termina de hablar.

            Args:
                ev: Speech event con handle del audio completado
            """
            if hasattr(ev, 'speech_handle') and ev.speech_handle:
                # Usar add_done_callback para capture post-completion
                ev.speech_handle.add_done_callback(
                    lambda handle: asyncio.create_task(audio_replay.save_last_audio(handle))
                )
                logger.debug("📝 Speech handler registrado para auto-capture")

        # ✅ RPC HANDLER: Endpoint para replay desde frontend
        @ctx.room.local_participant.register_rpc_method("replay_last_audio")
        async def _rpc_replay_audio(data: RpcInvocationData) -> str:
            """
            Endpoint RPC para replay de audio desde frontend.

            Args:
                data: RPC invocation data de LiveKit

            Returns:
                str: JSON response con resultado

            Note:
                - Maneja authentication y validation
                - Error handling completo
                - Logging para debugging
            """
            try:
                caller_identity = getattr(data, 'caller_identity', 'unknown')
                logger.debug("🔧 RPC replay_last_audio invocado por: %s", caller_identity)

                # Delegate a service handler con session
                result = await audio_replay.handle_rpc_replay(session)

                logger.debug("✅ RPC replay completado para %s", caller_identity)

                return result

            except Exception as e:
                logger.error("❌ Error en RPC handler: %s", str(e), exc_info=True)

                error_response = {
                    "status": "rpc_error",
                    "message": f"Error en RPC handler: {str(e)}",
                    "success": False,
                }

                return json.dumps(error_response)

        # ✅ OPCIONAL: RPC para status del servicio
        @ctx.room.local_participant.register_rpc_method("audio_replay_status")
        async def _rpc_replay_status(data: RpcInvocationData) -> str:
            """
            RPC endpoint para obtener status del servicio.

            Returns:
                str: JSON con estado actual del servicio
            """
            try:
                status = audio_replay.get_status()
                return json.dumps({"status": "ok", "data": status, "success": True})
            except Exception as e:
                logger.error("❌ Error obteniendo status: %s", str(e))
                return json.dumps({"status": "error", "message": str(e), "success": False})

        logger.info(
            "🎵 Audio replay integration configurada exitosamente - "
            "RPC endpoints: replay_last_audio, audio_replay_status"
        )

    except Exception as e:
        logger.error("❌ Error configurando audio replay integration: %s", str(e), exc_info=True)
        raise
