/**
 * Voice Call Manager v3.0-MVP - Modos de Llamada Integrados
 *
 * COMPATIBLE CON ARQUITECTURA V3.0:
 * ✅ ModernVoiceAgent + UIManager v3.0 integración
 * ✅ Logger centralizado (no más console.log)
 * ✅ CONFIG unificado para configuraciones
 * ✅ Mobile-first responsive design
 * ✅ Character.AI y WhatsApp modes
 * ✅ SOLID + DRY + Clean Code
 * ✅ Error handling robusto
 *
 * @author Equipo de Desarrollo
 * @version 3.0.0-mvp
 * @since 2024
 * @requires CONFIG, Logger, UIManager
 */

/**
 * Gestor de modos de llamada de voz
 *
 * Proporciona diferentes experiencias visuales para llamadas de voz:
 * - Character.AI: Interfaz centrada en branding con avatar circular
 * - WhatsApp: Experiencia fullscreen con avatar como fondo
 *
 * Se integra perfectamente con UIManager v3.0 y ModernVoiceAgent.
 *
 * @class VoiceCallManager
 *
 * @example
 * ```javascript
 * const manager = new VoiceCallManager();
 * manager.setCharacterMode("https://example.com/avatar.jpg");
 * manager.setVisible(true);
 * manager.updateVoiceState("listening");
 * ```
 */
class VoiceCallManager {
    /**
     * Constructor del gestor de modos de llamada
     *
     * Inicializa el estado interno y obtiene referencias a elementos DOM.
     * Configura el sistema con valores por defecto del CONFIG.
     *
     * @throws {Error} Si faltan elementos DOM críticos
     */
    constructor() {
        /**
         * Modo de llamada actual
         * @type {string}
         * @private
         */
        this._currentMode = "character"; // 'character' | 'whatsapp'

        /**
         * Estado de la llamada
         * @type {Object}
         * @private
         */
        this._state = {
            isActive: false,
            isVoiceActivityVisible: false,
            isThinking: false,
        };

        /**
         * Referencias a elementos DOM
         * @type {Object}
         * @private
         */
        this._elements = {
            callOverlay: document.getElementById("call-overlay"),
            voiceActivity: document.getElementById("voice-activity"),
            callTitle: document.getElementById("call-title"),
            callStatus: document.getElementById("call-status"),
            brandSection: document.querySelector(".voice-brand-section"),
            brandImage: document.querySelector(".voice-brand-image"),
            avatarContainer: document.querySelector(".call-avatar-container"),
            avatarImage: document.querySelector(".call-avatar-image"),
        };

        // Validar elementos críticos
        this._validateDOMElements();

        // Inicializar con configuración por defecto
        this._initializeWithDefaults();

        Logger.ui("VoiceCallManager v3.0-MVP inicializado");
        Logger.ui("Modos disponibles: character, whatsapp");
    }

    /**
     * Valida que los elementos DOM críticos estén disponibles
     *
     * @private
     * @throws {Error} Si faltan elementos críticos
     */
    _validateDOMElements() {
        const criticalElements = ["callOverlay"];
        const missing = criticalElements.filter((id) => !this._elements[id]);

        if (missing.length > 0) {
            throw new Error(
                `Elementos DOM críticos faltantes: ${missing.join(", ")}`
            );
        }

        if (!this._elements.callOverlay) {
            Logger.error(
                "Call overlay no encontrado, VoiceCallManager no funcionará"
            );
            return;
        }

        Logger.debug("Elementos DOM validados correctamente");
    }

    /**
     * Inicializa con valores por defecto del CONFIG
     *
     * @private
     */
    _initializeWithDefaults() {
        try {
            // Configurar textos por defecto desde CONFIG
            this._updateCallContent({
                title: "Asistente Virtual",
                status: "Empieza a hablar",
            });

            Logger.debug("VoiceCallManager inicializado con defaults");
        } catch (error) {
            Logger.error("Error inicializando con defaults:", error);
        }
    }

