"""
Token server para LiveKit: expone endpoints para generar tokens y health-check.
✅ CORREGIDO: Rutas relativas + Render.com + LiveKit 1.0 + PEP 8
"""

import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from flask import Flask, Response, abort, jsonify, request, send_from_directory
from flask_cors import CORS

# ✅ IMPORTACIONES OFICIALES LIVEKIT 1.0
from livekit import api

# ✅ CONFIGURACIÓN DE LOGGING SIN LAZY FORMATTING
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Carga variables de entorno desde .env
load_dotenv()

# ✅ RUTAS RELATIVAS PORTABLES (Docker + Render.com)
BASE_DIR = Path(__file__).parent.resolve()
FRONTEND_DIR = BASE_DIR.parent / "frontend"

# Verificar que el directorio frontend existe
if not FRONTEND_DIR.exists():
    logger.warning("Directorio frontend no encontrado en: %s", FRONTEND_DIR)
    # Fallback para diferentes estructuras
    FRONTEND_DIR = BASE_DIR / "frontend"
    if not FRONTEND_DIR.exists():
        logger.error("No se encontró directorio frontend en ninguna ubicación")
        raise FileNotFoundError(f"Frontend directory not found: {FRONTEND_DIR}")

logger.info("Frontend directory: %s", FRONTEND_DIR)

# Verificar variables de entorno críticas
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

if not (API_KEY and API_SECRET and LIVEKIT_URL):
    raise RuntimeError("Faltan LIVEKIT_API_KEY, LIVEKIT_API_SECRET o LIVEKIT_URL en el entorno")

# ✅ CONFIGURACIÓN LIVEKIT 1.0
logger.info("🔧 Configuración LiveKit 1.0:")
logger.info("  URL: %s", LIVEKIT_URL)
logger.info("  Frontend: %s", FRONTEND_DIR)

# Verificar si URL es segura para micrófono
if not LIVEKIT_URL.startswith("wss://") and not LIVEKIT_URL.startswith("ws://localhost"):
    logger.warning(
        "⚠️ ADVERTENCIA: URL no segura para micrófono. "
        "Los navegadores requieren HTTPS/WSS. URL actual: %s",
        LIVEKIT_URL,
    )

# ✅ FLASK APP CON RUTAS RELATIVAS PORTABLES
app = Flask(
    __name__, static_folder=str(FRONTEND_DIR), static_url_path=""  # Ruta relativa calculada
)

# Configurar CORS correctamente
CORS(app, resources={r"/*": {"origins": "*"}})

# Diccionario para almacenar tokens activos
active_sessions: dict[str, dict[str, Any]] = {}

# ✅ LÍMITES SEGÚN DOCS LIVEKIT 1.0
MAX_METADATA_SIZE = 500
MAX_ATTRIBUTES_SIZE = 500


@app.route("/")
def index() -> Response:
    """
    Sirve la página principal de la aplicación.
    ✅ CORREGIDO: Usa ruta relativa portable
    """
    index_path = FRONTEND_DIR / "index.html"

    if not index_path.exists():
        logger.error("index.html no encontrado en: %s", index_path)
        abort(404, description="Frontend no disponible")

    try:
        return send_from_directory(str(FRONTEND_DIR), "index.html")
    except Exception as e:
        logger.error("Error sirviendo index.html: %s", str(e))
        abort(500, description="Error interno del servidor")


@app.route("/assets/<path:filename>")
def serve_assets(filename: str) -> Response:
    """
    Sirve archivos estáticos del frontend.
    ✅ NUEVO: Endpoint específico para assets
    """
    try:
        return send_from_directory(str(FRONTEND_DIR), filename)
    except Exception as e:
        logger.error("Error sirviendo asset %s: %s", filename, str(e))
        abort(404, description="Archivo no encontrado")


def generate_room_name(user_id: str) -> str:
    """
    Genera un nombre de sala determinista basado en el ID de usuario.

    Args:
        user_id: ID del usuario

    Returns:
        Nombre de sala consistente
    """
    room_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))[:8]
    return f"virtual_partner_{room_id}"


