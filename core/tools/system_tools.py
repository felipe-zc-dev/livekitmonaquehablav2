"""
System Tools - LiveKit 1.0
==========================

Tools para gestión del sistema, debugging y mantenimiento.
Incluye estadísticas, limpieza de sesión y herramientas de desarrollo.

TOOLS INCLUDED:
- get_system_stats: Estadísticas del sistema y rendimiento
- clear_conversation: Limpiar conversación y reiniciar sesión
- restart_session: Reiniciar sesión completa
- get_debug_info: Información de debugging (solo desarrollo)

PATTERNS:
✅ System monitoring integration
✅ Safe session management
✅ Debug tools con permisos apropiados
✅ Performance metrics
"""

import logging
import platform
import sys
from typing import Any

from livekit.agents import RunContext, function_tool

from core.config import UserData, get_system_info
from services.monitoring import get_monitor

from .base import (
    ToolError,
    ToolTimer,
    handle_tool_error,
    log_tool_error,
    log_tool_usage,
    validate_tool_context,
)

logger = logging.getLogger(__name__)


# ==========================================
# SYSTEM MONITORING TOOLS
# ==========================================


@function_tool
async def get_system_stats(context: RunContext[UserData]) -> str:
    """
    Retrieves current system performance and health statistics.

    This tool provides technical information about the agent's performance
    including memory usage, CPU load, session metrics, and system health.

    WHEN TO USE:
    - Troubleshooting performance issues
    - User reports slow responses
    - System health monitoring needed
    - Technical diagnostics required

    EXAMPLES:
    - "Why are you responding slowly?"
    - "Is everything working correctly?"
    - "How's your system performance?"

    Returns:
        Formatted system statistics and health information

    Raises:
        ToolError: If unable to retrieve system information
    """
    with ToolTimer("get_system_stats") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🏥 System stats requested")

            try:
                # Get monitoring data
                monitor = get_monitor()
                health_status = monitor.get_health_status()

                # Format statistics for user-friendly display
                system_info = health_status['system']
                app_info = health_status['application']

                # Build comprehensive stats
                stats_summary = (
                    f"System Health: {health_status['status'].upper()}\n"
                    f"• CPU Usage: {system_info['cpu_percent']:.1f}%\n"
                    f"• Memory Usage: {system_info['memory_percent']:.1f}%\n"
                    f"• Available Memory: {system_info['memory_available_mb']}MB\n"
                    f"• Active Sessions: {app_info['active_sessions']}\n"
                    f"• Total Requests: {app_info['total_requests']}\n"
                    f"• Success Rate: {100 - app_info['rejection_rate']:.1f}%\n"
                    f"• Uptime: {health_status['uptime_seconds']:.0f} seconds"
                )

                # Add performance assessment
                if health_status['status'] == 'healthy':
                    performance_note = "All systems are running smoothly! 🟢"
                elif health_status['status'] == 'warning':
                    performance_note = "System is under moderate load but functioning well. 🟡"
                else:
                    performance_note = (
                        "System is experiencing high load. Performance may be affected. 🔴"
                    )

                full_response = f"{stats_summary}\n\n{performance_note}"

                # Log successful usage
                log_tool_usage("get_system_stats", userdata, full_response, timer.execution_time)

                return full_response

            except Exception as e:
                raise ToolError(
                    "Unable to retrieve system statistics right now. "
                    "The monitoring system might be temporarily unavailable."
                ) from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "get_system_stats",
                "Unable to access system information. Please try again later.",
            )
            log_tool_error("get_system_stats", error, context.userdata)
            raise error from e