    /**
     * Activa el modo Character.AI
     *
     * Configura la interfaz con un diseño centrado en branding,
     * avatar circular prominente y gradientes de fondo.
     *
     * @param {string|null} brandImageSrc - URL de la imagen del avatar (opcional)
     *
     * @example
     * ```javascript
     * manager.setCharacterMode("https://example.com/ai-avatar.jpg");
     * ```
     */
    setCharacterMode(brandImageSrc = null) {
        this._currentMode = "character";
        this._updateOverlayClasses();

        // Configurar imagen de brand si se proporciona
        if (brandImageSrc && this._elements.brandImage) {
            this._setBrandImage(brandImageSrc);
        }

        // Configurar contenido específico de Character.AI
        this._updateCallContent({
            title: "Asistente.ai",
            status: "Empieza a hablar",
        });

        Logger.ui(
            "Modo Character.AI activado",
            brandImageSrc ? "con imagen personalizada" : ""
        );
    }

    /**
     * Activa el modo WhatsApp
     *
     * Configura la interfaz fullscreen con opción de usar
     * la imagen del avatar como fondo de pantalla completa.
     *
     * @param {boolean} useAvatarBackground - Si usar imagen de avatar como fondo
     *
     * @example
     * ```javascript
     * manager.setWhatsAppMode(true); // Con avatar de fondo
     * manager.setWhatsAppMode(false); // Sin fondo especial
     * ```
     */
    setWhatsAppMode(useAvatarBackground = false) {
        this._currentMode = "whatsapp";
        this._updateOverlayClasses();

        // Configurar imagen de fondo si se solicita
        if (useAvatarBackground) {
            this._setAvatarBackground();
        } else {
            this._clearAvatarBackground();
        }

        // Configurar contenido específico de WhatsApp
        this._updateCallContent({
            title: "Asistente Virtual",
            status: "Llamada de voz activa",
        });

        Logger.ui(
            `Modo WhatsApp activado ${
                useAvatarBackground ? "con" : "sin"
            } avatar de fondo`
        );
    }

    /**
     * Muestra u oculta el overlay de llamada de voz
     *
     * @param {boolean} show - Si mostrar el overlay
     *
     * @example
     * ```javascript
     * manager.setVisible(true);  // Mostrar llamada
     * manager.setVisible(false); // Ocultar llamada
     * ```
     */
    setVisible(show) {
        if (!this._elements.callOverlay) return;

        this._state.isActive = show;

        if (show) {
            this._elements.callOverlay.classList.add("active");
            this._elements.callOverlay.setAttribute("aria-hidden", "false");

            // Anunciar cambio para screen readers
            this._announceToScreenReader("Llamada de voz iniciada");
        } else {
            this._elements.callOverlay.classList.remove("active");
            this._elements.callOverlay.setAttribute("aria-hidden", "true");

            // Limpiar estados al ocultar
            this.hideVoiceActivity();
            this._clearAvatarBackground();

            this._announceToScreenReader("Llamada de voz terminada");
        }

        Logger.ui(`Voice call overlay: ${show ? "VISIBLE" : "OCULTO"}`);
    }

    /**
     * Muestra u oculta el indicador de actividad de voz
     *
     * @param {boolean} show - Si mostrar el indicador
     *
     * @example
     * ```javascript
     * manager.showVoiceActivity(true);  // Usuario hablando
     * manager.showVoiceActivity(false); // Usuario callado
     * ```
     */
    showVoiceActivity(show) {
        if (!this._elements.voiceActivity) return;

        this._state.isVoiceActivityVisible = show;
        this._elements.voiceActivity.style.display = show ? "flex" : "none";

        if (show && this._elements.callStatus) {
            this._updateCallStatus("Escuchando...");
        }

        Logger.voice(
            `Voice activity indicator: ${show ? "VISIBLE" : "OCULTO"}`
        );
    }

    /**
     * Oculta el indicador de actividad de voz
     *
     * Resetea todos los estados relacionados con actividad de voz
     * y restaura el texto de estado original.
     */
    hideVoiceActivity() {
        this.showVoiceActivity(false);
        this._state.isThinking = false;

        if (this._elements.voiceActivity) {
            this._elements.voiceActivity.classList.remove("thinking");
        }

        // Restaurar texto de estado original según el modo
        this._restoreDefaultStatus();

        Logger.voice("Voice activity ocultado y estados reseteados");
    }

