/**
 * Voice Call Manager - Módulo separado para manejar los modos de voice call
 * Compatible con el sistema UIManager existente
 */

class VoiceCallManager {
  constructor() {
    this.currentMode = 'character'; // 'character' | 'whatsapp'
    this.isActive = false;
    this.isVoiceActivityVisible = false;
    this.isThinking = false;

    // Elementos DOM
    this.elements = {
      callOverlay: document.getElementById('call-overlay'),
      voiceActivity: document.getElementById('voice-activity'),
      callTitle: document.getElementById('call-title'),
      callStatus: document.getElementById('call-status'),
      brandSection: document.querySelector('.voice-brand-section'),
      brandImage: document.querySelector('.voice-brand-image'),
      avatarContainer: document.querySelector('.call-avatar-container'),
      avatarImage: document.querySelector('.call-avatar-image'),
    };

    this.init();
  }

  init() {
    if (!this.elements.callOverlay) {
      console.warn('⚠️ Call overlay not found');
      return;
    }

    console.log('🎨 VoiceCallManager inicializado');
    console.log('📱 Modos disponibles: character, whatsapp');
  }

  /**
   * Activar modo Character.AI
   * @param {string} brandImageSrc - URL de la imagen para el avatar del character (opcional)
   */
  setCharacterMode(brandImageSrc = null) {
    this.currentMode = 'character';
    this._updateOverlayClasses();

    // Configurar imagen de brand si se proporciona
    if (brandImageSrc && this.elements.brandImage) {
      this.elements.brandImage.src = brandImageSrc;
      this.elements.brandImage.style.display = '';
    }

    // Configurar contenido
    if (this.elements.callTitle) {
      this.elements.callTitle.textContent = 'Asistente.ai';
    }
    if (this.elements.callStatus) {
      this.elements.callStatus.textContent = 'Empieza a hablar';
    }

    console.log('✅ Modo Character.AI activado', brandImageSrc ? 'con imagen personalizada' : '');
  }

  /**
   * Activar modo WhatsApp
   * @param {boolean} useAvatarBackground - Si usar imagen de avatar como fondo
   */
  setWhatsAppMode(useAvatarBackground = false) {
    this.currentMode = 'whatsapp';
    this._updateOverlayClasses();

    // Configurar imagen de fondo si se solicita
    if (useAvatarBackground) {
      this._setAvatarBackground();
    } else {
      this._clearAvatarBackground();
    }

    // Configurar contenido
    if (this.elements.callTitle) {
      this.elements.callTitle.textContent = 'Asistente Virtual';
    }
    if (this.elements.callStatus) {
      this.elements.callStatus.textContent = 'Llamada de voz activa';
    }

    console.log(`✅ Modo WhatsApp activado ${useAvatarBackground ? 'con' : 'sin'} avatar de fondo`);
  }

  /**
   * Mostrar/ocultar voice call overlay
   * @param {boolean} show - Si mostrar el overlay
   */
  setVisible(show) {
    if (!this.elements.callOverlay) return;

    this.isActive = show;

    if (show) {
      this.elements.callOverlay.classList.add('active');
      this.elements.callOverlay.setAttribute('aria-hidden', 'false');
    } else {
      this.elements.callOverlay.classList.remove('active');
      this.elements.callOverlay.setAttribute('aria-hidden', 'true');
      this.hideVoiceActivity();
      this._clearAvatarBackground();
    }

    console.log(`🎤 Voice call overlay: ${show ? 'VISIBLE' : 'OCULTO'}`);
  }

  /**
   * Mostrar/ocultar indicador de voice activity
   * @param {boolean} show - Si mostrar el indicador
   */
  showVoiceActivity(show) {
    if (!this.elements.voiceActivity) return;

    this.isVoiceActivityVisible = show;
    this.elements.voiceActivity.style.display = show ? 'flex' : 'none';

    if (show && this.elements.callStatus) {
      this.elements.callStatus.textContent = 'Escuchando...';
    }
  }

  /**
   * Ocultar voice activity
   */
  hideVoiceActivity() {
    this.showVoiceActivity(false);
    this.isThinking = false;

    if (this.elements.voiceActivity) {
      this.elements.voiceActivity.classList.remove('thinking');
    }

    // Restaurar texto de estado original
    if (this.elements.callStatus) {
      const defaultText =
        this.currentMode === 'character' ? 'Empieza a hablar' : 'Llamada de voz activa';
      this.elements.callStatus.textContent = defaultText;
    }
  }

  /**
   * Activar/desactivar estado "thinking"
   * @param {boolean} thinking - Si el bot está pensando
   */
  setThinking(thinking) {
    if (!this.elements.voiceActivity) return;

    this.isThinking = thinking;

    if (thinking) {
      this.showVoiceActivity(true);
      this.elements.voiceActivity.classList.add('thinking');
      if (this.elements.callStatus) {
        this.elements.callStatus.textContent = 'Procesando...';
      }
    } else {
      this.elements.voiceActivity.classList.remove('thinking');
      if (!this.isVoiceActivityVisible) {
        this.hideVoiceActivity();
      }
    }
  }

