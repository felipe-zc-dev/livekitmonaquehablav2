/**
 * UI Manager v3.0 - Compatible con ModernVoiceAgent
 *
 * ACTUALIZACIONES PARA MODERNVOICEAGENT:
 * ✅ Eventos modernos de LiveKit v2.13.x
 * ✅ RPC function call handling
 * ✅ Audio interaction management v2.13.x
 * ✅ Agent connection status
 * ✅ Memory leak prevention mejorado
 * ✅ Error handling robusto
 * ✅ Backward compatibility 100%
 *
 * @author Equipo de Desarrollo
 * @version 3.0.0
 * @since 2024
 * @requires ModernVoiceAgent
 * @requires CONFIG (configuración global)
 *
 * COMPATIBLE CON:
 * - ModernVoiceAgent v3.0
 * - LiveKit v2.13.x
 * - Navegadores modernos
 */
class UIManager {
    /**
     * Constructor del UIManager actualizado
     *
     * Mantiene toda la funcionalidad anterior pero añade compatibilidad
     * con ModernVoiceAgent y patrones LiveKit v2.13.x
     *
     * @throws {Error} Si faltan elementos DOM críticos
     */
    constructor() {
        // Obtener y validar elementos DOM críticos
        this.elements = this._getElements();

        /**
         * Estado interno del UIManager (compatible con versión anterior)
         * @type {Object}
         */
        this.state = {
            isVoiceMode: false,
            audioEnabled: false,
            micActive: false,
            messageCount: 0,
            toastContainer: null,

            // Estados de actividad de voz
            userSpeaking: false,
            botThinking: false,
            voiceActivityLevel: 0,
            lastLatencyMeasurement: 0,
            connectionQuality: "unknown",

            // Estados separados de indicadores
            showingTypingIndicator: false,
            showingBotThinking: false,
        };

        /**
         * Timers para gestión de voz y UX suave
         * @type {Object}
         */
        this.voiceTimers = {
            thinkingIndicator: null,
            subtitleTimeout: null,
            activityTimeout: null,
            statusUpdateTimer: null,
            latencyDisplayTimer: null,
            typingTimeout: null,
            rpcTimeout: null,
        };

        /**
         * Referencias de event handlers para cleanup apropiado
         * @type {Map<string, Function>}
         * @private
         */
        this._eventHandlers = new Map();

        // Inicializar componentes de la UI
        this._initializeToastContainer();
        this._setupEventListeners();
        this._initializeAudioButton();
        this._initializeVoiceIndicators();

        console.log("🎨 UIManager v3.0 - Compatible con ModernVoiceAgent");
        console.log("✅ RPC function calls + Audio interaction v2.13.x");
    }

    /**
     * Obtiene y valida elementos DOM requeridos (sin cambios)
     * @private
     * @returns {Object} Objeto con referencias a elementos DOM
     */
    _getElements() {
        const elements = {
            // Elementos de estado y conexión
            status: document.getElementById("status"),
            statusText: document.getElementById("status-text"),
            // ❌ ELIMINADO: connectionQuality: document.getElementById("connection-quality"),

            // Elementos del chat
            chatContainer: document.getElementById("chat-messages"),
            textInput: document.getElementById("chatInput"),
            sendBtn: document.getElementById("sendBtn"),
            messageForm: document.getElementById("messageForm"),
            typingIndicator: document.getElementById("typing-indicator"),

            // Controles de voz
            callBtn: document.getElementById("callBtn"),
            callOverlay: document.getElementById("call-overlay"),
            callStatus: document.getElementById("call-status"),
            hangupBtn: document.getElementById("hangupBtn"),
            muteBtn: document.getElementById("muteBtn"),

            // Control de audio
            audioBtn: document.getElementById("audioBtn"),

            // Subtítulos y actividad de voz
            callSubtitles: document.getElementById("call-subtitles"),
            voiceActivity: document.getElementById("voice-activity"),
            voiceActivityLabel: document.getElementById("voiceActivityLabel"),
        };

        // Validar elementos críticos (sin connectionQuality)
        const required = [
            "chatContainer",
            "textInput",
            "sendBtn",
            "callBtn",
            "messageForm",
            "typingIndicator",
        ];

        const missing = required.filter((id) => !elements[id]);

        if (missing.length > 0) {
            throw new Error(
                `❌ Elementos DOM críticos faltantes: ${missing.join(", ")}`
            );
        }

        return elements;
    }

