/**
 * UI Manager v1.0 - CLEAN CODE Implementation
 * Eliminado: Sistema de audio replay complejo (200+ líneas)
 * Siguiendo: SOLID + DRY + Single Responsibility
 */
class UIManager {
  constructor() {
    this.elements = this._getElements();
    this.state = {
      isVoiceMode: false,
      audioEnabled: false,
      micActive: false,
      messageCount: 0,
      toastContainer: null,
      // Voice state tracking
      userSpeaking: false,
      botThinking: false,
      voiceActivityLevel: 0,
      lastLatencyMeasurement: 0,
      connectionQuality: 'unknown',
      // Separate typing states
      showingTypingIndicator: false,
      showingBotThinking: false,
    };

    // Voice timers for smooth UX
    this.voiceTimers = {
      thinkingIndicator: null,
      subtitleTimeout: null,
      activityTimeout: null,
      statusUpdateTimer: null,
      latencyDisplayTimer: null,
      typingTimeout: null,
    };

    // ✅ SIMPLIFIED: Audio replay state - solo 3 variables
    this.lastBotMessageElement = null; // Solo el último mensaje del bot
    this.lastBotAudioTrack = null; // Solo el último track
    this.currentReplayButton = null; // Solo el botón actual

    // Agent reference for replay
    this.agent = null;

    // Initialize UI components
    this._initializeToastContainer();
    this._setupEventListeners();
    this._initializeAudioButton();
    this._initializeVoiceIndicators();

    console.log('🎨 UIManager v1.0 - Clean & Simplified');
    console.log('✅ Eliminado sistema de audio replay complejo');
  }

  /**
   * Get required DOM elements with validation
   */
  _getElements() {
    const elements = {
      // Status
      status: document.getElementById('status'),
      statusText: document.getElementById('status-text'),
      connectionQuality: document.getElementById('connection-quality'),

      // Chat
      chatContainer: document.getElementById('chat-messages'),
      textInput: document.getElementById('chatInput'),
      sendBtn: document.getElementById('sendBtn'),
      messageForm: document.getElementById('messageForm'),
      typingIndicator: document.getElementById('typing-indicator'),

      // Voice controls
      callBtn: document.getElementById('callBtn'),
      callOverlay: document.getElementById('call-overlay'),
      callStatus: document.getElementById('call-status'),
      hangupBtn: document.getElementById('hangupBtn'),
      muteBtn: document.getElementById('muteBtn'),

      // Audio
      audioBtn: document.getElementById('audioBtn'),

      // Subtitles and voice activity
      callSubtitles: document.getElementById('call-subtitles'),
      voiceActivity: document.getElementById('voice-activity'),
      voiceActivityLabel: document.getElementById('voiceActivityLabel'),
    };

    // Validate critical elements
    const required = [
      'chatContainer',
      'textInput',
      'sendBtn',
      'callBtn',
      'messageForm',
      'typingIndicator',
    ];
    const missing = required.filter((id) => !elements[id]);

    if (missing.length > 0) {
      throw new Error(`❌ Missing UI elements: ${missing.join(', ')}`);
    }

    return elements;
  }

  /**
   * Initialize toast container
   */
  _initializeToastContainer() {
    if (this.state.toastContainer) return;

    try {
      this.state.toastContainer = document.createElement('div');
      this.state.toastContainer.id = 'toast-container';
      this.state.toastContainer.className =
        'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
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
      console.error('Failed to create toast container:', error);
    }
  }

  /**
   * Initialize voice indicators
   */
  _initializeVoiceIndicators() {
    if (this.elements.voiceActivity) {
      console.log('✅ Voice activity indicators initialized');
    }
  }

  /**
   * Initialize audio button state
   */
  _initializeAudioButton() {
    this.updateAudioState(false);
  }