def _check_existing_token(
    user_id: str, room: str, io_mode: str, persona_id: str
) -> Response | None:
    """Verifica si existe un token activo y válido para reutilizar."""
    if user_id in active_sessions and "token" in active_sessions[user_id]:
        session_info = active_sessions[user_id]
        metadata_value = session_info.get("metadata", {})
        session_metadata: dict[str, str] = (
            {} if not isinstance(metadata_value, dict) else metadata_value
        )

        if (
            session_metadata.get("io_mode") != io_mode
            or session_metadata.get("persona_id") != persona_id
        ):
            return None

        created_at = datetime.fromisoformat(session_info.get("created_at", ""))
        if (datetime.now() - created_at).total_seconds() < 480:  # 8 minutos
            if session_info.get("room") == room:
                logger.info("♻️ Reutilizando token para %s en sala %s", user_id, room)
                return _corsify_actual_response(
                    jsonify(
                        url=LIVEKIT_URL,
                        token=session_info["token"],
                        room=room,
                        user_id=user_id,
                        metadata=session_metadata,
                    )
                )
    return None


def _validate_request_data(data: dict[str, Any]) -> tuple[str, str, str, str, str]:
    """
    Valida y extrae datos de la request.
    ✅ FUNCIÓN SEPARADA: Reduce complejidad de get_token()
    """
    # Obtener o generar identity
    identity = str(data.get("identity", ""))
    if not identity:
        identity = f"user_{uuid.uuid4().hex[:8]}"
        logger.info("Identity generada: %s", identity)

    # Obtener o generar user_id
    user_id = str(data.get("user_id", ""))
    if not user_id:
        user_id = identity
        logger.info("Usando identity como user_id: %s", user_id)

    # Obtener o generar nombre de sala
    room = str(data.get("room", ""))
    if not room:
        room = generate_room_name(user_id)
        logger.info("Sala generada para %s: %s", user_id, room)

    # Validar modo de comunicación
    io_mode = str(data.get("io_mode", "hybrid")).lower()
    if io_mode not in ["text", "voice", "hybrid"]:
        logger.warning("Modo de IO inválido: %s, usando 'hybrid'", io_mode)
        io_mode = "hybrid"

    # Obtener personalidad
    persona_id = str(data.get("persona_id", "rosalia"))
    if not persona_id:
        persona_id = "rosalia"

    return identity, user_id, room, io_mode, persona_id


def _create_metadata(io_mode: str, persona_id: str) -> tuple[dict[str, str], str]:
    """
    Crea metadatos validados según LiveKit 1.0.
    """
    metadata = {"io_mode": io_mode, "persona_id": persona_id}
    metadata_str = json.dumps(metadata)

    # Validación de tamaños
    if len(metadata_str) > MAX_METADATA_SIZE:
        logger.warning(
            "Metadatos exceden %d caracteres (%d), truncando",
            MAX_METADATA_SIZE,
            len(metadata_str),
        )
        metadata_str = metadata_str[:MAX_METADATA_SIZE]

    return metadata, metadata_str


def _create_access_token(
    identity: str, room: str, io_mode: str, persona_id: str, metadata_str: str
) -> str:
    """
    Crea un AccessToken de LiveKit 1.0 usando el patrón oficial.
    ✅ ACTUALIZADO: Según documentación LiveKit 1.0
    """
    try:
        # ✅ VIDEOGRANTS COMPLETO LIVEKIT 1.0
        grants = api.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            can_update_own_metadata=True,
            hidden=False,
            recorder=False,
            agent=False,
            room_admin=False,
            room_create=False,
            room_list=False,
            room_record=False,
            ingress_admin=False,
        )

        # ✅ CONFIGURACIÓN DE TOKEN LIVEKIT 1.0
        token_builder = (
            api.AccessToken(api_key=API_KEY, api_secret=API_SECRET)
            .with_identity(identity)
            .with_name(identity)
            .with_ttl(timedelta(minutes=10))
            .with_metadata(metadata_str)
            .with_attributes({"io_mode": io_mode, "persona_id": persona_id})
            .with_grants(grants)
        )

        # ✅ AGENT DISPATCH LIVEKIT 1.0 (opcional)
        try:
            room_config = api.RoomConfiguration(
                agents=[api.RoomAgentDispatch(agent_name="monaquehabla", metadata=metadata_str)]
            )
            token_builder = token_builder.with_room_config(room_config)
            logger.debug("✅ RoomAgentDispatch configurado para LiveKit 1.0")
        except (AttributeError, TypeError) as e:
            logger.warning("⚠️ RoomConfiguration no disponible: %s", str(e))

        return token_builder.to_jwt()

    except Exception as e:
        logger.error("❌ Error creando AccessToken: %s", str(e), exc_info=True)
        raise