    /**
     * Activa o desactiva el estado "thinking"
     *
     * @param {boolean} thinking - Si el bot está pensando
     *
     * @example
     * ```javascript
     * manager.setThinking(true);  // Bot procesando
     * manager.setThinking(false); // Bot listo
     * ```
     */
    setThinking(thinking) {
        if (!this._elements.voiceActivity) return;

        this._state.isThinking = thinking;

        if (thinking) {
            this.showVoiceActivity(true);
            this._elements.voiceActivity.classList.add("thinking");
            this._updateCallStatus("Procesando...");
        } else {
            this._elements.voiceActivity.classList.remove("thinking");
            if (!this._state.isVoiceActivityVisible) {
                this.hideVoiceActivity();
            }
        }

        Logger.voice(`Bot thinking state: ${thinking ? "PENSANDO" : "LISTO"}`);
    }

    /**
     * Actualiza el texto de estado de la llamada
     *
     * @param {string} status - Nuevo texto de estado
     *
     * @example
     * ```javascript
     * manager.updateStatus("Conectando...");
     * manager.updateStatus("Llamada activa");
     * ```
     */
    updateStatus(status) {
        this._updateCallStatus(status);
        Logger.voice(`Voice Call Status: ${status}`);
    }

    /**
     * Actualiza el estado con lógica automática según el modo
     *
     * Proporciona una API de alto nivel para manejar estados comunes
     * de la llamada con transiciones automáticas.
     *
     * @param {string} state - Estado: 'initial', 'listening', 'processing', 'responding'
     *
     * @example
     * ```javascript
     * manager.updateVoiceState('listening');   // Usuario hablando
     * manager.updateVoiceState('processing');  // Bot procesando
     * manager.updateVoiceState('responding');  // Bot respondiendo
     * manager.updateVoiceState('initial');     // Estado inicial
     * ```
     */
    updateVoiceState(state) {
        const stateConfig = this._getStateConfiguration(state);

        if (!stateConfig) {
            Logger.error(`Estado de voz desconocido: ${state}`);
            return;
        }

        // Aplicar configuración del estado
        this.updateStatus(stateConfig.status);
        this._applyVoiceStateVisuals(stateConfig);

        Logger.voice(
            `Voice state actualizado: ${state} -> "${stateConfig.status}"`
        );
    }

    /**
     * Configura la imagen del brand para modo Character.AI
     *
     * @param {string} imageSrc - URL de la imagen
     *
     * @example
     * ```javascript
     * manager.setBrandImage("https://example.com/logo.png");
     * ```
     */
    setBrandImage(imageSrc) {
        this._setBrandImage(imageSrc);
    }

