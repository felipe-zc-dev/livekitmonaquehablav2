"""
Persona Management Tools - LiveKit 1.0
======================================

Tools para gestión de personalidades y modos de comunicación.
Implementa patrones LiveKit 1.0 + correcciones de linting errors.

TOOLS INCLUDED:
- change_persona: Cambio de personalidad del agente
- change_mode: Cambio de modo de comunicación (text/voice/hybrid)

FIXES APLICADOS:
✅ ToolError proper import y usage
✅ Error handling con "raise...from"
✅ Type hints correctos
✅ Docstrings detalladas para LLM guidance
✅ Line length < 100 chars
✅ Validation apropiada
"""

import logging

from livekit.agents import RunContext, function_tool

from core.config import UserData, load_persona_config

from .base import (
    ToolError,
    ToolTimer,
    handle_tool_error,
    log_tool_error,
    log_tool_usage,
    validate_string_param,
    validate_tool_context,
)

logger = logging.getLogger(__name__)

# ==========================================
# PERSONA MANAGEMENT TOOLS
# ==========================================


@function_tool
async def change_persona(context: RunContext[UserData], persona_id: str) -> str:
    """
    Changes the agent's personality to match a specific role or expertise.

    This tool should be used when the user explicitly requests a different type of
    assistant (coach, therapist, teacher, etc.) or when the conversation clearly
    indicates they need specialized help that requires a personality change.

    IMPORTANT USAGE GUIDELINES:
    - Only use when user explicitly asks for a different type of assistant
    - Don't use for minor conversation adjustments or temporary mood changes
    - Don't use for single-question specialization
    - The personality change affects the entire conversation going forward

    AVAILABLE PERSONALITIES:
    - rosalia: Friendly Spanish designer for general conversation and creativity
    - sofia: Warm assistant from Barcelona for casual conversations
    - coach: Motivational financial/life coach from Colombia (Alex Motivation)
    - profesor: Educational tutor from Argentina (Prof. Miguel Santos)
    - psicologo: Professional therapist from Mexico (Dr. Carmen Ruiz)

    EXAMPLES OF WHEN TO USE:
    - "I need a life coach to help me with my goals"
    - "Can you be my Spanish tutor?"
    - "I'm feeling anxious, do you have a therapist mode?"
    - "I want to talk to someone who can help me with my finances"

    EXAMPLES OF WHEN NOT TO USE:
    - "Can you be more formal?" (just adjust conversation style)
    - "Tell me about psychology" (answer as current persona)
    - "What would a coach say?" (give perspective as current persona)

    Args:
        persona_id: The personality to switch to. Must be one of: rosalia, sofia,
                   coach, profesor, psicologo

    Returns:
        Confirmation message about the successful personality change

    Raises:
        ToolError: If the personality doesn't exist or is invalid
    """
    with ToolTimer("change_persona") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata: UserData = context.userdata

            # Validate persona_id parameter
            persona_clean = validate_string_param(
                persona_id,
                "persona_id",
                min_length=1,
                max_length=50,
                allowed_values=["rosalia", "sofia", "coach", "profesor", "psicologo"],
            )

            logger.info("🎭 Change persona request: %s", persona_clean)

            try:
                # Validate that the personality configuration exists
                persona_config = load_persona_config(persona_clean)

                # Update userdata
                old_persona = userdata.current_persona
                userdata.current_persona = persona_clean

                # Get personality info for response
                persona_name = persona_config.get("name", persona_clean.title())
                switch_message = persona_config.get(
                    "switch_message", f"Hola, ahora soy {persona_name}. ¿Cómo puedo ayudarte?"
                )

                logger.info(
                    "🎭 Personality changed: %s → %s (%s)", old_persona, persona_clean, persona_name
                )

                # Provide immediate feedback to user
                await context.session.say(switch_message, allow_interruptions=True)

                success_message = (
                    f"Personality successfully changed to {persona_name}. "
                    f"I'm now ready to help you with my new specialization."
                )

                # Log successful usage
                log_tool_usage("change_persona", userdata, success_message, timer.execution_time)

                return success_message

            except FileNotFoundError as e:
                error_msg = (
                    f"Personality configuration for '{persona_id}' is missing. "
                    f"Available personalities: rosalia, sofia, coach, profesor, psicologo"
                )
                raise ToolError(error_msg) from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "change_persona",
                "Unable to change personality due to a technical issue. "
                "Please try again or choose a different personality.",
            )
            log_tool_error("change_persona", error, context.userdata)
            raise error from e


