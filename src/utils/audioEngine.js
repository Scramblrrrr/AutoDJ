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
    this.transitionTimers = []; // Track transition timers for cleanup
    this.deckBCurrentTime = 0; // Track Deck B playback time
    this.deckBStartTime = 0; // Track when Deck B started
    this.deckBTimeUpdateInterval = null; // Separate time tracking for Deck B
    
    // Professional Auto-DJ Integration
    this.professionalAutoDJ = null;
    this.currentTransitionPlan = null;
    this.advancedMixingEnabled = true;
    
    // Queue Management System
    this.queueManager = null;
    
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
      
      // Initialize Professional Auto-DJ
      await this.initializeProfessionalAutoDJ();
      
      // Initialize Queue Manager
      await this.initializeQueueManager();
      
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
      
      // Detect BPM and musical key for professional mixing
      const bmpResult = await this.detectBPM(stems.drums || stems.other);
      const key = await this.detectKey(stems.vocals || stems.other || stems.drums);
      
      const bpm = typeof bmpResult === 'object' ? bmpResult.bpm : bmpResult;
      const beatGrid = typeof bmpResult === 'object' ? bmpResult.beatGrid : [];
      
      console.log(`🎵 Track analysis complete: ${bpm} BPM, ${key.name} (${key.camelot})`);
      
      // Store original values for accurate display
      const originalBPM = bpm;
      const originalKey = key;
      
      // Track original and current values for DJ adjustments
      const trackMetadata = {
        originalBPM: originalBPM,
        currentBPM: originalBPM, // Will change if pitch-shifted
        originalKey: originalKey,
        currentKey: originalKey, // Will change if key-shifted
        pitchRatio: 1.0, // Current pitch adjustment
        keyShift: 0 // Semitones shifted
      };
      
      const waveform = this.generateWaveformData(
        stems.vocals?.buffer || stems.drums?.buffer
      );

      // Notify listeners of BPM and key detection with enhanced info
      this.notifyListeners('bpmDetected', {
        bpm: originalBPM,
        bmp: originalBPM, // Keep both for compatibility
        originalBPM: originalBPM,
        currentBPM: originalBPM,
        pitchRatio: 1.0,
        beatGrid: beatGrid,
        waveform
      });
      
      this.notifyListeners('keyDetected', { 
        key: originalKey,
        originalKey: originalKey,
        currentKey: originalKey,
        keyShift: 0
      });
      
      return {
        ...trackData,
        stems,
        bmp: originalBPM,
        bpm: originalBPM,
        originalBPM: originalBPM,
        currentBPM: originalBPM,
        key: originalKey,
        originalKey: originalKey,
        currentKey: originalKey,
        metadata: trackMetadata,
        beatGrid,
        waveform,
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
      
      // Analyze the entire track for comprehensive beat detection. Previously
      // this was capped at 60 seconds which meant the beat grid would only
      // cover roughly the first 30 bars at ~120 BPM. Removing the limit ensures
      // accurate beat markers for the full song length.
      const filteredData = this.highPassFilter(channelData, sampleRate, 60);
      
      // Detect tempo and beat grid using autocorrelation
      const result = this.autocorrelationBPMWithGrid(filteredData, sampleRate);
      
      console.log(`🎵 Detected BPM: ${result.bpm} with ${result.beatGrid.length} beat markers`);
      
      // Notify UI of BPM detection with beat grid
      this.notifyListeners('bpmDetected', { 
        bpm: result.bpm, 
        beatGrid: result.beatGrid,
        waveform: this.generateWaveformData(audioBuffer)
      });
      
      return result;
      
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
    console.log('🎵 Professional beat analysis: detecting BPM, downbeats, and phrases...');
    
    // Optimized energy-based onset detection for real-time performance
    const windowSize = 1024; // Smaller for speed
    const hopSize = 256; // Smaller hop for better time resolution
    const analysisLength = Math.min(data.length, sampleRate * 15); // Max 15 seconds analysis for speed
    
    console.log(`🎵 Analyzing first ${(analysisLength / sampleRate).toFixed(1)}s for optimal performance...`);
    
    const energyValues = [];
    
    // Fast energy calculation with transient emphasis
    for (let i = 0; i < analysisLength - windowSize; i += hopSize) {
      let energy = 0;
      let highFreqSum = 0;
      
      // Calculate energy with emphasis on beat-relevant frequencies
      for (let j = 0; j < windowSize; j++) {
        const sample = Math.abs(data[i + j]);
        energy += sample;
        
        // Emphasize high frequencies (cymbals, snares) for beat detection
        if (j > windowSize * 0.5) {
          highFreqSum += sample * 1.2;
        }
      }
      
      // Combine total energy with high-frequency emphasis
      energyValues.push(energy + highFreqSum * 0.3);
    }
    
    console.log(`🎵 Energy calculation complete (${energyValues.length} frames), detecting peaks...`);
    
    // Fast peak detection with local maxima
    const onsetStrength = energyValues.map((energy, i) => ({
      time: (i * hopSize) / sampleRate,
      strength: energy,
      index: i
    }));
    
    // Quick adaptive threshold using percentile
    const sortedStrengths = [...energyValues].sort((a, b) => b - a);
    const threshold = sortedStrengths[Math.floor(sortedStrengths.length * 0.2)]; // Top 20%
    
    const peaks = [];
    const minGap = 0.08; // Minimum 80ms between beats (750 BPM max)
    
    // Local maxima detection with minimum gap constraint
    for (let i = 2; i < onsetStrength.length - 2; i++) {
      const current = onsetStrength[i];
      
      // Check if it's a local maximum and above threshold
      if (current.strength > threshold &&
          current.strength > onsetStrength[i-1].strength &&
          current.strength > onsetStrength[i+1].strength &&
          current.strength > onsetStrength[i-2].strength &&
          current.strength > onsetStrength[i+2].strength) {
        
        // Ensure minimum gap between peaks
        if (peaks.length === 0 || current.time - peaks[peaks.length - 1].time > minGap) {
          peaks.push(current);
        }
      }
    }
    
    if (peaks.length < 4) {
      console.warn('Insufficient beats detected, using default BPM');
      return { bpm: 120, beatGrid: this.generateDefaultBeatGrid(data.length / sampleRate) };
    }
    
    // Calculate intervals for BPM detection with clustering
    const intervals = [];
    for (let i = 1; i < Math.min(peaks.length, 15); i++) { // Reduced from 50 to 15 for speed
      const interval = peaks[i].time - peaks[i-1].time;
              if (interval > 0.3 && interval < 1.2) { // Valid beat intervals (50-200 BPM)
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) {
      return { bpm: 120, beatGrid: this.generateDefaultBeatGrid(data.length / sampleRate) };
    }
    
    // Find dominant tempo using median and clustering
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    let bpm = Math.round(60 / medianInterval);
    
    // Validate and correct BPM range
    if (bpm < 60) bpm *= 2;
         if (bpm > 200) bpm /= 2;
    bpm = Math.max(60, Math.min(200, bpm));
    
    console.log(`🎵 Detected BPM: ${bpm} from ${peaks.length} beat candidates`);
        
    // Generate professional beatgrid with downbeats and phrases
    const beatGrid = this.generateProfessionalBeatGrid(bpm, data.length / sampleRate, peaks);
    
    return { bpm, beatGrid };
  }

  // Generate default beatgrid for fallback
  generateDefaultBeatGrid(duration) {
    const bpm = 120;
    const beatInterval = 60 / bpm;
    const beatGrid = [];
    
    // Cover the entire track when generating a fallback beat grid instead of
    // limiting to the first 60 seconds. This prevents beat markers from
    // disappearing on longer songs if BPM detection fails.
    for (let time = 0; time < duration; time += beatInterval) {
      const beatNumber = Math.floor(time / beatInterval);
      const isDownbeat = beatNumber % 4 === 0;
      
      beatGrid.push({
        time: time,
        beat: (beatNumber % 4) + 1,
        bar: Math.floor(beatNumber / 4) + 1,
        type: isDownbeat ? 'downbeat' : 'beat',
        confidence: 0.5,
        isPhraseStart: (beatNumber % 32) === 0,
        isSectionStart: (beatNumber % 128) === 0,
        energy: 0.7
      });
    }
    
    return beatGrid;
  }

  // Professional beatgrid generation with advanced features
  generateProfessionalBeatGrid(bpm, duration, detectedPeaks = []) {
    console.log(`🎵 Generating professional beatgrid: ${bpm} BPM over ${duration.toFixed(2)}s`);
    
    const beatInterval = 60 / bpm;
    const beatsPerBar = 4; // 4/4 time signature
    const beatGrid = [];
    
    // Find best starting point from detected peaks
    let startTime = 0;
    if (detectedPeaks.length > 0) {
      startTime = detectedPeaks[0].time;
    }
    
    // Analyze the entire track by default. Previously this was limited to the
    // first 60 seconds which caused beat markers to vanish once playback
    // passed that point. Removing the cap ensures beat grids cover the whole
    // song so the visual bars stay visible throughout.
    const maxDuration = duration;
    let currentTime = startTime;
    let beatCount = 0;
    
    while (currentTime < maxDuration) {
      const beatInBar = (beatCount % beatsPerBar) + 1;
      const barNumber = Math.floor(beatCount / beatsPerBar) + 1;
      const isDownbeat = beatInBar === 1;
      
      // Phrase and section detection
      const isPhraseStart = ((beatCount % 32) === 0); // 8-bar phrases = 32 beats
      const isSectionStart = ((beatCount % 128) === 0); // 32-bar sections = 128 beats
      
      // Calculate confidence based on proximity to detected peaks
      let confidence = 0.7;
      if (detectedPeaks.length > 0) {
        const nearestPeak = detectedPeaks.reduce((closest, peak) => 
          Math.abs(peak.time - currentTime) < Math.abs(closest.time - currentTime) ? peak : closest
        );
        const distance = Math.abs(nearestPeak.time - currentTime);
        confidence = Math.max(0.4, 1.0 - (distance / (beatInterval * 0.3)));
      }
      
      // Estimate energy level (would be enhanced with actual audio analysis)
      const energy = this.estimateEnergyAtTime(currentTime, duration);
      
      beatGrid.push({
        time: parseFloat(currentTime.toFixed(3)),
        beat: beatInBar,
        bar: barNumber,
        type: isDownbeat ? 'downbeat' : 'beat',
        confidence: parseFloat(confidence.toFixed(2)),
        isPhraseStart: isPhraseStart,
        isSectionStart: isSectionStart,
        energy: parseFloat(energy.toFixed(2)),
        // Additional DJ-specific properties
        isTransitionPoint: this.isGoodTransitionPoint(currentTime, duration, isDownbeat, isPhraseStart),
        vocalActivity: this.estimateVocalActivity(currentTime, duration)
      });
      
      currentTime += beatInterval;
      beatCount++;
    }
    
    console.log(`🎵 Generated ${beatGrid.length} beats with ${beatGrid.filter(b => b.type === 'downbeat').length} downbeats`);
    console.log(`🎵 Found ${beatGrid.filter(b => b.isPhraseStart).length} phrase starts and ${beatGrid.filter(b => b.isTransitionPoint).length} transition points`);
    
    return beatGrid;
  }

  // Determine if a beat position is good for transitions
  isGoodTransitionPoint(time, totalDuration, isDownbeat, isPhraseStart) {
    const normalizedTime = time / totalDuration;
    
    // Avoid transitions in first 10% (intro) and last 10% (outro)
    if (normalizedTime < 0.1 || normalizedTime > 0.9) return false;
    
    // Prefer downbeats and phrase starts
    if (isDownbeat && isPhraseStart) return true;
    if (isDownbeat && normalizedTime > 0.7) return true; // Late downbeats are good
    
    return false;
  }

  // Estimate vocal activity at a given time (simplified)
  estimateVocalActivity(time, totalDuration) {
    const normalizedTime = time / totalDuration;
    
    // Simple vocal activity estimation
    // Real implementation would analyze vocal stem energy
    if (normalizedTime < 0.15) return 0.1; // Intro - minimal vocals
    if (normalizedTime < 0.25) return 0.6; // First verse
    if (normalizedTime < 0.35) return 0.9; // First chorus
    if (normalizedTime < 0.45) return 0.5; // Verse 2
    if (normalizedTime < 0.65) return 0.9; // Chorus/Bridge
    if (normalizedTime < 0.85) return 0.7; // Final section
    return 0.3; // Outro
  }

  // Estimate energy level at a given time (enhanced)
  estimateEnergyAtTime(time, totalDuration) {
    const normalizedTime = time / totalDuration;
    
    // Enhanced energy curve with more realistic patterns
    if (normalizedTime < 0.05) return 0.2; // Silence/fade-in
    if (normalizedTime < 0.15) return 0.4; // Intro build
    if (normalizedTime < 0.25) return 0.6; // Verse energy
    if (normalizedTime < 0.35) return 0.9; // First drop/chorus
    if (normalizedTime < 0.45) return 0.5; // Breakdown/verse
    if (normalizedTime < 0.55) return 0.8; // Build-up
    if (normalizedTime < 0.75) return 1.0; // Peak energy
    if (normalizedTime < 0.85) return 0.7; // Sustained high
    if (normalizedTime < 0.95) return 0.5; // Wind down
    return 0.3; // Outro
  }

  generateBeatGrid(peaks, hopSize, sampleRate, bpm) {
    // Legacy function - redirect to professional version
    const peakObjects = peaks.map(peak => ({
      time: (peak * hopSize) / sampleRate,
      strength: 1.0,
      index: peak
    }));
    
    return this.generateProfessionalBeatGrid(bpm, 60, peakObjects);
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

  // Musical key detection using chroma features
  async detectKey(stemData) {
    console.log('🎵 Analyzing musical key...');
    
    try {
      if (!stemData || !stemData.buffer) {
        return { name: 'C Major', camelot: '8B', confidence: 0 };
      }
      
      // Use full mix (other/vocals stem) for key detection
      const audioBuffer = stemData.buffer;
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Analyze first 30 seconds for key (most stable section)
      const analysisLength = Math.min(sampleRate * 30, audioData.length);
      const analysisData = audioData.slice(0, analysisLength);
      
      // Compute chroma features
      const chromaProfile = this.computeChromaFeatures(analysisData, sampleRate);
      
      // Find best matching key
      const detectedKey = this.findBestKey(chromaProfile);
      
      console.log(`🎵 Detected Key: ${detectedKey.name} (${detectedKey.camelot})`);
      return detectedKey;
    } catch (error) {
      console.error('Key detection failed:', error);
      return { name: 'C Major', camelot: '8B', confidence: 0 };
    }
  }

  // Compute chroma features for key detection
  computeChromaFeatures(audioData, sampleRate) {
    const windowSize = 4096;
    const hopSize = 2048;
    const chromaBins = 12; // 12 semitones
    
    // Initialize chroma profile
    const chromaProfile = new Array(chromaBins).fill(0);
    
    // Process audio in overlapping windows
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      
      // Apply Hann window
      const windowed = window.map((sample, idx) => 
        sample * 0.5 * (1 - Math.cos(2 * Math.PI * idx / (windowSize - 1)))
      );
      
      // Simple spectral analysis
      for (let bin = 0; bin < windowed.length; bin += 8) {
        const frequency = (bin * sampleRate) / windowSize;
        if (frequency < 80 || frequency > 5000) continue; // Musical range
        
        // Convert frequency to chroma class (0-11)
        const chromaClass = this.frequencyToChroma(frequency);
        const magnitude = Math.abs(windowed[bin]);
        
        chromaProfile[chromaClass] += magnitude;
      }
    }
    
    // Normalize chroma profile
    const sum = chromaProfile.reduce((a, b) => a + b, 0);
    return chromaProfile.map(value => sum > 0 ? value / sum : 0);
  }

  // Convert frequency to chroma class (0=C, 1=C#, etc.)
  frequencyToChroma(frequency) {
    // A4 = 440 Hz = chroma class 9 (A)
    const A4 = 440;
    const semitones = 12 * Math.log2(frequency / A4);
    const chromaClass = ((Math.round(semitones) + 9) % 12 + 12) % 12;
    return chromaClass;
  }

  // Generate waveform data for visualization
  generateWaveformData(audioBuffer) {
    if (!audioBuffer) return [];
    
    // Use professional analysis if available
    if (this.professionalAutoDJ && this.advancedMixingEnabled) {
      return this.generateAdvancedWaveformData(audioBuffer);
    }
    
    // Ensure we have a valid AudioBuffer
    if (!audioBuffer.getChannelData || typeof audioBuffer.getChannelData !== 'function') {
      console.warn('Invalid AudioBuffer passed to generateWaveformData:', audioBuffer);
      return [];
    }
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerPixel = Math.floor(channelData.length / 1000); // Generate 1000 data points
    const waveformData = [];
    
    if (samplesPerPixel <= 0) return [];
    
    for (let i = 0; i < channelData.length; i += samplesPerPixel) {
      let rms = 0;
      let peak = 0;
      
      // Calculate RMS and peak for this segment
      for (let j = 0; j < samplesPerPixel && i + j < channelData.length; j++) {
        const sample = Math.abs(channelData[i + j]);
        rms += sample * sample;
        peak = Math.max(peak, sample);
      }
      
      rms = Math.sqrt(rms / samplesPerPixel);
      
      waveformData.push({
        rms: Math.min(rms, 1.0),
        peak: Math.min(peak, 1.0),
        time: (i / sampleRate)
      });
    }
    
    console.log(`🎵 Generated waveform data: ${waveformData.length} points`);
    return waveformData;
  }

  // Find best matching key from chroma profile
  findBestKey(chromaProfile) {
    // Simplified key templates (major and minor scales)
    const keyTemplates = {
      'C Major':  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      'C# Major': [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
      'D Major':  [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      'D# Major': [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
      'E Major':  [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      'F Major':  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
      'F# Major': [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1],
      'G Major':  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      'G# Major': [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
      'A Major':  [0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      'A# Major': [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      'B Major':  [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1],
      
      'A Minor':  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
      'A# Minor': [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      'B Minor':  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
      'C Minor':  [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1],
      'C# Minor': [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      'D Minor':  [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
      'D# Minor': [0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      'E Minor':  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      'F Minor':  [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1],
      'F# Minor': [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      'G Minor':  [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
      'G# Minor': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1]
    };

    // Camelot notation mapping
    const camelotMap = {
      'C Major': '8B', 'A Minor': '8A',
      'C# Major': '3B', 'A# Minor': '3A', 
      'D Major': '10B', 'B Minor': '10A',
      'D# Major': '5B', 'C Minor': '5A',
      'E Major': '12B', 'C# Minor': '12A',
      'F Major': '7B', 'D Minor': '7A',
      'F# Major': '2B', 'D# Minor': '2A',
      'G Major': '9B', 'E Minor': '9A',
      'G# Major': '4B', 'F Minor': '4A',
      'A Major': '11B', 'F# Minor': '11A',
      'A# Major': '6B', 'G Minor': '6A',
      'B Major': '1B', 'G# Minor': '1A'
    };

    let bestKey = 'C Major';
    let bestScore = 0;

    // Find best correlation with key templates
    for (const [keyName, template] of Object.entries(keyTemplates)) {
      let correlation = 0;
      for (let i = 0; i < 12; i++) {
        correlation += chromaProfile[i] * template[i];
      }
      
      if (correlation > bestScore) {
        bestScore = correlation;
        bestKey = keyName;
      }
    }

    return {
      name: bestKey,
      camelot: camelotMap[bestKey] || '8B',
      confidence: Math.min(bestScore * 5, 1.0) // Normalize confidence
    };
  }

  // Check harmonic compatibility using Camelot Wheel
  areKeysCompatible(key1, key2) {
    if (!key1?.camelot || !key2?.camelot) return { compatible: true, score: 0.5, reason: 'Unknown keys' };
    
    const camelot1 = key1.camelot;
    const camelot2 = key2.camelot;
    
    // Same key = perfect
    if (camelot1 === camelot2) return { compatible: true, score: 1.0, reason: 'Same key' };
    
    // Extract number and letter
    const num1 = parseInt(camelot1);
    const letter1 = camelot1.slice(-1);
    const num2 = parseInt(camelot2);
    const letter2 = camelot2.slice(-1);
    
    // Same number, different mode (relative major/minor)
    if (num1 === num2 && letter1 !== letter2) {
      return { compatible: true, score: 0.9, reason: 'Relative major/minor' };
    }
    
    // Adjacent numbers, same mode
    if (letter1 === letter2) {
      const diff = Math.abs(num1 - num2);
      if (diff === 1 || diff === 11) { // Adjacent on wheel
        return { compatible: true, score: 0.8, reason: 'Adjacent key' };
      }
    }
    
    // Perfect fifth (7 semitones apart)
    if (letter1 === letter2) {
      const diff = Math.abs(num1 - num2);
      if (diff === 7 || diff === 5) {
        return { compatible: true, score: 0.7, reason: 'Perfect fifth' };
      }
    }
    
    return { compatible: false, score: 0.3, reason: 'Key clash risk' };
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
    // Handle deck-specific stem names (e.g., "deckA_vocals" or just "vocals")
    let actualStemName = stemName;
    let deck = 'A'; // Default deck
    
    if (stemName.includes('deck')) {
      const parts = stemName.split('_');
      deck = parts[0].replace('deck', ''); // "A" or "B"
      actualStemName = parts[1]; // "vocals", "drums", etc.
    }
    
    console.log(`🎛️ Setting ${actualStemName} volume on Deck ${deck} to ${Math.round(volume * 100)}%`);
    
    // Update internal volume tracking
    this.stemVolumes[actualStemName] = Math.max(0, Math.min(1, volume));
    
    // Apply to the correct deck's gain node
    const gainNode = deck === 'A' ? 
      (this.stemGains[actualStemName]?.trackA || this.stemGains[actualStemName]) :
      (this.stemGains[actualStemName]?.trackB);
    
    if (gainNode && gainNode.gain) {
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    } else {
      console.warn(`No gain node found for ${actualStemName} on Deck ${deck}`);
    }
    
    this.notifyListeners('stemVolumeChanged', { 
      stemName: actualStemName, 
      deck: deck,
      volume 
    });
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
    console.log('🚀 INSTANT MANUAL TRANSITION - No blocking allowed!');
    
    if (this.isTransitioning) {
      console.log('🚀 Manual transition blocked - Already transitioning');
      return;
    }
    
    if (!this.nextTrack) {
      console.log('🚀 Manual transition blocked - No next track available');
      return;
    }
    
    // Stop any existing transition processes first
    this.stopAllTransitionProcesses();
    
    // BYPASS AUTO-MIX CHECK FOR MANUAL TRANSITIONS
    // Manual transitions should always work regardless of auto-mix setting
    
    // Use instant professional transition system
    if (this.professionalAutoDJ && this.advancedMixingEnabled) {
      return this.triggerProfessionalTransition();
    }
    
    // Fallback to instant basic transition
    return this.triggerBasicTransition();
  }

  stopAllTransitionProcesses() {
    console.log('🔄 Stopping all previous transition processes');
    
    // Clear any transition timers
    if (this.transitionTimers) {
      this.transitionTimers.forEach(timer => clearTimeout(timer));
      this.transitionTimers = [];
    }
    
    // Stop any existing Deck B sources to prevent overlapping
    if (this.nextTrack && this.nextTrack.stems) {
      Object.values(this.nextTrack.stems).forEach(stemData => {
        if (stemData.source) {
          try {
            stemData.source.stop();
            stemData.source = null;
          } catch (error) {
            console.warn('Error stopping previous stem source:', error);
          }
        }
      });
    }
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
    console.log('🎵 AI DJ: Performing fast professional transition');
    
    // Professional quick transition - 4 seconds total
    const transitionDuration = 4000;
    
    // Start next track immediately
    await this.startBackgroundLayer();
    
    // Quick complementary stem mixing - 3 seconds
    await this.performAdvancedElementMixing(3000);
    
    // Fast final crossfade - 1 second
    await this.performSmoothCrossfade(1000);
    
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
    console.log(`🎛️ AI DJ: Smart complementary stem mixing over ${duration/1000}s`);
    
    // PROFESSIONAL COMPLEMENTARY MIXING - NO SAME STEM OVERLAPS
    // Track A: Keeps vocals + other, reduces drums + bass
    // Track B: Takes drums + bass, gets other, NO vocals overlap
    const phases = [
      // Phase 1: Track B bass takes over completely, Track A bass OUT
      { 
        trackA: { element: 'bass', targetGain: 0.0 },
        trackB: { element: 'bass', targetGain: 0.9 },
        delay: 0, 
        description: 'Bass handover - Track A bass OFF, Track B bass ON' 
      },
      // Phase 2: Track B drums layer in, Track A drums OUT  
      { 
        trackA: { element: 'drums', targetGain: 0.0 },
        trackB: { element: 'drums', targetGain: 1.0 },
        delay: duration * 0.3, 
        description: 'Drum handover - Track A drums OFF, Track B drums ON' 
      },
      // Phase 3: Track B other elements, Track A vocals stay
      { 
        trackA: { element: 'other', targetGain: 0.3 },
        trackB: { element: 'other', targetGain: 0.8 },
        delay: duration * 0.6, 
        description: 'Harmonic blend - Track B other, Track A other reduced' 
      },
      // Phase 4: Track A vocals FADE OUT, Track B vocals STAY OFF (ENFORCED)
      { 
        trackA: { element: 'vocals', targetGain: 0.0 },
        trackB: { element: 'vocals', targetGain: 0.0 },
        delay: duration * 0.6, // Start vocal fadeout earlier to prevent overlap
        description: 'STRICT vocal fadeout - NO VOCAL OVERLAP EVER' 
      }
    ];
    
        phases.forEach(phase => {
      const timer = setTimeout(() => {
        console.log(`🎵 ${phase.description}`);
        
        // STRICT VOCAL PROTECTION: Never allow vocal overlap
        if (phase.trackA.element === 'vocals' || phase.trackB.element === 'vocals') {
          console.log('🎤 VOCAL PROTECTION: Enforcing no-overlap rule');
          
          // Force both deck vocals to 0 immediately
          if (this.stemGains.vocals) {
            if (this.stemGains.vocals.trackA) {
              this.stemGains.vocals.trackA.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
            if (this.stemGains.vocals.trackB) {
              this.stemGains.vocals.trackB.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
          }
        }
        
        // Adjust Track A stem - ACTUALLY modify the audio gain
        if (this.stemGains[phase.trackA.element] && this.stemGains[phase.trackA.element].gain) {
          const currentGain = this.stemGains[phase.trackA.element].gain.value;
          console.log(`🎛️ AI: Setting Track A ${phase.trackA.element} from ${currentGain.toFixed(2)} to ${phase.trackA.targetGain.toFixed(2)}`);
          
          // REAL audio modification
          this.stemGains[phase.trackA.element].gain.setValueAtTime(currentGain, this.audioContext.currentTime);
          this.stemGains[phase.trackA.element].gain.linearRampToValueAtTime(
            phase.trackA.targetGain, 
            this.audioContext.currentTime + (duration * 0.15 / 1000)
          );
          
          // Update UI in real-time
          this.notifyListeners('stemVolumeChanged', {
            deck: 'A',
            stemName: phase.trackA.element,
            volume: phase.trackA.targetGain
          });
        }
        
        // Adjust Track B stem - ACTUALLY modify the audio gain
        if (this.nextTrackStemGains && this.nextTrackStemGains[phase.trackB.element] && this.nextTrackStemGains[phase.trackB.element].gain) {
          console.log(`🎛️ AI: Setting Track B ${phase.trackB.element} to ${phase.trackB.targetGain.toFixed(2)}`);
          
          // REAL audio modification
          this.nextTrackStemGains[phase.trackB.element].gain.setValueAtTime(0, this.audioContext.currentTime);
          this.nextTrackStemGains[phase.trackB.element].gain.linearRampToValueAtTime(
            phase.trackB.targetGain, 
            this.audioContext.currentTime + (duration * 0.15 / 1000)
          );
          
          // Update UI in real-time
          this.notifyListeners('stemVolumeChanged', {
            deck: 'B',
            stemName: phase.trackB.element,
            volume: phase.trackB.targetGain
          });
        }
      }, phase.delay);
      
      // Track timer for cleanup
      this.transitionTimers.push(timer);
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
    console.log('🎵 AI DJ: Starting intelligent harmonic transition between tracks');
    
    if (!this.nextTrack) {
      console.log('No next track available for transition');
      return;
    }
    
    try {
      // Advanced professional DJ analysis: BPM + Key + Energy
      const currentBPM = this.currentTrack.bmp || 120;
      const nextBPM = this.nextTrack.bmp || 120;
      const bmpDifference = Math.abs(currentBPM - nextBPM);
      
      // Harmonic compatibility analysis
      const currentKey = this.currentTrack.key;
      const nextKey = this.nextTrack.key;
      const keyCompatibility = this.areKeysCompatible(currentKey, nextKey);
      
      // Analyze vocal activity and transition timing for professional mixing
      const currentVocalActivity = this.analyzeCurrentVocalActivity();
      const optimalTransitionPoint = this.findOptimalTransitionPoint();
      
      console.log(`🎵 AI DJ: Professional Track Analysis:`);
      console.log(`   🎵 Current: ${currentBPM} BPM, ${currentKey?.name || 'Unknown'} (${currentKey?.camelot || 'N/A'})`);
      console.log(`   🎵 Next: ${nextBPM} BPM, ${nextKey?.name || 'Unknown'} (${nextKey?.camelot || 'N/A'})`);
      console.log(`   📊 BPM Difference: ${bmpDifference}`);
      console.log(`   🎼 Key Compatibility: ${keyCompatibility.reason} (Score: ${keyCompatibility.score.toFixed(2)})`);
      console.log(`   🎤 Vocal Activity: ${(currentVocalActivity * 100).toFixed(0)}%`);
      console.log(`   ⏰ Transition Point: ${optimalTransitionPoint.quality} (${optimalTransitionPoint.waitTime.toFixed(1)}s wait)`);
      
      // Wait for optimal transition point if needed
      if (optimalTransitionPoint.waitTime > 0 && optimalTransitionPoint.waitTime < 8) {
        console.log(`🎵 AI DJ: Waiting for optimal transition point...`);
        await new Promise(resolve => setTimeout(resolve, optimalTransitionPoint.waitTime * 1000));
      }
      
      // Professional transition selection with vocal-aware logic
      if (currentVocalActivity > 0.7 && bmpDifference <= 6) {
        // High vocal activity - use echo out to avoid vocal clash
        console.log('🎵 AI DJ: High vocal activity - using echo out transition');
        await this.performEchoOutTransition(currentBPM, keyCompatibility);
      } else if (bmpDifference <= 3 && keyCompatibility.score >= 0.8) {
        // Perfect harmonic match - extended musical crossfade
        console.log('🎵 AI DJ: Perfect harmonic match - using extended musical crossfade');
        await this.performHarmonicCrossfade(10000, keyCompatibility);
      } else if (bmpDifference <= 6 && keyCompatibility.compatible) {
        // Good compatibility - phrase-aligned transition
        console.log('🎵 AI DJ: Good compatibility - using phrase-aligned transition');
        await this.performPhraseAlignedTransition(currentBPM, nextBPM, keyCompatibility);
      } else if (bmpDifference <= 12) {
        // Moderate difference - key sync with filter sweep
        console.log('🎵 AI DJ: Moderate difference - using filter sweep transition');
        await this.performFilterSweepTransition(currentBPM, nextBPM, keyCompatibility);
      } else if (keyCompatibility.compatible) {
        // Large BPM but good key - creative harmonic break
        console.log('🎵 AI DJ: Large BPM but good key - using harmonic break transition');
        await this.performHarmonicBreakTransition(keyCompatibility);
      } else {
        // Large difference + key clash - creative effect-assisted transition
        console.log('🎵 AI DJ: Large difference + key clash - using effect-assisted creative transition');
        await this.performCreativeEffectTransition(bmpDifference, keyCompatibility);
      }
      
    } catch (error) {
      console.error('Error during intelligent transition:', error);
      this.notifyListeners('trackEnded');
    }
  }

  async performSmoothCrossfade(duration) {
    // Determine fade duration dynamically if not provided
    const bpm = this.currentTrack?.bpm || 120;
    const defaultBeats = 8;
    const fadeDuration = duration || (60 / bpm) * defaultBeats * 1000;

    // Optionally wait until the next phrase boundary for a musical start
    const wait = this.findNextPhraseBoundary(bpm) - this.currentTime;
    if (wait > 0 && wait < 8) {
      await new Promise(res => setTimeout(res, wait * 1000));
    }

    // Start playing next track slightly ahead to ensure sync
    const nextTrackStartTime = this.audioContext.currentTime + 0.05;
    this.startNextTrackPlayback(nextTrackStartTime);


    const fadeStart = nextTrackStartTime;
    const fadeEnd = fadeStart + fadeDuration / 1000;

    // Pre-compute equal-power crossfade curves
    const steps = 50;
    const curveA = new Float32Array(steps);
    const curveB = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const p = i / (steps - 1);
      curveA[i] = Math.cos(p * Math.PI / 2);
      curveB[i] = Math.sin(p * Math.PI / 2);
    }

    this.trackAGain.gain.cancelScheduledValues(fadeStart);
    this.trackBGain.gain.cancelScheduledValues(fadeStart);
    this.trackAGain.gain.setValueCurveAtTime(curveA, fadeStart, fadeDuration / 1000);
    this.trackBGain.gain.setValueCurveAtTime(curveB, fadeStart, fadeDuration / 1000);

    const animate = () => {
      const progress = Math.min((this.audioContext.currentTime - fadeStart) / (fadeDuration / 1000), 1);
      this.updateCrossfaderUI(progress);
      if (progress < 1) {
        requestAnimationFrame(animate);

      } else {
        this.completeTransition();
      }
    };

    requestAnimationFrame(animate);

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
    
    console.log('🎵 AI DJ: Starting next track playback on Deck B');
    
    // Reset and start Deck B time tracking
    this.deckBCurrentTime = 0;
    this.deckBStartTime = startTime || this.audioContext.currentTime;
    this.startDeckBTimeTracking();
    
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
        
        // CRITICAL: Start ALL Track B stems at ZERO volume to prevent overlap
        gainNode.gain.value = 0.0;
        console.log(`🔇 Track B ${stemName}: Started at 0% volume (will be brought in during transition)`);
        
        source.start(this.deckBStartTime, 0);
        stemData.source = source;
      }
    });
  }

  startDeckBTimeTracking() {
    // Stop any existing Deck B time tracking
    if (this.deckBTimeUpdateInterval) {
      clearInterval(this.deckBTimeUpdateInterval);
    }
    
    const updateDeckBTime = () => {
      if (this.nextTrack && this.deckBStartTime > 0) {
        const elapsed = this.audioContext.currentTime - this.deckBStartTime;
        this.deckBCurrentTime = Math.min(elapsed, this.nextTrack.duration || 300);
        
        // Notify UI of Deck B time updates
        this.notifyListeners('deckBTimeUpdate', {
          currentTime: this.deckBCurrentTime,
          duration: this.nextTrack.duration || 300,
          progress: (this.deckBCurrentTime / (this.nextTrack.duration || 300)) * 100
        });
      }
    };
    
    this.deckBTimeUpdateInterval = setInterval(updateDeckBTime, 50); // 20 FPS for Deck B
  }

  // PROFESSIONAL BEAT MATCHING ALGORITHM
  async performProfessionalBeatMatching() {
    if (!this.currentTrack || !this.nextTrack) {
      console.log('❌ Beat matching failed: Missing tracks');
      return { pitchRatio: 1.0, transitionPoint: 0, beatOffset: 0 };
    }

    console.log('🎵 PROFESSIONAL BEAT MATCHING: Analyzing tracks for perfect alignment...');

    const currentBPM = this.currentTrack.bmp || this.currentTrack.bpm || 120;
    const nextBPM = this.nextTrack.bmp || this.nextTrack.bpm || 120;
    const currentBeatGrid = this.currentTrack.beatGrid || [];
    const nextBeatGrid = this.nextTrack.beatGrid || [];

    // 1. TEMPO MATCHING: Calculate perfect pitch ratio
    let pitchRatio = 1.0;
    if (Math.abs(currentBPM - nextBPM) > 2) { // Only adjust if BPM difference > 2
      pitchRatio = currentBPM / nextBPM;
      console.log(`🎵 Tempo matching: ${nextBPM}→${currentBPM} BPM (${pitchRatio.toFixed(3)}x)`);
    }

    // 2. BEAT GRID ALIGNMENT: Find optimal transition point
    const currentTime = this.currentTime;
    const currentTrackBeats = currentBeatGrid.filter(beat => beat.time > currentTime);
    const nextTrackBeats = nextBeatGrid.slice(0, 32); // First 32 beats of next track

    let bestTransitionPoint = currentTime + 8; // Default: 8 seconds from now
    let bestBeatOffset = 0;
    let bestScore = 0;

    if (currentTrackBeats.length > 0 && nextTrackBeats.length > 0) {
      // Find the best beat alignment within next 32 beats
      for (let i = 0; i < Math.min(16, currentTrackBeats.length); i++) {
        const currentBeat = currentTrackBeats[i];
        
        // Only consider downbeats and phrase starts for smooth transitions
        if (currentBeat.isDownbeat || currentBeat.isPhraseStart) {
          const beatScore = this.calculateBeatMatchingScore(currentBeat, nextTrackBeats, pitchRatio);
          
          if (beatScore.score > bestScore) {
            bestScore = beatScore.score;
            bestTransitionPoint = currentBeat.time;
            bestBeatOffset = beatScore.offset || 0;
          }
        }
      }
      
      console.log(`🎵 Best transition point: ${bestTransitionPoint.toFixed(2)}s (score: ${bestScore.toFixed(2)})`);
    }

    // 3. PHRASE BOUNDARY DETECTION: Prefer musical phrase transitions
    const phraseBoundary = this.findOptimalPhraseBoundary(currentTime, bestTransitionPoint);
    if (phraseBoundary) {
      bestTransitionPoint = phraseBoundary;
      console.log(`🎵 Using phrase boundary: ${bestTransitionPoint.toFixed(2)}s`);
    }

    // 4. HARMONIC COMPATIBILITY: Check key compatibility
    const harmonicScore = this.calculateHarmonicCompatibility();
    console.log(`🎵 Harmonic compatibility: ${harmonicScore.toFixed(2)}/1.0`);

    return {
      pitchRatio: pitchRatio,
      transitionPoint: bestTransitionPoint,
      beatOffset: bestBeatOffset,
      harmonicScore: harmonicScore,
      bpmDifference: Math.abs(currentBPM - nextBPM)
    };
  }

  calculateBeatMatchingScore(currentBeat, nextTrackBeats, pitchRatio) {
    let bestScore = 0;
    let bestOffset = 0;

    // Try to align current beat with various beats in next track
    for (let j = 0; j < Math.min(8, nextTrackBeats.length); j++) {
      const nextBeat = nextTrackBeats[j];
      
      // Adjust next beat time for pitch ratio
      const adjustedNextBeatTime = nextBeat.time / pitchRatio;
      
      // Calculate alignment score based on beat types and positions
      let score = 0;
      
      // Bonus for downbeat-to-downbeat alignment
      if (currentBeat.isDownbeat && nextBeat.isDownbeat) {
        score += 10;
      }
      
      // Bonus for phrase-to-phrase alignment  
      if (currentBeat.isPhraseStart && nextBeat.isPhraseStart) {
        score += 15;
      }
      
      // Bonus for beat strength matching
      const strengthDiff = Math.abs((currentBeat.strength || 0.5) - (nextBeat.strength || 0.5));
      score += (1 - strengthDiff) * 5;
      
      // Penalty for odd beat positions (prefer 1, 5, 9, 13...)
      const beatInMeasure = (j % 4) + 1;
      if (beatInMeasure === 1) score += 3; // Downbeat
      else if (beatInMeasure === 3) score += 1; // Beat 3
      
      if (score > bestScore) {
        bestScore = score;
        bestOffset = adjustedNextBeatTime;
      }
    }

    return { score: bestScore, offset: bestOffset };
  }

  findOptimalPhraseBoundary(currentTime, proposedTime) {
    if (!this.currentTrack.beatGrid) return null;
    
    // Look for phrase boundaries near the proposed transition point
    const searchWindow = 4; // seconds
    const nearbyBeats = this.currentTrack.beatGrid.filter(beat => 
      Math.abs(beat.time - proposedTime) <= searchWindow && beat.isPhraseStart
    );
    
    if (nearbyBeats.length > 0) {
      // Return the closest phrase boundary
      return nearbyBeats.reduce((closest, beat) => 
        Math.abs(beat.time - proposedTime) < Math.abs(closest.time - proposedTime) ? beat : closest
      ).time;
    }
    
    return null;
  }

  calculateHarmonicCompatibility() {
    if (!this.currentTrack.key || !this.nextTrack.key) return 0.7; // Neutral score
    
    const currentKey = this.currentTrack.key;
    const nextKey = this.nextTrack.key;
    
    // Use Camelot Wheel for harmonic compatibility
    const compatibilityMap = {
      // Perfect matches (same key)
      '1A': ['1A', '1B', '12A', '2A'], '1B': ['1B', '1A', '12B', '2B'],
      '2A': ['2A', '2B', '1A', '3A'], '2B': ['2B', '2A', '1B', '3B'],
      '3A': ['3A', '3B', '2A', '4A'], '3B': ['3B', '3A', '2B', '4B'],
      '4A': ['4A', '4B', '3A', '5A'], '4B': ['4B', '4A', '3B', '5B'],
      '5A': ['5A', '5B', '4A', '6A'], '5B': ['5B', '5A', '4B', '6B'],
      '6A': ['6A', '6B', '5A', '7A'], '6B': ['6B', '6A', '5B', '7B'],
      '7A': ['7A', '7B', '6A', '8A'], '7B': ['7B', '7A', '6B', '8B'],
      '8A': ['8A', '8B', '7A', '9A'], '8B': ['8B', '8A', '7B', '9B'],
      '9A': ['9A', '9B', '8A', '10A'], '9B': ['9B', '9A', '8B', '10B'],
      '10A': ['10A', '10B', '9A', '11A'], '10B': ['10B', '10A', '9B', '11B'],
      '11A': ['11A', '11B', '10A', '12A'], '11B': ['11B', '11A', '10B', '12B'],
      '12A': ['12A', '12B', '11A', '1A'], '12B': ['12B', '12A', '11B', '1B']
    };
    
    const currentCamelot = currentKey.camelot;
    const nextCamelot = nextKey.camelot;
    
    if (compatibilityMap[currentCamelot]) {
      const compatibleKeys = compatibilityMap[currentCamelot];
      const compatibilityIndex = compatibleKeys.indexOf(nextCamelot);
      if (compatibilityIndex === 0) return 1.0; // Perfect match
      if (compatibilityIndex === 1) return 0.9; // Relative minor/major
      if (compatibilityIndex >= 0) return 0.8; // Adjacent key
    }
    
    return 0.5; // Neutral/clash
  }

  async adjustTempo(targetBPM) {
    // Use the new professional beat matching
    const beatMatchResult = await this.performProfessionalBeatMatching();
    
    console.log('🎵 Professional beat matching result:', beatMatchResult);
    
    // Store results for transition timing
    this.beatMatchResult = beatMatchResult;
    
    return beatMatchResult.pitchRatio;
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

  // Real-time UI update methods for live representation
  updateCrossfaderUI(position) {
    this.notifyListeners('crossfadeChanged', { position });
  }

  updateEQUI(deck, band, value) {
    this.notifyListeners('deckEQChanged', { deck, band, value });
  }

  updateEffectUI(deck, effectName, value) {
    this.notifyListeners('deckEffectChanged', { deck, effectName, value });
  }

  updateStemUI(deck, stemName, volume) {
    this.notifyListeners('stemVolumeChanged', { deck, stemName, volume });
  }

  completeTransition() {
    console.log('🎵 AI DJ: Completing transition - Track B becomes main');
    
    // Clean up Deck B time tracking
    if (this.deckBTimeUpdateInterval) {
      clearInterval(this.deckBTimeUpdateInterval);
      this.deckBTimeUpdateInterval = null;
    }
    
    // Switch tracks properly
    if (this.nextTrack) {
      this.currentTrack = this.nextTrack;
      this.duration = this.nextTrack.duration;
      this.currentTime = 0;
      
      // Update deck assignment
      this.currentDeck = this.nextTrack.deck || 'B';
      
      // Audio routing - Track B content becomes Track A audio path
      this.trackAGain.gain.value = 0.8; // Track B content now on Track A path
      this.trackBGain.gain.value = 0;   // Clear Track B for next track
      
      console.log(`🎵 ${this.currentTrack.title} is now the main track on Deck A audio path`);
    }
    
    // Reset transition state
    this.nextTrack = null;
    this.nextTrackStemGains = null;
    this.nextTrackPitchRatio = 1.0;
    this.isTransitioning = false;
    this.hasStartedTransition = false;
    this.transitionStartTime = null;
    this.deckBCurrentTime = 0;
    this.deckBStartTime = 0;
    
    // Reset crossfader to center
    this.setCrossfade(0.5);
    
    // Notify queue manager of transition completion
    if (this.queueManager) {
      this.queueManager.onTrackTransition(this.currentDeck === 'A' ? 'B' : 'A');
    }
    
    // Notify UI of completion
    this.notifyListeners('transitionComplete', {
      newCurrentTrack: this.currentTrack,
      newMainDeck: this.currentDeck
    });
    
    // Reset transition button UI
    this.notifyListeners('transitionButtonReset');
  }

  setAutoMix(enabled) {
    this.autoMixEnabled = enabled;
    this.notifyListeners('autoMixChanged', { enabled });
  }

  async loadNextTrack(trackData) {
    console.log('🎵 Loading next track for Deck B:', trackData.title);
    this.nextTrack = trackData;
    
    // Load and analyze Track B stems for beatgrid
    try {
      const loadedTrack = await this.loadTrack(trackData, false); // Don't make it current
      
      // Notify UI that Track B is loaded with beatgrid
      this.notifyListeners('deckBTrackLoaded', {
        track: loadedTrack,
        deck: 'B',
        bpm: loadedTrack.bpm,
        beatGrid: loadedTrack.beatGrid || [],
        waveform: loadedTrack.waveform || []
      });
      
      console.log(`🎵 Track B loaded: ${trackData.title} (${loadedTrack.bmp || 120} BPM)`);
    } catch (error) {
      console.error('Error loading Track B:', error);
    }
  }

  // ===== ADVANCED HARMONIC TRANSITION METHODS =====

  // Perfect harmonic match - extended musical crossfade
  async performHarmonicCrossfade(duration = 10000, keyCompatibility) {
    console.log(`🎵 AI DJ: Performing harmonic crossfade over ${duration/1000}s`);
    console.log(`🎼 Key relationship: ${keyCompatibility.reason}`);
    
    // Start next track with harmonic alignment
    await this.startBackgroundLayer();
    
    // Extended EQ-based transition respecting key harmony
    await this.performHarmonicEQTransition(duration, keyCompatibility);
    
    // Final smooth crossfade
    await this.performSmoothCrossfade(duration * 0.3);
    
    this.completeTransition();
  }

  // Good compatibility - phrase-aligned transition
  async performPhraseAlignedTransition(currentBPM, nextBPM, keyCompatibility) {
    console.log(`🎵 AI DJ: Performing phrase-aligned transition`);
    
    // Wait for phrase boundary (8 or 16 beats)
    const phraseBoundary = this.findNextPhraseBoundary(currentBPM);
    console.log(`🎵 Waiting for phrase boundary at ${phraseBoundary}s`);
    
    // Start next track at phrase boundary
    setTimeout(async () => {
      await this.startBackgroundLayer();
      await this.performAdvancedElementMixing(6000);
      await this.performSmoothCrossfade(3000);
      this.completeTransition();
    }, phraseBoundary * 1000);
  }

  // Key sync with tempo matching
  async performKeySyncTransition(currentBPM, nextBPM, keyCompatibility) {
    console.log(`🎵 AI DJ: Performing key sync transition`);
    
    // Apply key sync if needed (shift pitch by semitones)
    const keySyncShift = this.calculateKeySyncShift(keyCompatibility);
    if (keySyncShift !== 0) {
      console.log(`🎼 Applying key sync: ${keySyncShift} semitones`);
      this.applyKeySync(keySyncShift);
    }
    
    // Tempo matching with pitch shifting
    const pitchRatio = currentBPM / nextBPM;
    this.setupPitchShifting(pitchRatio);
    
    await this.startBackgroundLayer();
    await this.performAdvancedElementMixing(5000);
    await this.performSmoothCrossfade(2000);
    
    this.completeTransition();
  }

  // Harmonic break transition for large BPM but compatible keys  
  async performHarmonicBreakTransition(keyCompatibility) {
    console.log(`🎵 AI DJ: Performing harmonic break transition`);
    
    // Create dramatic filter sweep while maintaining harmonic content
    this.applyHarmonicFilter(keyCompatibility);
    
    // Quick break with harmonic preservation
    setTimeout(async () => {
      await this.startBackgroundLayer();
      
      // Slam effect but with harmonic alignment
      this.trackBGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.trackBGain.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.2);
      
      // Quick stem-based transition
      await this.performAdvancedElementMixing(2000);
      this.completeTransition();
    }, 1000);
  }

  // Creative effect-assisted transition for challenging combinations
  async performCreativeEffectTransition(bmpDifference, keyCompatibility) {
    console.log(`🎵 AI DJ: Performing creative effect transition`);
    console.log(`🎼 Large BPM difference (${bmpDifference}) + key challenge`);
    
    // Use echo-out with harmonic filtering
    this.applyEchoOut(this.currentTrack.bmp);
    
    // Filter sweep to mask key clash
    this.applyCreativeFilter();
    
    setTimeout(async () => {
      await this.startBackgroundLayer();
      
      // Dramatic effect entry
      this.applyDramaticEntry();
      
      // Quick transition with heavy effect processing
      await this.performAdvancedElementMixing(3000);
      this.completeTransition();
    }, 2000);
  }

  // ===== HELPER METHODS FOR ADVANCED TRANSITIONS =====

  findNextPhraseBoundary(bpm) {
    // Find next 8 or 16 beat boundary based on current position
    const beatsPerSecond = bpm / 60;
    const currentBeat = this.currentTime * beatsPerSecond;
    const nextPhrase = Math.ceil(currentBeat / 8) * 8; // Next 8-beat phrase
    return nextPhrase / beatsPerSecond;
  }

  calculateKeySyncShift(keyCompatibility) {
    // Calculate semitone shift needed for key compatibility
    if (keyCompatibility.score >= 0.7) return 0; // Already compatible
    
    // Simple heuristic: try +/- 1 or 2 semitones
    const shiftOptions = [-2, -1, 1, 2];
    return shiftOptions[Math.floor(Math.random() * shiftOptions.length)];
  }

  applyKeySync(semitones) {
    // Apply pitch shift to next track for key compatibility
    const pitchShift = Math.pow(2, semitones / 12);
    this.nextTrackPitchRatio = pitchShift;
    console.log(`🎼 Key sync applied: ${semitones} semitones (${pitchShift.toFixed(3)}x)`);
  }

  performHarmonicEQTransition(duration, keyCompatibility) {
    return new Promise(resolve => {
      // EQ transition that respects harmonic content
      const steps = 20;
      const stepDuration = duration / steps;
      
      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          const progress = i / steps;
          
          // Preserve harmonic frequencies during transition
          this.applyHarmonicEQ(progress, keyCompatibility);
          
          if (i === steps - 1) resolve();
        }, i * stepDuration);
      }
    });
  }

  applyHarmonicEQ(progress, keyCompatibility) {
    // EQ that preserves harmonic content
    const smoothProgress = 0.5 * (1 - Math.cos(Math.PI * progress));
    
    // Frequency-conscious EQ based on key relationship
    if (keyCompatibility.score >= 0.8) {
      // High compatibility - gentle EQ transition
      this.setDeckEQ('A', 'low', 1 - smoothProgress * 0.7);
      this.setDeckEQ('B', 'low', smoothProgress * 0.9);
    } else {
      // Lower compatibility - more aggressive filtering
      this.setDeckEQ('A', 'high', 1 - smoothProgress * 0.8);
      this.setDeckEQ('B', 'high', smoothProgress * 0.8);
    }
  }

  applyHarmonicFilter(keyCompatibility) {
    // Filter that considers harmonic content  
    if (keyCompatibility.score >= 0.6) {
      // Preserve harmonic frequencies
      this.setDeckEffect('A', 'filter', 0.3);
    } else {
      // Aggressive filtering for key clash
      this.setDeckEffect('A', 'filter', 0.1);
    }
  }

  applyEchoOut(bpm) {
    // BPM-synced echo effect for transitions
    const echoTime = 60 / bpm / 4; // Quarter note echo
    this.setDeckEffect('A', 'delay', 0.6);
    console.log(`🎵 Applied BPM-synced echo: ${echoTime.toFixed(3)}s`);
  }

  applyCreativeFilter() {
    // Creative filter sweep for dramatic transitions
    const filterSweep = setInterval(() => {
      const filterValue = 0.5 + 0.4 * Math.sin(Date.now() / 200);
      this.setDeckEffect('A', 'filter', filterValue);
    }, 50);
    
    setTimeout(() => clearInterval(filterSweep), 2000);
  }

  applyDramaticEntry() {
    // Dramatic entry effect for next track
    this.setDeckEffect('B', 'reverb', 0.8);
    this.setDeckEffect('B', 'filter', 0.8);
    
    // Fade in effects
    setTimeout(() => {
      this.setDeckEffect('B', 'reverb', 0.2);
      this.setDeckEffect('B', 'filter', 0.5);
    }, 1000);
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

  // === PROFESSIONAL VOCAL-AWARE TRANSITION FUNCTIONS ===

  // Analyze current vocal activity to avoid vocal clashes
  analyzeCurrentVocalActivity() {
    if (!this.stemGains || !this.stemGains.vocals || !this.stemGains.vocals.gain) return 0.5;
    
    const vocalGain = this.stemGains.vocals.gain.value || 0.5;
    const currentTime = this.currentTime || 0;
    const duration = this.duration || 1;
    
    // Use beatgrid vocal activity estimation if available
    if (this.currentTrack.beatGrid) {
      const nearestBeat = this.currentTrack.beatGrid.reduce((closest, beat) => 
        Math.abs(beat.time - currentTime) < Math.abs(closest.time - currentTime) ? beat : closest
      );
      
      if (nearestBeat && nearestBeat.vocalActivity !== undefined) {
        return nearestBeat.vocalActivity * vocalGain;
      }
    }
    
    // Fallback to time-based estimation
    return this.estimateVocalActivity(currentTime, duration) * vocalGain;
  }

  // Find optimal transition point based on beatgrid analysis
  findOptimalTransitionPoint() {
    const currentTime = this.currentTime;
    const beatGrid = this.currentTrack.beatGrid || [];
    
    if (beatGrid.length === 0) {
      return {
        time: currentTime,
        waitTime: 0,
        quality: 'immediate'
      };
    }
    
    // Find next good transition points in the next 16 seconds
    const futureBeats = beatGrid.filter(beat => 
      beat.time > currentTime && beat.time < currentTime + 16
    );
    
    // Prefer transition points with low vocal activity
    const idealPoints = futureBeats.filter(beat => 
      beat.isTransitionPoint && beat.vocalActivity < 0.5
    );
    
    if (idealPoints.length > 0) {
      const best = idealPoints[0];
      return {
        time: best.time,
        waitTime: best.time - currentTime,
        quality: 'optimal',
        beat: best
      };
    }
    
    // Fallback to next downbeat with low vocals
    const nextGoodDownbeat = futureBeats.find(beat => 
      beat.type === 'downbeat' && beat.vocalActivity < 0.7
    );
    
    if (nextGoodDownbeat) {
      return {
        time: nextGoodDownbeat.time,
        waitTime: nextGoodDownbeat.time - currentTime,
        quality: 'good',
        beat: nextGoodDownbeat
      };
    }
    
    // Immediate transition as last resort
    return {
      time: currentTime,
      waitTime: 0,
      quality: 'immediate'
    };
  }

  // Professional echo-out transition to avoid vocal clashes
  async performEchoOutTransition(currentBPM, keyCompatibility) {
    console.log('🎵 AI DJ: Echo-out transition - professional vocal handling');
    
    const echoBeats = 4; // 4 beats of echo
    const beatDuration = (60 / currentBPM) * 1000; // milliseconds per beat
    
    // Apply echo to current track
    this.applyEchoOut(currentBPM);
    
    // Start next track on the next downbeat
    setTimeout(async () => {
      await this.startBackgroundLayer();
      console.log('🎵 Next track started on downbeat');
      
      // Bring in next track with bass first (no vocals)
      if (this.nextTrackStemGains) {
        this.nextTrackStemGains.vocals.gain.value = 0; // No vocals initially
        this.nextTrackStemGains.bass.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        this.nextTrackStemGains.drums.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        this.nextTrackStemGains.other.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      }
      
      // Fade out current track vocals while maintaining rhythm
      setTimeout(() => {
        if (this.stemGains.vocals) {
          this.animateGain(this.stemGains.vocals, this.stemGains.vocals.gain.value, 0, 2000);
        }
      }, beatDuration);
      
      // Bring in next track vocals after echo completes
      setTimeout(() => {
        if (this.nextTrackStemGains && this.nextTrackStemGains.vocals) {
          this.animateGain(this.nextTrackStemGains.vocals, 0, 0.8, 1500);
          console.log('🎵 Next track vocals brought in cleanly');
        }
      }, echoBeats * beatDuration);
      
      // Complete the transition
      setTimeout(() => {
        this.performSmoothCrossfade(2000);
      }, (echoBeats + 2) * beatDuration);
      
    }, beatDuration); // Wait for next beat
  }

  // Professional filter sweep transition
  async performFilterSweepTransition(currentBPM, nextBPM, keyCompatibility) {
    console.log('🎵 AI DJ: Filter sweep transition with tempo sync');
    
    // Apply high-pass filter sweep on current track
    await this.applyFilterSweep('highpass', 4000);
    
    // Setup tempo matching for next track
    const tempoRatio = currentBPM / nextBPM;
    this.setupPitchShifting(tempoRatio);
    
    // Start next track with low-pass filter
    setTimeout(async () => {
      await this.startBackgroundLayer();
      await this.applyFilterSweep('lowpass', 2000);
      
      // Gradually remove filters and crossfade
      setTimeout(async () => {
        await this.removeFilters();
        await this.performSmoothCrossfade(3000);
      }, 3000);
    }, 2000);
  }

  // Apply echo effect synced to BPM
  applyEchoOut(bpm) {
    const beatDuration = 60 / bpm; // seconds per beat
    const echoTime = beatDuration / 2; // 8th note echoes
    
    if (this.effectNodes.deckA?.delayNode) {
      // Configure delay for echo effect
      this.effectNodes.deckA.delayNode.delayTime.setValueAtTime(echoTime, this.audioContext.currentTime);
      
      // Create feedback loop for echo
      if (this.effectNodes.deckA.delayFeedback) {
        this.effectNodes.deckA.delayFeedback.gain.setValueAtTime(0.6, this.audioContext.currentTime);
      }
      if (this.effectNodes.deckA.delayGain) {
        this.effectNodes.deckA.delayGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      }
      
      console.log(`🎵 Applied professional echo out: ${echoTime.toFixed(3)}s delay at ${bpm} BPM with feedback`);
    }
  }

  // Apply professional filter sweep
  async applyFilterSweep(filterType, frequency) {
    const deck = 'A'; // Current track
    const filterNode = this.effectNodes[`deck${deck}`]?.filterNode;
    
    if (!filterNode) {
      console.warn(`🎵 No filter node found for Deck ${deck}`);
      return;
    }
    
    filterNode.type = filterType;
    const startFreq = filterType === 'highpass' ? 50 : 20000;
    filterNode.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    
    // Sweep filter over 3 seconds with smooth transition
    filterNode.frequency.exponentialRampToValueAtTime(frequency, this.audioContext.currentTime + 3);
    
    console.log(`🎵 Applied professional ${filterType} filter sweep: ${startFreq}Hz → ${frequency}Hz over 3s`);
  }

  // Remove all filters
  async removeFilters() {
    ['A', 'B'].forEach(deck => {
      const filterNode = this.effectNodes[`deck${deck}`]?.filterNode;
      if (filterNode) {
        // Reset to full frequency range smoothly
        filterNode.frequency.setValueAtTime(filterNode.frequency.value, this.audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(20000, this.audioContext.currentTime + 1);
        console.log(`🎵 Removed filters from Deck ${deck}`);
      }
    });
    
    console.log('🎵 All filters removed - full frequency range restored');
  }

  /**
   * PROFESSIONAL AUTO-DJ INTEGRATION
   */
  async initializeProfessionalAutoDJ() {
    try {
      // Dynamic import to avoid circular dependencies
      const { default: ProfessionalAutoDJ } = await import('./professionalAutoDJ');
      this.professionalAutoDJ = new ProfessionalAutoDJ(this);
      
      console.log('🎵 Professional Auto-DJ System Initialized');
      
    } catch (error) {
      console.error('Failed to initialize Professional Auto-DJ:', error);
      this.advancedMixingEnabled = false;
    }
  }

  async initializeQueueManager() {
    try {
      // Dynamic import to avoid circular dependencies
      const { default: QueueManager } = await import('./queueManager.js');
      this.queueManager = new QueueManager(this);
      
      // Set up queue manager event listeners
      this.queueManager.addEventListener((event, data) => {
        // Forward queue events to UI listeners
        this.notifyListeners(event, data);
      });
      
      console.log('🎵 Professional Queue Manager Initialized');
      
    } catch (error) {
      console.error('Failed to initialize Queue Manager:', error);
    }
  }

  async triggerProfessionalTransition() {
    if (!this.professionalAutoDJ || !this.advancedMixingEnabled) {
      return this.triggerBasicTransition();
    }

    if (this.isTransitioning) {
      console.log('🚀 Professional transition blocked - Already transitioning');
      return;
    }

    if (!this.nextTrack) {
      console.log('🚀 Professional transition blocked - No next track available');
      return;
    }

    console.log('🎵 PROFESSIONAL TRANSITION - BEAT-SYNCHRONIZED MODE');
    this.isTransitioning = true;

    // Calculate beat-synchronized transition with energy matching
    const transitionPlan = await this.calculateBeatSyncedTransition();
    
    if (transitionPlan.waitTime > 0) {
      console.log(`🎼 Waiting ${(transitionPlan.waitTime/1000).toFixed(1)}s for bar boundary (Track 1: ${transitionPlan.track1ExitPoint}s → Track 2: ${transitionPlan.track2EntryPoint}s)`);
      
      // Wait for the next bar boundary
      setTimeout(async () => {
        console.log(`🎵 Starting beat-synced transition NOW! (Energy match: ${transitionPlan.energyCompatibility})`);
        await this.executeBeatSyncedTransition(transitionPlan);
      }, transitionPlan.waitTime);
      
    } else {
      // Start immediately if already on a bar boundary
      console.log('🎵 Starting beat-synced transition immediately (already on bar boundary)');
      await this.executeBeatSyncedTransition(transitionPlan);
    }
  }

  createInstantTransitionPlan() {
    console.log('🚀 Creating PROFESSIONAL DJ transition plan - COMPLEMENTARY STEMS ONLY');
    
    return {
      style: 'professional_complementary_mixing',
      duration: 8000, // 8 seconds for proper DJ transition
      startTime: 0,
      
      phases: [
        {
          time: 0,
          description: 'Phase 1: Track A keeps vocals+other, Track B takes bass only',
          actions: [
            // Track A: Keep vocals and melody
            { track: 'A', stem: 'vocals', volume: 1.0 },
            { track: 'A', stem: 'other', volume: 1.0 },
            { track: 'A', stem: 'drums', volume: 1.0 },
            { track: 'A', stem: 'bass', volume: 0.0 }, // Hand over bass
            
            // Track B: Only bass, everything else OFF
            { track: 'B', stem: 'bass', volume: 0.8 },
            { track: 'B', stem: 'drums', volume: 0.0 },
            { track: 'B', stem: 'vocals', volume: 0.0 },
            { track: 'B', stem: 'other', volume: 0.0 }
          ]
        },
        {
          time: 2000,
          description: 'Phase 2: Track B takes drums, Track A gives up drums',
          actions: [
            // Track A: Keep vocals+other, lose drums
            { track: 'A', stem: 'vocals', volume: 1.0 },
            { track: 'A', stem: 'other', volume: 0.8 },
            { track: 'A', stem: 'drums', volume: 0.0 }, // Hand over drums
            { track: 'A', stem: 'bass', volume: 0.0 },
            
            // Track B: Has bass+drums, no vocals/other
            { track: 'B', stem: 'bass', volume: 0.9 },
            { track: 'B', stem: 'drums', volume: 0.9 },
            { track: 'B', stem: 'vocals', volume: 0.0 },
            { track: 'B', stem: 'other', volume: 0.0 }
          ]
        },
        {
          time: 4000,
          description: 'Phase 3: Harmonic blend - Track B gets other, Track A reduces other',
          actions: [
            // Track A: Only vocals now
            { track: 'A', stem: 'vocals', volume: 0.9 },
            { track: 'A', stem: 'other', volume: 0.2 }, // Reduce other
            { track: 'A', stem: 'drums', volume: 0.0 },
            { track: 'A', stem: 'bass', volume: 0.0 },
            
            // Track B: Bass+drums+other, NO VOCALS
            { track: 'B', stem: 'bass', volume: 1.0 },
            { track: 'B', stem: 'drums', volume: 1.0 },
            { track: 'B', stem: 'vocals', volume: 0.0 }, // NEVER overlap vocals
            { track: 'B', stem: 'other', volume: 0.6 }
          ]
        },
        {
          time: 6000,
          description: 'Phase 4: STRICT vocal handover - A vocals out, B vocals in',
          actions: [
            // Track A: Everything OFF
            { track: 'A', stem: 'vocals', volume: 0.0 }, // Vocals fade out
            { track: 'A', stem: 'other', volume: 0.0 },
            { track: 'A', stem: 'drums', volume: 0.0 },
            { track: 'A', stem: 'bass', volume: 0.0 },
            
            // Track B: Full track but delayed vocal entry
            { track: 'B', stem: 'bass', volume: 1.0 },
            { track: 'B', stem: 'drums', volume: 1.0 },
            { track: 'B', stem: 'vocals', volume: 0.0 }, // Wait for vocal clear
            { track: 'B', stem: 'other', volume: 0.8 }
          ]
        },
        {
          time: 7000,
          description: 'Phase 5: Track B full track - vocals safe to enter',
          actions: [
            // Track A: Completely silent
            { track: 'A', stem: 'vocals', volume: 0.0 },
            { track: 'A', stem: 'other', volume: 0.0 },
            { track: 'A', stem: 'drums', volume: 0.0 },
            { track: 'A', stem: 'bass', volume: 0.0 },
            
            // Track B: Full track with vocals
            { track: 'B', stem: 'bass', volume: 1.0 },
            { track: 'B', stem: 'drums', volume: 1.0 },
            { track: 'B', stem: 'vocals', volume: 1.0 }, // Now safe to bring in
            { track: 'B', stem: 'other', volume: 1.0 }
          ]
        }
      ]
    };
  }

  async executeProfessionalTransitionPlan(plan) {
    console.log(`🎭 Executing ${plan.style} transition (${plan.duration}ms)`);
    
    this.currentTransitionPlan = plan;
    
    // Start next track playback
    await this.startNextTrackPlayback();
    
    // Execute each phase of the transition
    for (const phase of plan.phases) {
      setTimeout(() => {
        this.executeTransitionPhase(phase);
      }, phase.time);
    }
    
    // Complete transition after duration
    setTimeout(() => {
      this.completeTransition();
      this.currentTransitionPlan = null;
    }, plan.duration);
  }

  executeTransitionPhase(phase) {
    console.log(`🎵 ${phase.description}`);
    
    phase.actions.forEach(action => {
      this.executeTransitionAction(action);
    });
  }

  executeTransitionAction(action) {
    const { track, stem, volume, filter, cutoff, effect, loop } = action;
    
    console.log(`🎛️ DJ ACTION: Track ${track} ${stem} → ${volume !== undefined ? (volume * 100).toFixed(0) + '%' : 'N/A'}`);
    
    // Apply volume changes to specific stems
    if (volume !== undefined) {
      if (track === 'A' && stem === 'all') {
        // Set all Track A stems
        ['vocals', 'drums', 'bass', 'other'].forEach(stemName => {
          if (this.stemGains[stemName] && this.stemGains[stemName].trackA) {
            this.stemGains[stemName].trackA.gain.setValueAtTime(volume, this.audioContext.currentTime);
            console.log(`🎵 Track A ${stemName}: ${(volume * 100).toFixed(0)}%`);
          } else {
            console.warn(`⚠️ No Track A gain node for ${stemName}`);
          }
        });
      } else if (track === 'B' && stem === 'all') {
        // Set all Track B stems
        ['vocals', 'drums', 'bass', 'other'].forEach(stemName => {
          if (this.stemGains[stemName] && this.stemGains[stemName].trackB) {
            this.stemGains[stemName].trackB.gain.setValueAtTime(volume, this.audioContext.currentTime);
            console.log(`🎵 Track B ${stemName}: ${(volume * 100).toFixed(0)}%`);
          } else {
            console.warn(`⚠️ No Track B gain node for ${stemName}`);
          }
        });
      } else if (stem && ['vocals', 'drums', 'bass', 'other'].includes(stem)) {
        // Individual stem control
        if (track === 'A' && this.stemGains[stem] && this.stemGains[stem].trackA) {
          this.stemGains[stem].trackA.gain.setValueAtTime(volume, this.audioContext.currentTime);
          console.log(`🎵 Track A ${stem}: ${(volume * 100).toFixed(0)}%`);
          
          // Notify UI of stem volume change
          this.notifyListeners('stemVolumeChanged', {
            deck: 'A',
            stemName: stem,
            volume: volume
          });
        } else if (track === 'B' && this.stemGains[stem] && this.stemGains[stem].trackB) {
          this.stemGains[stem].trackB.gain.setValueAtTime(volume, this.audioContext.currentTime);
          console.log(`🎵 Track B ${stem}: ${(volume * 100).toFixed(0)}%`);
          
          // Notify UI of stem volume change
          this.notifyListeners('stemVolumeChanged', {
            deck: 'B',
            stemName: stem,
            volume: volume
          });
        } else {
          console.warn(`⚠️ No gain node found for Track ${track} ${stem}`);
        }
      }
    }
    
    // Apply filters (simplified - would need proper filter implementation)
    if (filter && cutoff) {
      console.log(`🎛️ Apply ${filter} filter at ${cutoff}Hz to track ${track} ${stem}`);
    }
    
    // Apply effects (simplified)
    if (effect) {
      console.log(`🎚️ Apply ${effect} effect to track ${track} ${stem}`);
    }
  }

  triggerBasicTransition() {
    // Instant transition method - no checks, no analysis, no blocking
    console.log('⚡ INSTANT BASIC TRANSITION - No UI freeze guaranteed');
    
    if (this.isTransitioning) {
      console.log('🚀 Manual transition blocked - Already transitioning');
      return;
    }
    
    if (!this.nextTrack) {
      console.log('🚀 Manual transition blocked - No next track available');
      return;
    }
    
    this.hasStartedTransition = true;
    this.isTransitioning = true;
    
    // Execute instant basic transition - no heavy processing
    setTimeout(() => {
      this.performInstantBasicTransition();
    }, 0);
  }

  async performInstantBasicTransition() {
    console.log('⚡ INSTANT BASIC TRANSITION - No blocking operations');
    
    // Start next track immediately
    await this.startNextTrackPlayback();
    
    // Simple 4-second crossfade without any analysis
    await this.performSimpleCrossfade(4000);
    
    // Complete transition
    this.completeTransition();
  }

  async performSimpleCrossfade(duration) {
    console.log(`🎵 PROFESSIONAL complementary crossfade over ${duration/1000}s - NO STEM OVERLAP`);
    
    // Professional DJ complementary stem mixing - no overlapping stems
    const stemTransitions = [
      {
        time: 0,
        description: 'Track A: Full track, Track B: Bass only',
        trackA: { vocals: 1.0, drums: 1.0, bass: 0.0, other: 1.0 }, // Give up bass
        trackB: { vocals: 0.0, drums: 0.0, bass: 0.8, other: 0.0 }  // Take bass only
      },
      {
        time: duration * 0.3,
        description: 'Track B takes drums, Track A loses drums',
        trackA: { vocals: 1.0, drums: 0.0, bass: 0.0, other: 0.8 }, // Lose drums
        trackB: { vocals: 0.0, drums: 0.9, bass: 0.9, other: 0.0 }  // Take drums
      },
      {
        time: duration * 0.6,
        description: 'Track B gets harmonics, Track A only vocals',
        trackA: { vocals: 0.9, drums: 0.0, bass: 0.0, other: 0.2 }, // Mostly vocals
        trackB: { vocals: 0.0, drums: 1.0, bass: 1.0, other: 0.6 }  // No vocals yet
      },
      {
        time: duration * 0.8,
        description: 'Vocal handover - A out, B delayed',
        trackA: { vocals: 0.0, drums: 0.0, bass: 0.0, other: 0.0 }, // Complete fadeout
        trackB: { vocals: 0.0, drums: 1.0, bass: 1.0, other: 0.8 }  // Still no vocals
      },
      {
        time: duration,
        description: 'Track B full - vocals safe to enter',
        trackA: { vocals: 0.0, drums: 0.0, bass: 0.0, other: 0.0 }, // Silent
        trackB: { vocals: 1.0, drums: 1.0, bass: 1.0, other: 1.0 }  // Full track
      }
    ];
    
    stemTransitions.forEach(transition => {
      setTimeout(() => {
        console.log(`🎛️ ${transition.description}`);
        
        // Apply Track A stem levels
        ['vocals', 'drums', 'bass', 'other'].forEach(stem => {
          if (this.stemGains[stem] && this.stemGains[stem].trackA) {
            this.stemGains[stem].trackA.gain.setValueAtTime(
              transition.trackA[stem], 
              this.audioContext.currentTime
            );
            console.log(`🎵 A-${stem}: ${(transition.trackA[stem] * 100).toFixed(0)}%`);
          } else {
            console.warn(`⚠️ No Track A gain node for ${stem}`);
          }
        });
        
        // Apply Track B stem levels
        ['vocals', 'drums', 'bass', 'other'].forEach(stem => {
          if (this.stemGains[stem] && this.stemGains[stem].trackB) {
            this.stemGains[stem].trackB.gain.setValueAtTime(
              transition.trackB[stem], 
              this.audioContext.currentTime
            );
            console.log(`🎵 B-${stem}: ${(transition.trackB[stem] * 100).toFixed(0)}%`);
          } else {
            console.warn(`⚠️ No Track B gain node for ${stem}`);
          }
        });
      }, transition.time);
    });
  }

  // Enhanced waveform generation with professional analysis
  generateAdvancedWaveformData(audioBuffer) {
    if (!audioBuffer.getChannelData || typeof audioBuffer.getChannelData !== 'function') {
      console.warn('Invalid AudioBuffer passed to generateWaveformData:', audioBuffer);
      return [];
    }
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerPixel = Math.floor(channelData.length / 1000);
    const waveformData = [];
    
    if (samplesPerPixel <= 0) return [];
    
    for (let i = 0; i < channelData.length; i += samplesPerPixel) {
      let rms = 0;
      let peak = 0;
      let bassEnergy = 0;
      let midEnergy = 0;
      let trebleEnergy = 0;
      
      // Enhanced frequency analysis
      for (let j = 0; j < samplesPerPixel && i + j < channelData.length; j++) {
        const sample = Math.abs(channelData[i + j]);
        rms += sample * sample;
        peak = Math.max(peak, sample);
        
        // Simple frequency separation (improved version would use FFT)
        if (j % 8 === 0) bassEnergy += sample;      // Low frequencies
        if (j % 4 === 0) midEnergy += sample;       // Mid frequencies  
        if (j % 2 === 0) trebleEnergy += sample;    // High frequencies
      }
      
      rms = Math.sqrt(rms / samplesPerPixel);
      bassEnergy /= (samplesPerPixel / 8);
      midEnergy /= (samplesPerPixel / 4);
      trebleEnergy /= (samplesPerPixel / 2);
      
      waveformData.push({
        rms: Math.min(rms, 1.0),
        peak: Math.min(peak, 1.0),
        bass: Math.min(bassEnergy, 1.0),
        mid: Math.min(midEnergy, 1.0),
        treble: Math.min(trebleEnergy, 1.0),
        time: (i / sampleRate)
      });
    }
    
    console.log(`🎵 Generated advanced waveform data: ${waveformData.length} points`);
    return waveformData;
  }

  // Get professional analysis metrics
  getProfessionalMetrics() {
    if (this.professionalAutoDJ) {
      return this.professionalAutoDJ.getPerformanceMetrics();
    }
    return null;
  }

  /**
   * Calculate beat-synchronized transition timing
   */
  async calculateBeatSyncedTransition() {
    const currentTime = this.currentTime || 0;
    const currentBPM = this.currentTrack?.currentBPM || this.currentTrack?.bpm || 120;
    const nextBPM = this.nextTrack?.currentBPM || this.nextTrack?.bpm || 120;
    
    console.log(`🎼 Analyzing transition: Current time ${currentTime.toFixed(1)}s (${currentBPM} BPM)`);
    
    // Find next bar boundary in current track
    const nextBarBoundary = this.findNextBarBoundary(currentTime, currentBPM);
    const waitTime = Math.max(0, (nextBarBoundary - currentTime) * 1000);
    
    // Analyze energy at the exit point
    const exitEnergy = this.analyzeEnergyAtPosition(this.currentTrack, nextBarBoundary);
    
    // Find matching energy point in next track
    const entryPoint = this.findMatchingEnergyPoint(this.nextTrack, exitEnergy, nextBPM);
    
    // Calculate energy compatibility
    const entryEnergy = this.analyzeEnergyAtPosition(this.nextTrack, entryPoint);
    const energyCompatibility = 1 - Math.abs(exitEnergy - entryEnergy);
    
    console.log(`🎯 Energy analysis: Track 1 exit (${exitEnergy.toFixed(2)}) → Track 2 entry (${entryEnergy.toFixed(2)}) = ${(energyCompatibility*100).toFixed(0)}% match`);
    
    return {
      waitTime,
      track1ExitPoint: nextBarBoundary,
      track2EntryPoint: entryPoint,
      exitEnergy,
      entryEnergy,
      energyCompatibility,
      currentBPM,
      nextBPM,
      beatsPerBar: 4,
      msPerBeat: (60 / currentBPM) * 1000
    };
  }

  /**
   * Find the next bar boundary based on BPM
   */
  findNextBarBoundary(currentTime, bpm) {
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    
    // Find which bar we're currently in
    const currentBar = Math.floor(currentTime / secondsPerBar);
    const nextBarStart = (currentBar + 1) * secondsPerBar;
    
    console.log(`🎼 Current: ${currentTime.toFixed(1)}s (Bar ${currentBar + 1}) → Next bar: ${nextBarStart.toFixed(1)}s`);
    
    return nextBarStart;
  }

  /**
   * Analyze energy at a specific position in a track
   */
  analyzeEnergyAtPosition(track, position) {
    // Simple energy estimation based on position and track characteristics
    // In a real implementation, this would analyze the actual audio data
    
    const duration = track.duration || 180;
    const normalizedPosition = position / duration;
    
    // Energy curve: builds up, peaks in middle, tapers at end
    let baseEnergy = track.energy || 0.7;
    
    if (normalizedPosition < 0.1) {
      // Intro - lower energy
      baseEnergy *= 0.6;
    } else if (normalizedPosition < 0.3) {
      // Build-up
      baseEnergy *= (0.6 + (normalizedPosition - 0.1) * 2);
    } else if (normalizedPosition < 0.8) {
      // Main section - full energy
      baseEnergy *= 1.0;
    } else {
      // Outro - decreasing energy
      baseEnergy *= (1.0 - (normalizedPosition - 0.8) * 1.5);
    }
    
    // Add some variation based on bars (simulate build-ups and drops)
    const barsIn = Math.floor(position / (60 / (track.bpm || 120) * 4));
    const variation = Math.sin(barsIn * 0.1) * 0.1;
    
    return Math.max(0.1, Math.min(1.0, baseEnergy + variation));
  }

  /**
   * Find matching energy point in next track
   */
  findMatchingEnergyPoint(track, targetEnergy, bpm) {
    const duration = track.duration || 180;
    const beatsPerBar = 4;
    const secondsPerBar = (60 / bpm) * beatsPerBar;
    
    let bestPoint = 0;
    let bestEnergyMatch = 0;
    
    // Search for best energy match on bar boundaries
    for (let bar = 0; bar < Math.floor(duration / secondsPerBar); bar++) {
      const barTime = bar * secondsPerBar;
      const energy = this.analyzeEnergyAtPosition(track, barTime);
      const energyMatch = 1 - Math.abs(energy - targetEnergy);
      
      if (energyMatch > bestEnergyMatch) {
        bestEnergyMatch = energyMatch;
        bestPoint = barTime;
      }
    }
    
    console.log(`🎯 Best entry point: ${bestPoint.toFixed(1)}s (Energy: ${this.analyzeEnergyAtPosition(track, bestPoint).toFixed(2)}, Match: ${(bestEnergyMatch*100).toFixed(0)}%)`);
    
    return bestPoint;
  }

  /**
   * Execute beat-synchronized transition with strict stem isolation
   */
  async executeBeatSyncedTransition(plan) {
    console.log('🎵 EXECUTING PHRASE-BASED TRANSITION - STRICT STEM ISOLATION');
    
    // Start the next track at the calculated entry point
    await this.startNextTrackPlayback();
    
    // CRITICAL: Set ALL Track B stems to ZERO initially to prevent overlap
    ['vocals', 'drums', 'bass', 'other'].forEach(stemName => {
      if (this.stemGains[stemName] && this.stemGains[stemName].trackB) {
        this.stemGains[stemName].trackB.gain.setValueAtTime(0, this.audioContext.currentTime);
        console.log(`🔇 Track B ${stemName}: MUTED initially`);
      }
    });
    
    // Set the next track to start at the calculated entry point
    if (this.nextTrack && this.nextTrack.stems) {
      Object.keys(this.nextTrack.stems).forEach(stemName => {
        const stemData = this.nextTrack.stems[stemName];
        if (stemData && stemData.source) {
          // Adjust start time to match entry point
          stemData.source.playbackRate.value = plan.nextBPM / plan.currentBPM;
        }
      });
    }
    
    // Create phrase-based stem transition plan
    const stemTransitionPlan = this.createGradualStemPlan(plan);
    
    // Execute each stem transition at natural musical moments
    stemTransitionPlan.forEach((stemPhase, index) => {
      const delay = stemPhase.timeOffset; // Use calculated musical timing
      
      setTimeout(() => {
        console.log(`🎼 ${stemPhase.musicalCue}: ${stemPhase.description}`);
        
        // Apply QUICK stem handover (2 seconds max) to prevent overlap
        stemPhase.changes.forEach(change => {
          const { track, stem, fromVolume, toVolume } = change;
          const gainNode = track === 'A' ? 
            this.stemGains[stem]?.trackA : 
            this.stemGains[stem]?.trackB;
          
          if (gainNode) {
            // FAST crossfade (2 seconds max) to prevent stem overlap
            const crossfadeDuration = 2.0; // Quick handover
            
            gainNode.gain.setValueAtTime(fromVolume, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
              toVolume, 
              this.audioContext.currentTime + crossfadeDuration
            );
            
            console.log(`🎵 ${track}-${stem}: ${(fromVolume*100).toFixed(0)}% → ${(toVolume*100).toFixed(0)}% over ${crossfadeDuration}s (QUICK HANDOVER)`);
            
            // STRICT ISOLATION: If Track A is giving up a stem, ensure it goes to absolute zero
            if (track === 'A' && toVolume === 0) {
              setTimeout(() => {
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                console.log(`🔇 STRICT ISOLATION: Track A ${stem} forced to 0% (no bleed)`);
              }, crossfadeDuration * 1000 + 100); // Slight delay to ensure complete fadeout
            }
          }
        });
        
        // Verification: Show current stem states after this transition
        setTimeout(() => {
          console.log(`🔍 STEM STATE VERIFICATION after ${stemPhase.musicalCue}:`);
          ['bass', 'drums', 'other', 'vocals'].forEach(stemName => {
            const trackAVolume = this.stemGains[stemName]?.trackA?.gain?.value || 0;
            const trackBVolume = this.stemGains[stemName]?.trackB?.gain?.value || 0;
            console.log(`   ${stemName}: Track A=${(trackAVolume*100).toFixed(0)}%, Track B=${(trackBVolume*100).toFixed(0)}%`);
          });
        }, 3000); // Check 3 seconds after transition starts
      }, delay);
    });
    
    // Complete transition after all stems have been swapped
    const maxTransitionTime = Math.max(...stemTransitionPlan.map(p => p.timeOffset));
    setTimeout(() => {
      this.completeTransition();
    }, maxTransitionTime + 4000); // Reduced time since crossfades are quicker
  }

  /**
   * Create gradual stem transition plan (based on musical phrases)
   */
  createGradualStemPlan(plan) {
    const stemOrder = [
      { stem: 'bass', priority: 1, phraseDelay: 0 },      // Bass immediately - foundation
      { stem: 'drums', priority: 2, phraseDelay: 1 },     // Drums after 8-16 bars - rhythm
      { stem: 'other', priority: 3, phraseDelay: 2 },     // Harmonics after another phrase - melody
      { stem: 'vocals', priority: 4, phraseDelay: 3 }     // Vocals last - avoid overlap
    ];
    
    const stemPhases = [];
    
    // Analyze track structure for natural transition points
    const transitionPoints = this.findNaturalTransitionPoints(plan);
    
    stemOrder.forEach((stemInfo, index) => {
      const { stem, phraseDelay } = stemInfo;
      const transitionPoint = transitionPoints[index] || transitionPoints[0];
      
      stemPhases.push({
        phraseNumber: index + 1,
        timeOffset: transitionPoint.timeOffset,
        musicalCue: transitionPoint.cue,
        description: `${stem.toUpperCase()} handover at ${transitionPoint.cue} (${transitionPoint.timeOffset/1000}s)`,
        changes: [
          {
            track: 'A',
            stem: stem,
            fromVolume: index === 0 ? 1.0 : this.getPreviousVolume('A', stem, index),
            toVolume: 0.0  // Track A gives up this stem
          },
          {
            track: 'B', 
            stem: stem,
            fromVolume: 0.0,
            toVolume: this.getTargetVolume(stem, plan.energyCompatibility)  // Track B takes this stem
          }
        ]
      });
    });
    
    console.log(`🎼 Created ${stemPhases.length} phrase-based transition points:`);
    stemPhases.forEach(phase => {
      console.log(`   ${phase.description}`);
    });
    
    return stemPhases;
  }

  /**
   * Get previous volume for a stem (for smooth transitions)
   */
  getPreviousVolume(track, stem, barIndex) {
    // Start with full volume, gradually reduce as we hand over stems
    const baseVolume = 1.0;
    const reduction = barIndex * 0.1; // Slight reduction for each stem handed over
    return Math.max(0.2, baseVolume - reduction);
  }

  /**
   * Get target volume based on stem type and energy compatibility
   */
  getTargetVolume(stem, energyCompatibility) {
    const baseVolumes = {
      bass: 0.9,    // Strong bass presence
      drums: 1.0,   // Full drums
      other: 0.8,   // Moderate harmonics
      vocals: 0.85  // Strong vocals
    };
    
    // Adjust based on energy compatibility
    const energyMultiplier = 0.7 + (energyCompatibility * 0.3); // 0.7-1.0 range
    
    return (baseVolumes[stem] || 0.8) * energyMultiplier;
  }

  /**
   * Find natural transition points based on musical structure
   */
  findNaturalTransitionPoints(plan) {
    const bpm = plan.currentBPM;
    const beatsPerBar = 4;
    const barsPerPhrase = 8; // Standard phrase length
    const secondsPerBar = (60 / bpm) * beatsPerBar;
    const secondsPerPhrase = secondsPerBar * barsPerPhrase;
    
    console.log(`🎼 Analyzing musical structure: ${bpm} BPM, ${secondsPerPhrase.toFixed(1)}s per phrase`);
    
    // Define natural transition points with musical reasoning
    const transitionPoints = [
      {
        timeOffset: 0, // Immediate - bass foundation
        cue: 'Phrase Start',
        musicalReason: 'Bass establishes new foundation immediately',
        bars: 0
      },
      {
        timeOffset: secondsPerPhrase * 1000, // 8 bars later
        cue: 'End of Phrase 1',
        musicalReason: 'Natural phrase boundary - drums can enter',
        bars: 8
      },
      {
        timeOffset: secondsPerPhrase * 2 * 1000, // 16 bars later  
        cue: 'Verse/Chorus Change',
        musicalReason: 'Major section change - harmonics transition',
        bars: 16
      },
      {
        timeOffset: secondsPerPhrase * 3 * 1000, // 24 bars later
        cue: 'Pre-Hook/Bridge',
        musicalReason: 'Energy shift moment - vocals handover safe',
        bars: 24
      }
    ];
    
    // Analyze track structure for better timing
    const structuralPoints = this.analyzeTrackStructure(plan);
    
    // Adjust transition points based on actual track analysis
    return transitionPoints.map((point, index) => {
      const structuralAdjustment = structuralPoints[index] || 0;
      return {
        ...point,
        timeOffset: point.timeOffset + structuralAdjustment,
        adjusted: structuralAdjustment !== 0
      };
    });
  }

  /**
   * Analyze track structure for natural transition moments
   */
  analyzeTrackStructure(plan) {
    const duration = this.currentTrack?.duration || 180;
    const currentPosition = plan.track1ExitPoint;
    const normalizedPosition = currentPosition / duration;
    
    console.log(`🎯 Track structure analysis: ${currentPosition.toFixed(1)}s / ${duration}s (${(normalizedPosition*100).toFixed(0)}%)`);
    
    // Adjust timing based on song position
    const adjustments = [];
    
    if (normalizedPosition < 0.25) {
      // Early in song - longer gaps between transitions
      adjustments.push(0, 4000, 8000, 16000); // Extra spacing
    } else if (normalizedPosition > 0.75) {
      // Late in song - quicker transitions for outro
      adjustments.push(0, 2000, 4000, 6000); // Closer together
    } else {
      // Middle of song - standard phrase timing
      adjustments.push(0, 0, 0, 0); // No adjustment needed
    }
    
    return adjustments;
  }

  /**
   * Get appropriate phrase duration for transitions
   */
  getPhraseDuration(plan, musicalCue) {
    const bpm = plan.currentBPM;
    const basePhraseDuration = (60 / bpm) * 4 * 4 * 1000; // 4 bars in milliseconds
    
    // Adjust duration based on musical context
    switch (musicalCue) {
      case 'Phrase Start':
        return basePhraseDuration * 2; // 8 bars - foundation change needs time
      case 'End of Phrase 1':
        return basePhraseDuration * 1.5; // 6 bars - rhythm change
      case 'Verse/Chorus Change':
        return basePhraseDuration; // 4 bars - harmonic transition
      case 'Pre-Hook/Bridge':
        return basePhraseDuration * 0.5; // 2 bars - quick vocal switch
      default:
        return basePhraseDuration;
    }
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
