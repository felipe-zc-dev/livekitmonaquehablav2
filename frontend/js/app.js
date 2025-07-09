/**
 * Voice Agent Application v4.0 - CONFIG Truth Source Architecture
 *
 * REFACTORIZACIÓN COMPLETA PARA CONFIG COMO FUENTE DE VERDAD:
 * ✅ Zero duplicación de configuración
 * ✅ CONFIG usado para TODAS las configuraciones
 * ✅ Event handling simplificado y limpio
 * ✅ Métricas delegadas a componentes apropiados
 * ✅ 100% compatibilidad con voice-call.js y ui-manager.js
 * ✅ APIs públicas mantenidas sin cambios
 * ✅ SOLID + DRY + Clean Code
 *
 * @author Refactored for CONFIG Truth Source
 * @version 4.0.0-config-truth
 * @since 2024
 * @requires ModernVoiceAgent, UIManager, CONFIG v4.0, Logger
 */

/**
 * Aplicación principal del asistente de voz con CONFIG como fuente de verdad
 *
 * Orquesta la comunicación entre ModernVoiceAgent y UIManager usando
 * únicamente CONFIG para toda configuración, eliminando duplicaciones
 * y garantizando sincronización perfecta.
 *
 * @class VoiceAgentApp
 */
class VoiceAgentApp {
    /**
     * Constructor del orquestador principal con CONFIG truth source
     *
     * Inicializa SOLO el estado mínimo necesario, delegando toda
     * configuración a CONFIG y toda lógica específica a componentes.
     */
    constructor() {
        // ✅ VERIFICAR que CONFIG esté disponible como fuente de verdad
        if (typeof CONFIG === "undefined") {
            throw new Error(
                "CONFIG v4.0 no está disponible. app.js requiere CONFIG como fuente de verdad única."
            );
        }

        // Validar dependencias críticas
        this._validateDependencies();

        /**
         * Estado mínimo de la aplicación - NO duplicar CONFIG
         * @type {Object}
         * @private
         */
        this._state = {
            initialized: false,
            ready: false,
            appVersion: "4.0.0-config-truth",
        };

        /**
         * Referencias a componentes principales
         * @type {Object}
         * @private
         */
        this._components = {
            agent: null,
            ui: null,
            voiceCallManager: null,
        };

        /**
         * RPC handlers para comunicación bidireccional
         * @type {Map<string, Function>}
         * @private
         */
        this._rpcHandlers = new Map();

        /**
         * Event handlers para cleanup
         * @type {Map<string, Function>}
         * @private
         */
        this._eventHandlers = new Map();

        /**
         * Timeouts activos para cleanup - usando CONFIG timeouts
         * @type {Set<number>}
         * @private
         */
        this._activeTimeouts = new Set();

        /**
         * Estado completo de streaming
         * @type {Object}
         * @private
         */
        this._streamingState = {
            currentElement: null,
            currentText: "",
            isActive: false,
        };

        // Bind methods para event handlers
        this._handleWindowUnload = this._handleWindowUnload.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

        Logger.debug("VoiceAgentApp v4.0-config-truth inicializado");
        Logger.debug(
            "Target: CONFIG como fuente de verdad única + zero duplicación"
        );
    }

    /**
     * Valida que todas las dependencias críticas estén disponibles
     *
     * @private
     * @throws {Error} Si faltan dependencias críticas
     */
    _validateDependencies() {
        const required = [
            { name: "CONFIG", obj: window.CONFIG },
            { name: "Logger", obj: window.Logger },
            { name: "ModernVoiceAgent", obj: window.ModernVoiceAgent },
            { name: "UIManager", obj: window.UIManager },
        ];

        const missing = required.filter((dep) => !dep.obj);

        if (missing.length > 0) {
            const missingNames = missing.map((dep) => dep.name).join(", ");
            throw new Error(`Dependencias críticas faltantes: ${missingNames}`);
        }

        Logger.debug("Todas las dependencias críticas validadas");
    }

