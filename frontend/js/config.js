/**
 * Configuración LiveKit v2.13.3 - CONSOLIDADA + Audio Replay System
 * Target: Respuesta de voz <500ms + Audio Replay Funcional
 */

const CONFIG = {
  // 🔗 Conexión LiveKit (v2.13.3 voice-optimized)
  livekit: {
    // URLs del servidor
    tokenEndpoint: 'https://token-server-91dg.onrender.com/getToken',
    wsUrl: 'wss://monaquehabla-226n27am.livekit.cloud',

    // tokenEndpoint: 'http://localhost:8000/getToken',
    // wsUrl: 'wss://localhost:7880',

    // Opciones de conexión (voice-optimized v2.13.3)
    connectOptions: {
      autoSubscribe: true,
      maxRetries: 3,
      websocketTimeout: 15000,
      protocolVersion: 2,
      rtcConfiguration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        iceCandidatePoolSize: 10,
        rtcpMuxPolicy: 'require',
      },
    },

    // Opciones de Room OPTIMIZADAS para conversación sub-500ms
    roomOptions: {
      adaptiveStream: true,
      dynacast: true,

      audioCaptureDefaults: {
        latency: 0.01, // CONSOLIDADO: Audio latency principal
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        echoCancellationType: 'system',
        autoGainControl: true,
        autoGainControlType: 'system',
        noiseSuppression: true,
        noiseSuppressionType: 'system',
        voiceIsolation: true,
        bufferSize: 128,
        deviceId: 'default',
        volume: 1.0,
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

      audioPlaybackDefaults: {
        autoplay: true,
        playsInline: true,
        volume: 1.0,
        bufferSize: 256,
        sampleRate: 48000,
        latency: 0.01,
      },

      audioPresets: {
        maxBitrate: 128000,
        priority: 'high',
        dtx: false,
        stopOnUnpublish: true,
        red: false,
        fec: false,
      },

      videoCaptureDefaults: {
        resolution: { width: 320, height: 240 },
        frameRate: 15,
      },

      // CONSOLIDADO: Turn Detection - Un solo lugar de configuración
      turnDetection: {
        enabled: true,
        timeout: 400,
        minSpeechDuration: 150,
        silenceTimeout: 250, // Valor principal consolidado
        vadSensitivity: 0.7,
        speechProbabilityThreshold: 0.4,
        endOfSpeechTimeout: 200,
        maxSpeechDuration: 30000,
        enableVoiceActivityDetection: true,
        enableBackgroundNoiseReduction: true,
        adaptiveThreshold: true,
      },
    },

    features: {
      enablePrepareConnection: true,
      optimizedAudioProcessing: true,
      enableBrowserCompatibilityCheck: true,
      enableStructuredLogging: true,
      voiceActivityDetection: true,
      echoSuppressionMode: 'aggressive',
      adaptiveAudioProcessing: true,
      enableRpcMethods: true,
      connectionOptimization: true,
      enableAudioWorklet: true,
    },
  },

  // 📡 Topics para streaming (v2.13.3)
  topics: {
    chat: 'lk.chat',
    transcription: 'lk.transcription',
    status: 'lk.agent.status',
    textStream: 'lk.rpc.textStream',
    voiceMetrics: 'lk.rpc.voiceMetrics',
  },

  // 🤖 Configuración del agente
  agent: {
    voiceModeStrategy: 'dynamic',
    persona: 'rosalia',
    ioModes: {
      TEXT: 'text',
      VOICE: 'voice',
      HYBRID: 'hybrid',
    },
    defaultMode: 'hybrid',
  },

  // 🎨 Configuración UI CONSOLIDADA
  ui: {
    chat: {
      maxMessages: 50,
      typingIndicatorTimeout: 2000,
      enableAudioMessages: true, // TODO: Implementar funcionalidad real
      audioMessageMaxDuration: 300,
      showAudioWaveform: true, // TODO: Implementar funcionalidad real
      // ❌ NO USADAS - Marcadas para revisión futura:
      // streamingUpdateInterval: 100,        // No se usa en ningún JS
      // messageAnimationDuration: 200,       // No se usa en ningún JS
    },

    audio: {
      showVoiceActivity: true,
      showLatencyIndicator: true,
      enableVoiceActivityAnimation: true,
      // ❌ NO USADAS - Marcadas para revisión futura:
      // visualizationEnabled: true,          // No se usa en ningún JS
      // volumeThreshold: 0.1,                // No se usa en ningún JS
      // silenceTimeout: 1500,                // No se usa en ningún JS
      // voiceActivityThreshold: 0.05,        // No se usa en ningún JS
    },

    // 📢 Notificaciones (toast y connection badge)
    notifications: {
      enabled: false, // ✅ Toast notifications
      duration: 3000,
      maxVisible: 2,
      position: 'top-right',
      audioInteractionDuration: 6000,
      showLatencyWarnings: true,
      voiceLatencyThreshold: 800,

      // ✅ Connection Quality Badge - FUNCIONAL
      connectionBadge: {
        enabled: false,
        showLatency: true,
        showQualityDots: true,
        autoHide: false,
        updateInterval: 1000,
        position: 'bottom-right',
        offsetBottom: 100,
      },
    },

    call: {
      conversationMode: 'unified',
      subtitleDisplayDuration: 4000,
      voiceActivityTimeout: 800,
      callStatusUpdateInterval: 300,
      showConnectionQuality: true,
      latencyWarningThreshold: 1000,
      thinkingIndicatorDelay: 300,
      responseTimeoutWarning: 3000,
      subtitleFadeInDuration: 150,
      subtitleFadeOutDuration: 200,
      subtitleMaxLength: 100,
      showPartialTranscriptions: false,
    },
  },

  // ❌ Mensajes de error
  errors: {
    CONNECTION_FAILED: 'No se pudo conectar al asistente de voz',
    TOKEN_ERROR: 'Error de autenticación - recarga la página',
    MICROPHONE_ERROR: 'Acceso al micrófono denegado o no disponible',
    AUDIO_ERROR: 'Haz clic en el botón de audio para habilitar sonido',
    NETWORK_ERROR: 'Conexión de red inestable',
    AGENT_ERROR: 'Asistente de voz temporalmente no disponible',
    PERMISSION_ERROR: 'Permisos requeridos no otorgados',
    BROWSER_ERROR: 'Navegador no soporta funciones de voz',
    BROWSER_INCOMPATIBLE: 'Tu navegador no soporta funciones de voz',
    AUDIO_DEVICE_ERROR: 'Dispositivo de audio no disponible',
    CONNECTION_TIMEOUT: 'Timeout de conexión - inténtalo de nuevo',
    VOICE_LATENCY_HIGH: 'Respuesta de voz más lenta de lo esperado',
    TURN_DETECTION_FAILED: 'No se puede detectar patrones de habla',
    MICROPHONE_PERMISSION_DENIED: 'Se requiere permiso de micrófono para modo voz',
    SAFARI_AUDIO_RESTRICTION: 'Safari requiere interacción del usuario para audio',
  },

  // 📊 Status messages
  status: {
    INITIALIZING: 'Inicializando asistente de voz...',
    CHECKING_BROWSER: 'Verificando compatibilidad del navegador...',
    CONNECTING: 'Conectando al asistente...',
    CONNECTED: 'Conectado y listo',
    READY: 'Listo para chat o llamada',
    VOICE_ACTIVE: 'Llamada de voz activa - Habla libremente',
    VOICE_STARTING: 'Iniciando modo voz...',
    VOICE_ENDING: 'Finalizando modo voz...',
    RECONNECTING: 'Reconectando...',
    DISCONNECTED: 'Desconectado',
    ERROR: 'Error de conexión',
    AUDIO_INTERACTION_REQUIRED: 'Haz clic para habilitar audio',
    MICROPHONE_STARTING: 'Activando micrófono...',
    OPTIMIZING_CONNECTION: 'Optimizando para voz...',
    PREPARING_VOICE_MODE: 'Preparando conversación de voz...',
    LISTENING: 'Escuchando...',
    PROCESSING_SPEECH: 'Procesando tu voz...',
    THINKING: 'Pensando...',
    RESPONDING: 'Respondiendo...',
  },

  // ⚡ Performance CONSOLIDADO
  performance: {
    connectionTimeout: 15000,
    reconnectTimeout: 3000,
    prepareConnectionTimeout: 2000,
    audioBufferSize: 128,
    audioSampleRate: 48000,
    // CONSOLIDADO: Una sola configuración de latencia de audio
    audioLatencyTarget: 10, // Milisegundos - valor principal
    voiceResponseTimeoutMs: 8000,
    enableLowLatencyMode: true,
    prioritizeVoiceTraffic: true,
    aggressiveBuffering: false,
    useOptimizedCodecs: true,
    enableAudioWorklets: true,
    useSharedArrayBuffer: true,
    enableOffscreenCanvas: true,
    // ❌ NO USADAS - Marcadas para revisión futura:
    // uiUpdateThrottleMs: 16,               // No se usa en ningún JS
    // messageCleanupThreshold: 75,          // No se usa en ningún JS
    // audioElementCleanupDelay: 500,        // No se usa en ningún JS
    // textStreamHandlerCleanupEnabled: true, // No se usa en ningún JS
    // transcriptionBufferMs: 50,            // No se usa en ningún JS
    // turnDetectionLatencyMs: 30,           // No se usa en ningún JS
    // speechEndDetectionMs: 200,            // No se usa en ningún JS
  },

  // 🎛️ Feature flags CONSOLIDADOS
  features: {
    streamingText: true,
    voiceActivityDetection: true,
    audioVisualization: true,
    subtitles: true,
    keyboardShortcuts: true,
    autoReconnect: true,
    rpcSupport: true,
    advancedErrorHandling: true,
    connectionOptimization: true,
    browserCompatibilityCheck: true,
    showThinkingIndicator: true,
    realTimeLatencyMonitoring: true,
    adaptiveQuality: true,
    voiceInterruptionHandling: true,
    enableRpcTextStreaming: true, // ✅ Usada en voice-agent.js
    enableConnectionPreWarming: true, // TODO: Implementar funcionalidad real
    // ❌ NO USADAS - Marcadas para revisión futura:
    // textToSpeechFallback: true,           // No se usa en ningún JS
    // aggressiveTurnDetection: true,        // Solo warning en validation
    // voiceActivityVisualization: true,     // No se usa en ningún JS
    // contextualAudioProcessing: true,      // No se usa en ningún JS
    // enableAdvancedVAD: true,              // No se usa en ningún JS
    // enableAudioWorkletProcessor: true,    // No se usa en ningún JS
  },

  // 🐛 Debugging CONSOLIDADO
  debug: {
    enabled: true,
    logLevel: 'debug',
    showNetworkLogs: false,
    showUIEvents: true,
    showAudioEvents: true,
    performanceMonitoring: true,
    showConnectionState: true,
    showVoiceModeChanges: true,
    showLatencyMetrics: true,
    logTextStreamEvents: true,
    logVoiceActivityEvents: true,
    logTurnDetectionEvents: true,
    showVoiceMetrics: true,
    logTranscriptionLatency: true,
    showConnectionQuality: true,
    voiceLatencyWarningThreshold: 600,
    enableVoiceDebugging: true,
    logRpcCalls: true,
    logConnectionPreWarming: true,
    // ❌ NO USADAS - Marcadas para revisión futura:
    // showMemoryUsage: false,               // No se usa en ningún JS
    // logAudioProcessingEvents: false,      // No se usa en ningún JS
    // showWebRTCStats: true,                // Solo en env override
  },

  // ⌨️ Keyboard shortcuts
  shortcuts: {
    sendMessage: 'Enter',
    sendMessageAlt: 'Ctrl+Enter',
    toggleVoice: 'Ctrl+Shift+V',
    toggleMute: 'Ctrl+Shift+M',
    endCall: 'Escape',
    forceEndSpeech: 'Ctrl+Shift+S',
    toggleThinking: 'Ctrl+Shift+T',
    showVoiceMetrics: 'Ctrl+Shift+D',
    toggleVAD: 'Ctrl+Shift+A',
    resetConnection: 'Ctrl+Shift+R',
  },

  // ⚡ CONSOLIDADO: Configuración específica de voz
  voice: {
    // CONSOLIDADO: Turn Detection - Referencia principal
    turnDetection: {
      aggressive: true,
      adaptiveThreshold: true,
      silenceGracePeriod: 100,
      minimumTurnDuration: 120,
      maximumSilenceDuration: 400, // Referencia a livekit.roomOptions.turnDetection.silenceTimeout
      voiceActivityThreshold: 0.2,
      backgroundNoiseAdaptation: true,
      enablePreEmphasis: true,
      enableSpectralSubtraction: true,
      windowSize: 512,
      hopLength: 256,
    },

    responseFlow: {
      thinkingIndicatorDelay: 250,
      responseTimeoutWarning: 2500,
      maxResponseWaitTime: 6000,
      interruptionGracePeriod: 150,
      expectedResponseLatency: 350,
      latencyWarningThreshold: 600, // ✅ Usada en app.js
    },

    audioOptimization: {
      prioritizeLowLatency: true,
      adaptiveQuality: true,
      echoCancellationLevel: 'aggressive',
      noiseSuppressionLevel: 'high',
      autoGainControlLevel: 'adaptive',
      enableVoicePreprocessing: true,
      optimizeForConversation: true,
      enableVoiceIsolation: true,
      enableBeamforming: true,
      enableResidualEchoSuppression: true,
      voiceActivityDetectionMode: 'aggressive',
    },

    // 🎵 NUEVO: Audio Replay System - Audio-First Implementation
    audioReplay: {
      enabled: true,
      strategy: 'replace', // 'replace' no 'append' - clave para el fix
      maxRetentionMs: 30000, // Solo mantener último audio por 30s
      enableAutoSave: true,

      // Múltiples detectores de fin de TTS
      endDetection: {
        enableTrackMuted: true, // Primario: TrackMuted event
        enableActiveSpeakers: true, // Fallback: ActiveSpeakersChanged
        enableTranscriptionFinal: true, // Fallback: isFinal en transcripción

        // Timeouts de fallback
        silenceTimeoutMs: 1500, // Si ningún evento funciona
        maxRecordingDurationMs: 15000, // Safety timeout máximo

        // Configuración de ActiveSpeakers
        speakersEmptyDelayMs: 500, // Delay antes de considerar silencio

        // Configuración de detección de silencio
        silenceThreshold: 2, // Umbral de audio para silencio
        silenceDurationRequiredMs: 3000, // Duración requerida de silencio
      },

      // Configuración de grabación
      recording: {
        mimeType: 'audio/webm;codecs=opus',
        chunkIntervalMs: 100, // Chunks de 100ms para mejor precisión
        enableBlobUrlCleanup: true, // Auto-cleanup de URLs
      },

      // Logging específico para debugging
      debug: {
        logRecordingEvents: true,
        logEndDetectionEvents: true,
        logBlobOperations: true,
      },
    },
  },
};

