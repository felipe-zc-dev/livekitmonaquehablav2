# 🤖 MonaQueHabla - AI Voice Assistant

Una asistente de voz inteligente multimodal construida con LiveKit Agents 1.0, diseñada para conversaciones en tiempo real con múltiples personalidades y capacidades avanzadas.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![LiveKit Agents](https://img.shields.io/badge/LiveKit-1.0+-green.svg)](https://docs.livekit.io/agents/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com)
[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen.svg)]()

## ✨ Características

- 🎭 **Múltiples Personalidades**: Sofia, Rosalía, Dr. Carmen (Psicóloga), Prof. Miguel, Alex (Coach)
- 🗣️ **Conversación Natural**: STT, LLM y TTS optimizados para baja latencia
- 🔄 **Cambio Dinámico**: Cambio de personalidad y modo en tiempo real
- 📊 **Monitoreo Avanzado**: Métricas de rendimiento y salud del sistema
- 🌐 **Producción Lista**: Configuración Docker optimizada para Render.com
- 🎯 **Arquitectura Modular**: Principios SOLID y DRY implementados

## 🏗️ Arquitectura

```
MonaQueHabla/
├── agents/                    # Lógica principal del agente
│   └── conversational_agent.py
├── core/                      # Configuración y utilidades
│   ├── config.py
│   ├── tools.py
│   └── persona_manager.py
├── services/                  # Servicios de soporte
│   ├── token_server.py        # Servidor de tokens LiveKit
│   ├── audio_replay.py        # Servicio de replay de audio
│   ├── monitoring.py          # Sistema de monitoreo
│   └── health_check.py        # Health checks
├── personas/                  # Configuraciones de personalidades
│   ├── rosalia.yaml
│   ├── sofia.yaml
│   ├── psicologo.yaml
│   ├── profesor.yaml
│   └── coach.yaml
├── frontend/                  # Frontend web (React/Next.js)
└── agent.py                   # Punto de entrada principal
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.11+
- Poetry
- Docker (opcional)
- Cuentas en:
  - [LiveKit Cloud](https://cloud.livekit.io) o servidor LiveKit
  - [ElevenLabs](https://elevenlabs.io) (TTS)
  - [Deepgram](https://deepgram.com) (STT)
  - [OpenAI](https://openai.com) o [AWS Bedrock](https://aws.amazon.com/bedrock/) (LLM)

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/monaquehabla.git
cd monaquehabla

# 2. Configurar entorno Python
poetry install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 4. Instalar pre-commit hooks
poetry run pre-commit install

# 5. Ejecutar el agente
poetry run python agent.py start
```

### Variables de Entorno

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# AI Providers
ELEVENLABS_API_KEY=your-elevenlabs-key
DEEPGRAM_API_KEY=your-deepgram-key
OPENAI_API_KEY=your-openai-key
# O alternativamente:
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Application
PORT=8081
TOKEN_SERVER_PORT=8000
```

### Desarrollo con Docker

```bash
# Desarrollo local
docker-compose up -d