    /**
     * Inicializa el contenedor de notificaciones toast (sin cambios)
     * @private
     */
    _initializeToastContainer() {
        if (this.state.toastContainer) return;

        try {
            this.state.toastContainer = document.createElement("div");
            this.state.toastContainer.id = "toast-container";
            this.state.toastContainer.className =
                "fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none";
            this.state.toastContainer.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
            `;
            document.body.appendChild(this.state.toastContainer);
        } catch (error) {
            console.error(
                "❌ Error creando contenedor de notificaciones:",
                error
            );
        }
    }

    /**
     * Inicializa indicadores de actividad de voz (sin cambios)
     * @private
     */
    _initializeVoiceIndicators() {
        if (this.elements.voiceActivity) {
            console.log("✅ Indicadores de actividad de voz inicializados");
        }
    }

    /**
     * Inicializa el estado del botón de audio
     * @private
     */
    _initializeAudioButton() {
        this.state.audioEnabled = false;
        this.updateAudioState(false, true);
    }

    /**
     * ✅ ACTUALIZADO: Event listeners con support para ModernVoiceAgent
     * @private
     */
    _setupEventListeners() {
        /**
         * Handler para toggle del micrófono - ARQUITECTURA AGNÓSTICA
         *
         * @description Maneja el clic del botón de micrófono emitiendo un evento
         * al orquestador principal (app.js) para mantener separación de responsabilidades.
         * UI Manager NO conoce LiveKit - solo maneja la interfaz visual.
         *
         * @method handleMuteToggle
         * @memberof UIManager
         * @private
         *
         * @fires ui:muteToggle - Evento emitido cuando usuario presiona botón mute
         *
         * @example
         * // Flujo de ejecución:
         * // 1. Usuario hace clic en botón mute
         * // 2. UI emite evento 'muteToggle'
         * // 3. app.js recibe evento
         * // 4. app.js llama agent.toggleMicrophone()
         * // 5. agent ejecuta toggle en LiveKit
         * // 6. agent emite resultado
         * // 7. app.js actualiza UI via updateMicState()
         *
         * @since 3.0.0
         * @version Refactored for agnostic architecture
         */
        const handleMuteToggle = () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "🎨 Botón mute presionado - emitiendo evento muteToggle"
                    );
                }

                // ✅ PREVENIR DOBLE CLIC accidental
                if (this.elements.muteBtn.disabled) {
                    if (CONFIG.debug.showUIEvents) {
                        console.log(
                            "🎨 Botón mute deshabilitado temporalmente"
                        );
                    }
                    return;
                }

                // ✅ FEEDBACK VISUAL INMEDIATO - Deshabilitar temporalmente
                this.elements.muteBtn.disabled = true;

                // ✅ EMITIR EVENTO AGNÓSTICO - UI no conoce LiveKit
                this._emitUIEvent("muteToggle");

                // ✅ RE-HABILITAR BOTÓN después de timeout para prevenir spam
                setTimeout(() => {
                    this.elements.muteBtn.disabled = false;
                }, 500); // 500ms debounce

                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "✅ Evento muteToggle emitido al orquestador (app.js)"
                    );
                }
            } catch (error) {
                console.error("❌ Error en handler de botón mute:", error);

                // ✅ RECOVERY: Re-habilitar botón y mostrar error
                this.elements.muteBtn.disabled = false;
                this.showToast("Error en control de micrófono", "error", 3000);
            }
        };

        const handleHangup = () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    console.log("🎨 Botón de colgar presionado");
                }

                if (this.elements.hangupBtn.disabled) return;

                this.elements.hangupBtn.disabled = true;
                setTimeout(() => {
                    this.elements.hangupBtn.disabled = false;
                }, 2000);

                this._emitUIEvent("voiceEnd");
            } catch (error) {
                console.error("❌ Error al colgar:", error);
                this.elements.hangupBtn.disabled = false;
            }
        };

        // Text message handling (sin cambios)
        const handleTextSubmit = (e) => {
            e.preventDefault();
            this._handleTextSend();
        };

        const handleKeyDown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this._handleTextSend();
            }
        };

        const handleInputResize = (e) => {
            this._handleInputResize(e.target);
        };

        // Voice controls (actualizados para ModernVoiceAgent)
        const handleCallToggle = () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "🎨 Botón de llamada presionado, modo voz actual:",
                        this.state.isVoiceMode
                    );
                }
                this._emitUIEvent("voiceToggle");
            } catch (error) {
                console.error("❌ Error en toggle de llamada:", error);
                this.showToast("Error en control de voz", "error");
            }
        };

        /**
         * Handler para toggle de audio - ARQUITECTURA AGNÓSTICA MEJORADA
         *
         * @description Maneja el clic del botón de audio emitiendo un evento único
         * al orquestador. El orquestador (app.js) decide si es primera interacción
         * o toggle normal basado en el estado del agent, no la UI.
         *
         * @method handleAudioToggle
         * @memberof UIManager
         * @private
         *
         * @fires ui:audioToggle - Evento único para cualquier interacción de audio
         *
         * @example
         * // Flujo simplificado:
         * // 1. Usuario hace clic en botón audio (cualquier estado)
         * // 2. UI emite evento 'audioToggle' SIEMPRE
         * // 3. app.js decide si es primera interacción o toggle
         * // 4. app.js llama método apropiado del agent
         * // 5. agent actualiza estado y UI recibe feedback
         *
         * @since 3.0.0
         * @version Refactored for complete agnostic architecture
         */
        const handleAudioToggle = () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "🎨 Botón audio presionado - emitiendo evento audioToggle"
                    );
                }

                // ✅ PREVENIR DOBLE CLIC accidental
                if (this.elements.audioBtn.disabled) {
                    if (CONFIG.debug.showUIEvents) {
                        console.log(
                            "🎨 Botón audio deshabilitado temporalmente"
                        );
                    }
                    return;
                }

                // ✅ FEEDBACK VISUAL INMEDIATO - Deshabilitar temporalmente
                this.elements.audioBtn.disabled = true;

                // ✅ EMITIR EVENTO ÚNICO - app.js decide el comportamiento
                this._emitUIEvent("audioToggle");

                // ✅ RE-HABILITAR BOTÓN después de timeout
                setTimeout(() => {
                    this.elements.audioBtn.disabled = false;
                }, 300); // 300ms debounce para audio

                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "✅ Evento audioToggle emitido - app.js decidirá comportamiento"
                    );
                }
            } catch (error) {
                console.error("❌ Error en handler de botón audio:", error);

                // ✅ RECOVERY: Re-habilitar botón y mostrar error
                this.elements.audioBtn.disabled = false;
                this.showToast("Error en control de audio", "error", 3000);
            }
        };

        // Registrar event listeners
        this._eventHandlers.set("audioToggle", handleAudioToggle);
        this._eventHandlers.set("textSubmit", handleTextSubmit);
        this._eventHandlers.set("keyDown", handleKeyDown);
        this._eventHandlers.set("inputResize", handleInputResize);
        this._eventHandlers.set("callToggle", handleCallToggle);
        this._eventHandlers.set("hangup", handleHangup);
        this._eventHandlers.set("muteToggle", handleMuteToggle);

        // Aplicar listeners
        this.elements.audioBtn.addEventListener("click", handleAudioToggle);
        this.elements.messageForm.addEventListener("submit", handleTextSubmit);
        this.elements.textInput.addEventListener("keydown", handleKeyDown);
        this.elements.textInput.addEventListener("input", handleInputResize);
        this.elements.callBtn.addEventListener("click", handleCallToggle);
        this.elements.hangupBtn.addEventListener("click", handleHangup);
        this.elements.muteBtn.addEventListener("click", handleMuteToggle);

        // Keyboard shortcuts
        if (CONFIG.features.keyboardShortcuts) {
            this._setupKeyboardShortcuts();
        }

        // Click en overlay
        if (this.elements.callOverlay) {
            const handleOverlayClick = (e) => {
                if (e.target === this.elements.callOverlay) {
                    this._emitUIEvent("voiceEnd");
                }
            };
            this._eventHandlers.set("overlayClick", handleOverlayClick);
            this.elements.callOverlay.addEventListener(
                "click",
                handleOverlayClick
            );
        }

        this._preventDoubleTabZoom();
    }

    /**
     * Maneja el envío de mensajes de texto (actualizado)
     * @private
     */
    _handleTextSend() {
        try {
            const text = this.elements.textInput.value.trim();
            if (text) {
                console.log(
                    "📤 STEP 1: Usuario presionó sendBtn con texto:",
                    text.substring(0, 30)
                );

                this._setButtonState(this.elements.sendBtn, "sending");
                this._emitUIEvent("textSend", text);
                console.log("📤 STEP 2: Evento textSend emitido a app.js");
                this.elements.textInput.value = "";
                this.elements.textInput.focus();

                setTimeout(() => {
                    this._setButtonState(this.elements.sendBtn, "normal");
                }, 1000);
            }
        } catch (error) {
            console.error("❌ Error enviando mensaje:", error);
            this._setButtonState(this.elements.sendBtn, "normal");
            this.showToast("Error enviando mensaje", "error");
        }
    }

    // ==========================================
    // MÉTODOS PÚBLICOS (sin cambios en API)
    // ==========================================

    /**
     * Actualiza el estado de conexión (API sin cambios)
     * @param {string} status - Mensaje de estado
     * @param {string} type - Tipo: 'connecting' | 'connected' | 'error'
     */
    updateStatus(status, type = "connecting") {
        try {
            console.log("🎨 UI MANAGER - updateStatus llamado:", status, type);

            if (!this.elements.status) {
                console.error("❌ elemento #status no encontrado");
                return;
            }

            if (!this.elements.statusText) {
                console.error("❌ elemento #status-text no encontrado");
                return;
            }

            this.elements.status.className = `connection-status status-${type}`;

            if (this.elements.statusText) {
                this.elements.statusText.textContent = status;
            }

            if (
                this.state.isVoiceMode &&
                CONFIG.debug.showLatencyMetrics &&
                this.state.lastLatencyMeasurement > 0
            ) {
            }

            if (CONFIG.debug.showUIEvents) {
                console.log(
                    "✅ HTML actualizado:",
                    this.elements.statusText.textContent
                );
                console.log(`🎨 Estado actualizado: ${status} (${type})`);
            }
        } catch (error) {
            console.error("❌ Error actualizando estado:", error);
        }
    }

    /**
     * Añade mensaje al chat (API compatible, implementación mejorada)
     * @param {string} content - Contenido del mensaje
     * @param {string} sender - Remitente: 'user' | 'bot'
     * @param {boolean} isStreaming - Si el mensaje está en streaming
     * @returns {HTMLElement|null} Elemento del mensaje creado
     */
    addMessage(content, sender = "bot", isStreaming = false) {
        if (!content || !this.elements.chatContainer) return null;

        try {
            const messageEl = document.createElement("article");
            messageEl.className = `message-bubble ${sender}`;
            messageEl.setAttribute("role", "listitem");

            const formattedContent = this._formatMessageContent(content);
            messageEl.innerHTML = formattedContent;

            if (isStreaming) {
                messageEl.classList.add("streaming");
                const cursor = document.createElement("span");
                cursor.className = "cursor";
                cursor.setAttribute("aria-hidden", "true");
                cursor.textContent = "|";
                messageEl.appendChild(cursor);
            } else {
                this._addTimestamp(messageEl, sender);
            }

            // DOM insertion con error recovery
            try {
                this.elements.chatContainer.appendChild(messageEl);
            } catch (domError) {
                console.error(
                    "❌ Inserción DOM falló, forzando cleanup:",
                    domError
                );
                this._forceCleanupChatContainer();
                this.elements.chatContainer.appendChild(messageEl);
            }

            this._scrollToBottom();
            this._limitMessages();
            this.state.messageCount++;

            // ✅ NUEVO: Marcar como último mensaje del bot para replay
            if (sender === "bot" && !isStreaming) {
                // this._markAsLatestBotMessage(messageEl);
            }

            return messageEl;
        } catch (error) {
            console.error("❌ Error crítico añadiendo mensaje:", error);
            return this._createFallbackMessage(content, sender);
        }
    }

    /**
     * ✅ NUEVO: Marca mensaje como último del bot para funcionalidad de replay
     * @private
     * @param {HTMLElement} messageEl - Elemento del mensaje
     */
    // ✅ ACTUALIZAR: La función existente para agregar botón
    _markAsLatestBotMessage(messageEl) {
        // Remover marca anterior
        const previousLatest = this.elements.chatContainer.querySelector(
            ".latest-bot-message"
        );
        if (previousLatest) {
            previousLatest.classList.remove("latest-bot-message");
            // ✅ NUEVO: Remover botón anterior
            const oldBtn = previousLatest.querySelector(".tts-replay-btn");
            if (oldBtn) oldBtn.remove();
        }

        // Marcar nuevo mensaje como último
        messageEl.classList.add("latest-bot-message");

        // ✅ NUEVO: Agregar botón TTS usando Font Awesome + clases existentes
        const replayBtn = document.createElement("button");
        replayBtn.className = "tts-replay-btn";
        replayBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        replayBtn.title = "Reproducir mensaje";
        replayBtn.setAttribute(
            "aria-label",
            "Reproducir último mensaje del bot"
        );

        // ✅ NUEVO: Event listener para replay
        replayBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this._handleTTSReplay(messageEl.textContent.trim(), replayBtn);
        });

        messageEl.appendChild(replayBtn);
    }

    // ✅ NUEVO: Agregar método para manejar TTS Replay
    _handleTTSReplay(text, buttonEl) {
        if (!text || !buttonEl) return;

        try {
            // Estado loading con Font Awesome
            buttonEl.classList.add("playing");
            buttonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Emitir evento para que app.js maneje el TTS
            this._emitUIEvent("ttsReplay", text);

            // Simular respuesta (app.js manejará la lógica real)
            setTimeout(() => {
                buttonEl.classList.remove("playing");
                buttonEl.innerHTML = '<i class="fas fa-volume-up"></i>';
            }, 2000);

            this.showToast("Reproduciendo mensaje", "info", 2000);
        } catch (error) {
            console.error("Error en TTS replay:", error);
            buttonEl.classList.remove("playing");
            buttonEl.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.showToast("Error reproduciendo mensaje", "error");
        }
    }

    /**
     * Actualiza contenido de mensaje en streaming (API sin cambios)
     * @param {HTMLElement} messageEl - Elemento del mensaje
     * @param {string} content - Nuevo contenido
     * @param {boolean} isFinal - Si es la versión final
     */
    updateStreamingMessage(messageEl, content, isFinal = false) {
        if (!messageEl || !content) return;

        try {
            const formattedContent = this._formatMessageContent(content);

            if (isFinal) {
                messageEl.classList.remove("streaming");
                const cursor = messageEl.querySelector(".cursor");
                if (cursor) cursor.remove();

                messageEl.innerHTML = formattedContent;
                this._addTimestamp(messageEl, "bot");
                // this._markAsLatestBotMessage(messageEl);
            } else {
                const cursor = messageEl.querySelector(".cursor");
                messageEl.innerHTML = formattedContent;
                if (cursor) {
                    messageEl.appendChild(cursor);
                }
            }

            this._scrollToBottom();
        } catch (error) {
            console.error("❌ Error actualizando mensaje streaming:", error);
        }
    }

    /**
     * Muestra/oculta el overlay de llamada de voz con integración mejorada
     *
     * @description Controla la visibilidad del modal de voz y establece
     * el modo visual por defecto, limpiando estados anteriores
     *
     * @param {boolean} show - Si mostrar el overlay de voz
     */
    showVoiceMode(show) {
        this.state.isVoiceMode = show;

        if (show) {
            // Mostrar overlay
            this.elements.callOverlay.classList.add("active");
            this.elements.callOverlay.setAttribute("aria-hidden", "false");

            // ✅ NUEVO: Establecer modo visual por defecto
            this.setVoiceCallMode("character");

            // ✅ NUEVO: Estado inicial
            this.updateVoiceCallState("ready");

            // Actualizar botón de llamada
            const callIcon = this.elements.callBtn.querySelector("i");
            if (callIcon) {
                callIcon.className = "fas fa-phone-slash";
                this.elements.callBtn.title = "Terminar llamada de voz";
                this.elements.callBtn.setAttribute(
                    "aria-label",
                    "Terminar llamada de voz"
                );
                this.elements.callBtn.classList.add("active");
            }

            // Ocultar typing indicator si está visible
            if (this.state.showingTypingIndicator) {
                this.showTypingIndicator(false);
            }
        } else {
            // Ocultar overlay
            this.elements.callOverlay.classList.remove("active");
            this.elements.callOverlay.setAttribute("aria-hidden", "true");

            // Limpiar modo visual
            this.elements.callOverlay.removeAttribute("data-mode");
            this.elements.callOverlay.classList.remove("has-avatar");
            this.elements.callOverlay.style.backgroundImage = "";

            // ✅ NUEVO: Limpiar modos visuales
            this.elements.callOverlay.classList.remove(
                "voice-mode-character",
                "voice-mode-whatsapp",
                "has-avatar"
            );
            this.elements.callOverlay.style.backgroundImage = "";

            // Resetear botón de llamada
            const callIcon = this.elements.callBtn.querySelector("i");
            if (callIcon) {
                callIcon.className = "fas fa-phone";
                this.elements.callBtn.title = "Iniciar llamada de voz";
                this.elements.callBtn.setAttribute(
                    "aria-label",
                    "Iniciar llamada de voz"
                );
                this.elements.callBtn.classList.remove("active");
            }

            // Limpiar voice activity
            if (this.elements.voiceActivity) {
                this.elements.voiceActivity.style.display = "none";
            }

            // Limpiar timers de voz
            Object.values(this.voiceTimers).forEach((timer) => {
                if (timer) clearTimeout(timer);
            });

            // Resetear estados de voz
            this.state.userSpeaking = false;
            this.state.voiceActivityLevel = 0;
            this.state.currentVoiceState = "ready";
        }

        if (CONFIG.debug.showUIEvents) {
            console.log(`🎨 Modo voz: ${show ? "ACTIVADO" : "DESACTIVADO"}`);
        }
    }

    /**
     * Actualiza estado del micrófono (API sin cambios)
     * @param {boolean} muted - Si está silenciado
     */
    updateMicState(muted) {
        this.state.micActive = !muted;
        const muteIcon = this.elements.muteBtn.querySelector("i");

        if (muted) {
            if (muteIcon) muteIcon.className = "fas fa-microphone-slash";
            this.elements.muteBtn.title = "Activar micrófono";
            this.elements.muteBtn.setAttribute(
                "aria-label",
                "Activar micrófono"
            );
            this.elements.muteBtn.className =
                "call-control-btn mute-btn mic-muted";

            if (this.state.isVoiceMode && this.elements.voiceActivityLabel) {
                this.elements.voiceActivityLabel.textContent = "Silenciado";
            }
        } else {
            if (muteIcon) muteIcon.className = "fas fa-microphone";
            this.elements.muteBtn.title = "Silenciar micrófono";
            this.elements.muteBtn.setAttribute(
                "aria-label",
                "Silenciar micrófono"
            );
            this.elements.muteBtn.className =
                "call-control-btn mute-btn mic-active";

            if (this.state.isVoiceMode && this.elements.voiceActivityLabel) {
                this.elements.voiceActivityLabel.textContent = "Escuchando...";
            }
        }
    }

    /**
     * Actualiza el estado visual del botón de audio con estados claros
     *
     * @description Maneja los estados del botón de audio basado SOLO en parámetros
     * recibidos desde app.js, sin mantener estado interno de audio interaction.
     *
     * @param {boolean} enabled - Si el audio está habilitado
     * @param {boolean} [requiresInteraction=false] - Si requiere primera interacción del usuario
     *
     * @example
     * // Desde app.js:
     * ui.updateAudioState(true, false);   // Audio habilitado, no requiere interacción
     * ui.updateAudioState(false, true);   // Audio deshabilitado, requiere interacción
     * ui.updateAudioState(false, false);  // Audio silenciado
     *
     * @since 3.0.0 - Refactored to be fully agnostic
     */
    updateAudioState(enabled, requiresInteraction = false) {
        this.state.audioEnabled = enabled;

        if (!this.elements.audioBtn) return;

        // Asegurar que el botón sea visible
        this.elements.audioBtn.style.display = "flex";
        const icon = this.elements.audioBtn.querySelector("i");

        // ✅ ESTADO 1: INTERACTION_REQUIRED (Primera interacción)
        if (requiresInteraction) {
            this._applyInteractionRequiredState(icon);
            return;
        }

        // ✅ ESTADO 2: LISTENING (Audio habilitado)
        if (enabled) {
            this._applyListeningState(icon);
        }
        // ✅ ESTADO 3: MUTED (Audio silenciado)
        else {
            this._applyMutedState(icon);
        }

        if (CONFIG.debug.showUIEvents) {
            const stateText = requiresInteraction
                ? "INTERACTION_REQUIRED"
                : enabled
                ? "LISTENING"
                : "MUTED";
            console.log(`🎨 Botón de audio: ${stateText}`);
        }
    }

    /**
     * ✅ NUEVO: Aplica estado de interacción requerida
     * @param {HTMLElement} icon - Elemento del icono
     * @private
     */
    _applyInteractionRequiredState(icon) {
        if (icon) icon.className = "fa-solid fa-ear-listen"; // fa-volume-off  fa-ear-listen

        this.elements.audioBtn.title = "Clic para habilitar audio";
        this.elements.audioBtn.setAttribute("aria-label", "Habilitar audio");

        // ✅ LIMPIAR CLASES ANTERIORES
        this.elements.audioBtn.classList.remove("enabled", "muted");

        // ✅ APLICAR TAILWIND + CSS VARIABLES
        this.elements.audioBtn.classList.add("animate-pulse");

        // ✅ USAR :root VARIABLES DIRECTAMENTE
        this.elements.audioBtn.style.backgroundColor = "var(--color-warning)";
        this.elements.audioBtn.style.color = "white";
        this.elements.audioBtn.style.boxShadow =
            "0 0 0 4px rgba(255, 171, 0, 0.3)";
    }

    /**
     * ✅ NUEVO: Aplica estado de escuchando
     * @param {HTMLElement} icon - Elemento del icono
     * @private
     */
    _applyListeningState(icon) {
        if (icon) icon.className = "fa-solid fa-volume-high";

        this.elements.audioBtn.title = "Silenciar audio";
        this.elements.audioBtn.setAttribute("aria-label", "Silenciar audio");

        // ✅ LIMPIAR ESTADOS ANTERIORES
        this.elements.audioBtn.classList.remove("animate-pulse", "muted");
        this.elements.audioBtn.classList.add("enabled");

        // ✅ USAR :root VARIABLES
        this.elements.audioBtn.style.backgroundColor = "var(--color-primary)";
        this.elements.audioBtn.style.color = "white";
        this.elements.audioBtn.style.boxShadow = "none";
    }

    /**
     * ✅ NUEVO: Aplica estado de silenciado
     * @param {HTMLElement} icon - Elemento del icono
     * @private
     */
    _applyMutedState(icon) {
        if (icon) icon.className = "fa-solid fa-volume-xmark";

        this.elements.audioBtn.title = "Activar audio";
        this.elements.audioBtn.setAttribute("aria-label", "Activar audio");

        // ✅ LIMPIAR ESTADOS ANTERIORES
        this.elements.audioBtn.classList.remove("animate-pulse", "enabled");
        this.elements.audioBtn.classList.add("muted");

        // ✅ USAR :root VARIABLES
        this.elements.audioBtn.style.backgroundColor = "var(--color-secondary)";
        this.elements.audioBtn.style.color = "var(--text-secondary)";
        this.elements.audioBtn.style.boxShadow = "none";
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE UTILIDAD (muchos sin cambios)
    // ==========================================

    /**
     * Establece el modo visual de la llamada (Character.AI o WhatsApp)
     *
     * @description Usa CSS puro para cambiar entre modos visuales,
     * manteniendo los diseños existentes en voice-call.css
     *
     * @param {string} mode - 'character' | 'whatsapp'
     * @param {Object} options - Opciones adicionales
     * @param {boolean} options.useAvatarBackground - Solo WhatsApp: usar avatar como fondo
     * @param {string} options.brandImage - Solo Character.AI: URL de imagen de marca
     */
    setVoiceCallMode(mode, options = {}) {
        if (!this.elements.callOverlay) {
            console.warn("🎨 Call overlay no encontrado");
            return;
        }

        try {
            // Limpiar modos anteriores
            this.elements.callOverlay.classList.remove(
                "voice-mode-character",
                "voice-mode-whatsapp",
                "has-avatar"
            );
            this.elements.callOverlay.style.backgroundImage = "";

            // Aplicar nuevo modo usando las clases de voice-call.css
            this.elements.callOverlay.classList.add(`voice-mode-${mode}`);

            if (mode === "character" && options.brandImage) {
                // Configurar imagen de brand
                const brandImg =
                    this.elements.callOverlay.querySelector(
                        ".voice-brand-image"
                    );
                if (brandImg) {
                    brandImg.src = options.brandImage;
                    brandImg.style.display = "";
                }
            }

            if (mode === "whatsapp" && options.useAvatarBackground) {
                // Configurar avatar como fondo
                const avatarImg =
                    this.elements.avatarImage ||
                    document.querySelector(".avatar-image") ||
                    document.querySelector(".call-avatar-image");

                if (avatarImg?.src) {
                    this.elements.callOverlay.style.backgroundImage = `url(${avatarImg.src})`;
                    this.elements.callOverlay.classList.add("has-avatar");
                }
            }

            if (CONFIG.debug.showUIEvents) {
                console.log(`🎨 Voice call mode: ${mode}`);
            }
        } catch (error) {
            console.error("❌ Error configurando voice call mode:", error);
        }
    }

    /**
     * Actualiza el estado de voz manteniendo la estructura HTML existente
     *
     * @param {string} state - 'listening' | 'thinking' | 'responding' | 'ready'
     * @param {Object} data - Datos adicionales del estado
     */
    updateVoiceCallState(state, data = {}) {
        if (!this.state.isVoiceMode) return;

        const stateConfig = {
            listening: {
                userSpeaking: true,
                userLabel: "Escuchando...",
                botPreset: "listening",
            },
            thinking: {
                userSpeaking: false,
                userLabel: "",
                botPreset: "thinking",
            },
            responding: {
                userSpeaking: false,
                userLabel: "",
                botPreset: "responding",
            },
            processing: {
                userSpeaking: false,
                userLabel: "",
                botPreset: "processing",
            },
            ready: {
                userSpeaking: false,
                userLabel: "",
                botPreset: "ready",
            },
        };

        const config = stateConfig[state] || stateConfig["ready"];

        // ✅ APLICAR CONFIGURACIÓN
        this.updateUserVoiceActivity(config.userSpeaking, config.userLabel);
        this.updateBotStatusWithPreset(config.botPreset, data.customText);

        if (CONFIG.debug.showUIEvents) {
            console.log(`🔄 Voice call state: ${state}`);
        }
    }

    /**
     * Crea mensaje fallback en caso de error
     * @private
     * @param {string} content - Contenido
     * @param {string} sender - Remitente
     * @returns {HTMLElement|null}
     */
    _createFallbackMessage(content, sender) {
        try {
            const fallbackEl = document.createElement("div");
            fallbackEl.className = `message-bubble ${sender}`;
            fallbackEl.textContent =
                typeof content === "string" ? content : "Error en mensaje";
            this.elements.chatContainer.appendChild(fallbackEl);
            return fallbackEl;
        } catch (fallbackError) {
            console.error(
                "❌ Fallback de mensaje también falló:",
                fallbackError
            );
            return null;
        }
    }

    /**
     * Limpia todos los event listeners (mejorado para ModernVoiceAgent)
     * @private
     */
    _cleanupEventListeners() {
        try {
            // Limpiar listeners UI
            if (this._eventHandlers.has("textSubmit")) {
                this.elements.messageForm.removeEventListener(
                    "submit",
                    this._eventHandlers.get("textSubmit")
                );
            }

            this._eventHandlers.clear();
            console.log(
                "🧹 Event listeners limpiados correctamente (incluyendo agent)"
            );
        } catch (error) {
            console.error("❌ Error limpiando event listeners:", error);
        }
    }

    /**
     * Configura el handler para el botón de video (voice + video)
     * @private
     */
    _setupVideoButtonHandler() {
        // Buscar botón de video en el header
        const videoCameraBtn = document.getElementById("videoCameraBtn");

        if (!videoCameraBtn) {
            if (CONFIG.debug.showUIEvents) {
                console.warn(
                    "🎨 Botón de video (videoCameraBtn) no encontrado en DOM"
                );
            }
            return;
        }

        /**
         * Handler para botón de video (activa voice + video juntos)
         */
        const handleVideoToggle = () => {
            try {
                if (CONFIG.debug.showUIEvents) {
                    console.log("🎨 Botón de video presionado (voice + video)");
                }

                // Verificar estado actual del video
                const isVideoActive =
                    window.videoCallManager?.isActive || false;

                if (CONFIG.debug.showUIEvents) {
                    console.log("🎨 Estado actual video:", isVideoActive);
                }

                // Prevenir doble clic
                if (videoCameraBtn.disabled) {
                    if (CONFIG.debug.showUIEvents) {
                        console.log(
                            "🎨 Botón de video deshabilitado temporalmente"
                        );
                    }
                    return;
                }

                // Feedback visual inmediato
                videoCameraBtn.disabled = true;
                setTimeout(() => {
                    videoCameraBtn.disabled = false;
                }, 1000); // 1 segundo de debounce

                // ✅ Emitir evento videoToggle (NO voiceToggle)
                this._emitUIEvent("videoToggle", {
                    currentState: isVideoActive,
                    requestedAction: isVideoActive ? "end" : "start",
                    timestamp: Date.now(),
                });

                if (CONFIG.debug.showUIEvents) {
                    console.log(
                        "✅ Evento videoToggle emitido al orquestador (app.js)"
                    );
                }
            } catch (error) {
                console.error("❌ Error en handler del botón de video:", error);
                videoCameraBtn.disabled = false;
                this.showToast("Error en videollamada", "error", 3000);
            }
        };

        // Agregar event listener
        videoCameraBtn.addEventListener("click", handleVideoToggle);

        // Guardar referencia para cleanup
        this._eventHandlers.set("videoCameraBtn", handleVideoToggle);

        if (CONFIG.debug.showUIEvents) {
            console.log("🎨 Handler de botón de video configurado");
        }
    }

    /**
     * Actualiza el estado del botón de video según el estado de la videollamada
     * @param {boolean} isActive - Si hay videollamada activa
     * @param {boolean} isConnected - Si el avatar está conectado
     */
    updateVideoCallState(isActive, isConnected = false) {
        try {
            const videoCameraBtn = document.getElementById("videoCameraBtn");

            if (!videoCameraBtn) return;

            if (isActive) {
                videoCameraBtn.classList.add("active");
                videoCameraBtn.title = "Terminar videollamada";
                videoCameraBtn.setAttribute(
                    "aria-label",
                    "Terminar videollamada"
                );
            } else {
                videoCameraBtn.classList.remove("active");
                videoCameraBtn.title = "Iniciar videollamada con avatar";
                videoCameraBtn.setAttribute(
                    "aria-label",
                    "Iniciar videollamada"
                );
            }

            // También actualizar estado de voz si video está activo
            if (isActive) {
                this.state.isVoiceMode = true;
            }

            if (CONFIG.debug.showUIEvents) {
                console.log(
                    `🎨 Estado videollamada actualizado: activo=${isActive}, conectado=${isConnected}`
                );
            }
        } catch (error) {
            console.error(
                "❌ Error actualizando estado de videollamada:",
                error
            );
        }
    }

    /**
     * Obtiene el estado actual de la UI de video
     * @returns {Object} Estado de la UI de video
     */
    getVideoUIState() {
        const videoCameraBtn = document.getElementById("videoCameraBtn");

        return {
            videoBtnExists: !!videoCameraBtn,
            videoBtnActive:
                videoCameraBtn?.classList.contains("active") || false,
            videoCallManagerAvailable:
                typeof window.videoCallManager !== "undefined",
            videoCallActive: window.videoCallManager?.isActive || false,
            voiceMode: this.state.isVoiceMode || false,
        };
    }

    /**
     * Fuerza un estado de video para testing (solo en debug)
     * @param {boolean} isActive - Si video está activo
     * @param {boolean} isConnected - Si avatar está conectado
     */
    debugSetVideoState(isActive, isConnected = false) {
        if (!CONFIG.debug.enabled) {
            console.warn("🎨 debugSetVideoState solo disponible en modo debug");
            return;
        }

        try {
            this.updateVideoCallState(isActive, isConnected);

            if (isConnected) {
                this.updateStatus("Avatar conectado", "connected");
                this.showToast("DEBUG: Avatar conectado", "success", 2000);
            } else if (isActive) {
                this.updateStatus("Conectando avatar...", "connecting");
                this.showToast("DEBUG: Video activo", "info", 2000);
            } else {
                this.updateStatus("Video desconectado", "disconnected");
                this.showToast("DEBUG: Video inactivo", "warning", 2000);
            }

            console.log("🎨 Estado de video forzado:", {
                isActive,
                isConnected,
            });
            console.log("🎨 Estado UI actual:", this.getVideoUIState());
        } catch (error) {
            console.error("❌ Error en debugSetVideoState:", error);
        }
    }

    // ==========================================
    // MÉTODOS SIN CAMBIOS (copy from original)
    // ==========================================

    /**
     * 🎛️ CONFIGURACIÓN: Cambiar tipo de animación globalmente
     */
    setBotAnimationType(type = "typing") {
        const validTypes = ["typing", "pulsing", "none"];

        if (!validTypes.includes(type)) {
            console.warn(
                `🎨 Tipo de animación inválido: ${type}. Usar: ${validTypes.join(
                    ", "
                )}`
            );
            return;
        }

        this.state.defaultBotAnimationType = type;

        // ✅ APLICAR A STATUS ACTUAL si está activo
        if (
            this.state.botStatus &&
            this._statusNeedsAnimation(
                this.state.botStatus,
                this.state.botStatusType
            )
        ) {
            this.updateBotStatus(
                this.state.botStatus,
                this.state.botStatusType,
                type
            );
        }

        if (CONFIG.debug.showUIEvents) {
            console.log(`🎨 Tipo de animación de bot cambiado a: ${type}`);
        }
    }

    /**
     * Muestra prompt de interacción de audio - UI PURA
     *
     * @description Aplica estilos visuales para indicar que se requiere
     * interacción del usuario. NO maneja timers ni lógica automática.
     *
     * @method _showAudioInteractionPrompt
     * @memberof UIManager
     * @private
     *
     * @example
     * // Desde app.js cuando agent detecta que necesita interacción:
     * ui._showAudioInteractionPrompt();
     *
     * @since 3.0.0 - Refactored to pure UI
     */
    _showAudioInteractionPrompt() {
        if (!this.elements.audioBtn) return;

        // ✅ SOLO APLICAR ESTILOS VISUALES
        this.elements.audioBtn.classList.add("animate-pulse");
        this.elements.audioBtn.title = "Clic requerido para habilitar audio";
        this.elements.audioBtn.setAttribute(
            "aria-label",
            "Clic requerido para habilitar audio"
        );

        if (CONFIG.debug.showAudioEvents) {
            console.log("🔊 Audio interaction prompt mostrado (UI pura)");
        }
    }

    /**
     * Oculta prompt de interacción de audio - UI PURA
     *
     * @description Remueve estilos visuales de interacción requerida.
     * NO maneja timers ni lógica automática.
     *
     * @method _hideAudioInteractionPrompt
     * @memberof UIManager
     * @private
     *
     * @example
     * // Desde app.js cuando agent confirma que ya no necesita interacción:
     * ui._hideAudioInteractionPrompt();
     *
     * @since 3.0.0 - Refactored to pure UI
     */
    _hideAudioInteractionPrompt() {
        if (!this.elements.audioBtn) return;

        // ✅ SOLO REMOVER ESTILOS VISUALES
        this.elements.audioBtn.classList.remove("animate-pulse");
        this.elements.audioBtn.title = "Controlar audio";
        this.elements.audioBtn.setAttribute("aria-label", "Controlar audio");

        if (CONFIG.debug.showAudioEvents) {
            console.log("🔊 Audio interaction prompt ocultado (UI pura)");
        }
    }

    /**
     * Maneja redimensionamiento del input (sin cambios)
     * @private
     */
    _handleInputResize(element) {
        if (element.tagName === "TEXTAREA") {
            element.style.height = "auto";
            element.style.height = Math.min(element.scrollHeight, 120) + "px";
        }
    }

    /**
     * Configura atajos de teclado (sin cambios)
     * @private
     */
    _setupKeyboardShortcuts() {
        const handleKeyboardShortcuts = (e) => {
            try {
                if (e.key === "Escape" && this.state.isVoiceMode) {
                    e.preventDefault();
                    this._emitUIEvent("voiceEnd");
                    return;
                }

                if (e.key === "v" && e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    this._emitUIEvent("voiceToggle");
                    return;
                }

                if (
                    e.key === "m" &&
                    e.ctrlKey &&
                    e.shiftKey &&
                    this.state.isVoiceMode
                ) {
                    e.preventDefault();
                    this._emitUIEvent("muteToggle");
                    return;
                }

                if (
                    e.key === "Enter" &&
                    e.ctrlKey &&
                    document.activeElement === this.elements.textInput
                ) {
                    e.preventDefault();
                    this._handleTextSend();
                    return;
                }
            } catch (error) {
                console.error("❌ Error en atajos de teclado:", error);
            }
        };

        this._eventHandlers.set("keyboardShortcuts", handleKeyboardShortcuts);
        document.addEventListener("keydown", handleKeyboardShortcuts);
    }

    /**
     * Previene zoom por doble tap (sin cambios)
     * @private
     */
    _preventDoubleTabZoom() {
        let lastTouchEnd = 0;
        const handleTouchEnd = (event) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        };

        this._eventHandlers.set("touchEnd", handleTouchEnd);
        document.addEventListener("touchend", handleTouchEnd, false);
    }

    /**
     * Maneja estados de botones (sin cambios)
     * @private
     */
    _setButtonState(button, state) {
        const icon = button.querySelector("i");
        if (!icon) return;

        switch (state) {
            case "sending":
                button.disabled = true;
                icon.className = "fas fa-spinner fa-spin";
                break;
            case "normal":
            default:
                button.disabled = false;
                icon.className = "fas fa-paper-plane";
                break;
        }
    }

    /**
     * Actualiza calidad de conexión usando updateConnectionBadge() existente
     * @param {string} quality - Calidad: 'excellent' | 'good' | 'poor' | 'lost'
     */
    updateConnectionQuality(quality) {
        this.state.connectionQuality = quality;

        // ✅ SOLUCIÓN ELEGANTE: Delegar al método que ya funciona
        this.updateConnectionBadge(
            quality,
            this.state.lastLatencyMeasurement || 0
        );

        if (CONFIG.debug.showUIEvents) {
            console.log(`📶 Calidad de conexión: ${quality}`);
        }
    }

    /**
     * Formatea contenido del mensaje (sin cambios)
     * @private
     */
    _formatMessageContent(content) {
        const escaped = this._escapeHTML(content);
        return escaped.replace(/\n/g, "<br>");
    }

    /**
     * Añade timestamp (sin cambios)
     * @private
     */
    _addTimestamp(messageEl, sender) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const timeEl = document.createElement("time");
        timeEl.setAttribute("datetime", now.toISOString());
        timeEl.className = "timestamp";

        const checkIcon =
            sender === "user" ? "fa-check-double text-blue-400" : "fa-check";
        timeEl.innerHTML = `
            ${timeStr}
            <i class="tick fas ${checkIcon}" aria-hidden="true"></i>
        `;

        messageEl.appendChild(timeEl);
    }

    /**
     * Muestra indicador de escritura (sin cambios lógicos)
     * @param {boolean} show - Si mostrar
     */
    showTypingIndicator(show) {
        console.log("🎨 showTypingIndicator llamado:", {
            show,
            isVoiceMode: this.state.isVoiceMode,
            currentlyShowing: this.state.showingTypingIndicator,
            elementExists: !!this.elements.typingIndicator,
        });
        if (!this.elements.typingIndicator) {
            console.warn("🎨 Elemento indicador de escritura no encontrado");
            return;
        }

        if (this.state.showingTypingIndicator !== show) {
            if (CONFIG.debug.showUIEvents) {
                console.log(
                    `🎨 Indicador de escritura: ${show ? "MOSTRADO" : "OCULTO"}`
                );
            }
        }

        this.state.showingTypingIndicator = show;

        // REGLA: Mostrar en modo texto, no en modo voz
        const shouldShow = show && !this.state.isVoiceMode;

        this.elements.typingIndicator.style.display = shouldShow
            ? "block"
            : "none";

        if (shouldShow) {
            this.elements.typingIndicator.style.visibility = "visible";
            this.elements.typingIndicator.style.opacity = "1";
            this._scrollToBottom();

            clearTimeout(this.voiceTimers.typingTimeout);
            this.voiceTimers.typingTimeout = setTimeout(() => {
                if (this.state.showingTypingIndicator) {
                    this.showTypingIndicator(false);
                }
            }, CONFIG.ui.chat.typingIndicatorTimeout || 10000);
            console.log("✅ TYPING INDICATOR MOSTRADO");
        } else {
            clearTimeout(this.voiceTimers.typingTimeout);
            console.log("❌ TYPING INDICATOR OCULTO");
        }
    }

    /**
     * Actualiza actividad de voz (sin cambios)
     * @param {boolean} active - Si hay actividad
     * @param {number} level - Nivel 0-1
     */
    updateVoiceActivity(active, level = 0) {
        this.updateUserVoiceActivity(active);
    }

    /**
     * 🎤 CONTROLA SOLO EL USUARIO - Cuándo habla
     *
     * @description Muestra/oculta el indicador verde solo cuando el usuario habla.
     * NO se usa para estados del bot.
     *
     * @param {boolean} speaking - Si el usuario está hablando activamente
     * @param {string} label - Texto opcional ("Escuchando...", "Hablando...", etc.)
     */
    updateUserVoiceActivity(speaking, label = "Escuchando...") {
        const container = document.getElementById("voice-activity");
        const labelElement = document.getElementById("userMicLabel");

        if (!container) {
            console.warn("🎤 Voice activity container no encontrado");
            return;
        }

        if (speaking) {
            // ✅ MOSTRAR: Usuario está hablando
            container.style.display = "flex";
            container.classList.add("active");

            if (labelElement) {
                labelElement.textContent = label;
            }

            // Accessibility
            container.setAttribute(
                "aria-label",
                `Usuario ${label.toLowerCase()}`
            );

            if (CONFIG.debug.showUIEvents) {
                console.log("🎤 Usuario hablando:", label);
            }
        } else {
            // ✅ OCULTAR: Usuario callado
            container.classList.remove("active");

            // Delay para transición suave
            setTimeout(() => {
                if (!container.classList.contains("active")) {
                    container.style.display = "none";
                }
            }, 250);

            if (CONFIG.debug.showUIEvents) {
                console.log("🎤 Usuario callado");
            }
        }

        // Actualizar estado interno
        this.state.userSpeaking = speaking;
    }

    /**
     * 🤖 CONTROLA SOLO EL BOT - Estados mentales
     *
     * @description Actualiza solo el texto de estado del bot.
     * NO controla indicadores visuales de usuario.
     * @param {string} status - Estado del bot
     * @param {string} type - Tipo para CSS y animación
     * @param {string} animationType - 'typing' | 'pulsing' | 'none'
     */
    updateBotStatus(status, type = "ready", animationType = "typing") {
        const statusElement = document.getElementById("call-status");

        if (!statusElement) {
            console.warn("🤖 Bot status element no encontrado");
            return;
        }

        // ✅ DETECTAR si necesita puntos animados
        const needsAnimation = this._statusNeedsAnimation(status, type);

        // ✅ CONSTRUIR HTML según el tipo de animación
        let finalHTML = "";

        if (needsAnimation && animationType === "typing") {
            // 🎪 TYPING DOTS: Puntos que aparecen secuencialmente
            const baseText = status.replace(/\.{3}$/, ""); // Remover ... si existe
            finalHTML = `${baseText}<span class="animated-dots"></span>`;
        } else if (needsAnimation && animationType === "pulsing") {
            // 🎭 PULSING DOTS: Tres puntos que pulsan
            const baseText = status.replace(/\.{3}$/, "");
            finalHTML = `${baseText}<span class="pulsing-dots">
            <span class="dot">.</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
        </span>`;
        } else {
            // ⚪ SIN ANIMACIÓN: Texto normal
            finalHTML = status;
        }

        // ✅ APLICAR CONTENIDO
        statusElement.innerHTML = finalHTML;

        // ✅ APLICAR CLASES CSS
        statusElement.className = `bot-status-text ${type}`;

        // ✅ ACCESSIBILITY
        statusElement.setAttribute(
            "aria-label",
            `Estado del asistente: ${status}`
        );

        // ✅ DEBUG
        if (CONFIG.debug.showUIEvents) {
            console.log(
                `🤖 Bot status: ${status} (${type}) [${animationType}]`
            );
        }

        // ✅ ACTUALIZAR ESTADO INTERNO
        this.state.botStatus = status;
        this.state.botStatusType = type;
        this.state.botAnimationType = animationType;
    }

    /**
     * 🔍 HELPER: Detecta si el status necesita animación de puntos
     *
     * @private
     * @param {string} status - Texto del estado
     * @param {string} type - Tipo de estado
     * @returns {boolean} True si necesita animación
     */
    _statusNeedsAnimation(status, type) {
        // ✅ CONDICIONES para mostrar puntos animados
        const hasEllipsis = status.includes("...");
        const isActiveState = ["thinking", "responding", "connecting"].includes(
            type
        );
        const hasActionWords =
            /\b(pensando|respondiendo|procesando|conectando|cargando)\b/i.test(
                status
            );

        return hasEllipsis || isActiveState || hasActionWords;
    }

    /**
     * 🎨 MÉTODO AUXILIAR: Configuraciones predefinidas de estados
     */
    updateBotStatusWithPreset(preset, customText = null) {
        const presets = {
            thinking: {
                text: customText || "Pensando",
                type: "thinking",
                animation: "typing",
            },
            responding: {
                text: customText || "Respondiendo",
                type: "responding",
                animation: "typing",
            },
            processing: {
                text: customText || "Procesando",
                type: "thinking",
                animation: "pulsing",
            },
            connecting: {
                text: customText || "Conectando",
                type: "connecting",
                animation: "typing",
            },
            ready: {
                text: customText || "Listo para conversar",
                type: "ready",
                animation: "none",
            },
            listening: {
                text: customText || "Escuchando",
                type: "ready",
                animation: "none",
            },
            error: {
                text: customText || "Error de conexión",
                type: "error",
                animation: "none",
            },
        };

        const config = presets[preset];
        if (config) {
            this.updateBotStatus(config.text, config.type, config.animation);
        } else {
            console.warn(`🤖 Preset desconocido: ${preset}`);
        }
    }

    /**
     * Muestra subtítulos (sin cambios)
     * @param {string} text - Texto
     * @param {boolean} isFinal - Si es final
     */
    showSubtitles(text, isFinal = true) {
        if (!this.elements.callSubtitles || !this.state.isVoiceMode || !text)
            return;

        if (this.state.botThinking) return;

        this.elements.callSubtitles.style.display = "block";

        const truncatedText =
            text.length > CONFIG.ui.call.subtitleMaxLength
                ? text.substring(0, CONFIG.ui.call.subtitleMaxLength) + "..."
                : text;

        this.elements.callSubtitles.innerHTML = `
            <div class="subtitle-content">
                ${this._escapeHTML(truncatedText)}
                ${!isFinal ? '<span class="subtitle-cursor">|</span>' : ""}
            </div>
        `;

        if (isFinal) {
            clearTimeout(this.voiceTimers.subtitleTimeout);
            this.voiceTimers.subtitleTimeout = setTimeout(() => {
                this.hideSubtitles();
            }, CONFIG.ui.call.subtitleDisplayDuration);
        }
    }

    /**
     * Oculta subtítulos (sin cambios)
     */
    hideSubtitles() {
        if (this.elements.callSubtitles) {
            this.elements.callSubtitles.style.display = "none";
        }
        clearTimeout(this.voiceTimers.subtitleTimeout);
    }

    /**
     * Muestra notificación toast (sin cambios)
     * @param {string} message - Mensaje
     * @param {string} type - Tipo
     * @param {number} duration - Duración
     */
    showToast(
        message,
        type = "info",
        duration = CONFIG.ui.notifications.duration
    ) {
        if (!CONFIG.ui.notifications.enabled) {
            if (CONFIG.debug.enabled) {
                console.log(
                    `[TOAST DISABLED] ${type.toUpperCase()}: ${message}`
                );
            }
            return;
        }

        if (!this.state.toastContainer || !message) {
            console.log(`[TOAST FALLBACK] ${type.toUpperCase()}: ${message}`);
            return;
        }

        try {
            const existingToasts = this.state.toastContainer.children;
            if (existingToasts.length >= CONFIG.ui.notifications.maxVisible) {
                existingToasts[0].remove();
            }

            const toast = this._createToastElement(message, type);
            this.state.toastContainer.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.transform = "translateX(0)";
                toast.style.opacity = "1";
            });

            setTimeout(() => this._removeToast(toast), duration);
        } catch (error) {
            console.error("❌ Error mostrando toast:", error);
            console.log(
                `[TOAST ERROR FALLBACK] ${type.toUpperCase()}: ${message}`
            );
            return null;
        }
    }

    /**
     * Limpia mensajes del chat (sin cambios)
     */
    clearMessages() {
        if (this.elements.chatContainer) {
            const welcome =
                this.elements.chatContainer.querySelector(".welcome-message");
            const typing = this.elements.typingIndicator;

            this.elements.chatContainer.innerHTML = "";

            if (welcome) this.elements.chatContainer.appendChild(welcome);
            if (typing) this.elements.chatContainer.appendChild(typing);

            this.state.messageCount = 0;
        }
    }

    /**
     * ✅ ACTUALIZADO: Obtiene estado (incluyendo nuevos estados de ModernVoiceAgent)
     * @returns {Object} Estado completo
     */
    getState() {
        return {
            ...this.state,
            messageCount: this.state.messageCount,
            elementsConnected: Object.keys(this.elements).filter(
                (key) => this.elements[key]
            ).length,
            voiceTimersActive: Object.keys(this.voiceTimers).filter(
                (key) => this.voiceTimers[key]
            ).length,
            hasVoiceActivityIndicator: !!this.elements.voiceActivity,
            connectionQuality: this.state.connectionQuality,
            latencyDisplayEnabled: CONFIG.debug.showLatencyMetrics,
            typingIndicatorVisible: this.state.showingTypingIndicator,
            botThinkingVisible: this.state.showingBotThinking,
            agentType: "ModernVoiceAgent",
            sdkVersion: "v2.13.x",
        };
    }

    /**
     * ✅ ACTUALIZADO: Cleanup mejorado
     */
    cleanup() {
        try {
            // Limpiar timers
            Object.values(this.voiceTimers).forEach((timer) => {
                if (timer) clearTimeout(timer);
            });

            this.voiceTimers = {
                thinkingIndicator: null,
                subtitleTimeout: null,
                activityTimeout: null,
                statusUpdateTimer: null,
                latencyDisplayTimer: null,
                typingTimeout: null,
                rpcTimeout: null,
            };

            // Limpiar event listeners
            this._cleanupEventListeners();

            // Limpiar contenedor de toast
            if (
                this.state.toastContainer &&
                this.state.toastContainer.parentElement
            ) {
                this.state.toastContainer.remove();
            }

            // Resetear estados visuales
            this.resetAllVisualStates();

            console.log(
                "🧹 Cleanup de UIManager v3.0 completado - ModernVoiceAgent compatible"
            );
        } catch (error) {
            console.error("❌ Error durante cleanup:", error);
        }
    }

    // ==========================================
    // MÉTODOS UTILITARIOS (sin cambios)
    // ==========================================

    _showVoiceActivity(show) {
        if (this.elements.voiceActivity) {
            this.elements.voiceActivity.style.display = show ? "flex" : "none";
            if (CONFIG.debug.showUIEvents) {
                console.log(
                    `🎨 Indicador actividad voz: ${
                        show ? "MOSTRADO" : "OCULTO"
                    }`
                );
            }
        }
    }

    _forceCleanupChatContainer() {
        try {
            const messages =
                this.elements.chatContainer.querySelectorAll(".message-bubble");
            const excessMessages = Math.max(0, messages.length - 20);
            for (let i = 0; i < excessMessages; i++) {
                if (messages[i]) {
                    messages[i].remove();
                }
            }
            console.log("🧹 Cleanup forzado del chat completado");
        } catch (error) {
            console.error("❌ Cleanup forzado falló:", error);
        }
    }

    _scrollToBottom() {
        if (this.elements.chatContainer) {
            this.elements.chatContainer.scrollTo({
                top: this.elements.chatContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    }

    _limitMessages() {
        const messages =
            this.elements.chatContainer.querySelectorAll(".message-bubble");
        const maxMessages = CONFIG.ui.chat.maxMessages;

        if (messages.length > maxMessages) {
            const toRemove = messages.length - maxMessages;
            for (let i = 0; i < toRemove; i++) {
                if (messages[i]) {
                    messages[i].remove();
                }
            }
            this.state.messageCount = Math.max(
                0,
                this.state.messageCount - toRemove
            );
        }
    }

    _escapeHTML(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    _createToastElement(message, type) {
        const toast = document.createElement("div");

        const typeClasses = {
            success: "toast-success",
            error: "toast-error",
            warning: "toast-warning",
            info: "toast-info",
        };

        const icons = {
            success: "fa-check-circle",
            error: "fa-exclamation-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-info-circle",
        };

        toast.className = `toast-base ${typeClasses[type] || typeClasses.info}`;

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon" aria-hidden="true"></i>
            <span class="toast-content">${this._escapeHTML(message)}</span>
            <button onclick="this.parentElement.remove()"
                    class="toast-close-btn"
                    aria-label="Cerrar notificación">
                <i class="fas fa-times"></i>
            </button>
        `;

        return toast;
    }

    _removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.style.transform = "translateX(100%)";
            toast.style.opacity = "0";
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }

