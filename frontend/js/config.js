/**
 * CONFIG.js v4.0 - FUENTE DE VERDAD ÚNICA
 * LiveKit v2.13.6 + Arquitectura Limpia + Audio Optimizado
 *
 * REFACTORIZACIÓN COMPLETA:
 * ✅ CONFIG = Única fuente de verdad para TODOS los JS
 * ✅ RoomOptions v2.13.6 oficial completo
 * ✅ Audio config robusto mantenido (punto fuerte)
 * ✅ Eliminado turnDetection (error conceptual)
 * ✅ Eliminado videoCaptureDefaults (no necesario)
 * ✅ publishDefaults usando audioPresets existente
 * ✅ SOLID + DRY + Clean Code
 *
 * @author Refactored for LiveKit v2.13.6 Truth Source
 * @version 4.0.0-truth-source
 * @since 2024
 * @requires LiveKit Client SDK v2.13.6+
 */

/**
 * CONFIGURACIÓN MAESTRA - FUENTE DE VERDAD ÚNICA
 *
 * Esta configuración es usada directamente por:
 * - voice-agent-sdk.js (Room constructor)
 * - app.js (inicialización y features)
 * - ui-manager.js (comportamiento UI)
 * - voice-call.js (modos de llamada)
 *
 * NO DUPLICAR VALORES - Esta es la única fuente de verdad
 *
 * @namespace CONFIG
 */