    /**
     * Obtiene el estado actual del gestor
     *
     * @returns {Object} Estado completo del gestor
     *
     * @example
     * ```javascript
     * const state = manager.getState();
     * console.log(`Modo actual: ${state.currentMode}`);
     * console.log(`Llamada activa: ${state.isActive}`);
     * ```
     */
    getState() {
        return {
            currentMode: this._currentMode,
            isActive: this._state.isActive,
            isVoiceActivityVisible: this._state.isVoiceActivityVisible,
            isThinking: this._state.isThinking,
            hasRequiredElements: !!this._elements.callOverlay,
            version: "3.0.0-mvp",
        };
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    /**
     * Obtiene configuración para un estado de voz específico
     *
     * @private
     * @param {string} state - Estado a configurar
     * @returns {Object|null} Configuración del estado
     */
    _getStateConfiguration(state) {
        const stateMap = {
            initial: {
                status:
                    this._currentMode === "character"
                        ? "Empieza a hablar"
                        : "Llamada de voz activa",
                showActivity: false,
                thinking: false,
            },
            listening: {
                status: "Escuchando...",
                showActivity: true,
                thinking: false,
            },
            processing: {
                status: "Procesando...",
                showActivity: false,
                thinking: true,
            },
            responding: {
                status: "Respondiendo...",
                showActivity: false,
                thinking: false,
            },
        };

        return stateMap[state] || null;
    }

    /**
     * Aplica los elementos visuales de un estado de voz
     *
     * @private
     * @param {Object} stateConfig - Configuración del estado
     */
    _applyVoiceStateVisuals(stateConfig) {
        // Aplicar indicadores visuales según la configuración
        if (stateConfig.showActivity) {
            this.showVoiceActivity(true);
            this.setThinking(false);
        } else if (stateConfig.thinking) {
            this.showVoiceActivity(false);
            this.setThinking(true);
        } else {
            this.showVoiceActivity(false);
            this.setThinking(false);
        }
    }

    /**
     * Actualiza las clases CSS del overlay según el modo actual
     *
     * @private
     */
    _updateOverlayClasses() {
        if (!this._elements.callOverlay) return;

        // Remover clases existentes de modo
        this._elements.callOverlay.classList.remove(
            "voice-mode-character",
            "voice-mode-whatsapp",
            "has-avatar"
        );

        // Añadir clase del modo actual
        this._elements.callOverlay.classList.add(
            `voice-mode-${this._currentMode}`
        );

        Logger.debug(
            `Overlay classes actualizadas para modo: ${this._currentMode}`
        );
    }

    /**
     * Configura imagen de avatar como fondo
     *
     * @private
     */
    _setAvatarBackground() {
        if (!this._elements.callOverlay) return;

        // Buscar imagen de avatar
        const avatarImg =
            this._elements.avatarImage ||
            document.querySelector(".avatar-image") ||
            document.querySelector(".call-avatar-image");

        if (
            avatarImg &&
            !avatarImg.style.display.includes("none") &&
            avatarImg.src
        ) {
            this._elements.callOverlay.style.backgroundImage = `url(${avatarImg.src})`;
            this._elements.callOverlay.classList.add("has-avatar");
            Logger.debug("Avatar configurado como fondo:", avatarImg.src);
        } else {
            // Usar imagen de demo si no hay avatar real
            this._setDemoBackground();
        }
    }

    /**
     * Configura imagen de demo como fondo
     *
     * @private
     */
    _setDemoBackground() {
        if (!this._elements.callOverlay) return;

        const demoBackground = `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Cdefs%3E%3CradialGradient id="faceGrad" cx="50%25" cy="40%25" r="60%25"%3E%3Cstop offset="0%25" style="stop-color:%23f4a261;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23e76f51;stop-opacity:1" /%3E%3C/radialGradient%3E%3ClinearGradient id="bgGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%232a3942;stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:%23667781;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%234a5568;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23bgGrad)"/%3E%3Cellipse cx="200" cy="200" rx="120" ry="140" fill="url(%23faceGrad)" opacity="0.9"/%3E%3Ccircle cx="170" cy="180" r="8" fill="%23333"/%3E%3Ccircle cx="230" cy="180" r="8" fill="%23333"/%3E%3Cellipse cx="200" cy="210" rx="6" ry="4" fill="%23333" opacity="0.8"/%3E%3Cpath d="M 180 230 Q 200 250 220 230" stroke="%23333" stroke-width="3" fill="none" opacity="0.7"/%3E%3C/svg%3E')`;

        this._elements.callOverlay.style.backgroundImage = demoBackground;
        this._elements.callOverlay.classList.add("has-avatar");

        Logger.debug("Demo background configurado");
    }

    /**
     * Limpia imagen de fondo
     *
     * @private
     */
    _clearAvatarBackground() {
        if (!this._elements.callOverlay) return;

        this._elements.callOverlay.style.backgroundImage = "";
        this._elements.callOverlay.classList.remove("has-avatar");

        Logger.debug("Avatar background limpiado");
    }

    /**
     * Configura imagen de brand
     *
     * @private
     * @param {string} imageSrc - URL de la imagen
     */
    _setBrandImage(imageSrc) {
        if (this._elements.brandImage && imageSrc) {
            this._elements.brandImage.src = imageSrc;
            this._elements.brandImage.style.display = "";
            Logger.debug("Imagen de brand configurada:", imageSrc);
        }
    }

    /**
     * Actualiza contenido del título y estado de la llamada
     *
     * @private
     * @param {Object} content - Contenido a actualizar
     * @param {string} content.title - Título de la llamada
     * @param {string} content.status - Estado de la llamada
     */
    _updateCallContent(content) {
        if (content.title && this._elements.callTitle) {
            this._elements.callTitle.textContent = content.title;
        }

        if (content.status && this._elements.callStatus) {
            this._elements.callStatus.textContent = content.status;
        }
    }

    /**
     * Actualiza solo el estado de la llamada
     *
     * @private
     * @param {string} status - Nuevo estado
     */
    _updateCallStatus(status) {
        if (this._elements.callStatus) {
            this._elements.callStatus.textContent = status;
        }
    }

    /**
     * Restaura el estado por defecto según el modo actual
     *
     * @private
     */
    _restoreDefaultStatus() {
        const defaultText =
            this._currentMode === "character"
                ? "Empieza a hablar"
                : "Llamada de voz activa";

        this._updateCallStatus(defaultText);
    }

    /**
     * Anuncia cambios a screen readers
     *
     * @private
     * @param {string} message - Mensaje para screen readers
     */
    _announceToScreenReader(message) {
        try {
            // Crear elemento temporal para anuncio
            const announcement = document.createElement("div");
            announcement.setAttribute("aria-live", "polite");
            announcement.setAttribute("aria-atomic", "true");
            announcement.className = "sr-only";
            announcement.textContent = message;

            document.body.appendChild(announcement);

            // Remover después de que sea anunciado
            setTimeout(() => {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 1000);
        } catch (error) {
            Logger.debug("Error anunciando a screen reader:", error);
        }
    }
}

// ==========================================
// INTEGRACIÓN CON UIMANAGER V3.0
// ==========================================

/**
 * Integra VoiceCallManager con UIManager existente
 *
 * Extiende UIManager v3.0 con métodos específicos para modos de llamada
 * manteniendo compatibilidad total con la API existente.
 *
 * @function integrateVoiceCallWithUI
 */
function integrateVoiceCallWithUI() {
    // Verificar si UIManager está disponible
    if (typeof window.UIManager === "undefined") {
        Logger.debug(
            "UIManager no encontrado, voice call funcionará independientemente"
        );
        return;
    }

    // Crear instancia global de VoiceCallManager
    window.voiceCallManager = new VoiceCallManager();

    // Extender UIManager con métodos de voice call
    const originalShowVoiceMode = window.UIManager.prototype.showVoiceMode;

    /**
     * Override de showVoiceMode para integrar con VoiceCallManager
     *
     * @param {boolean} show - Si mostrar modo voz
     */
    window.UIManager.prototype.showVoiceMode = function (show) {
        // Llamar método original si existe
        if (originalShowVoiceMode) {
            originalShowVoiceMode.call(this, show);
        }

        // Aplicar lógica de voice call manager
        if (window.voiceCallManager) {
            window.voiceCallManager.setVisible(show);
        }
    };

    /**
     * Configura el modo visual de la llamada de voz
     *
     * @param {'character'|'whatsapp'} mode - Tipo de interfaz visual
     * @param {boolean} useAvatarBackground - Solo WhatsApp: usar imagen como fondo
     * @param {string|null} brandImageSrc - Solo Character.AI: URL imagen del logo
     *
     * @example
     * ```javascript
     * // Modo Character.AI con imagen personalizada
     * ui.setVoiceCallMode('character', false, 'https://example.com/logo.png');
     *
     * // Modo WhatsApp con avatar de fondo
     * ui.setVoiceCallMode('whatsapp', true);
     * ```
     */
    window.UIManager.prototype.setVoiceCallMode = function (
        mode,
        useAvatarBackground = false,
        brandImageSrc = null
    ) {
        if (!window.voiceCallManager) return;

        try {
            if (mode === "character") {
                window.voiceCallManager.setCharacterMode(brandImageSrc);
            } else if (mode === "whatsapp") {
                window.voiceCallManager.setWhatsAppMode(useAvatarBackground);
            } else {
                Logger.error(`Modo de llamada inválido: ${mode}`);
                return;
            }

            Logger.ui(`Voice call mode configurado: ${mode}`);
        } catch (error) {
            Logger.error("Error configurando voice call mode:", error);
        }
    };

    /**
     * Configura imagen de brand para Character.AI
     *
     * @param {string} imageSrc - URL de la imagen
     */
    window.UIManager.prototype.setVoiceCallBrandImage = function (imageSrc) {
        if (!window.voiceCallManager) return;

        try {
            window.voiceCallManager.setBrandImage(imageSrc);
        } catch (error) {
            Logger.error("Error configurando brand image:", error);
        }
    };

    /**
     * Actualiza estado de la llamada de voz
     *
     * @param {string} status - Nuevo estado
     */
    window.UIManager.prototype.updateVoiceCallStatus = function (status) {
        if (!window.voiceCallManager) return;

        try {
            window.voiceCallManager.updateStatus(status);
        } catch (error) {
            Logger.error("Error actualizando voice call status:", error);
        }
    };

    /**
     * Actualiza estado de voz con transiciones automáticas
     *
     * @param {string} state - Estado: 'initial', 'listening', 'processing', 'responding'
     */
    window.UIManager.prototype.updateVoiceCallState = function (state) {
        if (!window.voiceCallManager) return;

        try {
            window.voiceCallManager.updateVoiceState(state);
        } catch (error) {
            Logger.error("Error actualizando voice call state:", error);
        }
    };

    // Integrar voice activity
    const originalUpdateVoiceActivity =
        window.UIManager.prototype.updateVoiceActivity;

    /**
     * Override de updateVoiceActivity para integrar con VoiceCallManager
     *
     * @param {boolean} active - Si hay actividad de voz
     * @param {number} level - Nivel de actividad 0-1
     */
    window.UIManager.prototype.updateVoiceActivity = function (
        active,
        level = 0
    ) {
        // Llamar método original si existe
        if (originalUpdateVoiceActivity) {
            originalUpdateVoiceActivity.call(this, active, level);
        }

        // Aplicar lógica de voice call manager
        if (window.voiceCallManager) {
            window.voiceCallManager.showVoiceActivity(active);
        }
    };

    // Integrar bot thinking
    const originalShowBotThinking = window.UIManager.prototype.showBotThinking;

    /**
     * Override de showBotThinking para integrar con VoiceCallManager
     *
     * @param {boolean} show - Si mostrar indicador de pensamiento
     */
    window.UIManager.prototype.showBotThinking = function (show) {
        // Llamar método original si existe
        if (originalShowBotThinking) {
            originalShowBotThinking.call(this, show);
        }

        // Aplicar lógica de voice call manager
        if (window.voiceCallManager) {
            window.voiceCallManager.setThinking(show);
        }
    };

    Logger.ui("VoiceCallManager integrado con UIManager v3.0");
}

// ==========================================
// FUNCIONES GLOBALES PARA DESARROLLO/TESTING
// ==========================================

/**
 * Funciones globales para testing y desarrollo
 *
 * Estas funciones están disponibles globalmente para facilitar
 * el testing y debug durante el desarrollo.
 *
 * @namespace voiceCallDemo
 */
window.voiceCallDemo = {
    /**
     * Muestra modo Character.AI
     * @param {string|null} brandImageSrc - URL imagen personalizada
     */
    showCharacter: (brandImageSrc = null) => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.setCharacterMode(brandImageSrc);
            window.voiceCallManager.setVisible(true);
            Logger.debug("Demo: Character.AI mode activado");
        } catch (error) {
            Logger.error("Error en demo character:", error);
        }
    },

