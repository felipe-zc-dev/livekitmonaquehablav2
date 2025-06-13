"""
Entrypoint principal del agente conversacional.
Estructura modular compatible con LiveKit 1.0.
"""

import asyncio
import json
import logging
from typing import Any

from dotenv import load_dotenv
from livekit.agents import AgentSession, JobContext, JobProcess, WorkerOptions, cli, metrics
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins import aws, deepgram, elevenlabs, silero

from agents.conversational_agent import ConversationalMasterAgent

# Imports absolutos - Compatible con LiveKit 1.0
from core.config import SystemConfig, UserData, create_user_data, load_persona_config
from services.monitoring import get_monitor, start_monitoring

load_dotenv()

logger = logging.getLogger(__name__)


async def entrypoint(ctx: JobContext) -> None:
    """Entrypoint principal simplificado pero modular."""
    logger.info("🚀 Iniciando nueva sesión conversacional")

    try:
        # Iniciar monitoreo
        start_monitoring()

        # Conectar a la sala
        await ctx.connect()
        logger.info("✅ Conectado a sala: %s", ctx.room.name)

        # Configuración inicial desde metadatos
        # Extraer configuración desde metadatos del job
        initial_config = _extract_job_config(ctx)
        persona_id = initial_config.get("persona_id", "rosalia")
        io_mode = initial_config.get("io_mode", "hybrid")

        # Inicializar datos del usuario
        userdata = create_user_data(persona_id, io_mode)

        # Cargar configuración del personaje

        persona_config = load_persona_config(persona_id)

        # Crear agente conversacional
        agent = ConversationalMasterAgent(persona_id, persona_config)

        # Configurar sesión optimizada
        session: AgentSession[UserData] = AgentSession(
            # VAD optimizado
            vad=silero.VAD.load(
                min_speech_duration=0.08,
                min_silence_duration=0.6,
                prefix_padding_duration=0.2,
                max_buffered_speech=10.0,
                activation_threshold=0.4,
                sample_rate=16000,
            ),
            # STT optimizado
            stt=deepgram.STT(
                # Tus parámetros actuales
                model="nova-2-general",
                language="es-ES",
                interim_results=True,
                smart_format=True,
                punctuate=True,
                endpointing_ms=200,
                no_delay=True,
                sample_rate=16000,
                # Parámetros adicionales:
                filler_words=True,  #
                profanity_filter=False,
                energy_filter=True,
                # Boost de vocabulario específico (p. ej. nombres, términos de dominio):
                keywords=[("LiveKit", 1.5), ("Rosalía", 2.0)],
                # o para Nova-3 usa keyterms en lugar de keywords:
                # keyterms=["inteligencia artificial", "transcripción"],
                numerals=True,
                detect_language=False,
                mip_opt_out=True,
                tags=["spanish", "voicebot"],
            ),
            # LLM optimizado
            llm=aws.LLM(
                model="anthropic.claude-3-haiku-20240307-v1:0",
                temperature=0.9,
                max_output_tokens=300,
                top_p=0.9,
                region="us-east-1",
            ),
            # TTS optimizado
            tts=elevenlabs.TTS(
                # tu voz y modelo
                voice_id=persona_config["voice_id"],
                model="eleven_multilingual_v2",
                # 1. Personalización de la voz
                voice_settings=elevenlabs.VoiceSettings(
                    stability=0.8,
                    similarity_boost=0.7,
                    style=0.5,  #
                    use_speaker_boost=True,
                    speed=0.95,
                ),
                # 2. Idioma y codificación
                encoding="mp3_44100_192",  # mp3_22050_32
                # 3. Streaming y chunks
                streaming_latency=2,
                chunk_length_schedule=[
                    100,
                    200,
                    300,
                    400,
                ],  # chunks más grandes reducen overhead :contentReference[oaicite:8]{index=8}
                # 4. SSML y pronunciación
                enable_ssml_parsing=True,
                # 5. Timeout y gestión de conexiones
                # inactivity_timeout=120,  # cierra la conexión tras 2 min de inactividad
            ),
            userdata=userdata,
            # Configuraciones de sesión
            turn_detection="vad",
            allow_interruptions=True,
            discard_audio_if_uninterruptible=True,
            min_interruption_duration=0.3,
            min_endpointing_delay=0.2,
            max_endpointing_delay=1.5,
            max_tool_steps=2,
        )

        # Configurar métricas
        monitor = get_monitor()
        usage_collector = metrics.UsageCollector()

        @session.on("metrics_collected")
        def _on_metrics_collected(ev: MetricsCollectedEvent) -> None:
            monitor.on_metrics_collected(ev)
            usage_collector.collect(ev.metrics)

        # Configurar listeners dinámicos
        _setup_dynamic_listeners(ctx, userdata)

        # Iniciar sesión
        await session.start(agent=agent, room=ctx.room)
        logger.info("🎉 Sesión iniciada exitosamente")

    except Exception as e:
        logger.error("💥 Error crítico en entrypoint: %s", str(e), exc_info=True)
        raise