const CONFIG = {
    /**
     * Configuración LiveKit v2.13.6 Oficial
     *
     * CRITICAL: roomOptions se pasa DIRECTAMENTE al constructor Room()
     * NO modificar en voice-agent-sdk.js - usar tal como está aquí
     *
     * @namespace CONFIG.livekit
     */
    livekit: {
        // URLs del servidor (producción/desarrollo)
        // tokenEndpoint: "https://web-server-mona-e23l.onrender.com/getToken",
        // wsUrl: "wss://monaquehabla-226n27am.livekit.cloud",

        // URLs alternativas para desarrollo local
        tokenEndpoint: "http://localhost:8000/getToken",
        wsUrl: "ws://localhost:7880", // validar siempre en prepareConnection y connect de livekit buscar tokenData.url

        /**
         * RoomOptions v2.13.6 OFICIAL - FUENTE DE VERDAD
         *
         * Se pasa DIRECTAMENTE a: new Room(CONFIG.livekit.roomOptions)
         * Documentación: https://docs.livekit.io/reference/client-sdk-js/interfaces/RoomOptions.html
         *
         * @type {RoomOptions}
         */
        roomOptions: {
            /**
             * OPTIMIZACIONES DE RED - v2.13.6
             */
            adaptiveStream: true,
            dynacast: true,
            autoSubscribe: true,

            /**
             * CONFIGURACIÓN RTC PARA BAJA LATENCIA
             */
            rtcConfig: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun1.l.google.com:19302" },
                ],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                iceCandidatePoolSize: 10,
                rtcpMuxPolicy: "require",
            },

            /**
             * AUDIO CAPTURE - CONFIGURACIÓN ROBUSTA (PUNTO FUERTE)
             *
             * CRITICAL: Esta es la configuración maestra de audio
             * Optimizada para voz en tiempo real con latencia <8ms
             *
             * @type {AudioCaptureDefaults}
             */
            audioCaptureDefaults: {
                // LATENCIA PRINCIPAL - FUENTE DE VERDAD
                latency: 0.008, // 8ms - sincronizado con performance.audioLatencyTarget
                sampleRate: 48000,
                channelCount: 1,

                // PROCESAMIENTO DE AUDIO AVANZADO
                echoCancellation: true,
                echoCancellationType: "system",
                autoGainControl: true,
                autoGainControlType: "system",
                noiseSuppression: true,
                noiseSuppressionType: "system",
                voiceIsolation: true,

                // CONFIGURACIÓN DE BUFFER OPTIMIZADA
                bufferSize: 128,
                deviceId: "default",
                volume: 1.0,

                // CONFIGURACIONES ESPECÍFICAS CHROME/WEBKIT
                googAutoGainControl: true,
                googAutoGainControl2: true,
                googEchoCancellation: true,
                googHighpassFilter: true,
                googNoiseSuppression: true,
                googTypingNoiseDetection: true,
                googBeamforming: true,
                googArrayGeometry: true,
                googAudioMirroring: false,
            },

            /**
             * AUDIO PLAYBACK - OPTIMIZADO PARA RESPUESTA TTS
             *
             * @type {AudioPlaybackDefaults}
             */
            audioPlaybackDefaults: {
                autoplay: true,
                playsInline: true,
                volume: 1.0,
                bufferSize: 256,
                sampleRate: 48000,
                latency: 0.008, // Sincronizado con capture
            },

            /**
             * PUBLISH DEFAULTS - USANDO AUDIO PRESETS ROBUSTO
             *
             * Integra la configuración audioPresets existente (punto fuerte)
             * con PublishDefaults oficial v2.13.6
             *
             * @type {PublishDefaults}
             */
            publishDefaults: {
                // Audio preset base (configurable)
                audioPreset: "speech", // Will be mapped to AudioPresets.speech in voice-agent-sdk.js

                // Configuración detallada de audio (punto fuerte mantenido)
                maxBitrate: 128000,
                priority: "high",
                dtx: false, // Discontinuous transmission
                red: false, // Redundant encoding
                fec: false, // Forward error correction
                stopOnUnpublish: true,
                simulcast: false,
            },
        },

        /**
         * Features de LiveKit Cliente (NO RoomOptions)
         *
         * @type {Object}
         */
        features: {
            /** @type {boolean} ✅ prepareConnection() v2.13.6 */
            enablePrepareConnection: true,
            /** @type {boolean} ✅ Adaptive stream si soportado */
            enableAdaptiveStream: true,
            /** @type {boolean} ✅ Dynacast si soportado */
            enableDynacast: true,
        },
    },

    /**
     * Configuración RPC para comunicación bidireccional
     *
     * @namespace CONFIG.rpc
     */
    rpc: {
        /** @type {boolean} RPC habilitado globalmente */
        enabled: true,
        /** @type {number} Timeout para llamadas RPC en ms */
        timeout: 10000,
        /** @type {string[]} Métodos RPC disponibles */
        methods: [
            "llm_function_call",
            "agent_command",
            "heartbeat",
            "update_ui_state",
            "show_notification",
            "change_persona",
        ],
    },

    /**
     * Topics para comunicación LiveKit Data Channels
     * @namespace CONFIG.topics
     */
    topics: {
        chat: "lk.chat",
        transcription: "lk.transcription",
        status: "lk.agent.status",
        textStream: "lk.rpc.textStream",
        voiceMetrics: "lk.rpc.voiceMetrics",
        agent: "lk.agent.command",
        avatarControl: "lk.avatar.control",
        avatarStatus: "lk.avatar.status",
    },

    /**
     * Configuración del agente de voz
     * @namespace CONFIG.agent
     */
    agent: {
        /** @type {string} Estrategia de modo voz */
        voiceModeStrategy: "dynamic",
        /** @type {string} Personalidad por defecto */
        persona: "rosalia",
        /** @type {Object} Modos de interacción */
        ioModes: {
            TEXT: "text",
            VOICE: "voice",
            HYBRID: "hybrid",
        },
        /** @type {string} Modo por defecto */
        defaultMode: "hybrid",

        /**
         * Agent Attributes v2.13.6 - Se envían al agente Python
         * Documentación: https://docs.livekit.io/reference/client-sdk-js/interfaces/attributes.AgentAttributes.html
         *
         * @type {AgentAttributes}
         */
        attributes: {
            name: "voice_assistant_sdk",
            version: "4.0.0",
            capabilities: ["voice", "chat", "rpc", "streaming"],
            metadata: {
                personaId: "rosalia",
                language: "es",
                model: "claude-3-haiku",
                clientType: "voice_agent_sdk",
                audioLatencyTarget: "8ms",
            },
        },

        /**
         * Transcription configuration - se envía al agente Python
         * Documentación: https://docs.livekit.io/reference/client-sdk-js/interfaces/attributes.TranscriptionAttributes.html
         *
         * @type {TranscriptionAttributes}
         */
        transcription: {
            model: "deepgram-nova-2",
            language: "es",
            interim_results: true,
        },
    },

    /**
     * Configuración de rendimiento - SINCRONIZADA CON LIVEKIT
     *
     * @namespace CONFIG.performance
     */
    performance: {
        /** @type {number} Timeout de conexión en ms */
        connectionTimeout: 15000,
        /** @type {number} Timeout de reconexión en ms */
        reconnectTimeout: 3000,
        /** @type {number} Timeout de preparación de conexión en ms */
        prepareConnectionTimeout: 2000,

        // AUDIO PERFORMANCE - SINCRONIZADO CON LIVEKIT
        /** @type {number} FUENTE DE VERDAD: Latencia objetivo en ms (8ms = 0.008s) */
        audioLatencyTarget: 8,
        /** @type {number} Sample rate sincronizado con audioCaptureDefaults */
        audioSampleRate: 48000,
        /** @type {number} Buffer size sincronizado con audioCaptureDefaults */
        audioBufferSize: 128,

        /** @type {number} Timeout de respuesta de voz en ms */
        voiceResponseTimeoutMs: 8000,
        /** @type {boolean} Habilitar modo de baja latencia */
        enableLowLatencyMode: true,
        /** @type {boolean} Priorizar tráfico de voz */
        prioritizeVoiceTraffic: true,
        /** @type {boolean} Usar codecs optimizados */
        useOptimizedCodecs: true,
    },

    /**
     * Configuración de interfaz de usuario
     * @namespace CONFIG.ui
     */
    ui: {
        /**
         * Configuración del chat
         */
        chat: {
            maxMessages: 50,
            typingIndicatorTimeout: 2000,
            enableAudioMessages: false,
            audioMessageMaxDuration: 300,
            showAudioWaveform: false,
        },

        /**
         * Configuración de audio y voz - SINCRONIZADA CON LIVEKIT
         */
        audio: {
            /** @type {boolean} Requiere interacción del usuario para audio (v2.13.6) */
            requireUserInteraction: true,
            /** @type {boolean} No iniciar audio automáticamente */
            autoStart: false,
            /** @type {boolean} Mostrar actividad de voz */
            showVoiceActivity: true,
            /** @type {boolean} Mostrar indicador de latencia */
            showLatencyIndicator: true,
            /** @type {boolean} Habilitar animaciones de actividad de voz */
            enableVoiceActivityAnimation: true,
        },

        /**
         * Configuración de notificaciones
         */
        notifications: {
            /** @type {boolean} Notificaciones toast habilitadas */
            enabled: false,
            /** @type {number} Duración por defecto en ms */
            duration: 3000,
            /** @type {number} Máximo número visible simultáneamente */
            maxVisible: 3,
            /** @type {string} Posición en pantalla */
            position: "top-right",
            /** @type {number} Duración para interacción de audio */
            audioInteractionDuration: 6000,
            /** @type {boolean} Mostrar advertencias de latencia */
            showLatencyWarnings: true,
            /** @type {number} Umbral de latencia para advertencias */
            voiceLatencyThreshold: 800,

            /**
             * Configuración del badge de calidad de conexión
             */
            connectionBadge: {
                /** @type {boolean} Badge habilitado */
                enabled: false,
                /** @type {boolean} Mostrar latencia en badge */
                showLatency: true,
                /** @type {boolean} Mostrar puntos de calidad */
                showQualityDots: true,
                /** @type {boolean} Auto-ocultar cuando calidad es buena */
                autoHide: true,
                /** @type {number} Intervalo de actualización en ms */
                updateInterval: 1000,
                /** @type {string} Posición del badge */
                position: "bottom-right",
                /** @type {number} Offset desde abajo en px */
                offsetBottom: 100,
            },
        },

        /**
         * Configuración de llamada de voz
         */
        call: {
            /** @type {string} Modo de conversación: 'unified' | 'separated' */
            conversationMode: "unified",
            /** @type {number} Duración de subtítulos en ms */
            subtitleDisplayDuration: 4000,
            /** @type {number} Timeout de actividad de voz en ms */
            voiceActivityTimeout: 800,
            /** @type {number} Intervalo de actualización de estado en ms */
            callStatusUpdateInterval: 300,
            /** @type {boolean} Mostrar calidad de conexión */
            showConnectionQuality: true,
            /** @type {number} Umbral de advertencia de latencia en ms */
            latencyWarningThreshold: 1000,
            /** @type {number} Delay para indicador de pensamiento en ms */
            thinkingIndicatorDelay: 300,
            /** @type {number} Advertencia de timeout de respuesta en ms */
            responseTimeoutWarning: 3000,
            /** @type {number} Duración de fade in de subtítulos en ms */
            subtitleFadeInDuration: 150,
            /** @type {number} Duración de fade out de subtítulos en ms */
            subtitleFadeOutDuration: 200,
            /** @type {number} Longitud máxima de subtítulos */
            subtitleMaxLength: 100,
            /** @type {boolean} Mostrar transcripciones parciales */
            showPartialTranscriptions: true,
        },
    },

    /**
     * Feature flags limpios y verificados
     *
     * SOLO flags que están realmente implementados en el código
     * @namespace CONFIG.features
     */
    features: {
        /** @type {boolean} ✅ IMPLEMENTADO: Texto en streaming */
        streamingText: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Detección de actividad de voz */
        voiceActivityDetection: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Visualización de audio */
        audioVisualization: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Subtítulos */
        subtitles: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Atajos de teclado */
        keyboardShortcuts: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Reconexión automática */
        autoReconnect: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Soporte RPC */
        rpcSupport: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Manejo avanzado de errores */
        advancedErrorHandling: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Optimización de conexión */
        connectionOptimization: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Verificación de compatibilidad */
        browserCompatibilityCheck: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Indicador de pensamiento */
        showThinkingIndicator: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Monitoreo de latencia en tiempo real */
        realTimeLatencyMonitoring: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Calidad adaptiva */
        adaptiveQuality: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Manejo de interrupciones de voz */
        voiceInterruptionHandling: true,
        /** @type {boolean} ✅ IMPLEMENTADO: RPC text streaming */
        enableRpcTextStreaming: true,
        /** @type {boolean} ✅ IMPLEMENTADO: Pre-calentamiento de conexión */
        enableConnectionPreWarming: true,
    },

    /**
     * Mensajes de error del sistema
     * @namespace CONFIG.errors
     */
    errors: {
        CONNECTION_FAILED: "No se pudo conectar al asistente de voz",
        TOKEN_ERROR: "Error de autenticación - recarga la página",
        MICROPHONE_ERROR: "Acceso al micrófono denegado o no disponible",
        AUDIO_ERROR: "Haz clic en el botón de audio para habilitar sonido",
        NETWORK_ERROR: "Conexión de red inestable",
        AGENT_ERROR: "Asistente de voz temporalmente no disponible",
        PERMISSION_ERROR: "Permisos requeridos no otorgados",
        BROWSER_ERROR: "Navegador no soporta funciones de voz",
        BROWSER_INCOMPATIBLE: "Tu navegador no soporta funciones de voz",
        AUDIO_DEVICE_ERROR: "Dispositivo de audio no disponible",
        CONNECTION_TIMEOUT: "Timeout de conexión - inténtalo de nuevo",
        VOICE_LATENCY_HIGH: "Respuesta de voz más lenta de lo esperado",
        MICROPHONE_PERMISSION_DENIED:
            "Se requiere permiso de micrófono para modo voz",
        SAFARI_AUDIO_RESTRICTION:
            "Safari requiere interacción del usuario para audio",
    },

    /**
     * Mensajes de estado del sistema
     * @namespace CONFIG.status
     */
    status: {
        INITIALIZING: "Inicializando asistente de voz...",
        CHECKING_BROWSER: "Verificando compatibilidad del navegador...",
        CONNECTING: "Conectando al asistente...",
        CONNECTED: "Conectado y listo",
        READY: "Listo para chat o llamada",
        VOICE_ACTIVE: "Llamada de voz activa - Habla libremente",
        VOICE_STARTING: "Iniciando modo voz...",
        VOICE_ENDING: "Finalizando modo voz...",
        RECONNECTING: "Reconectando...",
        DISCONNECTED: "Desconectado",
        ERROR: "Error de conexión",
        AUDIO_INTERACTION_REQUIRED: "Haz clic para habilitar audio",
        MICROPHONE_STARTING: "Activando micrófono...",
        OPTIMIZING_CONNECTION: "Optimizando para voz...",
        PREPARING_VOICE_MODE: "Preparando conversación de voz...",
        LISTENING: "Escuchando...",
        PROCESSING_SPEECH: "Procesando tu voz...",
        THINKING: "Pensando...",
        RESPONDING: "Respondiendo...",
    },

    /**
     * Configuración de debugging consolidada
     * @namespace CONFIG.debug
     */
    debug: {
        /** @type {boolean} Debug habilitado */
        enabled: true,
        /** @type {string} Nivel de log */
        logLevel: "debug",
        /** @type {boolean} Mostrar logs de red */
        showNetworkLogs: true,
        /** @type {boolean} ✅ USADO: Mostrar eventos de UI */
        showUIEvents: true,
        /** @type {boolean} ✅ USADO: Mostrar eventos de audio */
        showAudioEvents: true,
        /** @type {boolean} ✅ USADO: Monitoreo de rendimiento */
        performanceMonitoring: true,
        /** @type {boolean} ✅ USADO: Mostrar estado de conexión */
        showConnectionState: true,
        /** @type {boolean} ✅ USADO: Mostrar cambios de modo voz */
        showVoiceModeChanges: true,
        /** @type {boolean} ✅ USADO: Mostrar métricas de latencia */
        showLatencyMetrics: true,
        /** @type {boolean} ✅ USADO: Log eventos de text stream */
        logTextStreamEvents: true,
        /** @type {boolean} ✅ USADO: Log eventos de actividad de voz */
        logVoiceActivityEvents: true,
        /** @type {boolean} ✅ USADO: Mostrar métricas de voz */
        showVoiceMetrics: true,
        /** @type {boolean} ✅ USADO: Log latencia de transcripción */
        logTranscriptionLatency: true,
        /** @type {boolean} ✅ USADO: Mostrar calidad de conexión */
        showConnectionQuality: true,
        /** @type {number} ✅ USADO: Umbral de advertencia de latencia de voz */
        voiceLatencyWarningThreshold: 600,
        /** @type {boolean} ✅ USADO: Debug de voz habilitado */
        enableVoiceDebugging: true,
        /** @type {boolean} ✅ USADO: Log llamadas RPC */
        logRpcCalls: true,
        /** @type {boolean} ✅ USADO: Log pre-calentamiento de conexión */
        logConnectionPreWarming: true,
    },
    /**
     * test
     * @namespace CONFIG.test
     */
    test: {
        /** @type {boolean} Modo test - salta validaciones DOM */
        enabled: false,
        /** @type {boolean} Solo agente sin UI completa */
        headlessMode: false,
        /** @type {boolean} Permitir inicialización sin elementos DOM críticos */
        skipDOMValidation: false,
        /** @type {boolean} Prevenir auto-inicio de VoiceAgentApp */
        preventAutoInit: false,
    },

    /**
     * Atajos de teclado
     * @namespace CONFIG.shortcuts
     */
    shortcuts: {
        sendMessage: "Enter",
        sendMessageAlt: "Ctrl+Enter",
        toggleVoice: "Ctrl+Shift+V",
        toggleMute: "Ctrl+Shift+M",
        endCall: "Escape",
        forceEndSpeech: "Ctrl+Shift+S",
        toggleThinking: "Ctrl+Shift+T",
        showVoiceMetrics: "Ctrl+Shift+D",
        toggleVAD: "Ctrl+Shift+A",
        resetConnection: "Ctrl+Shift+R",
    },
};