  /**
   * Actualizar estado del llamada
   * @param {string} status - Nuevo texto de estado
   */
  updateStatus(status) {
    if (this.elements.callStatus) {
      this.elements.callStatus.textContent = status;
    }

    console.log(`🎤 Voice Call Status: ${status}`);
  }

  /**
   * Actualizar estado con lógica automática según el modo
   * @param {string} state - Estado: 'initial', 'listening', 'processing', 'responding'
   */
  updateVoiceState(state) {
    const stateMap = {
      initial: this.currentMode === 'character' ? 'Empieza a hablar' : 'Llamada de voz activa',
      listening: 'Escuchando...',
      processing: 'Procesando...',
      responding: 'Respondiendo...',
    };

    const statusText = stateMap[state] || stateMap['initial'];
    this.updateStatus(statusText);

    // Actualizar indicadores visuales
    switch (state) {
      case 'listening':
        this.showVoiceActivity(true);
        this.setThinking(false);
        break;
      case 'processing':
        this.showVoiceActivity(false);
        this.setThinking(true);
        break;
      case 'responding':
        this.showVoiceActivity(false);
        this.setThinking(false);
        break;
      case 'initial':
      default:
        this.showVoiceActivity(false);
        this.setThinking(false);
        break;
    }
  }

  /**
   * Configurar imagen del brand Character.AI
   * @param {string} imageSrc - URL de la imagen
   */
  setBrandImage(imageSrc) {
    if (this.elements.brandImage && imageSrc) {
      this.elements.brandImage.src = imageSrc;
      this.elements.brandImage.style.display = '';
      console.log('🖼️ Imagen de brand Character.AI configurada:', imageSrc);
    }
  }

  /**
   * Obtener estado actual
   */
  getState() {
    return {
      currentMode: this.currentMode,
      isActive: this.isActive,
      isVoiceActivityVisible: this.isVoiceActivityVisible,
      isThinking: this.isThinking,
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Actualizar clases CSS del overlay según el modo
   * @private
   */
  _updateOverlayClasses() {
    if (!this.elements.callOverlay) return;

    // Remover clases existentes de modo
    this.elements.callOverlay.classList.remove(
      'voice-mode-character',
      'voice-mode-whatsapp',
      'has-avatar'
    );

    // Añadir clase del modo actual
    this.elements.callOverlay.classList.add(`voice-mode-${this.currentMode}`);
  }

  /**
   * Configurar imagen de avatar como fondo
   * @private
   */
  _setAvatarBackground() {
    if (!this.elements.callOverlay) return;

    // Buscar imagen de avatar
    const avatarImg = this.elements.avatarImage || document.querySelector('.avatar-image');
    if (avatarImg && !avatarImg.style.display.includes('none') && avatarImg.src) {
      this.elements.callOverlay.style.backgroundImage = `url(${avatarImg.src})`;
      this.elements.callOverlay.classList.add('has-avatar');
    } else {
      // Usar imagen de demo si no hay avatar real
      this._setDemoBackground();
    }
  }

  /**
   * Configurar imagen de demo como fondo
   * @private
   */
  _setDemoBackground() {
    if (!this.elements.callOverlay) return;

    const demoBackground = `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Cdefs%3E%3CradialGradient id="faceGrad" cx="50%25" cy="40%25" r="60%25"%3E%3Cstop offset="0%25" style="stop-color:%23f4a261;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23e76f51;stop-opacity:1" /%3E%3C/radialGradient%3E%3ClinearGradient id="bgGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%232a3942;stop-opacity:1" /%3E%3Cstop offset="50%25" style="stop-color:%23667781;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%234a5568;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23bgGrad)"/%3E%3Cellipse cx="200" cy="200" rx="120" ry="140" fill="url(%23faceGrad)" opacity="0.9"/%3E%3Ccircle cx="170" cy="180" r="8" fill="%23333"/%3E%3Ccircle cx="230" cy="180" r="8" fill="%23333"/%3E%3Cellipse cx="200" cy="210" rx="6" ry="4" fill="%23333" opacity="0.8"/%3E%3Cpath d="M 180 230 Q 200 250 220 230" stroke="%23333" stroke-width="3" fill="none" opacity="0.7"/%3E%3C/svg%3E')`;

    this.elements.callOverlay.style.backgroundImage = demoBackground;
    this.elements.callOverlay.classList.add('has-avatar');
  }

  /**
   * Limpiar imagen de fondo
   * @private
   */
  _clearAvatarBackground() {
    if (!this.elements.callOverlay) return;

    this.elements.callOverlay.style.backgroundImage = '';
    this.elements.callOverlay.classList.remove('has-avatar');
  }
}

// ==========================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ==========================================

/**
 * Integrar VoiceCallManager con UIManager existente
 */
function integrateVoiceCallWithUI() {
  // Verificar si UIManager existe
  if (typeof window.UIManager === 'undefined') {
    console.warn('⚠️ UIManager no encontrado, voice call funcionará de forma independiente');
    return;
  }

  // Crear instancia global de VoiceCallManager
  window.voiceCallManager = new VoiceCallManager();

  // Extender UIManager con métodos de voice call
  const originalShowVoiceMode = window.UIManager.prototype.showVoiceMode;

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
   * @param {'character'|'whatsapp'} mode - Tipo de interfaz visual
   * @param {boolean} useAvatarBackground - Solo WhatsApp: usar imagen como fondo pantalla completa
   * @param {string|null} brandImageSrc - Solo Character.AI: URL imagen personalizada del logo
   */
  window.UIManager.prototype.setVoiceCallMode = function (
    mode,
    useAvatarBackground = false,
    brandImageSrc = null
  ) {
    if (!window.voiceCallManager) return;

    if (mode === 'character') {
      window.voiceCallManager.setCharacterMode(brandImageSrc);
    } else if (mode === 'whatsapp') {
      window.voiceCallManager.setWhatsAppMode(useAvatarBackground);
    }
  };

  // Añadir método para configurar imagen de brand
  window.UIManager.prototype.setVoiceCallBrandImage = function (imageSrc) {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setBrandImage(imageSrc);
  };

  // ✨ NUEVO: Métodos para manejar estados de voz
  window.UIManager.prototype.updateVoiceCallStatus = function (status) {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.updateStatus(status);
  };

  window.UIManager.prototype.updateVoiceCallState = function (state) {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.updateVoiceState(state);
  };

  // Integrar voice activity
  const originalUpdateVoiceActivity = window.UIManager.prototype.updateVoiceActivity;

  window.UIManager.prototype.updateVoiceActivity = function (active, level = 0) {
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

  console.log('🔗 VoiceCallManager integrado con UIManager');
}

// ==========================================
// FUNCIONES GLOBALES PARA DESARROLLO/TESTING
// ==========================================

/**
 * Funciones globales para testing (remover en producción)
 */
window.voiceCallDemo = {
  showCharacter: (brandImageSrc = null) => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setCharacterMode(brandImageSrc);
    window.voiceCallManager.setVisible(true);
  },

  showWhatsApp: () => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setWhatsAppMode(false);
    window.voiceCallManager.setVisible(true);
  },

  showWhatsAppWithAvatar: () => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setWhatsAppMode(true);
    window.voiceCallManager.setVisible(true);
  },