@function_tool
async def change_mode(context: RunContext[UserData], mode: str) -> str:
    """
    Changes the agent's interaction mode between text, voice, or hybrid communication.

    This tool controls how the agent communicates with the user:
    - text: Only text responses, no voice synthesis
    - voice: Only voice responses, no text display
    - hybrid: Both text and voice responses (recommended)

    WHEN TO USE:
    - User explicitly requests "text only mode" or "voice only mode"
    - User has accessibility needs (hearing/vision impairments)
    - User is in an environment where audio isn't appropriate
    - User wants to switch between modes for convenience

    EXAMPLES:
    - "Switch to text only, I'm in a meeting"
    - "Can you speak to me? I prefer voice"
    - "Use both text and voice please"

    Args:
        mode: Communication mode. Must be "text", "voice", or "hybrid"

    Returns:
        Confirmation of the mode change

    Raises:
        ToolError: If the mode is invalid
    """
    with ToolTimer("change_mode") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata: UserData = context.userdata

            # Validate mode parameter
            mode_clean = validate_string_param(
                mode,
                "mode",
                min_length=1,
                max_length=20,
                allowed_values=["text", "voice", "hybrid"],
            )

            logger.info("🔄 Change mode request: %s → %s", userdata.io_mode, mode_clean)

            try:
                old_mode = userdata.io_mode
                userdata.io_mode = mode_clean

                logger.info("🔄 IO mode changed: %s → %s", old_mode, mode_clean)

                # Mode-specific feedback
                if mode_clean == "text":
                    feedback = (
                        "Perfect! I've switched to text-only mode. "
                        "I'll respond with text but no voice."
                    )
                elif mode_clean == "voice":
                    feedback = (
                        "Great! I've switched to voice-only mode. "
                        "I'll speak my responses without showing text."
                    )
                else:  # hybrid
                    feedback = (
                        "Excellent! I'm now using hybrid mode - "
                        "you'll get both text and voice responses."
                    )

                # Log successful usage
                log_tool_usage("change_mode", userdata, feedback, timer.execution_time)

                return feedback

            except Exception as e:
                raise ToolError("Unable to change communication mode. Please try again.") from e

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "change_mode",
                "Unable to change communication mode due to a technical issue. "
                "Please try again.",
            )
            log_tool_error("change_mode", error, context.userdata)
            raise error from e


# ==========================================
# FUTURE PERSONA TOOLS (MOCKUPS)
# ==========================================


@function_tool
async def get_persona_capabilities(context: RunContext[UserData], persona_id: str) -> str:
    """
    Gets detailed information about a specific personality's capabilities.

    MOCKUP TOOL - Ready for implementation.

    Args:
        persona_id: Personality to get info about

    Returns:
        Detailed capabilities and specializations
    """
    # This is a mockup - implement when needed
    validate_tool_context(context)

    capabilities_map = {
        "rosalia": "Creative design, Barcelona lifestyle, sophisticated conversations",
        "coach": "Goal setting, motivation, financial planning, accountability",
        "profesor": "Education, study techniques, knowledge sharing, explanations",
        "psicologo": "Emotional support, stress management, basic coping strategies",
        "sofia": "Casual conversation, Spanish culture, friendly interactions",
    }

    persona_clean = validate_string_param(
        persona_id, "persona_id", allowed_values=list(capabilities_map.keys())
    )

    return f"{persona_clean.title()}'s capabilities: {capabilities_map[persona_clean]}"


@function_tool
async def list_available_personas(context: RunContext[UserData]) -> str:
    """
    Lists all available personalities with brief descriptions.

    MOCKUP TOOL - Ready for implementation.

    Returns:
        Formatted list of available personalities
    """
    validate_tool_context(context)

    personas = {
        "rosalia": "Creative designer from Barcelona - sophisticated and artistic",
        "sofia": "Friendly assistant from Barcelona - warm and conversational",
        "coach": "Motivational life coach from Colombia - energetic and goal-focused",
        "profesor": "Educational tutor from Argentina - patient and knowledgeable",
        "psicologo": "Professional therapist from Mexico - empathetic and supportive",
    }

    result = "Available personalities:\n"
    for persona_id, description in personas.items():
        result += f"• {persona_id}: {description}\n"

    return result.strip()


@function_tool
async def get_current_persona_info(context: RunContext[UserData]) -> str:
    """
    Gets information about the currently active personality.

    MOCKUP TOOL - Ready for implementation.

    Returns:
        Current personality information
    """
    validate_tool_context(context)
    userdata = context.userdata

    try:
        current_persona = userdata.current_persona
        persona_config = load_persona_config(current_persona)

        return (
            f"Current personality: {persona_config.get('name', current_persona)}\n"
            f"Age: {persona_config.get('age', 'Unknown')}\n"
            f"Country: {persona_config.get('country', 'Unknown')}\n"
            f"Communication mode: {userdata.io_mode}"
        )

    except Exception as e:
        raise ToolError("Unable to get current personality information") from e