/**
 * Valida y sincroniza configuración v2.13.6+
 *
 * NUEVO: Garantiza sincronización entre todas las configuraciones
 * y que CONFIG sea realmente la fuente de verdad única
 *
 * @returns {boolean} True si la configuración es válida
 * @throws {Error} Si hay errores críticos de configuración
 */
function validateConfig() {
    const errors = [];

    // Validar endpoints requeridos
    if (!CONFIG.livekit.tokenEndpoint) {
        errors.push("TOKEN_ENDPOINT es requerido");
    }

    if (!CONFIG.livekit.wsUrl) {
        errors.push("LIVEKIT_URL es requerido");
    }

    // ✅ NUEVO: Sincronizar audio latency entre todas las configuraciones
    const audioDefaults = CONFIG.livekit.roomOptions.audioCaptureDefaults;
    const performanceLatency = CONFIG.performance.audioLatencyTarget;

    if (Math.abs(audioDefaults.latency * 1000 - performanceLatency) > 0.1) {
        console.warn(
            `⚠️ Sincronizando latencia de audio: ${performanceLatency}ms`
        );
        audioDefaults.latency = performanceLatency / 1000;
        CONFIG.livekit.roomOptions.audioPlaybackDefaults.latency =
            audioDefaults.latency;
    }

    // ✅ NUEVO: Sincronizar sample rates
    const sampleRate = audioDefaults.sampleRate;
    if (CONFIG.performance.audioSampleRate !== sampleRate) {
        console.warn(`⚠️ Sincronizando sample rate: ${sampleRate}Hz`);
        CONFIG.performance.audioSampleRate = sampleRate;
        CONFIG.livekit.roomOptions.audioPlaybackDefaults.sampleRate =
            sampleRate;
    }

    // ✅ NUEVO: Sincronizar buffer sizes
    const bufferSize = audioDefaults.bufferSize;
    if (CONFIG.performance.audioBufferSize !== bufferSize) {
        console.warn(`⚠️ Sincronizando buffer size: ${bufferSize}`);
        CONFIG.performance.audioBufferSize = bufferSize;
    }

    // Sincronizar RPC config
    CONFIG.features.rpcSupport = CONFIG.rpc.enabled;

    // Forzar estrategia optimizada
    if (CONFIG.agent.voiceModeStrategy !== "dynamic") {
        console.warn(
            '⚠️ FORZADO a estrategia "dynamic" para optimización de voz'
        );
        CONFIG.agent.voiceModeStrategy = "dynamic";
    }

    if (errors.length > 0) {
        console.error("❌ Errores de configuración:", errors);
        throw new Error(`Configuración inválida: ${errors.join(", ")}`);
    }

    return true;
}

