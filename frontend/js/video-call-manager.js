/**
 * Video Call Manager v1.0 - Fase 1 (Video Básico) - CORREGIDO
 *
 * ARQUITECTURA COMPATIBLE CON PROYECTO EXISTENTE:
 * ✅ Usa CONFIG como fuente de verdad
 * ✅ Integración con ModernVoiceAgent
 * ✅ Event-driven architecture usando EventTarget
 * ✅ SOLID + DRY + Clean Code
 *
 * FASE 1: Video básico sin avatar (preparación para Tavus/Hedra)
 *
 * @author Video Call Team
 * @version 1.0.0-basic-fixed
 * @since 2024
 * @requires CONFIG, Logger, ModernVoiceAgent
 */

/**
 * Gestor de videollamadas básico - EXTENDIDO DE EventTarget
 *
 * Maneja la lógica de UI y eventos del modal de video,
 * preparado para integración con avatars en Fase 2.
 *
 * @class VideoCallManager
 * @extends EventTarget
 */
class VideoCallManager extends EventTarget {
    /**
     * Constructor del gestor de videollamadas
     *
     * Inicializa el estado y obtiene referencias DOM usando
     * los patrones existentes del proyecto.
     */
    constructor() {
        super();
        /**
         * Estado interno del video call
         * @type {Object}
         * @private
         */
        this._state = {
            isActive: false,
            isUserVideoEnabled: false,
            isAvatarVideoEnabled: false,
            isMuted: false,
            duration: 0,
            connectionState: "disconnected",
        };

        /**
         * Referencias a elementos DOM
         * @type {Object}
         * @private
         */
        this._elements = {
            // Modal
            videoOverlay: document.getElementById("video-call-overlay"),
            // Videos
            avatarVideo: document.getElementById("avatar-video"),
            userVideo: document.getElementById("user-video"),
            avatarFallback: document.getElementById("avatar-fallback"),
            userVideoFallback: document.getElementById("user-video-fallback"),
            // Controls
            videoCameraBtn: document.getElementById("videoCameraBtn"),
            videoMuteBtn: document.getElementById("video-mute-btn"),
            videoCameraToggleBtn: document.getElementById("video-camera-btn"),
            videoHangupBtn: document.getElementById("video-hangup-btn"),
            pipCameraToggle: document.getElementById("pip-camera-toggle"),
            // Info
            videoDuration: document.getElementById("video-duration"),
            videoSubtitles: document.getElementById("video-subtitles"),
            videoVoiceActivity: document.getElementById("video-voice-activity"),
        };

        /**
         * Referencias de streams de media
         * @type {Object}
         * @private
         */
        this._streams = {
            userStream: null,
            avatarStream: null,
        };

        /**
         * Timers para duración y cleanup
         * @type {Object}
         * @private
         */
        this._timers = {
            duration: null,
            subtitleTimeout: null,
            voiceActivityTimeout: null,
        };

        /**
         * Event handlers para cleanup
         * @type {Map<string, Function>}
         * @private
         */
        this._eventHandlers = new Map();

        /**
         * Estado de avatar
         * @type {Object}
         * @private
         */
        this._avatarState = {
            isActive: false,
            isRequested: false,
            videoTrack: null,
            worker: null,
        };

        // Validar elementos críticos
        this._validateElements();

        // Configurar event listeners
        this._setupEventListeners();

        // Log de inicialización
        if (CONFIG.debug.enabled) {
            Logger.debug(
                "📹 VideoCallManager v1.0 inicializado (Fase 1 - Básico)"
            );
            Logger.debug("🎯 Preparado para integración Tavus/Hedra en Fase 2");
        }
    }

    /**
     * Valida que los elementos DOM críticos estén disponibles
     *
     * @private
     * @throws {Error} Si faltan elementos críticos
     */
    _validateElements() {
        const critical = ["videoOverlay", "videoCameraBtn"];
        const missing = critical.filter((id) => !this._elements[id]);

        if (missing.length > 0) {
            throw new Error(
                `Elementos DOM críticos faltantes para video: ${missing.join(
                    ", "
                )}`
            );
        }

        if (CONFIG.debug.enabled) {
            Logger.debug("✅ Elementos DOM de video validados correctamente");
        }
    }

