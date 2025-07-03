"""
Agente Conversacional Refactorizado - Principios SOLID + DRY
"""

import logging
import re
from typing import Any

from livekit.agents import Agent
from livekit.agents.llm import ChatContext, ChatMessage

from core.config import UserData
from core.tools import change_mode, change_persona, get_user_summary, update_frontend_ui

logger = logging.getLogger(__name__)


class ConversationalMasterAgent(Agent):
    """Agente maestro conversacional con complejidad reducida."""

    def __init__(self, persona_id: str, persona_config: dict[str, Any]) -> None:
        required_fields = ["name", "instructions"]
        for field in required_fields:
            if field not in persona_config:
                raise KeyError(f"Campo requerido '{field}' faltante en configuración")

        super().__init__(
            instructions=persona_config["instructions"],
            tools=[
                change_persona,
                change_mode,
                get_user_summary,
                update_frontend_ui,
            ],
        )

        self.persona_id = persona_id
        self.persona_config = persona_config
        self.name = persona_config["name"]
        self._user_processor = UserDataProcessor()

        logger.info("🎭 Agente maestro inicializado: %s (%s)", self.name, self.persona_id)

    async def on_enter(self) -> None:
        """Hook llamado cuando el agente se vuelve activo."""
        logger.info("🚀 Agente %s entrando a la sesión", self.name)

        try:
            greeting = self.persona_config.get("greeting", f"¡Hola! Soy {self.name}, ¿cómo estás?")
            await self.session.say(greeting)
            logger.debug("💬 Saludo inicial enviado: %s", greeting[:50] + "...")
        except Exception as e:
            logger.error("❌ Error en on_enter: %s", str(e))
            await self.session.say("¡Hola! ¿Cómo puedo ayudarte?")

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        """
        Hook procesamiento de turno del usuario - REFACTORIZADO.

        Complejidad reducida aplicando Single Responsibility Principle.
        """
        user_text = self._extract_user_text(new_message)
        if not user_text:
            return

        logger.debug("🔍 Procesando turno del usuario: %s", user_text[:50])

        try:
            # Usar processor separado para reducir complejidad
            await self._user_processor.process_user_input(
                user_text, self.session.userdata, self.session
            )
        except Exception as e:
            logger.error("❌ Error procesando turno del usuario: %s", str(e))

    async def on_exit(self) -> None:
        """Hook llamado antes de ceder control a otro agente."""
        logger.info("👋 Agente %s saliendo de la sesión", self.name)

        try:
            await self._handle_farewell()
        except Exception as e:
            logger.error("❌ Error en on_exit: %s", str(e))

    def _extract_user_text(self, message: ChatMessage) -> str:
        """Extrae texto del mensaje del usuario."""
        user_text = ""
        if message.content:
            for content_item in message.content:
                if hasattr(content_item, "text") and content_item.text:
                    user_text += content_item.text + " "
        return user_text.strip().lower()

    async def _handle_farewell(self) -> None:
        """Maneja la despedida del usuario."""
        try:
            farewell = self.persona_config.get("farewell", "¡Hasta pronto!")

            if self.session.userdata.name:
                user_name = self.session.userdata.name
                farewell = farewell.replace("{name}", user_name)
                if "{name}" not in self.persona_config.get("farewell", ""):
                    farewell = f"¡Fue un placer hablar contigo, {user_name}! " + farewell

            logger.info("👋 Conversación finalizada")
            await self.session.say(farewell)

        except Exception as e:
            logger.error("❌ Error en despedida: %s", str(e))
            name = self.session.userdata.name or "amigo"
            await self.session.say(f"¡Hasta pronto, {name}!")