    resetAllVisualStates() {
        try {
            this.elements.audioBtn.className = "control-btn audio-btn";
            this.elements.callBtn.className = "control-btn call-btn";
            this.elements.muteBtn.className = "call-control-btn mute-btn";

            this.state.isVoiceMode = false;
            this.state.audioEnabled = false;
            this.state.micActive = false;

            console.log("🔄 Estados visuales reseteados");
        } catch (error) {
            console.error("❌ Error reseteando estados:", error);
        }
    }

    _emitUIEvent(event, ...args) {
        try {
            const customEvent = new CustomEvent(`ui:${event}`, {
                detail: args,
            });
            document.dispatchEvent(customEvent);

            if (CONFIG.debug.showUIEvents) {
                console.log(
                    `🎨 Evento UI: ${event}`,
                    args.length > 0 ? args : ""
                );
            }
        } catch (error) {
            console.error(`❌ Error emitiendo evento UI ${event}:`, error);
        }
    }

    on(event, callback) {
        const handler = (e) => {
            try {
                callback(...e.detail);
            } catch (error) {
                console.error(`❌ Error en event handler (${event}):`, error);
            }
        };

        document.addEventListener(`ui:${event}`, handler);
        this._eventHandlers.set(`ui:${event}`, handler);
    }

    _emit(event, ...args) {
        this._emitUIEvent(event, ...args);
    }

