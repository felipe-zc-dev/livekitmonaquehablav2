"""
Gestión de personalidades - Módulo simplificado.
Ejemplo de modularidad correcta para LiveKit 1.0.
"""

import logging
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

# Directorio base para configuraciones
PERSONAS_DIR = Path(__file__).parent.parent / "personas"


class PersonaManager:
    """
    Gestor de personalidades simplificado.

    Ejemplo de cómo hacer modularidad correcta:
    - Clase simple y enfocada
    - Sin imports relativos
    - Fácil de testear
    - Compatible con LiveKit 1.0
    """

    def __init__(self) -> None:
        """Inicializa el gestor de personalidades."""
        self._cache: dict[str, dict[str, Any]] = {}

    def load_persona(self, persona_id: str) -> dict[str, Any]:
        """
        Carga configuración de personalidad desde archivo YAML.

        Args:
            persona_id: Identificador único de la personalidad

        Returns:
            Diccionario con la configuración completa

        Raises:
            FileNotFoundError: Si no existe el archivo
            ValueError: Si la configuración es inválida
        """
        # Revisar cache primero
        if persona_id in self._cache:
            return self._cache[persona_id]

        config_path = PERSONAS_DIR / f"{persona_id}.yaml"

        if not config_path.exists():
            logger.error("Archivo de personalidad no encontrado: %s", config_path)
            raise FileNotFoundError(f"Personalidad '{persona_id}' no encontrada")

        try:
            with open(config_path, encoding="utf-8") as file:
                config = yaml.safe_load(file)

            if not isinstance(config, dict):
                raise ValueError(f"Configuración inválida en {config_path}")

            # Validar campos requeridos
            self._validate_config(config, persona_id)

            # Guardar en cache
            self._cache[persona_id] = config

            logger.debug("Configuración cargada exitosamente: %s", persona_id)
            return config

        except yaml.YAMLError as e:
            logger.error("Error parseando YAML en %s: %s", config_path, str(e))
            raise
        except Exception as e:
            logger.error("Error inesperado cargando %s: %s", persona_id, str(e))
            raise

    def get_available_personas(self) -> list[str]:
        """
        Obtiene lista de personalidades disponibles.

        Returns:
            Lista de identificadores de personalidades
        """
        if not PERSONAS_DIR.exists():
            logger.warning("Directorio de personas no existe: %s", PERSONAS_DIR)
            return []

        personas = []
        for yaml_file in PERSONAS_DIR.glob("*.yaml"):
            persona_id = yaml_file.stem
            try:
                # Validar que la configuración es válida
                self.load_persona(persona_id)
                personas.append(persona_id)
            except Exception as e:
                logger.warning("Configuración inválida ignorada %s: %s", persona_id, str(e))

        logger.info("Personalidades disponibles: %s", personas)
        return sorted(personas)

    def _validate_config(self, config: dict[str, Any], persona_id: str) -> None:
        """
        Valida que una configuración de personalidad sea correcta.

        Args:
            config: Configuración a validar
            persona_id: ID de la personalidad para logs

        Raises:
            ValueError: Si la configuración es inválida
        """
        required_fields = ["name", "instructions", "voice_id"]

        for field_name in required_fields:
            if field_name not in config:
                raise ValueError(f"Campo requerido '{field_name}' faltante en {persona_id}")

            if not isinstance(config[field_name], str) or not config[field_name].strip():
                raise ValueError(f"Campo '{field_name}' debe ser string no vacío en {persona_id}")

        # Validaciones específicas
        if len(config["name"]) > 50:
            raise ValueError(f"Nombre de personalidad demasiado largo en {persona_id}")

        if len(config["instructions"]) < 10:
            raise ValueError(f"Instrucciones demasiado cortas en {persona_id}")

        # Validar campos opcionales si existen
        optional_string_fields = ["greeting", "farewell", "switch_message"]
        for field_name in optional_string_fields:
            if field_name in config and not isinstance(config[field_name], str):
                raise ValueError(f"Campo opcional '{field_name}' debe ser string en {persona_id}")

    def clear_cache(self) -> None:
        """Limpia el cache de personalidades."""
        self._cache.clear()
        logger.debug("Cache de personalidades limpiado")

    def reload_persona(self, persona_id: str) -> dict[str, Any]:
        """
        Recarga una personalidad específica.

        Args:
            persona_id: ID de la personalidad a recargar

        Returns:
            Configuración recargada
        """
        # Remover del cache
        if persona_id in self._cache:
            del self._cache[persona_id]

        # Cargar nuevamente
        return self.load_persona(persona_id)
