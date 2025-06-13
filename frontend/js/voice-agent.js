/**
 * Voice Agent v1.0 - CLEAN CODE Implementation
 * Eliminado: Sistema de grabación innecesario (500+ líneas)
 * Siguiendo: SOLID + DRY + LiveKit 1.0 best practices
 */
class VoiceAgent {
  constructor() {
    // 🔥 Verificación de compatibilidad del navegador
    if (CONFIG.features.browserCompatibilityCheck && !this._checkBrowserSupport()) {
      throw new Error(CONFIG.errors.BROWSER_INCOMPATIBLE);
    }

    // 🚀 Core LiveKit components v2.13.3
    this.room = null;
    this.localAudioTrack = null;
    this.audioElements = [];
    this.currentMode = CONFIG.agent.defaultMode;

    // ✅ SIMPLIFICADO: State management
    this.state = {
      connected: false,
      connecting: false,
      audioEnabled: false,
      microphoneActive: false,
      voiceMode: false,
      browserSupported: true,
      userSpeaking: false,
      botThinking: false,
      connectionQuality: 'unknown',
    };

    // Event handling
    this.eventHandlers = new Map();

    // Connection management
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = CONFIG.livekit.connectOptions.maxRetries;
    this.connectionPrepared = false;

    // ✅ SIMPLIFICADO: Performance tracking (solo lo esencial)
    this.voiceMetrics = {
      speechEndTime: 0,
      responseStartTime: 0,
      lastResponseLatency: 0,
      averageLatency: 0,
      responseCount: 0,
      connectionTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0,
    };

    // Session data
    this.sessionInfo = {
      room: '',
      identity: '',
      persona_id: CONFIG.agent.persona,
      user_id: '',
      sdk_version: 'v1.0-clean-simplified',
    };

    // ✅ AUDIO REPLAY SIMPLE - Solo 2 variables
    this.lastBotAudioTrack = null; // El track original (SIN grabación)
    this.lastBotMessageText = ''; // Para logging/debug

    console.log('🤖 VoiceAgent v1.0 - Clean & Simplified Implementation');
    console.log('✅ Eliminadas 500+ líneas de código innecesario');
  }

  /**
   * 🔍 Verificación de compatibilidad del navegador
   */
  _checkBrowserSupport() {
    try {
      if (
        typeof LivekitClient !== 'undefined' &&
        typeof LivekitClient.isBrowserSupported === 'function'
      ) {
        return LivekitClient.isBrowserSupported();
      }

      // Fallback manual
      const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
      const hasWebAssembly = typeof WebAssembly !== 'undefined';

      return hasWebRTC && hasAudioContext && hasWebAssembly;
    } catch (error) {
      console.warn('⚠️ Browser compatibility check failed:', error);
      return false;
    }
  }