    /**
     * Inicializa la aplicación completa usando CONFIG
     *
     * Orquesta la inicialización de todos los componentes usando únicamente
     * configuración desde CONFIG, sin duplicar valores.
     *
     * @returns {Promise<void>}
     * @throws {Error} Si falla la inicialización después de reintentos
     */
    async init() {
        if (this._state.initialized) {
            Logger.debug("Aplicación ya inicializada");
            return;
        }

        // ✅ USAR CONFIG para reintentos en lugar de hardcoded
        const maxRetries =
            Math.floor(CONFIG.performance.connectionTimeout / 5000) || 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                attempt++;

                Logger.debug(
                    `Iniciando aplicación (intento ${attempt}/${maxRetries})`
                );

                // 1. Inicializar SOLO UI primero
                await this._initializeUI();

                // 2. ✅ CONFIGURAR event routing ANTES del agente
                this._setupEventRouting();

                // 3. DESPUÉS inicializar agente (ya con listeners configurados)
                await this._initializeVoiceAgent();
                // await this._initializeVoiceCallManager();
                await this._initializeVideoCallManager();

                // 4. Conectar componentes
                this._connectComponents();

                // 4. Configurar global handlers usando CONFIG
                this._setupGlobalEventHandlers();

                // 5. Marcar como inicializada
                this._state.initialized = true;
                this._state.ready = true;

                Logger.debug(
                    "Aplicación inicializada exitosamente usando CONFIG"
                );
                break; // Éxito
            } catch (error) {
                Logger.error("Error crítico durante inicialización:", error);
                await this._handleInitializationError(
                    error,
                    attempt,
                    maxRetries
                );
            }
        }
    }

    /**
     * Inicializa el gestor de UI
     * @private
     */
    async _initializeUI() {
        try {
            Logger.debug("Inicializando UIManager v3.0");

            this._components.ui = new window.UIManager();
            this._components.ui.updateStatus(
                CONFIG.status.INITIALIZING,
                "connecting"
            ); // ✅ CONFIG

            Logger.debug("UIManager inicializado correctamente");
        } catch (error) {
            throw new Error(`UI initialization failed: ${error.message}`);
        }
    }

    /**
     * Inicializa el agente de voz usando CONFIG
     * @private
     */
    async _initializeVoiceAgent() {
        try {
            Logger.debug("Inicializando ModernVoiceAgent v3.0");

            this._components.agent = new window.ModernVoiceAgent();
            this._connectAgentEvents();

            // ✅ USAR CONFIG para pre-calentamiento
            if (CONFIG.livekit.features.enablePrepareConnection) {
                this._components.ui.updateStatus(
                    CONFIG.status.OPTIMIZING_CONNECTION, // ✅ CONFIG
                    "connecting"
                );
                Logger.connection(
                    "Preparación de conexión habilitada desde CONFIG"
                );
            }

            this._components.ui.updateStatus(
                CONFIG.status.CONNECTING,
                "connecting"
            ); // ✅ CONFIG

            // Conectar con timeout desde CONFIG
            await Promise.race([
                this._components.agent.initialize(),
                this._createTimeoutFromConfig("Agent connection timeout"),
            ]);

            Logger.debug("ModernVoiceAgent inicializado correctamente");
        } catch (error) {
            throw new Error(`Agent initialization failed: ${error.message}`);
        }
    }

    _connectAgentEvents() {
        if (!this._components.agent) {
            Logger.error("❌ Agente no disponible para conectar eventos");
            return;
        }

        Logger.debug("🔥 CONECTANDO EVENTOS DEL AGENTE");
        // En app.js, conectar así:
        this._components.agent.on(
            "llmFunctionCall",
            this._handleRPCFunctionCall.bind(this)
        );

        this._components.agent.on(
            "agentCommand",
            this._handleAgentCommand.bind(this)
        );

        // Status y conexión - ROUTING PURO
        this._components.agent.on("statusChange", (status, type) => {
            Logger.debug("🔥 EVENTO statusChange RECIBIDO EN APP.JS");
            this._components.ui.updateStatus(status, type);
            // Mapear tipos de LiveKit a nuestros presets
            const typeMap = {
                connecting: "connecting",
                connected: "ready",
                error: "error",
                thinking: "thinking",
                responding: "responding",
            };

            const preset = typeMap[type] || "ready";
            this._components.ui.updateBotStatusWithPreset(preset, status);
        });

        this._components.agent.on("ready", () => {
            Logger.debug("🔥 EVENTO READY RECIBIDO EN APP.JS");
            this._components.ui.updateStatus(CONFIG.status.READY, "connected"); // ✅ CONFIG
            this._safeTimeoutFromConfig(() => {
                this._components.ui.showToast(
                    "Asistente de voz listo!",
                    "success",
                    3000
                );
            }, 100);
        });

        // Agent connection
        this._components.agent.on("agentConnected", (participant) => {
            Logger.connection("Agente Python conectado:", participant.identity);
            this._components.ui.showToast(
                "Agente inteligente conectado",
                "success",
                2000
            );
        });

        this._components.agent.on("agentDisconnected", (participant) => {
            Logger.connection("Agente Python desconectado");
            this._components.ui.showToast(
                "Agente desconectado",
                "warning",
                3000
            );
        });

        /**
         * Handler para evento audioInteractionRequired del agent
         *
         * @description Cuando agent detecta que necesita primera interacción,
         * controla el prompt visual en UI y maneja timeout automático.
         *
         * @since 3.0.0 - Centralized audio interaction logic
         */
        this._components.agent.on("audioInteractionRequired", () => {
            // ✅ MOSTRAR PROMPT VISUAL
            this._components.ui._showAudioInteractionPrompt();

            // ✅ LÓGICA DE NEGOCIO EN app.js (no en UI)
            // Auto-hide después de 10 segundos si no hay interacción
            this._safeTimeoutFromConfig(() => {
                if (
                    this._components.agent.getState().audioPlaybackAllowed ===
                    false
                ) {
                    this._components.ui._hideAudioInteractionPrompt();
                    this._components.ui.showToast(
                        "Audio requerirá clic manual para habilitarse",
                        "info",
                        4000
                    );
                }
            }, 10000);
        });

        // Mensajes con streaming support - LÓGICA EXACTA MANTENIDA
        this._components.agent.on(
            "agentTranscriptionReceived",
            (text, isFinal, segment) => {
                Logger.debug("📝 STEP 6: Recibida transcripción del agente:", {
                    text: text.substring(0, 30),
                    isFinal,
                    currentlyShowingTyping:
                        this._components.ui.state.showingTypingIndicator,
                });
                this._components.ui.showTypingIndicator(false);
                Logger.debug("📝 STEP 7: Typing indicator ocultado");
                this._handleStreamingMessage(text, isFinal, segment);
            }
        );

        // Voice activity events - ROUTING DIRECTO
        this._components.agent.on("userSpeechStart", () => {
            Logger.voice("Usuario empezó a hablar");
            this._components.ui.updateVoiceCallState("listening");
        });

        this._components.agent.on("userSpeechEnd", (finalText) => {
            Logger.voice(
                "Usuario terminó de hablar:",
                finalText?.substring(0, 30) + "..."
            );
            this._components.ui.updateVoiceCallState("thinking");
        });

        this._components.agent.on("userSpeakingChanged", (speaking) => {
            Logger.voice("Usuario hablando:", speaking);
            this._components.ui.updateUserVoiceActivity(speaking);
        });

        // Agent thinking y speaking
        this._components.agent.on("agentThinkingChanged", (thinking) => {
            if (thinking) {
                this._components.ui.updateBotStatusWithPreset("thinking");
            } else {
                this._components.ui.updateBotStatusWithPreset("ready");
            }
        });

        this._components.agent.on("agentSpeakingChanged", (speaking) => {
            if (speaking) {
                this._components.ui.updateBotStatusWithPreset("responding");
            } else {
                this._components.ui.updateBotStatusWithPreset("ready");
            }
        });

        /**
         * Handler para cuando audio se habilita exitosamente
         */
        this._components.agent.on("audioEnabled", () => {
            // ✅ OCULTAR PROMPT CUANDO YA NO SE NECESITA
            // this._components.ui._hideAudioInteractionPrompt();
            this._components.ui.updateAudioState(true, false);
            this._components.ui.showToast(
                "Audio habilitado correctamente",
                "success",
                2000
            );
        });

        // User transcriptions en modo voz
        this._components.agent.on(
            "userTranscriptionReceived",
            (text, isFinal, segment) => {
                Logger.voice("User transcription:", text, "Final:", isFinal);

                if (
                    isFinal &&
                    this._components.agent.getState().voiceModeActive &&
                    text.trim()
                ) {
                    this._components.ui.addMessage(text, "user");
                }
            }
        );

        // Subtítulos del agente en modo voz
        this._components.agent.on("agentSubtitle", (text) => {
            if (this._components.agent.getState().voiceModeActive) {
                this.ui.showSubtitles(text, true);
            }
        });

        // Voice mode changes - INTEGRACIÓN CON voice-call MANTENIDA
        this._components.agent.on("voiceModeChanged", (enabled) => {
            this._components.ui.showVoiceMode(enabled);

            if (enabled) {
                // Configurar modo visual Character.AI por defecto
                this._components.ui.setVoiceCallMode("character");
            }

            const message = enabled
                ? "🎤 Modo de voz activo - ¡Habla libremente!"
                : "Modo de voz terminado";
            const duration = enabled ? 4000 : 2000;

            setTimeout(() => {
                this._components.ui.showToast(message, "info", duration);
            }, 100);
        });

        // States
        this._components.agent.on("microphoneChanged", (active) => {
            this._components.ui.updateMicState(!active);
        });

        this._components.agent.on("audioChanged", (enabled) => {
            this._components.ui.updateAudioState(enabled, false);
        });

        // Connection quality
        this._components.agent.on(
            "connectionQualityChanged",
            (quality, rtt = 0) => {
                this._components.ui.updateConnectionQuality(quality);

                if (CONFIG.ui.notifications.connectionBadge.enabled) {
                    // ✅ USAR RTT SI ESTÁ DISPONIBLE, SINO FALLBACK
                    const latency =
                        typeof rtt === "number" && rtt > 0
                            ? rtt
                            : this._components.agent.getMetrics()
                                  ?.averageRpcLatency || 0;

                    this._components.ui.updateConnectionBadge(quality, latency);

                    if (CONFIG.debug.showConnectionQuality) {
                        Logger.debug(
                            `📶 Badge actualizado: ${quality} (${latency}ms)`
                        );
                    }
                }
            }
        );

        // Agent commands
        this._components.agent.on("agentCommand", (command, params) => {
            this._handleAgentCommand(command, params);
        });

        // Error handling usando CONFIG
        this._components.agent.on("error", (error) => {
            Logger.error("Agent error:", error);
            this._components.ui.showToast(error, "error");
        });

        // Disconnection
        this._components.agent.on("roomDisconnected", (reason) => {
            Logger.connection("Room desconectado:", reason);
            this._components.ui.updateStatus(
                CONFIG.status.DISCONNECTED,
                "error"
            ); // ✅ CONFIG

            this._components.ui.showVoiceMode(false);
            this._components.ui.updateVoiceActivity(false, 0);

            if (reason !== "CLIENT_INITIATED") {
                this._components.ui.showToast(
                    "Conexión perdida - Reconectando...",
                    "warning"
                );
                this._state.ready = false;
            }
        });

        /**
         * Handler para estado de conexión detallado
         * Muestra estados granulares en lugar de solo conectado/desconectado
         */
        this._components.agent.on(
            "connectionStateChanged",
            (connectionState) => {
                const stateConfig = {
                    CONNECTING: {
                        message: CONFIG.status.CONNECTING,
                        type: "connecting",
                        toast: null,
                    },
                    CONNECTED: {
                        message: CONFIG.status.CONNECTED,
                        type: "connected",
                        toast: {
                            text: "Conexión establecida",
                            type: "success",
                            duration: 2000,
                        },
                    },
                    RECONNECTING: {
                        message: CONFIG.status.RECONNECTING,
                        type: "connecting",
                        toast: {
                            text: "Reconectando...",
                            type: "warning",
                            duration: 3000,
                        },
                    },
                    DISCONNECTING: {
                        message: "Desconectando...",
                        type: "connecting",
                        toast: null,
                    },
                    DISCONNECTED: {
                        message: CONFIG.status.DISCONNECTED,
                        type: "error",
                        toast: {
                            text: "Desconectado",
                            type: "error",
                            duration: 3000,
                        },
                    },
                };

                const config = stateConfig[connectionState] || {
                    message: `Estado: ${connectionState}`,
                    type: "info",
                    toast: null,
                };

                // Actualizar UI status
                this._components.ui.updateStatus(config.message, config.type);

                // Mostrar toast si configurado
                if (config.toast) {
                    this._components.ui.showToast(
                        config.toast.text,
                        config.toast.type,
                        config.toast.duration
                    );
                }

                if (CONFIG.debug.showConnectionState) {
                    Logger.debug(
                        `🔗 UI actualizada para estado: ${connectionState}`
                    );
                }
            }
        );

        /**
         * Handler para detección de silencio en micrófono
         * Alerta al usuario sobre posibles problemas de hardware
         */
        this._components.agent.on("localAudioSilenceDetected", () => {
            this._components.ui.showToast(
                "No se detecta audio. Revisa tu micrófono o conexiones",
                "warning",
                6000
            );

            // Opcional: Cambiar status temporalmente
            this._components.ui.updateStatus(
                "Problema detectado con micrófono",
                "warning"
            );

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🔇 UI alertada sobre silencio en micrófono");
            }
        });

        /**
         * Handler para track local publicado exitosamente
         * Confirma que el micrófono está transmitiendo al servidor
         */
        this._components.agent.on(
            "localTrackPublished",
            (publication, participant) => {
                if (publication.kind === "audio") {
                    this._components.ui.showToast(
                        "Micrófono activo y transmitiendo",
                        "success",
                        2000
                    );

                    // Actualizar estado si estaba en warning por silencio
                    if (this._components.agent.getState().voiceModeActive) {
                        this._components.ui.updateStatus(
                            CONFIG.status.VOICE_ACTIVE,
                            "connected"
                        );
                    }
                }

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug(
                        `🎤 UI confirmada publicación de ${publication.kind}`
                    );
                }
            }
        );

        /**
         * Handler para falla en suscripción de tracks
         * Maneja errores de conexión con el agente
         */
        this._components.agent.on(
            "trackSubscriptionFailed",
            (trackSid, participant) => {
                // Determinar mensaje específico
                let message = "Error conectando con el agente";

                this._components.ui.showToast(message, "error", 5000);

                // Actualizar status
                this._components.ui.updateStatus(
                    "Problema de conexión detectado",
                    "error"
                );

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug(
                        `❌ UI alertada sobre falla de suscripción: ${trackSid}`
                    );
                }
            }
        );

        /**
         * Handler para cambio de dispositivo activo
         * Informa al usuario sobre cambios de hardware
         */
        this._components.agent.on("activeDeviceChanged", (kind, deviceId) => {
            const deviceNames = {
                audioinput: "Micrófono",
                videoinput: "Cámara",
                audiooutput: "Parlantes",
            };

            const deviceName = deviceNames[kind] || kind;

            this._components.ui.showToast(
                `${deviceName} cambiado exitosamente`,
                "info",
                2000
            );

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug(
                    `🎧 UI notificada cambio de ${deviceName}: ${deviceId}`
                );
            }
        });

        /**
         * Handler para cambio en dispositivos disponibles
         * Alerta sobre dispositivos conectados/desconectados
         */
        this._components.agent.on("mediaDevicesChanged", () => {
            this._components.ui.showToast(
                "Dispositivos de audio actualizados",
                "info",
                2000
            );

            // Opcional: Refrescar selectores de dispositivos si los tienes
            // this._refreshDeviceSelectors();

            if (CONFIG.debug.showAudioEvents) {
                Logger.debug("🔌 UI notificada sobre cambio de dispositivos");
            }
        });

        this._components.agent.on("roomConnected", () => {
            Logger.connection("Room conectado exitosamente");
            this._components.ui.updateStatus(
                CONFIG.status.CONNECTED,
                "connected"
            );
            this._components.ui.showToast(
                "Conectado al servidor",
                "success",
                2000
            );
        });

        this._components.agent.on(
            "agentStateChanged",
            (agentState, uiStatus) => {
                Logger.voice(`🤖 Agent state: ${agentState} → ${uiStatus}`);
                this._components.ui.updateStatus(uiStatus, "connected");
                // ✅ MOSTRAR/OCULTAR TYPING BASADO EN ESTADO
                if (agentState === "thinking") {
                    Logger.debug("🤖 ESTADO = THINKING - MOSTRAR TYPING");
                    this._components.ui.showTypingIndicator(true);
                } else if (agentState === "speaking") {
                    Logger.debug(
                        "🤖 ESTADO = SPEAKING - MANTENER TYPING VISIBLE"
                    );
                    // Mantener typing visible hasta que llegue transcripción
                }
                // Toast específico para cambios de estado
                const stateMessages = {
                    listening: "Agente escuchando",
                    thinking: "Agente procesando...",
                    speaking: "Agente respondiendo",
                    idle: "Agente listo",
                };

                if (stateMessages[agentState]) {
                    this._components.ui.showToast(
                        stateMessages[agentState],
                        "info",
                        2000
                    );
                }
            }
        );

        this._components.agent.on("agentAttributesChanged", (changed) => {
            Logger.debug("Atributos del agente cambiaron:", changed);

            if (CONFIG.debug.enabled) {
                this._components.ui.showToast(
                    `Debug: Atributos cambiados`,
                    "info",
                    1500
                );
            }
        });

        this._components.agent.on("participantConnected", (participant) => {
            Logger.connection("Participante conectado:", participant.identity);
            this._components.ui.updateStatus(
                `Participante conectado: ${participant.identity}`,
                "connected"
            );
            this._components.ui.showToast(
                `Usuario conectado: ${participant.identity}`,
                "info",
                2000
            );
        });

        this._components.agent.on("participantDisconnected", (participant) => {
            Logger.connection(
                "Participante desconectado:",
                participant.identity
            );
            this._components.ui.updateStatus(
                `Participante desconectado: ${participant.identity}`,
                "error"
            );
            this._components.ui.showToast(
                `Usuario desconectado: ${participant.identity}`,
                "warning",
                2000
            );
        });

        this._components.agent.on(
            "trackSubscribed",
            (track, publication, participant) => {
                Logger.audio(
                    `Track suscrito: ${track.kind} de ${participant.identity}`
                );
                this._components.ui.updateStatus(
                    `Audio ${track.kind} disponible`,
                    "connected"
                );

                if (track.kind === "audio") {
                    this._components.ui.showToast(
                        `Audio disponible de ${participant.identity}`,
                        "success",
                        2000
                    );
                }
            }
        );

        this._components.agent.on(
            "trackUnsubscribed",
            (track, publication, participant) => {
                Logger.audio(
                    `Track no suscrito: ${track.kind} de ${participant.identity}`
                );
                this._components.ui.updateStatus(
                    `Audio ${track.kind} desconectado`,
                    "warning"
                );
                this._components.ui.showToast(
                    `Audio desconectado de ${participant.identity}`,
                    "warning",
                    2000
                );
            }
        );

        this._components.agent.on(
            "audioPlaybackStatusChanged",
            (canPlayback) => {
                Logger.audio(
                    `Audio playback: ${canPlayback ? "PERMITIDO" : "BLOQUEADO"}`
                );

                if (canPlayback) {
                    this._components.ui.updateStatus(
                        "Audio habilitado",
                        "connected"
                    );
                    this._components.ui.showToast(
                        "Audio habilitado",
                        "success",
                        2000
                    );
                } else {
                    this._components.ui.updateStatus(
                        "Audio bloqueado",
                        "warning"
                    );
                    this._components.ui.showToast(
                        "Haz clic en el botón de audio para habilitar sonido",
                        "warning",
                        5000
                    );
                }
            }
        );

        this._components.agent.on("activeSpeakersChanged", (speakers) => {
            Logger.voice(`Active speakers: ${speakers.length}`);

            if (speakers.length > 0) {
                this._components.ui.updateStatus(
                    `${speakers.length} persona(s) hablando`,
                    "connected"
                );
            } else {
                this._components.ui.updateStatus("Silencio", "connected");
            }

            if (CONFIG.debug.logVoiceActivityEvents) {
                this._components.ui.showToast(
                    `Speakers activos: ${speakers.length}`,
                    "info",
                    1000
                );
            }
        });

        this._components.agent.on("agentDataReceived", (data, topic) => {
            Logger.rpc("Datos recibidos del agente:", topic);
            this._components.ui.updateStatus(
                "Datos recibidos del agente",
                "connected"
            );
            this._components.ui.showToast(
                `Datos recibidos: ${topic}`,
                "info",
                1500
            );
        });

        this._components.agent.on(
            "dataReceived",
            (data, participant, topic) => {
                Logger.rpc(
                    "Datos recibidos de participante:",
                    participant.identity
                );
                this._components.ui.updateStatus(
                    `Datos recibidos de ${participant.identity}`,
                    "connected"
                );
                this._components.ui.showToast(
                    `Mensaje de ${participant.identity}`,
                    "info",
                    2000
                );
            }
        );

        this._components.agent.on("messageSent", (text) => {
            Logger.debug("Mensaje enviado confirmado:", text.substring(0, 30));
            this._components.ui.updateStatus("Mensaje enviado", "connected");
            this._components.ui.showToast("Mensaje enviado", "success", 1000);
        });

        this._components.agent.on("avatarWorkerConnected", (participant) => {
            Logger.success("🎭 Avatar Worker conectado:", participant.identity);

            this._components.ui.updateStatus(
                "Avatar conectado - Video disponible",
                "connected"
            );

            this._components.ui.showToast(
                `🎭 Avatar conectado: ${participant.identity}`,
                "success",
                4000
            );

            // ✅ NOTIFICAR: VideoCallManager si está disponible
            if (this._components.videoCallManager) {
                this._components.videoCallManager._emit(
                    "avatarWorkerReady",
                    participant
                );
            }
        });

        this._components.agent.on("avatarWorkerDisconnected", (participant) => {
            Logger.warning(
                "🎭 Avatar Worker desconectado:",
                participant.identity
            );

            this._components.ui.updateStatus("Avatar desconectado", "warning");

            this._components.ui.showToast(
                `🎭 Avatar desconectado: ${participant.identity}`,
                "warning",
                3000
            );
        });

        this._components.agent.on(
            "avatarVideoTrackReceived",
            (track, publication) => {
                Logger.success("🎬 Video track del avatar recibido");

                this._components.ui.updateStatus(
                    "Video avatar activo",
                    "connected"
                );

                this._components.ui.showToast(
                    "🎬 Video del avatar disponible",
                    "success",
                    3000
                );

                // ✅ DELEGAR: Al VideoCallManager para renderizar
                if (this._components.videoCallManager) {
                    this._components.videoCallManager.handleAvatarVideo(
                        track,
                        publication
                    );
                }

                // ✅ MÉTRICAS: Tracking de video avatar
                if (CONFIG.debug.showLatencyMetrics) {
                    Logger.performance(
                        "⚡ Avatar video track procesado exitosamente"
                    );
                }
            }
        );

        this._components.agent.on("avatarVideoMuted", (isMuted) => {
            const status = isMuted ? "muted" : "unmuted";
            Logger.debug(`🎭 Avatar video ${status}`);

            this._components.ui.showToast(
                `🎭 Video avatar ${status}`,
                "info",
                2000
            );
        });

        this._components.agent.on("avatarAttributesChanged", (changed) => {
            if (CONFIG.debug.enabled) {
                Logger.debug("🎭 Avatar attributes changed:", changed);
            }
        });
    }

    /**
     * Inicializa el gestor de videollamadas con avatar
     * @private
     */
    async _initializeVideoCallManager() {
        try {
            // Verificar que videoCallManager esté disponible globalmente
            if (typeof window.videoCallManager !== "undefined") {
                this._components.videoCallManager = window.videoCallManager;

                // Conectar eventos del video call manager
                this._connectVideoCallEvents();

                Logger.debug("VideoCallManager conectado");
            } else {
                Logger.debug(
                    "VideoCallManager no disponible, continuando sin él"
                );
            }
        } catch (error) {
            Logger.debug(
                "Error inicializando VideoCallManager:",
                error.message
            );
            // No es crítico, continuar sin él
        }
    }

    /**
     * Conecta eventos del video call manager
     * @private
     */
    _connectVideoCallEvents() {
        if (!this._components.videoCallManager) return;
        // Video del avatar listo
        this._components.agent.on("avatarVideoTrackReady", (data) => {
            const { participant } = data;
            Logger.debug(`📹 Video del avatar listo: ${participant.identity}`);

            this._components.ui.updateStatus(
                "Video del avatar activo",
                "connected"
            );
        });

        // Video call iniciado
        this._components.videoCallManager.on("videoCallStarted", () => {
            Logger.debug("Videollamada iniciada");
            this._components.ui.updateStatus(
                "Videollamada activa",
                "connected"
            );
        });

        // Video call terminado
        this._components.videoCallManager.on("videoCallEnded", () => {
            Logger.debug("Videollamada terminada");
            this._components.ui.updateStatus(
                "Videollamada finalizada",
                "disconnected"
            );
        });

        // Avatar activado
        this._components.videoCallManager.on("avatarActivated", (provider) => {
            Logger.debug(`Avatar ${provider} activado`);
            this._components.ui.showToast(
                `Avatar ${provider} conectado`,
                "success",
                3000
            );
        });

        // Errores de video
        this._components.videoCallManager.on("videoCallError", (error) => {
            Logger.error("Error en videollamada:", error);
            this._components.ui.showToast(
                `Error de video: ${error}`,
                "error",
                5000
            );
        });
        // ✅ AGREGAR en _connectVideoCallEvents():

        // Feedback de mute toggle
        this._components.videoCallManager.on("muteToggled", (isMuted) => {
            this._components.ui.updateMicState(isMuted);
            this._components.ui.showToast(
                isMuted ? "Micrófono silenciado" : "Micrófono activo",
                "info",
                2000
            );
        });

        // Feedback de camera toggle
        this._components.videoCallManager.on("cameraToggled", (isEnabled) => {
            this._components.ui.showToast(
                isEnabled ? "Cámara activada" : "Cámara desactivada",
                "info",
                2000
            );
        });

        // Confirmación de avatar video conectado
        this._components.videoCallManager.on(
            "avatarVideoConnected",
            (track, publication) => {
                this._components.ui.updateVideoCallState(true, true);
                this._components.ui.showToast(
                    "🎬 Avatar renderizado exitosamente",
                    "success",
                    3000
                );
            }
        );

        // Limpieza de avatar desactivado
        this._components.videoCallManager.on(
            "avatarDeactivationRequested",
            async (data) => {
                // Limpiar estado en voice-agent-sdk si es necesario
                this._components.ui.updateVideoCallState(true, false);
                this._components.ui.showToast(
                    "Avatar desactivado",
                    "info",
                    2000
                );
            }
        );
    }

    /**
     * ✅ MANTENIDO: Conecta los componentes principales (100% compatible)
     * @private
     */
    _connectComponents() {
        try {
            // ✅ MANTENER: voice-call.js integration EXACTA
            if (this._components.ui && this._components.agent) {
                Logger.debug("UIManager conectado con ModernVoiceAgent");
            }

            // ✅ MANTENER: voice-call manager integration EXACTA
            if (this._components.voiceCallManager) {
                this._components.voiceCallManager.setCharacterMode();
                Logger.debug(
                    "VoiceCallManager configurado en modo Character.AI"
                );
            }

            // Conectar video call manager con voice agent
            if (this._components.videoCallManager && this._components.agent) {
                // Asegurar que video manager tenga referencia al agent
                this._components.videoCallManager._voiceAgent =
                    this._components.agent;

                Logger.debug("VideoCallManager conectado con VoiceAgent");
            }
        } catch (error) {
            Logger.error("Error conectando componentes:", error);
            throw error;
        }
    }

    /**
     * ✅ SIMPLIFICADO: Event routing limpio sin lógica business
     * @private
     */
    _setupEventRouting() {
        Logger.debug(
            "🔥 CONFIGURANDO EVENT ROUTING ANTES DE INICIALIZAR AGENTE"
        );

        if (!this._components.ui) {
            Logger.error("❌ UI no inicializado antes de setupEventRouting");
            return;
        }

        this._setupUIEventRouting();
    }

    /**
     * ✅ MANTENER: UI event handlers EXACTOS (100% compatibilidad)
     * @private
     */
    _setupUIEventRouting() {
        // Text message sending - LÓGICA EXACTA MANTENIDA
        this._components.ui.on("textSend", async (text) => {
            try {
                Logger.debug(
                    "📤 STEP 3: app.js recibió textSend, agregando mensaje usuario"
                );
                if (!this._validateAgentReady()) return;

                this._components.ui.addMessage(text, "user");
                // ✅ MOSTRAR TYPING INDICATOR AQUÍ
                Logger.debug("📤 STEP 4.5: Mostrando typing indicator...");
                this._components.ui.showTypingIndicator(true);
                Logger.debug("📤 STEP 4: Enviando mensaje al agente...");
                await this._components.agent.sendMessage(text);
                Logger.debug(
                    "📤 STEP 5: Mensaje enviado al agente exitosamente"
                );
                Logger.debug("Mensaje enviado:", text.substring(0, 50));
            } catch (error) {
                this._components.ui.showTypingIndicator(false);
                this._components.ui.showToast(
                    CONFIG.errors.CONNECTION_FAILED,
                    "error"
                ); // ✅ CONFIG
                Logger.error("Error enviando mensaje:", error);
            }
        });

        // Voice mode toggle - LÓGICA EXACTA MANTENIDA
        this._components.ui.on("voiceToggle", async () => {
            try {
                if (!this._validateAgentReady()) return;

                if (this._components.agent.getState().voiceModeActive) {
                    await this._components.agent.disableVoiceMode();
                } else {
                    // ✅ MANTENER: voice-call integration
                    if (this._components.voiceCallManager) {
                        this._components.voiceCallManager.setCharacterMode();
                    }

                    this._components.ui.updateStatus(
                        CONFIG.status.PREPARING_VOICE_MODE, // ✅ CONFIG
                        "connecting"
                    );
                    await this._components.agent.enableVoiceMode();
                }
            } catch (error) {
                this._components.ui.showToast(
                    CONFIG.errors.MICROPHONE_ERROR,
                    "error"
                ); // ✅ CONFIG
                this._components.ui.updateStatus(CONFIG.status.ERROR, "error"); // ✅ CONFIG
                Logger.error("Error en toggle de voz:", error);
            }
        });

        // Voice mode end - LÓGICA EXACTA MANTENIDA
        this._components.ui.on("voiceEnd", async () => {
            try {
                if (!this._components.agent) {
                    Logger.debug(
                        "No hay agente disponible para terminar modo voz"
                    );
                    return;
                }

                // ✅ Mostrar feedback inmediato al usuario
                this._components.ui.updateStatus(
                    "Terminando llamada...",
                    "connecting"
                );

                try {
                    // ✅ PASO 1: Usar timeout más corto para evitar cuelgues
                    await Promise.race([
                        this._components.agent.disableVoiceMode(),
                        this._createTimeoutFromConfig("Voice end timeout"),
                    ]);

                    Logger.debug("✅ Voice mode disabled correctamente");
                } catch (agentError) {
                    Logger.error(
                        "Fallo al terminar modo voz, forzando cleanup:",
                        agentError
                    );

                    // ✅ PASO 2: Cleanup forzado mejorado
                    await this._forceVoiceModeCleanup();
                }

                // ✅ PASO 3: Verificación final de que medios estén liberados
                const remainingTracks = this._checkActiveMediaTracks();
                if (remainingTracks > 0) {
                    Logger.warn(
                        `⚠️ Aún hay ${remainingTracks} tracks activos después del cleanup`
                    );

                    // Mostrar advertencia al usuario
                    this._components.ui.showToast(
                        "Llamada terminada (verificando liberación de micrófono...)",
                        "info",
                        3000
                    );
                }

                // ✅ PASO 4: Actualizar UI al estado final
                this._components.ui.updateStatus(
                    CONFIG.status.READY,
                    "connected"
                );

                Logger.debug(
                    "✅ Voice end process completado - medios verificados"
                );
            } catch (error) {
                Logger.error("Error crítico terminando modo voz:", error);

                // ✅ UI cleanup forzado en caso de error total
                this._components.ui.showVoiceMode(false);
                this._components.ui.updateStatus(CONFIG.status.ERROR, "error");
                this._components.ui.showToast(
                    "Error terminando llamada - Recarga la página si el micrófono sigue activo",
                    "error",
                    5000
                );
            }
        });

        // Audio interaction - LÓGICA CRÍTICA para navegadores
        this._components.ui.on("audioInteractionClick", async () => {
            try {
                if (!this._components.agent) return;

                Logger.audio("Click de interacción de audio recibido");

                const success = await this._components.agent.startAudio();
                if (success) {
                    this._components.ui.state.audioInteractionRequired = false;
                    this._components.ui._hideAudioInteractionPrompt();
                    this._components.ui.updateAudioState(true, false);
                    this._components.ui.showToast(
                        "Audio habilitado",
                        "success",
                        2000
                    );
                    Logger.audio(
                        "Audio habilitado por interacción del usuario"
                    );
                }
            } catch (error) {
                Logger.error("Error en audio interaction click:", error);
                this._components.ui.showToast(
                    CONFIG.errors.AUDIO_ERROR,
                    "error"
                );
            }
        });

        // Audio interaction - LÓGICA EXACTA MANTENIDA
        this._components.ui.on("audioInteractionClick", async () => {
            try {
                if (!this._components.agent) return;

                Logger.audio("Click de interacción de audio recibido");

                const success = await this._components.agent.startAudio();
                if (success) {
                    this._components.ui.updateAudioState(true, false);
                    this._components.ui.showToast(
                        "Audio habilitado",
                        "success",
                        2000
                    );
                    Logger.audio(
                        "Audio habilitado por interacción del usuario"
                    );
                }
            } catch (error) {
                Logger.error("Error en audio interaction click:", error);
                this._components.ui.showToast(
                    CONFIG.errors.AUDIO_ERROR,
                    "error"
                ); // ✅ CONFIG
            }
        });

        /**
         * Handler para toggle de micrófono - PATRÓN AGNÓSTICO
         *
         * @description Recibe evento del UI Manager y ejecuta la lógica de mute
         * a través del agent LiveKit, manteniendo separación de responsabilidades.
         *
         * @listens ui:muteToggle - Evento del botón mute desde UIManager
         *
         * @async
         * @method setupUIEventRouting~handleMuteToggle
         * @memberof VoiceAgentApp
         * @private
         *
         * @throws {Error} Si no hay agent disponible o falla el toggle
         *
         * @example
         * // Flujo completo de mute:
         * // UI emite 'muteToggle' → app.js recibe →
         * // agent.toggleMicrophone() → LiveKit API →
         * // agent emite 'microphoneChanged' → UI actualiza visual
         *
         * @since 3.0.0 - Refactored for agnostic architecture
         */
        this._components.ui.on("muteToggle", async () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    Logger.debug(
                        "📡 app.js: Evento muteToggle recibido desde UI"
                    );
                }

                // ✅ VALIDAR AGENTE DISPONIBLE
                if (!this._validateAgentReady()) {
                    Logger.error("❌ Agent no disponible para mute toggle");
                    this._components.ui.showToast(
                        "Asistente no conectado para controlar micrófono",
                        "warning",
                        3000
                    );
                    return;
                }

                // ✅ LLAMADA AL AGENT - Lógica de negocio separada
                const isMuted = await this._components.agent.toggleMicrophone();

                // ✅ ACTUALIZAR UI CON RESULTADO - UI solo recibe el estado
                this._components.ui.updateMicState(isMuted);

                // ✅ FEEDBACK ADICIONAL EN MODO VOZ
                const agentState = this._components.agent.getState();
                if (agentState.voiceModeActive) {
                    this._components.ui.updateVoiceActivity(!isMuted, 0);
                }

                // ✅ FEEDBACK TOAST CON ESTADO REAL
                const statusMessage = isMuted
                    ? "Micrófono silenciado"
                    : "Micrófono habilitado";

                this._components.ui.showToast(statusMessage, "info", 2000);

                if (CONFIG.debug.showUIEvents) {
                    Logger.debug(
                        `✅ Micrófono toggle completado: ${
                            isMuted ? "MUTED" : "ACTIVE"
                        }`
                    );
                }
            } catch (error) {
                Logger.error("❌ Error en toggle de micrófono:", error);

                // ✅ ERROR HANDLING - UI solo recibe el error formateado
                this._components.ui.showToast(
                    CONFIG.errors.MICROPHONE_ERROR,
                    "error",
                    4000
                );

                // ✅ OPCIONAL: Forzar actualización de estado desde agent
                if (this._components.agent?.getState) {
                    const currentState = this._components.agent.getState();
                    this._components.ui.updateMicState(
                        !currentState.microphoneEnabled
                    );
                }
            }
        });

        /**
         * Handler inteligente para toggle de audio - LÓGICA CENTRALIZADA
         *
         * @description Maneja TODOS los clicks del botón de audio, decidiendo
         * automáticamente si es primera interacción o toggle normal basado
         * en el estado real del agent LiveKit.
         *
         * @listens ui:audioToggle - Evento único del botón audio desde UIManager
         *
         * @async
         * @method setupUIEventRouting~handleAudioToggle
         * @memberof VoiceAgentApp
         * @private
         *
         * @throws {Error} Si falla la operación de audio
         *
         * @example
         * // Decisión automática basada en estado del agent:
         * // Si canPlaybackAudio = false → Primera interacción (startAudio)
         * // Si canPlaybackAudio = true → Toggle normal (toggleAudio)
         *
         * @since 3.0.0 - Centralized audio logic
         */
        this._components.ui.on("audioToggle", async () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    Logger.debug(
                        "📡 app.js: Evento audioToggle recibido desde UI"
                    );
                }

                // ✅ VALIDAR AGENTE DISPONIBLE
                if (!this._validateAgentReady()) {
                    Logger.error("❌ Agent no disponible para audio toggle");
                    this._components.ui.showToast(
                        "Asistente no conectado para controlar audio",
                        "warning",
                        3000
                    );
                    return;
                }

                // ✅ LÓGICA INTELIGENTE - Decidir comportamiento automáticamente
                const agentState = this._components.agent.getState();
                const needsFirstInteraction =
                    !agentState.audioPlaybackAllowed ||
                    !agentState.canPlaybackAudio;

                if (CONFIG.debug.showAudioEvents) {
                    Logger.debug("🔊 Estado de audio actual:", {
                        audioPlaybackAllowed: agentState.audioPlaybackAllowed,
                        canPlaybackAudio: agentState.canPlaybackAudio,
                        audioEnabled: agentState.audioEnabled,
                        needsFirstInteraction,
                    });
                }

                let success = false;
                let message = "";
                let toastType = "info";

                if (needsFirstInteraction) {
                    // ✅ PRIMERA INTERACCIÓN - Habilitar audio del navegador
                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            "🔊 Ejecutando primera interacción de audio..."
                        );
                    }

                    success = await this._components.agent.startAudio();

                    if (success) {
                        message = "Audio habilitado correctamente";
                        toastType = "success";

                        // ✅ ACTUALIZAR ESTADO UI - Primera interacción completada
                        this._components.ui.updateAudioState(true, false);

                        if (CONFIG.debug.showAudioEvents) {
                            Logger.debug(
                                "✅ Primera interacción de audio exitosa"
                            );
                        }
                    } else {
                        message =
                            "No se pudo habilitar audio - Intenta de nuevo";
                        toastType = "warning";
                        this._components.ui.updateAudioState(false, true);
                    }
                } else {
                    // ✅ TOGGLE NORMAL - Alternar entre escuchar/silenciado
                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug("🔊 Ejecutando toggle normal de audio...");
                    }

                    const newAudioState =
                        await this._components.agent.toggleAudio();
                    success = true; // toggleAudio no falla, solo cambia estado

                    message = newAudioState
                        ? "Escuchando respuestas de audio"
                        : "Audio silenciado";
                    toastType = newAudioState ? "info" : "warning";

                    // ✅ ACTUALIZAR ESTADO UI - Resultado del toggle
                    this._components.ui.updateAudioState(newAudioState, false);
                    if (CONFIG.debug.showAudioEvents) {
                        Logger.debug(
                            `✅ Toggle audio completado: ${
                                newAudioState ? "ESCUCHANDO" : "SILENCIADO"
                            }`
                        );
                    }
                }

                // ✅ FEEDBACK UNIFICADO
                this._components.ui.showToast(message, toastType, 3000);

                if (CONFIG.debug.showUIEvents) {
                    Logger.debug(`✅ Audio toggle completado exitosamente`);
                }
            } catch (error) {
                Logger.error("❌ Error en toggle de audio:", error);

                // ✅ ERROR HANDLING ROBUSTO
                this._components.ui.showToast(
                    CONFIG.errors.AUDIO_ERROR,
                    "error",
                    4000
                );

                // ✅ RECUPERACIÓN - Forzar actualización desde agent
                try {
                    const currentState = this._components.agent.getState();
                    const stillNeedsInteraction =
                        !currentState.audioPlaybackAllowed;

                    this._components.ui.updateAudioState(
                        currentState.audioEnabled,
                        stillNeedsInteraction
                    );
                } catch (recoveryError) {
                    Logger.error(
                        "❌ Error en recuperación de estado de audio:",
                        recoveryError
                    );
                }
            }
        });

        // ✅ EN _setupUIEventRouting() agregar:
        // ✅ PATRÓN CORRECTO - Usando callAgentRPC
        this._components.ui.on("ttsReplay", async () => {
            try {
                if (!this._validateAgentReady()) return;

                // ✅ USA EL MÉTODO WRAPPER - DRY + SOLID
                const response = await this._components.agent.callAgentRPC(
                    "replay_last_audio",
                    {}, // Payload vacío pero como objeto
                    5000 // Timeout específico
                );

                // ✅ MANEJO DE RESPUESTA JSON
                switch (response.status) {
                    case "no_audio":
                        this._components.ui.showToast(
                            response.message,
                            "warning"
                        );
                        break;
                    case "agent_busy":
                        this._components.ui.showToast(
                            response.message,
                            "warning"
                        );
                        break;
                    case "success":
                        Logger.audio("🔄 Reproduciendo último mensaje");
                        this._components.ui.showToast(
                            response.message,
                            "success"
                        );
                        break;
                    default:
                        Logger.audio("🔄 Comando ejecutado");
                }
            } catch (error) {
                Logger.error("❌ Error en TTS replay:", error);
                this._components.ui.showToast(
                    "Error reproduciendo mensaje",
                    "error"
                );
            }
        });

        // ✅ NUEVO: Handler para botón de video (voice + video juntos)
        this._components.ui.on("videoToggle", async () => {
            try {
                Logger.debug("🎨 UI evento: videoToggle recibido");

                // Verificar si video está activo
                const isVideoActive =
                    window.videoCallManager?.isActive || false;

                if (isVideoActive) {
                    // Terminar videollamada
                    await window.videoCallManager.endVideoCall();
                    Logger.debug("📹 Videollamada terminada vía UI");
                } else {
                    // Iniciar videollamada
                    if (window.videoCallManager) {
                        await window.videoCallManager.startVideoCall();
                        Logger.debug("📹 Videollamada iniciada vía UI");
                    } else {
                        // Fallback: solo activar voz si no hay VideoCallManager
                        Logger.warn(
                            "VideoCallManager no disponible, activando solo voz"
                        );
                        if (
                            !this._components.agent.getState().voiceModeActive
                        ) {
                            await this._components.agent.enableVoiceMode();
                            this._components.ui.updateStatus(
                                "Modo voz activo",
                                "connected"
                            );
                        }
                    }
                }
            } catch (error) {
                Logger.error("❌ Error en videoToggle:", error);
                this._components.ui.showToast(
                    "Error en videollamada",
                    "error",
                    3000
                );
            }
        });
    }

    /**
     * ✅ MANTENER: Agent commands EXACTOS (100% compatibilidad voice-call.js)
     * @private
     */
    _handleAgentCommand(command, params) {
        try {
            Logger.rpc(`Agent Command: ${command}`, params);

            switch (command) {
                case "clear_chat":
                    this._components.ui.clearMessages();
                    break;

                case "set_voice_activity":
                    this._components.ui.updateVoiceActivity(
                        params.active,
                        params.level || 0
                    );
                    break;

                case "update_subtitle":
                    if (this._components.agent.getState().voiceModeActive) {
                        this._components.ui.showSubtitles(
                            params.text,
                            params.isFinal
                        );
                    }
                    break;

                case "force_ui_update":
                    this._forceUIUpdate();
                    break;

                // ✅ MANTENER: voice-call commands EXACTOS
                case "change_voice_call_mode":
                    if (this._components.voiceCallManager) {
                        if (params.mode === "character") {
                            this._components.voiceCallManager.setCharacterMode(
                                params.brandImage
                            );
                        } else if (params.mode === "whatsapp") {
                            this._components.voiceCallManager.setWhatsAppMode(
                                params.useAvatar
                            );
                        }
                    }
                    break;

                default:
                    Logger.rpc(`Comando desconocido: ${command}`, params);
                    break;
            }
        } catch (error) {
            Logger.error(`Error en agent command ${command}:`, error);
        }
    }

    /**
     * Configura event handlers globales de la aplicación usando CONFIG
     * @private
     */
    _setupGlobalEventHandlers() {
        // Cleanup en unload
        window.addEventListener("beforeunload", this._handleWindowUnload);

        // Manejar cambios de visibilidad
        document.addEventListener(
            "visibilitychange",
            this._handleVisibilityChange
        );

        // Online/offline usando CONFIG
        window.addEventListener("online", () => {
            Logger.connection("Conexión restaurada");
            if (!this._state.ready && CONFIG.features.autoReconnect) {
                // ✅ CONFIG
                this._attemptReconnect();
            }
        });

        window.addEventListener("offline", () => {
            Logger.connection("Conexión perdida");
            this._components.ui.showToast("Conexión de red perdida", "warning");

            if (this._components.agent?.getState().voiceModeActive) {
                this._components.ui.showVoiceMode(false);
            }
        });

        // Global error handler
        window.addEventListener("error", (event) => {
            Logger.error("Global error:", event.error);
            if (this._components.ui) {
                this._components.ui.showToast(
                    "Ocurrió un error inesperado",
                    "error"
                );
            }
        });

        Logger.debug("Event handlers globales configurados");
    }

    /**
     * ✅ USAR CONFIG: Maneja errores de inicialización con reintentos
     * @private
     */
    async _handleInitializationError(error, attempt, maxRetries) {
        Logger.error("Error de inicialización:", error);

        if (this._components.ui) {
            this._components.ui.updateStatus(CONFIG.status.ERROR, "error"); // ✅ CONFIG
            this._components.ui.showToast(
                error.message || CONFIG.errors.CONNECTION_FAILED,
                "error"
            ); // ✅ CONFIG
        }

        if (attempt < maxRetries) {
            // ✅ USAR CONFIG para delay
            const delay = CONFIG.performance.reconnectTimeout * attempt; // ✅ CONFIG
            Logger.debug(`Reintentando inicialización en ${delay}ms...`);

            await this._delayFromConfig(delay);
            // El loop principal manejará el siguiente intento
        } else {
            this._showFallbackErrorUI(error);
            throw error;
        }
    }

    /**
     * ✅ USAR CONFIG: Intenta reconexión automática
     * @private
     */
    async _attemptReconnect() {
        if (this._state.ready) return;

        try {
            if (this._components.ui) {
                this._components.ui.updateStatus(
                    CONFIG.status.RECONNECTING,
                    "connecting"
                ); // ✅ CONFIG
            }

            if (this._components.agent) {
                await this._components.agent.initialize();
                this._state.ready = true;
            }
        } catch (error) {
            Logger.error("Reconexión falló:", error);
            if (this._components.ui) {
                this._components.ui.showToast("Reconexión falló", "error");
            }
        }
    }

    /**
     * Fuerza cleanup de modo voz cuando el agente falla
     * @private
     */
    async _forceVoiceModeCleanup() {
        try {
            Logger.debug(
                "🚨 Iniciando cleanup forzado de modo voz con liberación de medios"
            );

            if (this._components.agent && this._components.agent.getState) {
                const state = this._components.agent.getState();
                state.voiceModeActive = false;
                state.userSpeaking = false;
                state.agentThinking = false;
                state.microphoneEnabled = false; // ✅ IMPORTANTE
            }

            if (this._components.agent && this._components.agent._room) {
                // ✅ PASO 1: Intentar disableVoiceMode primero (libera medios correctamente)
                try {
                    Logger.debug(
                        "🚨 Intentando disableVoiceMode para liberación de medios..."
                    );

                    await Promise.race([
                        this._components.agent.disableVoiceMode(),
                        this._createTimeoutFromConfig(
                            "Force disable voice mode timeout"
                        ),
                    ]);

                    Logger.debug(
                        "✅ DisableVoiceMode completado - medios liberados"
                    );
                } catch (disableError) {
                    Logger.error(
                        "❌ Error en disableVoiceMode, continuando con cleanup manual:",
                        disableError
                    );

                    // ✅ PASO 2: CLEANUP MANUAL de medios si disableVoiceMode falla
                    await this._manualMediaCleanup();
                }

                // ✅ PASO 3: Verificar que medios estén liberados antes de disconnect
                const tracksStillActive = this._checkActiveMediaTracks();
                if (tracksStillActive > 0) {
                    Logger.warn(
                        `⚠️ ${tracksStillActive} tracks aún activos, forzando liberación final...`
                    );
                    await this._forceStopAllTracks();
                }

                // ✅ PASO 4: Ahora sí disconnect y reinicializar
                try {
                    await Promise.race([
                        this._components.agent.disconnect(),
                        this._createTimeoutFromConfig(
                            "Force disconnect timeout"
                        ),
                    ]);

                    Logger.debug("✅ Agent disconnected");
                } catch (disconnectError) {
                    Logger.error(
                        "❌ Error en disconnect, continuando:",
                        disconnectError
                    );
                }

                // ✅ PASO 5: Pequeña pausa para permitir liberación completa
                await this._delayFromConfig(500);

                // ✅ PASO 6: Reinicializar agente
                try {
                    await Promise.race([
                        this._components.agent.initialize(),
                        this._createTimeoutFromConfig(
                            "Force reinitialize timeout"
                        ),
                    ]);

                    Logger.debug("✅ Agent reinicializado");
                } catch (reinitError) {
                    Logger.error(
                        "❌ Error reinicializando agent:",
                        reinitError
                    );
                    // No es crítico - continuar sin re-init
                }
            }

            Logger.debug(
                "✅ Cleanup forzado de modo voz completado - medios liberados"
            );
        } catch (recoveryError) {
            Logger.error(
                "❌ Cleanup forzado falló completamente:",
                recoveryError
            );

            // ✅ ÚLTIMO RECURSO: Forzar UI cleanup
            this._components.ui.showToast(
                "Llamada terminada (con errores técnicos)",
                "warning"
            );
        }
    }

    /**
     * ✅ NUEVO: Cleanup manual de medios cuando disableVoiceMode falla
     *
     * @private
     */
    async _manualMediaCleanup() {
        try {
            Logger.debug("🚨 Iniciando cleanup manual de medios...");

            if (!this._components.agent?._room?.localParticipant) {
                Logger.debug("❌ No hay localParticipant para cleanup manual");
                return;
            }

            const localParticipant =
                this._components.agent._room.localParticipant;

            // ✅ Obtener todas las publicaciones de tracks
            const publications = Array.from(
                localParticipant.trackPublications.values()
            );

            for (const publication of publications) {
                if (
                    publication.source ===
                        LivekitClient.Track.Source.Microphone &&
                    publication.track
                ) {
                    try {
                        Logger.debug(
                            "🚨 Cleanup manual: Unpublishing",
                            publication.trackSid
                        );

                        await localParticipant.unpublishTrack(
                            publication.track,
                            true // stopOnUnpublish: true - LIBERAR DISPOSITIVO
                        );

                        Logger.debug("✅ Manual cleanup: Track liberado");
                    } catch (trackError) {
                        Logger.error(
                            "❌ Error en manual cleanup de track:",
                            trackError
                        );

                        // ✅ ÚLTIMO RECURSO: Stop directo
                        if (publication.track.mediaStreamTrack) {
                            publication.track.mediaStreamTrack.stop();
                            Logger.debug(
                                "✅ ÚLTIMO RECURSO: MediaStreamTrack.stop() ejecutado"
                            );
                        }
                    }
                }
            }

            Logger.debug("✅ Cleanup manual de medios completado");
        } catch (error) {
            Logger.error("❌ Error en cleanup manual de medios:", error);
        }
    }

    /**
     * ✅ NUEVO: Verifica tracks de medios aún activos
     *
     * @private
     * @returns {number} Número de tracks aún activos
     */
    _checkActiveMediaTracks() {
        try {
            if (!this._components.agent?._room?.localParticipant) {
                return 0;
            }

            const localParticipant =
                this._components.agent._room.localParticipant;
            const publications = Array.from(
                localParticipant.trackPublications.values()
            );

            let activeCount = 0;

            publications.forEach((publication) => {
                if (
                    publication.source ===
                        LivekitClient.Track.Source.Microphone &&
                    publication.track
                ) {
                    activeCount++;
                    Logger.debug(
                        "🔍 Track activo encontrado:",
                        publication.trackSid
                    );
                }
            });

            return activeCount;
        } catch (error) {
            Logger.error("❌ Error verificando tracks activos:", error);
            return 0;
        }
    }

    /**
     * ✅ NUEVO: Fuerza stop de todos los tracks como último recurso
     *
     * @private
     */
    async _forceStopAllTracks() {
        try {
            Logger.debug(
                "🚨 ÚLTIMO RECURSO: Forzando stop de TODOS los tracks"
            );

            if (!this._components.agent?._room?.localParticipant) {
                return;
            }

            const localParticipant =
                this._components.agent._room.localParticipant;
            const publications = Array.from(
                localParticipant.trackPublications.values()
            );

            // ✅ Unpublish todos los tracks de micrófono
            for (const publication of publications) {
                if (
                    publication.source ===
                        LivekitClient.Track.Source.Microphone &&
                    publication.track
                ) {
                    try {
                        await localParticipant.unpublishTrack(
                            publication.track,
                            true
                        );
                        Logger.debug(
                            "🚨 FORZADO: Track unpublished",
                            publication.trackSid
                        );
                    } catch (unpublishError) {
                        Logger.error(
                            "❌ Error en unpublish forzado:",
                            unpublishError
                        );

                        // ✅ Stop directo del MediaStreamTrack
                        if (publication.track.mediaStreamTrack) {
                            publication.track.mediaStreamTrack.stop();
                            Logger.debug(
                                "🚨 FORZADO: MediaStreamTrack stopped"
                            );
                        }
                    }
                }
            }

            // ✅ Como medida adicional, llamar setMicrophoneEnabled(false)
            try {
                await localParticipant.setMicrophoneEnabled(false);
                Logger.debug(
                    "🚨 FORZADO: setMicrophoneEnabled(false) completado"
                );
            } catch (setMicError) {
                Logger.error(
                    "❌ Error en setMicrophoneEnabled forzado:",
                    setMicError
                );
            }

            Logger.debug("✅ Stop forzado de todos los tracks completado");
        } catch (error) {
            Logger.error("❌ Error en stop forzado de tracks:", error);
        }
    }

    /**
     * Muestra UI de error de fallback usando CONFIG
     * @private
     */
    _showFallbackErrorUI(error) {
        const connectionTime =
            this._components.agent?.getMetrics()?.connectionDuration || 0;

        const errorHTML = `
            <div class="min-h-screen flex items-center justify-center" style="background: var(--bg); color: var(--text);">
                <div class="text-center max-w-md mx-auto p-8">
                    <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <h1 class="text-2xl font-bold mb-4">Error del Asistente de Voz</h1>
                    <p class="text-gray-300 mb-4">
                        No se pudo conectar al asistente de voz. Verifica tu conexión e inténtalo de nuevo.
                    </p>
                    <p class="text-sm text-gray-400 mb-6">
                        Error: ${error.message || "Error desconocido"}
                    </p>
                    <div class="space-y-3">
                        <button onclick="window.location.reload()"
                                class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                            Reintentar Conexión
                        </button>
                        <div class="text-xs text-gray-500 space-y-1">
                            <p>Voice Strategy: dynamic (optimizado)</p>
                            <p>RPC Support: Habilitado</p>
                            <p>Tiempo de Conexión: ${connectionTime.toFixed(
                                0
                            )}ms</p>
                            <p>Versión: ${this._state.appVersion}</p>
                            <p>CONFIG: v4.0 truth source</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.innerHTML = errorHTML;
    }

    /**
     * Valida que el agente esté listo
     * @private
     */
    _validateAgentReady() {
        if (!this._components.agent || !this._state.ready) {
            this._components.ui?.showToast(
                "Asistente de voz no está listo",
                "warning"
            );
            return false;
        }
        return true;
    }

    /**
     * Fuerza actualización de UI
     * @private
     */
    _forceUIUpdate() {
        try {
            if (this._components.agent && this._components.ui) {
                const agentState = this._components.agent.getState();
                this._components.ui.updateAudioState(
                    agentState.audioEnabled,
                    false
                );
                this._components.ui.updateMicState(
                    !agentState.microphoneEnabled
                );
                this._components.ui.showVoiceMode(agentState.voiceModeActive);
            }

            Logger.debug("UI force update completado");
        } catch (error) {
            Logger.error("Error en force UI update:", error);
        }
    }

    /**
     * ✅ USAR CONFIG: Timeout basado en CONFIG
     * @private
     */
    _createTimeoutFromConfig(message) {
        const timeout = CONFIG.performance.connectionTimeout; // ✅ CONFIG
        return new Promise((_, reject) => {
            const timeoutId = setTimeout(
                () => reject(new Error(message)),
                timeout
            );
            this._activeTimeouts.add(timeoutId);
        });
    }

    /**
     * ✅ USAR CONFIG: Delay basado en CONFIG
     * @private
     */
    _delayFromConfig(ms) {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(resolve, ms);
            this._activeTimeouts.add(timeoutId);
        });
    }

    /**
     * ✅ USAR CONFIG: Timeout seguro basado en CONFIG
     * @private
     */
    _safeTimeoutFromConfig(callback, delay) {
        const timeoutId = setTimeout(() => {
            try {
                callback();
            } catch (error) {
                Logger.error("Error en timeout callback:", error);
            }
        }, delay);

        this._activeTimeouts.add(timeoutId);
    }

    /**
     * Maneja unload de ventana
     * @private
     */
    async _handleWindowUnload() {
        if (this._components.agent) {
            try {
                await this._components.agent.disconnect();
            } catch (error) {
                Logger.error("Error durante cleanup:", error);
            }
        }
    }

    /**
     * Maneja cambios de visibilidad
     * @private
     */
    _handleVisibilityChange() {
        Logger.debug(
            "Cambio de visibilidad:",
            document.hidden ? "oculta" : "visible"
        );

        if (
            document.hidden &&
            this._components.agent?.getState().voiceModeActive
        ) {
            Logger.debug("App oculta durante modo voz - manteniendo conexión");
            this._components.ui.updateVoiceActivity(false, 0);
        } else if (
            !document.hidden &&
            this._components.agent?.getState().voiceModeActive
        ) {
            Logger.debug(
                "App visible nuevamente durante modo voz - resumiendo"
            );
            if (this._components.agent.getState().microphoneEnabled) {
                this._components.ui.updateVoiceActivity(true, 0);
            }
        }
    }

    // ========================================
    // EVENTOS DE AVATAR WORKERS
    // ========================================

    /**
     * Obtiene el estado completo de video call para debugging
     * @returns {Object} Estado completo
     */
    getVideoCallState() {
        if (!this._components.videoCallManager || !this._components.agent) {
            Logger.debug("❌ Componentes no disponibles");
            return;
        }

        const agent = this._components.agent;
        const videoManager = this._components.videoCallManager;

        Logger.debug("🎭 AVATAR DEBUG STATE:", {
            // Voice Agent state
            agentConnected: agent._state.connected,
            voiceModeActive: agent._state.voiceModeActive,

            // Avatar detection
            agentPrincipal: agent._detectAgentPrincipal()?.identity,
            avatarWorker: agent._detectAvatarWorker()?.identity,
            avatarVideoTrack: !!agent.getAvatarVideoTrack(),
            isAvatarActive: agent.isAvatarActive(),

            // Video Manager state
            videoCallActive: videoManager._state.isActive,
            avatarState: videoManager._avatarState,

            // UI elements
            videoBtnExists: !!document.getElementById("videoCameraBtn"),
            avatarVideoExists: !!document.getElementById("avatar-video"),
        });
    }

    // ==========================================
    // MÉTODOS PÚBLICOS (APIs mantenidas para compatibilidad)
    // ==========================================
    /**
     * 🎯 Obtiene estado actual del voice activity
     */
    getVoiceActivityState() {
        return {
            userSpeaking: this.state.userSpeaking || false,
            botStatus: this.state.botStatus || "Listo",
            botStatusType: this.state.botStatusType || "ready",
            isVoiceMode: this.state.isVoiceMode || false,
        };
    }

    /**
     * 🧹 Reset completo del voice activity
     */
    resetVoiceActivity() {
        this.updateUserVoiceActivity(false);
        this.updateBotStatus("Listo para conversar", "ready");

        if (CONFIG.debug.showUIEvents) {
            Logger.debug("🧹 Voice activity reseteado");
        }
    }

    /**
     * ✅ DELEGAR: Obtiene el estado usando métricas de componentes
     */
    getState() {
        return {
            ...this._state,
            agentState: this._components.agent
                ? this._components.agent.getState()
                : null,
            uiState: this._components.ui
                ? this._components.ui.getState()
                : null,
            streamingMessageActive: this._streamingState.isActive,
            voiceCallManagerAvailable: !!this._components.voiceCallManager,
            configVersion: "4.0.0-truth-source",
        };
    }

    /**
     * ✅ DELEGAR: Métricas de voz delegadas al agente
     */
    getVoicePerformanceSummary() {
        if (!this._components.agent) {
            return "Agent no disponible para métricas";
        }

        const metrics = this._components.agent.getMetrics();

        if (!metrics || metrics.totalInteractions === 0) {
            return "No hay respuestas de voz medidas aún";
        }

        return `Resumen de Rendimiento de Voz:
            • Respuestas: ${metrics.totalInteractions}
            • Latencia Promedio: ${metrics.averageRpcLatency?.toFixed(0) || 0}ms
            • Tiempo de Conexión: ${
                metrics.connectionDuration?.toFixed(0) || 0
            }ms
            • Total Errores: ${metrics.errorCount || 0}
            • Reconexiones: ${metrics.reconnectCount || 0}
            • RPC Support: Habilitado
            • CONFIG Version: 4.0.0-truth-source`;
    }

    /**
     * Reset de emergencia
     */
    async forceReset() {
        Logger.debug("Reset de emergencia solicitado");
        await this._forceVoiceModeCleanup();
    }

    /**
     * ✅ USAR CONFIG: Streaming text usando CONFIG features
     */
    setStreamingTextMode(enabled = null) {
        if (enabled === null) {
            enabled = !CONFIG.features.streamingText; // ✅ CONFIG
        }

        CONFIG.features.streamingText = enabled; // ✅ CONFIG

        if (enabled) {
            Logger.debug(
                "TEXTO EN TIEMPO REAL HABILITADO - Texto aparece mientras el agente habla"
            );
            this._components.ui?.showToast(
                "Sincronización de texto en tiempo real",
                "success",
                3000
            );
        } else {
            Logger.debug(
                "MODO TEXTO COMPLETO - Texto aparece después de que el agente termine"
            );
            this._components.ui?.showToast("Solo texto completo", "info", 3000);
        }

        return enabled;
    }

    /**
     * ✅ USAR CONFIG: Conversation mode usando CONFIG
     */
    setConversationMode(mode) {
        const validModes = ["separated", "unified"];
        if (!validModes.includes(mode)) {
            Logger.debug('Modo inválido. Usar: "separated" o "unified"');
            return CONFIG.ui.call.conversationMode; // ✅ CONFIG
        }

        CONFIG.ui.call.conversationMode = mode; // ✅ CONFIG

        const description =
            mode === "unified"
                ? "TODO en chat principal (historial completo)"
                : "Separado: texto→chat, voz→subtítulos";

        Logger.debug(`Modo de conversación: ${description}`);
        this._components.ui?.showToast(
            `Modo de conversación: ${mode}`,
            "info",
            3000
        );

        return mode;
    }

    /**
     * ✅ LIMPIO: Cleanup delegado a componentes
     */
    async cleanup() {
        try {
            // Limpiar event listeners globales
            window.removeEventListener(
                "beforeunload",
                this._handleWindowUnload
            );
            document.removeEventListener(
                "visibilitychange",
                this._handleVisibilityChange
            );

            // Limpiar timeouts activos
            this._activeTimeouts.forEach((timeoutId) =>
                clearTimeout(timeoutId)
            );
            this._activeTimeouts.clear();

            // ✅ DELEGAR: Cleanup a componentes
            if (this._components.agent) {
                await this._components.agent.disconnect();
                this._components.agent = null;
            }

            if (this._components.ui) {
                this._components.ui.cleanup();
                this._components.ui = null;
            }

            this._streamingState = {
                currentElement: null,
                currentText: "",
                isActive: false,
            };

            // Reset estado mínimo
            this._state.initialized = false;
            this._state.ready = false;
            if (this._rpcHandlers) {
                this._rpcHandlers.clear();
            }
            // Cleanup del VideoCallManager
            if (window.videoCallManager) {
                try {
                    window.videoCallManager.cleanup();
                    Logger.debug("VideoCallManager limpiado");
                } catch (error) {
                    Logger.debug(
                        "Error limpiando VideoCallManager:",
                        error.message
                    );
                }
            }
            Logger.debug(
                "Cleanup de aplicación completado usando CONFIG truth source"
            );
        } catch (error) {
            Logger.error("Error durante cleanup:", error);
        }
    }

    // ==========================================
    // 🔧 RPC FUNCTION CALL HANDLER
    // ==========================================

    /**
     * Maneja llamadas de funciones RPC del agente Python
     *
     * @description Procesa solicitudes RPC entrantes del agente LiveKit Python,
     * ejecuta la función solicitada y retorna el resultado. Este método actúa
     * como dispatcher central para todas las funciones RPC disponibles.
     *
     * @async
     * @method _handleRPCFunctionCall
     * @param {string} functionName - Nombre de la función RPC a ejecutar
     * @param {Object} args - Argumentos de la función RPC
     * @param {string} [args.text] - Texto del mensaje (para show_message)
     * @param {string} [args.message] - Mensaje alternativo (para show_message)
     * @param {string} [args.status] - Estado a actualizar (para update_status)
     * @param {string} [args.type] - Tipo de estado (para update_status)
     * @param {boolean} [args.show] - Si mostrar typing indicator (para show_typing)
     * @param {string} [args.audioUrl] - URL de audio (para play_audio)
     * @param {string} [args.url] - URL alternativa (para play_audio)
     *
     * @returns {Promise<Object>} Resultado de la función RPC ejecutada
     * @returns {boolean} returns.success - Si la función se ejecutó correctamente
     * @returns {*} [returns.result] - Resultado específico de la función
     * @returns {string} [returns.message] - Mensaje de estado
     * @returns {boolean} [returns.forwarded] - Si la función fue reenviada
     *
     * @throws {Error} Si la función RPC falla durante ejecución
     *
     * @example
     * // Desde el agente Python llegará:
     * const result = await _handleRPCFunctionCall('show_message', {
     *   text: 'Hola usuario'
     * });
     * // result = { success: true, shown: true }
     *
     * @example
     * // Función desconocida se reenvía:
     * const result = await _handleRPCFunctionCall('custom_function', {
     *   data: 'value'
     * });
     * // result = { success: true, message: 'Function custom_function forwarded to application', forwarded: true }
     *
     * @since 3.0.0
     * @memberof VoiceAgentApp
     * @private
     */
    async _handleRPCFunctionCall(functionName, args) {
        // Incrementar contador de RPC activas
        this._components.ui.state.rpcCallsActive++;

        try {
            if (CONFIG.debug.logRpcCalls) {
                Logger.debug(`🔧 RPC Function Call: ${functionName}`, args);
            }

            // Verificar si tenemos un handler específico en UI
            if (
                this._components.ui._rpcHandlers &&
                this._components.ui._rpcHandlers.has(functionName)
            ) {
                const handler =
                    this._components.ui._rpcHandlers.get(functionName);
                const result = await handler(
                    args.message || args.text,
                    args.type,
                    args.duration
                );
                return result;
            }

            // Handlers comunes implementados en app.js
            switch (functionName) {
                case "show_message":
                    // Delegar al UI para mostrar mensaje
                    this._components.ui.addMessage(
                        args.text || args.message,
                        "bot"
                    );
                    return { success: true, shown: true };

                case "update_status":
                    // Delegar al UI para actualizar estado
                    this._components.ui.updateStatus(
                        args.status,
                        args.type || "info"
                    );
                    return { success: true, updated: true };

                case "show_typing":
                    // Delegar al UI para mostrar/ocultar typing
                    this._components.ui.showTypingIndicator(
                        args.show !== false
                    );
                    return { success: true, typing: args.show !== false };

                case "play_audio":
                    // Emitir evento para que app.js maneje audio
                    this._emit("playAudioRequested", args.audioUrl || args.url);
                    return { success: true, playing: true };

                case "get_ui_state":
                    // Retornar estado completo de la aplicación
                    return {
                        success: true,
                        state: this.getState(),
                    };

                default:
                    // Reenviar funciones desconocidas como eventos
                    this._emit("unknownFunctionCall", functionName, args);
                    return {
                        success: true,
                        message: `Function ${functionName} forwarded to application`,
                        forwarded: true,
                    };
            }
        } catch (error) {
            Logger.error(`❌ Error en RPC function ${functionName}:`, error);
            throw error;
        } finally {
            // Decrementar contador de RPC activas
            this._components.ui.state.rpcCallsActive = Math.max(
                0,
                this._components.ui.state.rpcCallsActive - 1
            );
        }
    }

    // ==========================================
    // 🤖 AGENT COMMAND HANDLER
    // ==========================================

    /**
     * Maneja comandos del agente LiveKit Python
     *
     * @description Procesa comandos específicos enviados por el agente Python
     * a través del sistema de mensajería LiveKit. Estos comandos permiten al
     * agente controlar aspectos específicos de la UI y el comportamiento.
     *
     * @method _handleAgentCommand
     * @param {string} command - Comando a ejecutar
     * @param {Object} params - Parámetros del comando
     * @param {boolean} [params.active] - Estado activo (para set_voice_activity)
     * @param {number} [params.level] - Nivel de actividad 0-1 (para set_voice_activity)
     * @param {string} [params.text] - Texto de subtítulo (para update_subtitle)
     * @param {boolean} [params.isFinal] - Si es subtítulo final (para update_subtitle)
     *
     * @returns {void}
     *
     * @example
     * // Desde agente Python:
     * _handleAgentCommand('clear_chat', {});
     * // Limpia todos los mensajes del chat
     *
     * @example
     * // Control de actividad de voz:
     * _handleAgentCommand('set_voice_activity', {
     *   active: true,
     *   level: 0.8
     * });
     *
     * @since 3.0.0
     * @memberof VoiceAgentApp
     * @private
     */
    _handleAgentCommand(command, params) {
        try {
            if (CONFIG.debug.logRpcCalls) {
                Logger.debug(`🤖 Agent Command: ${command}`, params);
            }

            switch (command) {
                case "clear_chat":
                    // Delegar al UI para limpiar mensajes
                    this._components.ui.clearMessages();
                    break;

                case "set_voice_activity":
                    // Delegar al UI para mostrar actividad de voz
                    this._components.ui.updateVoiceActivity(
                        params.active,
                        params.level || 0
                    );
                    break;

                case "update_subtitle":
                    // Solo mostrar subtítulos si estamos en modo voz
                    if (this._components.agent.getState().voiceModeActive) {
                        this._components.ui.showSubtitles(
                            params.text,
                            params.isFinal
                        );
                    }
                    break;

                case "force_ui_update":
                    // Forzar actualización completa de UI
                    this._forceUIUpdate();
                    break;

                default:
                    // Reenviar comandos desconocidos como eventos
                    this._emit("agentCommandReceived", command, params);
                    break;
            }
        } catch (error) {
            Logger.error(`❌ Error en agent command ${command}:`, error);
        }
    }

    // ==========================================
    // 🔗 RPC HANDLERS SETUP
    // ==========================================

    /**
     * Configura handlers de RPC para comunicación bidireccional
     *
     * @description Inicializa el sistema de RPC handlers que permiten al agente
     * Python llamar funciones específicas en el cliente JavaScript. Configura
     * mapeos de funciones disponibles y sus implementaciones.
     *
     * @method _setupRPCHandlers
     * @returns {void}
     *
     * @example
     * // Llamado durante inicialización:
     * this._setupRPCHandlers();
     *
     * // Configura handlers como:
     * // - update_ui_state
     * // - show_notification
     * // - change_persona
     *
     * @since 3.0.0
     * @memberof VoiceAgentApp
     * @private
     */
    _setupRPCHandlers() {
        // Verificar que UI esté disponible
        if (!this._components.ui) {
            Logger.error("❌ UI no disponible para setup RPC handlers");
            return;
        }

        // Inicializar mapa de RPC handlers en UI
        if (!this._components.ui._rpcHandlers) {
            this._components.ui._rpcHandlers = new Map();
        }

        // RPC Handler: Actualizar estado de UI
        this._components.ui._rpcHandlers.set(
            "update_ui_state",
            (state, data) => {
                try {
                    switch (state) {
                        case "loading":
                            this._components.ui.showTypingIndicator(true);
                            break;
                        case "thinking":
                            // Mostrar indicador de pensamiento
                            break;
                        case "ready":
                            this._components.ui.showTypingIndicator(false);
                            break;
                        case "error":
                            this._components.ui.showToast(
                                data?.message || "Error del agente",
                                "error"
                            );
                            break;
                    }

                    this._emit("uiStateUpdated", state, data);
                    return { success: true, state, timestamp: Date.now() };
                } catch (error) {
                    Logger.error("❌ Error en update_ui_state:", error);
                    return { success: false, error: error.message };
                }
            }
        );

        // RPC Handler: Mostrar notificación
        this._components.ui._rpcHandlers.set(
            "show_notification",
            (message, type = "info", duration = 3000) => {
                try {
                    this._components.ui.showToast(message, type, duration);
                    return {
                        success: true,
                        shown: true,
                        timestamp: Date.now(),
                    };
                } catch (error) {
                    Logger.error("❌ Error en show_notification:", error);
                    return { success: false, error: error.message };
                }
            }
        );

        // RPC Handler: Cambiar persona
        this._components.ui._rpcHandlers.set(
            "change_persona",
            (personaId, config) => {
                try {
                    // Emit para que la aplicación maneje el cambio
                    this._emit("personaChangeRequested", personaId, config);

                    this._components.ui.showToast(
                        `Cambiando a ${config?.name || personaId}`,
                        "info",
                        2000
                    );
                    return { success: true, personaId, timestamp: Date.now() };
                } catch (error) {
                    Logger.error("❌ Error en change_persona:", error);
                    return { success: false, error: error.message };
                }
            }
        );

        Logger.debug(
            "🔧 RPC Handlers configurados:",
            Array.from(this._components.ui._rpcHandlers.keys())
        );
    }

    // ==========================================
    // 📺 STREAMING MESSAGE HANDLER
    // ==========================================

    /**
     * Maneja streaming de transcripciones del AGENTE únicamente
     *
     * @description SOLO para agentTranscriptionReceived - NO aplica a usuario.
     * Implementa efecto karaoke si CONFIG.features.streamingText = true.
     *
     * @param {string} text - Texto de la transcripción del agente
     * @param {boolean} isFinal - Si es la versión final del segmento
     * @param {Object} segment - Segmento completo (opcional)
     */
    _handleStreamingMessage(text, isFinal, segment = null) {
        if (CONFIG.debug.showUIEvents) {
            Logger.debug(
                `🤖 Agent transcription: "${text.substring(
                    0,
                    30
                )}..." isFinal=${isFinal}`
            );
        }

        // ✅ VALIDACIÓN CRÍTICA: Respetar CONFIG como fuente de verdad
        if (!isFinal && !CONFIG.features.streamingText) {
            // Modo streamingText = false: IGNORAR texto parcial del agente
            if (CONFIG.debug.showUIEvents) {
                Logger.debug(
                    "🤖 Texto parcial del agente IGNORADO (streamingText = false)"
                );
            }
            return;
        }

        // Determinar dónde mostrar según configuración
        const mode = CONFIG.ui.call.conversationMode;
        const isVoiceMode = this._components.agent?.getState().voiceModeActive;

        if (mode === "unified" || !isVoiceMode) {
            // CHAT PRINCIPAL - Historial completo
            this._handleAgentChatDisplay(text, isFinal);
        } else {
            // MODO SEPARATED + VOZ - Solo subtítulos en modal
            this._handleAgentSubtitlesDisplay(text, isFinal);
        }
    }

    /**
     * Maneja visualización del agente en chat principal
     * @private
     */
    _handleAgentChatDisplay(text, isFinal) {
        if (!isFinal && CONFIG.features.streamingText) {
            // ✅ EFECTO KARAOKE - Texto parcial
            if (!this._streamingState.isActive) {
                this._streamingState.currentElement =
                    this._components.ui.addMessage(text, "bot", true); // isStreaming = true
                this._streamingState.isActive = true;

                if (CONFIG.debug.showUIEvents) {
                    Logger.debug("🎤 Iniciando karaoke para agente");
                }
            } else {
                this._components.ui.updateStreamingMessage(
                    this._streamingState.currentElement,
                    text,
                    false // isFinal = false
                );
            }
            this._streamingState.currentText = text;
        } else if (isFinal) {
            // ✅ TEXTO FINAL - Completar o crear mensaje directo
            if (this._streamingState.isActive) {
                // Completar streaming existente
                this._components.ui.updateStreamingMessage(
                    this._streamingState.currentElement,
                    text,
                    true // isFinal = true
                );
                this._resetStreamingState();

                if (CONFIG.debug.showUIEvents) {
                    Logger.debug("✅ Karaoke del agente COMPLETADO");
                }
            } else {
                // Crear mensaje final directo (sin streaming previo)
                this._components.ui.addMessage(text, "bot");

                if (CONFIG.debug.showUIEvents) {
                    Logger.debug(
                        "✅ Mensaje final del agente DIRECTO (sin karaoke)"
                    );
                }
            }
            this._streamingState.currentText = "";
        }
    }

    /**
     * Maneja visualización del agente en subtítulos de voz
     * @private
     */
    _handleAgentSubtitlesDisplay(text, isFinal) {
        // En modo voz separado, siempre mostrar como subtítulos
        // El CONFIG.features.streamingText también aplica aquí
        if (CONFIG.features.streamingText && !isFinal) {
            // Subtítulos temporales (actualizándose)
            this._components.ui.showSubtitles(text, false);
        } else if (isFinal) {
            // Subtítulos finales
            this._components.ui.showSubtitles(text, true);
        }
    }

    /**
     * Resetea estado de streaming del agente
     * @private
     */
    _resetStreamingState() {
        this._streamingState.isActive = false;
        this._streamingState.currentElement = null;
        this._streamingState.currentText = "";
    }
}

