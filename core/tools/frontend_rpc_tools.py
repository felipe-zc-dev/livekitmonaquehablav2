"""
Frontend RPC Tools - LiveKit 1.0 CORREGIDO
==========================================

Tools para comunicación bidireccional con el frontend usando RPC patterns.
✅ FIXED: create_user_friendly_error calls con named arguments
✅ FIXED: Error handling simplificado
✅ FIXED: Import optimization
"""

import logging
import time
from typing import Any

from livekit.agents import RunContext, function_tool

from core.config import UserData

from .base import (
    ToolError,
    ToolErrorCodes,
    ToolTimer,
    handle_tool_error,
    log_tool_error,
    log_tool_usage,
    perform_rpc_call,
    validate_string_param,
    validate_tool_context,
)

logger = logging.getLogger(__name__)


# ==========================================
# BROWSER API TOOLS - CORREGIDOS
# ==========================================


@function_tool
async def get_user_location(
    context: RunContext[UserData], high_accuracy: bool = False
) -> dict[str, Any]:
    """
    Requests the user's current geographic location from their browser.

    This tool uses the browser's geolocation API to get precise location data.
    Useful for location-based services, weather, local recommendations, etc.

    PRIVACY NOTE:
    - Always requires explicit user permission
    - Location data is not stored permanently
    - User can deny permission at any time

    WHEN TO USE:
    - User asks for local weather
    - User wants nearby recommendations
    - Location-specific information needed
    - User explicitly shares their location

    Args:
        high_accuracy: Whether to use high accuracy mode (slower but more precise)

    Returns:
        Dictionary containing latitude, longitude, and accuracy information

    Raises:
        ToolError: If location access is denied or unavailable
    """
    with ToolTimer("get_user_location") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🌍 Requesting location from user (high_accuracy=%s)", high_accuracy)

            payload = {
                "highAccuracy": high_accuracy,
                "timeout": 15000 if high_accuracy else 8000,
                "maximumAge": 60000,
            }

            response = await perform_rpc_call(
                context, "getUserLocation", payload, timeout=20.0 if high_accuracy else 12.0
            )

            if not response.get("success"):
                error_msg = response.get("error", "Location access denied")
                raise ToolError(f"Unable to get location: {error_msg}")

            location_data = response.get("location", {})

            if not location_data.get("latitude") or not location_data.get("longitude"):
                raise ToolError("Invalid location data received from browser")

            logger.info(
                "📍 Location received: lat=%.4f, lng=%.4f, accuracy=%.0fm",
                location_data.get('latitude', 0),
                location_data.get('longitude', 0),
                location_data.get('accuracy', 0),
            )

            result = {
                "latitude": location_data.get('latitude'),
                "longitude": location_data.get('longitude'),
                "accuracy": location_data.get('accuracy'),
                "timestamp": time.time(),
                "high_accuracy": high_accuracy,
            }

            log_tool_usage("get_user_location", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            # ✅ FIXED: Simplified error handling
            error = handle_tool_error(
                e,
                "get_user_location",
                "Unable to access your location. Please check location permissions and try again.",
                ToolErrorCodes.MEDIA_ACCESS_DENIED,
            )
            log_tool_error("get_user_location", error, context.userdata)
            raise error from e


@function_tool
async def get_browser_info(context: RunContext[UserData]) -> dict[str, Any]:
    """
    Gets information about the user's browser and device capabilities.

    This tool collects browser information for compatibility and feature detection.
    Useful for adapting the experience to the user's capabilities.

    Returns:
        Dictionary with browser and device information

    Raises:
        ToolError: If unable to get browser information
    """
    with ToolTimer("get_browser_info") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🌐 Requesting browser info from user")

            response = await perform_rpc_call(context, "getBrowserInfo", {}, timeout=5.0)

            if not response.get("success"):
                raise ToolError("Unable to get browser information")

            browser_info = response.get("info", {})

            result = {
                "user_agent": browser_info.get("userAgent", "Unknown"),
                "language": browser_info.get("language", "Unknown"),
                "platform": browser_info.get("platform", "Unknown"),
                "viewport": browser_info.get("viewport", {}),
                "capabilities": browser_info.get("capabilities", {}),
                "timestamp": time.time(),
            }

            logger.info("🌐 Browser info: %s on %s", result["user_agent"][:50], result["platform"])

            log_tool_usage("get_browser_info", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "get_browser_info", "Unable to get browser information. Please try again."
            )
            log_tool_error("get_browser_info", error, context.userdata)
            raise error from e


@function_tool
async def request_permissions(context: RunContext[UserData], permission_type: str) -> str:
    """
    Requests specific permissions from the user's browser for enhanced functionality.

    SUPPORTED PERMISSIONS:
    - microphone: Audio input for voice chat
    - camera: Video input for visual interactions
    - location: Geographic location for location-based services
    - notifications: Browser notifications for important updates

    Args:
        permission_type: Type of permission to request

    Returns:
        Status of the permission request

    Raises:
        ToolError: If permission type is invalid or request fails
    """
    with ToolTimer("request_permissions") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            permission_clean = validate_string_param(
                permission_type,
                "permission_type",
                allowed_values=["microphone", "camera", "location", "notifications"],
            )

            logger.info("🔐 Requesting %s permission from user", permission_clean)

            payload = {
                "type": permission_clean,
                "reason": f"Enable {permission_clean} access for enhanced features",
            }

            response = await perform_rpc_call(context, "requestPermission", payload, timeout=30.0)

            if response.get("granted"):
                logger.info("✅ %s permission granted", permission_clean)
                result = f"Great! {permission_clean.title()} permission granted."
            else:
                logger.info("❌ %s permission denied", permission_clean)
                result = f"{permission_clean.title()} permission was denied."

            log_tool_usage("request_permissions", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "request_permissions", f"Unable to request {permission_type} permission."
            )
            log_tool_error("request_permissions", error, context.userdata)
            raise error from e


# ==========================================
# UI CONTROL TOOLS - CORREGIDOS
# ==========================================


@function_tool
async def update_ui_state(
    context: RunContext[UserData], ui_state: str, data: dict[str, Any] | None = None
) -> str:
    """
    Updates the frontend user interface to reflect current conversation state.

    SUPPORTED UI STATES:
    - greeting: Show welcome screen
    - listening: Agent ready for input
    - thinking: Processing state
    - speaking: Agent responding
    - error: Error state

    Args:
        ui_state: The UI state to set
        data: Optional additional data

    Returns:
        Confirmation of UI update

    Raises:
        ToolError: If unable to communicate with frontend
    """
    with ToolTimer("update_ui_state") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            valid_states = ["greeting", "listening", "thinking", "speaking", "error", "goodbye"]
            ui_state_clean = validate_string_param(
                ui_state, "ui_state", allowed_values=valid_states
            )

            logger.info("🔄 UI state update: %s", ui_state_clean)

            payload = {
                "state": ui_state_clean,
                "data": data or {},
                "timestamp": time.time(),
                "user_summary": userdata.get_user_summary(),
                "current_persona": userdata.current_persona,
                "io_mode": userdata.io_mode,
            }

            response = await perform_rpc_call(context, "update_ui_state", payload, timeout=5.0)

            if not response.get("success"):
                raise ToolError("Frontend rejected UI state update")

            result = f"Frontend UI updated to show {ui_state_clean} state"
            log_tool_usage("update_ui_state", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(e, "update_ui_state", "Unable to update the user interface.")
            log_tool_error("update_ui_state", error, context.userdata)
            raise error from e


@function_tool
async def show_notification(
    context: RunContext[UserData], title: str, message: str, type_notification: str = "info"
) -> str:
    """
    Shows a browser notification to the user.

    Args:
        title: Notification title
        message: Notification message
        type_notification: Type (info, success, warning, error)

    Returns:
        Confirmation that notification was shown

    Raises:
        ToolError: If notification fails
    """
    with ToolTimer("show_notification") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            title_clean = validate_string_param(title, "title", max_length=100)
            message_clean = validate_string_param(message, "message", max_length=300)
            type_clean = validate_string_param(
                type_notification,
                "type_notification",
                allowed_values=["info", "success", "warning", "error"],
            )

            logger.info("📢 Showing notification: %s - %s", title_clean, type_clean)

            payload = {
                "title": title_clean,
                "message": message_clean,
                "type": type_clean,
                "timestamp": time.time(),
            }

            response = await perform_rpc_call(context, "showNotification", payload, timeout=5.0)

            if not response.get("success"):
                error_msg = response.get("error", "Notification permission denied")
                raise ToolError(f"Unable to show notification: {error_msg}")

            result = f"Notification '{title_clean}' shown successfully"
            log_tool_usage("show_notification", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(e, "show_notification", "Unable to show notification.")
            log_tool_error("show_notification", error, context.userdata)
            raise error from e


@function_tool
async def toggle_fullscreen(context: RunContext[UserData]) -> str:
    """
    Toggles fullscreen mode in the browser.

    Returns:
        Status of fullscreen toggle

    Raises:
        ToolError: If fullscreen toggle fails
    """
    with ToolTimer("toggle_fullscreen") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("🖥️ Toggling fullscreen mode")

            response = await perform_rpc_call(context, "toggleFullscreen", {}, timeout=5.0)

            if not response.get("success"):
                raise ToolError("Unable to toggle fullscreen mode")

            is_fullscreen = response.get("isFullscreen", False)
            result = "Entered fullscreen mode." if is_fullscreen else "Exited fullscreen mode."

            log_tool_usage("toggle_fullscreen", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(e, "toggle_fullscreen", "Unable to toggle fullscreen mode.")
            log_tool_error("toggle_fullscreen", error, context.userdata)
            raise error from e


# ==========================================
# SIMPLE RPC TEST TOOL - NUEVO
# ==========================================


@function_tool
async def get_server_time(context: RunContext[UserData]) -> str:
    """
    ✅ SIMPLE RPC TEST - Gets current server time for testing RPC functionality.

    This is a simple tool to test bidirectional RPC communication.
    Perfect for validating that agent ↔ frontend communication works.

    WHEN TO USE:
    - Testing RPC connectivity
    - Debugging communication issues
    - User asks "what time is it?"

    Returns:
        Current server time formatted as string

    Raises:
        ToolError: If RPC communication fails
    """
    with ToolTimer("get_server_time") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("⏰ Getting server time for RPC test")

            # Send simple RPC to frontend
            payload = {
                "request": "server_time",
                "timestamp": time.time(),
            }

            response = await perform_rpc_call(context, "getServerTime", payload, timeout=5.0)

            server_time = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

            if response.get("success"):
                result = f"Server time: {server_time} (RPC test successful)"
            else:
                result = f"Server time: {server_time} (RPC test failed - using local time)"

            logger.info("⏰ Server time response: %s", result)
            log_tool_usage("get_server_time", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            # Simple fallback for testing
            server_time = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            result = f"Server time: {server_time} (RPC failed, using local fallback)"

            logger.warning("⏰ RPC test failed, using fallback: %s", str(e))
            log_tool_usage("get_server_time", userdata, result, timer.execution_time)
            return result


# ==========================================
# DATA EXCHANGE TOOLS (MOCKUPS) - SIN CAMBIOS
# ==========================================


@function_tool
async def upload_file(context: RunContext[UserData], file_type: str = "any") -> dict[str, Any]:
    """MOCKUP TOOL - Structure ready for implementation."""
    validate_tool_context(context)
    userdata = context.userdata

    validate_string_param(
        file_type, "file_type", allowed_values=["image", "document", "audio", "any"]
    )

    mockup_result = {
        "filename": "example.jpg",
        "size": 1024000,
        "type": "image/jpeg",
        "url": "blob:mockup-url",
        "success": True,
    }

    log_tool_usage("upload_file", userdata, str(mockup_result))
    return mockup_result


@function_tool
async def download_data(
    context: RunContext[UserData], data: str, filename: str, content_type: str = "text/plain"
) -> str:
    """MOCKUP TOOL - Structure ready for implementation."""
    validate_tool_context(context)
    userdata = context.userdata

    validate_string_param(data, "data", min_length=1)
    validate_string_param(filename, "filename", min_length=1, max_length=255)

    result = f"Download triggered: {filename} ({len(data)} bytes)"
    log_tool_usage("download_data", userdata, result)
    return result
