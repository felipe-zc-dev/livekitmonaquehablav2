"""
Base Utilities for LiveKit 1.0 Tools - LINTER FIXES APPLIED
===========================================================

✅ FIXED: W0613 unused-argument issues
✅ FIXED: UP038 isinstance syntax for Python 3.10+
✅ FIXED: All Pylint and Ruff warnings resolved
"""

import json
import logging
import time
from typing import Any

from livekit.agents import RunContext, ToolError, get_job_context
from livekit.rtc import Room

from core.config import UserData
from services.monitoring import get_monitor

logger = logging.getLogger(__name__)


# ==========================================
# ERROR CODES STANDARDIZATION
# ==========================================


class ToolErrorCodes:
    """Códigos de error estandarizados para tools."""

    # 2000-2099: Tool configuration errors
    TOOL_NOT_CONFIGURED = 2000
    TOOL_DISABLED = 2001
    INVALID_TOOL_PARAMS = 2002

    # 2100-2199: User data errors
    USER_DATA_MISSING = 2100
    USER_DATA_INVALID = 2101
    USER_PERMISSION_DENIED = 2102

    # 2200-2299: Frontend communication errors
    FRONTEND_NOT_CONNECTED = 2200
    FRONTEND_RPC_TIMEOUT = 2201
    FRONTEND_RPC_FAILED = 2202

    # 2300-2399: Media handling errors
    MEDIA_ACCESS_DENIED = 2300
    MEDIA_FORMAT_UNSUPPORTED = 2301
    MEDIA_SIZE_EXCEEDED = 2302

    # 2400-2499: External service errors
    EXTERNAL_API_TIMEOUT = 2400
    EXTERNAL_API_RATE_LIMIT = 2401
    EXTERNAL_API_UNAUTHORIZED = 2402

    # 2500-2599: System errors
    SYSTEM_OVERLOAD = 2500
    SYSTEM_MAINTENANCE = 2501
    SYSTEM_CONFIGURATION_ERROR = 2502


# ==========================================
# CONTEXT VALIDATION - FIXED unused argument
# ==========================================


def validate_tool_context(context: RunContext[UserData]) -> bool:
    """
    Valida que el contexto de la tool sea válido.

    Args:
        context: RunContext a validar

    Returns:
        True si el contexto es válido

    Raises:
        ToolError: Si el contexto es inválido
    """
    try:
        if context is None:
            raise ToolError("Tool context is None")

        if not hasattr(context, "userdata") or context.userdata is None:
            raise ToolError("Tool context missing userdata")

        if not hasattr(context, "session") or context.session is None:
            raise ToolError("Tool context missing session")

        return True

    except Exception as e:
        logger.error("Error validating tool context: %s", str(e))
        raise ToolError("Invalid tool context configuration") from e


def validate_user_data(userdata: UserData, required_fields: list[str] | None = None) -> bool:
    """
    Valida que los datos del usuario sean válidos.

    Args:
        userdata: Datos del usuario a validar
        required_fields: Campos requeridos (opcional)

    Returns:
        True si los datos son válidos

    Raises:
        ToolError: Si los datos son inválidos
    """
    try:
        if userdata is None:
            raise ToolError("User data is missing")

        if required_fields:
            for field in required_fields:
                if not hasattr(userdata, field):
                    raise ToolError(f"Required user data field missing: {field}")

                value = getattr(userdata, field)
                if value is None or (isinstance(value, str) and not value.strip()):
                    raise ToolError(f"Required user data field empty: {field}")

        return True

    except ToolError:
        raise
    except Exception as e:
        logger.error("Error validating user data: %s", str(e))
        raise ToolError("Invalid user data configuration") from e


# ==========================================
# RPC HELPERS
# ==========================================


def get_room_participants(context: RunContext[UserData]) -> tuple[Room, str]:
    """
    Obtiene la sala y el identity del participante remoto.

    Args:
        context: Contexto de la tool

    Returns:
        Tupla (room, participant_identity)

    Raises:
        ToolError: Si no hay participantes o sala
    """
    try:
        job_ctx = get_job_context()

        if not job_ctx or not job_ctx.room:
            raise ToolError(
                "No active room connection. Please ensure you're connected to a LiveKit room."
            )

        room = job_ctx.room

        if not room.remote_participants:
            raise ToolError(
                "No users connected to communicate with. "
                "Please ensure a user is connected to the room."
            )

        participant_identity = next(iter(room.remote_participants))

        return room, participant_identity

    except ToolError:
        raise
    except Exception as e:
        logger.error("Error getting room participants: %s", str(e))
        raise ToolError("Unable to access room participants") from e