  setBrandImage: (imageSrc) => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setBrandImage(imageSrc);
  },

  // ✨ NUEVAS: Funciones para testear estados
  setState: (state) => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.updateVoiceState(state);
  },

  setStatus: (status) => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.updateStatus(status);
  },

  simulateConversation: () => {
    if (!window.voiceCallManager) return;
    console.log('🎭 Simulando conversación completa...');

    // Secuencia automática para testing
    setTimeout(() => window.voiceCallManager.updateVoiceState('listening'), 1000);
    setTimeout(() => window.voiceCallManager.updateVoiceState('processing'), 3000);
    setTimeout(() => window.voiceCallManager.updateVoiceState('responding'), 5000);
    setTimeout(() => window.voiceCallManager.updateVoiceState('initial'), 8000);
  },

  hide: () => {
    if (!window.voiceCallManager) return;
    window.voiceCallManager.setVisible(false);
  },

  toggleVoice: () => {
    if (!window.voiceCallManager) return;
    const isVisible = window.voiceCallManager.isVoiceActivityVisible;
    window.voiceCallManager.showVoiceActivity(!isVisible);
  },

  toggleThinking: () => {
    if (!window.voiceCallManager) return;
    const isThinking = window.voiceCallManager.isThinking;
    window.voiceCallManager.setThinking(!isThinking);
  },
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  // Esperar un poco para asegurar que otros scripts se carguen
  setTimeout(() => {
    integrateVoiceCallWithUI();

    if (window.voiceCallManager) {
      // Configurar modo por defecto
      window.voiceCallManager.setCharacterMode();

      console.log('🎤 Voice Call System listo');
      console.log('🎮 Comandos de testing disponibles en window.voiceCallDemo');
    }
  }, 100);
});

// Keyboard shortcuts para desarrollo
document.addEventListener('keydown', function (e) {
  // Solo en desarrollo (puedes remover esto en producción)
  if (e.ctrlKey && e.shiftKey) {
    switch (e.key) {
      case '1':
        e.preventDefault();
        window.voiceCallDemo?.showCharacter();
        break;
      case '2':
        e.preventDefault();
        window.voiceCallDemo?.showWhatsApp();
        break;
      case '3':
        e.preventDefault();
        window.voiceCallDemo?.showWhatsAppWithAvatar();
        break;
      case 'H':
        e.preventDefault();
        window.voiceCallDemo?.hide();
        break;
    }
  }
});