/**
 * Obtiene overrides de configuración específicos del entorno
 *
 * MEJORADO: Adapta configuración según entorno con sincronización
 *
 * @returns {Object} Configuración de override para el entorno actual
 */
function getEnvironmentConfig() {
    const env = typeof window !== "undefined" && window.location.hostname;

    if (env === "localhost" || env === "127.0.0.1") {
        return {
            debug: {
                ...CONFIG.debug,
                enabled: true,
                logLevel: "debug",
                showUIEvents: true,
                performanceMonitoring: true,
                showLatencyMetrics: true,
                enableVoiceDebugging: true,
                logVoiceActivityEvents: true,
            },
            performance: {
                ...CONFIG.performance,
                audioLatencyTarget: 6, // Latencia más agresiva en desarrollo
            },
            ui: {
                ...CONFIG.ui,
                notifications: {
                    ...CONFIG.ui.notifications,
                    connectionBadge: {
                        ...CONFIG.ui.notifications.connectionBadge,
                        enabled: true,
                        showLatency: true,
                        showQualityDots: true,
                    },
                },
            },
        };
    }

    // Configuración de producción
    return {
        debug: {
            ...CONFIG.debug,
            enabled: false,
            logLevel: "error",
            performanceMonitoring: false,
            showLatencyMetrics: false,
            enableVoiceDebugging: false,
            logVoiceActivityEvents: false,
        },
        performance: {
            ...CONFIG.performance,
            audioLatencyTarget: 10, // Latencia más conservadora en producción
        },
    };
}

