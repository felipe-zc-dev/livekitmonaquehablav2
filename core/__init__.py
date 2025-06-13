"""
Core module - Funcionalidades principales del sistema.
"""

import platform
import sys
from pathlib import Path

from .config import SystemConfig, UserData, create_user_data, validate_io_mode

__version__ = "1.0.0"

__all__ = [
    "SystemConfig",
    "UserData",
    "create_user_data",
    "validate_io_mode",
    "__version__",
]


def setup_core_system() -> None:
    """Inicializa el sistema core."""
    SystemConfig.setup_logging()


def get_system_info() -> dict[str, str]:
    """Obtiene información del sistema."""

    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "core_version": __version__,
        "personas_directory": str(Path(__file__).parent.parent / "personas"),
    }
