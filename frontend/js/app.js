/**
 * Voice Agent Application v1.0 - CLEAN ORCHESTRATOR
 * Eliminado: Sistema de audio replay complejo (200+ líneas)
 * Target: <500ms voice response + Simple Audio Replay
 * Siguiendo: SOLID + DRY + Clean Code
 */
class VoiceAgentApp {
  constructor() {
    this.agent = null;
    this.ui = null;
    this.currentStreamingMessage = null;

    this.state = {
      initialized: false,
      ready: false,
      initializationAttempts: 0,
      maxInitializationAttempts: 3,
      // Voice performance tracking
      connectionStartTime: 0,
      voiceModeStartTime: 0,
      lastVoiceLatency: 0,
      appVersion: 'v1.0-clean-simplified',
    };

    // ✅ SIMPLIFIED: Voice metrics (only essential)
    this.voiceMetrics = {
      connectionTime: 0,
      voiceModeActivationTime: 0,
      averageResponseLatency: 0,
      responseCount: 0,
      fastestResponse: Infinity,
      slowestResponse: 0,
      totalErrors: 0,
      reconnectCount: 0,
    };

    // Bind methods for event handlers
    this._handleWindowUnload = this._handleWindowUnload.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

    console.log('🚀 VoiceAgentApp v1.0 - Clean & Simplified');
    console.log('⚡ Target: <500ms voice response + Simple Audio Replay');
    console.log('✅ Eliminado sistema de grabación complejo');
  }

  /**
   * 🚀 Initialize application
   */
  async init() {
    if (this.state.initialized) {
      console.warn('🚀 Application already initialized');
      return;
    }

    try {
      this.state.initializationAttempts++;
      this.state.connectionStartTime = performance.now();

      if (CONFIG.debug.enabled) {
        console.log(
          `🚀 Starting Clean Voice App v1.0 (attempt ${this.state.initializationAttempts})...`
        );
      }

      // Initialize components in sequence
      await this._initializeUI();
      await this._initializeVoiceOptimizedAgent();
      this._setupGlobalEventHandlers();

      // Track performance
      this.voiceMetrics.connectionTime = performance.now() - this.state.connectionStartTime;

      // Mark as initialized
      this.state.initialized = true;
      this.state.ready = true;

      console.log('✅ Clean Voice Application initialized successfully');
      console.log(`⚡ Connection time: ${this.voiceMetrics.connectionTime.toFixed(0)}ms`);
      console.log('🎵 Simple Audio Replay: Enabled');
    } catch (error) {
      console.error('❌ Critical error during initialization:', error);
      await this._handleInitializationError(error);
    }
  }

  /**
   * Initialize UI Manager
   */
  async _initializeUI() {
    try {
      this.ui = new UIManager();
      this._setupSimplifiedUIEventHandlers();
      this.ui.updateStatus(CONFIG.status.INITIALIZING, 'connecting');
    } catch (error) {
      throw new Error(`UI initialization failed: ${error.message}`);
    }
  }

  /**
   * ⚡ Initialize voice-optimized agent
   */
  async _initializeVoiceOptimizedAgent() {
    try {
      this.agent = new VoiceAgent();
      this.ui.agent = this.agent; // Connect UI with agent
      this._setupSimplifiedAgentEventHandlers();

      // Pre-warm connection if enabled
      if (CONFIG.livekit.features.enablePrepareConnection) {
        this.ui.updateStatus(CONFIG.status.OPTIMIZING_CONNECTION, 'connecting');

        try {
          await this.agent.prepareConnection();
          if (CONFIG.debug.enabled) {
            console.log('⚡ Connection pre-warmed for instant voice mode');
          }
        } catch (prepError) {
          console.warn('⚠️ Connection pre-warming failed, continuing:', prepError.message);
        }
      }

      this.ui.updateStatus(CONFIG.status.CONNECTING, 'connecting');

      // Connect with timeout
      await Promise.race([
        this.agent.initialize(),
        this._createTimeout(15000, 'Agent connection timeout'),
      ]);
    } catch (error) {
      throw new Error(`Agent initialization failed: ${error.message}`);
    }
  }