    /**
     * Muestra modo WhatsApp simple
     */
    showWhatsApp: () => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.setWhatsAppMode(false);
            window.voiceCallManager.setVisible(true);
            Logger.debug("Demo: WhatsApp mode activado");
        } catch (error) {
            Logger.error("Error en demo whatsapp:", error);
        }
    },

    /**
     * Muestra modo WhatsApp con avatar de fondo
     */
    showWhatsAppWithAvatar: () => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.setWhatsAppMode(true);
            window.voiceCallManager.setVisible(true);
            Logger.debug("Demo: WhatsApp mode con avatar activado");
        } catch (error) {
            Logger.error("Error en demo whatsapp con avatar:", error);
        }
    },

    /**
     * Configura imagen de brand
     * @param {string} imageSrc - URL de la imagen
     */
    setBrandImage: (imageSrc) => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.setBrandImage(imageSrc);
            Logger.debug("Demo: Brand image configurada:", imageSrc);
        } catch (error) {
            Logger.error("Error configurando brand image:", error);
        }
    },

    /**
     * Configura estado de voz
     * @param {string} state - Estado a configurar
     */
    setState: (state) => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.updateVoiceState(state);
            Logger.debug(`Demo: Estado configurado a ${state}`);
        } catch (error) {
            Logger.error("Error configurando estado:", error);
        }
    },

    /**
     * Configura estado personalizado
     * @param {string} status - Estado personalizado
     */
    setStatus: (status) => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.updateStatus(status);
            Logger.debug(`Demo: Status configurado a ${status}`);
        } catch (error) {
            Logger.error("Error configurando status:", error);
        }
    },

    /**
     * Simula conversación completa
     */
    simulateConversation: () => {
        if (!window.voiceCallManager) return;

        try {
            Logger.debug("Simulando conversación completa...");

            // Secuencia automática para testing
            setTimeout(
                () => window.voiceCallManager.updateVoiceState("listening"),
                1000
            );
            setTimeout(
                () => window.voiceCallManager.updateVoiceState("processing"),
                3000
            );
            setTimeout(
                () => window.voiceCallManager.updateVoiceState("responding"),
                5000
            );
            setTimeout(
                () => window.voiceCallManager.updateVoiceState("initial"),
                8000
            );

            Logger.debug("Simulación de conversación iniciada");
        } catch (error) {
            Logger.error("Error simulando conversación:", error);
        }
    },

    /**
     * Oculta overlay de llamada
     */
    hide: () => {
        if (!window.voiceCallManager) return;
        try {
            window.voiceCallManager.setVisible(false);
            Logger.debug("Demo: Voice call ocultado");
        } catch (error) {
            Logger.error("Error ocultando voice call:", error);
        }
    },

    /**
     * Alterna indicador de voz
     */
    toggleVoice: () => {
        if (!window.voiceCallManager) return;
        try {
            const isVisible =
                window.voiceCallManager.getState().isVoiceActivityVisible;
            window.voiceCallManager.showVoiceActivity(!isVisible);
            Logger.debug(
                `Demo: Voice activity ${!isVisible ? "mostrado" : "ocultado"}`
            );
        } catch (error) {
            Logger.error("Error alternando voice activity:", error);
        }
    },

    /**
     * Alterna estado de pensamiento
     */
    toggleThinking: () => {
        if (!window.voiceCallManager) return;
        try {
            const isThinking = window.voiceCallManager.getState().isThinking;
            window.voiceCallManager.setThinking(!isThinking);
            Logger.debug(
                `Demo: Thinking ${!isThinking ? "activado" : "desactivado"}`
            );
        } catch (error) {
            Logger.error("Error alternando thinking:", error);
        }
    },

    /**
     * Obtiene estado actual
     */
    getState: () => {
        if (!window.voiceCallManager) return null;
        try {
            const state = window.voiceCallManager.getState();
            Logger.debug("Estado actual:", state);
            return state;
        } catch (error) {
            Logger.error("Error obteniendo estado:", error);
            return null;
        }
    },
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

