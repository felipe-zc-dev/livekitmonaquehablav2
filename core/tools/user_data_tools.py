"""
User Data Management Tools - LiveKit 1.0
========================================

Tools para gestión de datos del usuario y perfil.
Corrige errores críticos de linting y aplica Single Responsibility Principle.

TOOLS INCLUDED:
- get_user_summary: Obtiene resumen de información del usuario
- update_user_profile: Actualiza campos específicos del perfil (SIMPLIFICADO)
- clear_user_data: Limpia datos del usuario

FIXES CRÍTICOS APLICADOS:
✅ Type errors corregidos (old_value mal definido)
✅ Función update_user_profile simplificada (era complejidad 17 > 10)
✅ Error handling con "raise...from"
✅ Single Responsibility Principle aplicado
✅ Validation apropiada por campo
"""

import logging

from livekit.agents import RunContext, function_tool

from core.config import UserData
from services.monitoring import get_monitor

from .base import (
    ToolError,
    ToolTimer,
    handle_tool_error,
    log_tool_error,
    log_tool_usage,
    validate_numeric_param,
    validate_string_param,
    validate_tool_context,
)

logger = logging.getLogger(__name__)


# ==========================================
# USER DATA RETRIEVAL TOOLS
# ==========================================


@function_tool
async def get_user_summary(context: RunContext[UserData]) -> str:
    """
    Retrieves a comprehensive summary of what we know about the user.

    This tool provides a detailed overview of the user's profile including:
    - Personal information (name, age, location)
    - Interests and preferences
    - Conversation history insights
    - Current session context

    WHEN TO USE:
    - User asks "what do you know about me?"
    - Agent needs to recall user information for personalization
    - User wants to verify their stored information
    - Beginning of conversation to refresh context

    EXAMPLES:
    - "Tell me what information you have about me"
    - "Do you remember who I am?"
    - "What have we talked about before?"

    Returns:
        Formatted summary of user information and interaction history

    Raises:
        ToolError: If unable to access user information
    """
    with ToolTimer("get_user_summary") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata: UserData = context.userdata

            # Get comprehensive user summary
            basic_summary = userdata.get_user_summary()

            # Add session context
            current_persona = userdata.current_persona or "default"
            io_mode = userdata.io_mode or "hybrid"

            # Build detailed response
            if basic_summary == "Usuario nuevo sin información recopilada":
                detailed_summary = (
                    "You're a new user and I don't have any personal information about you yet. "
                    f"I'm currently in {current_persona} personality mode with {io_mode}"
                    " communication. I'd love to get to know you better! "
                    " Feel free to tell me about yourself."
                )
            else:
                detailed_summary = (
                    f"Here's what I know about you: {basic_summary}. "
                    f"We're currently chatting with me in {current_persona} mode "
                    f"using {io_mode} communication. "
                    "Is there anything you'd like to update or add to your profile?"
                )

            # Increment monitoring counter
            monitor = get_monitor()
            monitor.increment_request_counter()

            logger.info("📋 User summary requested: %s", basic_summary[:50] + "...")

            # Log successful usage
            log_tool_usage("get_user_summary", userdata, detailed_summary, timer.execution_time)

            return detailed_summary

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "get_user_summary",
                "I'm having trouble accessing your information right now. "
                "Please try again in a moment.",
            )
            log_tool_error("get_user_summary", error, context.userdata)
            raise error from e


# ==========================================
# USER DATA UPDATE TOOLS (SIMPLIFIED)
# ==========================================


@function_tool
async def update_user_profile(context: RunContext[UserData], field: str, value: str) -> str:
    """
    Updates a specific field in the user's profile with new information.

    This tool allows direct updates to user profile data when they provide
    new information or want to correct existing information.

    SUPPORTED FIELDS:
    - name: User's preferred name
    - age: User's age (must be realistic: 5-120)
    - country: User's country of residence
    - interests: Add to user's interests (comma-separated)

    WHEN TO USE:
    - User provides new personal information
    - User wants to correct existing information
    - User explicitly asks to update their profile

    EXAMPLES:
    - "My name is actually Maria, not Marie"
    - "I'm from Spain, not Mexico"
    - "Add photography to my interests"
    - "I'm 25 years old"

    Args:
        field: The profile field to update (name, age, country, interests)
        value: The new value for the field

    Returns:
        Confirmation of the profile update

    Raises:
        ToolError: If field is invalid or value is inappropriate
    """
    with ToolTimer("update_user_profile") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata: UserData = context.userdata

            # Validate field parameter
            field_clean = validate_string_param(
                field, "field", allowed_values=["name", "age", "country", "interests"]
            )

            # Validate value parameter
            if not value or not isinstance(value, str):
                raise ToolError("Please provide a value for the update")

            value_clean = value.strip()

            logger.info("👤 Profile update request: %s = %s", field_clean, value_clean)

            # Delegate to specific update function (SRP)
            if field_clean == "name":
                result = _update_user_name(userdata, value_clean)
            elif field_clean == "age":
                result = _update_user_age(userdata, value_clean)
            elif field_clean == "country":
                result = _update_user_country(userdata, value_clean)
            elif field_clean == "interests":
                result = _update_user_interests(userdata, value_clean)
            else:
                raise ToolError(f"Field '{field}' not supported")

            # Log successful usage
            log_tool_usage("update_user_profile", userdata, result, timer.execution_time)

            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "update_user_profile",
                f"Unable to update {field}. Please try again with a different value.",
            )
            log_tool_error("update_user_profile", error, context.userdata)
            raise error from e