# Ver logs
docker-compose logs -f voice-agent
```

## 🎭 Personalidades Disponibles

### Rosalía del Mar
- **Perfil**: Diseñadora de experiencias digitales de Barcelona
- **Personalidad**: Moderna, creativa, equilibrada
- **Uso**: Conversaciones generales, diseño, creatividad

### Sofia
- **Perfil**: Asistente virtual amigable
- **Personalidad**: Cercana, optimista, española
- **Uso**: Asistencia general, conversaciones casuales

### Dr. Carmen Ruiz
- **Perfil**: Psicóloga clínica profesional
- **Personalidad**: Empática, profesional, comprensiva
- **Uso**: Apoyo emocional, técnicas de bienestar

### Prof. Miguel Santos
- **Perfil**: Educador argentino apasionado
- **Personalidad**: Didáctico, motivador, curioso
- **Uso**: Enseñanza, explicaciones, aprendizaje

### Alex Motivation
- **Perfil**: Coach de vida energético
- **Personalidad**: Motivador, directo, positivo
- **Uso**: Motivación personal, establecimiento de metas

## 🛠️ Uso Avanzado

### Cambio de Personalidad

```python
# Durante la conversación, di:
"Cambia a la psicóloga Carmen"
"Quiero hablar con el profesor Miguel"
"Cambia de personalidad a Alex el coach"
```

### Modos de Interacción

- **Hybrid**: Voz + texto (por defecto)
- **Voice**: Solo voz
- **Text**: Solo texto

```python
# Durante la conversación:
"Cambia el modo a solo voz"
"Modo híbrido por favor"
```

### Herramientas Disponibles

- `change_persona()`: Cambiar personalidad
- `change_mode()`: Cambiar modo de interacción
- `get_user_summary()`: Obtener resumen del usuario
- `update_frontend_ui()`: Actualizar interfaz

## 🔧 Configuración Avanzada

### Optimización de Latencia

```python
# En agent.py, ajustar configuraciones:
session = AgentSession(
    # VAD optimizado
    vad=silero.VAD.load(
        min_speech_duration=0.05,
        min_silence_duration=0.4,
    ),
    # STT con configuraciones de latencia
    stt=deepgram.STT(
        model="nova-2-general",
        interim_results=True,
        endpointing_ms=200,
        no_delay=True,
    ),
    # TTS optimizado para streaming
    tts=elevenlabs.TTS(
        voice_settings=elevenlabs.VoiceSettings(
            stability=0.8,
            similarity_boost=0.7,
            speed=0.95,
        ),
        streaming_latency=2,
    ),
)
```

### Personalización de Personalidades

```yaml
# personas/mi_personalidad.yaml
name: "Mi Personalidad Custom"
age: 30
country: "España"
voice_id: "tu-voice-id-elevenlabs"

instructions: |
  Eres [nombre], [descripción de personalidad].

  PERSONALIDAD:
  - [característica 1]
  - [característica 2]

  OBJETIVOS:
  - [objetivo 1]
  - [objetivo 2]

greeting: "¡Hola! Soy [nombre]. ¿Cómo estás?"
farewell: "¡Hasta pronto! Que tengas un día genial."
```

## 🚀 Deployment

### Render.com (Recomendado)

```bash
# 1. Conectar repositorio a Render
# 2. Configurar variables de entorno
# 3. Deploy automático con Dockerfile
```

### Docker Production

```bash
# Build imagen
docker build -t monaquehabla:latest .

# Run en producción
docker run -d \
  --name monaquehabla \
  -p 8081:8081 \
  --env-file .env \
  monaquehabla:latest
```

### Kubernetes

```yaml
# k8s/deployment.yaml incluido en el proyecto
kubectl apply -f k8s/
```

## 📊 Monitoreo

### Health Checks
- **Agent**: `http://localhost:8081/health`
- **Token Server**: `http://localhost:8000/health`

### Métricas Disponibles
- CPU y memoria usage
- Sesiones activas
- Requests por minuto
- Latencia promedio

### Logs Estructurados
```bash
# Ver logs en desarrollo
docker-compose logs -f voice-agent

# Logs en producción
kubectl logs -f deployment/monaquehabla
```

## 🧪 Testing

```bash
# Ejecutar tests
poetry run pytest

# Con coverage
poetry run pytest --cov=agents --cov=core --cov=services

# Linting
poetry run ruff check .
poetry run black --check .
poetry run mypy .
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

### Desarrollo Local

```bash
# Setup completo para desarrollo
poetry install
poetry run pre-commit install
poetry run python agent.py dev  # Modo desarrollo con hot reload
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

- **Documentación**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/monaquehabla/issues)
- **Slack**: [LiveKit Community](https://livekit.io/join-slack)

## 🙏 Agradecimientos

- [LiveKit](https://livekit.io) por el framework de agentes
- [ElevenLabs](https://elevenlabs.io) por las voces realistas
- [Deepgram](https://deepgram.com) por el reconocimiento de voz
- Comunidad de desarrolladores de IA conversacional

---

**Hecho con ❤️ y mucho ☕ por [Tu Nombre](https://github.com/tu-usuario)**
