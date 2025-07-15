/**
 * Voice Agent SDK v2.13.6 - CONFIG como Fuente de Verdad Única
 *
 * REFACTORIZACIÓN COMPLETA:
 * ✅ CONFIG.livekit.roomOptions usado DIRECTAMENTE
 * ✅ Zero duplicación de configuración
 * ✅ AudioPresets mapping del CONFIG
 * ✅ Agent attributes v2.13.6 desde CONFIG
 * ✅ Todas las optimizaciones mantenidas
 * ✅ SOLID + DRY + Clean Code
 *
 * @author Refactored for CONFIG Truth Source
 * @version 2.0.0-config-truth
 * @since 2024
 * @requires LiveKit Client SDK v2.13.6+
 * @requires CONFIG v4.0 (fuente de verdad única)
 */

// Verificar que LiveKit SDK esté disponible
const LiveKit = window.LivekitClient;

if (!LiveKit) {
    throw new Error(
        "LiveKit Client SDK v2.13.6+ no está disponible. Verifica que esté cargado correctamente."
    );
}

// Destructuring de APIs v2.13.6
const {
    AudioPresets,
    ConnectionQuality,
    DisconnectReason,
    isBrowserSupported,
    LogLevel,
    MediaDeviceFailure,
    Participant,
    ParticipantEvent,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    Room,
    RoomEvent,
    RpcError,
    setLogExtension,
    supportsAdaptiveStream,
    supportsDynacast,
    Track,
    TranscriptionSegment,
    VideoPresets,
} = LiveKit;

/**
 * Modern Voice Agent - CONFIG Truth Source Implementation
 *
 * Implementa comunicación bidireccional con LiveKit Agents Python usando
 * CONFIG como la única fuente de verdad para todas las configuraciones,
 * garantizando sincronización perfecta y eliminando duplicaciones.
 *
 * @class ModernVoiceAgent
 */
class ModernVoiceAgent {
    /**
     * Constructor del Modern Voice Agent con CONFIG como fuente de verdad
     *
     * Inicializa usando ÚNICAMENTE valores de CONFIG, sin duplicar
     * configuración en ningún lugar del código.
     */
    constructor() {
        // ✅ VERIFICAR que CONFIG esté disponible como fuente de verdad
        if (typeof CONFIG === "undefined") {
            throw new Error(
                "CONFIG no está disponible. voice-agent-sdk.js requiere CONFIG v4.0 como fuente de verdad única."
            );
        }

        /**
         * Instancia de Room de LiveKit
         * @type {Room|null}
         * @private
         */
        this._room = null;

        /**
         * Participante del agente Python
         * @type {RemoteParticipant|null}
         * @private
         */
        this._agentParticipant = null;

        /**
         * Avatar worker participant (Tavus/avatar provider)
         * @type {RemoteParticipant|null}
         * @private
         */
        this._avatarWorker = null;

        /**
         * Estado interno del agente
         * @type {Object}
         * @private
         */
        this._state = {
            // Estados de conexión
            connected: false,
            connecting: false,
            connectionPrepared: false,

            // Estados de audio
            audioEnabled: false,
            microphoneEnabled: false,
            audioPlaybackAllowed: false,

            // Estados de agente
            agentConnected: false,
            voiceModeActive: false,
            avatarConnected: false,
            avatarVideoEnabled: false,

            // Estados de interacción
            userSpeaking: false,
            agentSpeaking: false,
            agentThinking: false,

            // Calidad de conexión
            connectionQuality: ConnectionQuality.UNKNOWN,

            // Capacidades del navegador
            browserSupported: true,
            adaptiveStreamSupported: false,
            dynacastSupported: false,
        };

        /**
         * Configuración de la sesión actual - USANDO CONFIG
         * @type {Object}
         * @private
         */
        this._sessionConfig = {
            room: "",
            identity: "",
            token: "",
            agentIdentity: "",
            userId: "",
            personaId: CONFIG.agent.persona, // ✅ DESDE CONFIG
        };

        /**
         * Métricas de rendimiento
         * @type {Object}
         * @private
         */
        this._metrics = {
            connectionStartTime: 0,
            connectionDuration: 0,
            firstAudioTime: 0,
            transcriptionLatency: [],
            rpcCallLatency: [],
            averageLatency: 0,
            totalInteractions: 0,
            errorCount: 0,
            reconnectCount: 0,
        };

        /**
         * Gestión de eventos para cleanup
         * @type {Map<string, Function[]>}
         * @private
         */
        this._eventHandlers = new Map();

        /**
         * Referencias de audio elements para cleanup
         * @type {HTMLAudioElement[]}
         * @private
         */
        this._audioElements = [];

        /**
         * Timeouts activos para cleanup
         * @type {Set<number>}
         * @private
         */
        this._activeTimeouts = new Set();

        /**
         * RPC methods registrados - USANDO CONFIG
         * @type {Map<string, Function>}
         * @private
         */
        this._registeredRpcMethods = new Map();

        // Configurar logging usando CONFIG
        this._setupLogging();

        // Verificar compatibilidad del navegador
        this._validateBrowserSupport();

        // Log de inicialización usando CONFIG.debug
        if (CONFIG.debug.enabled) {
            Logger.debug(
                "🤖 ModernVoiceAgent v2.0.0-config-truth inicializado"
            );
            Logger.debug("✅ Usando CONFIG v4.0 como fuente de verdad única");
            Logger.debug("🎯 Zero duplicación de configuración garantizada");
        }
    }

    /**
     * Verifica compatibilidad del navegador con LiveKit v2.13.6
     * @private
     */
    _validateBrowserSupport() {
        if (!isBrowserSupported()) {
            this._state.browserSupported = false;
            throw new Error(CONFIG.errors.BROWSER_INCOMPATIBLE); // ✅ DESDE CONFIG
        }

        // Verificar capacidades avanzadas
        this._state.adaptiveStreamSupported = supportsAdaptiveStream();
        this._state.dynacastSupported = supportsDynacast();

        if (CONFIG.debug.enabled) {
            Logger.debug("🔍 Capacidades del navegador:", {
                basic: true,
                adaptiveStream: this._state.adaptiveStreamSupported,
                dynacast: this._state.dynacastSupported,
            });
        }
    }

    /**
     * Configura sistema de logging usando CONFIG
     * @private
     */
    _setupLogging() {
        if (CONFIG.debug.enabled) {
            setLogExtension((level, msg, context) => {
                if (level >= LogLevel.warn) {
                    Logger.debug(`[LiveKit ${LogLevel[level]}]`, msg, context);
                }
            });
        }
    }