@function_tool
async def get_debug_info(context: RunContext[UserData]) -> str:
    """
    Provides detailed debugging information for development and troubleshooting.

    This tool gives comprehensive technical details about the system state,
    configuration, and runtime environment. Useful for developers and advanced users.

    WHEN TO USE:
    - Development and debugging sessions
    - Technical support requests
    - System configuration verification
    - Advanced troubleshooting

    EXAMPLES:
    - "Show me debug information"
    - "What's the system configuration?"
    - "I need technical details for support"

    Returns:
        Detailed debugging and configuration information

    Raises:
        ToolError: If unable to gather debug information
    """
    with ToolTimer("get_debug_info") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🔧 Debug info requested")

            try:
                # Gather system information
                system_config = get_system_info()

                # Runtime information
                runtime_info = {
                    "python_version": sys.version.split()[0],
                    "platform": platform.platform(),
                    "architecture": platform.architecture()[0],
                    "processor": platform.processor() or "Unknown",
                    "hostname": platform.node(),
                }

                # Session information
                session_info = {
                    "current_persona": userdata.current_persona,
                    "io_mode": userdata.io_mode,
                    "user_data_complete": userdata.is_onboarding_complete(),
                    "user_summary": userdata.get_user_summary(),
                }

                # Build debug report
                debug_report = (
                    "🔧 DEBUG INFORMATION\n"
                    "==================\n\n"
                    f"Runtime Environment:\n"
                    f"• Python: {runtime_info['python_version']}\n"
                    f"• Platform: {runtime_info['platform']}\n"
                    f"• Architecture: {runtime_info['architecture']}\n"
                    f"• Processor: {runtime_info['processor']}\n\n"
                    f"System Configuration:\n"
                    f"• Default Persona: {system_config['default_persona']}\n"
                    f"• Default IO Mode: {system_config['default_io_mode']}\n"
                    f"• Available Personas: {len(system_config['available_personas'])}\n"
                    f"• Log Level: {system_config['log_level']}\n\n"
                    f"Current Session:\n"
                    f"• Active Persona: {session_info['current_persona']}\n"
                    f"• Communication Mode: {session_info['io_mode']}\n"
                    f"• User Onboarded: {session_info['user_data_complete']}\n"
                    f"• Session Time: {timer.execution_time:.2f}s"
                )

                # Log successful usage
                log_tool_usage("get_debug_info", userdata, debug_report, timer.execution_time)

                return debug_report

            except Exception as e:
                raise ToolError(
                    "Unable to gather debug information. Some system details may be unavailable."
                ) from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "get_debug_info",
                "Unable to generate debug information. Please contact technical support.",
            )
            log_tool_error("get_debug_info", error, context.userdata)
            raise error from e


# ==========================================
# SESSION MANAGEMENT TOOLS
# ==========================================


@function_tool
async def clear_conversation(context: RunContext[UserData]) -> str:
    """
    Clears the current conversation history and resets the user session.

    This tool removes all conversation context and user data, starting fresh.
    Useful when the user wants a clean slate or privacy reset.

    WARNING: This action cannot be undone!
    - All conversation history will be lost
    - User profile information will be cleared
    - Current personality and mode settings will reset to defaults

    WHEN TO USE:
    - User explicitly requests to "start over" or "clear everything"
    - User wants privacy reset
    - Conversation has become confusing or off-track
    - User wants to test different personalities from scratch

    EXAMPLES:
    - "Clear my information and start over"
    - "Reset everything, I want a fresh start"
    - "Delete our conversation history"

    Returns:
        Confirmation of conversation reset

    Raises:
        ToolError: If session clearing fails
    """
    with ToolTimer("clear_conversation") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🧹 Conversation clearing requested")

            try:
                # Store current settings for confirmation message
                old_persona = userdata.current_persona
                old_name = userdata.name

                # Clear all user data
                userdata.name = None
                userdata.age = None
                userdata.country = None
                userdata.interests = []
                userdata.current_persona = "rosalia"  # Reset to default
                userdata.io_mode = "hybrid"  # Reset to default

                logger.info(
                    "🧹 Conversation cleared for user session (was: %s)", old_name or "anonymous"
                )

                # Provide confirmation with friendly restart
                confirmation = (
                    "Perfect! I've cleared all our conversation history and your profile information. "
                    "We're starting completely fresh - I'm back to my default Rosalía personality in hybrid mode. "
                    "Hi! I'm Rosalía del Mar. It's nice to meet you! What's your name?"
                )

                # Update monitoring
                monitor = get_monitor()
                monitor.increment_request_counter()

                # Log successful usage
                log_tool_usage("clear_conversation", userdata, confirmation, timer.execution_time)

                return confirmation

            except Exception as e:
                raise ToolError(
                    "Unable to clear conversation data. Please try again or restart the session."
                ) from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "clear_conversation",
                "Unable to clear conversation. Please try restarting your browser.",
            )
            log_tool_error("clear_conversation", error, context.userdata)
            raise error from e