def _save_session(
    user_id: str, token: str, room: str, identity: str, metadata: dict[str, str]
) -> None:
    """Guarda la sesión del usuario."""
    active_sessions[user_id] = {
        "token": token,
        "room": room,
        "identity": identity,
        "created_at": datetime.now().isoformat(),
        "metadata": metadata,
    }


@app.route("/getToken", methods=["POST", "OPTIONS"])
def get_token() -> Response:
    """
    Genera y devuelve un token JWT para conectar a una sala de LiveKit 1.0.
    ✅ REFACTORIZADO: Complejidad reducida + LiveKit 1.0 patterns
    """
    # Manejar preflight OPTIONS
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    try:
        # ✅ VALIDACIÓN INICIAL
        data = request.get_json(silent=True)
        if not data:
            logger.warning("Solicitud sin JSON válido")
            abort(400, description="Se requiere un cuerpo JSON válido")

        # ✅ VALIDAR Y EXTRAER DATOS
        identity, user_id, room, io_mode, persona_id = _validate_request_data(data)

        # ✅ CREAR METADATOS
        metadata, metadata_str = _create_metadata(io_mode, persona_id)

        logger.info(
            "🎯 Token request: user_id=%s, io_mode=%s, persona_id=%s", user_id, io_mode, persona_id
        )

        # ✅ VERIFICAR TOKEN EXISTENTE
        existing_token_response = _check_existing_token(user_id, room, io_mode, persona_id)
        if existing_token_response:
            return existing_token_response

        # ✅ CREAR NUEVO TOKEN
        token = _create_access_token(identity, room, io_mode, persona_id, metadata_str)

        # ✅ GUARDAR SESIÓN
        _save_session(user_id, token, room, identity, metadata)

        logger.info(
            "✅ Token generado para %s en sala %s (io_mode=%s, persona=%s)",
            user_id,
            room,
            io_mode,
            persona_id,
        )

        # ✅ RESPONDER
        return _corsify_actual_response(
            jsonify(
                url=LIVEKIT_URL,
                token=token,
                room=room,
                user_id=user_id,
                metadata=metadata,
            )
        )

    except json.JSONDecodeError as e:
        logger.error("Error en formato JSON: %s", str(e))
        response = jsonify(error="Error en formato JSON", message=str(e))
        return _corsify_actual_response(response, 400)
    except ValueError as e:
        logger.error("Error de validación: %s", str(e))
        response = jsonify(error="Error de validación", message=str(e))
        return _corsify_actual_response(response, 400)
    except Exception as e:
        logger.error("❌ Error inesperado generando token: %s", str(e), exc_info=True)
        response = jsonify(error="Error del servidor", message=str(e))
        return _corsify_actual_response(response, 500)


@app.route("/revokeToken", methods=["POST"])
def revoke_token() -> Response:
    """Revoca un token de sesión existente."""
    try:
        data = request.get_json(silent=True)
        if not data or "user_id" not in data:
            abort(400, description="Se requiere user_id")

        user_id = str(data["user_id"])
        is_active = user_id in active_sessions

        if is_active:
            del active_sessions[user_id]
            logger.info("🗑️ Token revocado para usuario %s", user_id)
            return jsonify(success=True, message="Token revocado correctamente")
        else:
            logger.warning("⚠️ Intento de revocar token inexistente: %s", user_id)
            return jsonify(success=False, message="No se encontró sesión activa")

    except (TypeError, ValueError, KeyError) as e:
        logger.error("Error en datos de solicitud: %s", str(e))
        return jsonify(success=False, message=f"Error en datos: {str(e)}")
    except Exception as e:
        logger.error("❌ Error inesperado revocando token: %s", str(e), exc_info=True)
        return jsonify(success=False, message=f"Error interno: {str(e)}")