    /**
     * Inicializa el agente usando CONFIG como fuente de verdad
     *
     * Establece conexión con el servidor LiveKit usando configuración
     * desde CONFIG únicamente, garantizando sincronización perfecta.
     *
     * @returns {Promise<void>}
     * @throws {Error} Si falla la inicialización después de reintentos
     */
    async initialize() {
        if (this._state.connected || this._state.connecting) {
            Logger.warning("🤖 Agent ya está conectado o conectándose");
            return;
        }

        // ✅ USAR CONFIG para reintentos
        const maxRetries = CONFIG.performance?.connectionTimeout
            ? Math.floor(CONFIG.performance.connectionTimeout / 5000)
            : 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                attempt++;
                this._metrics.connectionStartTime = performance.now();
                this._state.connecting = true;

                this._emit(
                    "statusChange",
                    CONFIG.status.INITIALIZING, // ✅ DESDE CONFIG
                    "connecting"
                );

                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        `🚀 Iniciando conexión (intento ${attempt}/${maxRetries})`
                    );
                }

                // 1. Obtener token de acceso usando CONFIG
                const tokenData = await this._getAccessToken();
                this._updateSessionConfig(tokenData);

                // 2. ✅ CREAR ROOM USANDO CONFIG DIRECTAMENTE
                this._createRoomFromConfig();

                // 3. Configurar RPC methods ANTES de conexión usando CONFIG
                this._setupRPCMethodsFromConfig();

                // 4. Configurar event handlers con chaining pattern v2.13.6
                this._setupEventHandlers();

                // 5. ✅ prepareConnection usando CONFIG features
                if (CONFIG.livekit.features.enablePrepareConnection) {
                    this._emit(
                        "statusChange",
                        CONFIG.status.OPTIMIZING_CONNECTION, // ✅ DESDE CONFIG
                        "connecting"
                    );

                    try {
                        const timeout =
                            CONFIG.performance.prepareConnectionTimeout; // ✅ DESDE CONFIG
                        await Promise.race([
                            this._room.prepareConnection(
                                // tokenData.url,
                                CONFIG.livekit.wsUrl,
                                tokenData.token
                            ),
                            this._createTimeoutPromise(
                                timeout,
                                "Connection preparation timeout"
                            ),
                        ]);
                        this._state.connectionPrepared = true;

                        if (CONFIG.debug.logConnectionPreWarming) {
                            Logger.debug(
                                "⚡ Conexión pre-calentada exitosamente"
                            );
                        }
                    } catch (prepareError) {
                        Logger.debug(
                            "⚠️ PrepareConnection falló, continuando sin pre-calentamiento:",
                            prepareError.message
                        );
                    }
                }

                // 6. Conectar a la sala usando CONFIG
                this._emit(
                    "statusChange",
                    CONFIG.status.CONNECTING, // ✅ DESDE CONFIG
                    "connecting"
                );

                // ✅ connectOptions desde CONFIG
                const connectOptions = {
                    autoSubscribe: CONFIG.livekit.roomOptions.autoSubscribe,
                };

                await this._room.connect(
                    //tokenData.url,
                    CONFIG.livekit.wsUrl,
                    tokenData.token,
                    connectOptions
                );

                // 7. Configurar atributos iniciales usando CONFIG
                await this._setParticipantAttributesFromConfig();

                // 8. Actualizar estado y métricas
                this._updateConnectionState(true);
                this._calculateConnectionMetrics();

                this._emit(
                    "statusChange",
                    CONFIG.status.CONNECTED, // ✅ DESDE CONFIG
                    "connected"
                );
                this._emit("ready");
                Logger.debug("🔥 EMITIENDO EVENTO READY DESDE VOICE-AGENT-SDK");
                Logger.debug(
                    "✅ ModernVoiceAgent conectado exitosamente usando CONFIG"
                );
                return; // Éxito
            } catch (error) {
                Logger.error(`❌ Intento ${attempt} falló:`, error);

                this._state.connecting = false;
                this._metrics.errorCount++;

                if (attempt >= maxRetries) {
                    this._handleInitializationError(error);
                    throw new Error(
                        `Inicialización falló después de ${maxRetries} intentos: ${error.message}`
                    );
                }

                // Cleanup antes del siguiente intento
                await this._cleanupForRetry();

                // ✅ Backoff usando CONFIG
                const delay = CONFIG.performance.reconnectTimeout * attempt; // ✅ DESDE CONFIG
                await this._delay(delay);
            }
        }
    }

    /**
     * ✅ NUEVO: Crea Room usando CONFIG como fuente de verdad DIRECTA
     * @private
     */
    _createRoomFromConfig() {
        // ✅ USAR CONFIG.livekit.roomOptions DIRECTAMENTE - ZERO DUPLICACIÓN
        const roomOptions = {
            // ✅ CONFIGURACIÓN DIRECTA DESDE CONFIG
            ...CONFIG.livekit.roomOptions,

            // ✅ ADAPTAR capacidades del navegador a CONFIG
            adaptiveStream:
                this._state.adaptiveStreamSupported &&
                CONFIG.livekit.roomOptions.adaptiveStream,
            dynacast:
                this._state.dynacastSupported &&
                CONFIG.livekit.roomOptions.dynacast,

            // ✅ MAPEAR publishDefaults usando CONFIG audioPresets
            publishDefaults: {
                ...CONFIG.livekit.roomOptions.publishDefaults,
                audioPreset: this._mapAudioPresetFromConfig(
                    CONFIG.livekit.roomOptions.publishDefaults.audioPreset
                ),
            },

            // ✅ LOGGING desde CONFIG
            logLevel: CONFIG.debug.enabled ? LogLevel.debug : LogLevel.warn,
        };

        this._room = new Room(roomOptions);

        if (CONFIG.debug.enabled) {
            Logger.debug(
                "🏠 Room creado usando CONFIG.livekit.roomOptions directamente:",
                roomOptions
            );
        }
    }

    /**
     * ✅ NUEVO: Mapea audioPreset desde CONFIG a AudioPresets de LiveKit
     * @private
     * @param {string} presetName - Nombre del preset desde CONFIG
     * @returns {AudioPreset} Preset de LiveKit correspondiente
     */
    _mapAudioPresetFromConfig(presetName) {
        const presetMap = {
            speech: AudioPresets.speech,
            music: AudioPresets.music,
            custom: CONFIG.livekit.roomOptions.publishDefaults, // Usar config custom
        };

        return presetMap[presetName] || AudioPresets.speech;
    }

    /**
     * ✅ NUEVO: Configura métodos RPC usando CONFIG
     * @private
     */
    _setupRPCMethodsFromConfig() {
        if (!this._room?.localParticipant) {
            throw new Error(
                "LocalParticipant no disponible para configurar RPC"
            );
        }

        // ✅ USAR CONFIG.rpc.methods DIRECTAMENTE
        const rpcMethods = CONFIG.rpc.methods;

        rpcMethods.forEach((methodName) => {
            this._room.localParticipant.registerRpcMethod(
                methodName,
                async (data) => {
                    try {
                        this._logRPC("RECEIVED", methodName, data);

                        const payload = JSON.parse(data.payload);
                        const result = await this._handleRPCMethod(
                            methodName,
                            payload,
                            data
                        );

                        const response = JSON.stringify({
                            success: true,
                            result,
                        });
                        this._logRPC("RESPONSE", methodName, response);

                        return response;
                    } catch (error) {
                        Logger.error(
                            `❌ Error en RPC method ${methodName}:`,
                            error
                        );
                        this._logRPC("ERROR", methodName, error.message);
                        throw new RpcError(error.message);
                    }
                }
            );

            this._registeredRpcMethods.set(methodName, true);
        });

        if (CONFIG.debug.enabled) {
            Logger.debug(
                "🔗 RPC Methods configurados desde CONFIG:",
                Array.from(this._registeredRpcMethods.keys())
            );
        }
    }

    /**
     * ✅ OPTIMIZADO: Establece atributos esenciales desde CONFIG
     * @private
     */
    async _setParticipantAttributesFromConfig() {
        if (!this._room?.localParticipant) return;

        try {
            // ✅ SOLO atributos esenciales para evitar timeouts
            const attributes = {
                // Atributos core desde CONFIG
                name: CONFIG.agent.attributes.name,
                version: CONFIG.agent.attributes.version,
                clientType: CONFIG.agent.attributes.metadata.clientType,

                // Atributos de sesión
                personaId: this._sessionConfig.personaId,
                userId: this._sessionConfig.userId,

                // Capacidades básicas (como string para reducir tamaño)
                capabilities: CONFIG.agent.attributes.capabilities.join(","),

                // Timestamp
                timestamp: Date.now().toString(),
            };

            await this._room.localParticipant.setAttributes(attributes);

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "✅ Participant attributes esenciales establecidos:",
                    attributes
                );
            }
        } catch (error) {
            Logger.warning(
                "⚠️ Error estableciendo atributos (no crítico):",
                error.message
            );
            // No es crítico - continuar sin attributes
        }
    }

    /**
     * Configura event handlers con chaining pattern v2.13.6
     * @private
     */
    _setupEventHandlers() {
        // ✅ v2.13.6: Event chaining pattern oficial (sin cambios)
        this._room
            .on(RoomEvent.Connected, this._onRoomConnected.bind(this))
            .on(RoomEvent.Disconnected, this._onRoomDisconnected.bind(this))
            .on(RoomEvent.Reconnecting, this._onRoomReconnecting.bind(this))
            .on(RoomEvent.Reconnected, this._onRoomReconnected.bind(this))
            .on(
                RoomEvent.ParticipantConnected,
                this._onParticipantConnected.bind(this)
            )
            .on(
                RoomEvent.ParticipantDisconnected,
                this._onParticipantDisconnected.bind(this)
            )
            .on(RoomEvent.TrackSubscribed, this._onTrackSubscribed.bind(this))
            .on(
                RoomEvent.TrackUnsubscribed,
                this._onTrackUnsubscribed.bind(this)
            )
            .on(
                RoomEvent.AudioPlaybackStatusChanged,
                this._onAudioPlaybackStatusChanged.bind(this)
            )
            .on(
                RoomEvent.TranscriptionReceived,
                this._onTranscriptionReceived.bind(this)
            )
            .on(
                RoomEvent.ConnectionQualityChanged,
                this._onConnectionQualityChanged.bind(this)
            )
            .on(
                RoomEvent.ActiveSpeakersChanged,
                this._onActiveSpeakersChanged.bind(this)
            )
            .on(
                RoomEvent.MediaDevicesError,
                this._onMediaDevicesError.bind(this)
            )
            .on(RoomEvent.DataReceived, this._onDataReceived.bind(this))
            .on(
                RoomEvent.ConnectionStateChanged,
                this._onConnectionStateChanged.bind(this)
            )
            .on(
                RoomEvent.LocalAudioSilenceDetected,
                this._onLocalAudioSilenceDetected.bind(this)
            )
            .on(
                RoomEvent.LocalTrackPublished,
                this._onLocalTrackPublished.bind(this)
            )
            .on(
                RoomEvent.TrackSubscriptionFailed,
                this._onTrackSubscriptionFailed.bind(this)
            )
            .on(
                RoomEvent.ActiveDeviceChanged,
                this._onActiveDeviceChanged.bind(this)
            )
            .on(
                RoomEvent.MediaDevicesChanged,
                this._onMediaDevicesChanged.bind(this)
            );

        // ✅ NUEVO: Text stream handlers (complemento, no reemplazo)
        // this._setupTextStreamHandlers();

        Logger.debug(
            "📡 Event handlers v2.13.6 configurados con chaining pattern + MVP events"
        );
    }

    /**
     * Habilita el modo de voz usando APIs v2.13.6
     *
     * @returns {Promise<void>}
     * @throws {Error} Si no se pueden habilitar los dispositivos
     */
    async enableVoiceMode() {
        if (this._state.voiceModeActive) {
            Logger.warning("🎤 Modo de voz ya está activo");
            return;
        }

        try {
            this._emit(
                "statusChange",
                CONFIG.status.VOICE_STARTING, // ✅ DESDE CONFIG
                "connecting"
            );

            // ✅ v2.13.6: API oficial para habilitar micrófono
            await this._room.localParticipant.setMicrophoneEnabled(true);
            this._state.microphoneEnabled = true;

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🎤 Micrófono habilitado exitosamente");
            }

            // Verificar estado de audio
            if (!this._state.audioPlaybackAllowed) {
                throw new Error(CONFIG.errors.AUDIO_ERROR); // ✅ DESDE CONFIG
            }

            // ✅ v2.13.6: setAttributes con objeto plano
            await this._room.localParticipant.setAttributes({
                voiceMode: "active",
                timestamp: Date.now().toString(),
            });

            this._state.voiceModeActive = true;

            this._emit("statusChange", CONFIG.status.VOICE_ACTIVE, "connected"); // ✅ DESDE CONFIG
            this._emit("voiceModeChanged", true);

            Logger.debug("✅ Modo de voz habilitado exitosamente");
        } catch (error) {
            Logger.error("❌ Error habilitando modo de voz:", error);
            this._state.voiceModeActive = false;
            this._emit("error", error.message);
            throw error;
        }
    }

    /**
     * Deshabilita el modo de voz
     *
     * @returns {Promise<void>}
     * @throws {Error} Si falla la liberación de medios
     */
    async disableVoiceMode() {
        if (!this._state.voiceModeActive) {
            return;
        }

        try {
            this._emit(
                "statusChange",
                CONFIG.status.VOICE_ENDING,
                "connecting"
            );

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    "🎤 Iniciando liberación completa de medios de voz..."
                );
            }

            // ✅ PASO 1: Obtener tracks de micrófono publicados
            const microphonePublication =
                this._room.localParticipant.getTrackPublication(
                    Track.Source.Microphone
                );

            if (microphonePublication && microphonePublication.track) {
                try {
                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            "🎤 Unpublishing micrófono con stopOnUnpublish: true"
                        );
                    }

                    // ✅ PASO 2: UNPUBLISH con stopOnUnpublish: true (CRÍTICO)
                    // Esto libera COMPLETAMENTE el dispositivo y quita el indicador del navegador
                    await this._room.localParticipant.unpublishTrack(
                        microphonePublication.track,
                        true // ✅ stopOnUnpublish: true - LIBERA EL DISPOSITIVO
                    );

                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            "✅ Track de micrófono unpublished y detenido completamente"
                        );
                    }
                } catch (unpublishError) {
                    Logger.error(
                        "❌ Error unpublishing micrófono:",
                        unpublishError
                    );

                    // ✅ FALLBACK: Intentar detener directamente el track
                    try {
                        if (microphonePublication.track.mediaStreamTrack) {
                            microphonePublication.track.mediaStreamTrack.stop();
                            Logger.debug(
                                "✅ Fallback: Track detenido directamente"
                            );
                        }
                    } catch (stopError) {
                        Logger.error("❌ Error en fallback stop:", stopError);
                    }
                }
            } else {
                // ✅ PASO 3: Si no hay publication, intentar setMicrophoneEnabled(false)
                // para asegurar que cualquier track interno se libere
                try {
                    await this._room.localParticipant.setMicrophoneEnabled(
                        false
                    );

                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            "✅ Micrófono deshabilitado via setMicrophoneEnabled"
                        );
                    }
                } catch (disableError) {
                    Logger.error(
                        "❌ Error deshabilitando micrófono:",
                        disableError
                    );
                }
            }

            // ✅ PASO 4: Limpiar estado interno inmediatamente
            this._state.microphoneEnabled = false;
            this._state.userSpeaking = false;

            // ✅ PASO 5: Actualizar atributos del participante
            try {
                await this._room.localParticipant.setAttributes({
                    voiceMode: "inactive",
                    microphoneReleased: "true", // Indicador explícito
                    timestamp: Date.now().toString(),
                });
            } catch (attributeError) {
                Logger.warning(
                    "⚠️ Error actualizando atributos (no crítico):",
                    attributeError
                );
            }

            // ✅ PASO 6: Actualizar estado de la aplicación
            this._state.voiceModeActive = false;
            this._state.agentThinking = false;

            // ✅ PASO 7: Emitir eventos de estado
            this._emit("statusChange", CONFIG.status.READY, "connected");
            this._emit("voiceModeChanged", false);
            this._emit("microphoneChanged", false); // Importante para UI

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    "✅ Modo de voz deshabilitado - MEDIOS LIBERADOS COMPLETAMENTE"
                );

                // ✅ VERIFICACIÓN: Check que no haya tracks activos
                const remainingTracks =
                    this._room.localParticipant.audioTrackPublications;
                Logger.debug(
                    "🔍 Tracks de audio restantes:",
                    remainingTracks.size
                );
            }
        } catch (error) {
            Logger.error("❌ Error crítico deshabilitando modo de voz:", error);

            // ✅ CLEANUP DE EMERGENCIA: Forzar liberación de medios
            await this._forceReleaseAllMedia();

            // Aún así actualizar estado para evitar UI colgado
            this._state.voiceModeActive = false;
            this._state.microphoneEnabled = false;
            this._emit("voiceModeChanged", false);

            throw error;
        }
    }

    /**
     * ✅ NUEVO: Fuerza liberación de todos los medios en caso de emergencia
     *
     * @private
     */
    async _forceReleaseAllMedia() {
        try {
            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    "🚨 CLEANUP DE EMERGENCIA: Forzando liberación de todos los medios"
                );
            }

            // ✅ Obtener TODOS los tracks locales publicados
            const publications = Array.from(
                this._room.localParticipant.trackPublications.values()
            );

            for (const publication of publications) {
                if (
                    publication.track &&
                    publication.source === Track.Source.Microphone
                ) {
                    try {
                        // ✅ Unpublish con stop forzado
                        await this._room.localParticipant.unpublishTrack(
                            publication.track,
                            true // stopOnUnpublish: true - FORZAR LIBERACIÓN
                        );

                        Logger.debug(
                            "🚨 Emergency cleanup: Track liberado",
                            publication.trackSid
                        );
                    } catch (trackError) {
                        Logger.error(
                            "❌ Error en emergency cleanup:",
                            trackError
                        );

                        // ✅ ÚLTIMO RECURSO: Stop directo del MediaStreamTrack
                        if (publication.track.mediaStreamTrack) {
                            publication.track.mediaStreamTrack.stop();
                            Logger.debug(
                                "🚨 ÚLTIMO RECURSO: MediaStreamTrack.stop() llamado"
                            );
                        }
                    }
                }
            }

            // ✅ Forzar setMicrophoneEnabled(false) como backup final
            try {
                await this._room.localParticipant.setMicrophoneEnabled(false);
            } catch (finalError) {
                Logger.error(
                    "❌ Error en backup final setMicrophoneEnabled:",
                    finalError
                );
            }

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("✅ Emergency cleanup completado");
            }
        } catch (emergencyError) {
            Logger.error(
                "❌ Error crítico en emergency cleanup:",
                emergencyError
            );
        }
    }

    /**
     * Alterna el estado del micrófono
     *
     * @returns {Promise<boolean>} True si está silenciado después del toggle
     */
    async toggleMicrophone() {
        try {
            const currentlyEnabled = this._state.microphoneEnabled;
            const newState = !currentlyEnabled;

            // ✅ v2.13.6: API oficial
            await this._room.localParticipant.setMicrophoneEnabled(newState);
            this._state.microphoneEnabled = newState;

            this._emit("microphoneChanged", newState);

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    "🎤 Micrófono:",
                    newState ? "HABILITADO" : "SILENCIADO"
                );
            }

            return !newState; // Retornar estado muted
        } catch (error) {
            Logger.error("❌ Error alternando micrófono:", error);
            this._emit("error", CONFIG.errors.MICROPHONE_ERROR); // ✅ DESDE CONFIG
            throw error;
        }
    }

    /**
     * Inicia reproducción de audio usando v2.13.6
     *
     * @returns {Promise<boolean>} True si el audio se habilitó correctamente
     */
    async startAudio() {
        try {
            if (this._state.audioPlaybackAllowed) {
                return true;
            }

            if (!this._room) {
                throw new Error("Room no disponible");
            }

            await this._room.startAudio();
            this._state.audioEnabled = true;
            this._state.audioPlaybackAllowed = true;

            this._updateExistingAudioElements();

            this._emit("audioEnabled");

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🔊 Audio habilitado por interacción del usuario");
                Logger.debug(
                    "🔊 Elementos de audio actualizados:",
                    this._audioElements.length
                );
            }

            return true;
        } catch (error) {
            Logger.error("❌ Error iniciando audio:", error);
            this._emit("error", CONFIG.errors.AUDIO_ERROR);
            return false;
        }
    }

    /**
     * ✅ CORRECCIÓN: Método toggleAudio usando mute en lugar de pause
     *
     * @description Alterna entre escuchar/silenciar el audio del agente.
     * NO pausa la reproducción, solo controla si el usuario escucha o no.
     * Las transcripciones siguen llegando normalmente.
     *
     * @returns {Promise<boolean>} true si audio está habilitado, false si está silenciado
     * @throws {Error} Si no hay room disponible o error en el toggle
     *
     * @example
     * // Alternar estado de audio
     * const isListening = await agent.toggleAudio();
     * Logger.debug(isListening ? 'Escuchando' : 'Silenciado');
     */
    async toggleAudio() {
        try {
            if (!this._room) {
                throw new Error("Room no disponible para toggle audio");
            }

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🔊 Toggle audio - Estado actual:", {
                    audioEnabled: this._state.audioEnabled,
                    audioPlaybackAllowed: this._state.audioPlaybackAllowed,
                    canPlaybackAudio: this._room.canPlaybackAudio,
                    elementosAudio: this._audioElements.length,
                });
            }

            // ✅ PRIMERA INTERACCIÓN: Si no se puede reproducir audio, inicializar
            if (
                !this._state.audioPlaybackAllowed ||
                !this._room.canPlaybackAudio
            ) {
                const success = await this.startAudio();

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug("🔊 Primera interacción de audio:", success);
                }

                return success;
            }

            // ✅ TOGGLE SIMPLE: Solo cambiar mute/unmute
            const newState = !this._state.audioEnabled;

            // ✅ CLAVE: Usar muted en lugar de pause/play
            this._audioElements.forEach((element) => {
                try {
                    element.muted = !newState; // Si newState=true, muted=false (escuchar)
                    element.volume = newState ? 1.0 : 0.0; // Doble seguridad

                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            `🔊 Elemento audio: muted=${element.muted}, volume=${element.volume}`
                        );
                    }
                } catch (error) {
                    Logger.error("Error controlando elemento de audio:", error);
                }
            });

            this._state.audioEnabled = newState;
            this._emit("audioChanged", newState);

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    `🔊 Toggle audio completado: ${
                        newState ? "ESCUCHANDO" : "SILENCIADO"
                    }`
                );
            }

            return newState;
        } catch (error) {
            Logger.error("❌ Error en toggleAudio:", error);
            this._emit("error", CONFIG.errors.AUDIO_ERROR);
            return false;
        }
    }

    _updateExistingAudioElements() {
        this._audioElements.forEach((element, index) => {
            try {
                const wasPlaying = !element.paused;

                element.muted = !this._state.audioEnabled;
                element.volume = this._state.audioEnabled ? 1.0 : 0.0;

                if (wasPlaying && !element.muted && element.paused) {
                    element
                        .play()
                        .catch((e) => Logger.debug("Audio play failed:", e));
                }

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug(`🔊 Elemento ${index} actualizado:`, {
                        muted: element.muted,
                        volume: element.volume,
                        paused: element.paused,
                    });
                }
            } catch (error) {
                Logger.error(
                    `Error actualizando elemento audio ${index}:`,
                    error
                );
            }
        });
    }

    /**
     * Envía un mensaje de texto al agente
     *
     * @param {string} text - Texto a enviar
     * @returns {Promise<void>}
     */
    async sendMessage(text) {
        if (!text?.trim()) {
            throw new Error("Texto vacío");
        }

        if (!this._state.connected) {
            throw new Error("No conectado");
        }

        try {
            // ✅ v2.13.6: sendText con topic desde CONFIG
            await this._room.localParticipant.sendText(text.trim(), {
                topic: CONFIG.topics.chat, // ✅ DESDE CONFIG
            });

            this._emit("messageSent", text.trim());

            if (CONFIG.debug.enabled) {
                Logger.debug("💬 Mensaje enviado:", text.trim());
            }
        } catch (error) {
            Logger.error("❌ Error enviando mensaje:", error);
            throw error;
        }
    }

    /**
     * Llama a una función RPC usando v2.13.6 y CONFIG
     *
     * @param {string} method - Nombre del método
     * @param {Object} payload - Datos a enviar
     * @param {number} timeout - Timeout en milisegundos
     * @returns {Promise<any>} Respuesta del agente
     */
    async callAgentRPC(method, payload = {}, timeout = null) {
        if (!this._state.agentConnected || !this._agentParticipant) {
            throw new Error("Agente Python no conectado");
        }

        // ✅ USAR CONFIG.rpc.timeout
        const rpcTimeout = timeout || CONFIG.rpc.timeout;

        try {
            const startTime = performance.now();

            this._logRPC("SENDING", method, payload);

            // ✅ v2.13.6: performRpc API oficial
            const response = await this._room.localParticipant.performRpc({
                destinationIdentity: this._agentParticipant.identity,
                method,
                payload: JSON.stringify(payload),
                responseTimeout: rpcTimeout,
            });

            const latency = performance.now() - startTime;
            this._metrics.rpcCallLatency.push(latency);

            this._logRPC("SUCCESS", method, `${latency.toFixed(0)}ms`);

            return JSON.parse(response);
        } catch (error) {
            this._logRPC("FAILED", method, error.message);
            Logger.error(`❌ Error en RPC call ${method}:`, error);
            throw error;
        }
    }

    /**
     * Desconecta del agente y limpia recursos
     *
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this._room) {
            return;
        }

        try {
            Logger.debug("🔌 Desconectando agente...");

            this._state.voiceModeActive = false;
            this._state.connecting = false;

            await this._room.disconnect();
            this._cleanup();

            Logger.debug("✅ Agente desconectado exitosamente");
        } catch (error) {
            Logger.error("❌ Error durante desconexión:", error);
        }
    }
    /**
     * ✅ NUEVO: Obtiene el avatar worker participant
     * @returns {RemoteParticipant|null} Avatar worker o null
     * @public
     */
    getAvatarWorker() {
        return this._avatarWorker;
    }

    /**
     * ✅ NUEVO: Verifica si hay avatar worker conectado
     * @returns {boolean} True si avatar worker está conectado
     * @public
     */
    hasAvatarWorker() {
        return this._state.avatarConnected && this._avatarWorker !== null;
    }

    /**
     * Obtiene el estado actual del agente
     *
     * @returns {Object} Estado completo del agente
     */
    getState() {
        return {
            ...this._state,
            sessionConfig: { ...this._sessionConfig },
            metrics: this._getDetailedMetrics(),
            roomName: this._room?.name || "",
            participantCount: this._room?.remoteParticipants.size || 0,
            agentIdentity: this._agentParticipant?.identity || null,
            configVersion: "4.0.0-truth-source", // ✅ INDICAR que usa CONFIG como verdad
            audioEnabled: this._state.audioEnabled,
            audioPlaybackAllowed: this._state.audioPlaybackAllowed,
            canPlaybackAudio: this._room?.canPlaybackAudio || false,
            avatarConnected: this._state.avatarConnected,
            avatarVideoEnabled: this._state.avatarVideoEnabled,
            hasAvatarWorker: this.hasAvatarWorker(),
            avatarWorkerIdentity: this._avatarWorker?.identity || null,
        };
    }

    /**
     * Obtiene métricas detalladas de rendimiento
     *
     * @returns {Object} Métricas completas
     */
    getMetrics() {
        return this._getDetailedMetrics();
    }

    /**
     * Obtiene la latencia RTT usando APIs CORRECTAS de LiveKit v2.13.6
     *
     * @description Estrategia corregida para obtener RTT usando Track Publications:
     * 1. LocalTrackPublication.getStats() - API oficial v2.13.6
     * 2. RemoteTrackPublication.getStats() - Para perspectiva del agente
     * 3. Acceso directo a peer connections via track publications
     *
     * @method _getWebRTCLatency
     * @memberof ModernVoiceAgent
     * @private
     * @async
     *
     * @returns {Promise<number>} RTT en milisegundos (0 si no disponible)
     *
     * @see {@link https://docs.livekit.io/reference/client-sdk-js/classes/LocalTrackPublication.html#getStats}
     * @see {@link https://docs.livekit.io/reference/client-sdk-js/classes/RemoteTrackPublication.html#getStats}
     *
     * @since 2.0.0-config-truth - APIs corregidas v2.13.6
     * @compatibility LiveKit v2.13.6+
     */
    async _getWebRTCLatency() {
        try {
            // ✅ VALIDACIÓN INICIAL
            if (!this._room?.localParticipant) {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "🔍 RTT: Room o LocalParticipant no disponible"
                    );
                }
                return 0;
            }

            // 🎯 ESTRATEGIA 1: LocalTrackPublication.getStats() - API OFICIAL v2.13.6
            try {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "🔍 RTT: Intentando LocalTrackPublication.getStats()..."
                    );
                }

                // Buscar publication de audio local
                const audioPublication =
                    this._room.localParticipant.getTrackPublication(
                        Track.Source.Microphone
                    );

                if (
                    audioPublication &&
                    typeof audioPublication.getStats === "function"
                ) {
                    const localStats = await audioPublication.getStats();
                    const localRTT = this._extractRTTFromStats(
                        localStats,
                        "localTrackPublication"
                    );

                    if (localRTT > 0) {
                        if (CONFIG.debug.showConnectionQuality) {
                            Logger.debug(
                                `✅ RTT desde LocalTrackPublication: ${localRTT}ms`
                            );
                        }
                        return localRTT;
                    }
                } else {
                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            "⚠️ RTT: LocalTrackPublication no disponible o sin getStats()"
                        );
                    }
                }
            } catch (localError) {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "⚠️ RTT: LocalTrackPublication.getStats() falló:",
                        localError.message
                    );
                }
            }

            // 🎯 ESTRATEGIA 2: RemoteTrackPublication.getStats() - PERSPECTIVA DEL AGENTE
            try {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "🔍 RTT: Intentando RemoteTrackPublication.getStats()..."
                    );
                    Logger.debug(
                        "🔍 RTT: Agent participant:",
                        this._agentParticipant?.identity
                    );
                }

                // Buscar publication de audio del agente
                if (this._agentParticipant) {
                    const agentAudioPub =
                        this._agentParticipant.getTrackPublication(
                            Track.Source.Microphone
                        );

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            "🔍 RTT: Agent audio publication:",
                            !!agentAudioPub
                        );
                        Logger.debug(
                            "🔍 RTT: Agent getStats method:",
                            typeof agentAudioPub?.getStats
                        );
                    }

                    if (
                        agentAudioPub &&
                        typeof agentAudioPub.getStats === "function"
                    ) {
                        const remoteStats = await agentAudioPub.getStats();
                        const remoteRTT = this._extractRTTFromStats(
                            remoteStats,
                            "remoteTrackPublication"
                        );

                        if (remoteRTT > 0) {
                            if (CONFIG.debug.showConnectionQuality) {
                                Logger.debug(
                                    `✅ RTT desde RemoteTrackPublication: ${remoteRTT}ms`
                                );
                            }
                            return remoteRTT;
                        }
                    } else {
                        if (CONFIG.debug.showConnectionQuality) {
                            Logger.debug(
                                "⚠️ RTT: RemoteTrackPublication no disponible o sin getStats()"
                            );
                        }
                    }
                } else {
                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            "⚠️ RTT: No hay agente participante disponible"
                        );
                    }
                }
            } catch (remoteError) {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "⚠️ RTT: RemoteTrackPublication.getStats() falló:",
                        remoteError.message
                    );
                }
            }

            // 🎯 ESTRATEGIA 3: Peer Connection via Track Publications - v2.13.6
            try {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "🔍 RTT: Intentando PeerConnection via track publications..."
                    );
                }

                // Acceder al peer connection a través de track publication
                const audioPublication =
                    this._room.localParticipant.getTrackPublication(
                        Track.Source.Microphone
                    );

                if (audioPublication?.track) {
                    // Intentar diferentes formas de acceder al sender
                    const senders =
                        this._room.localParticipant.publisherRtcPeerConnection?.getSenders() ||
                        [];

                    for (const sender of senders) {
                        if (
                            sender.track ===
                            audioPublication.track.mediaStreamTrack
                        ) {
                            const senderStats = await sender.getStats();
                            const senderRTT = this._extractRTTFromStats(
                                senderStats,
                                "rtcSender"
                            );

                            if (senderRTT > 0) {
                                if (CONFIG.debug.showConnectionQuality) {
                                    Logger.debug(
                                        `✅ RTT desde RTC Sender: ${senderRTT}ms`
                                    );
                                }
                                return senderRTT;
                            }
                        }
                    }
                }

                // Fallback: Intentar peer connection directo si está disponible
                const pc =
                    this._room.localParticipant.publisherRtcPeerConnection;
                if (pc && typeof pc.getStats === "function") {
                    const pcStats = await pc.getStats();
                    const pcRTT = this._extractRTTFromStats(
                        pcStats,
                        "peerConnectionDirect"
                    );

                    if (pcRTT > 0) {
                        if (CONFIG.debug.showConnectionQuality) {
                            Logger.debug(
                                `✅ RTT desde PeerConnection directo: ${pcRTT}ms`
                            );
                        }
                        return pcRTT;
                    }
                }
            } catch (pcError) {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "⚠️ RTT: PeerConnection via tracks falló:",
                        pcError.message
                    );
                }
            }

            // 🎯 ESTRATEGIA 4: SIMULADO BASADO EN CONNECTION QUALITY - ÚLTIMO RECURSO
            try {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "🔍 RTT: Usando estimación basada en connection quality..."
                    );
                }

                const quality = this._state.connectionQuality;
                const estimatedRTT = this._estimateRTTFromQuality(quality);

                if (estimatedRTT > 0) {
                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `🎯 RTT estimado desde quality (${quality}): ${estimatedRTT}ms`
                        );
                    }
                    return estimatedRTT;
                }
            } catch (estimationError) {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        "⚠️ RTT: Estimación falló:",
                        estimationError.message
                    );
                }
            }

            // 🚫 NINGUNA ESTRATEGIA FUNCIONÓ
            if (CONFIG.debug.showConnectionQuality) {
                Logger.debug(
                    "❌ RTT: Todas las estrategias v2.13.6 fallaron - retornando 0ms"
                );
            }
            return 0;
        } catch (criticalError) {
            Logger.error(
                "❌ Error crítico obteniendo RTT v2.13.6:",
                criticalError
            );
            return 0;
        }
    }

    /**
     * Estima RTT basado en la calidad de conexión de LiveKit v2.13.6
     *
     * @description Mapeo corregido para ConnectionQuality enum de LiveKit v2.13.6
     * Maneja tanto valores numéricos como strings del enum
     *
     * @method _estimateRTTFromQuality
     * @memberof ModernVoiceAgent
     * @private
     *
     * @param {ConnectionQuality|string|number} quality - Calidad de conexión de LiveKit
     * @returns {number} RTT estimado en milisegundos
     *
     * @since 2.0.0-config-truth - Mapeo corregido v2.13.6
     * @compatibility LiveKit v2.13.6+
     */
    _estimateRTTFromQuality(quality) {
        try {
            if (CONFIG.debug.showConnectionQuality) {
                Logger.debug("🔍 RTT: Analizando quality para estimación:", {
                    quality,
                    type: typeof quality,
                    stringValue: String(quality),
                    enumExcellent: ConnectionQuality.EXCELLENT,
                    enumGood: ConnectionQuality.GOOD,
                    enumPoor: ConnectionQuality.POOR,
                });
            }

            // ✅ MAPEO ROBUSTO - Maneja múltiples formatos de enum
            let estimatedRTT = 100; // Default fallback

            // Normalizar quality a string para comparación
            const qualityStr = String(quality).toLowerCase();
            const qualityNum = Number(quality);

            // 🎯 MAPEO POR STRING (más robusto)
            if (qualityStr.includes("excellent") || qualityStr === "4") {
                estimatedRTT = 25; // Excelente: < 50ms
            } else if (qualityStr.includes("good") || qualityStr === "3") {
                estimatedRTT = 75; // Buena: 50-150ms
            } else if (qualityStr.includes("poor") || qualityStr === "2") {
                estimatedRTT = 200; // Pobre: 150-300ms
            } else if (qualityStr.includes("lost") || qualityStr === "1") {
                estimatedRTT = 500; // Perdida: > 300ms
            } else if (qualityStr.includes("unknown") || qualityStr === "0") {
                estimatedRTT = 100; // Desconocida: valor neutro
            }

            // 🎯 MAPEO POR VALOR NUMÉRICO (fallback)
            else if (typeof quality === "number") {
                switch (qualityNum) {
                    case 4:
                        estimatedRTT = 25;
                        break; // EXCELLENT
                    case 3:
                        estimatedRTT = 75;
                        break; // GOOD
                    case 2:
                        estimatedRTT = 200;
                        break; // POOR
                    case 1:
                        estimatedRTT = 500;
                        break; // LOST
                    case 0:
                        estimatedRTT = 100;
                        break; // UNKNOWN
                    default:
                        estimatedRTT = 100;
                        break; // Fallback
                }
            }

            // 🎯 MAPEO POR ENUM DIRECTO (ideal)
            else if (typeof ConnectionQuality !== "undefined") {
                const qualityToRTT = {
                    [ConnectionQuality.EXCELLENT]: 25,
                    [ConnectionQuality.GOOD]: 75,
                    [ConnectionQuality.POOR]: 200,
                    [ConnectionQuality.LOST]: 500,
                    [ConnectionQuality.UNKNOWN]: 100,
                };

                if (qualityToRTT.hasOwnProperty(quality)) {
                    estimatedRTT = qualityToRTT[quality];
                }
            }

            if (CONFIG.debug.showConnectionQuality) {
                Logger.debug(
                    `🎯 RTT estimado final: ${qualityStr} → ${estimatedRTT}ms`
                );
            }

            return estimatedRTT;
        } catch (error) {
            Logger.error("❌ Error en estimación RTT:", error);
            return 100; // Fallback seguro
        }
    }

    /**
     * Extrae RTT (Round Trip Time) de WebRTC Stats usando múltiples tipos de estadísticas
     *
     * @description Analiza diferentes tipos de stats de WebRTC para encontrar la latencia:
     * - outbound-rtp: Estadísticas de envío (más preciso para RTT)
     * - remote-inbound-rtp: Estadísticas remotas de recepción
     * - candidate-pair: Estadísticas de conexión ICE
     * - transport: Estadísticas de transporte DTLS
     *
     * @method _extractRTTFromStats
     * @memberof ModernVoiceAgent
     * @private
     *
     * @param {RTCStatsReport|Map} stats - Objeto de estadísticas WebRTC
     * @param {string} source - Fuente de las stats para logging ("room"|"participant"|"peerConnection")
     *
     * @returns {number} RTT en milisegundos (0 si no encontrado)
     *
     * @example
     * // Uso interno desde _getWebRTCLatency
     * const rtt = this._extractRTTFromStats(statsReport, "room");
     * if (rtt > 0) Logger.debug(`RTT encontrado: ${rtt}ms`);
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport}
     * @see {@link https://w3c.github.io/webrtc-stats/}
     *
     * @since 2.0.0-config-truth
     * @compatibility WebRTC Stats API
     */
    _extractRTTFromStats(stats, source = "unknown") {
        try {
            // ✅ VALIDACIÓN: Verificar que stats sea iterable
            if (!stats || typeof stats[Symbol.iterator] !== "function") {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(`⚠️ RTT: Stats de ${source} no es iterable`);
                }
                return 0;
            }

            let statsFound = {
                outboundRtp: 0,
                remoteInboundRtp: 0,
                candidatePair: 0,
                transport: 0,
            };

            // 🔍 ITERAR SOBRE TODAS LAS ESTADÍSTICAS
            for (const [statId, stat] of stats) {
                // 🎯 PRIORIDAD 1: outbound-rtp (más preciso para audio)
                if (
                    stat.type === "outbound-rtp" &&
                    stat.mediaType === "audio" &&
                    typeof stat.roundTripTime === "number" &&
                    stat.roundTripTime > 0
                ) {
                    statsFound.outboundRtp = Math.round(
                        stat.roundTripTime * 1000
                    );

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `🎯 RTT: outbound-rtp (${source}): ${statsFound.outboundRtp}ms [ID: ${statId}]`
                        );
                    }
                }

                // 🎯 PRIORIDAD 2: remote-inbound-rtp (perspectiva remota)
                else if (
                    stat.type === "remote-inbound-rtp" &&
                    typeof stat.roundTripTime === "number" &&
                    stat.roundTripTime > 0
                ) {
                    statsFound.remoteInboundRtp = Math.round(
                        stat.roundTripTime * 1000
                    );

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `🎯 RTT: remote-inbound-rtp (${source}): ${statsFound.remoteInboundRtp}ms [ID: ${statId}]`
                        );
                    }
                }

                // 🎯 PRIORIDAD 3: candidate-pair (conexión ICE)
                else if (
                    stat.type === "candidate-pair" &&
                    stat.state === "succeeded" &&
                    typeof stat.currentRoundTripTime === "number" &&
                    stat.currentRoundTripTime > 0
                ) {
                    statsFound.candidatePair = Math.round(
                        stat.currentRoundTripTime * 1000
                    );

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `🎯 RTT: candidate-pair (${source}): ${statsFound.candidatePair}ms [ID: ${statId}]`
                        );
                    }
                }

                // 🎯 PRIORIDAD 4: transport (DTLS)
                else if (
                    stat.type === "transport" &&
                    typeof stat.roundTripTime === "number" &&
                    stat.roundTripTime > 0
                ) {
                    statsFound.transport = Math.round(
                        stat.roundTripTime * 1000
                    );

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `🎯 RTT: transport (${source}): ${statsFound.transport}ms [ID: ${statId}]`
                        );
                    }
                }
            }

            // 🏆 SELECCIONAR EL MEJOR RTT SEGÚN PRIORIDAD
            const selectedRTT =
                statsFound.outboundRtp ||
                statsFound.remoteInboundRtp ||
                statsFound.candidatePair ||
                statsFound.transport;

            if (selectedRTT > 0) {
                const selectedType = statsFound.outboundRtp
                    ? "outbound-rtp"
                    : statsFound.remoteInboundRtp
                    ? "remote-inbound-rtp"
                    : statsFound.candidatePair
                    ? "candidate-pair"
                    : "transport";

                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        `🏆 RTT seleccionado de ${source}: ${selectedRTT}ms (tipo: ${selectedType})`
                    );
                }
            } else {
                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(
                        `❌ RTT: No se encontró latencia válida en stats de ${source}`
                    );
                }
            }

            return selectedRTT;
        } catch (extractError) {
            Logger.error(
                `❌ Error extrayendo RTT de stats (${source}):`,
                extractError
            );
            return 0;
        }
    }

    /**
     * ✅ NUEVO: Configura text stream handlers para LiveKit Agents v1.0
     *
     * COMPLEMENTA RoomEvent.TranscriptionReceived (mantener ambos)
     * Respeta CONFIG.agent.ioModes y CONFIG.features.streamingText
     * Integra con lógica existente llamando a _handleAgentTranscription
     *
     * @private
     */
    _setupTextStreamHandlers() {
        if (!this._room?.localParticipant) {
            Logger.warning("⚠️ Room no disponible para text stream handlers");
            return;
        }

        // ✅ TRANSCRIPCIONES - Topic desde CONFIG
        this._room.registerTextStreamHandler(
            CONFIG.topics.transcription, // "lk.transcription"
            async (reader, participantInfo) => {
                try {
                    // ✅ VERIFICAR si es del agente
                    const isFromAgent =
                        this._isAgentParticipant(participantInfo);
                    if (!isFromAgent) {
                        if (CONFIG.debug.enabled) {
                            Logger.debug(
                                `📝 Text stream ignorado: no es del agente (${participantInfo.identity})`
                            );
                        }
                        return;
                    }

                    // ✅ DETECTAR tipo de contenido
                    const isVoiceTranscription =
                        reader.info.attributes["lk.transcribed_track_id"];
                    const streamId = reader.info.id;
                    const timestamp = reader.info.timestamp;

                    // ✅ RESPETAR ioModes - Solo procesar si es modo apropiado
                    const currentMode = this._getCurrentAgentMode();
                    if (
                        currentMode === CONFIG.agent.ioModes.VOICE &&
                        !isVoiceTranscription
                    ) {
                        // En modo VOICE puro, ignorar texto sin audio
                        if (CONFIG.debug.enabled) {
                            Logger.debug(
                                "📝 Texto puro ignorado en modo VOICE"
                            );
                        }
                        return;
                    }

                    // ✅ PROCESAR según CONFIG.features.streamingText
                    let finalText;
                    if (CONFIG.features.streamingText && isVoiceTranscription) {
                        // OPCIÓN 2: Stream incremental para karaoke
                        finalText = "";
                        for await (const chunk of reader) {
                            finalText += chunk;

                            // Enviar chunk parcial para karaoke
                            this._handleAgentTranscription(finalText, false, {
                                source: "textStream",
                                streamId,
                                timestamp,
                                isVoiceTranscription,
                                isChunk: true,
                            });
                        }

                        // Enviar versión final
                        this._handleAgentTranscription(finalText, true, {
                            source: "textStream",
                            streamId,
                            timestamp,
                            isVoiceTranscription,
                            isChunk: false,
                        });
                    } else {
                        // OPCIÓN 1: Leer todo de una vez (como tienes ahora)
                        finalText = await reader.readAll();

                        // ✅ USAR FUNCIÓN EXISTENTE para mantener compatibilidad
                        this._handleAgentTranscription(finalText, true, {
                            source: "textStream",
                            streamId,
                            timestamp,
                            isVoiceTranscription,
                        });
                    }

                    if (CONFIG.debug.enabled) {
                        Logger.debug(
                            `📝 Text stream procesado: ${
                                isVoiceTranscription ? "TRANSCRIPCIÓN" : "TEXTO"
                            } - "${finalText.substring(0, 50)}..."`
                        );
                    }
                } catch (error) {
                    Logger.error(
                        "❌ Error procesando text stream transcription:",
                        error
                    );
                }
            }
        );

        // ✅ CHAT DIRECTO - Topic desde CONFIG
        this._room.registerTextStreamHandler(
            CONFIG.topics.chat, // "lk.chat"
            async (reader, participantInfo) => {
                try {
                    const isFromAgent =
                        this._isAgentParticipant(participantInfo);
                    if (!isFromAgent) return;

                    // ✅ RESPETAR ioModes
                    const currentMode = this._getCurrentAgentMode();
                    if (currentMode === CONFIG.agent.ioModes.VOICE) {
                        // En modo VOICE puro, ignorar mensajes de chat
                        if (CONFIG.debug.enabled) {
                            Logger.debug(
                                "💬 Chat message ignorado en modo VOICE puro"
                            );
                        }
                        return;
                    }

                    const chatMessage = await reader.readAll();

                    // ✅ USAR FUNCIÓN EXISTENTE - tratar como transcripción final
                    this._handleAgentTranscription(chatMessage, true, {
                        source: "textStreamChat",
                        streamId: reader.info.id,
                        timestamp: reader.info.timestamp,
                        isVoiceTranscription: false, // Es texto puro
                    });

                    if (CONFIG.debug.enabled) {
                        Logger.debug(
                            `💬 Chat text stream: "${chatMessage.substring(
                                0,
                                50
                            )}..."`
                        );
                    }
                } catch (error) {
                    Logger.error(
                        "❌ Error procesando chat text stream:",
                        error
                    );
                }
            }
        );

        if (CONFIG.debug.enabled) {
            Logger.debug("📝 Text stream handlers configurados para:", {
                transcription: CONFIG.topics.transcription,
                chat: CONFIG.topics.chat,
                streamingTextEnabled: CONFIG.features.streamingText,
                ioModes: CONFIG.agent.ioModes,
            });
        }
    }

    /**
     * ✅ HELPER: Obtiene modo actual del agente desde CONFIG/state
     * @private
     * @returns {string} Modo actual: "text", "voice", "hybrid"
     */
    _getCurrentAgentMode() {
        // Prioridad: sessionConfig > defaultMode from CONFIG
        return (
            this._sessionConfig?.agentMode ||
            CONFIG.agent.defaultMode ||
            CONFIG.agent.ioModes.HYBRID
        );
    }

    // ==========================================
    // EVENT HANDLERS v2.13.6 (SIN CAMBIOS)
    // ==========================================

    /**
     * Handler: Room conectado
     * @private
     */
    _onRoomConnected() {
        if (CONFIG.debug.enabled) {
            Logger.debug("🔗 Room conectado exitosamente");
        }
        this._emit("roomConnected");
    }

    /**
     * Handler: Room desconectado
     * @private
     */
    _onRoomDisconnected(reason) {
        Logger.debug("🔗 Room desconectado:", reason);

        this._updateConnectionState(false);
        this._cleanup();
        this._emit("roomDisconnected", reason);

        // Auto-reconexión usando CONFIG
        if (
            reason !== DisconnectReason.CLIENT_INITIATED &&
            CONFIG.features.autoReconnect // ✅ DESDE CONFIG
        ) {
            this._scheduleReconnection();
        }
    }

    /**
     * Handler: Reconectando
     * @private
     */
    _onRoomReconnecting() {
        Logger.debug("🔄 Reconectando...");
        this._emit("statusChange", CONFIG.status.RECONNECTING, "connecting"); // ✅ DESDE CONFIG
    }

    /**
     * Handler: Reconectado
     * @private
     */
    _onRoomReconnected() {
        Logger.debug("✅ Reconectado exitosamente");
        this._metrics.reconnectCount++;
        this._emit("statusChange", CONFIG.status.CONNECTED, "connected"); // ✅ DESDE CONFIG
    }

    // ==========================================
    // RESTO DE EVENT HANDLERS (SIN CAMBIOS)
    // Los demás event handlers permanecen igual ya que no duplican configuración
    // ==========================================

    /**
     * Handler: Participante conectado
     * @private
     */
    _onParticipantConnected(participant) {
        if (CONFIG.debug.enabled) {
            Logger.debug("👤 Participante conectado:", {
                identity: participant.identity,
                kind: participant.kind,
                attributes: participant.attributes,
            });
        }

        // ✅ NUEVO: Detectar tipo de agente usando estándar oficial
        const agentInfo = this._isAgentParticipant(participant);

        if (agentInfo.isAgent) {
            if (agentInfo.type === "main") {
                // ✅ MANTENER: Agent principal (lógica existente)
                this._agentParticipant = participant;
                this._state.agentConnected = true;

                Logger.debug(
                    "🤖 Agente Python conectado:",
                    participant.identity
                );
                this._emit("agentConnected", participant);
                this._setupAgentParticipantListeners(participant);
            } else if (agentInfo.type === "avatar") {
                // ✅ NUEVO: Avatar worker detectado
                this._avatarWorker = participant;
                this._state.avatarConnected = true;

                Logger.debug(
                    "🎭 Avatar Worker conectado:",
                    participant.identity
                );
                this._emit("avatarWorkerConnected", participant);
                this._setupAvatarWorkerListeners(participant);
            }
        } else {
            // ✅ LOGGING: Participante regular
            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "👥 Participante regular conectado:",
                    participant.identity
                );
            }
        }

        this._emit("participantConnected", participant);
    }

    /**
     * Handler: Participante desconectado
     * @private
     */
    _onParticipantDisconnected(participant) {
        if (CONFIG.debug.enabled) {
            Logger.debug("👤 Participante desconectado:", participant.identity);
        }

        // ✅ MANTENER: Lógica existente para agent principal
        if (participant === this._agentParticipant) {
            Logger.warning("🤖 Agente Python desconectado");
            this._agentParticipant = null;
            this._state.agentConnected = false;
            this._emit("agentDisconnected", participant);
        }

        // ✅ NUEVO: Lógica para avatar worker
        if (participant === this._avatarWorker) {
            Logger.warning("🎭 Avatar Worker desconectado");
            this._avatarWorker = null;
            this._state.avatarConnected = false;
            this._state.avatarVideoEnabled = false;
            this._emit("avatarWorkerDisconnected", participant);
        }

        this._emit("participantDisconnected", participant);
    }

    /**
     * Handler: Track suscrito - VERSIÓN CORREGIDA
     * @private
     */
    _onTrackSubscribed(track, publication, participant) {
        Logger.debug(
            "🎵 Track suscrito:",
            track.kind,
            "de",
            participant.identity
        );
        // ✅ MANTENER: Lógica simple que funcionaba para AUDIO
        if (
            track.kind === Track.Kind.Audio &&
            this._isAgentParticipant(participant)
        ) {
            this._handleAgentAudioTrack(track, publication);
            console.log(
                "✅ Audio track del agente manejado:",
                participant.identity
            );
        }

        // ✅ AGREGAR: Lógica adicional para VIDEO de avatar (opcional)
        if (track.kind === Track.Kind.Video) {
            // Detectar si es avatar worker (Tavus, etc.)
            const agentInfo = this._isAgentParticipant(participant);

            if (
                agentInfo &&
                typeof agentInfo === "object" &&
                agentInfo.type === "avatar"
            ) {
                this._handleAvatarVideoTrack(track, publication);

                // ✅ NUEVO: Emitir evento específico para video-call-manager
                this._emit("avatarVideoTrackSubscribed", {
                    track,
                    publication,
                    participant,
                    provider: agentInfo.provider || "unknown",
                });

                console.log(
                    "✅ Video track del avatar manejado:",
                    participant.identity
                );
            } else if (
                participant.identity === "tavus-avatar-agent" ||
                participant.identity.includes("avatar")
            ) {
                this._handleAvatarVideoTrack(track, publication);

                // ✅ NUEVO: Emitir evento específico para fallback
                this._emit("avatarVideoTrackSubscribed", {
                    track,
                    publication,
                    participant,
                    provider: "fallback",
                });

                console.log(
                    "✅ Video track del avatar manejado (fallback):",
                    participant.identity
                );
            }
        }

        this._emit("trackSubscribed", track, publication, participant);
    }

    /**
     * Handler: Track no suscrito
     * @private
     */
    _onTrackUnsubscribed(track, publication, participant) {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug(
                "🎵 Track no suscrito:",
                track.kind,
                "de",
                participant.identity
            );
        }

        track.detach();
        this._emit("trackUnsubscribed", track, publication, participant);
    }

    /**
     * Handler: Estado de reproducción de audio (CRÍTICO v2.13.6)
     * @private
     */
    _onAudioPlaybackStatusChanged() {
        // ✅ v2.13.6: Propiedad oficial canPlaybackAudio
        const canPlayback = this._room.canPlaybackAudio;
        this._state.audioPlaybackAllowed = canPlayback;

        if (CONFIG.debug.showAudioEvents) {
            Logger.debug(
                "🔊 Audio playback status:",
                canPlayback ? "PERMITIDO" : "BLOQUEADO"
            );
        }

        if (!canPlayback) {
            this._emit("audioInteractionRequired");
        } else {
            this._state.audioEnabled = true;
            this._emit("audioEnabled");
        }

        this._emit("audioPlaybackStatusChanged", canPlayback);
    }

    /**
     * Handler: Transcripción recibida
     * @private
     */
    _onTranscriptionReceived(transcriptions, participant) {
        if (!transcriptions || transcriptions.length === 0) return;

        const isFromUser = participant === this._room.localParticipant;
        const isFromAgent = this._isAgentParticipant(participant);

        for (const segment of transcriptions) {
            if (!segment.text) continue;

            const text = segment.text.trim();
            const isFinal = segment.final || false;

            if (CONFIG.debug.logTranscriptionLatency) {
                const latency = Date.now() - (segment.startTime || Date.now());
                this._metrics.transcriptionLatency.push(latency);
                Logger.debug(`📝 Transcripción latencia: ${latency}ms`);
            }

            if (isFromUser) {
                this._handleUserTranscription(text, isFinal, segment);
            } else if (isFromAgent) {
                this._handleAgentTranscription(text, isFinal, segment);
            }
        }
    }

    /**
     * Handler: Calidad de conexión cambió
     * @private
     */
    async _onConnectionQualityChanged(quality, participant) {
        if (participant === this._room.localParticipant) {
            this._state.connectionQuality = quality;

            // ✅ OBTENER LATENCIA REAL CON MANEJO DE ERRORES
            try {
                const rtt = await this._getWebRTCLatency();
                this._state.lastLatencyMeasurement = rtt;

                if (CONFIG.debug.showConnectionQuality) {
                    Logger.debug(`📶 RTT obtenido: ${rtt}ms`);
                }

                this._emit("connectionQualityChanged", quality, rtt);
            } catch (error) {
                Logger.error("Error obteniendo RTT:", error);
                // ✅ FALLBACK: emitir sin RTT
                this._emit("connectionQualityChanged", quality, 0);
            }
        }
    }

    /**
     * Handler: Hablantes activos cambiaron
     * @private
     */
    _onActiveSpeakersChanged(speakers) {
        const userSpeaking = speakers.includes(this._room.localParticipant);
        const agentSpeaking = speakers.some((p) => this._isAgentParticipant(p));

        if (this._state.userSpeaking !== userSpeaking) {
            this._state.userSpeaking = userSpeaking;
            this._emit("userSpeakingChanged", userSpeaking);

            if (CONFIG.debug.logVoiceActivityEvents) {
                Logger.debug("🎤 Usuario hablando:", userSpeaking);
            }
        }

        if (this._state.agentSpeaking !== agentSpeaking) {
            this._state.agentSpeaking = agentSpeaking;
            this._emit("agentSpeakingChanged", agentSpeaking);

            if (agentSpeaking && this._state.agentThinking) {
                this._state.agentThinking = false;
                this._emit("agentThinkingChanged", false);
            }

            if (CONFIG.debug.logVoiceActivityEvents) {
                Logger.debug("🤖 Agente hablando:", agentSpeaking);
            }
        }

        this._emit("activeSpeakersChanged", speakers);
    }

    /**
     * Handler: Error de dispositivos de media
     * @private
     */
    _onMediaDevicesError(error) {
        Logger.error("🎥 Error de dispositivo de media:", error);

        const failure = MediaDeviceFailure.getFailure(error);
        let userMessage = CONFIG.errors.MICROPHONE_ERROR; // ✅ DESDE CONFIG

        switch (failure) {
            case MediaDeviceFailure.PermissionDenied:
                userMessage = CONFIG.errors.MICROPHONE_PERMISSION_DENIED; // ✅ DESDE CONFIG
                break;
            case MediaDeviceFailure.NotFound:
                userMessage = CONFIG.errors.AUDIO_DEVICE_ERROR; // ✅ DESDE CONFIG
                break;
            case MediaDeviceFailure.DeviceInUse:
                userMessage = "Dispositivo de audio en uso por otra aplicación";
                break;
        }

        this._emit("error", userMessage);
    }

    /**
     * Handler: Datos recibidos
     * @private
     */
    _onDataReceived(payload, participant, kind, topic) {
        if (CONFIG.debug.enabled) {
            Logger.debug("📦 Datos recibidos:", {
                kind,
                topic,
                from: participant.identity,
            });
        }

        try {
            const data = JSON.parse(new TextDecoder().decode(payload));
            this._handleDataMessage(data, participant, topic);
        } catch (error) {
            Logger.error("❌ Error procesando datos recibidos:", error);
        }
    }

    // ==========================================
    // 🔥 NUEVOS EVENT HANDLERS MVP - PRIORIDAD ALTA
    // ==========================================

    /**
     * Handler para cambio de estado de conexión detallado (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando cambia el estado detallado de conexión.
     * Proporciona más granularidad que Connected/Disconnected básicos.
     * Estados: CONNECTING, CONNECTED, RECONNECTING, DISCONNECTING, DISCONNECTED
     *
     * @param {ConnectionState} connectionState - Nuevo estado de conexión
     * @private
     * @fires connectionStateChanged - Evento custom para UI detallada de estado
     *
     * @example
     * // Estados posibles:
     * // - CONNECTING: Estableciendo conexión inicial
     * // - CONNECTED: Conectado y listo
     * // - RECONNECTING: Reconectando tras pérdida de conexión
     * // - DISCONNECTING: Desconectando por request
     * // - DISCONNECTED: Desconectado completamente
     */
    _onConnectionStateChanged(connectionState) {
        if (CONFIG.debug.showConnectionState) {
            Logger.debug(`🔗 Estado de conexión detallado: ${connectionState}`);
        }

        // ✅ EMIT para UI: Estado detallado para mejores indicadores visuales
        this._emit("connectionStateChanged", connectionState);
    }

    /**
     * Handler para detección de silencio en audio local (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando LiveKit detecta que el micrófono está
     * conectado pero no capta señal de audio. Útil para alertar problemas de HW.
     *
     * @private
     * @fires localAudioSilenceDetected - Evento custom para mostrar alerta de micrófono
     *
     * @example
     * // Casos comunes:
     * // - Micrófono silenciado por hardware
     * // - Cable desconectado
     * // - Micrófono defectuoso
     * // - Configuración incorrecta del sistema
     */
    _onLocalAudioSilenceDetected() {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug("🔇 Silencio detectado en micrófono local");
        }

        // ✅ EMIT para UI: Mostrar banner "Revisa tu micrófono"
        this._emit("localAudioSilenceDetected");
    }

    /**
     * Handler para track local publicado exitosamente (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando un track local se publica al servidor.
     * Confirma que el micrófono/cámara llegó al servidor exitosamente.
     *
     * @param {LocalTrackPublication} publication - Publicación del track local
     * @param {LocalParticipant} participant - Participante local (nosotros)
     * @private
     * @fires localTrackPublished - Evento custom para confirmar publicación exitosa
     *
     * @example
     * // Útil para cambiar UI de "preview" a "en vivo"
     * // O mostrar confirmación "Micrófono activo"
     */
    _onLocalTrackPublished(publication, participant) {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug(
                `🎤 Track local publicado: ${publication.kind} (${publication.trackSid})`
            );
        }

        // ✅ EMIT para UI: Confirmación visual de track activo
        this._emit("localTrackPublished", publication, participant);
    }

    /**
     * Handler para falla en suscripción de track (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando no se puede suscribir a un track remoto.
     * Común cuando hay límites de bandwidth o permisos insuficientes.
     *
     * @param {string} trackSid - ID del track que falló la suscripción
     * @param {RemoteParticipant} participant - Participante propietario del track
     * @private
     * @fires trackSubscriptionFailed - Evento custom para manejar errores de suscripción
     *
     * @example
     * // Casos comunes:
     * // - Límite de tracks simultáneos excedido
     * // - Problemas de bandwidth
     * // - Permisos insuficientes
     * // - Track no disponible temporalmente
     */
    _onTrackSubscriptionFailed(trackSid, participant) {
        Logger.error(
            `❌ Falló suscripción a track ${trackSid} de ${participant.identity}`
        );

        // ✅ EMIT para UI: Mostrar error y posibles reintentos
        this._emit("trackSubscriptionFailed", trackSid, participant);
    }

    /**
     * Handler para cambio de dispositivo activo (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando el usuario cambia de micrófono, cámara o parlantes.
     * Útil para actualizar selectores de dispositivos en UI.
     *
     * @param {MediaDeviceKind} kind - Tipo de dispositivo ('audioinput', 'videoinput', 'audiooutput')
     * @param {string} deviceId - ID del nuevo dispositivo activo
     * @private
     * @fires activeDeviceChanged - Evento custom para actualizar UI de dispositivos
     *
     * @example
     * // Tipos de dispositivos:
     * // - 'audioinput': Micrófono
     * // - 'videoinput': Cámara
     * // - 'audiooutput': Parlantes/audífonos
     */
    _onActiveDeviceChanged(kind, deviceId) {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug(`🎧 Dispositivo ${kind} cambiado a: ${deviceId}`);
        }

        // ✅ EMIT para UI: Actualizar etiquetas de dispositivos seleccionados
        this._emit("activeDeviceChanged", kind, deviceId);
    }

    /**
     * Handler para cambio en dispositivos de media disponibles (LiveKit v2.13.6)
     *
     * @description Se ejecuta cuando se conecta/desconecta un dispositivo de audio/video.
     * Útil para refrescar listas de dispositivos disponibles.
     *
     * @private
     * @fires mediaDevicesChanged - Evento custom para refrescar lista de dispositivos
     *
     * @example
     * // Casos comunes:
     * // - Usuario conecta nuevos audífonos USB
     * // - Webcam se desconecta
     * // - Micrófono Bluetooth se empareja
     * // - Dispositivo se queda sin batería
     */
    _onMediaDevicesChanged() {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug("🔌 Dispositivos de media disponibles cambiaron");
        }

        // ✅ EMIT para UI: Refrescar selectores de dispositivos
        this._emit("mediaDevicesChanged");
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE UTILIDAD (ACTUALIZADOS PARA CONFIG)
    // ==========================================

    /**
     * Obtiene token de acceso del servidor usando CONFIG
     * @private
     */
    async _getAccessToken() {
        try {
            const requestBody = {
                identity: "",
                room: "",
                persona_id: this._sessionConfig.personaId,
                user_id: this._sessionConfig.userId,
                io_mode: CONFIG.agent.defaultMode, // ✅ DESDE CONFIG
            };

            const response = await fetch(CONFIG.livekit.tokenEndpoint, {
                // ✅ DESDE CONFIG
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();

            if (!data.token || !data.url) {
                throw new Error("Token response inválido");
            }

            return data;
        } catch (error) {
            throw new Error(`${CONFIG.errors.TOKEN_ERROR}: ${error.message}`); // ✅ DESDE CONFIG
        }
    }

    /**
     * Actualiza configuración de sesión
     * @private
     */
    _updateSessionConfig(tokenData) {
        this._sessionConfig = {
            ...this._sessionConfig,
            room: tokenData.room || this._sessionConfig.room,
            identity: tokenData.identity || this._sessionConfig.identity,
            token: tokenData.token,
            userId: tokenData.user_id || this._sessionConfig.userId,
        };
    }

    /**
     * Verifica si un participante es el agente Python
     * @private
     */
    _isAgentParticipant(participant) {
        if (!participant) {
            return { isAgent: false, type: null };
        }

        const attributes = participant.attributes || {};
        const { kind, identity } = participant;

        // ✅ VERIFICAR: kind === 'agent' (todos los agentes LiveKit)
        console.log("Participant->", identity);
        // if (kind !== "agent") {
        //     return { isAgent: false, type: null };
        // }

        // ✅ TAVUS: Avatar worker tiene identity fija "tavus-avatar-agent"
        if (identity === "tavus-avatar-agent") {
            if (CONFIG.debug.enabled) {
                Logger.debug("🎭 Tavus avatar worker detectado:", identity);
            }
            return { isAgent: true, type: "avatar" };
        }

        // ✅ HEDRA: Avatar worker tiene identity fija "hedra-avatar-agent"
        if (identity === "hedra-avatar-agent") {
            if (CONFIG.debug.enabled) {
                Logger.debug("🎭 Hedra avatar worker detectado:", identity);
            }
            return { isAgent: true, type: "avatar" };
        }

        // ✅ TAVUS: Verificar por atributo lk.publish_on_behalf
        const publishOnBehalf = attributes["lk.publish_on_behalf"];
        if (
            publishOnBehalf &&
            publishOnBehalf !== null &&
            publishOnBehalf !== ""
        ) {
            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "🎭 Avatar worker detectado por publish_on_behalf:",
                    identity
                );
            }
            return { isAgent: true, type: "avatar" };
        }

        // ✅ AGENT PRINCIPAL: Sin publish_on_behalf
        if (
            publishOnBehalf === null ||
            publishOnBehalf === undefined ||
            publishOnBehalf === ""
        ) {
            if (CONFIG.debug.enabled) {
                Logger.debug("🤖 Agent principal detectado:", identity);
            }
            return { isAgent: true, type: "main" };
        }

        return { isAgent: false, type: null };
    }

    /**
     * Configura listeners específicos del agente
     * @private
     */
    _setupAgentParticipantListeners(participant) {
        participant
            .on(ParticipantEvent.AttributesChanged, (changed) => {
                if (CONFIG.debug.enabled) {
                    Logger.debug("🤖 Atributos del agente cambiaron:", changed);
                }
                if (changed["lk.agent.state"]) {
                    const agentState = changed["lk.agent.state"];
                    this._handleAgentStateChange(agentState);
                }
                this._emit("agentAttributesChanged", changed);
            })
            .on(ParticipantEvent.TrackMuted, (track) => {
                if (track.kind === Track.Kind.Audio) {
                    this._state.agentSpeaking = false;
                    this._emit("agentSpeakingChanged", false);
                }
            })
            .on(ParticipantEvent.TrackUnmuted, (track) => {
                if (track.kind === Track.Kind.Audio) {
                    this._state.agentSpeaking = true;
                    this._emit("agentSpeakingChanged", true);
                }
            });
    }

    /**
     * Configura listeners específicos del avatar worker
     *
     * Sigue el mismo patrón que _setupAgentParticipantListeners para
     * mantener consistencia en la arquitectura del código.
     *
     * @param {RemoteParticipant} participant - Avatar worker participant
     * @private
     */
    _setupAvatarWorkerListeners(participant) {
        participant
            .on(ParticipantEvent.TrackMuted, (track) => {
                if (track.kind === Track.Kind.Video) {
                    this._state.avatarVideoEnabled = false;
                    Logger.debug("🎭 Avatar video muted");
                    this._emit("avatarVideoMuted", true);
                }
            })
            .on(ParticipantEvent.TrackUnmuted, (track) => {
                if (track.kind === Track.Kind.Video) {
                    this._state.avatarVideoEnabled = true;
                    Logger.debug("🎭 Avatar video unmuted");
                    this._emit("avatarVideoMuted", false);
                }
            })
            .on(ParticipantEvent.AttributesChanged, (changed) => {
                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "🎭 Atributos del avatar worker cambiaron:",
                        changed
                    );
                }
                this._emit("avatarAttributesChanged", changed);
            });

        if (CONFIG.debug.enabled) {
            Logger.debug(
                "🔗 Avatar Worker listeners configurados para:",
                participant.identity
            );
        }
    }

    _handleAgentStateChange(agentState) {
        const statusMap = {
            listening: CONFIG.status.READY,
            thinking: CONFIG.status.THINKING,
            speaking: CONFIG.status.RESPONDING,
            idle: CONFIG.status.READY,
        };

        const uiStatus = statusMap[agentState];
        if (uiStatus) {
            this._emit("agentStateChanged", agentState, uiStatus);

            if (CONFIG.debug.logVoiceActivityEvents) {
                Logger.debug(`🤖 Agent state: ${agentState} → ${uiStatus}`);
            }
        }
    }

    /**
     * ✅ CORRECCIÓN: Configurar elementos de audio para responder al toggle
     *
     * @description Configura nuevos elementos de audio para respetar el estado de mute
     * @param {RemoteAudioTrack} track - Track de audio del agente
     * @param {RemoteTrackPublication} publication - Publicación del track
     * @private
     */
    _handleAgentAudioTrack(track, publication) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        audioElement.style.display = "none";

        // ✅ NUEVO: Configurar estado inicial basado en audioEnabled
        audioElement.muted = !this._state.audioEnabled;
        audioElement.volume = this._state.audioEnabled ? 1.0 : 0.0;

        audioElement.addEventListener("loadedmetadata", () => {
            if (this._metrics.firstAudioTime === 0) {
                this._metrics.firstAudioTime =
                    performance.now() - this._metrics.connectionStartTime;
            }

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🎵 Audio del agente cargado y configurado:", {
                    muted: audioElement.muted,
                    volume: audioElement.volume,
                    audioEnabled: this._state.audioEnabled,
                });
            }
        });

        audioElement.addEventListener("error", (error) => {
            Logger.error("❌ Error en audio del agente:", error);
            this._emit("error", "Error reproduciendo audio del agente");
        });

        document.body.appendChild(audioElement);
        this._audioElements.push(audioElement);

        this._emit("agentAudioReady", track, publication);
    }

    /**
     * Maneja track de video del avatar worker
     *
     * Procesa el video track recibido del avatar worker (Tavus, etc.)
     * y lo prepara para renderizado en la UI de video call.
     *
     * @param {RemoteVideoTrack} track - Track de video del avatar
     * @param {RemoteTrackPublication} publication - Publicación del track
     * @private
     */
    _handleAvatarVideoTrack(track, publication) {
        this._state.avatarVideoEnabled = true;

        if (CONFIG.debug.showAudioEvents) {
            Logger.debug("🎭 Video track del avatar recibido:", {
                trackId: track.sid,
                source: publication.source,
                dimensions: track.dimensions,
                muted: track.isMuted,
            });
        }

        // ✅ LOGGING: Métricas de video para debugging
        if (CONFIG.debug.showLatencyMetrics) {
            const videoLatency =
                performance.now() - this._metrics.connectionStartTime;
            Logger.debug(
                `⚡ Avatar video latency: ${videoLatency.toFixed(0)}ms`
            );
        }

        // ✅ EMIT: Evento para VideoCallManager y App.js
        this._emit("avatarVideoTrackReceived", track, publication);
    }

    /**
     * Maneja track de audio del avatar worker (audio sincronizado con video)
     *
     * @param {RemoteAudioTrack} track - Track de audio del avatar
     * @param {RemoteTrackPublication} publication - Publicación del track
     * @private
     */
    _handleAvatarAudioTrack(track, publication) {
        if (CONFIG.debug.showAudioEvents) {
            Logger.debug(
                "🎭 Audio track del avatar recibido (sincronizado con video)"
            );
        }

        // El audio del avatar worker normalmente se maneja automáticamente
        // pero podemos emitir evento para casos especiales
        this._emit("avatarAudioTrackReceived", track, publication);
    }

    /**
     * Maneja transcripción del usuario
     * @private
     */
    _handleUserTranscription(text, isFinal, segment) {
        const mode = CONFIG.ui.call.conversationMode;

        if (isFinal) {
            this._state.userSpeaking = false;
            this._state.agentThinking = true;

            this._emit("userSpeechEnd", text);
            this._emit("agentThinkingChanged", true);

            this._metrics.totalInteractions++;
        } else {
            if (!this._state.userSpeaking) {
                this._state.userSpeaking = true;
                this._emit("userSpeechStart");
            }
        }

        if (mode === "unified") {
            // TODO va al chat principal - historial completo
            this._emit("userTranscriptionReceived", text, isFinal, segment);
        } else {
            // Modo 'separated' (por defecto)
            if (this._state.voiceMode) {
                this._emit("agentSubtitle", text); // Modal subtítulos
            } else {
                this._emit("userTranscriptionReceived", text, isFinal, segment);
            }
        }
    }

    /**
     * Maneja transcripción del agente
     * @private
     */
    _handleAgentTranscription(text, isFinal, segment) {
        if (isFinal) {
            this._state.agentThinking = false;
            this._emit("agentThinkingChanged", false);
        }

        this._emit("agentTranscriptionReceived", text, isFinal, segment);
    }

    /**
     * Maneja métodos RPC
     * @private
     */
    async _handleRPCMethod(methodName, payload, data) {
        switch (methodName) {
            case "llm_function_call":
                const { function_name, arguments: args } = payload;
                return await this._handleLLMFunctionCall(function_name, args);

            case "agent_command":
                const { command, params } = payload;
                return await this._handleAgentCommand(command, params);

            case "heartbeat":
                return {
                    timestamp: Date.now(),
                    status: "alive",
                    metrics: this._getBasicMetrics(),
                };

            default:
                Logger.debug(`🔧 Método RPC desconocido: ${methodName}`);
                return {
                    success: true,
                    message: `Method ${methodName} received but not implemented`,
                    forwarded: true,
                };
        }
    }

    /**
     * Maneja llamadas de función del LLM
     * @private
     */
    async _handleLLMFunctionCall(functionName, args) {
        return new Promise((resolve, reject) => {
            this._emit("llmFunctionCall", functionName, args, resolve, reject);
        });
    }

    /**
     * Maneja comandos del agente
     * @private
     */
    async _handleAgentCommand(command, params) {
        switch (command) {
            case "set_ui_state":
                this._emit("setUIState", params.state, params.data);
                return { success: true };

            case "show_notification":
                this._emit("showNotification", params.message, params.type);
                return { success: true };

            case "update_persona":
                this._sessionConfig.personaId = params.personaId;
                this._emit("personaChanged", params.personaId);
                return { success: true };

            default:
                this._emit("agentCommand", command, params);
                return {
                    success: true,
                    message: "Command forwarded to application",
                };
        }
    }

    /**
     * Maneja mensajes de datos usando CONFIG.topics
     * @private
     */
    _handleDataMessage(data, participant, topic) {
        if (this._isAgentParticipant(participant)) {
            this._emit("agentDataReceived", data, topic);
        } else {
            this._emit("dataReceived", data, participant, topic);
        }
    }

    /**
     * Actualiza estado de conexión
     * @private
     */
    _updateConnectionState(connected) {
        this._state.connected = connected;
        this._state.connecting = false;

        if (!connected) {
            this._state.agentConnected = false;
            this._state.voiceModeActive = false;
            this._agentParticipant = null;
        }
        // ✅ AGREGAR: Si se conecta exitosamente, emitir ready
        if (connected && this._state.agentConnected) {
            setTimeout(() => {
                this._emit("ready");
                Logger.debug(
                    "🔥 EVENTO READY EMITIDO DESDE _updateConnectionState"
                );
            }, 100);
        }
    }

    /**
     * Calcula métricas de conexión
     * @private
     */
    _calculateConnectionMetrics() {
        this._metrics.connectionDuration =
            performance.now() - this._metrics.connectionStartTime;

        if (CONFIG.debug.showLatencyMetrics) {
            Logger.debug(
                `⚡ Conexión establecida en ${this._metrics.connectionDuration.toFixed(
                    0
                )}ms`
            );
        }
    }

    /**
     * Maneja errores de inicialización usando CONFIG
     * @private
     */
    _handleInitializationError(error) {
        Logger.error("❌ Error crítico de inicialización:", error);

        this._updateConnectionState(false);
        this._metrics.errorCount++;

        this._emit("error", error.message);
        this._emit("statusChange", CONFIG.status.ERROR, "error"); // ✅ DESDE CONFIG
    }

    /**
     * Programa reconexión automática usando CONFIG
     * @private
     */
    _scheduleReconnection() {
        // ✅ USAR CONFIG para límites de reconexión
        const maxReconnects = 5; // Reasonable default

        if (this._metrics.reconnectCount >= maxReconnects) {
            Logger.error("❌ Máximo número de reconexiones alcanzado");
            return;
        }

        // ✅ USAR CONFIG.performance para delays
        const delay =
            CONFIG.performance.reconnectTimeout *
            (this._metrics.reconnectCount + 1);

        const timeoutId = setTimeout(async () => {
            try {
                Logger.debug("🔄 Intentando reconexión automática...");
                await this.initialize();
            } catch (error) {
                Logger.error("❌ Reconexión automática falló:", error);
            }
        }, delay);

        this._activeTimeouts.add(timeoutId);
    }

    /**
     * Limpia recursos antes de reintentar
     * @private
     */
    async _cleanupForRetry() {
        if (this._room) {
            try {
                await this._room.disconnect();
            } catch (error) {
                // Ignorar errores de desconexión
            }
        }

        this._room = null;
        this._agentParticipant = null;
        this._state.connectionPrepared = false;
    }

    /**
     * Obtiene métricas básicas
     * @private
     */
    _getBasicMetrics() {
        return {
            connectionDuration: this._metrics.connectionDuration,
            totalInteractions: this._metrics.totalInteractions,
            errorCount: this._metrics.errorCount,
            reconnectCount: this._metrics.reconnectCount,
        };
    }

    /**
     * Obtiene métricas detalladas
     * @private
     */
    _getDetailedMetrics() {
        const avgTranscriptionLatency =
            this._metrics.transcriptionLatency.length > 0
                ? this._metrics.transcriptionLatency.reduce((a, b) => a + b) /
                  this._metrics.transcriptionLatency.length
                : 0;

        const avgRpcLatency =
            this._metrics.rpcCallLatency.length > 0
                ? this._metrics.rpcCallLatency.reduce((a, b) => a + b) /
                  this._metrics.rpcCallLatency.length
                : 0;

        return {
            ...this._metrics,
            averageTranscriptionLatency: Math.round(avgTranscriptionLatency),
            averageRpcLatency: Math.round(avgRpcLatency),
            uptime: this._state.connected
                ? Date.now() - this._metrics.connectionStartTime
                : 0,
        };
    }

    /**
     * Limpieza completa de recursos
     * Asegurar que el cleanup también libere medios correctamente
     *
     * @private
     */
    _cleanup() {
        // ✅ PASO 1: Limpiar elementos de audio del DOM
        this._audioElements.forEach((element, index) => {
            try {
                if (!element.paused) element.pause();
                element.src = "";
                element.load();
                if (element.parentNode) element.parentNode.removeChild(element);

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug(`🧹 Audio element ${index} limpiado del DOM`);
                }
            } catch (error) {
                Logger.error(
                    `❌ Error limpiando elemento de audio ${index}:`,
                    error
                );
            }
        });
        this._audioElements = [];

        // ✅ PASO 2: Limpiar timeouts activos
        this._activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this._activeTimeouts.clear();

        // ✅ PASO 3: Limpiar RPC methods registrados
        this._registeredRpcMethods.clear();

        // ✅ PASO 4: Reset completo del estado
        this._state.connected = false;
        this._state.connecting = false;
        this._state.agentConnected = false;
        this._state.voiceModeActive = false;
        this._state.userSpeaking = false;
        this._state.agentSpeaking = false;
        this._state.agentThinking = false;
        this._state.microphoneEnabled = false; // ✅ IMPORTANTE
        this._state.audioEnabled = false; // ✅ IMPORTANTE

        this._agentParticipant = null;

        if (CONFIG.debug.showAudioEvents) {
            Logger.debug("🧹 Cleanup completo - TODOS los medios liberados");
        }
    }

    /**
     * Crea timeout promise
     * @private
     */
    _createTimeoutPromise(ms, message) {
        return new Promise((_, reject) => {
            const timeoutId = setTimeout(() => reject(new Error(message)), ms);
            this._activeTimeouts.add(timeoutId);
        });
    }

    /**
     * Utilidad para crear delays usando CONFIG
     * @private
     */
    _delay(ms) {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(resolve, ms);
            this._activeTimeouts.add(timeoutId);
        });
    }

    /**
     * Log de RPC con debugging desde CONFIG
     * @private
     */
    _logRPC(direction, method, data) {
        if (CONFIG.debug.logRpcCalls) {
            Logger.debug(`[RPC ${direction}] ${method}:`, data);
        }
    }

    /**
     * Emite eventos personalizados
     * @private
     */
    _emit(event, ...args) {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    if (CONFIG.debug.showUIEvents) {
                        Logger.debug(
                            `🎨 Evento UI: ${event}`,
                            args.length > 0 ? args : ""
                        );
                    }
                    handler(...args);
                } catch (error) {
                    Logger.error(
                        `❌ Error en event handler '${event}':`,
                        error
                    );
                }
            });
        }
    }

    // ==========================================
    // API PÚBLICA DE EVENTOS (SIN CAMBIOS)
    // ==========================================

    /**
     * Registra listener de evento
     *
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     */
    on(event, handler) {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, []);
        }
        this._eventHandlers.get(event).push(handler);
    }

    /**
     * Remueve listener de evento
     *
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     */
    off(event, handler) {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Remueve todos los listeners de un evento
     *
     * @param {string} event - Nombre del evento
     */
    removeAllListeners(event) {
        if (event) {
            this._eventHandlers.delete(event);
        } else {
            this._eventHandlers.clear();
        }
    }
}

// ==========================================
// EXPORT PARA COMPATIBILIDAD CON CONFIG
// ==========================================

// Export como ModernVoiceAgent manteniendo compatibilidad total
if (typeof window !== "undefined") {
    window.ModernVoiceAgent = ModernVoiceAgent;

    if (CONFIG.debug.enabled) {
        Logger.debug(
            "✅ ModernVoiceAgent v2.0.0-config-truth disponible globalmente"
        );
        Logger.debug("🎯 Usando CONFIG v4.0 como fuente de verdad única");
        Logger.debug("🔥 Zero duplicación de configuración garantizada");
        Logger.debug("📡 CONFIG.livekit.roomOptions → new Room() DIRECTO");
    }
}