/**
 * Validar y normalizar configuración v2.13.3 + Audio Replay
 */
function validateConfig() {
  const errors = [];

  if (!CONFIG.livekit.tokenEndpoint) {
    errors.push('TOKEN_ENDPOINT es requerido');
  }

  if (!CONFIG.livekit.wsUrl) {
    errors.push('LIVEKIT_URL es requerido');
  }

  if (CONFIG.agent.voiceModeStrategy !== 'dynamic') {
    console.warn('⚠️ FORZADO a estrategia "dynamic" para optimización de voz');
    CONFIG.agent.voiceModeStrategy = 'dynamic';
  }

  // CONSOLIDACIÓN: Sincronizar configuraciones duplicadas
  const audioDefaults = CONFIG.livekit.roomOptions.audioCaptureDefaults;
  const performanceLatency = CONFIG.performance.audioLatencyTarget;

  // Usar performance.audioLatencyTarget como fuente de verdad
  if (audioDefaults.latency * 1000 !== performanceLatency) {
    console.warn('⚠️ Sincronizando latencia de audio:', performanceLatency + 'ms');
    audioDefaults.latency = performanceLatency / 1000;
  }

  // Sincronizar turn detection
  const roomTurnDetection = CONFIG.livekit.roomOptions.turnDetection;
  const voiceTurnDetection = CONFIG.voice.turnDetection;

  if (roomTurnDetection.silenceTimeout !== voiceTurnDetection.maximumSilenceDuration) {
    console.warn('⚠️ Sincronizando turn detection silence timeout');
    voiceTurnDetection.maximumSilenceDuration = roomTurnDetection.silenceTimeout;
  }

  // Validar audio replay configuration
  if (CONFIG.voice.audioReplay.enabled) {
    const replayConfig = CONFIG.voice.audioReplay;

    if (!['replace', 'append'].includes(replayConfig.strategy)) {
      console.warn('⚠️ Audio replay strategy inválida, usando "replace"');
      replayConfig.strategy = 'replace';
    }

    if (replayConfig.endDetection.silenceTimeoutMs > replayConfig.maxRetentionMs) {
      console.warn('⚠️ Silence timeout mayor que retention, ajustando');
      replayConfig.endDetection.silenceTimeoutMs = Math.min(
        replayConfig.endDetection.silenceTimeoutMs,
        replayConfig.maxRetentionMs / 2
      );
    }
  }

  if (errors.length > 0) {
    console.error('❌ Errores de configuración:', errors);
    throw new Error(`Configuración inválida: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Obtener overrides de configuración específicos del entorno
 */
function getEnvironmentConfig() {
  const env = typeof window !== 'undefined' && window.location.hostname;

  if (env === 'localhost' || env === '127.0.0.1') {
    return {
      debug: {
        ...CONFIG.debug,
        enabled: true,
        logLevel: 'debug',
        showUIEvents: true,
        performanceMonitoring: true,
        showLatencyMetrics: true,
        enableVoiceDebugging: true,
        logVoiceActivityEvents: true,
      },
      performance: {
        ...CONFIG.performance,
        audioLatencyTarget: 8,
      },
      voice: {
        audioReplay: {
          ...CONFIG.voice.audioReplay,
          debug: {
            logRecordingEvents: true,
            logEndDetectionEvents: true,
            logBlobOperations: true,
          },
        },
      },
      ui: {
        notifications: {
          connectionBadge: {
            enabled: true,
            showLatency: true,
            showQualityDots: true,
          },
        },
      },
    };
  }

  return {
    debug: {
      ...CONFIG.debug,
      enabled: false,
      logLevel: 'error',
      performanceMonitoring: false,
      showLatencyMetrics: false,
      enableVoiceDebugging: false,
      logVoiceActivityEvents: false,
    },
    performance: {
      ...CONFIG.performance,
      audioLatencyTarget: 12,
    },
    voice: {
      audioReplay: {
        ...CONFIG.voice.audioReplay,
        debug: {
          logRecordingEvents: false,
          logEndDetectionEvents: false,
          logBlobOperations: false,
        },
      },
    },
  };
}

/**
 * Inicializar configuración con optimizaciones de voz + Audio Replay
 */
function initializeConfig() {
  try {
    const envConfig = getEnvironmentConfig();

    // Aplicar overrides de entorno
    Object.assign(CONFIG.debug, envConfig.debug);
    Object.assign(CONFIG.performance, envConfig.performance);

    if (envConfig.ui?.notifications?.connectionBadge) {
      Object.assign(
        CONFIG.ui.notifications.connectionBadge,
        envConfig.ui.notifications.connectionBadge
      );
    }

    if (envConfig.voice?.audioReplay) {
      Object.assign(CONFIG.voice.audioReplay.debug, envConfig.voice.audioReplay.debug);
    }

    validateConfig();

    const expectedLatency =
      CONFIG.voice.turnDetection.maximumSilenceDuration +
      CONFIG.voice.responseFlow.expectedResponseLatency +
      CONFIG.performance.audioLatencyTarget;

    if (CONFIG.debug.enabled) {
      console.log('🔧 ASISTENTE DE VOZ v2.13.3 + Audio Replay - Configuración cargada');
      console.log('📋 Estrategia Voice Mode:', CONFIG.agent.voiceModeStrategy);
      console.log(
        '🎤 Features en tiempo real:',
        CONFIG.features.streamingText ? 'HABILITADO' : 'DESHABILITADO'
      );
      console.log('🎵 Pipeline de audio: 48kHz voice-optimized + Audio Replay System');
      console.log('⚡ Audio Replay Strategy:', CONFIG.voice.audioReplay.strategy.toUpperCase());
      console.log(
        '🔄 End Detection Methods:',
        [
          CONFIG.voice.audioReplay.endDetection.enableTrackMuted ? 'TrackMuted' : null,
          CONFIG.voice.audioReplay.endDetection.enableActiveSpeakers ? 'ActiveSpeakers' : null,
          CONFIG.voice.audioReplay.endDetection.enableTranscriptionFinal
            ? 'TranscriptionFinal'
            : null,
        ]
          .filter(Boolean)
          .join(', ')
      );

      console.table({
        'Token Endpoint': CONFIG.livekit.tokenEndpoint ? '✅ Configurado' : '❌ Faltante',
        'WebSocket URL': CONFIG.livekit.wsUrl ? '✅ Configurado' : '❌ Faltante',
        'Estrategia Voice': '✅ dynamic (optimizado)',
        'Audio Replay': CONFIG.voice.audioReplay.enabled ? '✅ Habilitado' : '❌ Deshabilitado',
        'Replay Strategy': `✅ ${CONFIG.voice.audioReplay.strategy}`,
        'Multiple End Detection': CONFIG.voice.audioReplay.endDetection.enableTrackMuted
          ? '✅ Habilitado'
          : '❌ Deshabilitado',
        'Audio Latency (ms)': `✅ ${CONFIG.performance.audioLatencyTarget}ms`,
        'Turn Detection Timeout': `✅ ${CONFIG.livekit.roomOptions.turnDetection.silenceTimeout}ms`,
        'Expected Response Time': `⚡ ${expectedLatency}ms`,
      });

      console.group('🎤 Audio Replay System v2.13.3:');
      console.log('• Strategy: REPLACE (último mensaje siempre)');
      console.log('• Detection: Multi-source (TrackMuted + ActiveSpeakers + isFinal)');
      console.log('• Recording: WebM/Opus optimizado para voz');
      console.log('• Cleanup: Auto-revoke blob URLs');
      console.log('• Fallback: Detección de silencio como safety');
      console.log('• Debug: Logging detallado en desarrollo');
      console.groupEnd();
    }

    return CONFIG;
  } catch (error) {
    console.error('❌ Falló la inicialización de configuración:', error);
    throw error;
  }
}

// Inicializar configuración
try {
  initializeConfig();
} catch (error) {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
                <div class="text-center max-w-md">
                    <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <h1 class="text-xl font-bold mb-2">Error de Configuración del Asistente de Voz</h1>
                    <p class="text-gray-300 mb-4">
                        No se pudo inicializar la configuración optimizada para voz + Audio Replay.
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

// Export para acceso global
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

// Logger centralizado actualizado
class Logger {
  static init() {
    this.isProduction = !CONFIG.debug.enabled;
  }

  static debug(message, ...args) {
    if (CONFIG.debug.enabled && CONFIG.debug.logLevel === 'debug') {
      console.log(`🔍 ${message}`, ...args);
    }
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

  static audioReplay(message, ...args) {
    if (CONFIG.voice.audioReplay.debug.logRecordingEvents) {
      console.log(`🎵 REPLAY: ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    console.error(`❌ ${message}`, ...args);
  }
}

Logger.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