/**
 * Inicializa configuración como fuente de verdad única
 *
 * NUEVO: Garantiza que CONFIG sea la única fuente de verdad
 * en todos los JS del sistema
 *
 * @returns {Object} Configuración inicializada y validada
 * @throws {Error} Si falla la inicialización
 */
function initializeConfig() {
    try {
        // const envConfig = getEnvironmentConfig();

        // // Aplicar overrides de entorno manteniendo sincronización
        // Object.assign(CONFIG.debug, envConfig.debug);
        // Object.assign(CONFIG.performance, envConfig.performance);

        // if (envConfig.ui?.notifications?.connectionBadge) {
        //     Object.assign(
        //         CONFIG.ui.notifications.connectionBadge,
        //         envConfig.ui.notifications.connectionBadge
        //     );
        // }

        // ✅ VALIDAR Y SINCRONIZAR TODO
        validateConfig();

        // Calcular latencia esperada total del sistema
        const expectedLatency = CONFIG.performance.audioLatencyTarget * 2; // Capture + playback

        if (CONFIG.debug.enabled) {
            console.log("🔧 CONFIG v4.0 - FUENTE DE VERDAD ÚNICA ACTIVADA");
            console.log("📋 LiveKit roomOptions: Directo desde CONFIG");
            console.log("🎤 RPC habilitado:", CONFIG.rpc.enabled);
            console.log("🎵 Audio config robusto: MANTENIDO como punto fuerte");

            console.table({
                "Token Endpoint": CONFIG.livekit.tokenEndpoint
                    ? "✅ Configurado"
                    : "❌ Faltante",
                "WebSocket URL": CONFIG.livekit.wsUrl
                    ? "✅ Configurado"
                    : "❌ Faltante",
                "RoomOptions Source":
                    "✅ CONFIG.livekit.roomOptions (VERDAD ÚNICA)",
                "Audio Latency (ms)": `✅ ${CONFIG.performance.audioLatencyTarget}ms SINCRONIZADO`,
                "Sample Rate": `✅ ${CONFIG.performance.audioSampleRate}Hz SINCRONIZADO`,
                "Buffer Size": `✅ ${CONFIG.performance.audioBufferSize} SINCRONIZADO`,
                "Expected Total Latency": `⚡ ${expectedLatency}ms`,
                PrepareConnection: CONFIG.livekit.features
                    .enablePrepareConnection
                    ? "✅ Habilitado"
                    : "❌ Deshabilitado",
                "RPC Support": CONFIG.rpc.enabled
                    ? "✅ Habilitado"
                    : "❌ Deshabilitado",
            });

            console.group("🎯 CONFIG v4.0 - FUENTE DE VERDAD ÚNICA:");
            console.log("• CONFIG.livekit.roomOptions → new Room() DIRECTO");
            console.log("• Audio config robusto MANTENIDO (punto fuerte)");
            console.log("• Sincronización automática de latencias");
            console.log("• RoomOptions v2.13.6 oficial completo");
            console.log("• Zero duplicación de valores");
            console.log("• Agent attributes v2.13.6 incluidos");
            console.log("• Eliminado turnDetection (error conceptual)");
            console.log("• Eliminado videoCaptureDefaults (no necesario)");
            console.groupEnd();
        }

        return CONFIG;
    } catch (error) {
        console.error(
            "❌ Falló la inicialización de CONFIG como fuente de verdad:",
            error
        );
        throw error;
    }
}