  /**
   * ✅ SIMPLIFIED: Setup event listeners - eliminada complejidad de audio replay
   */
  _setupEventListeners() {
    // Text input and form submission
    this.elements.messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleTextSend();
    });

    this.elements.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleTextSend();
      }
    });

    // Auto-resize textarea if converted later
    this.elements.textInput.addEventListener('input', (e) => {
      this._handleInputResize(e.target);
    });

    // Voice controls
    this.elements.callBtn.addEventListener('click', () => {
      if (CONFIG.debug.showUIEvents) {
        console.log('🎨 Call button clicked, current voice mode:', this.state.isVoiceMode);
      }
      this._emitUIEvent('voiceToggle');
    });

    this.elements.hangupBtn.addEventListener('click', () => {
      if (CONFIG.debug.showUIEvents) {
        console.log('🎨 Hangup button clicked');
      }

      // Prevent multiple rapid clicks
      if (this.elements.hangupBtn.disabled) return;

      this.elements.hangupBtn.disabled = true;
      setTimeout(() => {
        this.elements.hangupBtn.disabled = false;
      }, 2000);

      this._emitUIEvent('voiceEnd');
    });

    this.elements.muteBtn.addEventListener('click', () => {
      this._emitUIEvent('muteToggle');
    });

    // Audio control
    this.elements.audioBtn.addEventListener('click', () => {
      this._emitUIEvent('audioToggle');
    });

    // Keyboard shortcuts
    if (CONFIG.features.keyboardShortcuts) {
      this._setupKeyboardShortcuts();
    }

    // Click overlay background to end call
    if (this.elements.callOverlay) {
      this.elements.callOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.callOverlay) {
          this._emitUIEvent('voiceEnd');
        }
      });
    }

    // Prevent double tap zoom on iOS
    this._preventDoubleTabZoom();
  }

  /**
   * Prevent double tap zoom
   */
  _preventDoubleTabZoom() {
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      (event) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );
  }

  /**
   * Handle input resize
   */
  _handleInputResize(element) {
    if (element.tagName === 'TEXTAREA') {
      element.style.height = 'auto';
      element.style.height = Math.min(element.scrollHeight, 120) + 'px';
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape to end call
      if (e.key === 'Escape' && this.state.isVoiceMode) {
        e.preventDefault();
        this._emitUIEvent('voiceEnd');
        return;
      }

      // Ctrl+Shift+V to toggle voice
      if (e.key === 'v' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this._emitUIEvent('voiceToggle');
        return;
      }

      // Ctrl+Shift+M to toggle mute (only in voice mode)
      if (e.key === 'm' && e.ctrlKey && e.shiftKey && this.state.isVoiceMode) {
        e.preventDefault();
        this._emitUIEvent('muteToggle');
        return;
      }

      // Ctrl+Enter to send message
      if (e.key === 'Enter' && e.ctrlKey && document.activeElement === this.elements.textInput) {
        e.preventDefault();
        this._handleTextSend();
        return;
      }
    });
  }

  /**
   * Handle text message sending with improved feedback
   */
  _handleTextSend() {
    const text = this.elements.textInput.value.trim();
    if (text) {
      this._setButtonState(this.elements.sendBtn, 'sending');

      this._emitUIEvent('textSend', text);
      this.elements.textInput.value = '';
      this.elements.textInput.focus();

      // Re-enable after delay
      setTimeout(() => {
        this._setButtonState(this.elements.sendBtn, 'normal');
      }, 1000);
    }
  }

  /**
   * Handle button states
   */
  _setButtonState(button, state) {
    const icon = button.querySelector('i');
    if (!icon) return;

    switch (state) {
      case 'sending':
        button.disabled = true;
        icon.className = 'fas fa-spinner fa-spin';
        break;
      case 'normal':
      default:
        button.disabled = false;
        icon.className = 'fas fa-paper-plane';
        break;
    }
  }

  /**
   * Update connection status with improved visual feedback
   */
  updateStatus(status, type = 'connecting') {
    if (!this.elements.status) return;

    this.elements.status.className = `connection-status status-${type}`;

    if (this.elements.statusText) {
      this.elements.statusText.textContent = status;
    }

    // Show latency if in voice mode and debugging enabled
    if (
      this.state.isVoiceMode &&
      CONFIG.debug.showLatencyMetrics &&
      this.state.lastLatencyMeasurement > 0
    ) {
      this._updateLatencyDisplay();
    }

    if (CONFIG.debug.showUIEvents) {
      console.log(`🎨 Status updated: ${status} (${type})`);
    }
  }

  /**
   * Update latency display
   */
  _updateLatencyDisplay() {
    if (!this.elements.connectionQuality) return;

    const latency = this.state.lastLatencyMeasurement;
    const latencyColor =
      latency > 800 ? 'quality-poor' : latency > 400 ? 'quality-good' : 'quality-excellent';

    this.elements.connectionQuality.textContent = `${latency}ms`;
    this.elements.connectionQuality.className = `connection-quality ${latencyColor}`;
  }

  /**
   * Update connection quality indicator
   */
  updateConnectionQuality(quality) {
    this.state.connectionQuality = quality;

    if (!this.elements.connectionQuality) return;

    const qualityMap = {
      excellent: { text: '●●●', class: 'quality-excellent' },
      good: { text: '●●○', class: 'quality-good' },
      poor: { text: '●○○', class: 'quality-poor' },
      lost: { text: '○○○', class: 'quality-lost' },
    };

    const qualityInfo = qualityMap[quality] || qualityMap['good'];

    if (!CONFIG.debug.showLatencyMetrics) {
      this.elements.connectionQuality.textContent = qualityInfo.text;
    }
    this.elements.connectionQuality.className = `connection-quality ${qualityInfo.class}`;
  }

  /**
   * ✅ SIMPLIFIED: Add message to chat - eliminada complejidad de audio replay
   */
  addMessage(content, sender = 'bot', isStreaming = false) {
    if (!content || !this.elements.chatContainer) return null;

    try {
      const messageEl = document.createElement('article');
      messageEl.className = `message-bubble ${sender}`;
      messageEl.setAttribute('role', 'listitem');

      const formattedContent = this._formatMessageContent(content);
      messageEl.innerHTML = formattedContent;

      if (isStreaming) {
        messageEl.classList.add('streaming');
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = '|';
        messageEl.appendChild(cursor);
      } else {
        this._addTimestamp(messageEl, sender);

        // ✅ SIMPLE: Solo último mensaje del bot puede tener replay button
        if (sender === 'bot') {
          this._handleBotMessageAdded(messageEl);
        }
      }

      this.elements.chatContainer.appendChild(messageEl);
      this._scrollToBottom();
      this._limitMessages();
      this.state.messageCount++;

      return messageEl;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * ✅ SIMPLE: Handle when bot message is added
   */
  _handleBotMessageAdded(messageEl) {
    // Remove replay button from previous message
    this._removeCurrentReplayButton();

    // Set as last bot message
    this.lastBotMessageElement = messageEl;
    if (this.lastBotAudioTrack) {
      this._addReplayButtonToMessage(messageEl, { track: this.lastBotAudioTrack });
    }
    if (CONFIG.debug.showUIEvents) {
      console.log('🎨 Bot message added, ready for audio track');
    }
  }

  /**
   * ✅ NUEVO: Handle cuando el audio track del bot está listo
   */
  handleBotAudioTrackReady(audioTrackData) {
    // ✅ Guardar siempre el track
    this.lastBotAudioTrack = audioTrackData.track;

    // ✅ Buscar último mensaje bot en DOM
    const lastBotMsg = this.elements.chatContainer.querySelector(
      '.message-bubble.bot:last-of-type'
    );

    if (lastBotMsg) {
      this._addReplayButtonToMessage(lastBotMsg, audioTrackData);
    }

    if (CONFIG.debug.showUIEvents) {
      console.log('🎵 Replay button added to last bot message');
    }
  }

  /**
   * ✅ SIMPLE: Add replay button to message
   */
  _addReplayButtonToMessage(messageEl, audioTrackData) {
    // Remove existing button if any
    const existingBtn = messageEl.querySelector('.tts-replay-btn');
    if (existingBtn) {
      existingBtn.remove();
    }

    const timestamp = messageEl.querySelector('.timestamp');
    if (timestamp) {
      const replayBtn = document.createElement('button');
      replayBtn.className = 'tts-replay-btn audio-play-btn';
      replayBtn.innerHTML = '<i class="fas fa-volume-high"></i>';
      replayBtn.title = `Reproducir respuesta (${audioTrackData.text || 'audio'})`;
      replayBtn.style.cssText = 'width:20px;height:20px;font-size:10px;margin-left:6px;';

      replayBtn.onclick = async () => {
        await this._handleReplayClick(replayBtn, audioTrackData.track);
      };

      timestamp.appendChild(replayBtn);

      // Track current button
      this.currentReplayButton = replayBtn;

      if (CONFIG.debug.showUIEvents) {
        console.log('✅ Replay button added to last bot message');
      }
    }
  }

  /**
   * ✅ SIMPLE: Handle replay button click
   */
  async _handleReplayClick(button, audioTrack) {
    const icon = button.querySelector('i');
    const originalIconClass = icon.className;

    // Show loading state
    icon.className = 'fas fa-spinner fa-spin';

    try {
      let success = false;

      if (this.agent && this.agent.replayLastBotTTS) {
        // Use agent method if available
        success = await this.agent.replayLastBotTTS();
      } else if (audioTrack) {
        // Direct replay fallback
        success = await this._replayAudioTrackDirect(audioTrack);
      }

      // Show feedback
      icon.className = success ? 'fas fa-check' : 'fas fa-exclamation-triangle';

      // Restore original icon
      setTimeout(
        () => {
          icon.className = originalIconClass;
        },
        success ? 1500 : 2000
      );

      if (CONFIG.debug.showUIEvents) {
        console.log('🎵 Replay result:', success);
      }
    } catch (error) {
      console.error('❌ Error in replay:', error);
      icon.className = 'fas fa-exclamation-triangle';
      setTimeout(() => (icon.className = originalIconClass), 2000);
    }
  }

  /**
   * ✅ SIMPLE: Direct audio track replay
   */
  async _replayAudioTrackDirect(audioTrack) {
    try {
      const audioEl = audioTrack.attach();
      audioEl.volume = 1.0;
      await audioEl.play();

      // Auto-cleanup when finished
      audioEl.onended = () => {
        if (audioEl.parentNode) {
          audioEl.parentNode.removeChild(audioEl);
        }
      };

      return true;
    } catch (error) {
      console.error('❌ Direct replay failed:', error);
      return false;
    }
  }

  /**
   * ✅ SIMPLE: Remove current replay button
   */
  _removeCurrentReplayButton() {
    if (this.currentReplayButton && this.currentReplayButton.parentNode) {
      this.currentReplayButton.parentNode.removeChild(this.currentReplayButton);
      this.currentReplayButton = null;
    }
  }

  /**
   * Update streaming message content
   */
  updateStreamingMessage(messageEl, content, isFinal = false) {
    if (!messageEl || !content) return;

    try {
      const formattedContent = this._formatMessageContent(content);

      if (isFinal) {
        messageEl.classList.remove('streaming');
        const cursor = messageEl.querySelector('.cursor');
        if (cursor) cursor.remove();

        messageEl.innerHTML = formattedContent;
        this._addTimestamp(messageEl, 'bot');

        // Handle final bot message
        if (messageEl.classList.contains('bot')) {
          this._handleBotMessageAdded(messageEl);
        }
      } else {
        const cursor = messageEl.querySelector('.cursor');
        messageEl.innerHTML = formattedContent;
        if (cursor) {
          messageEl.appendChild(cursor);
        }
      }

      this._scrollToBottom();
    } catch (error) {
      console.error('Error updating streaming message:', error);
    }
  }

  /**
   * Format message content safely
   */
  _formatMessageContent(content) {
    const escaped = this._escapeHTML(content);
    return escaped.replace(/\n/g, '<br>');
  }

  /**
   * Add timestamp to message
   */
  _addTimestamp(messageEl, sender) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const timeEl = document.createElement('time');
    timeEl.setAttribute('datetime', now.toISOString());
    timeEl.className = 'timestamp';

    const checkIcon = sender === 'user' ? 'fa-check-double text-blue-400' : 'fa-check';
    timeEl.innerHTML = `
            ${timeStr}
            <i class="tick fas ${checkIcon}" aria-hidden="true"></i>
        `;

    messageEl.appendChild(timeEl);
  }

  /**
   * Show/hide typing indicator
   */
  showTypingIndicator(show) {
    if (!this.elements.typingIndicator) {
      console.warn('🎨 Typing indicator element not found');
      return;
    }

    if (this.state.showingTypingIndicator !== show) {
      if (CONFIG.debug.showUIEvents) {
        console.log(`🎨 Typing indicator: ${show ? 'SHOWN' : 'HIDDEN'}`);
      }
    }

    this.state.showingTypingIndicator = show;

    // SIMPLE RULE: Show typing indicator in text mode, not in voice mode
    const shouldShow = show && !this.state.isVoiceMode;

    this.elements.typingIndicator.style.display = shouldShow ? 'block' : 'none';

    if (shouldShow) {
      this.elements.typingIndicator.style.visibility = 'visible';
      this.elements.typingIndicator.style.opacity = '1';
      this._scrollToBottom();

      // Auto-hide after timeout
      clearTimeout(this.voiceTimers.typingTimeout);
      this.voiceTimers.typingTimeout = setTimeout(() => {
        if (this.state.showingTypingIndicator) {
          this.showTypingIndicator(false);
        }
      }, CONFIG.ui.chat.typingIndicatorTimeout || 10000);
    } else {
      clearTimeout(this.voiceTimers.typingTimeout);
    }
  }

  /**
   * Show bot thinking indicator (voice mode only)
   */
  showBotThinking(show) {
    this.state.botThinking = show;
    this.state.showingBotThinking = show;

    // Only show in voice mode
    if (!this.state.isVoiceMode || !this.elements.callSubtitles) return;

    clearTimeout(this.voiceTimers.thinkingIndicator);

    if (show) {
      this.voiceTimers.thinkingIndicator = setTimeout(() => {
        if (this.state.botThinking && this.state.isVoiceMode) {
          this.elements.callSubtitles.style.display = 'block';
          this.elements.callSubtitles.innerHTML = `
                        <div class="subtitle-content">
                            <i class="fas fa-brain fa-pulse" style="color: var(--color-warning); margin-right: 8px;"></i>
                            <span>Procesando...</span>
                        </div>
                    `;

          this._updateVoiceActivityThinking(true);
        }
      }, CONFIG.ui.call.thinkingIndicatorDelay || 300);
    } else {
      this.elements.callSubtitles.style.display = 'none';
      this._updateVoiceActivityThinking(false);
    }

    if (CONFIG.debug.showUIEvents) {
      console.log('🎨 Bot thinking (voice mode):', show ? 'shown' : 'hidden');
    }
  }

  /**
   * Update voice activity thinking state
   */
  _updateVoiceActivityThinking(thinking) {
    if (!this.elements.voiceActivity) return;

    const activityIndicator = this.elements.voiceActivity.querySelector('.voice-activity-content');

    if (activityIndicator) {
      if (thinking) {
        activityIndicator.classList.add('thinking');
      } else {
        activityIndicator.classList.remove('thinking');
      }
    }
  }

  /**
   * Update voice activity state
   */
  updateVoiceActivity(active, level = 0) {
    this.state.userSpeaking = active;
    this.state.voiceActivityLevel = level;

    if (!this.state.isVoiceMode || !this.elements.voiceActivity) return;

    const activityIndicator = this.elements.voiceActivity.querySelector('.voice-activity-content');

    if (activityIndicator) {
      if (active) {
        // User speaking - more intense green
        activityIndicator.classList.remove('thinking');
        activityIndicator.style.background = 'rgba(0, 168, 132, 1)';
        activityIndicator.style.transform = 'scale(1.1)';
      } else if (!this.state.botThinking) {
        // Normal state - soft green
        activityIndicator.style.background = 'rgba(0, 168, 132, 0.9)';
        activityIndicator.style.transform = 'scale(1)';
      }
    }
  }

  /**
   * Update voice response latency display
   */
  updateVoiceLatency(latencyMs) {
    this.state.lastLatencyMeasurement = latencyMs;

    if (CONFIG.debug.showLatencyMetrics && this.state.isVoiceMode) {
      this._updateLatencyDisplay();

      if (latencyMs > CONFIG.debug.voiceLatencyWarningThreshold) {
        this.showToast(`Slow response: ${latencyMs}ms`, 'warning', 3000);
      }
    }
  }

  /**
   * Update connection badge
   */
  updateConnectionBadge(quality, latencyMs = 0) {
    if (!CONFIG.ui.notifications.connectionBadge.enabled) return;

    const badge = document.getElementById('connection-badge');
    if (!badge) return;

    const qualityMap = {
      excellent: { dots: '●●●', color: 'quality-excellent' },
      good: { dots: '●●○', color: 'quality-good' },
      poor: { dots: '●○○', color: 'quality-poor' },
      lost: { dots: '○○○', color: 'quality-lost' },
    };

    const qualityInfo = qualityMap[quality] || qualityMap['good'];

    badge.className = `connection-badge ${qualityInfo.color}`;

    const dotsSpan = badge.querySelector('.quality-dots');
    const latencySpan = badge.querySelector('.latency-text');

    if (dotsSpan) dotsSpan.textContent = qualityInfo.dots;
    if (latencySpan && latencyMs > 0) {
      latencySpan.textContent = `${latencyMs.toFixed(0)}ms`;
    }

    this.showConnectionBadge(true);

    if (CONFIG.debug.showUIEvents) {
      console.log(`📶 Connection badge: ${quality} (${latencyMs}ms)`);
    }
  }

  /**
   * Show/hide connection badge
   */
  showConnectionBadge(show) {
    if (!CONFIG.ui.notifications.connectionBadge.enabled) return;

    const badge = document.getElementById('connection-badge');
    if (!badge) return;

    badge.style.display = show ? 'flex' : 'none';

    if (CONFIG.debug.showUIEvents) {
      console.log(`📶 Connection badge: ${show ? 'SHOWN' : 'HIDDEN'}`);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = CONFIG.ui.notifications.duration) {
    if (!CONFIG.ui.notifications.enabled) return;

    if (!this.state.toastContainer || !message) {
      console.log(`[${type.toUpperCase()}] ${message}`);
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
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      });

      setTimeout(() => this._removeToast(toast), duration);
    } catch (error) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Create toast element
   */
  _createToastElement(message, type) {
    const toast = document.createElement('div');

    const typeClasses = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info',
    };

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle',
    };

    toast.className = `toast-base ${typeClasses[type] || typeClasses.info}`;

    toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon" aria-hidden="true"></i>
            <span class="toast-content">${this._escapeHTML(message)}</span>
            <button onclick="this.parentElement.remove()"
                    class="toast-close-btn"
                    aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

    return toast;
  }

  /**
   * Remove toast with animation
   */
  _removeToast(toast) {
    if (toast && toast.parentElement) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }

  /**
   * Show/hide voice mode overlay
   */
  showVoiceMode(show) {
    this.state.isVoiceMode = show;

    if (show) {
      this.elements.callOverlay.classList.add('active');
      this.elements.callOverlay.setAttribute('aria-hidden', 'false');

      if (this.elements.callStatus) {
        this.elements.callStatus.innerHTML = `
                    <i class="fas fa-spinner fa-spin" style="margin-right: 8px;" aria-hidden="true"></i>
                    ${CONFIG.status.VOICE_STARTING}
                `;
      }

      // Update call button
      const callIcon = this.elements.callBtn.querySelector('i');
      if (callIcon) {
        callIcon.className = 'fas fa-phone-slash';
        this.elements.callBtn.title = 'End voice call';
        this.elements.callBtn.setAttribute('aria-label', 'End voice call');
        this.elements.callBtn.classList.add('active');
      }

      this._showVoiceActivity(true);

      if (this.state.showingTypingIndicator) {
        this.showTypingIndicator(false);
      }

      setTimeout(() => {
        if (this.state.isVoiceMode && this.elements.callStatus) {
          this.elements.callStatus.textContent = CONFIG.status.VOICE_ACTIVE;
        }
      }, 1500);
    } else {
      this.elements.callOverlay.classList.remove('active');
      this.elements.callOverlay.setAttribute('aria-hidden', 'true');

      if (this.elements.callStatus) {
        this.elements.callStatus.textContent = 'Call ended';
      }

      // Reset call button
      const callIcon = this.elements.callBtn.querySelector('i');
      if (callIcon) {
        callIcon.className = 'fas fa-phone';
        this.elements.callBtn.title = 'Start voice call';
        this.elements.callBtn.setAttribute('aria-label', 'Start voice call');
        this.elements.callBtn.classList.remove('active');
      }

      this._showVoiceActivity(false);
      this.hideSubtitles();
      this.showBotThinking(false);

      // Clear voice timers
      Object.values(this.voiceTimers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });

      // Reset voice state
      this.state.userSpeaking = false;
      this.state.botThinking = false;
      this.state.voiceActivityLevel = 0;
      this.state.showingBotThinking = false;
    }

    if (CONFIG.debug.showUIEvents) {
      console.log(`🎨 Voice mode: ${show ? 'ACTIVATED' : 'DEACTIVATED'}`);
    }
  }

  /**
   * Show/hide voice activity indicator
   */
  _showVoiceActivity(show) {
    if (this.elements.voiceActivity) {
      this.elements.voiceActivity.style.display = show ? 'flex' : 'none';

      if (CONFIG.debug.showUIEvents) {
        console.log(`🎨 Voice activity indicator: ${show ? 'SHOWN' : 'HIDDEN'}`);
      }
    }
  }

  /**
   * Update microphone state
   */
  updateMicState(muted) {
    this.state.micActive = !muted;
    const muteIcon = this.elements.muteBtn.querySelector('i');

    if (muted) {
      if (muteIcon) muteIcon.className = 'fas fa-microphone-slash';
      this.elements.muteBtn.title = 'Unmute microphone';
      this.elements.muteBtn.setAttribute('aria-label', 'Unmute microphone');
      this.elements.muteBtn.className = 'call-control-btn mute-btn mic-muted';

      if (this.state.isVoiceMode && this.elements.voiceActivityLabel) {
        this.elements.voiceActivityLabel.textContent = 'Muted';
      }
    } else {
      if (muteIcon) muteIcon.className = 'fas fa-microphone';
      this.elements.muteBtn.title = 'Mute microphone';
      this.elements.muteBtn.setAttribute('aria-label', 'Mute microphone');
      this.elements.muteBtn.className = 'call-control-btn mute-btn mic-active';

      if (this.state.isVoiceMode && this.elements.voiceActivityLabel) {
        this.elements.voiceActivityLabel.textContent = 'Listening...';
      }
    }
  }

  /**
   * Update audio button state
   */
  updateAudioState(enabled) {
    this.state.audioEnabled = enabled;

    if (!this.elements.audioBtn) return;

    this.elements.audioBtn.style.display = 'flex';

    const icon = this.elements.audioBtn.querySelector('i');

    if (enabled) {
      if (icon) icon.className = 'fa-solid fa-volume-high';
      this.elements.audioBtn.title = 'Disable audio';
      this.elements.audioBtn.setAttribute('aria-label', 'Disable audio');

      this.elements.audioBtn.classList.remove('animate-pulse');
      this.elements.audioBtn.classList.add('enabled');

      if (CONFIG.debug.showUIEvents) {
        console.log('🎨 Audio button: ENABLED');
      }
    } else {
      if (icon) icon.className = 'fa-solid fa-volume-xmark';
      this.elements.audioBtn.title = 'Click to enable audio';
      this.elements.audioBtn.setAttribute('aria-label', 'Enable audio');

      this.elements.audioBtn.classList.remove('enabled');
      this.elements.audioBtn.classList.add('animate-pulse');

      if (CONFIG.debug.showUIEvents) {
        console.log('🎨 Audio button: DISABLED');
      }
    }
  }

  /**
   * Show subtitles during voice call
   */
  showSubtitles(text, isFinal = true) {
    if (!this.elements.callSubtitles || !this.state.isVoiceMode || !text) return;

    if (this.state.botThinking) return;

    this.elements.callSubtitles.style.display = 'block';

    const truncatedText =
      text.length > CONFIG.ui.call.subtitleMaxLength
        ? text.substring(0, CONFIG.ui.call.subtitleMaxLength) + '...'
        : text;

    this.elements.callSubtitles.innerHTML = `
            <div class="subtitle-content">
                ${this._escapeHTML(truncatedText)}
                ${!isFinal ? '<span class="subtitle-cursor">|</span>' : ''}
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
   * Hide subtitles
   */
  hideSubtitles() {
    if (this.elements.callSubtitles) {
      this.elements.callSubtitles.style.display = 'none';
    }
    clearTimeout(this.voiceTimers.subtitleTimeout);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.elements.chatContainer) {
      const welcome = this.elements.chatContainer.querySelector('.welcome-message');
      const typing = this.elements.typingIndicator;

      this.elements.chatContainer.innerHTML = '';

      if (welcome) this.elements.chatContainer.appendChild(welcome);
      if (typing) this.elements.chatContainer.appendChild(typing);

      this.state.messageCount = 0;

      // ✅ SIMPLE: Reset audio replay state
      this.lastBotMessageElement = null;
      this.lastBotAudioTrack = null;
      this.currentReplayButton = null;
    }
  }

  /**
   * Scroll chat to bottom
   */
  _scrollToBottom() {
    if (this.elements.chatContainer) {
      this.elements.chatContainer.scrollTo({
        top: this.elements.chatContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Limit message count for performance
   */
  _limitMessages() {
    const messages = this.elements.chatContainer.querySelectorAll('.message-bubble');
    const maxMessages = CONFIG.ui.chat.maxMessages;

    if (messages.length > maxMessages) {
      const toRemove = messages.length - maxMessages;
      for (let i = 0; i < toRemove; i++) {
        if (messages[i]) {
          messages[i].remove();
        }
      }
      this.state.messageCount = Math.max(0, this.state.messageCount - toRemove);

      // Check if we removed the last bot message
      if (this.lastBotMessageElement && !this.lastBotMessageElement.parentNode) {
        this.lastBotMessageElement = null;
        this.lastBotAudioTrack = null;
        this.currentReplayButton = null;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  _escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Emit UI event
   */
  _emitUIEvent(event, ...args) {
    const customEvent = new CustomEvent(`ui:${event}`, {
      detail: args,
    });
    document.dispatchEvent(customEvent);

    if (CONFIG.debug.showUIEvents) {
      console.log(`🎨 UI Event: ${event}`, args.length > 0 ? args : '');
    }
  }

  /**
   * Listen to UI events
   */
  on(event, callback) {
    document.addEventListener(`ui:${event}`, (e) => {
      try {
        callback(...e.detail);
      } catch (error) {
        console.error(`Error in UI event handler (${event}):`, error);
      }
    });
  }

  /**
   * ✅ SIMPLIFIED: Get current UI state
   */
  getState() {
    return {
      ...this.state,
      messageCount: this.state.messageCount,
      elementsConnected: Object.keys(this.elements).filter((key) => this.elements[key]).length,
      voiceTimersActive: Object.keys(this.voiceTimers).filter((key) => this.voiceTimers[key])
        .length,
      hasVoiceActivityIndicator: !!this.elements.voiceActivity,
      connectionQuality: this.state.connectionQuality,
      latencyDisplayEnabled: CONFIG.debug.showLatencyMetrics,
      typingIndicatorVisible: this.state.showingTypingIndicator,
      botThinkingVisible: this.state.showingBotThinking,
      connectionBadgeEnabled: CONFIG.ui.notifications.connectionBadge.enabled,
      connectionBadgeVisible: document.getElementById('connection-badge')?.style.display !== 'none',
      // ✅ SIMPLE: Audio replay state
      hasLastBotMessage: !!this.lastBotMessageElement,
      hasLastBotAudio: !!this.lastBotAudioTrack,
      hasCurrentReplayButton: !!this.currentReplayButton,
      hasAgent: !!this.agent,
    };
  }

  /**
   * ✅ SIMPLIFIED: Cleanup
   */
  cleanup() {
    // Clear voice timers
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
    };

    // Hide connection badge
    this.showConnectionBadge(false);

    // ✅ SIMPLE: Clear audio replay state
    this.lastBotMessageElement = null;
    this.lastBotAudioTrack = null;
    this.currentReplayButton = null;

    // Clean toast container
    if (this.state.toastContainer && this.state.toastContainer.parentElement) {
      this.state.toastContainer.remove();
    }

    // Reset visual states
    this.resetAllVisualStates();

    console.log('🧹 UIManager cleanup completed - Simplified');
  }

  /**
   * Reset all visual states
   */
  resetAllVisualStates() {
    try {
      // Reset audio button
      this.elements.audioBtn.className = 'control-btn audio-btn';

      // Reset call button
      this.elements.callBtn.className = 'control-btn call-btn';

      // Reset mute button
      this.elements.muteBtn.className = 'call-control-btn mute-btn';

      // Reset internal state
      this.state.isVoiceMode = false;
      this.state.audioEnabled = false;
      this.state.micActive = false;

      console.log('🔄 Visual states reset');
    } catch (error) {
      console.error('Error resetting states:', error);
    }
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
