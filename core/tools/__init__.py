"""
LiveKit 1.0 Tools Module - Centralized Exports CORREGIDO
========================================================

Exports centralizados para todas las tools del sistema.
✅ FIXED: Import error handling para mockups
✅ FIXED: Incluye get_server_time() para RPC testing
✅ FIXED: Dynamic persona tools más flexible
✅ FIXED: Sincronizado con correcciones aplicadas

ESTRUCTURA:
- base: Utilidades comunes, ToolError, validaciones
- persona_tools: Gestión de personalidades y modos
- user_data_tools: Gestión de datos del usuario
- frontend_rpc_tools: Comunicación bidirectional con frontend (UPDATED)
- media_tools: Manejo de media (fotos, audio, uploads) (UPDATED)
- system_tools: Herramientas del sistema y debugging
- external_tools: APIs externas y RAG (mockups seguros)

USAGE:
```python
from core.tools import (
    # Persona management
    change_persona, change_mode,
    # User data
    get_user_summary, update_user_profile,
    # Frontend RPC (UPDATED)
    get_user_location, update_ui_state, get_server_time,
    # System
    get_system_stats, clear_conversation
)
```
"""

import logging
from typing import Any

from .base import ToolError, log_tool_usage, validate_tool_context
from .persona_tools import change_mode, change_persona
from .system_tools import clear_conversation, get_debug_info, get_system_stats, restart_session
from .user_data_tools import clear_user_data, get_user_summary, update_user_profile

logger = logging.getLogger(__name__)

# ==========================================
# BASE UTILITIES - ALWAYS AVAILABLE
# ==========================================

# ==========================================
# CORE TOOLS - ALWAYS FUNCTIONAL
# ==========================================
# Persona management tools

# System tools

# User data management tools

# ==========================================
# FRONTEND RPC TOOLS - FUNCTIONAL + TESTING
# ==========================================
try:
    from .frontend_rpc_tools import (  # Browser APIs; ✅ NEW: RPC Testing; UI Control
        get_browser_info,  # Simple RPC test tool
        get_server_time,
        get_user_location,
        request_permissions,
        show_notification,
        toggle_fullscreen,
        update_ui_state,
    )

    FRONTEND_RPC_AVAILABLE = True
    logger.debug("✅ Frontend RPC tools loaded successfully")

except ImportError as e:
    logger.warning("⚠️ Frontend RPC tools not available: %s", str(e))
    FRONTEND_RPC_AVAILABLE = False

# ==========================================
# MEDIA TOOLS - FUNCTIONAL + MOCKUPS
# ==========================================
try:
    from .media_tools import (
        capture_photo,
        download_data,
        process_image,
        record_audio,
        transcribe_audio,
        upload_file,
    )

    MEDIA_TOOLS_AVAILABLE = True
    logger.debug("✅ Media tools loaded successfully")

except ImportError as e:
    logger.warning("⚠️ Media tools not available: %s", str(e))
    MEDIA_TOOLS_AVAILABLE = False

# ==========================================
# EXTERNAL TOOLS - SAFE MOCKUPS
# ==========================================
try:
    from .external_tools import (
        get_weather,
        load_mcp_tools,
        query_documents,
        search_knowledge_base,
        search_web,
    )

    EXTERNAL_TOOLS_AVAILABLE = True
    logger.debug("✅ External tools (mockups) loaded successfully")

except ImportError as e:
    logger.warning("⚠️ External tools not available: %s", str(e))
    EXTERNAL_TOOLS_AVAILABLE = False

# ==========================================
# TOOL COLLECTIONS BY FUNCTIONALITY
# ==========================================

# Core tools - Always available, always functional
CORE_TOOLS = [
    change_persona,
    change_mode,
    get_user_summary,
    get_system_stats,
]

# RPC tools - For agent ↔ frontend communication
RPC_TOOLS = []
if FRONTEND_RPC_AVAILABLE:
    RPC_TOOLS = [
        get_server_time,  # ✅ NEW: Simple RPC testing
        get_user_location,
        update_ui_state,
        request_permissions,
        get_browser_info,
        show_notification,
        toggle_fullscreen,
    ]

