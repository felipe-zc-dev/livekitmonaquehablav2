# Dockerfile - OPTIMIZADO para Render.com + LiveKit Agents v1.0
# Estrategia: pip + requirements.txt (NO Poetry en producción)
# Multi-stage: base -> deps -> production
# ARG SERVICE para agent vs token-server

# =============================================================================
# BASE STAGE - Dependencias del sistema
# =============================================================================
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH="/app"

# ✅ System dependencies - OPTIMIZADAS para LiveKit Agents
# Según docs oficiales: https://docs.livekit.io/agents/
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    curl \
    # Audio processing (SOLO para voice agent, no token server)
    ffmpeg \
    libsndfile1 \
    # SSL certificates
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# =============================================================================
# DEPS STAGE - Python dependencies con pip optimizado
# =============================================================================
FROM base AS deps

# ✅ CRÍTICO: requirements.txt ANTES que código (Docker cache)
COPY requirements.txt ./

# ✅ Install dependencies - pip (NO Poetry) para máxima compatibilidad Render
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# PRODUCTION STAGE - Runtime optimizado
# =============================================================================
FROM base AS production

# ✅ ENV SERVICE - Render.com pasa como environment variable
ENV SERVICE=${SERVICE:-agent}

# ✅ Copy Python dependencies desde deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# ✅ Copy application code - ESTRUCTURA según tu docker-compose
COPY core/ ./core/
COPY services/ ./services/
COPY personas/ ./personas/

# ✅ Copy específico por servicio
COPY agent.py ./
COPY agents/ ./agents/

# ✅ Frontend solo para token-server
COPY frontend/ ./frontend/

# ✅ Create logs directory
RUN mkdir -p /app/logs

# ✅ Non-root user (security best practice Render.com)
RUN useradd --create-home --shell /bin/bash --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

# ✅ Health checks por servicio
HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=5 \
    CMD if [ "$SERVICE" = "token-server" ]; then \
        curl -f http://localhost:8000/health || exit 1; \
    else \
        curl -f http://localhost:8081/health || exit 1; \
    fi

# ✅ Expose ports dinámicos
EXPOSE 8000 8081

# ✅ CMD dinámico por servicio
CMD sh -c 'if [ "$SERVICE" = "token-server" ]; then python services/token_server.py; else python agent.py start; fi'
