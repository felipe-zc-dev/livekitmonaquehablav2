"""
Configuración y estructuras de datos del sistema.
CORREGIDO: Type hints para MyPy strict mode y PEP 484.
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Directorio base para configuraciones
PERSONAS_DIR = Path(__file__).parent.parent / "personas"


@dataclass
class UserData:
    """
    Estructura de datos del usuario y estado de la sesión.

    Simplificada para compatibilidad con LiveKit 1.0.
    ✅ CORREGIDO: Type hints explícitos.
    """

    # Información personal del usuario
    name: str | None = None
    age: int | None = None
    country: str | None = None
    interests: list[str] = field(default_factory=list)

    # Estado del sistema
    current_persona: str = "rosalia"
    io_mode: str = "hybrid"

    def get_user_summary(self) -> str:
        """
        Genera un resumen de la información del usuario.

        Returns:
            Resumen formateado de los datos recopilados
        """
        if not self.name:
            return "Usuario nuevo sin información recopilada"

        parts = [f"{self.name}"]

        if self.age:
            parts.append(f"{self.age} años")

        if self.country:
            parts.append(f"de {self.country}")

        if self.interests:
            interests_str = ", ".join(self.interests[:3])
            if len(self.interests) > 3:
                interests_str += f" y {len(self.interests) - 3} intereses más"
            parts.append(f"intereses: {interests_str}")

        return " - ".join(parts)

    def is_onboarding_complete(self) -> bool:
        """
        Verifica si el proceso de recopilación de información está completo.

        Returns:
            True si se ha recopilado información básica del usuario
        """
        return bool(self.name and self.age and self.country and self.interests)


class SystemConfig:
    """Configuraciones globales del sistema."""

    # Configuración de logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Configuración de LiveKit
    DEFAULT_PERSONA: str = "rosalia"
    DEFAULT_IO_MODE: str = "hybrid"

    # Configuraciones de rendimiento
    MAX_MESSAGES_IN_MEMORY: int = 50
    SESSION_TIMEOUT_MINUTES: int = 30

    # Configuraciones de audio
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_CHUNK_SIZE: int = 256

    # Configuraciones de monitoreo
    MONITORING_ENABLED: bool = True
    METRICS_COLLECTION_INTERVAL: int = 30

    @classmethod
    def setup_logging(cls) -> None:
        """Configura el logging del sistema."""
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format=cls.LOG_FORMAT,
        )

        # Reducir ruido de librerías externas
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("asyncio").setLevel(logging.WARNING)
        logging.getLogger("websockets").setLevel(logging.WARNING)


# Configuración de personas por defecto
DEFAULT_PERSONA_CONFIG: dict[str, str] = {
    "name": "Asistente Virtual",
    "voice_id": "default",
    "instructions": "Eres un asistente virtual útil y amigable.",
    "greeting": "¡Hola! Soy tu asistente virtual. ¿Cómo puedo ayudarte?",
    "farewell": "¡Hasta luego! Que tengas un excelente día.",
}


def load_persona_config(persona_id: str) -> dict[str, Any]:
    """
    Función de compatibilidad para cargar configuración de personalidad.

    ✅ CORREGIDO: Type hints específicos para dict.

    DEPRECADA: Usar PersonaManager.load_persona() en su lugar.

    Args:
        persona_id: ID de la personalidad

    Returns:
        Configuración de la personalidad

    Raises:
        FileNotFoundError: Si no se encuentra la configuración
        yaml.YAMLError: Si el archivo YAML es inválido
    """
    logger.warning(
        "load_persona_config() está deprecada. Usa PersonaManager.load_persona() en su lugar."
    )

    # Import local para evitar dependencias circulares
    from .persona_manager import PersonaManager

    manager = PersonaManager()
    try:
        return manager.load_persona(persona_id)
    except FileNotFoundError:
        logger.warning("Usando configuración por defecto para %s", persona_id)
        return DEFAULT_PERSONA_CONFIG.copy()


def validate_io_mode(io_mode: str) -> str:
    """
    Valida y normaliza el modo de I/O.

    Args:
        io_mode: Modo de I/O a validar

    Returns:
        Modo de I/O validado
    """
    valid_modes = ["text", "voice", "hybrid"]

    if io_mode.lower() in valid_modes:
        return io_mode.lower()

    logger.warning("Modo de I/O inválido '%s', usando '%s'", io_mode, SystemConfig.DEFAULT_IO_MODE)
    return SystemConfig.DEFAULT_IO_MODE


def create_user_data(persona_id: str | None = None, io_mode: str | None = None) -> UserData:
    """
    Factory function para crear UserData con valores por defecto.

    ✅ CORREGIDO: Explicit Optional para argumentos que pueden ser None.

    Args:
        persona_id: ID de la personalidad inicial (opcional)
        io_mode: Modo de I/O inicial (opcional)

    Returns:
        Nueva instancia de UserData
    """
    return UserData(
        current_persona=persona_id or SystemConfig.DEFAULT_PERSONA,
        io_mode=validate_io_mode(io_mode or SystemConfig.DEFAULT_IO_MODE),
    )


def get_available_personas() -> list[str]:
    """
    Obtiene lista de personalidades disponibles.

    ✅ CORREGIDO: Type hint específico para List.

    Returns:
        Lista de identificadores de personalidades disponibles
    """
    if not PERSONAS_DIR.exists():
        logger.warning("Directorio de personas no existe: %s", PERSONAS_DIR)
        return []

    personas: list[str] = []

    for yaml_file in PERSONAS_DIR.glob("*.yaml"):
        persona_id = yaml_file.stem
        try:
            # Validar que la configuración es válida
            load_persona_config(persona_id)
            personas.append(persona_id)
        except Exception as e:
            logger.warning("Configuración inválida ignorada %s: %s", persona_id, str(e))

    logger.info("Personalidades disponibles: %s", personas)
    return sorted(personas)


def validate_persona_config(config: dict[str, Any]) -> bool:
    """
    Valida que una configuración de personalidad sea correcta.

    ✅ CORREGIDO: Type hints específicos.

    Args:
        config: Configuración a validar

    Returns:
        True si la configuración es válida

    Raises:
        ValueError: Si la configuración es inválida
    """
    required_fields = ["name", "instructions", "voice_id"]

    for field_name in required_fields:
        if field_name not in config:
            raise ValueError(f"Campo requerido faltante: {field_name}")

        if not isinstance(config[field_name], str) or not config[field_name].strip():
            raise ValueError(f"Campo '{field_name}' debe ser string no vacío")

    # Validaciones específicas
    if len(config["name"]) > 50:
        raise ValueError("Nombre de personalidad demasiado largo")

    if len(config["instructions"]) < 10:
        raise ValueError("Instrucciones demasiado cortas")

    # Validar campos opcionales si existen
    optional_string_fields = ["greeting", "farewell", "switch_message"]
    for field_name in optional_string_fields:
        if field_name in config and not isinstance(config[field_name], str):
            raise ValueError(f"Campo opcional '{field_name}' debe ser string")

    return True


def create_default_persona_config(persona_name: str, voice_id: str) -> dict[str, Any]:
    """
    Crea una configuración de personalidad por defecto.

    Args:
        persona_name: Nombre de la personalidad
        voice_id: ID de voz de ElevenLabs

    Returns:
        Configuración por defecto
    """
    return {
        "name": persona_name,
        "voice_id": voice_id,
        "instructions": f"Eres {persona_name}, un asistente virtual útil y amigable.",
        "greeting": f"¡Hola! Soy {persona_name}. ¿Cómo puedo ayudarte?",
        "farewell": "¡Hasta luego! Que tengas un excelente día.",
    }


def get_system_info() -> dict[str, Any]:
    """
    Obtiene información del sistema para debugging.

    ✅ CORREGIDO: Type hint específico.

    Returns:
        Información del sistema y configuración
    """
    import platform
    import sys

    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "personas_directory": str(PERSONAS_DIR),
        "log_level": SystemConfig.LOG_LEVEL,
        "default_persona": SystemConfig.DEFAULT_PERSONA,
        "default_io_mode": SystemConfig.DEFAULT_IO_MODE,
        "available_personas": get_available_personas(),
    }