/**
 * Inicializa VoiceCallManager cuando el DOM esté listo
 */
document.addEventListener("DOMContentLoaded", function () {
    // Esperar un poco para asegurar que otros scripts se carguen
    setTimeout(() => {
        try {
            integrateVoiceCallWithUI();

            if (window.voiceCallManager) {
                // Configurar modo por defecto
                window.voiceCallManager.setCharacterMode();

                Logger.ui("Voice Call System v3.0-MVP listo");
                Logger.ui(
                    "Comandos de testing disponibles en window.voiceCallDemo"
                );

                // Configurar modo por defecto desde CONFIG si está disponible
                if (
                    typeof CONFIG !== "undefined" &&
                    CONFIG.ui?.call?.conversationMode
                ) {
                    Logger.debug(
                        `Modo de conversación configurado: ${CONFIG.ui.call.conversationMode}`
                    );
                }
            }
        } catch (error) {
            Logger.error("Error inicializando Voice Call System:", error);
        }
    }, 100);
});

/**
 * Keyboard shortcuts para desarrollo
 *
 * Solo habilitados cuando CONFIG.debug.enabled = true
 */
document.addEventListener("keydown", function (e) {
    // Solo en modo debug
    if (typeof CONFIG === "undefined" || !CONFIG.debug?.enabled) return;

    if (e.ctrlKey && e.shiftKey) {
        try {
            switch (e.key) {
                case "1":
                    e.preventDefault();
                    window.voiceCallDemo?.showCharacter();
                    break;
                case "2":
                    e.preventDefault();
                    window.voiceCallDemo?.showWhatsApp();
                    break;
                case "3":
                    e.preventDefault();
                    window.voiceCallDemo?.showWhatsAppWithAvatar();
                    break;
                case "H":
                    e.preventDefault();
                    window.voiceCallDemo?.hide();
                    break;
                case "S":
                    e.preventDefault();
                    window.voiceCallDemo?.simulateConversation();
                    break;
            }
        } catch (error) {
            Logger.error("Error en keyboard shortcut:", error);
        }
    }
});

/**
 * Export para acceso global
 */
if (typeof window !== "undefined") {
    window.VoiceCallManager = VoiceCallManager;
}