class UserDataProcessor:
    """
    Procesador de datos de usuario - Single Responsibility Principle.

    Separa la lógica de extracción de datos para reducir complejidad.
    """

    async def process_user_input(self, user_text: str, userdata: UserData, session) -> None:
        """Procesa input del usuario y actualiza datos."""

        # Detectar y procesar en orden de prioridad
        if await self._process_name(user_text, userdata, session):
            return
        if await self._process_age(user_text, userdata, session):
            return
        if await self._process_country(user_text, userdata, session):
            return
        if await self._process_interests(user_text, userdata, session):
            return
        if await self._process_farewell(user_text, session):
            return

    async def _process_name(self, text: str, userdata: UserData, session) -> bool:
        """Procesa extracción de nombre."""
        if userdata.name:
            return False

        name = self._extract_name(text)
        if name:
            userdata.name = name
            logger.info("👤 Nombre extraído: %s", name)
            await session.say(f"¡Perfecto {name}! ¿Cuántos años tienes?")
            return True
        return False

    async def _process_age(self, text: str, userdata: UserData, session) -> bool:
        """Procesa extracción de edad."""
        if userdata.age:
            return False

        age = self._extract_age(text)
        if age:
            if 5 <= age <= 120:
                userdata.age = age
                logger.info("🎂 Edad extraída: %s años", age)
                await session.say(f"Tienes {age} años. ¿De qué país eres?")
                return True
            else:
                await session.say("Esa edad parece inusual. ¿Podrías decirme tu edad real?")
                return True
        return False

    async def _process_country(self, text: str, userdata: UserData, session) -> bool:
        """Procesa extracción de país."""
        if userdata.country:
            return False

        country = self._extract_country(text)
        if country:
            userdata.country = country
            logger.info("🌍 País extraído: %s", country)
            await session.say(f"¡Genial, {country}! ¿Cuáles son tus principales intereses?")
            return True
        return False

    async def _process_interests(self, text: str, userdata: UserData, session) -> bool:
        """Procesa extracción de intereses."""
        if len(userdata.interests) >= 3:
            return False

        interests = self._extract_interests(text)
        if interests:
            new_interests = [i for i in interests if i not in userdata.interests]
            userdata.interests.extend(new_interests[:3])

            if new_interests:
                logger.info("🎯 Intereses extraídos: %s", new_interests)
                name = userdata.name or "usuario"
                await session.say(
                    f"Excelente {name}! Me parece interesante que disfrutes de "
                    f"{', '.join(new_interests)}. Ya te conozco mejor."
                )
                return True
        return False

    async def _process_farewell(self, text: str, session) -> bool:
        """Procesa despedida."""
        if self._is_farewell(text):
            farewell = "¡Hasta pronto!"
            if session.userdata.name:
                farewell = f"¡Hasta pronto, {session.userdata.name}!"
            await session.say(farewell)
            return True
        return False

    def _extract_name(self, transcript: str) -> str | None:
        """Extrae nombre usando regex."""
        patterns = [
            r"me llamo ([a-záéíóúñ]+)",
            r"soy ([a-záéíóúñ]+)",
            r"mi nombre es ([a-záéíóúñ]+)",
            r"^([a-záéíóúñ]+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                name = match.group(1).strip().title()
                if len(name) >= 2 and name not in [
                    "Hola",
                    "Bien",
                    "Muy",
                    "Como",
                    "Que",
                    "Si",
                    "No",
                ]:
                    return name
        return None

    def _extract_age(self, transcript: str) -> int | None:
        """Extrae edad usando regex."""
        patterns = [
            r"tengo (\d+) años",
            r"(\d+) años",
            r"^(\d+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                try:
                    age = int(match.group(1))
                    if 5 <= age <= 120:
                        return age
                except ValueError:
                    continue
        return None

    def _extract_country(self, transcript: str) -> str | None:
        """Extrae país usando regex y lista predefinida."""
        patterns = [
            r"soy de ([a-záéíóúñ\s]+)",
            r"de ([a-záéíóúñ\s]+)",
            r"vivo en ([a-záéíóúñ\s]+)",
        ]

        countries = [
            "españa",
            "méxico",
            "argentina",
            "colombia",
            "chile",
            "perú",
            "venezuela",
            "ecuador",
            "bolivia",
            "uruguay",
            "paraguay",
            "guatemala",
            "honduras",
            "nicaragua",
            "costa rica",
            "panamá",
            "puerto rico",
            "cuba",
            "república dominicana",
        ]

        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                country_candidate = match.group(1).strip().lower()
                for country in countries:
                    if country in country_candidate or country_candidate in country:
                        return country.title()
        return None

    def _extract_interests(self, transcript: str) -> list[str]:
        """Extrae intereses usando palabras clave."""
        interest_keywords = [
            "leer",
            "música",
            "deportes",
            "cocinar",
            "viajar",
            "cine",
            "arte",
            "tecnología",
            "ciencia",
            "historia",
            "naturaleza",
            "fotografía",
            "bailar",
            "cantar",
            "pintar",
            "escribir",
            "estudiar",
            "aprender",
        ]

        interests = []
        for keyword in interest_keywords:
            if keyword in transcript:
                interests.append(keyword)

        return interests[:3]

    def _is_farewell(self, transcript: str) -> bool:
        """Detecta despedidas."""
        farewell_patterns = [
            "adiós",
            "hasta luego",
            "nos vemos",
            "chau",
            "bye",
            "me voy",
            "tengo que irme",
            "hasta pronto",
            "gracias por todo",
        ]
        return any(pattern in transcript for pattern in farewell_patterns)