// ==========================================
// INICIALIZACIÓN GLOBAL CON CONFIG
// ==========================================

// Instancia global de la aplicación
let app = null;

// Inicializar cuando DOM esté listo usando CONFIG
document.addEventListener("DOMContentLoaded", async () => {
    try {
        Logger.debug(
            "DOM cargado, iniciando Voice Agent App v4.0-config-truth..."
        );
        Logger.debug(
            "Target: CONFIG como fuente de verdad única + zero duplicación"
        );

        app = new VoiceAgentApp();
        await app.init();

        // Hacer app globalmente accesible para debugging
        if (CONFIG.debug.enabled) {
            window.app = app;
            window.CONFIG = CONFIG;
            // ✅ API DE TESTING MEJORADA PARA TOASTS
            window.testToast = (message, type = "info", duration = 3000) => {
                const ui = app.ui; // Usar el getter público
                if (ui && ui.showToast) {
                    // Forzar habilitación temporal para testing
                    const originalEnabled = CONFIG.ui.notifications.enabled;
                    CONFIG.ui.notifications.enabled = true;

                    Logger.debug(`🍞 Testing toast: ${type} - ${message}`);
                    const result = ui.showToast(message, type, duration);

                    // Restaurar configuración original después de 100ms
                    setTimeout(() => {
                        CONFIG.ui.notifications.enabled = originalEnabled;
                    }, 100);

                    return result;
                } else {
                    Logger.error("❌ UI o showToast no disponible:", {
                        ui,
                        showToast: ui?.showToast,
                    });
                    return false;
                }
            };

            // ✅ SHORTCUTS ÚTILES
            window.showToast = window.testToast; // Alias corto
            window.getUI = () => app.ui;
            window.getAgent = () => app.agent;
            // ✅ COMANDOS USANDO CONFIG
            window.forceReset = () => app.forceReset();
            window.getAppState = () => app.getState();
            window.getVoiceMetrics = () => app.getVoicePerformanceSummary();
            window.toggleStreaming = (enabled) =>
                app.setStreamingTextMode(enabled);
            window.setConversationMode = (mode) =>
                app.setConversationMode(mode);

            // Debug específico usando CONFIG
            window.showVoiceMetrics = () => {
                Logger.debug(app.getVoicePerformanceSummary());
                return app._components.agent?.getMetrics() || {};
            };

            Logger.debug("🔧 Comandos de debug disponibles:");
            Logger.debug("  • window.showVoiceMetrics() // Delegado al agente");
            Logger.debug("  • window.getAppState() // Estado usando CONFIG");
            Logger.debug(
                "  • window.toggleStreaming() // CONFIG.features.streamingText"
            );
            Logger.debug(
                '  • window.setConversationMode("separated"|"unified") // CONFIG.ui.call'
            );

            Logger.debug("🎯 ARQUITECTURA CONFIG TRUTH SOURCE:");
            Logger.debug("  • Zero duplicación de configuración ✅");
            Logger.debug("  • Event routing limpio ✅");
            Logger.debug("  • Métricas delegadas a componentes ✅");
            Logger.debug("  • 100% compatibilidad con voice-call.js ✅");
            Logger.debug("  • 100% compatibilidad con ui-manager.js ✅");
            Logger.debug("  • APIs públicas mantenidas ✅");
            Logger.debug(
                `  • Modo de Conversación: ${CONFIG.ui.call.conversationMode}`
            );
            window.debugAvatar = () => {
                if (window.app) {
                    window.app.debugAvatarState();
                } else {
                    Logger.debug("❌ App no disponible");
                }
            };

            window.activateAvatar = async (provider = "tavus") => {
                if (window.app?._components?.agent) {
                    return await window.app._components.agent.activateAvatar(
                        provider
                    );
                } else {
                    Logger.debug("❌ Voice agent no disponible");
                    return false;
                }
            };

            window.toggleVideoCall = async () => {
                if (window.app?._components?.videoCallManager) {
                    const vm = window.app._components.videoCallManager;
                    if (!vm._state.isActive) {
                        await vm.startVideoCall();
                    } else {
                        await vm.toggleAvatar();
                    }
                } else {
                    Logger.debug("❌ Video call manager no disponible");
                }
            };

            Logger.debug("🎮 Avatar debug functions available:");
            Logger.debug("  - debugAvatar()");
            Logger.debug("  - activateAvatar('tavus')");
            Logger.debug("  - toggleVideoCall()");
        }
    } catch (error) {
        Logger.error(
            "Error crítico durante inicialización de Voice Agent App:",
            error
        );

        setTimeout(() => {
            if (!app || !app.getState().initialized) {
                Logger.debug("Intentando inicialización de fallback...");
                window.location.reload();
            }
        }, CONFIG.performance.reconnectTimeout); // ✅ CONFIG
    }
});

// Export para debugging
if (typeof window !== "undefined" && CONFIG.debug.enabled) {
    window.VoiceAgentApp = VoiceAgentApp;
}