# Media tools - For media handling
MEDIA_HANDLING_TOOLS = []
if MEDIA_TOOLS_AVAILABLE:
    MEDIA_HANDLING_TOOLS = [
        upload_file,
        capture_photo,
        record_audio,
        download_data,
        # Mockups (ready for implementation)
        process_image,
        transcribe_audio,
    ]

# User management tools
USER_MANAGEMENT_TOOLS = [
    get_user_summary,
    update_user_profile,
    clear_user_data,
]

# System administration tools
SYSTEM_ADMIN_TOOLS = [
    get_system_stats,
    clear_conversation,
    restart_session,
    get_debug_info,
]

# External integration tools (mockups)
EXTERNAL_INTEGRATION_TOOLS = []
if EXTERNAL_TOOLS_AVAILABLE:
    EXTERNAL_INTEGRATION_TOOLS = [
        search_knowledge_base,
        query_documents,
        get_weather,
        search_web,
        load_mcp_tools,
    ]

# ==========================================
# PERSONA-SPECIFIC TOOL CONFIGURATIONS
# ==========================================


def get_tools_for_persona(
    persona_id: str, include_debug: bool = False, include_rpc: bool = True
) -> list[Any]:
    """
    ✅ IMPROVED: Obtiene tools específicas para una personalidad de forma dinámica.

    Args:
        persona_id: ID de la personalidad
        include_debug: Si incluir tools de debugging
        include_rpc: Si incluir tools RPC (default True)

    Returns:
        Lista de tools configuradas para esa personalidad
    """
    tools = CORE_TOOLS.copy()

    # Add user management tools (always useful)
    tools.extend(USER_MANAGEMENT_TOOLS)

    # Add RPC tools if available and requested
    if include_rpc and FRONTEND_RPC_AVAILABLE:
        if persona_id in ["rosalia", "sofia"]:
            # Interactive personas need more RPC tools
            tools.extend(
                [
                    get_server_time,
                    get_user_location,
                    update_ui_state,
                    capture_photo,
                    show_notification,
                ]
            )
        else:
            # Other personas get basic RPC tools
            tools.extend(
                [
                    get_server_time,  # Always include for testing
                    update_ui_state,
                ]
            )

    # Add persona-specific specializations
    if persona_id == "profesor" and EXTERNAL_TOOLS_AVAILABLE:
        # Teacher needs research tools
        tools.extend(
            [
                search_knowledge_base,
                query_documents,
                upload_file,
            ]
        )

    elif persona_id == "coach" and MEDIA_TOOLS_AVAILABLE:
        # Coach needs user interaction tools
        tools.extend(
            [
                upload_file,
                download_data,
            ]
        )

    elif persona_id == "psicologo":
        # Psychologist needs user data tools
        tools.extend(
            [
                show_notification,
                clear_user_data,
            ]
        )

    # Add debug tools if requested
    if include_debug:
        tools.extend(SYSTEM_ADMIN_TOOLS)

    # Remove duplicates while preserving order
    seen = set()
    unique_tools = []
    for tool in tools:
        if tool not in seen:
            seen.add(tool)
            unique_tools.append(tool)

    return unique_tools


def get_rpc_testing_tools() -> list[Any]:
    """
    ✅ NEW: Obtiene tools específicas para testing RPC.

    Returns:
        Lista minimal de tools para testing RPC connectivity
    """
    if not FRONTEND_RPC_AVAILABLE:
        return CORE_TOOLS

    return [
        get_server_time,  # Primary RPC test
        update_ui_state,  # Secondary RPC test
        get_browser_info,  # Information exchange test
    ]