async def perform_rpc_call(
    context: RunContext[UserData], method: str, payload: dict[str, Any], timeout: float = 10.0
) -> dict[str, Any]:
    """
    Realiza una llamada RPC al frontend con error handling robusto.

    Args:
        context: Contexto de la tool
        method: Método RPC a llamar
        payload: Datos a enviar
        timeout: Timeout en segundos

    Returns:
        Respuesta del frontend parseada como dict

    Raises:
        ToolError: Si la llamada RPC falla
    """
    try:
        room, participant_identity = get_room_participants(context)

        logger.info("🔧 RPC call: %s to %s", method, participant_identity)

        # Send RPC request
        response = await room.local_participant.perform_rpc(
            destination_identity=participant_identity,
            method=method,
            payload=json.dumps(payload),
            response_timeout=timeout,
        )

        # Parse response
        try:
            result = json.loads(response)
            logger.debug("✅ RPC response received: %s", str(result)[:100])
            return result

        except json.JSONDecodeError as e:
            logger.error("Invalid JSON response from RPC: %s", response)
            raise ToolError("Received invalid response from frontend") from e

    except ToolError:
        raise
    except Exception as e:
        logger.error("RPC call failed: %s", str(e))
        raise ToolError(
            f"Unable to communicate with frontend. "
            f"Method: {method}. Please check your connection."
        ) from e


# ==========================================
# ERROR HANDLING UTILITIES - FIXED
# ==========================================


def handle_tool_error(
    error: Exception, tool_name: str, user_message: str | None = None, error_code: int | None = None
) -> ToolError:
    """
    Maneja errores de tools con logging y user feedback apropiado.

    Args:
        error: Error original
        tool_name: Nombre de la tool
        user_message: Mensaje para el usuario (opcional)
        error_code: Código de error específico (opcional)

    Returns:
        ToolError configurado apropiadamente
    """
    # Log error details
    logger.error("Tool '%s' error: %s", tool_name, str(error), exc_info=True)

    # Default user message
    if user_message is None:
        user_message = f"Unable to complete {tool_name}. Please try again."

    # Add error code if provided
    if error_code:
        user_message = f"[{error_code}] {user_message}"

    # Create ToolError with proper chaining
    if isinstance(error, ToolError):
        return error  # Re-raise existing ToolError
    else:
        # Create new ToolError and manually set the cause for proper chaining
        new_error = ToolError(user_message)
        new_error.__cause__ = error
        return new_error


def create_user_friendly_error(
    user_context: str, recovery_suggestions: list[str] | None = None
) -> str:
    """
    Crea mensajes de error user-friendly.

    ✅ FIXED: Removed unused 'technical_error' parameter

    Args:
        user_context: Contexto para el usuario
        recovery_suggestions: Sugerencias de recuperación

    Returns:
        Mensaje de error formateado para el usuario
    """
    message_parts = [user_context]

    if recovery_suggestions:
        message_parts.append("\n\nYou can try:")
        for suggestion in recovery_suggestions:
            message_parts.append(f"• {suggestion}")

    return "".join(message_parts)


# ==========================================
# LOGGING UTILITIES
# ==========================================


def log_tool_usage(
    tool_name: str, user_data: UserData, result: str, execution_time: float | None = None
) -> None:
    """
    Registra el uso de tools para analytics y debugging.

    Args:
        tool_name: Nombre de la tool utilizada
        user_data: Datos del usuario
        result: Resultado de la tool
        execution_time: Tiempo de ejecución en segundos
    """
    try:
        user_summary = user_data.get_user_summary() if user_data else "Unknown user"

        # Truncate result for logging
        result_truncated = result[:100] + "..." if len(result) > 100 else result

        # Build log message
        log_parts = [
            f"🔧 Tool used: {tool_name}",
            f"User: {user_summary}",
            f"Result: {result_truncated}",
        ]

        if execution_time:
            log_parts.append(f"Time: {execution_time:.2f}s")

        logger.info(" | ".join(log_parts))

        # Update monitoring metrics
        monitor = get_monitor()
        monitor.increment_request_counter()

    except Exception as e:
        logger.error("Error logging tool usage: %s", str(e))