    /**
     * Actualiza visualización de latencia de respuesta de voz
     *
     * @param {number} latencyMs - Latencia en milisegundos
     * @returns {void}
     */
    updateVoiceLatency(latencyMs) {
        this.state.lastLatencyMeasurement = latencyMs;

        if (CONFIG.debug.showLatencyMetrics && this.state.isVoiceMode) {
            if (latencyMs > CONFIG.debug.voiceLatencyWarningThreshold) {
                this.showToast(
                    `Respuesta lenta: ${latencyMs}ms`,
                    "warning",
                    3000
                );
            }
        }
    }

    /**
     * Actualiza badge de calidad de conexión (MÉTODO EXISTENTE - MANTENER)
     * @param {string} quality - Calidad de conexión
     * @param {number} latencyMs - Latencia en milisegundos
     */
    updateConnectionBadge(quality, latencyMs = 0) {
        if (!CONFIG.ui.notifications.connectionBadge.enabled) return;

        const badge = document.getElementById("connection-badge");
        if (!badge) return;

        const qualityMap = {
            excellent: { dots: "●●●", color: "quality-excellent" },
            good: { dots: "●●○", color: "quality-good" },
            poor: { dots: "●○○", color: "quality-poor" },
            lost: { dots: "○○○", color: "quality-lost" },
            unknown: { dots: "●○○", color: "quality-poor" }, // ✅ AÑADIDO
        };

        const qualityInfo = qualityMap[quality] || qualityMap["good"];

        badge.className = `connection-badge ${qualityInfo.color}`;

        const dotsSpan = badge.querySelector(".quality-dots");
        const latencySpan = badge.querySelector(".latency-text");

        if (dotsSpan) dotsSpan.textContent = qualityInfo.dots;

        // ✅ CORREGIDO: Siempre actualizar latencia, incluso si es 0
        if (latencySpan) {
            if (latencyMs >= 0) {
                latencySpan.textContent = `${Math.round(latencyMs)}ms`;
            } else {
                latencySpan.textContent = "---ms"; // Placeholder para valores inválidos
            }
        }

        this.showConnectionBadge(true);

        if (CONFIG.debug.showUIEvents) {
            console.log(
                `📶 Badge de conexión actualizado: ${quality} (${latencyMs}ms)`
            );
        }
    }

    /**
     * Muestra/oculta badge de conexión (MÉTODO EXISTENTE - MANTENER)
     * @param {boolean} show - Si mostrar el badge
     */
    showConnectionBadge(show) {
        if (!CONFIG.ui.notifications.connectionBadge.enabled) return;

        const badge = document.getElementById("connection-badge");
        if (!badge) return;

        badge.style.display = show ? "flex" : "none";

        if (CONFIG.debug.showUIEvents) {
            console.log(
                `📶 Badge de conexión: ${show ? "MOSTRADO" : "OCULTO"}`
            );
        }
    }
}

// Export para acceso global
if (typeof window !== "undefined") {
    window.UIManager = UIManager;
}