def get_all_functional_tools() -> list[Any]:
    """
    ✅ IMPROVED: Obtiene solo las tools funcionales (no mockups).

    Returns:
        Lista de tools que están completamente implementadas
    """
    functional_tools = []
    functional_tools.extend(CORE_TOOLS)
    functional_tools.extend(USER_MANAGEMENT_TOOLS)
    functional_tools.extend(SYSTEM_ADMIN_TOOLS)

    # Add RPC tools if available
    if FRONTEND_RPC_AVAILABLE:
        functional_tools.extend(
            [
                get_server_time,
                get_user_location,
                update_ui_state,
                request_permissions,
                get_browser_info,
                show_notification,
                toggle_fullscreen,
            ]
        )

    # Add functional media tools (not mockups)
    if MEDIA_TOOLS_AVAILABLE:
        functional_tools.extend(
            [
                upload_file,
                download_data,
                capture_photo,
                record_audio,
            ]
        )

    return functional_tools


def get_all_available_tools() -> list[Any]:
    """
    Obtiene todas las tools disponibles (incluye mockups).

    Returns:
        Lista completa de tools del sistema
    """
    all_tools = get_all_functional_tools()

    # Add mockup tools if available
    if MEDIA_TOOLS_AVAILABLE:
        all_tools.extend(
            [
                process_image,
                transcribe_audio,
            ]
        )

    if EXTERNAL_TOOLS_AVAILABLE:
        all_tools.extend(EXTERNAL_INTEGRATION_TOOLS)

    return all_tools


# ==========================================
# VALIDATION AND DIAGNOSTICS
# ==========================================


def _get_tool_name(tool: Any) -> str:
    """
    ✅ HELPER: Extrae el nombre de una tool de LiveKit de forma segura.

    Args:
        tool: FunctionTool object o función

    Returns:
        Nombre de la tool como string
    """
    try:
        # LiveKit 1.0 FunctionTool objects
        if hasattr(tool, 'name'):
            return tool.name
        elif hasattr(tool, '__name__'):
            return tool.__name__
        elif hasattr(tool, 'func') and hasattr(tool.func, '__name__'):
            return tool.func.__name__
        else:
            return str(tool)
    except Exception:
        return f"unknown_tool_{id(tool)}"


def validate_tools_configuration() -> dict[str, Any]:
    """
    ✅ IMPROVED: Valida que todas las tools estén correctamente configuradas.

    Returns:
        Diccionario con status de validación detallado
    """
    validation_results: dict[str, Any] = {
        "timestamp": __import__("time").time(),
        "overall_status": "unknown",
    }

    try:
        # Core validation
        validation_results["core_tools"] = {
            "available": len(CORE_TOOLS) > 0,
            "count": len(CORE_TOOLS),
            "tools": [_get_tool_name(tool) for tool in CORE_TOOLS],
        }

        # Module availability
        validation_results["modules"] = {
            "frontend_rpc": FRONTEND_RPC_AVAILABLE,
            "media_tools": MEDIA_TOOLS_AVAILABLE,
            "external_tools": EXTERNAL_TOOLS_AVAILABLE,
        }

        # Tool counts by category
        validation_results["tool_counts"] = {
            "core": len(CORE_TOOLS),
            "rpc": len(RPC_TOOLS),
            "media": len(MEDIA_HANDLING_TOOLS),
            "user_management": len(USER_MANAGEMENT_TOOLS),
            "system_admin": len(SYSTEM_ADMIN_TOOLS),
            "external": len(EXTERNAL_INTEGRATION_TOOLS),
        }

        # Test tool availability
        rpc_test_tools = get_rpc_testing_tools()
        validation_results["rpc_testing"] = {
            "available": len(rpc_test_tools) > 0,
            "tools": [_get_tool_name(tool) for tool in rpc_test_tools],
        }

        # Overall status
        functional_count = len(get_all_functional_tools())
        total_count = len(get_all_available_tools())

        if functional_count >= 10:  # Minimum viable tools
            validation_results["overall_status"] = "healthy"
        elif functional_count >= 5:
            validation_results["overall_status"] = "minimal"
        else:
            validation_results["overall_status"] = "insufficient"

        validation_results["summary"] = {
            "functional_tools": functional_count,
            "total_tools": total_count,
            "functionality_ratio": functional_count / max(total_count, 1),
        }

        return validation_results

    except Exception as e:
        validation_results["error"] = str(e)
        validation_results["overall_status"] = "error"
        logger.error("❌ Tools validation failed: %s", str(e))
        return validation_results


