# MonaQueHabla - Asistente Conversacional

Asistente de voz conversacional multimodal construido con LiveKit Agents 1.0.

## 🏗️ Estructura del Proyecto

```
monaquehabla/
├── agent.py                 # 🎯 Entrypoint principal
├── agents/                  # 🤖 Agentes conversacionales
│   ├── __init__.py
│   └── conversational_agent.py
├── core/                    # ⚙️ Lógica de negocio
│   ├── __init__.py
│   ├── config.py           # Configuraciones y UserData
│   └── tools.py            # Herramientas del LLM
├── services/                # 🔧 Servicios auxiliares
│   ├── __init__.py
│   ├── token_server.py     # Servidor de tokens
│   ├── health_check.py     # Health checks
│   └── monitoring.py       # Monitoreo y métricas
├── personas/                # 👥 Configuraciones de personalidades
│   ├── rosalia.yaml
│   └── ...
├── frontend/                # 🌐 Frontend web
│   ├── index.html
│   └── js/
├── tests/                   # 🧪 Tests
├── .env                     # Variables de entorno
├── pyproject.toml          # Configuración de Poetry
└── docker-compose.yml      # Docker
```

## 🚀 Inicio Rápido

### Prerequisitos

- Python 3.11+
- Poetry
- Docker (opcional)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd monaquehabla

# Instalar dependencias
poetry install

# Configurar entorno de desarrollo
make dev

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys
```

### Configuración

Crea un archivo `.env` con:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-key
ELEVEN_API_KEY=your-elevenlabs-key
DEEPGRAM_API_KEY=your-deepgram-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
```

### Ejecución

```bash
# Desarrollo
make run-dev

# Producción
make run

# Servidor de tokens (en otra terminal)
make server

# Con Docker
make docker
```

## 🛠️ Comandos Disponibles

```bash
make help           # Ver todos los comandos
make install        # Instalar dependencias
make run           # Ejecutar agente
make run-dev       # Modo desarrollo
make server        # Servidor de tokens
make test          # Ejecutar tests
make lint          # Verificar código
make format        # Formatear código
make clean         # Limpiar cache
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
make test

# Tests específicos
poetry run pytest tests/unit/
poetry run pytest tests/integration/
```

## 🔧 Desarrollo

### Estructura Modular

- **`agent.py`**: Entrypoint principal compatible con LiveKit 1.0
- **`agents/`**: Lógica de agentes conversacionales
- **`core/`**: Configuraciones y utilidades centrales
- **`services/`**: Servicios auxiliares (tokens, monitoreo, etc.)
- **`personas/`**: Configuraciones YAML de personalidades

### Agregar Nueva Personalidad

1. Crear archivo `personas/nueva_persona.yaml`:

```yaml
name: "Nueva Persona"
voice_id: "voice-id-from-elevenlabs"
instructions: |
  Eres una persona amigable y útil...
greeting: "¡Hola! Soy tu nueva asistente."
farewell: "¡Hasta luego!"
```

2. La personalidad estará disponible automáticamente

### Imports

Usar **imports absolutos únicamente**:

```python
# ✅ Correcto
from core.config import UserData
from agents.conversational_agent import ConversationalAgent
from services.monitoring import get_monitor

# ❌ Incorrecto
from .config import UserData
from ..agents.conversational_agent import ConversationalAgent
```

## 🐳 Docker

```bash
# Desarrollo
docker-compose up --build

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Arquitectura

### Flujo de Datos

1. Usuario se conecta vía frontend
2. `agent.py` recibe la conexión
3. Crea instancia de `ConversationalAgent`
4. Agente procesa audio/texto usando plugins LiveKit
5. Respuesta se envía de vuelta al usuario

### Componentes Principales

- **LiveKit Agents 1.0**: Framework principal
- **STT**: Deepgram Nova-2
- **LLM**: Claude 3 Haiku (AWS Bedrock)
- **TTS**: ElevenLabs Turbo v2.5
- **VAD**: Silero VAD

## 🤝 Contribuir

1. Fork el repositorio
2. Crear feature branch
3. Hacer cambios siguiendo el estilo del código
4. Ejecutar tests y linting
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- Documentación: [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- Issues: GitHub Issues
- Discord: LiveKit Community