    /**
     * Configura event listeners siguiendo patrones existentes
     *
     * @private
     */
    _setupEventListeners() {
        // Header video button - Iniciar videollamada
        if (this._elements.videoCameraBtn) {
            const handleVideoToggle = () => {
                if (this._state.isActive) {
                    this.endVideoCall();
                } else {
                    this.startVideoCall();
                }
            };

            this._elements.videoCameraBtn.addEventListener(
                "click",
                handleVideoToggle
            );
            this._eventHandlers.set("videoToggle", handleVideoToggle);
        }

        // Video controls
        if (this._elements.videoMuteBtn) {
            const handleMuteToggle = () => {
                this.toggleMute();
            };

            this._elements.videoMuteBtn.addEventListener(
                "click",
                handleMuteToggle
            );
            this._eventHandlers.set("muteToggle", handleMuteToggle);
        }

        if (this._elements.videoCameraToggleBtn) {
            const handleCameraToggle = () => {
                this.toggleUserCamera();
            };

            this._elements.videoCameraToggleBtn.addEventListener(
                "click",
                handleCameraToggle
            );
            this._eventHandlers.set("cameraToggle", handleCameraToggle);
        }

        if (this._elements.videoHangupBtn) {
            const handleHangup = () => {
                this.endVideoCall();
            };

            this._elements.videoHangupBtn.addEventListener(
                "click",
                handleHangup
            );
            this._eventHandlers.set("hangup", handleHangup);
        }

        // PiP controls
        if (this._elements.pipCameraToggle) {
            const handlePipToggle = () => {
                this.toggleUserCamera();
            };

            this._elements.pipCameraToggle.addEventListener(
                "click",
                handlePipToggle
            );
            this._eventHandlers.set("pipToggle", handlePipToggle);
        }

        // Click fuera del modal para cerrar
        if (this._elements.videoOverlay) {
            const handleOverlayClick = (e) => {
                if (e.target === this._elements.videoOverlay) {
                    this.endVideoCall();
                }
            };

            this._elements.videoOverlay.addEventListener(
                "click",
                handleOverlayClick
            );
            this._eventHandlers.set("overlayClick", handleOverlayClick);
        }

        // Keyboard shortcuts usando CONFIG
        if (CONFIG.features.keyboardShortcuts) {
            this._setupKeyboardShortcuts();
        }

        if (CONFIG.debug.enabled) {
            Logger.debug("📹 Event listeners de video configurados");
        }
    }

    /**
     * Configura atajos de teclado
     *
     * @private
     */
    _setupKeyboardShortcuts() {
        const handleKeydown = (e) => {
            if (!this._state.isActive) return;

            try {
                // Escape - Cerrar videollamada
                if (e.key === "Escape") {
                    e.preventDefault();
                    this.endVideoCall();
                    return;
                }

                // Ctrl+Shift+V - Toggle videollamada
                if (e.key === "v" && e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    if (this._state.isActive) {
                        this.endVideoCall();
                    } else {
                        this.startVideoCall();
                    }
                    return;
                }

                // Ctrl+Shift+M - Toggle mute
                if (e.key === "m" && e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    this.toggleMute();
                    return;
                }

                // Ctrl+Shift+C - Toggle camera
                if (e.key === "c" && e.ctrlKey && e.shiftKey) {
                    e.preventDefault();
                    this.toggleUserCamera();
                    return;
                }
            } catch (error) {
                Logger.error("❌ Error en keyboard shortcuts de video:", error);
            }
        };

        document.addEventListener("keydown", handleKeydown);
        this._eventHandlers.set("keydown", handleKeydown);
    }

    /**
     * Inicia videollamada con avatar
     *
     * CORREGIDO: NO llama directamente al agente, sino que emite eventos a app.js
     *
     * @async
     * @returns {Promise<void>}
     * @public
     */
    async startVideoCall() {
        try {
            if (this._state.isActive) {
                Logger.debug("📹 Videollamada ya está activa");
                return;
            }

            Logger.debug("📹 Iniciando videollamada con avatar...");
            this._state.isActive = true;

            // ✅ MOSTRAR: Modal de video
            if (this._elements.videoOverlay) {
                this._showVideoModal();
            }
            // 2. Iniciar timer
            this._startDurationTimer();

            // ✅ OBTENER: Stream del usuario
            await this._requestUserMedia();

            // ✅ MOSTRAR: Estado de avatar conectándose
            this._showAvatarConnecting("Avatar");

            // ✅ ACTUALIZAR: Estado UI
            this._state.connectionState = "connecting";
            this.showSubtitles("Conectando avatar...");

            // ✅ LOGGING: Sin hardcode
            if (CONFIG.debug.enabled) {
                Logger.debug("📹 Videollamada iniciada - esperando avatar");
            }
            // ✅ BUSCAR tracks existentes en lugar de activar con RPC
            const avatarFound = this._findExistingAvatarTracks();

            if (!avatarFound) {
                this.showSubtitles("Esperando avatar...");
            }

            // ✅ EMIT: Evento para app.js
            this._emit("videoCallStarted");
        } catch (error) {
            Logger.error("❌ Error iniciando videollamada:", error);
            this._showError(`Error iniciando videollamada: ${error.message}`);
            this._state.isActive = false;
        }
    }

    /**
     * Termina la videollamada
     *
     * @returns {Promise<void>}
     */
    async endVideoCall() {
        if (!this._state.isActive) {
            return;
        }

        try {
            if (CONFIG.debug.enabled) {
                Logger.debug("📹 Terminando videollamada...");
            }

            // Actualizar estado
            this._state.isActive = false;
            this._state.connectionState = "disconnecting";
            // Desactivar avatar si está activo
            if (this._avatarState.isActive) {
                // ✅ EMITIR EVENTO en lugar de llamada directa
                this._emit("avatarDeactivationRequested", {
                    reason: "video_call_ended",
                    timestamp: Date.now(),
                });

                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "🎭 Solicitud de desactivación de avatar emitida"
                    );
                }
            }