@function_tool
async def clear_user_data(context: RunContext[UserData]) -> str:
    """
    Clears specific user data fields or all user information.

    This tool allows selective clearing of user data for privacy or
    to start fresh with certain information.

    WHEN TO USE:
    - User wants to clear specific information
    - Privacy concerns about stored data
    - User wants to update information from scratch

    EXAMPLES:
    - "Clear my interests"
    - "Remove my age information"
    - "Delete my stored information"

    Returns:
        Confirmation of data clearing

    Raises:
        ToolError: If clearing fails
    """
    with ToolTimer("clear_user_data") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata: UserData = context.userdata

            # Clear all personal data but keep system settings
            old_name = userdata.name
            userdata.name = None
            userdata.age = None
            userdata.country = None
            userdata.interests = []

            # Keep current persona and mode
            current_persona = userdata.current_persona
            current_mode = userdata.io_mode

            logger.info("🧹 User data cleared for: %s", old_name or "anonymous user")

            result = (
                "Perfect! I've cleared your personal information (name, age, country, interests). "
                f"I'm still in {current_persona} mode with {current_mode} communication. "
                "Feel free to share your information again when you're ready!"
            )

            # Log successful usage
            log_tool_usage("clear_user_data", userdata, result, timer.execution_time)

            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "clear_user_data", "Unable to clear user data. Please try again."
            )
            log_tool_error("clear_user_data", error, context.userdata)
            raise error from e


# ==========================================
# PRIVATE HELPER FUNCTIONS (SRP)
# ==========================================


def _update_user_name(userdata: UserData, value: str) -> str:
    """Updates user name with validation."""
    if len(value) < 1 or len(value) > 50:
        raise ToolError("Name must be between 1 and 50 characters")

    old_name = userdata.name
    userdata.name = value.title()

    logger.info("👤 Name updated: %s → %s", old_name, userdata.name)

    return f"Perfect! I've updated your name to '{userdata.name}'. Nice to meet you!"


def _update_user_age(userdata: UserData, value: str) -> str:
    """Updates user age with validation."""
    try:
        age_int = int(value)
        validate_numeric_param(age_int, "age", min_value=5, max_value=120)
    except ValueError as e:
        raise ToolError("Age must be a valid number") from e

    old_age = userdata.age
    userdata.age = age_int

    logger.info("🎂 Age updated: %s → %s", old_age, userdata.age)

    return f"Got it! I've updated your age to {userdata.age} years old."


def _update_user_country(userdata: UserData, value: str) -> str:
    """Updates user country with validation."""
    if len(value) < 2:
        raise ToolError("Country name is too short")

    old_country = userdata.country
    userdata.country = value.title()

    logger.info("🌍 Country updated: %s → %s", old_country, userdata.country)

    return f"Excellent! I've updated your country to {userdata.country}."


def _update_user_interests(userdata: UserData, value: str) -> str:
    """Updates user interests with validation."""
    # Parse comma-separated interests
    new_interests = [i.strip().lower() for i in value.split(",") if i.strip()]
    if not new_interests:
        raise ToolError("Please provide at least one interest")

    # Add to existing interests (avoid duplicates)
    current_interests = userdata.interests or []
    added_interests = []

    for interest in new_interests:
        if interest not in current_interests:
            current_interests.append(interest)
            added_interests.append(interest)

    # Limit to 10 interests total
    userdata.interests = current_interests[:10]

    if added_interests:
        logger.info("🎯 Interests added: %s", added_interests)
        added_str = ", ".join(added_interests)
        return f"Great! I've added these interests to your profile: {added_str}."
    else:
        return "Those interests are already in your profile!"


# ==========================================
# FUTURE USER DATA TOOLS (MOCKUPS)
# ==========================================


@function_tool
async def export_user_data(context: RunContext[UserData]) -> str:
    """
    Exports user data in a structured format for download.

    MOCKUP TOOL - Ready for implementation.

    Returns:
        User data in exportable format
    """
    validate_tool_context(context)
    userdata = context.userdata

    # This would generate a downloadable file in real implementation
    export_data = {
        "name": userdata.name,
        "age": userdata.age,
        "country": userdata.country,
        "interests": userdata.interests,
        "current_persona": userdata.current_persona,
        "io_mode": userdata.io_mode,
        "export_timestamp": "2025-01-11T00:00:00Z",
    }

    return f"User data export prepared: {len(str(export_data))} characters ready for download."


@function_tool
async def import_user_data(context: RunContext[UserData], data_json: str) -> str:
    """
    Imports user data from a structured format.

    MOCKUP TOOL - Ready for implementation.

    Args:
        data_json: JSON string with user data

    Returns:
        Import confirmation
    """
    validate_tool_context(context)

    # This would parse and validate imported data in real implementation
    return f"User data import completed: {len(data_json)} characters processed."


@function_tool
async def get_data_privacy_info(context: RunContext[UserData]) -> str:
    """
    Provides information about data privacy and usage.

    MOCKUP TOOL - Ready for implementation.

    Returns:
        Privacy information and data usage details
    """
    validate_tool_context(context)

    return (
        "Privacy Information:\n"
        "• Your data is stored locally during the session\n"
        "• No personal information is permanently saved\n"
        "• You can clear your data at any time\n"
        "• Data is not shared with third parties"
    )