  /**
   * ⚡ Pre-calentar conexión para switching más rápido
   */
  async prepareConnection() {
    if (this.connectionPrepared) return;

    try {
      const startTime = performance.now();
      const tokenData = await this._getAccessToken();

      if (this.room?.prepareConnection) {
        await Promise.race([
          this.room.prepareConnection(tokenData.url, tokenData.token),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Prepare timeout')),
              CONFIG.performance.prepareConnectionTimeout
            )
          ),
        ]);

        this.connectionPrepared = true;
        this.voiceMetrics.connectionTime = performance.now() - startTime;
        this._emit('connectionPrepared');

        if (CONFIG.debug.logConnectionPreWarming) {
          console.log(
            `⚡ Connection pre-warmed in ${this.voiceMetrics.connectionTime.toFixed(0)}ms`
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Connection pre-warming failed:', error.message);
    }
  }

  /**
   * 🚀 Initialize agent
   */
  async initialize() {
    if (this.state.connecting || this.state.connected) {
      console.warn('🤖 Agent already connecting or connected');
      return;
    }

    try {
      this.state.connecting = true;
      this.connectionState = 'connecting';
      this._emit('statusChange', CONFIG.status.INITIALIZING, 'connecting');

      // Get access token
      const tokenData = await this._getAccessToken();
      this._updateSessionInfo(tokenData);

      // Create room with voice optimizations
      this._createVoiceOptimizedRoom();
      this._setupRoomEvents();

      // Pre-warm if enabled
      if (CONFIG.livekit.features.enablePrepareConnection && !this.connectionPrepared) {
        this._emit('statusChange', CONFIG.status.OPTIMIZING_CONNECTION, 'connecting');
        await this.prepareConnection();
      }

      // Connect to room
      this._emit('statusChange', CONFIG.status.CONNECTING, 'connecting');
      await this.room.connect(tokenData.url, tokenData.token, CONFIG.livekit.connectOptions);

      // Set initial attributes
      await this._setInitialAttributes();

      // Update state
      this._updateConnectionState(true);
      this._emit('statusChange', CONFIG.status.CONNECTED, 'connected');
      this._emit('ready');

      console.log('✅ Voice Agent connected - Clean Implementation');
    } catch (error) {
      this.state.connecting = false;
      this.connectionState = 'failed';
      this._handleConnectionError('Connection failed', error);
      throw error;
    }
  }

  /**
   * ✅ SIMPLIFICADO: Room events con audio replay simple
   */
  _setupRoomEvents() {
    if (!this.room) return;

    this.room
      .on(LivekitClient.RoomEvent.Connected, () => {
        console.log('🔗 Room connected');
        this._setupTextStreamHandlers();
      })
      .on(LivekitClient.RoomEvent.Disconnected, (reason) => {
        console.log('🔗 Room disconnected:', reason);
        this._updateConnectionState(false);
        this._cleanupSimple(); // ✅ Cleanup simplificado
        this._emit('disconnected', reason);

        if (reason !== 'LEAVE_REQUEST') {
          this._scheduleReconnect();
        }
      })
      .on(LivekitClient.RoomEvent.Reconnecting, () => {
        console.log('🔄 Reconnecting...');
        this.connectionState = 'reconnecting';
        this._emit('statusChange', CONFIG.status.RECONNECTING, 'connecting');
      })
      .on(LivekitClient.RoomEvent.Reconnected, () => {
        console.log('✅ Reconnected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this._emit('statusChange', CONFIG.status.CONNECTED, 'connected');
      });

    // ✅ SIMPLIFICADO: Track subscription sin grabación compleja
    this.room
      .on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
        this._handleTrackSubscribed(track, publication, participant);
      })
      .on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

    // Audio playback status
    this.room.on(LivekitClient.RoomEvent.AudioPlaybackStatusChanged, () => {
      const canPlay = this.room.canPlaybackAudio;
      if (canPlay !== this.state.audioEnabled) {
        this.state.audioEnabled = canPlay;
        this._emit('audioChanged', canPlay);
      }

      if (!canPlay) {
        this._emit('audioInteractionRequired');
      }
    });

    // ✅ SIMPLIFICADO: Transcription handling
    this.room.on(LivekitClient.RoomEvent.TranscriptionReceived, (transcriptions, participant) => {
      this._handleTranscription(transcriptions, participant);
    });

    // Connection quality
    this.room.on(LivekitClient.RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant.identity === this.room.localParticipant.identity) {
        this.state.connectionQuality = quality;
        this._emit('connectionQualityChanged', quality);
      }
    });

    // Active speakers for voice activity
    this.room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const isAgentSpeaking = speakers.some(
        (s) => s.identity !== this.room.localParticipant.identity
      );

      if (isAgentSpeaking && this.state.botThinking) {
        this.state.botThinking = false;
        this._emit('botResponseStart');

        // Calculate voice latency
        if (this.voiceMetrics.speechEndTime > 0) {
          const latency = performance.now() - this.voiceMetrics.speechEndTime;
          this._updateVoiceLatencyMetrics(latency);
        }
      }

      this._emit('agentSpeaking', isAgentSpeaking);
    });

    console.log('📡 Room events configured - Simplified');
  }

  /**
   * ✅ NUEVO: Track subscription simplificado - SIN GRABACIÓN
   */
  _handleTrackSubscribed(track, publication, participant) {
    if (track.kind === LivekitClient.Track.Kind.Audio) {
      const isFromBot = participant !== this.room.localParticipant;

      if (isFromBot) {
        // 1. ✅ Reproducir inmediatamente (funcionalidad existente)
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        audioElement.addEventListener('loadedmetadata', () => {
          this.state.audioEnabled = true;
          this._emit('audioChanged', true);
        });
        audioElement.addEventListener('error', () => {
          this.state.audioEnabled = false;
          this._emit('audioChanged', false);
          this._emit('audioInteractionRequired');
        });

        document.body.appendChild(audioElement);
        this.audioElements.push(audioElement);

        // 2. ✅ SIMPLE: Guardar referencia para replay (SIN grabación)
        this.lastBotAudioTrack = track;
        this._emit('botAudioTrackReady', {
          track: track,
          timestamp: Date.now(),
          text: this.lastBotMessageText || 'Bot response',
        });

        if (CONFIG.debug.showAudioEvents) {
          console.log('🎵 Bot audio track ready for replay (no recording needed)');
        }
      }
    }
  }

  /**
   * ✅ SIMPLIFICADO: Transcription handling
   */
  _handleTranscription(transcriptions, participant) {
    if (!Array.isArray(transcriptions) || transcriptions.length === 0) return;

    const participantId = participant?.identity || 'unknown';
    const isFromUser = participant === this.room.localParticipant;

    for (const segment of transcriptions) {
      if (!segment?.text) continue;

      const text = segment.text.trim();
      const isFinal = segment.final || false;

      if (isFromUser && text) {
        // User speech tracking
        if (isFinal) {
          this.state.userSpeaking = false;
          this.state.botThinking = true;
          this.voiceMetrics.speechEndTime = performance.now();

          this._emit('userSpeechEnd', text);
          this._emit('botThinking', true);
        } else {
          if (!this.state.userSpeaking) {
            this.state.userSpeaking = true;
            this._emit('userSpeechStart');
          }
        }

        this._emit('userTranscriptionReceived', text, isFinal);
      } else if (!isFromUser && text) {
        // Bot response - guardar para correlación con audio
        if (isFinal) {
          this.lastBotMessageText = text;
          this._emitAgentMessage(text, true);
        } else if (CONFIG.features.streamingText) {
          this._emitAgentMessage(text, false);
        }
      }
    }
  }

  /**
   * ✅ PÚBLICO: Replay simple del último audio del bot
   */
  async replayLastBotTTS() {
    if (!this.lastBotAudioTrack) {
      console.warn('❌ No bot audio available for replay');
      return false;
    }

    try {
      // ✅ VERIFICAR permisos de audio PRIMERO
      if (!this.room.canPlaybackAudio) {
        console.log('🔊 Habilitando audio para replay...');
        await this.room.startAudio();
      }

      // ✅ VERIFICAR que el track esté suscrito
      if (!this.lastBotAudioTrack.isSubscribed) {
        console.warn('❌ Track not subscribed');
        return false;
      }

      const replayElement = this.lastBotAudioTrack.attach();
      replayElement.volume = 1.0;
      await replayElement.play();

      if (CONFIG.debug.showAudioEvents) {
        console.log('✅ Bot TTS replayed successfully (no recording, direct track)');
      }

      return true;
    } catch (error) {
      console.error('❌ Error replaying bot TTS:', error);
      return false;
    }
  }

  // ==========================================
  // MÉTODOS EXISTENTES (simplificados)
  // ==========================================

  /**
   * 🎤 Start voice mode
   */
  async startVoiceMode() {
    if (this.state.voiceMode) return;

    try {
      const startTime = performance.now();
      this._emit('statusChange', CONFIG.status.VOICE_STARTING, 'connecting');

      await this._startVoiceModeDynamic();

      this.state.voiceMode = true;
      this._emit('voiceModeChanged', true);
      this._emit('statusChange', CONFIG.status.VOICE_ACTIVE, 'connected');

      const duration = performance.now() - startTime;
      if (CONFIG.debug.showLatencyMetrics) {
        console.log(`⚡ Voice mode activated in ${duration.toFixed(0)}ms`);
      }
    } catch (error) {
      this._handleError('Failed to start voice mode', error);
      throw error;
    }
  }

  /**
   * 🔇 End voice mode
   */
  async endVoiceMode() {
    if (!this.state.voiceMode) return;

    try {
      this._emit('statusChange', CONFIG.status.VOICE_ENDING, 'connecting');

      await this._endVoiceModeDynamic();

      this.state.voiceMode = false;
      this.state.userSpeaking = false;
      this.state.botThinking = false;

      this._emit('voiceModeChanged', false);
      this._emit('statusChange', CONFIG.status.READY, 'connected');
    } catch (error) {
      this._handleError('Failed to end voice mode', error);
      // Force state update even on error
      this.state.voiceMode = false;
      this.state.userSpeaking = false;
      this.state.botThinking = false;
      this._emit('voiceModeChanged', false);
    }
  }

  /**
   * 📧 Send text message
   */
  async sendMessage(text) {
    if (!this._validateConnection() || !text?.trim()) {
      throw new Error('Cannot send message: invalid connection or empty text');
    }

    try {
      await this.room.localParticipant.sendText(text.trim(), {
        topic: CONFIG.topics.chat,
      });
      this._emit('messageSent', text);
    } catch (error) {
      this._handleError('Failed to send message', error);
      throw error;
    }
  }

  /**
   * 🎚️ Toggle microphone
   */
  async toggleMicrophone() {
    try {
      if (this.room?.localParticipant?.setMicrophoneEnabled) {
        const newState = !this.state.microphoneActive;
        await this.room.localParticipant.setMicrophoneEnabled(newState);
        this.state.microphoneActive = newState;
        this._emit('microphoneChanged', newState);
        return !newState; // Return muted state (inverse)
      }

      return await this._toggleMicrophoneLegacy();
    } catch (error) {
      this._handleError('Failed to toggle microphone', error);
      return true;
    }
  }

  /**
   * 🔊 Toggle audio playback
   */
  async toggleAudio() {
    if (!this.room) {
      console.warn('🔊 No room available for audio toggle');
      return false;
    }

    try {
      if (!this.state.audioEnabled) {
        // Enable audio
        if (!this.room.canPlaybackAudio) {
          try {
            await this.room.startAudio();
          } catch (startError) {
            console.warn('🔊 startAudio() failed:', startError.message);
            this._emit('audioInteractionRequired');
            throw new Error(CONFIG.errors.SAFARI_AUDIO_RESTRICTION);
          }
        } else {
          await this.room.startAudio();
        }

        // Resume paused audio elements
        if (this.audioElements.length > 0) {
          const playPromises = this.audioElements
            .filter((el) => el.paused)
            .map((el) =>
              el.play().catch((playError) => {
                console.warn('🔊 Error playing element:', playError);
              })
            );

          await Promise.allSettled(playPromises);
        }

        this.state.audioEnabled = true;
      } else {
        // Disable audio
        this.audioElements.forEach((el) => {
          if (!el.paused) el.pause();
        });
        this.state.audioEnabled = false;
      }

      this._emit('audioChanged', this.state.audioEnabled);
      return this.state.audioEnabled;
    } catch (error) {
      console.error('❌ Error in toggleAudio:', error);
      const fallbackState = !this.state.audioEnabled;
      this._emit('audioChanged', fallbackState);
      this._handleError(CONFIG.errors.AUDIO_ERROR, error);
      return false;
    }
  }

  /**
   * 🔌 Disconnect with cleanup
   */
  async disconnect() {
    if (!this.room) return;

    try {
      await this._stopMicrophoneOptimized();
      this._cleanupSimple(); // ✅ Cleanup simplificado
      this._cleanupTextStreamHandlers();

      await this.room.disconnect(true);
      this._resetState();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  // ==========================================
  // MÉTODOS UTILITARIOS SIMPLIFICADOS
  // ==========================================

  /**
   * ✅ NUEVO: Cleanup simple - elimina complejidad innecesaria
   */
  _cleanupSimple() {
    // Reset audio replay
    this.lastBotAudioTrack = null;
    this.lastBotMessageText = '';

    // Cleanup audio elements
    this.audioElements.forEach((el) => {
      try {
        if (!el.paused) el.pause();
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (error) {
        console.error('Error cleaning audio element:', error);
      }
    });
    this.audioElements = [];

    console.log('🧹 Simple cleanup completed');
  }

  /**
   * Voice mode implementation
   */
  async _startVoiceModeDynamic() {
    if (!this._validateConnection()) {
      throw new Error('Cannot start voice mode: not connected');
    }

    await this.room.localParticipant.setAttributes({
      io_mode: 'voice',
      mode_change_timestamp: Date.now().toString(),
      voice_optimized: 'true',
      turn_detection_enabled: 'true',
      sdk_version: this.sessionInfo.sdk_version,
    });

    this.currentMode = 'voice';
    await this._startMicrophoneOptimized();
  }

  async _endVoiceModeDynamic() {
    await this._stopMicrophoneOptimized();

    if (this._validateConnection()) {
      await this.room.localParticipant.setAttributes({
        io_mode: CONFIG.agent.defaultMode,
        mode_change_timestamp: Date.now().toString(),
        voice_optimized: 'false',
      });
    }

    this.currentMode = CONFIG.agent.defaultMode;
  }

  /**
   * Microphone control
   */
  async _startMicrophoneOptimized() {
    if (!this._validateConnection() || this.state.microphoneActive) return;

    try {
      this._emit('statusChange', CONFIG.status.MICROPHONE_STARTING, 'connecting');

      if (this.room?.localParticipant?.setMicrophoneEnabled) {
        await this.room.localParticipant.setMicrophoneEnabled(true, {
          ...CONFIG.livekit.roomOptions.audioCaptureDefaults,
          echoCancellationType: 'system',
          autoGainControlType: 'system',
          noiseSuppressionType: 'system',
          voiceIsolation: true,
        });

        this.state.microphoneActive = true;
        this._emit('microphoneChanged', true);
        return;
      }

      await this._startMicrophoneLegacy();
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        this._handleError(CONFIG.errors.MICROPHONE_PERMISSION_DENIED, error);
      } else if (error.name === 'NotFoundError') {
        this._handleError(CONFIG.errors.AUDIO_DEVICE_ERROR, error);
      } else {
        this._handleError(CONFIG.errors.MICROPHONE_ERROR, error);
      }
      throw error;
    }
  }

  async _stopMicrophoneOptimized() {
    if (!this.state.microphoneActive) return;

    try {
      if (this.room?.localParticipant?.setMicrophoneEnabled) {
        await this.room.localParticipant.setMicrophoneEnabled(false);
        this.state.microphoneActive = false;
        this._emit('microphoneChanged', false);
        return;
      }

      await this._stopMicrophoneLegacy();
    } catch (error) {
      console.error('Error stopping microphone:', error);
    }
  }

  /**
   * ⚡ Voice latency metrics
   */
  _updateVoiceLatencyMetrics(latency) {
    this.voiceMetrics.lastResponseLatency = latency;
    this.voiceMetrics.responseCount++;

    this.voiceMetrics.averageLatency =
      (this.voiceMetrics.averageLatency * (this.voiceMetrics.responseCount - 1) + latency) /
      this.voiceMetrics.responseCount;

    this.voiceMetrics.fastestResponse = Math.min(this.voiceMetrics.fastestResponse, latency);
    this.voiceMetrics.slowestResponse = Math.max(this.voiceMetrics.slowestResponse, latency);

    if (CONFIG.debug.showLatencyMetrics) {
      console.log(
        `⚡ Voice response latency: ${latency.toFixed(
          0
        )}ms (Avg: ${this.voiceMetrics.averageLatency.toFixed(0)}ms)`
      );
    }
  }

  /**
   * ⚡ Agent message emission
   */
  _emitAgentMessage(text, isFinal = true) {
    if (!text?.trim()) return;

    const mode = CONFIG.ui.call.conversationMode;

    if (mode === 'unified') {
      this._emit('messageReceived', text, isFinal);
    } else {
      if (this.state.voiceMode) {
        this._emit('agentSubtitle', text);
      } else {
        this._emit('messageReceived', text, isFinal);
      }
    }
  }

  /**
   * Create voice-optimized room
   */
  _createVoiceOptimizedRoom() {
    this.room = new LivekitClient.Room({
      ...CONFIG.livekit.roomOptions,
      turnDetection: {
        enabled: true,
        timeout: CONFIG.voice.turnDetection.maximumSilenceDuration || 400,
        minSpeechDuration: CONFIG.voice.turnDetection.minimumTurnDuration || 150,
        silenceTimeout: CONFIG.voice.turnDetection.silenceGracePeriod + 150 || 250,
      },
      audioPlaybackDefaults: {
        ...CONFIG.livekit.roomOptions.audioPlaybackDefaults,
        autoplay: true,
        playsInline: true,
      },
    });

    console.log('🏠 Room created with voice optimizations');
  }

  // ==========================================
  // UTILITY METHODS (existing, simplified)
  // ==========================================

  _setupTextStreamHandlers() {
    if (!this.room) return;

    this._cleanupTextStreamHandlers();

    try {
      this.room.registerTextStreamHandler(CONFIG.topics.chat, async (reader, participant) => {
        try {
          if (participant.identity === this.room.localParticipant.identity) return;

          const text = await reader.readAll();

          if (text === '#typing#') {
            this._emit('agentTyping', true);
            return;
          }

          if (text.trim()) {
            if (!CONFIG.features.streamingText) {
              this._emit('messageReceived', text, true);
              this._emit('agentTyping', false);
            }
          }
        } catch (error) {
          console.error('Error handling chat stream:', error);
        }
      });
    } catch (error) {
      console.error('Failed to register text stream handlers:', error);
      throw error;
    }
  }

  _cleanupTextStreamHandlers() {
    if (!this.room) return;

    try {
      this.room.unregisterTextStreamHandler(CONFIG.topics.chat);
      this.room.unregisterTextStreamHandler(CONFIG.topics.transcription);
    } catch (error) {
      // Ignore - handlers might not exist
    }
  }

  async _getAccessToken() {
    try {
      const requestBody = {
        identity: '',
        room: '',
        persona_id: CONFIG.agent.persona,
        user_id: '',
        io_mode: this.currentMode,
      };

      const response = await fetch(CONFIG.livekit.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.token || !data.url) {
        throw new Error('Invalid token response');
      }

      return data;
    } catch (error) {
      throw new Error(`${CONFIG.errors.TOKEN_ERROR}: ${error.message}`);
    }
  }

  _updateSessionInfo(tokenData) {
    this.sessionInfo = {
      room: tokenData.room || this.sessionInfo.room,
      identity: tokenData.identity || this.sessionInfo.identity,
      persona_id: tokenData.persona_id || this.sessionInfo.persona_id,
      user_id: tokenData.user_id || this.sessionInfo.user_id,
      sdk_version: this.sessionInfo.sdk_version,
    };
  }

  async _setInitialAttributes() {
    if (!this.room?.localParticipant) return;

    try {
      await this.room.localParticipant.setAttributes({
        io_mode: this.currentMode,
        persona_id: this.sessionInfo.persona_id,
        user_id: this.sessionInfo.user_id,
        initialization_timestamp: Date.now().toString(),
        sdk_version: this.sessionInfo.sdk_version,
      });
    } catch (error) {
      console.error('Failed to set initial attributes:', error);
    }
  }

  _updateConnectionState(connected) {
    this.state.connected = connected;
    this.state.connecting = false;
    this.connectionState = connected ? 'connected' : 'disconnected';
  }

  _resetState() {
    this.state = {
      connected: false,
      connecting: false,
      audioEnabled: false,
      microphoneActive: false,
      voiceMode: false,
      browserSupported: true,
      userSpeaking: false,
      botThinking: false,
      connectionQuality: 'unknown',
    };
    this.connectionState = 'disconnected';
    this.connectionPrepared = false;
    this.room = null;
    this.localAudioTrack = null;

    // Reset simplified audio replay
    this.lastBotAudioTrack = null;
    this.lastBotMessageText = '';

    this.voiceMetrics = {
      speechEndTime: 0,
      responseStartTime: 0,
      lastResponseLatency: 0,
      averageLatency: 0,
      responseCount: 0,
      connectionTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0,
    };
  }

  _validateConnection() {
    return this.room && this.state.connected && this.connectionState === 'connected';
  }

  _handleConnectionError(message, error) {
    const errorMessage = `${message}: ${error.message}`;
    console.error('❌', errorMessage);

    this._emit('error', errorMessage);
    this._emit('statusChange', CONFIG.status.ERROR, 'error');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(async () => {
      try {
        this.connectionPrepared = false;
        await this.initialize();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  _handleError(message, error = null) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    console.error('❌', errorMessage);
    this._emit('error', errorMessage);
  }

  // Legacy methods (fallback only)
  async _startMicrophoneLegacy() {
    this.localAudioTrack = await LivekitClient.createLocalAudioTrack(
      CONFIG.livekit.roomOptions.audioCaptureDefaults
    );

    this.localAudioTrack.mediaStreamTrack.enabled = true;
    if (this.localAudioTrack.isMuted) {
      await this.localAudioTrack.unmute();
    }

    await this.room.localParticipant.publishTrack(this.localAudioTrack, {
      name: 'user-microphone',
      source: LivekitClient.Track.Source.Microphone,
      ...CONFIG.livekit.roomOptions.audioPresets,
    });

    this.state.microphoneActive = true;
    this._emit('microphoneChanged', true);
  }

  async _stopMicrophoneLegacy() {
    if (!this.localAudioTrack) return;

    if (this.room?.localParticipant) {
      await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
    }

    this.localAudioTrack.stop();
    this.localAudioTrack = null;
    this.state.microphoneActive = false;
    this._emit('microphoneChanged', false);
  }

  async _toggleMicrophoneLegacy() {
    if (!this.localAudioTrack) return true;

    const wasMuted = this.localAudioTrack.isMuted;

    if (wasMuted) {
      await this.localAudioTrack.unmute();
      this.state.microphoneActive = true;
    } else {
      await this.localAudioTrack.mute();
      this.state.microphoneActive = false;
    }

    this._emit('microphoneChanged', this.state.microphoneActive);
    return this.localAudioTrack.isMuted;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      ...this.state,
      currentMode: this.currentMode,
      voiceModeStrategy: 'dynamic',
      connectionState: this.connectionState,
      connectionPrepared: this.connectionPrepared,
      sessionInfo: { ...this.sessionInfo },
      voiceMetrics: this.getVoiceMetrics(),
      sdkVersion: 'v1.0-clean-simplified',
      connectionQuality: this.state.connectionQuality,
      audioElementsCount: this.audioElements.length,
      // ✅ Simple audio replay state
      hasLastBotAudio: !!this.lastBotAudioTrack,
      lastBotMessageText: this.lastBotMessageText,
    };
  }

  /**
   * Get voice metrics
   */
  getVoiceMetrics() {
    return {
      ...this.voiceMetrics,
      connectionQuality: this.state.connectionQuality,
      avgLatency: this.voiceMetrics.averageLatency.toFixed(0) + 'ms',
      fastestResponse:
        this.voiceMetrics.fastestResponse === Infinity
          ? 'N/A'
          : this.voiceMetrics.fastestResponse.toFixed(0) + 'ms',
      slowestResponse:
        this.voiceMetrics.slowestResponse === 0
          ? 'N/A'
          : this.voiceMetrics.slowestResponse.toFixed(0) + 'ms',
      totalResponses: this.voiceMetrics.responseCount,
    };
  }

  /**
   * Event handling
   */
  _emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.VoiceAgent = VoiceAgent;
}
