"""
Conversational Agent - LiveKit 1.0 DYNAMIC TOOLS
================================================

✅ AVANZADO: Usa sistema dinámico de tools por personalidad
✅ FLEXIBLE: Tools específicas según el contexto
✅ FUTURO-PROOF: Preparado para más personalidades
"""

import logging
from datetime import datetime
from typing import Any

from livekit.agents import Agent
from livekit.agents.llm import ChatContext, ChatMessage

# ✅ DYNAMIC IMPORTS
from core.tools import get_rpc_testing_tools, get_tools_for_persona, validate_tools_configuration

logger = logging.getLogger(__name__)


class ConversationalAgent(Agent):
    """
    Agente conversacional - DYNAMIC TOOLS VERSION.

    ✅ DINÁMICO: Tools específicas por personalidad
    ✅ ADAPTATIVO: Incluye RPC testing cuando necesario
    ✅ ESCALABLE: Fácil agregar nuevas personalidades
    """

    def __init__(
        self,
        persona_config: dict[str, Any],
        chat_ctx: ChatContext | None = None,
        enable_rpc_testing: bool = True,
        include_debug: bool = False,
    ) -> None:
        """
        Inicializa el agente conversacional - DYNAMIC VERSION.

        Args:
            persona_config: Configuración de personalidad
            chat_ctx: Contexto de chat previo
            enable_rpc_testing: Si incluir tools de testing RPC
            include_debug: Si incluir tools de debugging
        """
        # Validate required configuration fields
        required_fields = ["name", "instructions"]
        for field in required_fields:
            if field not in persona_config:
                raise KeyError(f"Campo requerido '{field}' faltante en configuración")

        if not isinstance(persona_config["name"], str) or not persona_config["name"].strip():
            raise ValueError("El nombre de la personalidad debe ser un string no vacío")

        if (
            not isinstance(persona_config["instructions"], str)
            or len(persona_config["instructions"]) < 10
        ):
            raise ValueError("Las instrucciones deben ser un string de al menos 10 caracteres")

        # Store configuration
        self.persona_config = persona_config.copy()
        self.name = persona_config["name"]
        self.persona_id = persona_config.get("persona_id", "rosalia")  # Extract persona ID
        self.enable_rpc_testing = enable_rpc_testing
        self.include_debug = include_debug

        # ✅ DYNAMIC TOOLS: Get tools specific to this persona
        tools = self._get_dynamic_tools()

        # Initialize Agent with dynamic tools
        super().__init__(
            instructions=persona_config["instructions"],
            tools=tools,
            chat_ctx=chat_ctx,
        )

        logger.info(
            "🎭 ConversationalAgent inicializado - Persona: %s (%s), Tools: %d",
            self.name,
            self.persona_id,
            len(tools),
        )

        # Log tools configuration
        self._log_tools_configuration()

    def _get_dynamic_tools(self) -> list[Any]:
        """
        ✅ DYNAMIC: Obtiene tools específicas para esta personalidad.

        Returns:
            Lista de tools configuradas dinámicamente
        """
        try:
            # Get persona-specific tools
            tools = get_tools_for_persona(
                self.persona_id,
                include_debug=self.include_debug,
                include_rpc=self.enable_rpc_testing,
            )

            # Add RPC testing tools if needed and not already included
            if self.enable_rpc_testing:
                rpc_tools = get_rpc_testing_tools()
                # Add unique RPC tools not already in the list
                for rpc_tool in rpc_tools:
                    if rpc_tool not in tools:
                        tools.append(rpc_tool)

            logger.debug("🔧 Dynamic tools loaded for %s: %d tools", self.persona_id, len(tools))
            return tools

        except Exception as e:
            logger.error("❌ Error loading dynamic tools: %s", str(e))
            # Fallback to basic tools
            from core.tools import change_mode, change_persona, get_system_stats, get_user_summary

            return [change_persona, change_mode, get_user_summary, get_system_stats]

    def _log_tools_configuration(self) -> None:
        """Log de configuración de tools para debugging."""
        try:
            # Validate tools configuration
            validation = validate_tools_configuration()
            status = validation.get("overall_status", "unknown")

            logger.info("🔧 Tools configuration - Status: %s", status)

            if self.enable_rpc_testing:
                rpc_status = validation.get("rpc_testing", {})
                logger.info("🧪 RPC testing ready: %s", rpc_status.get("available", False))

        except Exception as e:
            logger.warning("⚠️ Could not validate tools configuration: %s", str(e))

    def get_available_tools_info(self) -> dict[str, Any]:
        """
        ✅ NEW: Obtiene información sobre las tools disponibles.

        Returns:
            Información detallada sobre tools disponibles
        """
        try:
            tools = self._get_dynamic_tools()

            from core.tools import validate_tools_configuration

            validation = validate_tools_configuration()

            return {
                "persona_id": self.persona_id,
                "persona_name": self.name,
                "total_tools": len(tools),
                "rpc_testing_enabled": self.enable_rpc_testing,
                "debug_enabled": self.include_debug,
                "system_status": validation.get("overall_status", "unknown"),
                "rpc_ready": validation.get("rpc_testing", {}).get("available", False),
            }

        except Exception as e:
            logger.error("❌ Error getting tools info: %s", str(e))
            return {"error": str(e)}

    # ✅ REST OF CLASS: Sin cambios (same as simple version)
    async def on_enter(self) -> None:
        """Hook llamado cuando el agente se vuelve activo en la sesión."""
        logger.info("🚀 Agente %s entrando a la sesión", self.name)

        try:
            greeting_instructions = self._build_greeting_instructions()
            await self.session.generate_reply(
                instructions=greeting_instructions, allow_interruptions=True
            )
            logger.debug("💬 Greeting dinámico enviado para %s", self.name)

        except Exception as e:
            logger.error("❌ Error en greeting para %s: %s", self.name, str(e))
            fallback_greeting = self.persona_config.get(
                "greeting", f"¡Hola! Soy {self.name}, ¿cómo puedo ayudarte?"
            )
            await self.session.say(fallback_greeting, allow_interruptions=True)

    def _build_greeting_instructions(self) -> str:
        """
        ✅ FIXED: Construye instrucciones dinámicas SIN meta-narrativa.

        CAMBIO CLAVE:
        - USA toda la info que ya existe en persona_config
        - SIN meta-narrativa ("Saluda al usuario...")
        - Instrucciones en primera persona
        - Permite saludos dinámicos basados en hora
        - Usa el greeting del YAML como estilo base
        """

        # ✅ Usar el greeting que ya existe en el YAML
        base_greeting = self.persona_config.get(
            "greeting", f"¡Hola! Soy {self.name}, ¿cómo puedo ayudarte?"
        )

        # ✅ Usar la info de personalidad que ya existe
        persona_name = self.persona_config.get("name", self.name)
        persona_age = self.persona_config.get("age", "")
        persona_country = self.persona_config.get("country", "")

        # ✅ Obtener contexto temporal para saludos dinámicos

        current_hour = datetime.now().hour

        # ✅ Determinar saludo temporal apropiado
        if 5 <= current_hour < 12:
            time_greeting = "Buenos días"
            time_context = "Es una hermosa mañana"
        elif 12 <= current_hour < 18:
            time_greeting = "Buenas tardes"
            time_context = "Es una tarde agradable"
        elif 18 <= current_hour < 22:
            time_greeting = "Buenas tardes"
            time_context = "Es una tarde relajada"
        else:
            time_greeting = "Buenas noches"
            time_context = "Es una noche tranquila"

        # ✅ Verificar si hay conversación previa
        try:
            if (
                hasattr(self, "_chat_ctx")
                and self._chat_ctx
                and hasattr(self._chat_ctx, "messages")
                and len(self._chat_ctx.messages) > 0
            ):
                # ✅ Conversación existente - saludo de regreso
                return (
                    f"Soy {persona_name}. {time_context} y me alegra que hayas regresado. "
                    f"Continúo nuestra conversación de manera natural y cálida. "
                    f"Mi estilo base es: '{base_greeting}' pero adapto el saludo "
                    f"reconociendo que ya hemos hablado antes."
                )
        except (AttributeError, TypeError):
            # Normal para conversaciones nuevas
            pass

        # ✅ INSTRUCCIONES EN PRIMERA PERSONA - SIN META-NARRATIVA
        # Usa toda la información del YAML sin reinventarla
        instructions = (
            f"Soy {persona_name}"
            f"{f', de {persona_age} años' if persona_age else ''}"
            f"{f' desde {persona_country}' if persona_country else ''}. "
            f"{time_context}. "
            f"Me encuentro con alguien nuevo y quiero darle la bienvenida. "
            f"Mi saludo natural sería: '{base_greeting}' pero lo adapto "
            f"usando '{time_greeting}' apropiado para esta hora. "
            f"Soy auténtica a mi personalidad y hago que se sienta bienvenido."
        )

        return instructions

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        """Hook llamado cuando el usuario completa su turno."""
        user_text = self._extract_user_text_safe(new_message)

        if user_text:
            logger.debug(
                "🔍 Usuario completó turno en %s: %s",
                self.name,
                user_text[:50] + "..." if len(user_text) > 50 else user_text,
            )

        try:
            if hasattr(self.session, "userdata") and self.session.userdata:
                pass
        except Exception as e:
            logger.error("❌ Error en procesamiento mínimo de turno: %s", str(e))

    def _extract_user_text_safe(self, message: ChatMessage) -> str:
        """Extrae texto del mensaje de usuario de forma segura."""
        if not message.content:
            return ""

        text_parts = []

        try:
            if isinstance(message.content, str):
                text_parts.append(message.content.strip())
            elif isinstance(message.content, list):
                for content_item in message.content:
                    if isinstance(content_item, str):
                        text_parts.append(content_item.strip())
                    else:
                        try:
                            if hasattr(content_item, "text"):
                                text_value = getattr(content_item, "text", None)
                                if text_value and isinstance(text_value, str):
                                    text_parts.append(text_value.strip())
                        except (AttributeError, TypeError):
                            logger.debug(
                                "Content item without text (normal): %s",
                                type(content_item).__name__,
                            )
                            continue
            else:
                try:
                    if hasattr(message.content, "text"):
                        text_value = getattr(message.content, "text", None)
                        if text_value and isinstance(text_value, str):
                            text_parts.append(text_value.strip())
                except (AttributeError, TypeError):
                    logger.debug("Content item without text: %s", type(message.content).__name__)

        except Exception as e:
            logger.debug("⚠️ Error extrayendo texto (no crítico): %s", str(e))
            return ""

        combined_text = " ".join(text_parts)
        return combined_text.strip()

    async def on_exit(self) -> None:
        """Hook llamado antes de que el agente ceda control."""
        logger.info("👋 Agente %s saliendo de la sesión", self.name)

        try:
            farewell_message = self._build_farewell_message()
            await self.session.say(farewell_message, allow_interruptions=True)
            logger.info("✅ Despedida completada para %s", self.name)

        except Exception as e:
            logger.debug("⚠️ Error en despedida (normal durante shutdown): %s", str(e))

    def _build_farewell_message(self) -> str:
        """Construye mensaje de despedida personalizado."""
        try:
            base_farewell = self.persona_config.get(
                "farewell", "¡Hasta pronto! Que tengas un excelente día."
            )

            if (
                hasattr(self.session, "userdata")
                and self.session.userdata
                and hasattr(self.session.userdata, "name")
                and self.session.userdata.name
            ):
                user_name = self.session.userdata.name

                if "{name}" in base_farewell:
                    return base_farewell.replace("{name}", f", {user_name}")
                else:
                    return f"¡Fue un placer hablar contigo, {user_name}! {base_farewell}"

            return base_farewell

        except Exception as e:
            logger.debug("⚠️ Error construyendo farewell (usando fallback): %s", str(e))
            return "¡Hasta pronto! Gracias por hablar conmigo."