  /**
   * ✅ SIMPLIFIED: UI event handlers - eliminated complex audio replay logic
   */
  _setupSimplifiedUIEventHandlers() {
    if (CONFIG.debug.enabled) {
      console.log('🎨 Setting up SIMPLIFIED UI handlers');
    }

    // Text message sending
    this.ui.on('textSend', async (text) => {
      try {
        if (!this._validateAgentReady()) return;

        this.ui.addMessage(text, 'user');
        await this.agent.sendMessage(text);
      } catch (error) {
        this.ui.showToast('Failed to send message', 'error');
        console.error('Text send error:', error);
      }
    });

    // Voice mode toggle
    this.ui.on('voiceToggle', async () => {
      try {
        if (!this._validateAgentReady()) return;

        this.state.voiceModeStartTime = performance.now();

        if (this.agent.state.voiceMode) {
          await this.agent.endVoiceMode();
        } else {
          // Set voice call mode (Character.AI style)
          this.ui.setVoiceCallMode('character');
          // this.ui.setVoiceCallMode('whatsapp', true);

          this.ui.updateStatus(CONFIG.status.PREPARING_VOICE_MODE, 'connecting');
          await this.agent.startVoiceMode();

          // Track voice mode activation time
          this.voiceMetrics.voiceModeActivationTime =
            performance.now() - this.state.voiceModeStartTime;

          if (CONFIG.debug.showLatencyMetrics) {
            console.log(
              `⚡ Voice mode activation: ${this.voiceMetrics.voiceModeActivationTime.toFixed(0)}ms`
            );
          }
        }
      } catch (error) {
        this.voiceMetrics.totalErrors++;
        this.ui.showToast('Voice mode not available', 'error');
        this.ui.updateStatus(CONFIG.status.ERROR, 'error');
        console.error('Voice toggle error:', error);
      }
    });

    // Voice mode end
    this.ui.on('voiceEnd', async () => {
      try {
        if (!this.agent) {
          console.warn('No agent available to end voice mode');
          return;
        }

        try {
          await Promise.race([
            this.agent.endVoiceMode(),
            this._createTimeout(3000, 'Voice end timeout'),
          ]);
        } catch (agentError) {
          console.error('Failed to end voice mode properly, forcing cleanup:', agentError);
          await this._forceVoiceModeCleanup();
        }

        this.ui.updateStatus(CONFIG.status.READY, 'connected');
      } catch (error) {
        console.error('Critical error ending voice mode:', error);
        this.ui.showVoiceMode(false);
        this.ui.updateStatus(CONFIG.status.ERROR, 'error');
        this.ui.showToast('Voice call ended', 'warning');
      }
    });

    // Microphone toggle
    this.ui.on('muteToggle', async () => {
      try {
        if (!this._validateAgentReady()) return;

        const isMuted = await this.agent.toggleMicrophone();
        this.ui.updateMicState(isMuted);

        if (this.agent.state.voiceMode) {
          this.ui.updateVoiceActivity(!isMuted, 0);
        }
      } catch (error) {
        this.ui.showToast('Failed to control microphone', 'error');
        console.error('Microphone toggle error:', error);
      }
    });

    // Audio toggle
    this.ui.on('audioToggle', async () => {
      try {
        if (!this._validateAgentReady()) return;

        if (CONFIG.debug.showAudioEvents) {
          console.log('🔊 Audio toggle requested. Current state:', this.agent.state.audioEnabled);
        }

        const enabled = await this.agent.toggleAudio();
        this.ui.updateAudioState(enabled);

        const message = enabled ? 'Audio enabled' : 'Audio disabled';
        const type = enabled ? 'success' : 'info';
        this.ui.showToast(message, type, 2000);

        if (CONFIG.debug.showAudioEvents) {
          console.log(`🔊 Audio toggle completed. New state: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        }
      } catch (error) {
        this.ui.showToast('Failed to control audio', 'error');
        console.error('Audio toggle error:', error);

        // Try to sync state on error
        if (this.agent) {
          const currentState = this.agent.state.audioEnabled;
          this.ui.updateAudioState(currentState);
        }
      }
    });
  }

  /**
   * ✅ SIMPLIFIED: Agent event handlers - simple audio replay integration
   */
  _setupSimplifiedAgentEventHandlers() {
    // Status updates
    this.agent.on('statusChange', (status, type) => {
      this.ui.updateStatus(status, type);
    });

    // Ready state
    this.agent.on('ready', () => {
      this.ui.updateStatus(CONFIG.status.READY, 'connected');
      this._safeTimeout(() => {
        this.ui.showToast('Voice assistant ready!', 'success', 3000);
      }, 100);
    });

    // Connection prepared
    this.agent.on('connectionPrepared', () => {
      if (CONFIG.debug.enabled) {
        console.log('⚡ Connection pre-warmed, voice mode will be instant');
      }
    });

    // ✅ SIMPLIFIED: Message handling with streaming support
    this.agent.on('messageReceived', (text, isFinal) => {
      this.ui.showTypingIndicator(false);

      if (CONFIG.features.streamingText && !isFinal) {
        // Streaming mode
        if (!this.currentStreamingMessage) {
          this.currentStreamingMessage = this.ui.addMessage(text, 'bot', true);
        } else {
          this.ui.updateStreamingMessage(this.currentStreamingMessage, text, false);
        }
      } else {
        // Final message
        if (this.currentStreamingMessage) {
          this.ui.updateStreamingMessage(this.currentStreamingMessage, text, true);
          this.currentStreamingMessage = null;
        } else {
          this.ui.addMessage(text, 'bot');
        }
      }
    });

    // Voice activity events
    this.agent.on('userSpeechStart', () => {
      if (CONFIG.debug.logVoiceActivityEvents) {
        console.log('🎤 User started speaking');
      }
      this.ui.updateVoiceActivity(true, 0.5);
    });

    this.agent.on('userSpeechEnd', (finalText) => {
      if (CONFIG.debug.logVoiceActivityEvents) {
        console.log('🎤 User stopped speaking:', finalText?.substring(0, 30) + '...');
      }
      this.ui.updateVoiceActivity(false, 0);
      this.ui.showBotThinking(true);
    });

    // Bot thinking and response
    this.agent.on('botThinking', (isThinking) => {
      if (CONFIG.debug.logVoiceActivityEvents) {
        console.log('🧠 Bot thinking:', isThinking);
      }
      this.ui.showBotThinking(isThinking);
    });

    this.agent.on('botResponseStart', () => {
      if (CONFIG.debug.logVoiceActivityEvents) {
        console.log('🗣️ Bot started responding');
      }
      this.ui.showBotThinking(false);

      // Calculate and track voice latency
      if (this.agent.voiceMetrics?.speechEndTime) {
        const latency = performance.now() - this.agent.voiceMetrics.speechEndTime;
        this._trackVoiceLatency(latency);
      }
    });

    // User transcription in voice mode
    this.agent.on('userTranscriptionReceived', (text, isFinal = true) => {
      if (CONFIG.debug.showAudioEvents) {
        console.log('👤 User transcription:', text, 'Final:', isFinal);
      }

      if (isFinal && this.agent.state.voiceMode && text.trim()) {
        this.ui.addMessage(text, 'user');
      }
    });

    // Agent subtitles in voice mode
    this.agent.on('agentSubtitle', (text) => {
      if (this.agent.state.voiceMode) {
        this.ui.showSubtitles(text, true);
      }
    });

    // Typing indicator
    this.agent.on('agentTyping', (isTyping) => {
      this.ui.showTypingIndicator(isTyping);
    });

    // Voice mode changes
    this.agent.on('voiceModeChanged', (enabled) => {
      this.ui.showVoiceMode(enabled);

      const message = enabled ? '🎤 Voice mode active - Start speaking!' : 'Voice mode ended';
      const duration = enabled ? 4000 : 2000;

      this._safeTimeout(() => {
        this.ui.showToast(message, 'info', duration);
      }, 100);

      if (!enabled) {
        this.ui.hideSubtitles();
        this.ui.showBotThinking(false);
        this.ui.updateVoiceActivity(false, 0);
      }
    });

    // Microphone state
    this.agent.on('microphoneChanged', (active) => {
      this.ui.updateMicState(!active); // UI expects muted state
    });

    // Audio state
    this.agent.on('audioChanged', (enabled) => {
      this.ui.updateAudioState(enabled);
    });

    // Audio interaction required
    this.agent.on('audioInteractionRequired', () => {
      this._safeTimeout(() => {
        this.ui.showToast('Click the audio button to enable sound', 'warning', 8000);
      }, 100);
    });

    // Agent speaking
    this.agent.on('agentSpeaking', (speaking) => {
      if (CONFIG.debug.showAudioEvents) {
        console.log('🗣️ Agent speaking:', speaking);
      }

      if (this.agent.state.voiceMode && speaking) {
        this.ui.updateVoiceActivity(false, 0);
      }
    });

    // Connection quality changes
    this.agent.on('connectionQualityChanged', (quality) => {
      this.ui.updateConnectionQuality(quality);

      if (CONFIG.ui.notifications.connectionBadge.enabled) {
        const latency = this.agent.voiceMetrics?.lastResponseLatency || 0;
        this.ui.updateConnectionBadge(quality, latency);
      }

      if (quality === 'poor' || quality === 'lost') {
        this.ui.showToast(`Connection quality: ${quality}`, 'warning', 3000);
      }
    });

    // ✅ SIMPLE: Bot audio track ready (no complex recording)
    this.agent.on('botAudioTrackReady', (audioTrackData) => {
      if (CONFIG.debug.showAudioEvents) {
        console.log('🎵 Bot audio track ready:', {
          timestamp: new Date(audioTrackData.timestamp).toLocaleTimeString(),
          text: audioTrackData.text?.substring(0, 30) + '...',
        });
      }

      // Pass to UI for simple replay button
      this.ui.handleBotAudioTrackReady(audioTrackData);

      if (CONFIG.debug.showAudioEvents) {
        console.log('✅ Simple replay button should be available');
      }
    });

    // Error handling
    this.agent.on('error', (error) => {
      console.error('Agent error:', error);
      this.ui.showToast(error, 'error');
      this.voiceMetrics.totalErrors++;

      // Reset voice state on errors
      if (this.agent.state.voiceMode) {
        this.ui.showBotThinking(false);
        this.ui.updateVoiceActivity(false, 0);
      }
    });

    // Disconnection
    this.agent.on('disconnected', (reason) => {
      console.log('🔌 Agent disconnected:', reason);
      this.ui.updateStatus(CONFIG.status.DISCONNECTED, 'error');

      // Clean voice state
      this.ui.showVoiceMode(false);
      this.ui.showBotThinking(false);
      this.ui.updateVoiceActivity(false, 0);

      if (reason !== 'LEAVE_REQUEST') {
        this.ui.showToast('Connection lost - Reconnecting...', 'warning');
        this.state.ready = false;
        this.voiceMetrics.reconnectCount++;
      }
    });
  }

  /**
   * Track voice response latency
   */
  _trackVoiceLatency(latencyMs) {
    this.state.lastVoiceLatency = latencyMs;
    this.voiceMetrics.responseCount++;

    // Update running average
    this.voiceMetrics.averageResponseLatency =
      (this.voiceMetrics.averageResponseLatency * (this.voiceMetrics.responseCount - 1) +
        latencyMs) /
      this.voiceMetrics.responseCount;

    // Track fastest and slowest
    this.voiceMetrics.fastestResponse = Math.min(this.voiceMetrics.fastestResponse, latencyMs);
    this.voiceMetrics.slowestResponse = Math.max(this.voiceMetrics.slowestResponse, latencyMs);

    // Update UI
    this.ui.updateVoiceLatency(latencyMs);

    // Update connection badge
    if (CONFIG.ui.notifications.connectionBadge.enabled && this.agent.state.connectionQuality) {
      this.ui.updateConnectionBadge(this.agent.state.connectionQuality, latencyMs);
    }

    if (CONFIG.debug.showLatencyMetrics) {
      console.log(`⚡ Voice Response Metrics:
                Current: ${latencyMs.toFixed(0)}ms
                Average: ${this.voiceMetrics.averageResponseLatency.toFixed(0)}ms
                Fastest: ${this.voiceMetrics.fastestResponse.toFixed(0)}ms
                Slowest: ${this.voiceMetrics.slowestResponse.toFixed(0)}ms`);
    }

    // Show warning if latency is high
    if (latencyMs > CONFIG.voice.responseFlow.latencyWarningThreshold) {
      console.warn(`⚠️ High voice response latency: ${latencyMs.toFixed(0)}ms`);
    }
  }

  /**
   * Force voice mode cleanup when agent fails
   */
  async _forceVoiceModeCleanup() {
    try {
      if (this.agent.state) {
        this.agent.state.voiceMode = false;
        this.agent.state.microphoneActive = false;
        this.agent.state.userSpeaking = false;
        this.agent.state.botThinking = false;
      }

      // Try graceful disconnect and reconnect
      await this.agent.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.agent.currentMode = 'text';
      await this.agent.initialize();

      console.log('✅ Force voice cleanup completed');
    } catch (recoveryError) {
      console.error('❌ Force cleanup failed:', recoveryError);
      this.ui.showToast('Voice call ended (with errors)', 'warning');
    }
  }

  /**
   * Setup global event handlers
   */
  _setupGlobalEventHandlers() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', this._handleWindowUnload);

    // Handle visibility changes
    document.addEventListener('visibilitychange', this._handleVisibilityChange);

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      if (!this.state.ready && CONFIG.features.autoReconnect) {
        this._attemptReconnect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Connection lost');
      this.ui.showToast('Network connection lost', 'warning');

      // Clean voice state when offline
      if (this.agent?.state.voiceMode) {
        this.ui.showVoiceMode(false);
        this.ui.showBotThinking(false);
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.voiceMetrics.totalErrors++;
      if (this.ui) {
        this.ui.showToast('An unexpected error occurred', 'error');
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (this.ui) {
        this.ui.showToast('A connection error occurred', 'error');
      }
    });
  }

  /**
   * Handle window unload
   */
  async _handleWindowUnload() {
    if (this.agent) {
      try {
        await this.agent.disconnect();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }

  /**
   * Handle visibility changes
   */
  _handleVisibilityChange() {
    if (CONFIG.debug.enabled) {
      console.log('👁️ Visibility changed:', document.hidden ? 'hidden' : 'visible');
    }

    // Handle voice mode during visibility changes
    if (document.hidden && this.agent?.state.voiceMode) {
      console.log('📱 App hidden during voice mode - maintaining connection');
      this.ui.updateVoiceActivity(false, 0);
    } else if (!document.hidden && this.agent?.state.voiceMode) {
      console.log('📱 App visible again during voice mode - resuming');
      if (this.agent.state.microphoneActive) {
        this.ui.updateVoiceActivity(true, 0);
      }
    }
  }

  /**
   * Handle initialization errors with retry logic
   */
  async _handleInitializationError(error) {
    console.error('Initialization error:', error);

    // Show error in UI if available
    if (this.ui) {
      this.ui.updateStatus(CONFIG.status.ERROR, 'error');
      this.ui.showToast(error.message || 'Connection failed', 'error');
    }

    // Retry logic
    if (this.state.initializationAttempts < this.state.maxInitializationAttempts) {
      const retryDelay = 2000 * this.state.initializationAttempts;
      console.log(`🔄 Retrying initialization in ${retryDelay}ms...`);

      this._safeTimeout(() => {
        this.init();
      }, retryDelay);
    } else {
      this._showFallbackErrorUI(error);
    }
  }

  /**
   * Attempt reconnection
   */
  async _attemptReconnect() {
    if (this.state.ready) return;

    try {
      if (this.ui) {
        this.ui.updateStatus(CONFIG.status.RECONNECTING, 'connecting');
      }

      if (this.agent) {
        await this.agent.initialize();
        this.state.ready = true;
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      if (this.ui) {
        this.ui.showToast('Reconnection failed', 'error');
      }
    }
  }

  /**
   * Show fallback error UI
   */
  _showFallbackErrorUI(error) {
    const errorHTML = `
            <div class="min-h-screen flex items-center justify-center" style="background: var(--bg); color: var(--text);">
                <div class="text-center max-w-md mx-auto p-8">
                    <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <h1 class="text-2xl font-bold mb-4">Voice Assistant Error</h1>
                    <p class="text-gray-300 mb-4">
                        Could not connect to voice assistant. Please check your connection and try again.
                    </p>
                    <p class="text-sm text-gray-400 mb-6">
                        Error: ${error.message || 'Unknown error'}
                    </p>
                    <div class="space-y-3">
                        <button onclick="window.location.reload()"
                                class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                            Retry Connection
                        </button>
                        <div class="text-xs text-gray-500 space-y-1">
                            <p>Voice Strategy: dynamic (optimized)</p>
                            <p>Simple Audio Replay: Enabled</p>
                            <p>Connection Time: ${this.voiceMetrics.connectionTime.toFixed(0)}ms</p>
                            <p>Version: ${this.state.appVersion}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.innerHTML = errorHTML;
  }

  /**
   * Validate agent readiness
   */
  _validateAgentReady() {
    if (!this.agent || !this.state.ready) {
      this.ui?.showToast('Voice assistant not ready', 'warning');
      return false;
    }
    return true;
  }

  /**
   * Create timeout promise
   */
  _createTimeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Safe timeout with error handling
   */
  _safeTimeout(callback, delay) {
    setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error('Error in timeout callback:', error);
      }
    }, delay);
  }

  /**
   * ✅ SIMPLIFIED: Cleanup
   */
  async cleanup() {
    try {
      // Remove global event listeners
      window.removeEventListener('beforeunload', this._handleWindowUnload);
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);

      // Clean agent
      if (this.agent) {
        await this.agent.disconnect();
        this.agent = null;
      }

      // Clean UI
      if (this.ui) {
        this.ui.cleanup();
        this.ui = null;
      }

      // Reset state
      this.state.initialized = false;
      this.state.ready = false;
      this.currentStreamingMessage = null;

      // Reset voice metrics
      this.voiceMetrics = {
        connectionTime: 0,
        voiceModeActivationTime: 0,
        averageResponseLatency: 0,
        responseCount: 0,
        fastestResponse: Infinity,
        slowestResponse: 0,
        totalErrors: 0,
        reconnectCount: 0,
      };

      console.log('🧹 Application cleanup completed - Simplified');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * ✅ SIMPLIFIED: Get application state
   */
  getState() {
    return {
      ...this.state,
      voiceModeStrategy: 'dynamic',
      agentState: this.agent ? this.agent.getState() : null,
      uiState: this.ui ? this.ui.getState() : null,
      currentStreamingMessage: !!this.currentStreamingMessage,
      voiceMetrics: { ...this.voiceMetrics },
      connectionPrepared: this.agent?.connectionPrepared || false,
      lastVoiceLatency: this.state.lastVoiceLatency,
      simplifiedAudioReplay: true,
    };
  }

  /**
   * Get voice performance summary
   */
  getVoicePerformanceSummary() {
    if (this.voiceMetrics.responseCount === 0) {
      return 'No voice responses measured yet';
    }

    return `Voice Performance Summary:
            • Responses: ${this.voiceMetrics.responseCount}
            • Average Latency: ${this.voiceMetrics.averageResponseLatency.toFixed(0)}ms
            • Fastest Response: ${this.voiceMetrics.fastestResponse.toFixed(0)}ms
            • Slowest Response: ${this.voiceMetrics.slowestResponse.toFixed(0)}ms
            • Connection Time: ${this.voiceMetrics.connectionTime.toFixed(0)}ms
            • Voice Mode Activation: ${this.voiceMetrics.voiceModeActivationTime.toFixed(0)}ms
            • Total Errors: ${this.voiceMetrics.totalErrors}
            • Reconnections: ${this.voiceMetrics.reconnectCount}
            • Simple Audio Replay: Enabled`;
  }

  /**
   * Force emergency reset
   */
  async forceReset() {
    console.log('🚨 Emergency reset requested');
    await this._forceVoiceModeCleanup();
  }

  /**
   * Toggle streaming text mode for testing
   */
  setStreamingTextMode(enabled = null) {
    if (enabled === null) {
      enabled = !CONFIG.features.streamingText;
    }

    CONFIG.features.streamingText = enabled;

    if (enabled) {
      console.log('🎤 REAL-TIME TEXT ENABLED - Text appears while agent speaks');
      this.ui?.showToast('Real-time text synchronization', 'success', 3000);
    } else {
      console.log('💬 COMPLETE TEXT MODE - Text appears after agent finishes');
      this.ui?.showToast('Complete text only', 'info', 3000);
    }

    return enabled;
  }

  /**
   * Change conversation mode dynamically
   */
  setConversationMode(mode) {
    const validModes = ['separated', 'unified'];
    if (!validModes.includes(mode)) {
      console.warn('Invalid mode. Use: "separated" or "unified"');
      return;
    }

    CONFIG.ui.call.conversationMode = mode;

    const description =
      mode === 'unified'
        ? 'ALL in main chat (complete history)'
        : 'Separated: text→chat, voice→subtitles';

    console.log(`🎛️ Conversation mode: ${description}`);
    this.ui?.showToast(`Conversation mode: ${mode}`, 'info', 3000);

    return mode;
  }
}

// Global application instance
let app = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 DOM loaded, starting Clean Voice App v1.0...');
    console.log('⚡ Target: <500ms voice response + Simple Audio Replay');
    console.log('✅ Eliminated 500+ lines of unnecessary code');

    app = new VoiceAgentApp();
    await app.init();

    // Make app globally accessible for debugging
    if (CONFIG.debug.enabled) {
      window.app = app;
      window.CONFIG = CONFIG;

      // Debug commands
      window.forceReset = () => app.forceReset();
      window.getAppState = () => app.getState();
      window.getVoiceMetrics = () => app.getVoicePerformanceSummary();
      window.forceEndCall = () => app.ui.showVoiceMode(false);
      window.toggleStreaming = (enabled) => app.setStreamingTextMode(enabled);
      window.setConversationMode = (mode) => app.setConversationMode(mode);

      // Voice-specific debugging
      window.showVoiceMetrics = () => {
        console.log(app.getVoicePerformanceSummary());
        return app.voiceMetrics;
      };

      window.testVoiceLatency = () => {
        const testLatency = Math.random() * 1000 + 200;
        app._trackVoiceLatency(testLatency);
        console.log(`🧪 Simulated voice latency: ${testLatency.toFixed(0)}ms`);
      };

      console.log('🔧 Debug commands available:');
      console.log('  • window.showVoiceMetrics() // Show voice performance metrics');
      console.log('  • window.testVoiceLatency() // Test latency tracking');
      console.log('  • window.forceReset() // Emergency reset');
      console.log('  • window.getAppState() // Get complete state');
      console.log('  • window.toggleStreaming() // Enable/disable real-time text');
      console.log('  • window.setConversationMode("separated"|"unified")');

      console.log('🎤 VOICE OPTIMIZATION STATUS:');
      console.log('  • Strategy: DYNAMIC (optimized)');
      console.log('  • Mode: HYBRID (perfect for voice)');
      console.log('  • Simple Audio Replay: ENABLED');
      console.log('  • Turn Detection: 250ms silence threshold');
      console.log('  • Audio Quality: 48kHz voice-optimized');
      console.log('  • Connection: Pre-warming enabled');
      console.log('  • Latency Target: <500ms voice response');
      console.log('  • Version: v1.0-clean-simplified');
      console.log(`  • Conversation Mode: ${CONFIG.ui.call.conversationMode}`);
    }
  } catch (error) {
    console.error('❌ Critical error during Clean Voice App initialization:', error);

    // Last resort fallback
    setTimeout(() => {
      if (!app || !app.state.initialized) {
        console.log('🔄 Attempting fallback initialization...');
        window.location.reload();
      }
    }, 5000);
  }
});

// Export for debugging
if (typeof window !== 'undefined' && CONFIG.debug.enabled) {
  window.VoiceAgentApp = VoiceAgentApp;
}