@app.route("/userStatus", methods=["GET"])
def user_status() -> Response:
    """Verifica el estado de un usuario."""
    user_id = request.args.get("user_id")
    if not user_id:
        abort(400, description="Se requiere parámetro user_id")

    is_active = user_id in active_sessions
    response_data: dict[str, Any] = {"active": is_active}

    if is_active:
        session_info = dict(active_sessions[user_id])
        if "token" in session_info:
            del session_info["token"]  # No devolver token por seguridad
        response_data["session_info"] = session_info

    return jsonify(response_data)


def _build_cors_preflight_response() -> Response:
    """Construye una respuesta de preflight para CORS."""
    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response


def _corsify_actual_response(response: Response, status: int = 200) -> Response:
    """Agrega encabezados CORS a una respuesta."""
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.status_code = status
    return response


@app.route("/health", methods=["GET"])
def health() -> Response:
    """
    Endpoint de health-check para Render.com.
    ✅ ACTUALIZADO: Con información de configuración
    """
    stats = {
        "status": "ok",
        "active_sessions": len(active_sessions),
        "livekit_url": LIVEKIT_URL,
        "livekit_version": "1.0.x",
        "frontend_dir": str(FRONTEND_DIR),
        "frontend_exists": FRONTEND_DIR.exists(),
        "agent_dispatch": "monaquehabla",
        "max_metadata_size": MAX_METADATA_SIZE,
        "deployment": "render.com",
    }
    return jsonify(stats)


@app.route("/system_info", methods=["GET"])
def system_info() -> Response:
    """Información del sistema para debugging."""
    try:
        info = {
            "deployment": {
                "platform": "render.com",
                "base_dir": str(BASE_DIR),
                "frontend_dir": str(FRONTEND_DIR),
                "frontend_exists": FRONTEND_DIR.exists(),
            },
            "livekit": {
                "version": "1.0.x",
                "python_sdk": "livekit-api",
                "agents_framework": "livekit-agents~=1.0.19",
                "url": LIVEKIT_URL,
            },
            "features": {
                "video_grants_complete": True,
                "metadata_support": True,
                "attributes_support": True,
                "agent_dispatch": True,
                "room_configuration": True,
                "cors_enabled": True,
                "relative_paths": True,
            },
            "limits": {
                "metadata_max_size": MAX_METADATA_SIZE,
                "attributes_max_size": MAX_ATTRIBUTES_SIZE,
                "token_ttl_minutes": 10,
            },
        }
        return jsonify(info)
    except Exception as e:
        logger.error("❌ Error obteniendo info del sistema: %s", str(e))
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    port_str = os.getenv("PORT", "8000")
    try:
        port = int(port_str)
    except ValueError as exc:
        raise RuntimeError(f"Puerto inválido: {port_str}") from exc

    logger.info("🚀 Iniciando Token Server CORREGIDO para Render.com")
    logger.info("🔗 LiveKit URL: %s", LIVEKIT_URL)
    logger.info("📁 Frontend Dir: %s", FRONTEND_DIR)
    logger.info("✅ CORRECCIONES APLICADAS:")
    logger.info("  🎯 Rutas relativas portables (Docker + Render.com)")
    logger.info("  📏 Sin lazy formatting en logging (PEP 8)")
    logger.info("  🔧 LiveKit 1.0 patterns oficiales")
    logger.info("  🌐 CORS configurado correctamente")
    logger.info("  📊 Health checks para Render.com")

    # ✅ BIND 0.0.0.0 para Render.com
    app.run(host="0.0.0.0", port=port)
