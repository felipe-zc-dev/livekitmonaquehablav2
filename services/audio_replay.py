"""
AudioReplayService - CORREGIDO según LiveKit 1.0
Elimina problemas de typing, imports incorrectos y arquitectura defectuosa.
"""

import json
import logging
from collections import deque
from collections.abc import AsyncIterator

from livekit import rtc
from livekit.agents import AgentSession
from livekit.agents.llm.chat_context import AudioContent
from livekit.rtc import RpcInvocationData

logger = logging.getLogger(__name__)


class AudioReplayService:
    """
    Servicio para replay de audio TTS - CORREGIDO LiveKit 1.0

    FIXES APLICADOS:
    ✅ Imports correctos de RTC
    ✅ Type hints precisos
    ✅ Sin argumentos posicionales en handle_rpc_replay
    ✅ session.say() con tipos correctos
    ✅ Eliminada referencia manual a session
    ✅ JSON responses consistent
    """

    def __init__(self, max_duration_seconds: int = 30) -> None:
        self.max_frames = 48000 * max_duration_seconds
        self.last_frames: deque[rtc.AudioFrame] = deque(maxlen=self.max_frames)
        self.last_text_content: str | None = None
        self._is_currently_speaking = False
        logger.info("🎵 AudioReplayService inicializado (%ds max)", max_duration_seconds)

    async def save_last_audio(self, handle) -> None:
        """Captura frames Y texto del último speech completado."""
        if not handle.chat_message:
            return

        # ✅ CAPTURAR TEXTO LIMPIO
        text_items = [c for c in handle.chat_message.content if hasattr(c, 'text')]
        if text_items:
            raw_text = text_items[0].text.strip()
            # Limpiar timestamps como "3:57 p. m."
            import re

            clean_text = re.sub(r'\s*\d{1,2}:\d{2}\s*[ap]\.?\s*m\.?\s*$', '', raw_text)
            self.last_text_content = clean_text.strip()

        # ✅ CAPTURAR AUDIO FRAMES
        audio_items = [c for c in handle.chat_message.content if isinstance(c, AudioContent)]
        if audio_items:
            frames = audio_items[0].frame
            self.last_frames.clear()
            self.last_frames.extend(frames)

            logger.debug(
                "✅ Audio y texto capturados: %d frames, texto: '%.40s'",
                len(frames),
                self.last_text_content or "N/A",
            )

    async def replay_iterator(self) -> AsyncIterator[rtc.AudioFrame]:
        """Iterator limpio para session.say() - patrón oficial LiveKit"""
        for frame in self.last_frames:
            yield frame

    async def handle_rpc_replay(self, session: AgentSession) -> str:
        """
        Handler RPC corregido para LiveKit 1.0.

        ✅ FIXES APLICADOS:
        - Recibe session como parámetro (no self._session)
        - session.say() con tipo str explícito
        - JSON responses válido
        - Error handling completo

        Args:
            session: AgentSession actual (pasada por RPC handler)

        Returns:
            str: JSON válido con resultado
        """
        try:
            # ✅ VALIDACIÓN 1: Audio disponible
            if not self.last_frames or not self.last_text_content:
                logger.warning("⚠️ RPC Replay: No hay audio disponible")

                error_response = {
                    "status": "no_audio",
                    "message": "No hay mensaje anterior para reproducir",
                    "success": False,
                }

                # ✅ FEEDBACK CON TIPO CORRECTO
                await session.say(str(error_response["message"]))
                return json.dumps(error_response)

            # ✅ VALIDACIÓN 2: Estado de speaking
            if self._is_currently_speaking:
                logger.warning("⚠️ RPC Replay: Agente ocupado hablando")

                busy_response = {
                    "status": "agent_busy",
                    "message": "Espera a que termine de hablar para reproducir",
                    "success": False,
                }

                # ✅ FEEDBACK CON TIPO CORRECTO
                await session.say(str(busy_response["message"]))
                return json.dumps(busy_response)

            # ✅ EJECUTAR REPLAY
            logger.info("🔄 Iniciando replay de audio: '%.40s'", self.last_text_content)

            self._is_currently_speaking = True
            try:
                # ✅ USAR session.say() con audio pre-sintetizado
                await session.say(
                    text="",  # Texto vacío porque usamos audio directo
                    audio=self.replay_iterator(),
                    add_to_chat_ctx=False,  # No contaminar contexto del chat
                    allow_interruptions=True,  # Usuario puede interrumpir
                )

                logger.info("✅ Replay completado exitosamente")

                success_response = {
                    "status": "success",
                    "message": "Reproduciendo último mensaje",
                    "text": self.last_text_content,
                    "success": True,
                }

                return json.dumps(success_response)

            finally:
                # ✅ SIEMPRE limpiar estado
                self._is_currently_speaking = False

        except Exception as e:
            logger.error("❌ Error crítico en RPC replay: %s", str(e), exc_info=True)

            error_response = {
                "status": "error",
                "message": f"Error reproduciendo audio: {str(e)}",
                "success": False,
            }

            # ✅ FEEDBACK AL USUARIO incluso en error CON TIPO CORRECTO
            try:
                await session.say("Hubo un problema reproduciendo el último mensaje")
            except Exception as feedback_error:
                logger.error("❌ Error dando feedback: %s", feedback_error)

            # ✅ LIMPIAR estado en caso de error
            self._is_currently_speaking = False

            return json.dumps(error_response)


# ==========================================
# SINGLETON PATTERN ROBUSTO
# ==========================================

_audio_replay_service: AudioReplayService | None = None


def get_audio_replay_service() -> AudioReplayService:
    """Obtiene la instancia global singleton del servicio."""
    global _audio_replay_service
    if _audio_replay_service is None:
        _audio_replay_service = AudioReplayService()
        logger.info("🎵 AudioReplayService singleton creado")
    return _audio_replay_service


async def setup_audio_replay_integration(ctx, session: AgentSession) -> None:
    """
    Configuración correcta del audio replay según LiveKit 1.0.

    Args:
        ctx: JobContext de LiveKit
        session: AgentSession activa
    """
    # ✅ OBTENER SERVICIO SINGLETON
    audio_replay = get_audio_replay_service()

    # ✅ EVENT HANDLER: Capturar cada speech completado
    @session.on("speech_created")
    def _on_speech_created(ev):
        """Captura automática de audio cuando el agente termina de hablar"""
        import asyncio

        ev.speech_handle.add_done_callback(
            lambda h: asyncio.create_task(audio_replay.save_last_audio(h))
        )
        logger.debug("📝 Speech handler registrado para captura automática")

    # ✅ RPC HANDLER CORREGIDO
    @ctx.room.local_participant.register_rpc_method("replay_last_audio")
    async def _rpc_replay_audio(data: RpcInvocationData) -> str:
        """
        Endpoint RPC corregido para replay de audio.

        ✅ FIXES:
        - Pasa session al handler (no usa self._session)
        - Imports correctos
        - Type safety

        Args:
            data: Datos RPC de LiveKit

        Returns:
            str: JSON response válido
        """
        logger.debug("🔧 RPC replay_last_audio invocado por %s", data.caller_identity)
        # ✅ PASAR SESSION AL HANDLER
        return await audio_replay.handle_rpc_replay(session)

    logger.info("🎵 Audio replay integration configurada - CORREGIDA")
