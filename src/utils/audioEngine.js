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
    this.isSeeking = false;
    
    // AI DJ intelligent transition timing
    this.transitionStartTime = null;
    this.hasStartedTransition = false;
    this.nextTrackPitchRatio = 1.0;
    
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
    
    // Create completely silent buffer - no fake noise
    const buffer = this.audioContext.createBuffer(numChannels, length, sampleRate);
    
    // Buffers are initialized to silence by default, no need to fill
    return buffer;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async detectBPM(stemData) {
    if (!stemData || !stemData.buffer) {
      return { bpm: 120, beatGrid: [] }; // Default BPM with empty beat grid
    }

    try {
      // Use the drums stem for better beat detection
      const audioBuffer = stemData.buffer;
      const sampleRate = audioBuffer.sampleRate;
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      
      // Analyze first 60 seconds for comprehensive beat detection
      const analyzeLength = Math.min(sampleRate * 60, channelData.length);
      const analysisData = channelData.slice(0, analyzeLength);
      
      // Apply high-pass filter to emphasize beats
      const filteredData = this.highPassFilter(analysisData, sampleRate, 60);
      
      // Detect tempo and beat grid using autocorrelation
      const result = this.autocorrelationBPMWithGrid(filteredData, sampleRate);
      
      console.log(`🎵 Detected BPM: ${result.bpm} with ${result.beatGrid.length} beat markers`);
      
      // Notify UI of BPM detection with beat grid
      this.notifyListeners('bpmDetected', { 
        bpm: result.bpm, 
        beatGrid: result.beatGrid,
        waveform: this.generateWaveformData(channelData)
      });
      
      return result.bpm;
      
    } catch (error) {
      console.warn('BPM detection failed, using default:', error);
      return 120;
    }
  }

  highPassFilter(data, sampleRate, cutoffFreq) {
    // Simple high-pass filter to emphasize kick drums and beats
    const alpha = 1 / (1 + (2 * Math.PI * cutoffFreq) / sampleRate);
    const filtered = new Float32Array(data.length);
    
    let prevInput = 0;
    let prevOutput = 0;
    
    for (let i = 0; i < data.length; i++) {
      filtered[i] = alpha * (prevOutput + data[i] - prevInput);
      prevInput = data[i];
      prevOutput = filtered[i];
    }
    
    return filtered;
  }

  autocorrelationBPMWithGrid(data, sampleRate) {
    // Calculate energy to find beat onsets
    const windowSize = 1024;
    const hopSize = 512;
    const energyValues = [];
    
    for (let i = 0; i < data.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += Math.abs(data[i + j]);
      }
      energyValues.push(energy);
    }
    
    // Find peaks in energy (beat onsets)
    const peaks = this.findPeaks(energyValues, 0.3);
    
    if (peaks.length < 4) return { bpm: 120, beatGrid: [] }; // Need at least 4 beats
    
    // Calculate intervals between beats
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = (peaks[i] - peaks[i-1]) * hopSize / sampleRate;
      if (interval > 0.3 && interval < 2.0) { // Valid beat intervals
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return { bpm: 120, beatGrid: [] };
    
    // Find most common interval (tempo)
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    let bpm = Math.round(60 / avgInterval);
    
    // Ensure BPM is in reasonable range
    if (bpm < 60) bpm = bpm * 2;
    if (bpm > 200) bpm = Math.round(bpm / 2);
    bpm = Math.max(60, Math.min(200, bpm));
    
    // Generate beat grid with precise timing
    const beatGrid = this.generateBeatGrid(peaks, hopSize, sampleRate, bpm);
    
    return { bpm, beatGrid };
  }

  generateBeatGrid(peaks, hopSize, sampleRate, bpm) {
    const beatGrid = [];
    const beatInterval = 60 / bpm; // seconds between beats
    
    // Convert peak indices to time positions
    const beatTimes = peaks.map(peak => (peak * hopSize) / sampleRate);
    
    // Create a more precise beat grid by interpolating
    if (beatTimes.length > 0) {
      const firstBeat = beatTimes[0];
      const duration = 60; // Analyze first 60 seconds
      
      // Generate regular beat grid from first detected beat
      for (let time = firstBeat; time < duration; time += beatInterval) {
        beatGrid.push({
          time: time,
          type: 'beat',
          confidence: this.calculateBeatConfidence(time, beatTimes, beatInterval)
        });
      }
      
      // Add downbeats (every 4 beats for 4/4 time)
      for (let i = 0; i < beatGrid.length; i += 4) {
        if (beatGrid[i]) {
          beatGrid[i].type = 'downbeat';
          beatGrid[i].confidence = Math.min(1.0, beatGrid[i].confidence + 0.2);
        }
      }
    }
    
    return beatGrid;
  }

  calculateBeatConfidence(time, detectedBeats, beatInterval) {
    // Find the closest detected beat to this theoretical beat time
    let minDistance = Infinity;
    for (const beatTime of detectedBeats) {
      const distance = Math.abs(time - beatTime);
      minDistance = Math.min(minDistance, distance);
    }
    
    // Convert distance to confidence (closer = higher confidence)
    const maxAcceptableDistance = beatInterval * 0.1; // 10% tolerance
    const confidence = Math.max(0, 1 - (minDistance / maxAcceptableDistance));
    return Math.min(1, confidence);
  }

  generateWaveformData(channelData) {
    const waveformPoints = 1000; // Reduce to 1000 points for performance
    const samplesPerPoint = Math.floor(channelData.length / waveformPoints);
    const waveform = [];
    
    for (let i = 0; i < waveformPoints; i++) {
      let sum = 0;
      let max = 0;
      const startSample = i * samplesPerPoint;
      const endSample = Math.min(startSample + samplesPerPoint, channelData.length);
      
      // Calculate RMS and peak for this segment
      for (let j = startSample; j < endSample; j++) {
        const sample = Math.abs(channelData[j]);
        sum += sample * sample;
        max = Math.max(max, sample);
      }
      
      const rms = Math.sqrt(sum / (endSample - startSample));
      waveform.push({
        rms: rms,
        peak: max,
        time: (i * samplesPerPoint) / 48000 // Assuming 48kHz sample rate
      });
    }
    
    return waveform;
  }

  findPeaks(data, threshold) {
    const peaks = [];
    const maxVal = Math.max(...data);
    const minThreshold = maxVal * threshold;
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i-1] && 
          data[i] > data[i+1] && 
          data[i] > minThreshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
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
        
        // Apply pitch shifting for tempo matching (default is 1.0)
        source.playbackRate.value = 1.0;
        
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
        this.notifyListeners('timeUpdate', {
          currentTime: this.currentTime,
          duration: this.currentTrack.duration || this.duration,
          currentTimeFormatted: this.formatTime(this.currentTime),
          durationFormatted: this.formatTime(this.currentTrack.duration || this.duration),
          progress: (this.currentTime / (this.currentTrack.duration || this.duration)) * 100
        });
        
        // AI DJ intelligent transition timing
        this.checkIntelligentTransitionTiming();
        
        // Check if track has completely ended
        if (this.currentTime >= (this.currentTrack.duration || this.duration) - 0.1) {
          this.handleTrackEnd();
          clearInterval(this.timeUpdateInterval);
          return;
        }
      }
    };
    
    // Use setInterval for reliable updates (60 FPS, works even when tab is not focused)  
    this.timeUpdateInterval = setInterval(updateTime, 16);
  }

  pause() {
    this.isPlaying = false;
    this.stopAllSources();
    this.notifyListeners('playbackPaused');
  }

  playDeck(deck) {
    console.log(`🎵 Playing Deck ${deck}`);
    // Individual deck control - start specific deck playback
    if (deck === 'A' && this.currentTrack) {
      this.play();
    } else if (deck === 'B' && this.nextTrack) {
      this.startNextTrackPlayback();
    }
    this.notifyListeners('deckPlaybackStarted', { deck });
  }

  pauseDeck(deck) {
    console.log(`🎵 Pausing Deck ${deck}`);
    // Individual deck control - pause specific deck
    if (deck === 'A') {
      // Fade out deck A
      this.animateGain(this.trackAGain.gain, this.trackAGain.gain.value, 0, 300);
    } else if (deck === 'B') {
      // Fade out deck B
      this.animateGain(this.trackBGain.gain, this.trackBGain.gain.value, 0, 300);
    }
    this.notifyListeners('deckPlaybackPaused', { deck });
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

  seekToTime(time) {
    if (!this.currentTrack || this.isSeeking) return;
    
    console.log(`🎵 Seeking to ${time}s in current track`);
    
    // Set seeking flag to prevent multiple seeks
    this.isSeeking = true;
    
    const wasPlaying = this.isPlaying;
    
    // Clear existing time interval to prevent conflicts
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    
    // Stop current playback
    this.stopAllSources();
    
    // Update current time and ensure it stays set
    this.currentTime = Math.max(0, Math.min(time, this.currentTrack.duration));
    
    // Update UI immediately with new time
    this.notifyListeners('timeUpdate', {
      currentTime: this.currentTime,
      currentTimeFormatted: this.formatTime(this.currentTime),
      durationFormatted: this.formatTime(this.currentTrack.duration),
      progress: (this.currentTime / this.currentTrack.duration) * 100
    });
    
    // Restart playback from new position if it was playing
    if (wasPlaying) {
      // Small delay to ensure time is set properly
      setTimeout(() => {
        this.startPlayback();
        this.isSeeking = false;
      }, 50);
    } else {
      this.isSeeking = false;
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

  checkIntelligentTransitionTiming() {
    if (!this.autoMixEnabled || !this.nextTrack || this.hasStartedTransition || this.isTransitioning || this.isSeeking) {
      return;
    }
    
    const currentDuration = this.currentTrack.duration || this.duration;
    const timeRemaining = currentDuration - this.currentTime;
    
    // Start intelligent layering 30 seconds before track ends
    if (timeRemaining <= 30 && timeRemaining > 25) {
      console.log(`🎵 AI DJ: Starting intelligent transition with ${Math.round(timeRemaining)}s remaining`);
      this.hasStartedTransition = true;
      this.isTransitioning = true;
      this.startIntelligentTransition();
    }
  }

  triggerManualTransition() {
    if (!this.autoMixEnabled) {
      console.log('🚀 Manual transition blocked - Auto-mix is off');
      return;
    }
    
    if (this.isTransitioning) {
      console.log('🚀 Manual transition blocked - Already transitioning');
      return;
    }
    
    if (!this.nextTrack) {
      console.log('🚀 Manual transition blocked - No next track available');
      return;
    }
    
    console.log('🚀 MANUAL TRANSITION TRIGGERED - Finding best transition point with advanced techniques!');
    
    // Force immediate intelligent transition with enhanced techniques
    this.hasStartedTransition = true;
    this.isTransitioning = true;
    
    // Enhanced transition with looping and layering
    this.performAdvancedManualTransition();
  }

  async performAdvancedManualTransition() {
    console.log('🎧 AI DJ: Performing advanced manual transition with looping and layering');
    
    const currentBPM = this.currentTrack?.bmp || 120;
    const nextBPM = this.nextTrack?.bmp || 120;
    const bpmDifference = Math.abs(currentBPM - nextBPM);
    
    console.log(`🎵 AI DJ: Manual transition - Current: ${currentBPM} BPM, Next: ${nextBPM} BPM, Diff: ${bpmDifference}`);
    
    // Advanced transition selection based on BPM difference with enhanced techniques
    if (bpmDifference <= 5) {
      console.log('🎵 Using loop-layer transition (similar BPMs)');
      await this.performLoopLayerTransition();
    } else if (bpmDifference <= 15) {
      console.log('🎵 Using beat-matched loop transition (moderate BPM difference)');
      await this.performBeatMatchLoopTransition();
    } else {
      console.log('🎵 Using creative loop-break transition (large BPM difference)');
      await this.performCreativeLoopBreakTransition();
    }
  }

  async performLoopLayerTransition() {
    console.log('🎵 AI DJ: Performing loop-layer transition');
    
    // Create loop effect by emphasizing drums and bass
    if (this.stemGains.drums && this.stemGains.drums.gain) {
      this.animateGain(this.stemGains.drums, this.stemGains.drums.gain.value, 1.2, 1000);
    }
    if (this.stemGains.bass && this.stemGains.bass.gain) {
      this.animateGain(this.stemGains.bass, this.stemGains.bass.gain.value, 1.1, 1000);
    }
    
    // Start next track quietly in background
    await this.startBackgroundLayer();
    
    // Layer elements over 8 seconds
    await this.performAdvancedElementMixing(8000);
    
    // Final crossfade
    await this.performSmoothCrossfade(4000);
    
    this.completeTransition();
  }

  async performBeatMatchLoopTransition() {
    console.log('🎵 AI DJ: Performing beat-matched loop transition');
    
    const pitchRatio = (this.currentTrack?.bmp || 120) / (this.nextTrack?.bmp || 120);
    console.log(`🎛️ Applying pitch shift ratio: ${pitchRatio.toFixed(3)}`);
    
    this.setupPitchShifting(pitchRatio);
    
    // Apply filter sweep for creative effect
    if (this.effectNodes.deckA?.filterNode) {
      const filter = this.effectNodes.deckA.filterNode;
      this.animateFrequency(filter, 20000, 500, 2000); // High-pass sweep
    }
    
    // Perform loop layer transition with tempo matching
    await this.performLoopLayerTransition();
  }

  async performCreativeLoopBreakTransition() {
    console.log('🎵 AI DJ: Performing creative loop-break transition');
    
    // Dramatic filter sweep
    if (this.effectNodes.deckA?.filterNode) {
      const filter = this.effectNodes.deckA.filterNode;
      filter.frequency.setValueAtTime(20000, this.audioContext.currentTime);
      filter.frequency.linearRampToValueAtTime(500, this.audioContext.currentTime + 2);
    }
    
    // Emphasize drums for loop effect
    if (this.stemGains.drums && this.stemGains.drums.gain) {
      this.animateGain(this.stemGains.drums, this.stemGains.drums.gain.value, 1.5, 1000);
    }
    
    // Reduce other elements
    if (this.stemGains.vocals && this.stemGains.vocals.gain) {
      this.animateGain(this.stemGains.vocals, this.stemGains.vocals.gain.value, 0.3, 1500);
    }
    if (this.stemGains.other && this.stemGains.other.gain) {
      this.animateGain(this.stemGains.other, this.stemGains.other.gain.value, 0.4, 1500);
    }
    
    // Start next track after 3 seconds with impact
    setTimeout(async () => {
      await this.startNextTrackPlayback();
      
      // Slam effect - quick crossfade
      this.performSmoothCrossfade(800);
      
      // Release filter
      if (this.effectNodes.deckB?.filterNode) {
        const filter = this.effectNodes.deckB.filterNode;
        filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        filter.frequency.linearRampToValueAtTime(20000, this.audioContext.currentTime + 0.5);
      }
      
      this.completeTransition();
    }, 3000);
  }

  async performAdvancedElementMixing(duration) {
    console.log(`🎛️ AI DJ: Advanced element mixing over ${duration/1000}s`);
    
    const phases = [
      { element: 'bass', delay: 0, gain: 0.8, description: 'Bass foundation' },
      { element: 'drums', delay: duration * 0.3, gain: 0.9, description: 'Drum layer' },
      { element: 'other', delay: duration * 0.6, gain: 0.7, description: 'Harmonic elements' },
      { element: 'vocals', delay: duration * 0.8, gain: 0.8, description: 'Vocal layer' }
    ];
    
    phases.forEach(phase => {
      setTimeout(() => {
        console.log(`🎵 Bringing in ${phase.description}`);
        if (this.nextTrackStemGains && this.nextTrackStemGains[phase.element]) {
          this.animateGain(
            this.nextTrackStemGains[phase.element], 
            0, 
            phase.gain, 
            duration * 0.2
          );
        }
      }, phase.delay);
    });
  }

  animateFrequency(filterNode, startFreq, endFreq, duration) {
    const startTime = this.audioContext.currentTime;
    const endTime = startTime + (duration / 1000);
    
    filterNode.frequency.setValueAtTime(startFreq, startTime);
    filterNode.frequency.linearRampToValueAtTime(endFreq, endTime);
  }

  async handleTrackEnd() {
    console.log('Track ended, handling transition...');
    
    // If we already started a transition, just complete it
    if (this.hasStartedTransition) {
      console.log('Transition already started, completing...');
      this.completeTransition();
      return;
    }
    
    // Prevent multiple transition attempts during seek operations
    if (this.isTransitioning || this.isSeeking) {
      console.log('Transition in progress or seeking, skipping...');
      return;
    }
    
    if (this.autoMixEnabled) {
      if (!this.nextTrack) {
        console.log('🎵 No next track loaded, requesting from queue system...');
        this.notifyListeners('requestNextTrack', { 
          currentDeck: this.currentDeck || 'A',
          needsDeckSwitch: true 
        });
        
        // Wait a moment for the next track to be loaded
        setTimeout(async () => {
          if (this.nextTrack) {
            console.log('✅ Next track loaded, starting transition...');
            this.isTransitioning = true;
            await this.startIntelligentTransition();
          } else {
            console.log('⚠️ Still no next track, stopping playback');
            this.notifyListeners('trackEnded');
            this.pause();
          }
        }, 100);
      } else {
        console.log('Auto-mix enabled, starting transition');
        this.isTransitioning = true;
        await this.startIntelligentTransition();
      }
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
      
      // Log progress every 20% to reduce console spam
      const progressPercent = Math.round(progress * 100);
      if (progressPercent % 20 === 0) {
        console.log(`🎵 AI DJ: Crossfade progress: ${progressPercent}%`);
      }
      
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        this.completeTransition();
      }
    }, stepDuration);
  }

  async performTempoMatchedTransition() {
    console.log('🎵 AI DJ: Performing beat-matched transition');
    
    const currentBPM = this.currentTrack.bpm || 120;
    const nextBPM = this.nextTrack.bpm || 120;
    const bpmRatio = currentBPM / nextBPM;
    
    console.log(`🎵 AI DJ: Matching ${nextBPM} BPM to ${currentBPM} BPM (${bpmRatio.toFixed(2)}x)`);
    
    // Apply real pitch shifting to match tempos
    this.setupPitchShifting(bpmRatio);
    
    // Start professional layered transition
    await this.performLayeredTransition();
  }

  async performBreakTransition() {
    console.log('🎵 AI DJ: Performing creative break transition');
    
    // Apply filter sweep effect on current track
    this.applyFilterSweep();
    
    // Load and start next track immediately at low volume
    await this.startNextTrackPlayback();
    
    // Set all next track stems to 0 volume initially  
    Object.keys(this.nextTrack.stems).forEach(stemName => {
      if (this.stemGains[stemName] && this.stemGains[stemName].trackB) {
        this.stemGains[stemName].trackB.gain.value = 0;
      }
    });
    
    // Wait 2 seconds, then bring in next track with impact
    setTimeout(async () => {
      // Bring in next track with full volume
      await this.animateGain(this.trackBGain.gain, 0, 0.8, 500); // 0.5 second slam in
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
        
        // Apply real pitch shifting for tempo matching
        source.playbackRate.value = this.nextTrackPitchRatio || 1.0;
        if (this.nextTrackPitchRatio !== 1.0) {
          console.log(`🎵 AI DJ: Applying ${this.nextTrackPitchRatio.toFixed(2)}x pitch shift to ${stemName}`);
        }
        
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

  setupPitchShifting(pitchRatio) {
    // Create real pitch shifting using Web Audio API
    if (!this.nextTrack || !this.nextTrack.stems) return;
    
    console.log(`🎵 AI DJ: Setting up pitch shifting at ${pitchRatio.toFixed(2)}x ratio`);
    
    // Store pitch ratio for playback adjustment
    this.nextTrackPitchRatio = pitchRatio;
  }

  async performLayeredTransition() {
    console.log('🎵 AI DJ: Starting professional layered transition');
    
    // Phase 1: Start layering the next track quietly underneath
    await this.startBackgroundLayer();
    
    // Phase 2: Gradually bring in elements of the next track
    await this.performElementMixing();
    
    // Phase 3: Complete the transition
    this.completeTransition();
  }

  async startBackgroundLayer() {
    console.log('🎵 AI DJ: Starting background layer of next track');
    
    // Start next track very quietly (20% volume) on Deck B
    await this.startNextTrackPlayback();
    
    // Set all stems to very low volume initially
    Object.keys(this.nextTrack.stems).forEach(stemName => {
      if (this.stemGains[stemName] && this.stemGains[stemName].trackB) {
        this.stemGains[stemName].trackB.gain.value = this.stemVolumes[stemName] * 0.2;
      }
    });
    
    // Wait 4 seconds while tracks play together
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  async performElementMixing() {
    console.log('🎵 AI DJ: Performing intelligent element mixing');
    
    // Professional DJ technique: Bring in bass first, then drums, then others
    const mixingOrder = ['bass', 'drums', 'other', 'vocals'];
    
    for (const stemName of mixingOrder) {
      if (this.nextTrack.stems[stemName] && this.stemGains[stemName]) {
        console.log(`🎵 AI DJ: Layering in ${stemName} stem`);
        
        // Gradually bring in this element over 2 seconds
        await this.animateGain(
          this.stemGains[stemName].trackB.gain,
          this.stemGains[stemName].trackB.gain.value,
          this.stemVolumes[stemName] * 0.8,
          2000
        );
        
        // Wait 1 second before next element
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Final crossfade
    await this.performSmoothCrossfade();
  }

  async animateGain(gainNode, startValue, endValue, duration) {
    return new Promise(resolve => {
      const steps = 50;
      const stepDuration = duration / steps;
      const valueStep = (endValue - startValue) / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        gainNode.value = startValue + (valueStep * currentStep);
        currentStep++;
        
        if (currentStep >= steps) {
          gainNode.value = endValue;
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  completeTransition() {
    this.currentTrack = this.nextTrack;
    this.nextTrack = null;
    this.nextTrackPitchRatio = 1.0; // Reset pitch ratio
    this.setCrossfade(0); // Reset to track A
    this.isTransitioning = false; // Reset transition flag
    this.hasStartedTransition = false; // Reset AI timing flag
    this.transitionStartTime = null; // Reset timing
    console.log('🎵 AI DJ: Transition complete, ready for next track');
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