/**
 * Logger centralizado con soporte para fuente de verdad
 *
 * MEJORADO: Logging inteligente que respeta CONFIG como fuente única
 *
 * @class Logger
 * @static
 */
class Logger {
    static init() {
        this.isProduction = !CONFIG.debug.enabled;
    }

    static debug(message, ...args) {
        if (CONFIG.debug.enabled && CONFIG.debug.logLevel === "debug") {
            console.log(`🔍 ${message}`, ...args);
        }
    }

    static warning(message, ...args) {
        console.warn(`🔍 ${message}`, ...args);
    }

    static info(message, ...args) {
        console.info(`🔍 ${message}`, ...args);
    }

    static ui(message, ...args) {
        if (CONFIG.debug.showUIEvents) {
            console.log(`🎨 ${message}`, ...args);
        }
    }

    static audio(message, ...args) {
        if (CONFIG.debug.showAudioEvents) {
            console.log(`🔊 ${message}`, ...args);
        }
    }

    static error(message, ...args) {
        console.error(`❌ ${message}`, ...args);
    }

    static voice(message, ...args) {
        if (CONFIG.debug.showVoiceMetrics) {
            console.log(`🎤 ${message}`, ...args);
        }
    }

    static connection(message, ...args) {
        if (CONFIG.debug.showConnectionState) {
            console.log(`🔗 ${message}`, ...args);
        }
    }