def get_tools_diagnostic() -> str:
    """
    ✅ NEW: Genera un diagnóstico legible del estado de las tools.

    Returns:
        String con diagnóstico formateado
    """
    validation = validate_tools_configuration()

    diagnostic = ["🔧 TOOLS DIAGNOSTIC REPORT"]
    diagnostic.append("=" * 40)

    # Overall status
    status = validation.get("overall_status", "unknown")
    status_emoji = {"healthy": "✅", "minimal": "⚠️", "insufficient": "❌", "error": "💥"}
    diagnostic.append(f"Overall Status: {status_emoji.get(status, '❓')} {status.upper()}")

    # Module availability
    modules = validation.get("modules", {})
    diagnostic.append("\nModule Availability:")
    for module, available in modules.items():
        emoji = "✅" if available else "❌"
        diagnostic.append(f"  {emoji} {module}: {'Available' if available else 'Not Available'}")

    # Tool counts
    counts = validation.get("tool_counts", {})
    diagnostic.append("\nTool Counts by Category:")
    for category, count in counts.items():
        diagnostic.append(f"  • {category}: {count} tools")

    # Summary
    summary = validation.get("summary", {})
    diagnostic.append("\nSummary:")
    diagnostic.append(f"  • Functional Tools: {summary.get('functional_tools', 0)}")
    diagnostic.append(f"  • Total Tools: {summary.get('total_tools', 0)}")
    diagnostic.append(f"  • Functionality Ratio: {summary.get('functionality_ratio', 0):.2%}")

    # RPC Testing
    rpc_test = validation.get("rpc_testing", {})
    if rpc_test.get("available"):
        diagnostic.append(
            f"\n✅ RPC Testing Ready: {len(rpc_test.get('tools', []))} tools available"
        )
    else:
        diagnostic.append("\n❌ RPC Testing Not Available")

    return "\n".join(diagnostic)


# ==========================================
# MODULE METADATA
# ==========================================

__version__ = "1.0.1"
__author__ = "LiveKit 1.0 Implementation - CORRECTED"
__description__ = "Modular tools system for LiveKit Agents with safe imports and RPC testing"

# ==========================================
# EXPLICIT EXPORTS - SAFE IMPORTS
# ==========================================

# Always available exports
__all__ = [
    # Base utilities
    "ToolError",
    "validate_tool_context",
    "log_tool_usage",
    # Core tools
    "change_persona",
    "change_mode",
    "get_user_summary",
    "update_user_profile",
    "clear_user_data",
    "get_system_stats",
    "clear_conversation",
    "restart_session",
    "get_debug_info",
    # Dynamic loading functions
    "get_tools_for_persona",
    "get_rpc_testing_tools",
    "get_all_functional_tools",
    "get_all_available_tools",
    "validate_tools_configuration",
    "get_tools_diagnostic",
]

# Conditionally add exports based on availability
if FRONTEND_RPC_AVAILABLE:
    __all__.extend(
        [
            "get_server_time",  # ✅ NEW
            "get_user_location",
            "update_ui_state",
            "request_permissions",
            "get_browser_info",
            "show_notification",
            "toggle_fullscreen",
        ]
    )

if MEDIA_TOOLS_AVAILABLE:
    __all__.extend(
        [
            "upload_file",
            "capture_photo",
            "record_audio",
            "process_image",
            "transcribe_audio",
            "download_data",
        ]
    )

if EXTERNAL_TOOLS_AVAILABLE:
    __all__.extend(
        [
            "search_knowledge_base",
            "query_documents",
            "get_weather",
            "search_web",
            "load_mcp_tools",
        ]
    )

# ==========================================
# INITIALIZATION LOG
# ==========================================

logger.info(
    "🔧 Tools module initialized - Status: %s",
    validate_tools_configuration().get("overall_status", "unknown"),
)
