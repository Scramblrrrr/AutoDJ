/**
 * Professional Audio Engine for AutoDJ
 * Handles stem playback, mixing, BPM detection, and effects
 */

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.currentTrack = null;
    this.nextTrack = null;
    this.stems = {};
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.bpm = 120;
    this.autoMixEnabled = false;
    this.crossfadePosition = 0.5; // 0 = track A, 1 = track B
    this.isTransitioning = false;
    
    // Mixing parameters
    this.stemVolumes = {
      vocals: 0.75,
      drums: 0.85,
      bass: 0.80,
      other: 0.70
    };
    
    // Deck-specific effects parameters
    this.deckEffects = {
      deckA: {
        reverb: 0,
        delay: 0,
        filter: 0,
        distortion: 0
      },
      deckB: {
        reverb: 0,
        delay: 0,
        filter: 0,
        distortion: 0
      }
    };
    
    this.listeners = new Set();
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain nodes
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // Create crossfader
      this.trackAGain = this.audioContext.createGain();
      this.trackBGain = this.audioContext.createGain();
      this.trackAGain.connect(this.masterGain);
      this.trackBGain.connect(this.masterGain);
      
      // Create stem gain nodes
      this.stemGains = {};
      ['vocals', 'drums', 'bass', 'other'].forEach(stem => {
        this.stemGains[stem] = {
          trackA: this.audioContext.createGain(),
          trackB: this.audioContext.createGain()
        };
        this.stemGains[stem].trackA.connect(this.trackAGain);
        this.stemGains[stem].trackB.connect(this.trackBGain);
      });
      
      // Create effects chains
      this.createEffectsChain();
      
      console.log('Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
    }
  }

  createEffectsChain() {
    // Create deck-specific effects chains
    this.effectNodes = {
      deckA: this.createDeckEffects(),
      deckB: this.createDeckEffects()
    };
    
    // Connect effects chains to deck outputs
    this.connectDeckEffects();
  }

  createDeckEffects() {
    const effects = {};
    
    // Reverb
    effects.reverbNode = this.audioContext.createConvolver();
    effects.reverbGain = this.audioContext.createGain();
    effects.reverbGain.gain.value = 0;
    
    // Delay
    effects.delayNode = this.audioContext.createDelay();
    effects.delayFeedback = this.audioContext.createGain();
    effects.delayGain = this.audioContext.createGain();
    effects.delayNode.delayTime.value = 0.25;
    effects.delayFeedback.gain.value = 0;
    effects.delayGain.gain.value = 0;
    
    // Filter
    effects.filterNode = this.audioContext.createBiquadFilter();
    effects.filterNode.type = 'lowpass';
    effects.filterNode.frequency.value = 20000;
    
    // Distortion
    effects.distortionNode = this.audioContext.createWaveShaper();
    effects.distortionGain = this.audioContext.createGain();
    effects.distortionGain.gain.value = 0;
    
    // EQ (3-band)
    effects.eqHigh = this.audioContext.createBiquadFilter();
    effects.eqMid = this.audioContext.createBiquadFilter();
    effects.eqLow = this.audioContext.createBiquadFilter();
    
    effects.eqHigh.type = 'highshelf';
    effects.eqHigh.frequency.value = 10000;
    effects.eqHigh.gain.value = 0;
    
    effects.eqMid.type = 'peaking';
    effects.eqMid.frequency.value = 1000;
    effects.eqMid.Q.value = 1;
    effects.eqMid.gain.value = 0;
    
    effects.eqLow.type = 'lowshelf';
    effects.eqLow.frequency.value = 100;
    effects.eqLow.gain.value = 0;
    
    return effects;
  }

  connectDeckEffects() {
    // Connect deck A effects chain
    const deckA = this.effectNodes.deckA;
    this.trackAGain.connect(deckA.eqLow);
    deckA.eqLow.connect(deckA.eqMid);
    deckA.eqMid.connect(deckA.eqHigh);
    deckA.eqHigh.connect(deckA.filterNode);
    deckA.filterNode.connect(this.masterGain);
    
    // Connect deck B effects chain  
    const deckB = this.effectNodes.deckB;
    this.trackBGain.connect(deckB.eqLow);
    deckB.eqLow.connect(deckB.eqMid);
    deckB.eqMid.connect(deckB.eqHigh);
    deckB.eqHigh.connect(deckB.filterNode);
    deckB.filterNode.connect(this.masterGain);
  }

  setupEffectsRouting() {
    // Connect delay
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    
    // Connect filter to master output path
    this.filterNode.connect(this.masterGain);
  }

  async loadTrack(trackData) {
    try {
      console.log('Loading track:', trackData.title);
      
      if (!trackData.stemsPath) {
        throw new Error('No stems available for this track');
      }
      
      const stems = {};
      const stemNames = ['vocals', 'drums', 'bass', 'other'];
      
      // Load all stem files
      for (const stemName of stemNames) {
        const stemPath = trackData.stemsPath[stemName];
        if (stemPath) {
          console.log(`Loading ${stemName} stem:`, stemPath);
          stems[stemName] = await this.loadAudioFile(stemPath);
        }
      }
      
      // Detect BPM (simplified - in reality would use more sophisticated algorithm)
      const bpm = await this.detectBPM(stems.drums || stems.other);
      
      return {
        ...trackData,
        stems,
        bpm,
        duration: stems.vocals?.duration || stems.drums?.duration || 0
      };
    } catch (error) {
      console.error('Error loading track:', error);
      throw error;
    }
  }

  async loadAudioFile(filePath) {
    try {
      // Use Electron's IPC to load the audio file
      const { ipcRenderer } = window.require('electron');
      console.log(`Loading audio file via IPC: ${filePath}`);
      
      const arrayBuffer = await ipcRenderer.invoke('load-audio-file', filePath);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`Successfully decoded audio: ${filePath} (${audioBuffer.duration}s)`);
      
      return {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        source: null
      };
    } catch (error) {
      console.warn(`Could not load audio file: ${filePath}`, error);
      // Return a dummy buffer for development
      return {
        buffer: this.createSilentBuffer(180),
        duration: 180, // 3 minutes default
        source: null
      };
    }
  }

  createSilentBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const numChannels = 2;
    const length = sampleRate * duration;
    
    const buffer = this.audioContext.createBuffer(numChannels, length, sampleRate);
    
    // Fill with very quiet noise to simulate audio
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() - 0.5) * 0.01;
      }
    }
    
    return buffer;
  }

  async detectBPM(stemData) {
    // Simplified BPM detection - in reality would use beat detection algorithms
    if (!stemData || !stemData.buffer) {
      return 120; // Default BPM
    }
    
    // Simulate BPM detection with some variation
    const baseBPM = 120;
    const variation = Math.random() * 40 - 20; // ±20 BPM variation
    return Math.round(baseBPM + variation);
  }

  async play() {
    if (!this.currentTrack) {
      throw new Error('No track loaded');
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      this.startPlayback();
      this.notifyListeners('playbackStarted');
    } catch (error) {
      console.error('Error starting playback:', error);
      throw error;
    }
  }

  startPlayback() {
    // Stop any existing playback
    this.stopAllSources();
    
    // Create and start sources for each stem
    const stems = this.currentTrack.stems;
    const startTime = this.audioContext.currentTime;
    
    Object.keys(stems).forEach(stemName => {
      const stemData = stems[stemName];
      if (stemData && stemData.buffer) {
        const source = this.audioContext.createBufferSource();
        source.buffer = stemData.buffer;
        
        // Connect to appropriate gain node
        const gainNode = this.stemGains[stemName]?.trackA || this.trackAGain;
        source.connect(gainNode);
        
        // Apply current volume
        gainNode.gain.value = this.stemVolumes[stemName] || 0.5;
        
        source.start(startTime, this.currentTime);
        
        // Store reference for stopping
        stemData.source = source;
        
        source.onended = () => {
          if (this.autoMixEnabled && this.isPlaying) {
            this.handleTrackEnd();
          } else {
            this.pause();
          }
        };
      }
    });
    
    // Start time tracking
    this.startTimeTracking(startTime);
  }

  startTimeTracking(startTime) {
    const trackStartTime = this.currentTime;
    
    const updateTime = () => {
      if (this.isPlaying && this.currentTrack) {
        const newCurrentTime = trackStartTime + (this.audioContext.currentTime - startTime);
        this.currentTime = Math.min(newCurrentTime, this.currentTrack.duration || this.duration);
        
        // Format time for display
        const formatTime = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        this.notifyListeners('timeUpdate', {
          currentTime: this.currentTime,
          duration: this.currentTrack.duration || this.duration,
          currentTimeFormatted: formatTime(this.currentTime),
          durationFormatted: formatTime(this.currentTrack.duration || this.duration),
          progress: (this.currentTime / (this.currentTrack.duration || this.duration)) * 100
        });
        
        // Check if track ended
        if (this.currentTime >= (this.currentTrack.duration || this.duration) - 0.1) {
          this.handleTrackEnd();
          return;
        }
        
        requestAnimationFrame(updateTime);
      }
    };
    
    requestAnimationFrame(updateTime);
  }

  pause() {
    this.isPlaying = false;
    this.stopAllSources();
    this.notifyListeners('playbackPaused');
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.stopAllSources();
    this.notifyListeners('playbackStopped');
  }

  stopAllSources() {
    if (this.currentTrack && this.currentTrack.stems) {
      Object.values(this.currentTrack.stems).forEach(stemData => {
        if (stemData.source) {
          try {
            stemData.source.stop();
          } catch (e) {
            // Source may already be stopped
          }
          stemData.source = null;
        }
      });
    }
  }

  setStemVolume(stemName, volume) {
    this.stemVolumes[stemName] = Math.max(0, Math.min(1, volume));
    
    // Update current playback volume
    if (this.stemGains[stemName]) {
      this.stemGains[stemName].trackA.gain.value = this.stemVolumes[stemName];
    }
    
    this.notifyListeners('stemVolumeChanged', { stemName, volume });
  }

  setCrossfade(position) {
    this.crossfadePosition = Math.max(0, Math.min(1, position));
    
    // Apply crossfade curve (logarithmic for natural sound)
    const trackAGain = Math.cos(this.crossfadePosition * Math.PI / 2);
    const trackBGain = Math.sin(this.crossfadePosition * Math.PI / 2);
    
    this.trackAGain.gain.value = trackAGain;
    this.trackBGain.gain.value = trackBGain;
    
    this.notifyListeners('crossfadeChanged', { position });
  }

  setDeckEffect(deck, effectName, value) {
    const deckKey = deck === 'A' ? 'deckA' : 'deckB';
    this.deckEffects[deckKey][effectName] = Math.max(0, Math.min(1, value));
    
    const effectNodes = this.effectNodes[deckKey];
    
    switch (effectName) {
      case 'filter':
        const frequency = 20000 * (1 - value) + 200 * value;
        effectNodes.filterNode.frequency.value = frequency;
        break;
        
      case 'reverb':
        effectNodes.reverbGain.gain.value = value;
        break;
        
      case 'delay':
        effectNodes.delayNode.delayTime.value = value * 0.5;
        effectNodes.delayFeedback.gain.value = value * 0.3;
        effectNodes.delayGain.gain.value = value;
        break;
        
      case 'distortion':
        this.applyDeckDistortion(deckKey, value);
        break;
    }
    
    this.notifyListeners('deckEffectChanged', { deck, effectName, value });
  }

  setDeckEQ(deck, band, value) {
    const deckKey = deck === 'A' ? 'deckA' : 'deckB';
    const effectNodes = this.effectNodes[deckKey];
    
    // Convert 0-1 range to -20dB to +20dB
    const gainValue = (value - 0.5) * 40;
    
    switch (band) {
      case 'high':
        effectNodes.eqHigh.gain.value = gainValue;
        break;
      case 'mid':
        effectNodes.eqMid.gain.value = gainValue;
        break;
      case 'low':
        effectNodes.eqLow.gain.value = gainValue;
        break;
    }
    
    this.notifyListeners('deckEQChanged', { deck, band, value });
  }

  applyDeckDistortion(deckKey, amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount * 20) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    this.effectNodes[deckKey].distortionNode.curve = curve;
    this.effectNodes[deckKey].distortionGain.gain.value = amount;
  }

  applyDistortion(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount * 20) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    this.distortionNode.curve = curve;
  }

  async handleTrackEnd() {
    console.log('Track ended, handling transition...');
    
    // Prevent multiple transition attempts
    if (this.isTransitioning) {
      console.log('Transition already in progress, skipping...');
      return;
    }
    
    if (this.autoMixEnabled && this.nextTrack) {
      console.log('Auto-mix enabled, starting intelligent transition');
      this.isTransitioning = true;
      await this.startIntelligentTransition();
    } else {
      // Just notify that playback ended
      this.notifyListeners('trackEnded');
      this.pause();
    }
  }

  async startIntelligentTransition() {
    console.log('🎵 AI DJ: Starting intelligent transition between tracks');
    
    if (!this.nextTrack) {
      console.log('No next track available for transition');
      return;
    }
    
    try {
      // Professional DJ transition logic
      const currentBPM = this.currentTrack.bpm || 120;
      const nextBPM = this.nextTrack.bpm || 120;
      const bpmDifference = Math.abs(currentBPM - nextBPM);
      
      console.log(`🎵 AI DJ: Current track BPM: ${currentBPM}, Next track BPM: ${nextBPM}`);
      
      // Choose transition technique based on BPM difference
      if (bpmDifference <= 5) {
        console.log('🎵 AI DJ: Using smooth crossfade (similar BPMs)');
        await this.performSmoothCrossfade();
      } else if (bpmDifference <= 15) {
        console.log('🎵 AI DJ: Using tempo-matched transition');
        await this.performTempoMatchedTransition();
      } else {
        console.log('🎵 AI DJ: Using creative break transition (large BPM difference)');
        await this.performBreakTransition();
      }
      
    } catch (error) {
      console.error('Error during intelligent transition:', error);
      this.notifyListeners('trackEnded');
    }
  }

  async performSmoothCrossfade() {
    // Start playing next track in sync
    const nextTrackStartTime = this.audioContext.currentTime + 0.1;
    this.startNextTrackPlayback(nextTrackStartTime);
    
    // 8-second professional crossfade
    const fadeDuration = 8000;
    const steps = 100;
    const stepDuration = fadeDuration / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      const progress = currentStep / steps;
      
      // Professional crossfade curve (logarithmic for natural sound)
      const currentTrackGain = Math.cos(progress * Math.PI / 2) * 0.8;
      const nextTrackGain = Math.sin(progress * Math.PI / 2) * 0.8;
      
      // Apply crossfade
      this.trackAGain.gain.value = currentTrackGain;
      this.trackBGain.gain.value = nextTrackGain;
      
      console.log(`🎵 AI DJ: Crossfade progress: ${Math.round(progress * 100)}%`);
      
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.completeTransition();
      }
    }, stepDuration);
  }

  async performTempoMatchedTransition() {
    console.log('🎵 AI DJ: Performing beat-matched transition');
    
    // Gradually adjust tempo of next track to match current
    const targetBPM = this.currentTrack.bpm || 120;
    const nextBPM = this.nextTrack.bpm || 120;
    const bpmRatio = targetBPM / nextBPM;
    
    // Apply tempo adjustment (simulated - in reality would use pitch shifting)
    console.log(`🎵 AI DJ: Adjusting next track tempo by ${bpmRatio.toFixed(2)}x`);
    
    // Start crossfade with tempo matching
    await this.performSmoothCrossfade();
  }

  async performBreakTransition() {
    console.log('🎵 AI DJ: Performing creative break transition');
    
    // Apply filter sweep effect on current track
    this.applyFilterSweep();
    
    // Wait 2 seconds, then start next track with impact
    setTimeout(() => {
      this.completeTransition();
    }, 2500); // Slightly longer to ensure filter sweep completes
  }

  applyFilterSweep() {
    console.log('🎵 AI DJ: Applying filter sweep effect');
    
    // Apply filter sweep to current playing deck (deck A)
    const currentDeckEffects = this.effectNodes.deckA;
    
    if (!currentDeckEffects || !currentDeckEffects.filterNode) {
      console.warn('Filter node not available for sweep effect');
      return;
    }
    
    // Sweep low-pass filter from 20kHz down to 200Hz over 2 seconds
    const startFreq = 20000;
    const endFreq = 200;
    const duration = 2000;
    const steps = 50;
    
    let currentStep = 0;
    const stepDuration = duration / steps;
    
    const sweepInterval = setInterval(() => {
      const progress = currentStep / steps;
      const frequency = startFreq - ((startFreq - endFreq) * progress);
      
      try {
        currentDeckEffects.filterNode.frequency.value = frequency;
      } catch (error) {
        console.warn('Error applying filter sweep:', error);
        clearInterval(sweepInterval);
      }
      
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(sweepInterval);
        // Reset filter after sweep
        setTimeout(() => {
          try {
            currentDeckEffects.filterNode.frequency.value = 20000;
          } catch (error) {
            console.warn('Error resetting filter:', error);
          }
        }, 100);
      }
    }, stepDuration);
  }

  startNextTrackPlayback(startTime) {
    if (!this.nextTrack || !this.nextTrack.stems) return;
    
    console.log('🎵 AI DJ: Starting next track playback');
    
    // Create and start sources for next track on deck B
    Object.keys(this.nextTrack.stems).forEach(stemName => {
      const stemData = this.nextTrack.stems[stemName];
      if (stemData && stemData.buffer) {
        const source = this.audioContext.createBufferSource();
        source.buffer = stemData.buffer;
        
        // Connect to deck B
        const gainNode = this.stemGains[stemName]?.trackB || this.trackBGain;
        source.connect(gainNode);
        
        gainNode.gain.value = this.stemVolumes[stemName] || 0.5;
        
        source.start(startTime, 0);
        stemData.source = source;
      }
    });
  }

  async adjustTempo(targetBPM) {
    const ratio = targetBPM / this.bpm;
    console.log(`Adjusting tempo from ${this.bpm} to ${targetBPM} BPM (ratio: ${ratio})`);
    
    // In a real implementation, would use pitch-shifting algorithms
    // For now, just update the BPM reference
    this.bpm = targetBPM;
  }

  performCrossfade(duration = 8000) {
    const steps = 100;
    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      const progress = currentStep / steps;
      this.setCrossfade(progress);
      
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.completeTransition();
      }
    }, stepDuration);
  }

  completeTransition() {
    this.currentTrack = this.nextTrack;
    this.nextTrack = null;
    this.setCrossfade(0); // Reset to track A
    this.isTransitioning = false; // Reset transition flag
    this.notifyListeners('transitionComplete');
  }

  setAutoMix(enabled) {
    this.autoMixEnabled = enabled;
    this.notifyListeners('autoMixChanged', { enabled });
  }

  loadNextTrack(trackData) {
    this.nextTrack = trackData;
  }

  // Event system
  addEventListener(listener) {
    this.listeners.add(listener);
  }

  removeEventListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(event, data = {}) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in audio engine listener:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.listeners.clear();
  }
}

// Create singleton instance
const audioEngine = new AudioEngine();
export default audioEngine; 