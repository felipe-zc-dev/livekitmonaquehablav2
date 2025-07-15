"""
External Tools - LiveKit 1.0
============================

Tools para integración con APIs externas y RAG (mockups preparados).
Estructura lista para implementación de integraciones reales.

TOOLS INCLUDED:
- RAG Tools: search_knowledge_base, query_documents
- API Integrations: get_weather, search_web
- MCP Integration: load_mcp_tools (preparado para futuro)
- External Services: translate_text, analyze_sentiment (mockups)

PATTERNS:
✅ Mockup tools con estructura real
✅ Error handling para APIs externas
✅ Rate limiting y timeout management
✅ Preparado para integraciones reales
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
    validate_numeric_param,
    validate_string_param,
    validate_tool_context,
)

logger = logging.getLogger(__name__)


# ==========================================
# RAG TOOLS (MOCKUPS)
# ==========================================


@function_tool
async def search_knowledge_base(
    context: RunContext[UserData], query: str, max_results: int = 5
) -> dict[str, Any]:
    """
    Searches the knowledge base for relevant information.

    This tool queries an internal knowledge base to find relevant documents,
    FAQs, or information that can help answer user questions.

    MOCKUP TOOL - Structure ready for real RAG implementation.

    WHEN TO USE:
    - User asks questions that require domain-specific knowledge
    - Need to lookup factual information
    - User wants specific documentation or guides
    - Complex queries requiring authoritative sources

    EXAMPLES:
    - "How do I configure the system?"
    - "What are the privacy policies?"
    - "Find information about LiveKit agents"

    Args:
        query: Search query for the knowledge base
        max_results: Maximum number of results to return (1-20)

    Returns:
        Search results with relevance scores and content

    Raises:
        ToolError: If search fails or query is invalid
    """
    with ToolTimer("search_knowledge_base") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            # Validate parameters
            query_clean = validate_string_param(query, "query", min_length=3, max_length=500)
            max_results_validated = validate_numeric_param(
                max_results, "max_results", min_value=1, max_value=20
            )

            logger.info("🔍 Knowledge base search: '%s'", query_clean[:50])

            # This would perform actual RAG search in real implementation
            mockup_results = {
                "query": query_clean,
                "total_results": 3,
                "search_time": timer.execution_time,
                "results": [
                    {
                        "id": "kb_001",
                        "title": "Getting Started with LiveKit Agents",
                        "content": "LiveKit Agents framework enables you to build...",
                        "relevance_score": 0.95,
                        "source": "docs/getting-started.md",
                        "last_updated": "2024-01-10",
                    },
                    {
                        "id": "kb_002",
                        "title": "Tool Definition Best Practices",
                        "content": "When creating tools for your agent, follow these guidelines...",
                        "relevance_score": 0.87,
                        "source": "docs/tools.md",
                        "last_updated": "2024-01-08",
                    },
                    {
                        "id": "kb_003",
                        "title": "Error Handling in Agents",
                        "content": "Proper error handling ensures robust agent behavior...",
                        "relevance_score": 0.82,
                        "source": "docs/error-handling.md",
                        "last_updated": "2024-01-05",
                    },
                ],
            }

            # Log successful usage
            log_tool_usage(
                "search_knowledge_base", userdata, str(mockup_results), timer.execution_time
            )

            return mockup_results

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "search_knowledge_base",
                "Unable to search knowledge base. Please try with a different query.",
                ToolErrorCodes.EXTERNAL_API_TIMEOUT,
            )
            log_tool_error("search_knowledge_base", error, context.userdata)
            raise error from e


@function_tool
async def query_documents(
    context: RunContext[UserData], document_id: str, question: str
) -> dict[str, Any]:
    """
    Queries a specific document for targeted information.

    This tool performs targeted queries against specific documents in the
    knowledge base, useful for getting precise answers from known sources.

    MOCKUP TOOL - Structure ready for document-specific RAG.

    WHEN TO USE:
    - User references a specific document
    - Need precise information from a known source
    - Follow-up questions on previous search results
    - Document-specific analysis

    EXAMPLES:
    - "What does the privacy policy say about data retention?"
    - "Find the installation steps in the setup guide"
    - "Query the troubleshooting document about connection issues"

    Args:
        document_id: ID of the specific document to query
        question: Specific question to ask about the document

    Returns:
        Targeted answer with document context and citations

    Raises:
        ToolError: If document not found or query fails
    """
    with ToolTimer("query_documents") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            # Validate parameters
            doc_id_clean = validate_string_param(document_id, "document_id", max_length=100)
            question_clean = validate_string_param(
                question, "question", min_length=5, max_length=500
            )

            logger.info("📄 Document query: %s -> '%s'", doc_id_clean, question_clean[:50])

            # This would perform actual document querying in real implementation
            mockup_result = {
                "document_id": doc_id_clean,
                "question": question_clean,
                "answer": (
                    "Based on the document content, here's the relevant information: "
                    "LiveKit Agents provides comprehensive error handling through the "
                    "ToolError exception class, which allows for user-friendly error messages..."
                ),
                "confidence": 0.91,
                "citations": [
                    {
                        "section": "Error Handling Patterns",
                        "page": 15,
                        "text_snippet": "Use ToolError for all tool-related exceptions...",
                    }
                ],
                "document_info": {
                    "title": "LiveKit Agents Documentation",
                    "version": "1.0",
                    "last_updated": "2024-01-10",
                },
                "query_time": timer.execution_time,
            }

            # Log successful usage
            log_tool_usage("query_documents", userdata, str(mockup_result), timer.execution_time)

            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "query_documents",
                f"Unable to query document '{document_id}'.Document may not exist or be accessible",
            )
            log_tool_error("query_documents", error, context.userdata)
            raise error from e


# ==========================================
# API INTEGRATION TOOLS (MOCKUPS)
# ==========================================


@function_tool
async def get_weather(
    context: RunContext[UserData], location: str, units: str = "metric"
) -> dict[str, Any]:
    """
    Gets current weather information for a specified location.

    This tool integrates with weather APIs to provide current conditions,
    forecasts, and weather-related information.

    MOCKUP TOOL - Structure ready for weather API integration.

    WHEN TO USE:
    - User asks about weather conditions
    - Location-based weather queries
    - Planning conversations requiring weather data
    - Travel or outdoor activity discussions

    EXAMPLES:
    - "What's the weather like in Barcelona?"
    - "Will it rain today?"
    - "What's the temperature outside?"

    Args:
        location: Location for weather query (city, coordinates, etc.)
        units: Temperature units (metric, imperial, kelvin)

    Returns:
        Current weather conditions and forecast data

    Raises:
        ToolError: If weather data unavailable or location invalid
    """
    with ToolTimer("get_weather") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            # Validate parameters
            location_clean = validate_string_param(
                location, "location", min_length=2, max_length=100
            )
            units_clean = validate_string_param(
                units, "units", allowed_values=["metric", "imperial", "kelvin"]
            )

            logger.info("🌤️ Weather query: %s (%s)", location_clean, units_clean)

            # This would call actual weather API in real implementation
            temperature_unit = (
                "°C" if units_clean == "metric" else "°F" if units_clean == "imperial" else "K"
            )
            temp_value = 22 if units_clean == "metric" else 72 if units_clean == "imperial" else 295

            mockup_result = {
                "location": location_clean,
                "current": {
                    "temperature": temp_value,
                    "temperature_unit": temperature_unit,
                    "condition": "Partly Cloudy",
                    "humidity": 65,
                    "wind_speed": 12,
                    "wind_direction": "NW",
                    "visibility": 10,
                    "uv_index": 6,
                },
                "forecast": [
                    {
                        "day": "Today",
                        "high": temp_value + 3,
                        "low": temp_value - 5,
                        "condition": "Partly Cloudy",
                    },
                    {
                        "day": "Tomorrow",
                        "high": temp_value + 1,
                        "low": temp_value - 3,
                        "condition": "Sunny",
                    },
                ],
                "last_updated": time.time(),
                "units": units_clean,
            }

            # Log successful usage
            log_tool_usage("get_weather", userdata, str(mockup_result), timer.execution_time)

            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "get_weather",
                f"Unable to get weather for '{location}'. Please try a different location.",
                ToolErrorCodes.EXTERNAL_API_TIMEOUT,
            )
            log_tool_error("get_weather", error, context.userdata)
            raise error from e


@function_tool
async def search_web(
    context: RunContext[UserData], query: str, max_results: int = 5
) -> dict[str, Any]:
    """
    Performs a web search for current information.

    This tool searches the internet for up-to-date information on topics
    that may not be in the agent's training data or knowledge base.

    MOCKUP TOOL - Structure ready for web search API integration.

    WHEN TO USE:
    - User asks about recent events or news
    - Need current information not in knowledge base
    - Real-time data queries
    - Fact-checking or verification needs

    EXAMPLES:
    - "What's the latest news about AI?"
    - "Search for recent developments in renewable energy"
    - "Find current stock prices"

    Args:
        query: Search query for the web
        max_results: Maximum number of results to return (1-10)

    Returns:
        Web search results with titles, descriptions, and URLs

    Raises:
        ToolError: If search fails or query is invalid
    """
    with ToolTimer("search_web") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            # Validate parameters
            query_clean = validate_string_param(query, "query", min_length=3, max_length=200)
            max_results_validated = validate_numeric_param(
                max_results, "max_results", min_value=1, max_value=10
            )

            logger.info("🌐 Web search: '%s'", query_clean[:50])

            # This would call actual search API in real implementation
            mockup_results = {
                "query": query_clean,
                "total_results": max_results_validated,
                "search_time": timer.execution_time,
                "results": [
                    {
                        "title": "Latest AI Developments - TechNews",
                        "description": "Recent advances ",
                        "url": "https://example.com/ai-news-latest",
                        "published_date": "2024-01-10",
                        "source": "TechNews",
                        "relevance_score": 0.94,
                    },
                    {
                        "title": "AI Safety Research Update",
                        "description": "New findings ",
                        "url": "https://example.com/ai-safety-update",
                        "published_date": "2024-01-09",
                        "source": "AI Research Journal",
                        "relevance_score": 0.89,
                    },
                ],
            }

            # Log successful usage
            log_tool_usage("search_web", userdata, str(mockup_results), timer.execution_time)

            return mockup_results

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "search_web",
                "Unable to perform web search. Please try a different query or check connectivity.",
                ToolErrorCodes.EXTERNAL_API_TIMEOUT,
            )
            log_tool_error("search_web", error, context.userdata)
            raise error from e


# ==========================================
# MCP INTEGRATION (PREPARED FOR FUTURE)
# ==========================================


@function_tool
async def load_mcp_tools(context: RunContext[UserData], server_url: str) -> dict[str, Any]:
    """
    Loads tools from a Model Context Protocol (MCP) server.

    This tool integrates with MCP servers to dynamically load external tools
    and capabilities, expanding the agent's functionality.

    MOCKUP TOOL - Structure ready for MCP integration.

    WHEN TO USE:
    - Need to connect to external tool providers
    - Dynamic tool loading based on user needs
    - Integration with third-party services
    - Expanding agent capabilities on demand

    EXAMPLES:
    - "Connect to the company tools server"
    - "Load additional capabilities from MCP"
    - "Access external service tools"

    Args:
        server_url: URL of the MCP server to connect to

    Returns:
        Information about loaded tools and capabilities

    Raises:
        ToolError: If MCP server connection fails
    """
    with ToolTimer("load_mcp_tools") as timer:
        try:
            # Validate context
            validate_tool_context(context)
            userdata = context.userdata

            # Validate server URL
            server_url_clean = validate_string_param(server_url, "server_url", min_length=10)

            if not (
                server_url_clean.startswith("http://") or server_url_clean.startswith("https://")
            ):
                raise ToolError("Server URL must start with http:// or https://")

            logger.info("🔌 MCP server connection: %s", server_url_clean)

            # This would connect to actual MCP server in real implementation
            mockup_result = {
                "server_url": server_url_clean,
                "connection_status": "success",
                "server_info": {
                    "name": "Example MCP Server",
                    "version": "1.0.0",
                    "description": "Sample MCP server with business tools",
                },
                "tools_loaded": [
                    {
                        "name": "calculate_roi",
                        "description": "Calculate return on investment",
                        "parameters": ["investment", "return", "period"],
                    },
                    {
                        "name": "send_email",
                        "description": "Send email through company system",
                        "parameters": ["recipient", "subject", "body"],
                    },
                    {
                        "name": "query_database",
                        "description": "Query company database",
                        "parameters": ["table", "query", "filters"],
                    },
                ],
                "connection_time": timer.execution_time,
                "tools_count": 3,
            }

            # Log successful usage
            log_tool_usage("load_mcp_tools", userdata, str(mockup_result), timer.execution_time)

            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e,
                "load_mcp_tools",
                f"Unable to connect to MCP server at '{server_url}'. "
                f"Please check the URL and server availability.",
            )
            log_tool_error("load_mcp_tools", error, context.userdata)
            raise error from e


# ==========================================
# ADDITIONAL EXTERNAL SERVICES (MOCKUPS)
# ==========================================


@function_tool
async def translate_text(
    context: RunContext[UserData], text: str, target_language: str, source_language: str = "auto"
) -> dict[str, Any]:
    """
    Translates text between different languages.

    MOCKUP TOOL - Structure ready for translation API integration.

    Args:
        text: Text to translate
        target_language: Target language code (es, en, fr, etc.)
        source_language: Source language code (auto for auto-detect)

    Returns:
        Translation result with detected source language

    Raises:
        ToolError: If translation fails
    """
    with ToolTimer("translate_text") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            # Validate parameters
            text_clean = validate_string_param(text, "text", min_length=1, max_length=5000)
            target_clean = validate_string_param(target_language, "target_language", max_length=10)

            logger.info("🌍 Translation: %s -> %s", source_language, target_clean)

            # Mockup translation
            mockup_result = {
                "original_text": text_clean,
                "translated_text": f"[TRANSLATED TO {target_clean.upper()}] {text_clean}",
                "source_language": source_language if source_language != "auto" else "en",
                "target_language": target_clean,
                "confidence": 0.95,
                "translation_time": timer.execution_time,
            }

            log_tool_usage("translate_text", userdata, str(mockup_result), timer.execution_time)
            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "translate_text", "Translation service temporarily unavailable"
            )
            log_tool_error("translate_text", error, context.userdata)
            raise error from e


@function_tool
async def analyze_sentiment(context: RunContext[UserData], text: str) -> dict[str, Any]:
    """
    Analyzes the sentiment and emotional tone of text.

    MOCKUP TOOL - Structure ready for sentiment analysis API.

    Args:
        text: Text to analyze for sentiment

    Returns:
        Sentiment analysis results with scores and classifications

    Raises:
        ToolError: If analysis fails
    """
    with ToolTimer("analyze_sentiment") as timer:
        try:
            validate_tool_context(context)
            userdata = context.userdata

            text_clean = validate_string_param(text, "text", min_length=1, max_length=5000)

            logger.info("😊 Sentiment analysis: %d characters", len(text_clean))

            # Mockup sentiment analysis
            mockup_result = {
                "text": text_clean,
                "sentiment": "positive",
                "confidence": 0.87,
                "scores": {"positive": 0.65, "neutral": 0.25, "negative": 0.10},
                "emotions": {"joy": 0.45, "trust": 0.30, "anticipation": 0.20, "surprise": 0.05},
                "analysis_time": timer.execution_time,
            }

            log_tool_usage("analyze_sentiment", userdata, str(mockup_result), timer.execution_time)
            return mockup_result

        except ToolError:
            raise
        except Exception as e:
            error = handle_tool_error(
                e, "analyze_sentiment", "Sentiment analysis service unavailable"
            )
            log_tool_error("analyze_sentiment", error, context.userdata)
            raise error from e


# ==========================================
# EXTERNAL API UTILITIES
# ==========================================


def validate_api_response(response: dict[str, Any], required_fields: list[str]) -> bool:
    """
    Valida que una respuesta de API externa tenga los campos requeridos.

    Args:
        response: Respuesta de la API
        required_fields: Campos requeridos

    Returns:
        True si la respuesta es válida

    Raises:
        ToolError: Si la respuesta es inválida
    """
    if not isinstance(response, dict):
        raise ToolError("Invalid API response format")

    for field in required_fields:
        if field not in response:
            raise ToolError(f"Missing required field in API response: {field}")

    return True


def handle_api_error(error: Exception, service_name: str) -> ToolError:
    """
    Maneja errores de APIs externas con códigos específicos.

    Args:
        error: Error original
        service_name: Nombre del servicio

    Returns:
        ToolError apropiado para el tipo de error
    """
    error_msg = str(error).lower()

    if "timeout" in error_msg:
        new_error = ToolError(
            f"{service_name} is taking too long to respond. Please try again later."
        )
        new_error.__cause__ = error
        return new_error
    elif "rate limit" in error_msg:
        new_error = ToolError(
            f"{service_name} rate limit exceeded. Please wait before trying again."
        )
        new_error.__cause__ = error
        return new_error
    elif "unauthorized" in error_msg or "forbidden" in error_msg:
        new_error = ToolError(f"{service_name} access denied. Service may require authentication.")
        new_error.__cause__ = error
        return new_error
    else:
        new_error = ToolError(f"{service_name} is currently unavailable. Please try again later.")
        new_error.__cause__ = error
        return new_error


def create_api_request_config(timeout: float = 30.0, retries: int = 3) -> dict[str, Any]:
    """
    Crea configuración estándar para requests a APIs externas.

    Args:
        timeout: Timeout en segundos
        retries: Número de reintentos

    Returns:
        Configuración de request
    """
    return {
        "timeout": timeout,
        "retries": retries,
        "headers": {
            "User-Agent": "LiveKit-Agents/1.0",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    }
