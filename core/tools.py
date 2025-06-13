"""
Herramientas específicas para agentes conversacionales.
CORREGIDO: Type hints para MyPy strict mode.
"""

import json
import logging
from typing import Any

from livekit.agents import RunContext, function_tool, get_job_context

from services.monitoring import get_monitor

from .config import UserData, load_persona_config

logger = logging.getLogger(__name__)


@function_tool
async def change_persona(context: RunContext[UserData], persona_id: str) -> str:
    """
    Cambia la personalidad del agente.

    Esta función requiere validación compleja y decisión del LLM,
    por eso se mantiene como function_tool.

    Args:
        context: Contexto de ejecución con UserData
        persona_id: ID de la nueva personalidad (sofia, psicologo, coach, etc.)

    Returns:
        Confirmación del cambio de personalidad
    """
    userdata: UserData = context.userdata

    try:
        # Validar que existe la configuración
        persona_config = load_persona_config(persona_id.lower().strip())

        # Actualizar userdata
        userdata.current_persona = persona_id.lower().strip()

        # Obtener mensaje de cambio
        persona_name = persona_config.get("name", persona_id)
        switch_message = persona_config.get(
            "switch_message", f"Hola, ahora soy {persona_name}. ¿Cómo puedo ayudarte?"
        )

        logger.info("🎭 Personalidad cambiada a: %s", persona_name)

        await context.session.say(switch_message)

        return f"Personalidad cambiada a {persona_name}"

    except FileNotFoundError:
        error_msg = (
            "No reconozco esa personalidad. Puedes elegir entre: sofia, psicologo, profesor, coach."
        )
        await context.session.say(error_msg)
        return f"Error: Personalidad '{persona_id}' no encontrada"


@function_tool
async def change_mode(context: RunContext[UserData], mode: str) -> str:
    """
    Cambia el modo de interacción del agente.

    Args:
        context: Contexto de ejecución con UserData
        mode: Nuevo modo ("text", "voice", "hybrid")

    Returns:
        Confirmación del cambio de modo
    """
    userdata: UserData = context.userdata

    mode_clean = mode.lower().strip()

    if mode_clean in ["text", "voice", "hybrid"]:
        userdata.io_mode = mode_clean
        logger.info("🔄 Modo cambiado a: %s", mode_clean)
        return f"Perfecto! He cambiado el modo de interacción a: {mode_clean}"
    else:
        return f"Modo '{mode}' no válido. Los modos disponibles son: text, voice, hybrid."


@function_tool
async def get_user_summary(context: RunContext[UserData]) -> str:
    """
    Obtiene un resumen de la información del usuario.

    Args:
        context: Contexto de ejecución con UserData

    Returns:
        Resumen de la información recopilada del usuario
    """
    userdata: UserData = context.userdata

    # Obtener resumen del usuario
    summary: str = userdata.get_user_summary()
    logger.info("📋 Resumen solicitado: %s", summary)

    # Incrementar contador de monitoreo
    monitor = get_monitor()
    monitor.increment_request_counter()

    return summary


@function_tool
async def update_frontend_ui(
    context: RunContext[UserData], ui_state: str, data: Any | None = None
) -> str:
    """
    Actualiza la UI del frontend mediante RPC.

    Args:
        context: Contexto de ejecución con UserData
        ui_state: Estado de la UI a actualizar
        data: Datos adicionales para la actualización (opcional)

    Returns:
        Confirmación de la actualización
    """
    try:
        job_ctx = get_job_context()

        if not job_ctx or not job_ctx.room:
            return "Error: No hay conexión con el frontend"

        # Preparar payload
        payload = {
            "state": ui_state,
            "data": data or {},
            "timestamp": context.userdata.get_user_summary(),
        }

        # Enviar RPC al frontend
        await job_ctx.room.local_participant.perform_rpc(
            destination_identity="frontend-user", method="update_ui", payload=json.dumps(payload)
        )

        logger.info("🔄 UI del frontend actualizada: %s", ui_state)
        return f"UI actualizada: {ui_state}"

    except Exception as e:
        logger.error("❌ Error actualizando frontend UI: %s", str(e))
        return f"Error actualizando UI: {str(e)}"


@function_tool
async def get_system_stats(context: RunContext[UserData]) -> str:
    """
    Obtiene estadísticas del sistema para debugging.

    Args:
        context: Contexto de ejecución con UserData

    Returns:
        Estadísticas formateadas del sistema
    """
    try:
        monitor = get_monitor()
        health_status = monitor.get_health_status()

        # Formatear estadísticas para el LLM
        stats = (
            f"Sistema: {health_status['status']}\n"
            f"CPU: {health_status['system']['cpu_percent']:.1f}%\n"
            f"Memoria: {health_status['system']['memory_percent']:.1f}%\n"
            f"Sesiones activas: {health_status['application']['active_sessions']}\n"
            f"Requests totales: {health_status['application']['total_requests']}"
        )

        logger.info("🏥 Stats del sistema solicitadas")
        return f"Estadísticas del sistema:\n{stats}"

    except Exception as e:
        logger.error("❌ Error obteniendo stats del sistema: %s", str(e))
        return f"Error obteniendo estadísticas: {str(e)}"


# ✅ Función auxiliar para validar herramientas
def validate_tool_context(context: RunContext[UserData]) -> bool:
    """
    Valida que el contexto de la herramienta sea válido.

    Args:
        context: Contexto de ejecución

    Returns:
        True si el contexto es válido
    """
    try:
        return (
            context is not None
            and hasattr(context, "userdata")
            and context.userdata is not None
            and hasattr(context, "session")
            and context.session is not None
        )
    except Exception as e:
        logger.error("❌ Error validando contexto de herramienta: %s", str(e))
        return False


# ✅ Función auxiliar para logging de herramientas
def log_tool_usage(tool_name: str, user_data: UserData, result: str) -> None:
    """
    Registra el uso de herramientas para análisis.

    Args:
        tool_name: Nombre de la herramienta utilizada
        user_data: Datos del usuario
        result: Resultado de la herramienta
    """
    try:
        user_summary = user_data.get_user_summary() if user_data else "Usuario desconocido"
        logger.info(
            "🔧 Tool usado: %s | Usuario: %s | Resultado: %s",
            tool_name,
            user_summary,
            result[:100] + "..." if len(result) > 100 else result,
        )

        # Incrementar contador de uso de herramientas
        monitor = get_monitor()
        monitor.increment_request_counter()

    except Exception as e:
        logger.error("❌ Error registrando uso de herramienta: %s", str(e))