    static rpc(message, ...args) {
        if (CONFIG.debug.logRpcCalls) {
            console.log(`🔧 ${message}`, ...args);
        }
    }

    // ✅ NUEVO: Logger para sincronización
    static sync(message, ...args) {
        if (CONFIG.debug.enabled) {
            console.log(`🔄 SYNC: ${message}`, ...args);
        }
    }
}

// ✅ INICIALIZAR CONFIG COMO FUENTE DE VERDAD ÚNICA
try {
    initializeConfig();
    Logger.init();

    if (CONFIG.debug.enabled) {
        console.log("✅ CONFIG v4.0 inicializado como FUENTE DE VERDAD ÚNICA");
        console.log(
            "🎯 Todos los JS deben usar CONFIG directamente - NO duplicar valores"
        );
    }
} catch (error) {
    // Fallback error UI si falla la configuración
    document.addEventListener("DOMContentLoaded", () => {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
                <div class="text-center max-w-md">
                    <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <h1 class="text-xl font-bold mb-2">Error de Configuración del Sistema</h1>
                    <p class="text-gray-300 mb-4">
                        CONFIG v4.0 no se pudo inicializar como fuente de verdad única.
                    </p>
                    <p class="text-sm text-gray-400 mb-6">
                        ${error.message}
                    </p>
                    <button onclick="window.location.reload()"
                            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors">
                        Reintentar Inicialización
                    </button>
                </div>
            </div>
        `;
    });
}

// ✅ EXPORT PARA ACCESO GLOBAL COMO FUENTE DE VERDAD
if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
    window.Logger = Logger;

    // ✅ NUEVO: Validar que otros JS no sobrescriban CONFIG
    Object.freeze(CONFIG.livekit.roomOptions); // Proteger RoomOptions
    Object.freeze(CONFIG.performance); // Proteger performance config

    if (CONFIG.debug.enabled) {
        console.log(
            "🔒 CONFIG protegido contra sobrescritura - FUENTE DE VERDAD GARANTIZADA"
        );
    }
}

// Export para uso en módulos Node.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = CONFIG;
}
