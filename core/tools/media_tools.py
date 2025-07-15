"""
Media Handling Tools - LiveKit 1.0 CORREGIDO
============================================

Tools para manejo de media (fotos, audio, uploads) con estructura preparada.
✅ FIXED: create_user_friendly_error calls eliminadas
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
    validate_numeric_param,
    validate_string_param,
    validate_tool_context,
)

logger = logging.getLogger(__name__)


# ==========================================
# FILE OPERATIONS - CORREGIDOS
# ==========================================


@function_tool
async def upload_file(context: RunContext[UserData], file_type: str = "any") -> dict[str, Any]:
    """
    Triggers a file upload dialog for the user to share documents, images, or other files.

    SUPPORTED FILE TYPES:
    - image: Photos, screenshots, diagrams (jpg, png, gif, webp)
    - document: Text files, PDFs, presentations (pdf, txt, docx, pptx)
    - audio: Audio recordings for analysis (mp3, wav, m4a)
    - any: Allow any file type

    Args:
        file_type: Type of file to accept (image, document, audio, any)

    Returns:
        Information about the uploaded file

    Raises:
        ToolError: If upload fails or file type is invalid
    """
    with ToolTimer("upload_file") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            file_type_clean = validate_string_param(
                file_type, "file_type", allowed_values=["image", "document", "audio", "any"]
            )

            logger.info("📁 Requesting file upload: type=%s", file_type_clean)

            config = {
                "image": {"maxSize": 10 * 1024 * 1024, "accept": "image/*"},
                "document": {"maxSize": 25 * 1024 * 1024, "accept": ".pdf,.txt,.docx,.pptx"},
                "audio": {"maxSize": 50 * 1024 * 1024, "accept": "audio/*"},
                "any": {"maxSize": 100 * 1024 * 1024, "accept": "*/*"},
            }

            upload_config = config.get(file_type_clean, config["any"])

            payload = {
                "fileType": file_type_clean,
                "maxSize": upload_config["maxSize"],
                "accept": upload_config["accept"],
                "multiple": False,
            }

            response = await perform_rpc_call(context, "uploadFile", payload, timeout=120.0)

            if not response.get("success"):
                error_msg = response.get("error", "File upload failed")
                raise ToolError(f"Upload failed: {error_msg}")

            file_info = response.get("file", {})

            if not file_info.get("name"):
                raise ToolError("Invalid file information received")

            logger.info(
                "📎 File uploaded: %s (%s bytes)",
                file_info.get('name', 'unknown'),
                file_info.get('size', 0),
            )

            result = {
                "filename": file_info.get('name'),
                "size": file_info.get('size'),
                "type": file_info.get('type'),
                "url": file_info.get('url'),
                "upload_time": time.time(),
                "success": True,
            }

            log_tool_usage("upload_file", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            # ✅ FIXED: Simplified error handling
            error = handle_tool_error(
                e,
                "upload_file",
                "Unable to upload file. Please check file size and format.",
                ToolErrorCodes.MEDIA_SIZE_EXCEEDED,
            )
            log_tool_error("upload_file", error, context.userdata)
            raise error from e


@function_tool
async def download_data(
    context: RunContext[UserData], data: str, filename: str, content_type: str = "text/plain"
) -> str:
    """
    Triggers a download of data to the user's device.

    SUPPORTED CONTENT TYPES:
    - text/plain: Plain text files
    - application/json: JSON data
    - text/csv: CSV spreadsheets
    - application/pdf: PDF documents (future)

    Args:
        data: Data content to download
        filename: Name for the downloaded file
        content_type: MIME type of the content

    Returns:
        Download status confirmation

    Raises:
        ToolError: If download fails or data is invalid
    """
    with ToolTimer("download_data") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            validate_string_param(data, "data", min_length=1, max_length=1000000)
            filename_clean = validate_string_param(
                filename, "filename", min_length=1, max_length=255
            )
            content_type_clean = validate_string_param(content_type, "content_type")

            logger.info("💾 Preparing download: %s (%d bytes)", filename_clean, len(data))

            payload = {
                "data": data,
                "filename": filename_clean,
                "contentType": content_type_clean,
                "size": len(data),
                "timestamp": time.time(),
            }

            response = await perform_rpc_call(context, "downloadData", payload, timeout=30.0)

            if not response.get("success"):
                error_msg = response.get("error", "Download failed")
                raise ToolError(f"Download failed: {error_msg}")

            result = f"Download initiated: {filename_clean} ({len(data)} bytes)"

            logger.info("💾 Download successful: %s", filename_clean)
            log_tool_usage("download_data", userdata, result, timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "download_data", "Unable to prepare download. Please try again."
            )
            log_tool_error("download_data", error, context.userdata)
            raise error from e


# ==========================================
# MEDIA CAPTURE TOOLS - CORREGIDOS
# ==========================================


@function_tool
async def capture_photo(context: RunContext[UserData]) -> dict[str, Any]:
    """
    Triggers the device camera to capture a photo for analysis or discussion.

    PRIVACY NOTES:
    - Requires camera permission from user
    - Photo is processed temporarily and not permanently stored
    - User has full control over when to take photo

    Returns:
        Information about the captured photo and initial analysis

    Raises:
        ToolError: If camera access is denied or unavailable
    """
    with ToolTimer("capture_photo") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            logger.info("📸 Requesting photo capture from user")

            payload = {
                "quality": 0.8,
                "maxWidth": 1920,
                "maxHeight": 1080,
                "facing": "user",
            }

            response = await perform_rpc_call(context, "capturePhoto", payload, timeout=30.0)

            if not response.get("success"):
                error_msg = response.get("error", "Photo capture failed")
                raise ToolError(f"Camera access failed: {error_msg}")

            photo_info = response.get("photo", {})

            if not photo_info.get("dataUrl"):
                raise ToolError("Invalid photo data received")

            logger.info(
                "📷 Photo captured: %dx%d pixels",
                photo_info.get('width', 0),
                photo_info.get('height', 0),
            )

            result = {
                "width": photo_info.get('width'),
                "height": photo_info.get('height'),
                "dataUrl": photo_info.get('dataUrl'),
                "size": photo_info.get('size', 0),
                "capture_time": time.time(),
                "success": True,
            }

            log_tool_usage("capture_photo", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            # ✅ FIXED: Simplified error handling
            error = handle_tool_error(
                e,
                "capture_photo",
                "Unable to capture photo. Please check camera permissions.",
                ToolErrorCodes.MEDIA_ACCESS_DENIED,
            )
            log_tool_error("capture_photo", error, context.userdata)
            raise error from e


@function_tool
async def record_audio(context: RunContext[UserData], duration_seconds: int = 10) -> dict[str, Any]:
    """
    Records audio from the user's microphone for analysis or processing.

    PRIVACY NOTES:
    - Requires microphone permission
    - Audio is processed temporarily
    - Recording duration is limited for privacy

    Args:
        duration_seconds: Length of recording (1-60 seconds)

    Returns:
        Information about the recorded audio

    Raises:
        ToolError: If microphone access denied or duration invalid
    """
    with ToolTimer("record_audio") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            duration_validated = validate_numeric_param(
                duration_seconds, "duration_seconds", min_value=1, max_value=60
            )

            logger.info("🎤 Requesting audio recording: %d seconds", duration_validated)

            payload = {
                "duration": duration_validated,
                "format": "webm",
                "sampleRate": 44100,
                "channels": 1,
            }

            response = await perform_rpc_call(
                context, "recordAudio", payload, timeout=duration_validated + 15.0
            )

            if not response.get("success"):
                error_msg = response.get("error", "Audio recording failed")
                raise ToolError(f"Microphone access failed: {error_msg}")

            audio_info = response.get("audio", {})

            if not audio_info.get("dataUrl"):
                raise ToolError("Invalid audio data received")

            logger.info("🎵 Audio recorded: %.1f seconds", audio_info.get('duration', 0))

            result = {
                "duration": audio_info.get('duration'),
                "dataUrl": audio_info.get('dataUrl'),
                "format": audio_info.get('format'),
                "size": audio_info.get('size', 0),
                "record_time": time.time(),
                "success": True,
            }

            log_tool_usage("record_audio", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            # ✅ FIXED: Simplified error handling
            error = handle_tool_error(
                e,
                "record_audio",
                "Unable to record audio. Please check microphone permissions.",
                ToolErrorCodes.MEDIA_ACCESS_DENIED,
            )
            log_tool_error("record_audio", error, context.userdata)
            raise error from e


# ==========================================
# MEDIA PROCESSING TOOLS (MOCKUPS) - SIN CAMBIOS
# ==========================================


@function_tool
async def process_image(
    context: RunContext[UserData], image_url: str, processing_type: str = "analyze"
) -> dict[str, Any]:
    """
    Processes an uploaded image with AI analysis.
    MOCKUP TOOL - Structure ready for implementation.
    """
    with ToolTimer("process_image") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            validate_string_param(image_url, "image_url", min_length=1)
            processing_type_clean = validate_string_param(
                processing_type,
                "processing_type",
                allowed_values=["analyze", "ocr", "objects", "faces"],
            )

            logger.info("🖼️ Processing image: %s", processing_type_clean)

            mockup_results = {
                "analyze": {
                    "description": "A bright, colorful photo showing...",
                    "objects": ["person", "building", "sky"],
                    "colors": ["blue", "white", "green"],
                    "confidence": 0.95,
                },
                "ocr": {
                    "text": "Extracted text from image...",
                    "regions": [{"text": "Sample text", "confidence": 0.9}],
                },
                "objects": {
                    "detected": [
                        {"name": "person", "confidence": 0.98, "bounds": [10, 20, 100, 200]},
                        {"name": "car", "confidence": 0.85, "bounds": [150, 50, 250, 150]},
                    ]
                },
                "faces": {
                    "count": 1,
                    "faces": [{"confidence": 0.95, "bounds": [50, 60, 150, 160]}],
                },
            }

            result = {
                "processing_type": processing_type_clean,
                "results": mockup_results.get(processing_type_clean, {}),
                "processing_time": timer.execution_time,
                "success": True,
            }

            log_tool_usage("process_image", userdata, str(result), timer.execution_time)
            return result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "process_image", "Unable to process image. Please try again."
            )
            log_tool_error("process_image", error, context.userdata)
            raise error from e


@function_tool
async def transcribe_audio(
    context: RunContext[UserData], audio_url: str, language: str = "es"
) -> dict[str, Any]:
    """
    Transcribes uploaded audio to text.
    MOCKUP TOOL - Structure ready for implementation.
    """
    with ToolTimer("transcribe_audio") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            validate_string_param(audio_url, "audio_url", min_length=1)
            language_clean = validate_string_param(
                language, "language", allowed_values=["es", "en", "auto"]
            )

            logger.info("🎵 Transcribing audio: language=%s", language_clean)

            mockup_result = {
                "transcript": "Hola, este es un ejemplo de transcripción de audio...",
                "language_detected": "es",
                "confidence": 0.92,
                "duration": 15.3,
                "words": [
                    {"word": "Hola", "start": 0.1, "end": 0.5, "confidence": 0.95},
                    {"word": "este", "start": 0.6, "end": 0.9, "confidence": 0.88},
                ],
                "processing_time": timer.execution_time,
                "success": True,
            }

            log_tool_usage("transcribe_audio", userdata, str(mockup_result), timer.execution_time)
            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "transcribe_audio", "Unable to transcribe audio. Please try again."
            )
            log_tool_error("transcribe_audio", error, context.userdata)
            raise error from e


# ==========================================
# MEDIA UTILITY FUNCTIONS - SIN CAMBIOS
# ==========================================


def validate_media_url(url: str, media_type: str) -> str:
    """
    Validates a media URL format.

    Args:
        url: URL to validate
        media_type: Expected media type

    Returns:
        Validated URL

    Raises:
        ToolError: If URL is invalid
    """
    if not url or not isinstance(url, str):
        raise ToolError(f"Invalid {media_type} URL")

    if not (url.startswith("data:") or url.startswith("http")):
        raise ToolError(f"Invalid {media_type} URL format")

    return url.strip()


def get_media_info_from_url(url: str) -> dict[str, Any]:
    """
    Extracts media information from a data URL.

    Args:
        url: Data URL to analyze

    Returns:
        Media information dictionary
    """
    if not url.startswith("data:"):
        return {"type": "external", "url": url}

    try:
        header, data = url.split(",", 1)
        media_type = header.split(":")[1].split(";")[0]

        return {
            "type": "data_url",
            "media_type": media_type,
            "size": len(data),
            "encoding": "base64" if "base64" in header else "raw",
        }

    except Exception:
        return {"type": "unknown", "url": url}
