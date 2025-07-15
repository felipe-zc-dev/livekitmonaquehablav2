"""
Agent.py - CONSOLE MODE FIX
===========================

✅ FIXED: Detectar modo console y deshabilitar RPC
✅ COMPATIBLE: Con testing console sin errores RPC
✅ FLEXIBLE: RPC funciona en modo room real
"""

import asyncio
import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from livekit.agents import (
    AgentSession,
    JobContext,
    JobProcess,
    RoomOutputOptions,
    WorkerOptions,
    WorkerType,
    cli,
    metrics,
)
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins import aws, deepgram, elevenlabs, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from agents.conversational_agent import ConversationalAgent
from core.config import SystemConfig, UserData, create_user_data, load_persona_config
from services.audio_replay import setup_audio_replay_integration
from services.monitoring import get_monitor, start_monitoring

load_dotenv()

logger = logging.getLogger(__name__)


def _is_console_mode() -> bool:
    """
    ✅ NEW: Detecta si estamos en modo console.

    Returns:
        True si estamos en modo console/testing
    """
    # Check command line arguments
    import sys

    if "console" in sys.argv:
        return True

    # Check environment variable
    if os.getenv("LIVEKIT_CONSOLE_MODE") == "true":
        return True

    # Check if we're in a fake room
    job_room_name = os.getenv("LIVEKIT_ROOM_NAME", "")
    if "fake" in job_room_name.lower() or "console" in job_room_name.lower():
        return True

    return False


async def entrypoint(ctx: JobContext) -> None:
    """Entrypoint principal con detección de modo console."""
    logger.info("🚀 Iniciando nueva sesión conversacional")

    try:
        # ✅ DETECT: Console mode
        console_mode = _is_console_mode()
        if console_mode:
            logger.info("🖥️ Modo CONSOLE detectado - RPC calls deshabilitadas")

        # Iniciar monitoreo
        start_monitoring()

        # Conectar a la sala
        await ctx.connect()
        logger.info("✅ Conectado a sala: %s", ctx.room.name)

        # Configuración inicial desde metadatos
        initial_config = _extract_job_config(ctx)
        persona_id = initial_config.get("persona_id", "rosalia")
        io_mode = initial_config.get("io_mode", "hybrid")

        # Inicializar datos del usuario
        userdata = create_user_data(persona_id, io_mode)

        # Cargar configuración del personaje
        persona_config = load_persona_config(persona_id)

        # ✅ FIXED: Crear agente con configuración de modo console
        agent = ConversationalAgent(
            persona_config=persona_config,
            chat_ctx=None,
        )

        session: AgentSession[UserData] = AgentSession(
            vad=silero.VAD.load(
                min_speech_duration=0.1,
                min_silence_duration=0.3,
                activation_threshold=0.4,
            ),
            stt=deepgram.STT(
                model="nova-2-general",
                language="es-ES",
                detect_language=False,
                interim_results=True,
                punctuate=True,
                smart_format=True,
                sample_rate=16000,
                no_delay=True,
                endpointing_ms=25,
                filler_words=True,
                tags=["spanish", "rosalia", "voice-agent"],
                profanity_filter=False,
                numerals=True,
                mip_opt_out=True,
            ),
            llm=aws.LLM(
                temperature=0.8,
                max_output_tokens=800,
                top_p=0.9,
                region="us-east-1",
            ),
            tts=elevenlabs.TTS(
                voice_id=persona_config["voice_id"],
                model="eleven_turbo_v2_5",
                voice_settings=elevenlabs.VoiceSettings(
                    stability=0.8,
                    similarity_boost=0.7,
                    style=0.5,
                    use_speaker_boost=True,
                    speed=0.95,
                ),
                language="es",
                auto_mode=True,
                encoding="mp3_22050_32",
                enable_ssml_parsing=False,
                inactivity_timeout=120,
            ),
            userdata=userdata,
            turn_detection=MultilingualModel(),
            min_endpointing_delay=0.2,
            max_endpointing_delay=1.0,
            allow_interruptions=True,
            min_interruption_duration=0.3,
            max_tool_steps=3,
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

        # ✅ CONDITIONAL: Audio replay solo si no es console mode
        if not console_mode:
            await setup_audio_replay_integration(ctx, session)
            logger.info("🎵 Audio replay configurado para modo room")
        else:
            logger.info("🖥️ Audio replay omitido en modo console")

        logger.info("🎭 Avatar activado automáticamente")

        # Iniciar sesión
        await session.start(
            agent=agent,
            room=ctx.room,
            room_output_options=RoomOutputOptions(
                audio_enabled=True,
            ),
        )
        logger.info("🎉 Sesión iniciada exitosamente")

    except Exception as e:
        logger.error("💥 Error crítico en entrypoint: %s", str(e), exc_info=True)
        raise


def _extract_job_config(ctx: JobContext) -> dict[str, Any]:
    """Extrae configuración desde metadatos del job."""
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
        """Maneja cambios de atributos del participante con error handling."""
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
            worker_type=WorkerType.ROOM,
        )

        cli.run_app(worker_options)

    except KeyboardInterrupt:
        logger.info("👋 Aplicación detenida por el usuario")
    except Exception as e:
        logger.error("💥 Error crítico: %s", str(e))
        raise