def _extract_job_config(ctx: JobContext) -> dict[str, Any]:
    """
    Extrae configuración desde metadatos del job.

    Args:
        ctx: Contexto del job

    Returns:
        Diccionario con configuración extraída

    Raises:
        json.JSONDecodeError: Si los metadatos no son JSON válido
    """
    config: dict[str, Any] = {}
    try:
        if hasattr(ctx.job, "metadata") and ctx.job.metadata:
            config = json.loads(ctx.job.metadata)
            logger.debug("📋 Metadatos parseados: %s", config)
    except (json.JSONDecodeError, AttributeError) as e:
        logger.warning("⚠️ Error parseando metadatos, usando defaults: %s", str(e))

    return config


def _setup_dynamic_listeners(ctx: JobContext, userdata: UserData) -> None:
    """Configura listeners para cambios dinámicos."""

    @ctx.room.on("participant_attributes_changed")
    def on_attributes_changed(changed_attributes: dict[str, str], participant: Any) -> None:
        """
        Maneja cambios de atributos del participante con error handling.

        Args:
            changed_attributes: Atributos que cambiaron
            participant: Participante que cambió los atributos
        """
        try:
            logger.debug(
                "🔄 Atributos cambiados por %s: %s", participant.identity, changed_attributes
            )

            # Cambio de personalidad
            if "persona_id" in changed_attributes:
                new_persona = changed_attributes["persona_id"]
                asyncio.create_task(_handle_persona_change_safe(userdata, new_persona))

            # Cambio de modo
            if "io_mode" in changed_attributes:
                new_mode = changed_attributes["io_mode"]
                if new_mode in ["text", "voice", "hybrid"]:
                    userdata.io_mode = new_mode
                    logger.info("🔄 Modo cambiado a: %s", new_mode)

        except Exception as e:
            logger.error("❌ Error en listener de atributos: %s", str(e))


async def _handle_persona_change_safe(userdata: UserData, new_persona: str) -> None:
    """Maneja cambio de personalidad con error handling."""
    try:
        load_persona_config(new_persona)
        userdata.current_persona = new_persona
        logger.info("🎭 Personalidad cambiada a: %s", new_persona)
    except FileNotFoundError:
        logger.error("❌ Personalidad no encontrada: %s", new_persona)
    except Exception as e:
        logger.error("❌ Error cambiando personalidad: %s", str(e))


def prewarm(proc: JobProcess) -> None:
    """Función de precalentamiento."""
    logger.info("🔥 Iniciando precalentamiento")

    try:
        # Precargar VAD
        proc.userdata["vad"] = silero.VAD.load(
            min_speech_duration=0.05,
            min_silence_duration=0.4,
            activation_threshold=0.3,
            sample_rate=16000,
        )
        logger.info("🎉 Precalentamiento completado")
    except Exception as e:
        logger.error("💥 Error en precalentamiento: %s", str(e))


if __name__ == "__main__":
    # Configurar sistema
    SystemConfig.setup_logging()
    logger.info("🚀 Iniciando MonaQueHabla v1.0")

    try:
        worker_options = WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="monaquehabla",
            load_threshold=0.75,
            job_memory_warn_mb=400,
            job_memory_limit_mb=800,
            num_idle_processes=1,
            shutdown_process_timeout=30.0,
            initialize_process_timeout=15.0,
            max_retry=3,
            port=8081,
        )

        cli.run_app(worker_options)

    except KeyboardInterrupt:
        logger.info("👋 Aplicación detenida por el usuario")
    except Exception as e:
        logger.error("💥 Error crítico: %s", str(e))
        raise