            // Limpiar avatar state
            this._avatarState = {
                isActive: false,
                isRequested: false,
                videoTrack: null,
                worker: null,
            };

            // Detach avatar video track
            if (this._avatarState.videoTrack) {
                this._avatarState.videoTrack.detach();
            }

            // Reset avatar video element
            if (this._elements.avatarVideo) {
                this._elements.avatarVideo.innerHTML = "";
                this._elements.avatarVideo.classList.remove("loaded");
            }

            // Mostrar fallback
            if (this._elements.avatarFallback) {
                this._elements.avatarFallback.style.display = "flex";
            }

            // Reset botón de video
            this._updateVideoButtonState(false);
            // Limpiar streams
            await this._cleanupStreams();

            // Limpiar timers
            this._cleanupTimers();

            // Ocultar modal
            this._hideVideoModal();

            // Actualizar UI del botón header
            this._updateHeaderButton(false);

            // Reset estado
            this._resetState();

            // Emitir evento
            this._emit("videoCallEnded");

            if (CONFIG.debug.enabled) {
                Logger.debug("✅ Videollamada terminada");
            }
        } catch (error) {
            Logger.error("❌ Error terminando videollamada:", error);
        }
    }

    /**
     * ✅ NUEVO: Maneja respuesta de activación de avatar desde app.js
     *
     * @param {string} provider - Proveedor del avatar activado
     * @param {Object} avatarInfo - Información del avatar
     * @public
     */
    handleAvatarActivationResponse(provider, avatarInfo) {
        try {
            if (avatarInfo.success) {
                // ✅ ACTUALIZAR: Estado existente
                this._avatarState.isActive = true;
                this._avatarState.isRequested = false;

                // ✅ USAR: Método existente para ocultar fallback
                this._hideAvatarFallback();

                // ✅ MOSTRAR: Subtítulos usando método existente
                this.showSubtitles(`Avatar ${provider} conectado`);

                if (CONFIG.debug.enabled) {
                    Logger.debug(`🎭 Avatar ${provider} activado exitosamente`);
                }
            } else {
                // ✅ MANEJAR: Error de activación
                this._avatarState.isRequested = false;
                this._showAvatarFallback();
                this.showSubtitles(
                    `Error conectando avatar: ${avatarInfo.error}`
                );

                Logger.error("❌ Error activando avatar:", avatarInfo.error);
            }
        } catch (error) {
            Logger.error("❌ Error manejando respuesta de avatar:", error);
            this._showError(`Error con avatar: ${error.message}`);
        }
    }

    /**
     * ✅ CORREGIDO: Maneja video track del avatar correctamente
     *
     * @param {RemoteVideoTrack} track - Track de video del avatar
     * @param {RemoteTrackPublication} publication - Publicación del track
     * @public
     */
    handleAvatarVideo(track, publication) {
        try {
            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "🎬 VideoCallManager: Renderizando video del avatar"
                );
                Logger.debug("🎬 Track recibido:", {
                    trackId: track?.sid,
                    participant: publication?.participant?.identity,
                    hasElement: !!this._elements.avatarVideo,
                    hasTrack: !!track,
                });
            }

            // ✅ VERIFICAR: Elemento existe
            if (!this._elements.avatarVideo) {
                Logger.error("❌ Elemento avatar-video no encontrado en DOM");
                return;
            }

            if (!track) {
                Logger.error("❌ Track de video no válido");
                return;
            }

            // ✅ MÉTODO CORRECTO: Usar track.attach() para crear nuevo elemento
            const newVideoElement = track.attach();

            // ✅ CONFIGURAR: Propiedades del nuevo elemento
            newVideoElement.autoplay = true;
            newVideoElement.playsInline = true;
            newVideoElement.muted = true;
            newVideoElement.id = "avatar-video";
            newVideoElement.className = "avatar-video-main loaded";
            newVideoElement.setAttribute("aria-label", "Video del avatar");

            // ✅ ESTILOS: Asegurar visibilidad
            newVideoElement.style.width = "100%";
            newVideoElement.style.height = "100%";
            newVideoElement.style.objectFit = "cover";
            newVideoElement.style.display = "block";

            // ✅ REEMPLAZAR: En el DOM
            const container = this._elements.avatarVideo.parentNode;
            if (container) {
                container.replaceChild(
                    newVideoElement,
                    this._elements.avatarVideo
                );
                // ✅ ACTUALIZAR: Referencia interna
                this._elements.avatarVideo = newVideoElement;
            } else {
                Logger.error("❌ Container del video no encontrado");
                return;
            }

            // ✅ OCULTAR: Fallback
            this._hideAvatarFallback();

            // ✅ ACTUALIZAR: Estado
            this._avatarState.videoTrack = track;
            this._state.isAvatarVideoEnabled = true;

            Logger.debug(
                "✅ Avatar video renderizado exitosamente usando track.attach()"
            );

            // ✅ TOAST: Confirmación
            if (window.app?._components?.ui) {
                window.app._components.ui.showToast(
                    "🎬 Video avatar conectado correctamente",
                    "success",
                    3000
                );
            }

            // ✅ EMIT: Evento de éxito
            this._emit("avatarVideoConnected", track, publication);
        } catch (error) {
            Logger.error("❌ Error renderizando avatar video:", error);

            // ✅ FALLBACK: Intentar método alternativo
            this._tryFallbackVideoAttach(track);
        }
    }

    /**
     * ✅ CORREGIDO: Método de fallback para video
     *
     * AGREGAR este método nuevo
     * @private
     */
    _tryFallbackVideoAttach(track) {
        try {
            Logger.debug("🔄 Intentando método fallback para avatar video");

            if (track?.mediaStreamTrack) {
                // Crear MediaStream
                const stream = new MediaStream([track.mediaStreamTrack]);

                // Asignar al elemento existente
                this._elements.avatarVideo.srcObject = stream;
                this._elements.avatarVideo.autoplay = true;
                this._elements.avatarVideo.playsInline = true;
                this._elements.avatarVideo.muted = true;
                this._elements.avatarVideo.style.display = "block";
                this._elements.avatarVideo.classList.add("loaded");

                // Ocultar fallback
                this._hideAvatarFallback();

                Logger.debug(
                    "✅ Avatar video conectado via método fallback (srcObject)"
                );

                // Toast
                if (window.app?._components?.ui) {
                    window.app._components.ui.showToast(
                        "🎬 Video avatar conectado (fallback)",
                        "success",
                        3000
                    );
                }

                return true;
            }

            throw new Error("Track mediaStreamTrack no disponible");
        } catch (fallbackError) {
            Logger.error("❌ Método fallback también falló:", fallbackError);

            // Mostrar error en UI
            this._showAvatarFallback();
            this._updateAvatarStatus("Error conectando video");

            if (window.app?._components?.ui) {
                window.app._components.ui.showToast(
                    "❌ Error conectando video del avatar",
                    "error",
                    5000
                );
            }

            return false;
        }
    }

    /**
     * Alterna el estado de mute del micrófono
     *
     * @returns {Promise<boolean>} Estado muted resultante
     */
    async toggleMute() {
        try {
            this._state.isMuted = !this._state.isMuted;

            // Actualizar stream de usuario si existe
            if (this._streams.userStream) {
                const audioTrack = this._streams.userStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = !this._state.isMuted;
                }
            }

            // Actualizar UI
            this._updateMuteButton();

            // Emitir evento
            this._emit("muteToggled", this._state.isMuted);

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    `🎤 Micrófono: ${this._state.isMuted ? "MUTED" : "ACTIVE"}`
                );
            }

            return this._state.isMuted;
        } catch (error) {
            Logger.error("❌ Error en toggle mute:", error);
            return this._state.isMuted;
        }
    }

    /**
     * Alterna la cámara del usuario
     *
     * @returns {Promise<boolean>} Estado de cámara resultante
     */
    async toggleUserCamera() {
        try {
            this._state.isUserVideoEnabled = !this._state.isUserVideoEnabled;

            if (this._state.isUserVideoEnabled) {
                await this._enableUserCamera();
            } else {
                await this._disableUserCamera();
            }

            // Actualizar UI
            this._updateCameraButton();

            // Emitir evento
            this._emit("cameraToggled", this._state.isUserVideoEnabled);

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    `📹 Cámara usuario: ${
                        this._state.isUserVideoEnabled ? "ENABLED" : "DISABLED"
                    }`
                );
            }

            return this._state.isUserVideoEnabled;
        } catch (error) {
            Logger.error("❌ Error en toggle camera:", error);
            return this._state.isUserVideoEnabled;
        }
    }

    /**
     * Toggle avatar on/off (método público)
     */
    async toggleAvatar() {
        try {
            if (this._avatarState.isActive) {
                // Desactivar avatar
                // ✅ EMITIR EVENTO en lugar de llamada directa
                this._emit("avatarDeactivationRequested", {
                    reason: "video_call_ended",
                    timestamp: Date.now(),
                });

                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "🎭 Solicitud de desactivación de avatar emitida"
                    );
                }
                this._avatarState.isActive = false;
                this._updateVideoButtonState(false);

                // Limpiar video
                if (this._avatarState.videoTrack) {
                    this._avatarState.videoTrack.detach();
                    this._avatarState.videoTrack = null;
                }

                if (this._elements.avatarVideo) {
                    this._elements.avatarVideo.innerHTML = "";
                    this._elements.avatarVideo.classList.remove("loaded");
                }

                if (this._elements.avatarFallback) {
                    this._elements.avatarFallback.style.display = "flex";
                }

                if (CONFIG.debug.enabled) {
                    Logger.debug("🎭 Avatar desactivado");
                }
            } else {
                // Activar avatar
                const avatarFound = this._findExistingAvatarTracks();

                if (!avatarFound) {
                    this.showSubtitles("Avatar no disponible");
                }

                // ✅ ACTUALIZAR: Estado avatar como solicitado
                this._avatarState.isRequested = true;

                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "🎭 Solicitud de activación de avatar emitida"
                    );
                }
            }

            return true;
        } catch (error) {
            Logger.error("❌ Error toggling avatar:", error);
            return false;
        }
    }

    /**
     * Muestra subtítulos en el video
     *
     * @param {string} text - Texto de subtítulos
     * @param {number} duration - Duración en ms
     */
    showSubtitles(text, duration = 3000) {
        if (!this._elements.videoSubtitles || !text) return;

        try {
            const subtitleContent = this._elements.videoSubtitles.querySelector(
                ".video-subtitle-content"
            );
            if (!subtitleContent) return;

            // Mostrar subtítulo
            subtitleContent.textContent = text;
            this._elements.videoSubtitles.style.display = "block";

            // Auto-hide después del duration
            clearTimeout(this._timers.subtitleTimeout);
            this._timers.subtitleTimeout = setTimeout(() => {
                this._elements.videoSubtitles.style.display = "none";
            }, duration);

            if (CONFIG.debug.enabled) {
                Logger.debug(`📺 Subtítulo mostrado: "${text}"`);
            }
        } catch (error) {
            Logger.error("❌ Error mostrando subtítulos:", error);
        }
    }

    /**
     * Muestra/oculta indicador de actividad de voz
     *
     * @param {boolean} show - Si mostrar el indicador
     * @param {string} label - Texto del indicador
     */
    showVoiceActivity(show, label = "Escuchando...") {
        if (!this._elements.videoVoiceActivity) return;

        try {
            if (show) {
                const voiceLabel =
                    this._elements.videoVoiceActivity.querySelector(
                        ".video-voice-label"
                    );
                if (voiceLabel) {
                    voiceLabel.textContent = label;
                }

                this._elements.videoVoiceActivity.style.display = "flex";

                // Auto-hide después de timeout
                clearTimeout(this._timers.voiceActivityTimeout);
                this._timers.voiceActivityTimeout = setTimeout(() => {
                    this._elements.videoVoiceActivity.style.display = "none";
                }, CONFIG.ui.call.voiceActivityTimeout || 5000);
            } else {
                this._elements.videoVoiceActivity.style.display = "none";
                clearTimeout(this._timers.voiceActivityTimeout);
            }

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    `🎤 Voice activity: ${
                        show ? "SHOWN" : "HIDDEN"
                    } - "${label}"`
                );
            }
        } catch (error) {
            Logger.error("❌ Error en voice activity:", error);
        }
    }

    /**
     * Obtiene el estado actual del video call
     *
     * @returns {Object} Estado completo
     */
    getState() {
        return {
            ...this._state,
            hasUserStream: !!this._streams.userStream,
            hasAvatarStream: !!this._streams.avatarStream,
            version: "1.0.0-basic",
        };
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    /**
     * Busca y renderiza video tracks de avatar que ya existen
     *
     * @description En lugar de tratar de "activar" un avatar con RPC,
     * este método busca participants de avatar que ya están conectados
     * al room de LiveKit y renderiza sus video tracks si están disponibles.
     *
     * Flujo:
     * 1. Verifica si voice-agent-sdk ya detectó un avatar worker
     * 2. Busca video tracks en ese participant
     * 3. Renderiza tracks encontrados usando handleAvatarVideo()
     * 4. Actualiza UI según el resultado
     *
     * @private
     * @returns {boolean} true si encontró y renderizó tracks, false si no
     *
     * @example
     * // Llamado desde startVideoCall() y toggleAvatar()
     * const found = this._findExistingAvatarTracks();
     * if (!found) {
     *     this.showSubtitles("Esperando avatar...");
     * }
     *
     * @since 1.0.0
     * @author Video Call Team
     */
    _findExistingAvatarTracks() {
        try {
            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "🔍 Buscando video tracks de avatar existentes..."
                );
            }

            // ✅ PASO 1: Verificar si voice-agent-sdk detectó avatar worker
            const agent = window.app?._components?.agent;
            if (!agent) {
                if (CONFIG.debug.enabled) {
                    Logger.debug("❌ Voice agent no disponible");
                }
                return false;
            }

            // ✅ PASO 2: Buscar avatar worker en participants conectados
            const avatarWorker = agent._avatarWorker;
            if (!avatarWorker) {
                if (CONFIG.debug.enabled) {
                    Logger.debug("❌ Avatar worker no conectado aún");
                }
                this._showAvatarFallback();
                this.showSubtitles("Esperando avatar...");
                return false;
            }

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "✅ Avatar worker encontrado:",
                    avatarWorker.identity
                );
            }

            // ✅ PASO 3: Buscar video tracks del avatar worker
            let videoTrackFound = false;

            avatarWorker.videoTracks.forEach((trackPublication) => {
                if (
                    trackPublication.videoTrack &&
                    trackPublication.isSubscribed
                ) {
                    if (CONFIG.debug.enabled) {
                        Logger.debug("✅ Video track del avatar encontrado:", {
                            trackSid: trackPublication.trackSid,
                            source: trackPublication.source,
                            subscribed: trackPublication.isSubscribed,
                        });
                    }

                    // ✅ PASO 4: Renderizar track existente
                    this.handleAvatarVideo(
                        trackPublication.videoTrack,
                        trackPublication
                    );
                    videoTrackFound = true;

                    // ✅ ACTUALIZAR: Estado interno
                    this._avatarState.isActive = true;
                    this._avatarState.videoTrack = trackPublication.videoTrack;
                    this._avatarState.worker = avatarWorker;
                }
            });

            // ✅ PASO 5: Manejar resultado
            if (videoTrackFound) {
                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "✅ Video tracks de avatar renderizados exitosamente"
                    );
                }
                this.showSubtitles("Avatar conectado");
                return true;
            } else {
                if (CONFIG.debug.enabled) {
                    Logger.debug(
                        "⚠️ Avatar worker conectado pero sin video tracks disponibles"
                    );
                }
                this._showAvatarFallback();
                this.showSubtitles("Avatar sin video disponible");
                return false;
            }
        } catch (error) {
            Logger.error(
                "❌ Error buscando tracks de avatar existentes:",
                error
            );
            this._showAvatarFallback();
            this.showSubtitles("Error conectando avatar");
            return false;
        }
    }

    /**
     * Solicita acceso a cámara y micrófono del usuario
     *
     * @private
     * @returns {Promise<void>}
     */
    async _requestUserMedia() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: "user",
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            };

            this._streams.userStream =
                await navigator.mediaDevices.getUserMedia(constraints);

            // Conectar stream al video element
            if (this._elements.userVideo) {
                this._elements.userVideo.srcObject = this._streams.userStream;
                this._elements.userVideo.classList.add("loaded");
            }

            this._state.isUserVideoEnabled = true;

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "📹 Stream de usuario obtenido:",
                    this._streams.userStream.getTracks().length,
                    "tracks"
                );
            }
        } catch (error) {
            Logger.error("❌ Error obteniendo media del usuario:", error);
            throw new Error(CONFIG.errors.MICROPHONE_PERMISSION_DENIED);
        }
    }

    /**
     * Habilita la cámara del usuario
     *
     * @private
     */
    async _enableUserCamera() {
        if (this._streams.userStream) {
            const videoTrack = this._streams.userStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = true;
            }
        }
    }

    /**
     * Deshabilita la cámara del usuario
     *
     * @private
     */
    async _disableUserCamera() {
        if (this._streams.userStream) {
            const videoTrack = this._streams.userStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = false;
            }
        }
    }

    /**
     * Muestra el fallback del avatar (Fase 1 - Sin avatar real)
     *
     * @private
     */
    _showAvatarFallback() {
        if (this._elements.avatarFallback) {
            this._elements.avatarFallback.style.display = "flex";
        }
        if (this._elements.avatarVideo) {
            this._elements.avatarVideo.style.display = "none";
        }
    }

    /**
     * Muestra el modal de video
     *
     * @private
     */
    _showVideoModal() {
        if (this._elements.videoOverlay) {
            this._elements.videoOverlay.classList.add("active");
            this._elements.videoOverlay.setAttribute("aria-hidden", "false");

            // Prevenir scroll del body
            document.body.style.overflow = "hidden";
        }
    }

    /**
     * Oculta el modal de video con manejo completo de focus
     *
     * @private
     */
    _hideVideoModal() {
        if (this._elements.videoOverlay) {
            // ✅ PASO 1: Blur todos los elementos internos
            const focusableElements =
                this._elements.videoOverlay.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

            focusableElements.forEach((element) => {
                if (element === document.activeElement) {
                    element.blur();
                    if (CONFIG.debug.enabled) {
                        Logger.debug(
                            "📹 Focus removido de elemento:",
                            element.id || element.className
                        );
                    }
                }
            });

            // ✅ PASO 2: Remover clase active (triggerea la animación de cierre)
            this._elements.videoOverlay.classList.remove("active");

            // ✅ PASO 3: Aria-hidden con delay para evitar warnings
            setTimeout(() => {
                this._elements.videoOverlay.setAttribute("aria-hidden", "true");
            }, 20);

            // ✅ PASO 4: Restaurar scroll
            document.body.style.overflow = "";

            // ✅ PASO 5: Optional - devolver focus a un elemento seguro
            const videoCameraBtn = document.getElementById("videoCameraBtn");
            if (videoCameraBtn) {
                setTimeout(() => {
                    videoCameraBtn.focus();
                }, 100);
            }

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    "✅ Modal cerrado correctamente sin warnings de accesibilidad"
                );
            }
        }
    }

    /**
     * Actualiza el botón del header
     *
     * @private
     * @param {boolean} active - Si la videollamada está activa
     */
    _updateHeaderButton(active) {
        if (!this._elements.videoCameraBtn) return;

        if (active) {
            this._elements.videoCameraBtn.classList.add("active");
            this._elements.videoCameraBtn.title = "Terminar videollamada";
            this._elements.videoCameraBtn.setAttribute(
                "aria-label",
                "Terminar videollamada"
            );
        } else {
            this._elements.videoCameraBtn.classList.remove("active");
            this._elements.videoCameraBtn.title =
                "Iniciar videollamada con avatar";
            this._elements.videoCameraBtn.setAttribute(
                "aria-label",
                "Iniciar videollamada"
            );
        }
    }

    /**
     * Actualiza el botón de mute
     *
     * @private
     */
    _updateMuteButton() {
        if (!this._elements.videoMuteBtn) return;

        const icon = this._elements.videoMuteBtn.querySelector("i");

        if (this._state.isMuted) {
            this._elements.videoMuteBtn.classList.add("muted");
            if (icon) icon.className = "fas fa-microphone-slash";
            this._elements.videoMuteBtn.title = "Activar micrófono";
        } else {
            this._elements.videoMuteBtn.classList.remove("muted");
            if (icon) icon.className = "fas fa-microphone";
            this._elements.videoMuteBtn.title = "Silenciar micrófono";
        }
    }

    /**
     * Actualiza el botón de cámara
     *
     * @private
     */
    _updateCameraButton() {
        if (!this._elements.videoCameraToggleBtn) return;

        const icon = this._elements.videoCameraToggleBtn.querySelector("i");

        if (!this._state.isUserVideoEnabled) {
            this._elements.videoCameraToggleBtn.classList.add("disabled");
            if (icon) icon.className = "fas fa-video-slash";
            this._elements.videoCameraToggleBtn.title = "Activar cámara";
        } else {
            this._elements.videoCameraToggleBtn.classList.remove("disabled");
            if (icon) icon.className = "fas fa-video";
            this._elements.videoCameraToggleBtn.title = "Desactivar cámara";
        }
    }

    /**
     * Inicia el timer de duración
     *
     * @private
     */
    _startDurationTimer() {
        this._state.duration = 0;

        this._timers.duration = setInterval(() => {
            this._state.duration++;
            this._updateDurationDisplay();
        }, 1000);
    }

    /**
     * Actualiza la visualización de duración
     *
     * @private
     */
    _updateDurationDisplay() {
        if (!this._elements.videoDuration) return;

        const minutes = Math.floor(this._state.duration / 60);
        const seconds = this._state.duration % 60;
        const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;

        this._elements.videoDuration.textContent = timeString;
    }

    /**
     * Limpia streams de media
     *
     * @private
     */
    async _cleanupStreams() {
        // Limpiar stream del usuario
        if (this._streams.userStream) {
            this._streams.userStream.getTracks().forEach((track) => {
                track.stop();
            });
            this._streams.userStream = null;
        }

        // Limpiar video elements
        if (this._elements.userVideo) {
            this._elements.userVideo.srcObject = null;
            this._elements.userVideo.classList.remove("loaded");
        }

        if (this._elements.avatarVideo) {
            this._elements.avatarVideo.srcObject = null;
            this._elements.avatarVideo.classList.remove("loaded");
        }
    }

    /**
     * Limpia timers activos
     *
     * @private
     */
    _cleanupTimers() {
        Object.values(this._timers).forEach((timer) => {
            if (timer) clearInterval(timer);
        });

        this._timers = {
            duration: null,
            subtitleTimeout: null,
            voiceActivityTimeout: null,
        };
    }

    /**
     * Resetea el estado a valores iniciales
     *
     * @private
     */
    _resetState() {
        this._state = {
            isActive: false,
            isUserVideoEnabled: false,
            isAvatarVideoEnabled: false,
            isMuted: false,
            duration: 0,
            connectionState: "disconnected",
        };
    }

    /**
     * Oculta el fallback del avatar
     *
     * AGREGAR este método:
     */
    _hideAvatarFallback() {
        if (this._elements.avatarFallback) {
            this._elements.avatarFallback.style.display = "none";
        }
    }

    /**
     * Muestra el video real del avatar
     *
     * AGREGAR este método:
     */
    _showAvatarVideo() {
        if (this._elements.avatarVideo) {
            this._elements.avatarVideo.style.display = "block";
            this._elements.avatarVideo.classList.add("loaded");
        }
    }

    /**
     * Limpia el video del avatar
     *
     * AGREGAR este método:
     */
    _clearAvatarVideo() {
        if (this._elements.avatarVideo) {
            // Detach todos los tracks del avatar
            const videoElement = this._elements.avatarVideo;
            if (videoElement.srcObject) {
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
            videoElement.srcObject = null;
            videoElement.classList.remove("loaded");
        }

        // Mostrar fallback
        this._showAvatarFallback();
        this._updateAvatarStatus("Conectando avatar...");
    }

    /**
     * Actualiza el estado del avatar en la UI
     *
     * AGREGAR este método:
     */
    _updateAvatarStatus(status) {
        // Actualizar texto en el fallback del avatar
        if (this._elements.avatarFallback) {
            const statusElement = this._elements.avatarFallback.querySelector(
                ".avatar-status-text span"
            );
            if (statusElement) {
                statusElement.textContent = status || "Cargando video...";
            }
        }
    }

    /**
     * Cleanup completo del manager
     */
    cleanup() {
        try {
            // Terminar videollamada si está activa
            if (this._state.isActive) {
                this.endVideoCall();
            }

            // Limpiar event listeners
            this._eventHandlers.forEach((handler, event) => {
                if (event === "keydown") {
                    document.removeEventListener("keydown", handler);
                }
            });
            this._eventHandlers.clear();

            // Limpiar referencias
            this._streams = { userStream: null, avatarStream: null };
            this._elements = {};

            if (CONFIG.debug.enabled) {
                Logger.debug("🧹 VideoCallManager cleanup completado");
            }
        } catch (error) {
            Logger.error("❌ Error durante cleanup de video:", error);
        }
    }

    /**
     * Actualiza el estado del botón de video
     * @private
     */
    _updateVideoButtonState(isActive, isLoading = false) {
        const button = this._elements.videoCameraBtn;
        if (!button) return;

        // Remover clases anteriores
        button.classList.remove("active", "loading", "inactive");

        if (isLoading) {
            button.classList.add("loading");
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else if (isActive) {
            button.classList.add("active");
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-video"></i>';
        } else {
            button.classList.add("inactive");
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-video-slash"></i>';
        }
    }

    /**
     * Muestra estado de avatar conectándose
     * @private
     */
    _showAvatarConnecting(provider) {
        if (this._elements.avatarFallback) {
            this._elements.avatarFallback.innerHTML = `
            <div class="avatar-status">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Conectando ${provider}...</span>
            </div>
        `;
            this._elements.avatarFallback.style.display = "flex";
        }
    }

    /**
     * Muestra error usando toast del sistema
     * @private
     */
    _showError(message) {
        try {
            Logger.error("❌ VideoCallManager Error:", message);

            // Usar toast si está disponible
            if (
                window.app &&
                window.app._components &&
                window.app._components.ui
            ) {
                window.app._components.ui.showToast(message, "error", 5000);
            } else {
                // Fallback a console
                Logger.error("VideoCallManager:", message);
            }
        } catch (error) {
            Logger.error("❌ Error mostrando error:", error);
        }
    }

    // ✅ NUEVO: Método on() compatible con el patrón existente
    on(event, callback) {
        this.addEventListener(event, callback);
    }

    // ✅ NUEVO: Método off() para remover listeners
    off(event, callback) {
        this.removeEventListener(event, callback);
    }

    /**
     * Emite eventos personalizados
     *
     * @private
     * @param {string} event - Nombre del evento
     * @param {...any} args - Argumentos del evento
     */
    _emit(event, ...args) {
        try {
            const customEvent = new CustomEvent(event, {
                detail: args,
            });
            this.dispatchEvent(customEvent);

            if (CONFIG.debug.enabled) {
                Logger.debug(
                    `📹 VideoCallManager Evento: ${event}`,
                    args.length > 0 ? args : ""
                );
            }
        } catch (error) {
            Logger.error(`❌ Error emitiendo evento ${event}:`, error);
        }
    }
}

// ==========================================
// INICIALIZACIÓN Y EXPORT
// ==========================================

// Export para acceso global
if (typeof window !== "undefined") {
    window.VideoCallManager = VideoCallManager;

    if (CONFIG.debug.enabled) {
        Logger.debug("✅ VideoCallManager disponible globalmente");
    }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    try {
        // Crear instancia global del video call manager
        window.videoCallManager = new VideoCallManager();

        // Funciones de debug globales si está en modo debug
        if (CONFIG.debug.enabled) {
            window.videoCallDemo = {
                start: () => window.videoCallManager.startVideoCall(),
                end: () => window.videoCallManager.endVideoCall(),
                toggleMute: () => window.videoCallManager.toggleMute(),
                toggleCamera: () => window.videoCallManager.toggleUserCamera(),
                showSubtitles: (text) =>
                    window.videoCallManager.showSubtitles(text),
                showVoiceActivity: (show = true) =>
                    window.videoCallManager.showVoiceActivity(show),
                getState: () => window.videoCallManager.getState(),
            };

            Logger.debug(
                "🎮 Video call demo functions disponibles en window.videoCallDemo"
            );
        }

        Logger.debug("📹 VideoCallManager inicializado y listo para Fase 1");
    } catch (error) {
        Logger.error("❌ Error inicializando VideoCallManager:", error);
    }
});