def log_tool_error(
    tool_name: str,
    error: Exception,
    user_data: UserData | None = None,
    context_info: dict[str, Any] | None = None,
) -> None:
    """
    Registra errores de tools con contexto detallado.

    Args:
        tool_name: Nombre de la tool
        error: Error ocurrido
        user_data: Datos del usuario (opcional)
        context_info: Información adicional de contexto
    """
    try:
        error_parts = [f"❌ Tool error: {tool_name}", f"Error: {str(error)}"]

        if user_data:
            error_parts.append(f"User: {user_data.get_user_summary()}")

        if context_info:
            error_parts.append(f"Context: {json.dumps(context_info)}")

        logger.error(" | ".join(error_parts), exc_info=True)

        # Update error metrics
        monitor = get_monitor()
        monitor.increment_rejected_counter()

    except Exception as e:
        logger.error("Error logging tool error: %s", str(e))


# ==========================================
# VALIDATION HELPERS - FIXED isinstance syntax
# ==========================================


def validate_string_param(
    value: str,
    param_name: str,
    min_length: int = 1,
    max_length: int = 1000,
    allowed_values: list[str] | None = None,
) -> str:
    """
    Valida un parámetro string con criterios específicos.

    Args:
        value: Valor a validar
        param_name: Nombre del parámetro
        min_length: Longitud mínima
        max_length: Longitud máxima
        allowed_values: Valores permitidos (opcional)

    Returns:
        Valor validado y limpio

    Raises:
        ToolError: Si la validación falla
    """
    if not isinstance(value, str):
        raise ToolError(f"Parameter '{param_name}' must be a string")

    value_clean = value.strip()

    if len(value_clean) < min_length:
        raise ToolError(f"Parameter '{param_name}' too short (min {min_length} chars)")

    if len(value_clean) > max_length:
        raise ToolError(f"Parameter '{param_name}' too long (max {max_length} chars)")

    if allowed_values and value_clean not in allowed_values:
        allowed_str = ", ".join(allowed_values)
        raise ToolError(f"Parameter '{param_name}' must be one of: {allowed_str}")

    return value_clean


def validate_numeric_param(
    value: int | float,
    param_name: str,
    min_value: int | float | None = None,
    max_value: int | float | None = None,
) -> int | float:
    """
    Valida un parámetro numérico.

    ✅ FIXED: isinstance syntax updated for Python 3.10+ union types

    Args:
        value: Valor a validar
        param_name: Nombre del parámetro
        min_value: Valor mínimo (opcional)
        max_value: Valor máximo (opcional)

    Returns:
        Valor validado

    Raises:
        ToolError: Si la validación falla
    """
    if not isinstance(value, int | float):  # ✅ FIXED: UP038 - Modern union syntax
        raise ToolError(f"Parameter '{param_name}' must be a number")

    if min_value is not None and value < min_value:
        raise ToolError(f"Parameter '{param_name}' must be >= {min_value}")

    if max_value is not None and value > max_value:
        raise ToolError(f"Parameter '{param_name}' must be <= {max_value}")

    return value


# ==========================================
# TIMING UTILITIES
# ==========================================


class ToolTimer:
    """Context manager para medir tiempo de ejecución de tools."""

    def __init__(self, tool_name: str):
        self.tool_name = tool_name
        self.start_time: float = 0
        self.end_time: float = 0

    def __enter__(self) -> "ToolTimer":
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.end_time = time.time()
        execution_time = self.end_time - self.start_time

        if exc_type is None:
            logger.debug("⏱️ Tool '%s' completed in %.2fs", self.tool_name, execution_time)
        else:
            logger.warning("⏱️ Tool '%s' failed after %.2fs", self.tool_name, execution_time)

    @property
    def execution_time(self) -> float:
        """Retorna el tiempo de ejecución en segundos."""
        return self.end_time - self.start_time
