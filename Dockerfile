FROM python:3.11-slim

# ============================================================================
# VARIABLES DE ENTORNO OPTIMIZADAS
# ============================================================================
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ============================================================================
# DEPENDENCIAS DEL SISTEMA - Basadas en tu Dockerfile.local que funciona
# ============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    # Audio/Video processing (requerido por LiveKit Agents)
    ffmpeg \
    libsndfile1 \
    # Networking
    git \
    curl \
    # SSL certificates
    ca-certificates \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ============================================================================
# WORKDIR
# ============================================================================
WORKDIR /app


# ✅ CONFIGURAR HUGGINGFACE ANTES DE INSTALAR
ENV HF_HOME=/app/.cache/huggingface \
    HF_HUB_CACHE=/app/.cache/huggingface/hub

# ✅ CREAR DIRECTORIOS DE CACHE
RUN mkdir -p /app/.cache/huggingface

# ============================================================================
# INSTALL DEPENDENCIES - requirements.txt (generado desde Poetry)
# ============================================================================
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================================
# COPY APPLICATION - MISMA ESTRUCTURA QUE FUNCIONA EN TU LOCAL
# ============================================================================
COPY agents/ ./agents/
COPY core/ ./core/
COPY services/ ./services/
COPY personas/ ./personas/
COPY frontend/ ./frontend/
COPY agent.py ./

# ============================================================================
# CREATE LOGS DIRECTORY
# ============================================================================
RUN mkdir -p /app/logs

# ============================================================================
# SECURITY - Non-root user comentar esto para ser root
# ============================================================================
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# ============================================================================
# HEALTH CHECK
# ============================================================================
HEALTHCHECK --interval=30s --timeout=15s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8081/health || exit 1


RUN python agent.py download-files
# ============================================================================
# EXPOSE PORTS
# ============================================================================
EXPOSE 8081

# ============================================================================
# COMANDO - IGUAL QUE TU LOCAL QUE FUNCIONA
# ============================================================================
CMD ["python", "agent.py", "start"]