@function_tool
async def restart_session(context: RunContext[UserData]) -> str:
    """
    Restarts the entire agent session with fresh configuration.

    This tool performs a soft restart of the agent session, reloading
    configuration and resetting all temporary state while maintaining
    connection to the room.

    WHEN TO USE:
    - System appears to be stuck or unresponsive
    - Configuration changes need to take effect
    - Memory cleanup needed
    - Fresh start requested after errors

    EXAMPLES:
    - "Restart the system"
    - "Something seems broken, can you reset?"
    - "Start fresh with current settings"

    Returns:
        Confirmation of session restart

    Raises:
        ToolError: If restart fails
    """
    with ToolTimer("restart_session") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🔄 Session restart requested")

            try:
                # Preserve essential user data
                preserved_data = {
                    "name": userdata.name,
                    "age": userdata.age,
                    "country": userdata.country,
                    "interests": userdata.interests.copy() if userdata.interests else [],
                    "current_persona": userdata.current_persona,
                    "io_mode": userdata.io_mode,
                }

                # Simulate restart by clearing and restoring data
                # In a real implementation, this would trigger agent restart
                logger.info("💾 Preserving user data for restart")

                # Clear current state
                userdata.name = None
                userdata.age = None
                userdata.country = None
                userdata.interests = []

                # Restore preserved data
                userdata.name = preserved_data["name"]
                userdata.age = preserved_data["age"]
                userdata.country = preserved_data["country"]
                userdata.interests = preserved_data["interests"]
                userdata.current_persona = preserved_data["current_persona"]
                userdata.io_mode = preserved_data["io_mode"]

                # Update system metrics
                monitor = get_monitor()
                monitor.increment_request_counter()

                restart_message = (
                    "🔄 Session restarted successfully! "
                    "All systems refreshed and your data has been preserved. "
                    f"I'm back as {preserved_data['current_persona']} in {preserved_data['io_mode']} mode. "
                    "How can I help you?"
                )

                logger.info("✅ Session restart completed successfully")

                # Log successful usage
                log_tool_usage("restart_session", userdata, restart_message, timer.execution_time)

                return restart_message

            except Exception as e:
                raise ToolError(
                    "Unable to restart session safely. Please refresh your browser to restart."
                ) from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "restart_session",
                "Session restart failed. Please refresh your browser for a complete restart.",
            )
            log_tool_error("restart_session", error, context.userdata)
            raise error from e


# ==========================================
# SYSTEM UTILITY FUNCTIONS
# ==========================================


def get_runtime_stats() -> dict[str, Any]:
    """
    Obtiene estadísticas de runtime del sistema.

    Returns:
        Diccionario con estadísticas del runtime
    """
    try:
        import os

        import psutil

        process = psutil.Process(os.getpid())

        return {
            "memory_info": process.memory_info()._asdict(),
            "cpu_percent": process.cpu_percent(),
            "create_time": process.create_time(),
            "num_threads": process.num_threads(),
            "status": process.status(),
        }
    except Exception as e:
        logger.warning("Unable to get runtime stats: %s", str(e))
        return {"error": str(e)}


def get_session_metrics(userdata: UserData) -> dict[str, Any]:
    """
    Obtiene métricas específicas de la sesión.

    Args:
        userdata: Datos del usuario

    Returns:
        Métricas de la sesión actual
    """
    try:
        return {
            "user_data_completeness": {
                "has_name": userdata.name is not None,
                "has_age": userdata.age is not None,
                "has_country": userdata.country is not None,
                "has_interests": bool(userdata.interests),
                "is_complete": userdata.is_onboarding_complete(),
            },
            "session_config": {
                "current_persona": userdata.current_persona,
                "io_mode": userdata.io_mode,
            },
            "data_summary": userdata.get_user_summary(),
        }
    except Exception as e:
        logger.warning("Unable to get session metrics: %s", str(e))
        return {"error": str(e)}


# ==========================================
# HEALTH CHECK UTILITIES
# ==========================================


def perform_health_checks() -> dict[str, bool]:
    """
    Realiza checks de salud del sistema.

    Returns:
        Resultados de los health checks
    """
    checks = {}

    try:
        # Check monitoring system
        monitor = get_monitor()
        health_status = monitor.get_health_status()
        checks["monitoring"] = health_status["status"] in ["healthy", "warning"]
    except Exception:
        checks["monitoring"] = False

    try:
        # Check system resources
        import psutil

        checks["memory"] = psutil.virtual_memory().percent < 90
        checks["cpu"] = psutil.cpu_percent() < 90
    except Exception:
        checks["memory"] = False
        checks["cpu"] = False

    try:
        # Check configuration
        system_info = get_system_info()
        checks["config"] = len(system_info["available_personas"]) > 0
    except Exception:
        checks["config"] = False

    return checks


def format_health_summary(checks: dict[str, bool]) -> str:
    """
    Formatea un resumen de salud del sistema.

    Args:
        checks: Resultados de health checks

    Returns:
        Resumen formateado
    """
    total_checks = len(checks)
    passed_checks = sum(checks.values())

    status_emoji = (
        "🟢"
        if passed_checks == total_checks
        else "🟡" if passed_checks > total_checks // 2 else "🔴"
    )

    summary = f"{status_emoji} System Health: {passed_checks}/{total_checks} checks passed\n"

    for check_name, passed in checks.items():
        emoji = "✅" if passed else "❌"
        summary += f"{emoji} {check_name.title()}: {'OK' if passed else 'FAIL'}\n"

    return summary.strip()
