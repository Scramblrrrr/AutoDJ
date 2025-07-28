/**
 * Professional Auto-DJ System
 * Implements advanced DJ techniques including beat matching, harmonic mixing,
 * stem-based transitions, and intelligent mixing algorithms based on the detailed specification
 */

class ProfessionalAutoDJ {
  constructor() {
    this.isAnalyzing = false;
    this.analysisCache = new Map();
    this.currentTransitionStyle = null;
    
    // Professional transition styles available
    this.transitionStyles = [
      'relaxed_transition',
      'high_energy_overlap', 
      'rolling_transition',
      'double_drop',
      'quick_cut_with_effect',
      'vocal_over_mix',
      'loop_transition'
    ];
    
    // Camelot Wheel for harmonic mixing
    this.camelotWheel = {
      '1A': { key: 'A♭ minor', adjacents: ['1B', '12A', '2A'], complementary: '1B' },
      '1B': { key: 'B major', adjacents: ['1A', '12B', '2B'], complementary: '1A' },
      '2A': { key: 'E♭ minor', adjacents: ['2B', '1A', '3A'], complementary: '2B' },
      '2B': { key: 'F# major', adjacents: ['2A', '1B', '3B'], complementary: '2A' },
      '3A': { key: 'B♭ minor', adjacents: ['3B', '2A', '4A'], complementary: '3B' },
      '3B': { key: 'D♭ major', adjacents: ['3A', '2B', '4B'], complementary: '3A' },
      '4A': { key: 'F minor', adjacents: ['4B', '3A', '5A'], complementary: '4B' },
      '4B': { key: 'A♭ major', adjacents: ['4A', '3B', '5B'], complementary: '4A' },
      '5A': { key: 'C minor', adjacents: ['5B', '4A', '6A'], complementary: '5B' },
      '5B': { key: 'E♭ major', adjacents: ['5A', '4B', '6B'], complementary: '5A' },
      '6A': { key: 'G minor', adjacents: ['6B', '5A', '7A'], complementary: '6B' },
      '6B': { key: 'B♭ major', adjacents: ['6A', '5B', '7B'], complementary: '6A' },
      '7A': { key: 'D minor', adjacents: ['7B', '6A', '8A'], complementary: '7B' },
      '7B': { key: 'F major', adjacents: ['7A', '6B', '8B'], complementary: '7A' },
      '8A': { key: 'A minor', adjacents: ['8B', '7A', '9A'], complementary: '8B' },
      '8B': { key: 'C major', adjacents: ['8A', '7B', '9B'], complementary: '8A' },
      '9A': { key: 'E minor', adjacents: ['9B', '8A', '10A'], complementary: '9B' },
      '9B': { key: 'G major', adjacents: ['9A', '8B', '10B'], complementary: '9A' },
      '10A': { key: 'B minor', adjacents: ['10B', '9A', '11A'], complementary: '10B' },
      '10B': { key: 'D major', adjacents: ['10A', '9B', '11B'], complementary: '10A' },
      '11A': { key: 'F# minor', adjacents: ['11B', '10A', '12A'], complementary: '11B' },
      '11B': { key: 'A major', adjacents: ['11A', '10B', '12B'], complementary: '11A' },
      '12A': { key: 'D♭ minor', adjacents: ['12B', '11A', '1A'], complementary: '12B' },
      '12B': { key: 'E major', adjacents: ['12A', '11B', '1B'], complementary: '12A' }
    };
  }

  /**
   * NON-BLOCKING ANALYSIS WRAPPER
   * Prevents UI freeze by yielding control back to the main thread
   */
  async nonBlockingAnalysis(analysisFunction) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await analysisFunction();
          resolve(result);
        } catch (error) {
          console.warn('Analysis step failed:', error);
          resolve(this.getAnalysisFallback());
        }
      }, 10); // Small delay to yield control to UI thread
    });
  }

  /**
   * ANALYSIS FALLBACK
   * Returns safe default values when analysis fails
   */
  getAnalysisFallback() {
    return {
      bmp: 120,
      bpm: 120,
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      beatGrid: [],
      sections: [],
      introLength: 8,
      outroLength: 8,
      confidence: 0.2
    };
  }

  /**
   * COMPREHENSIVE TRACK ANALYSIS
   * Analyzes BPM, key, structure, vocals, energy, and creates cue points
   */
  async analyzeTrack(trackData) {
    if (this.analysisCache.has(trackData.id)) {
      return this.analysisCache.get(trackData.id);
    }

    console.log(`🎵 PROFESSIONAL ANALYSIS: Starting NON-BLOCKING analysis of ${trackData.title}`);
    this.isAnalyzing = true;

    try {
      const analysis = {
        id: trackData.id,
        title: trackData.title,
        artist: trackData.artist,
        duration: trackData.duration || 0,
        stems: trackData.stems || {},
        
        // Basic analysis
        bmp: 120,
        bpm: 120,
        key: null,
        camelotKey: null,
        
        // Advanced analysis
        beatGrid: [],
        phraseMarkers: [],
        structuralSections: [],
        vocalSections: [],
        energyProfile: [],
        cuePoints: [],
        
        // Mixing metadata
        introLength: 0,
        outroLength: 0,
        mixInPoint: 0,
        mixOutPoint: 0,
        bestTransitionPoints: [],
        
        // Analysis confidence
        analysisConfidence: 0,
        lastAnalyzed: Date.now()
      };

      // 1. BPM AND BEAT GRID ANALYSIS (non-blocking)
      console.log('🥁 Step 1: BPM Analysis...');
      const bpmAnalysis = await this.nonBlockingAnalysis(() => 
        this.advancedBPMAnalysis(trackData.stems)
      );
      analysis.bmp = bpmAnalysis.bmp || bpmAnalysis.bpm || 120;
      analysis.bpm = bpmAnalysis.bmp || bpmAnalysis.bpm || 120;
      analysis.beatGrid = bpmAnalysis.beatGrid || [];
      analysis.analysisConfidence = bpmAnalysis.confidence || 0.3;

      // 2. MUSICAL KEY DETECTION (non-blocking)
      console.log('🎼 Step 2: Key Detection...');
      const keyAnalysis = await this.nonBlockingAnalysis(() =>
        this.advancedKeyDetection(trackData.stems)
      );
      analysis.key = keyAnalysis.key || { name: 'C Major', mode: 'major' };
      analysis.camelotKey = keyAnalysis.camelotKey || '8B';

      // 3. STRUCTURAL ANALYSIS (non-blocking)
      console.log('🏗️ Step 3: Structure Analysis...');
      const structureAnalysis = await this.nonBlockingAnalysis(() =>
        this.analyzeTrackStructure(trackData.stems, analysis.beatGrid)
      );
      analysis.structuralSections = structureAnalysis.sections || [];
      analysis.introLength = structureAnalysis.introLength || 8;
      analysis.outroLength = structureAnalysis.outroLength || 8;

      // 4. VOCAL PRESENCE DETECTION (non-blocking)
      console.log('🎤 Step 4: Vocal Analysis...');
      const vocalAnalysis = await this.nonBlockingAnalysis(() =>
        this.analyzeVocalPresence(trackData.stems.vocals)
      );
      analysis.vocalSections = vocalAnalysis.sections || [];

      // 5. ENERGY PROFILE ANALYSIS (non-blocking)
      console.log('⚡ Step 5: Energy Analysis...');
      const energyProfile = await this.nonBlockingAnalysis(() =>
        this.analyzeEnergyProfile(trackData.stems)
      );
      analysis.energyProfile = energyProfile || [];

      // 6. PHRASE BOUNDARY DETECTION (non-blocking)
      console.log('🎼 Step 6: Phrase Analysis...');
      analysis.phraseMarkers = this.detectPhraseBoundaries(analysis.beatGrid, analysis.structuralSections);

      // 7. GENERATE PROFESSIONAL CUE POINTS (non-blocking)
      console.log('🎯 Step 7: Cue Point Generation...');
      analysis.cuePoints = this.generateProfessionalCuePoints(analysis);

      // 8. CALCULATE MIX POINTS (non-blocking)
      console.log('🎚️ Step 8: Mix Point Calculation...');
      analysis.mixInPoint = this.calculateOptimalMixInPoint(analysis);
      analysis.mixOutPoint = this.calculateOptimalMixOutPoint(analysis);
      analysis.bestTransitionPoints = this.findBestTransitionPoints(analysis);

      // Cache the complete analysis
      this.analysisCache.set(trackData.id, analysis);
      this.isAnalyzing = false;

      console.log(`✅ Professional analysis complete for ${trackData.title}`);
      console.log(`   📊 BPM: ${analysis.bpm}, Key: ${analysis.key.name} (${analysis.camelotKey})`);
      console.log(`   🎯 Cue Points: ${analysis.cuePoints.length}, Confidence: ${(analysis.analysisConfidence * 100).toFixed(0)}%`);

      return analysis;

    } catch (error) {
      console.error('Professional track analysis failed:', error);
      this.isAnalyzing = false;
      
      // Return comprehensive fallback analysis that matches expected format
      const fallbackAnalysis = {
        id: trackData.id || Date.now().toString(),
        title: trackData.title || 'Unknown Track',
        artist: trackData.artist || 'Unknown Artist',
        duration: trackData.duration || 180,
        stems: trackData.stems || {},
        
        // Basic fallback values
        bmp: 120,
        bpm: 120,
        key: { name: 'C Major', mode: 'major' },
        camelotKey: '8B',
        
        // Empty but valid structure
        beatGrid: [],
        phraseMarkers: [],
        structuralSections: [{
          type: 'unknown',
          start: 0,
          end: trackData.duration || 180,
          energy: 0.5
        }],
        vocalSections: [],
        energyProfile: [{
          time: 0,
          totalEnergy: 0.5,
          energyLevel: 'medium'
        }],
        cuePoints: [{
          name: 'Start',
          time: 0,
          type: 'intro',
          color: '#00ff88',
          priority: 5,
          description: 'Track start (fallback)'
        }],
        
        // Fallback mix points
        introLength: 8,
        outroLength: 8,
        mixInPoint: 0,
        mixOutPoint: Math.max(0, (trackData.duration || 180) - 30),
        bestTransitionPoints: [],
        
        // Low confidence indicators
        analysisConfidence: 0.2,
        lastAnalyzed: Date.now()
      };
      
      // Cache the fallback analysis
      this.analysisCache.set(trackData.id, fallbackAnalysis);
      
      return fallbackAnalysis;
    }
  }

  /**
   * ADVANCED BPM ANALYSIS with Dynamic Beat Tracking
   */
  async advancedBPMAnalysis(stems) {
    console.log('🥁 Advanced BPM Analysis: Using multi-stem approach');
    
    try {
      // Validate stems input
      if (!stems || typeof stems !== 'object') {
        console.warn('Invalid stems data, using fallback BPM analysis');
        return { bpm: 120, beatGrid: [], confidence: 0.3 };
      }

      const drumsBuffer = stems.drums?.buffer;
      const otherBuffer = stems.other?.buffer || stems.vocals?.buffer;
      
      if (!drumsBuffer) {
        console.warn('No drums buffer available, using fallback BPM analysis');
        return { bpm: 120, beatGrid: [], confidence: 0.3 };
      }

      // Validate audio buffer
      if (!drumsBuffer.getChannelData || typeof drumsBuffer.getChannelData !== 'function') {
        console.warn('Invalid drums buffer, using fallback BPM analysis');
        return { bpm: 120, beatGrid: [], confidence: 0.3 };
      }

      // Primary analysis on drums stem
      const drumsAnalysis = await this.analyzeBeatTrack(drumsBuffer, 'drums');
      
      // Secondary analysis on other stems for verification
      let verificationAnalysis = null;
      if (otherBuffer && otherBuffer.getChannelData && typeof otherBuffer.getChannelData === 'function') {
        try {
          verificationAnalysis = await this.analyzeBeatTrack(otherBuffer, 'other');
        } catch (verificationError) {
          console.warn('Verification analysis failed, continuing with drums only:', verificationError);
        }
      }

      // Combine and validate results
      const finalBPM = this.validateBPMResults(drumsAnalysis, verificationAnalysis);
      const beatGrid = await this.generateAdvancedBeatGrid(finalBPM, drumsBuffer);

      console.log(`🥁 BPM Analysis Success: ${finalBPM.bpm} BPM (confidence: ${finalBPM.confidence.toFixed(2)})`);

      return {
        bmp: finalBPM.bpm, // Add both properties for compatibility
        bpm: finalBPM.bpm,
        beatGrid: beatGrid,
        confidence: finalBPM.confidence,
        tempoVariation: finalBPM.variation || 0
      };

    } catch (error) {
      console.error('Advanced BPM analysis failed:', error);
      // Return fallback analysis that matches expected format
      return { 
        bmp: 120, 
        bpm: 120, 
        beatGrid: [], 
        confidence: 0.3 
      };
    }
  }

  async analyzeBeatTrack(audioBuffer, stemType) {
    try {
      // Validate input
      if (!audioBuffer || !audioBuffer.getChannelData) {
        throw new Error('Invalid audio buffer provided to analyzeBeatTrack');
      }

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      if (!channelData || channelData.length === 0) {
        throw new Error('Empty or invalid channel data');
      }

      if (!sampleRate || sampleRate < 8000) {
        throw new Error('Invalid sample rate');
      }
      
      // Apply stem-specific processing
      let processedData = channelData;
      try {
        if (stemType === 'drums') {
          // Emphasize percussive transients
          processedData = this.emphasizeTransients(channelData, sampleRate);
        } else {
          // General onset detection
          processedData = this.highPassFilter(channelData, sampleRate, 60);
        }
      } catch (processingError) {
        console.warn('Audio processing failed, using raw data:', processingError);
        processedData = channelData;
      }

      // Multi-scale tempo analysis (handle different BPM ranges)
      const tempoRanges = [
        { min: 60, max: 90, name: 'slow' },
        { min: 85, max: 115, name: 'medium' },
        { min: 110, max: 140, name: 'uptempo' },
        { min: 135, max: 180, name: 'fast' }
      ];

      let bestResult = { bpm: 120, confidence: 0.3 };

      for (const range of tempoRanges) {
        try {
          const result = this.autocorrelationBPMInRange(processedData, sampleRate, range.min, range.max);
          if (result && result.confidence > bestResult.confidence) {
            bestResult = result;
          }
        } catch (rangeError) {
          console.warn(`BPM analysis failed for range ${range.name}:`, rangeError);
        }
      }

      console.log(`🎵 Beat track analysis (${stemType}): ${bestResult.bpm} BPM (confidence: ${bestResult.confidence.toFixed(2)})`);
      return bestResult;

    } catch (error) {
      console.error(`Beat track analysis failed for ${stemType}:`, error);
      return { bpm: 120, confidence: 0.2 };
    }
  }

  // Simple high-pass filter implementation
  highPassFilter(data, sampleRate, cutoffFreq) {
    try {
      if (!data || data.length === 0 || !sampleRate || !cutoffFreq) {
        return data;
      }

      const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
      const dt = 1.0 / sampleRate;
      const alpha = rc / (rc + dt);
      
      const filtered = new Float32Array(data.length);
      filtered[0] = data[0];
      
      for (let i = 1; i < data.length; i++) {
        filtered[i] = alpha * (filtered[i-1] + data[i] - data[i-1]);
      }
      
      return filtered;
      
    } catch (error) {
      console.warn('High-pass filter failed, returning original data:', error);
      return data;
    }
  }

  emphasizeTransients(data, sampleRate) {
    try {
      if (!data || data.length === 0) {
        throw new Error('Invalid data for transient emphasis');
      }

      // High-pass filter to emphasize drum hits
      const filtered = this.highPassFilter(data, sampleRate, 80);
      
      if (!filtered || filtered.length === 0) {
        throw new Error('High-pass filter failed');
      }
      
      // Derivative to emphasize onsets
      const emphasized = new Float32Array(filtered.length);
      for (let i = 1; i < filtered.length; i++) {
        const diff = Math.abs(filtered[i] - filtered[i-1]);
        emphasized[i] = diff > 0.01 ? diff : 0;
      }
      
      return emphasized;
      
    } catch (error) {
      console.warn('Transient emphasis failed, returning original data:', error);
      return data;
    }
  }

  autocorrelationBPMInRange(data, sampleRate, minBPM, maxBPM) {
    try {
      if (!data || data.length === 0 || !sampleRate || !minBPM || !maxBPM) {
        return { bpm: 120, confidence: 0.3, correlation: 0 };
      }

      const minPeriod = Math.floor(sampleRate * 60 / maxBPM);
      const maxPeriod = Math.floor(sampleRate * 60 / minBPM);
      
      if (minPeriod >= maxPeriod || minPeriod <= 0 || maxPeriod >= data.length) {
        return { bpm: Math.round((minBPM + maxBPM) / 2), confidence: 0.3, correlation: 0 };
      }
      
      let bestBPM = minBPM;
      let bestCorrelation = 0;
      
      // Calculate autocorrelation for tempo detection
      for (let period = minPeriod; period <= maxPeriod; period += Math.max(1, Math.floor((maxPeriod - minPeriod) / 50))) {
        let correlation = 0;
        let count = 0;
        
        for (let i = 0; i < data.length - period; i += period) {
          if (i + period < data.length) {
            correlation += data[i] * data[i + period];
            count++;
          }
        }
        
        correlation = count > 0 ? correlation / count : 0;
        
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestBPM = 60 * sampleRate / period;
        }
      }

      // Clamp BPM to valid range
      bestBPM = Math.max(minBPM, Math.min(maxBPM, bestBPM));

      return {
        bpm: Math.round(bestBPM),
        confidence: Math.min(Math.max(bestCorrelation * 2, 0.1), 1.0),
        correlation: bestCorrelation
      };

    } catch (error) {
      console.warn('Autocorrelation BPM analysis failed:', error);
      return { 
        bpm: Math.round((minBPM + maxBPM) / 2), 
        confidence: 0.3, 
        correlation: 0 
      };
    }
  }

  validateBPMResults(primary, secondary) {
    if (!secondary) return primary;
    
    const bpmDiff = Math.abs(primary.bpm - secondary.bpm);
    const halfTimeDiff = Math.abs(primary.bpm - secondary.bpm / 2);
    const doubleTimeDiff = Math.abs(primary.bpm - secondary.bpm * 2);
    
    // Check for half/double time relationships
    if (halfTimeDiff < 3) {
      return {
        bpm: Math.round((primary.bpm + secondary.bpm / 2) / 2),
        confidence: (primary.confidence + secondary.confidence) / 2,
        variation: bpmDiff
      };
    } else if (doubleTimeDiff < 3) {
      return {
        bpm: Math.round((primary.bpm + secondary.bpm * 2) / 2),
        confidence: (primary.confidence + secondary.confidence) / 2,
        variation: bpmDiff
      };
    } else if (bpmDiff < 5) {
      // Close agreement
      return {
        bpm: Math.round((primary.bpm + secondary.bpm) / 2),
        confidence: Math.max(primary.confidence, secondary.confidence),
        variation: bpmDiff
      };
    }
    
    // Use the more confident result
    return primary.confidence > secondary.confidence ? primary : secondary;
  }

  async generateAdvancedBeatGrid(bpmInfo, audioBuffer) {
    const bpm = bpmInfo.bpm;
    const beatInterval = 60 / bpm;
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    console.log(`🎼 Generating advanced beat grid: ${bpm} BPM, ${beatInterval.toFixed(3)}s intervals`);
    
    // Find actual onsets to align beat grid
    const onsets = this.detectOnsets(channelData, sampleRate);
    
    const beatGrid = [];
    let currentTime = 0;
    let beatCount = 0;
    
    // Find best starting offset based on first strong onset
    if (onsets.length > 0) {
      currentTime = onsets[0].time;
    }
    
    while (currentTime < Math.min(duration, 300)) { // Analyze first 5 minutes
      const beatInBar = (beatCount % 4) + 1;
      const barNumber = Math.floor(beatCount / 4) + 1;
      
      // Find closest onset for timing refinement
      const closestOnset = this.findClosestOnset(onsets, currentTime, beatInterval * 0.3);
      const refinedTime = closestOnset ? closestOnset.time : currentTime;
      
      beatGrid.push({
        time: refinedTime,
        beat: beatCount + 1,
        beatInBar: beatInBar,
        bar: barNumber,
        isDownbeat: beatInBar === 1,
        isPhraseStart: (beatCount % 32) === 0, // 8-bar phrases
        isSectionStart: (beatCount % 128) === 0, // 32-bar sections
        strength: closestOnset ? closestOnset.strength : 0.5,
        confidence: closestOnset ? 0.9 : 0.6
      });
      
      currentTime += beatInterval;
      beatCount++;
    }
    
    console.log(`🎼 Generated ${beatGrid.length} beats with ${beatGrid.filter(b => b.isDownbeat).length} downbeats`);
    return beatGrid;
  }

  detectOnsets(channelData, sampleRate) {
    const onsets = [];
    const frameSize = 2048;
    const hopSize = 512;
    
    // Onset detection using spectral flux
    for (let i = frameSize; i < channelData.length - frameSize; i += hopSize) {
      const frame1 = channelData.slice(i - frameSize, i);
      const frame2 = channelData.slice(i, i + frameSize);
      
      const flux = this.calculateSpectralFlux(frame1, frame2);
      
      if (flux > 0.02) { // Threshold for onset detection
        onsets.push({
          time: i / sampleRate,
          strength: Math.min(flux, 1.0)
        });
      }
    }
    
    // Remove closely spaced onsets (within 50ms)
    const filteredOnsets = [];
    let lastTime = -1;
    
    for (const onset of onsets) {
      if (onset.time - lastTime > 0.05) {
        filteredOnsets.push(onset);
        lastTime = onset.time;
      }
    }
    
    return filteredOnsets;
  }

  calculateSpectralFlux(frame1, frame2) {
    let flux = 0;
    for (let i = 0; i < Math.min(frame1.length, frame2.length); i++) {
      const diff = Math.abs(frame2[i]) - Math.abs(frame1[i]);
      if (diff > 0) flux += diff;
    }
    return flux / frame1.length;
  }

  findClosestOnset(onsets, targetTime, maxDistance) {
    let closest = null;
    let minDistance = maxDistance;
    
    for (const onset of onsets) {
      const distance = Math.abs(onset.time - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        closest = onset;
      }
    }
    
    return closest;
  }

  /**
   * ADVANCED KEY DETECTION using Chromagram Analysis
   */
  async advancedKeyDetection(stems) {
    console.log('🎼 Advanced Key Detection: Multi-stem harmonic analysis');
    
    try {
      // Prioritize harmonic stems for key detection
      const analysisOrder = ['vocals', 'other', 'bass', 'drums'];
      let bestResult = null;
      
      for (const stemName of analysisOrder) {
        const stem = stems[stemName];
        if (stem?.buffer) {
          const keyResult = await this.analyzeKeyFromStem(stem.buffer, stemName);
          if (!bestResult || keyResult.confidence > bestResult.confidence) {
            bestResult = keyResult;
          }
        }
      }
      
      if (bestResult) {
        const camelotKey = this.keyToCamelot(bestResult.key);
        return {
          key: bestResult.key,
          camelotKey: camelotKey,
          confidence: bestResult.confidence
        };
      }
      
    } catch (error) {
      console.error('Key detection failed:', error);
    }
    
    return {
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      confidence: 0.3
    };
  }

  async analyzeKeyFromStem(audioBuffer, stemType) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Generate chromagram (pitch class profile)
    const chromagram = this.generateChromagram(channelData, sampleRate);
    
    // Apply stem-specific weighting
    if (stemType === 'vocals' || stemType === 'other') {
      // Boost harmonic content
      this.emphasizeHarmonics(chromagram);
    }
    
    // Template matching against key profiles
    const keyResult = this.matchKeyTemplates(chromagram);
    
    return {
      key: keyResult.key,
      confidence: keyResult.confidence,
      chromagram: chromagram
    };
  }

  generateChromagram(channelData, sampleRate) {
    const chromagram = new Array(12).fill(0); // 12 pitch classes
    const frameSize = 4096;
    const hopSize = 2048;
    
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const spectrum = this.fft(frame);
      
      // Map frequency bins to pitch classes
      for (let bin = 1; bin < spectrum.length / 2; bin++) {
        const freq = bin * sampleRate / frameSize;
        if (freq < 4000) { // Focus on harmonic range
          const pitchClass = this.frequencyToPitchClass(freq);
          const magnitude = Math.sqrt(spectrum[bin * 2] ** 2 + spectrum[bin * 2 + 1] ** 2);
          chromagram[pitchClass] += magnitude;
        }
      }
    }
    
    // Normalize
    const sum = chromagram.reduce((a, b) => a + b, 0);
    return sum > 0 ? chromagram.map(x => x / sum) : chromagram;
  }

  frequencyToPitchClass(frequency) {
    // Convert frequency to MIDI note number, then to pitch class (0-11)
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    return Math.round(midiNote) % 12;
  }

  emphasizeHarmonics(chromagram) {
    // Boost perfect fifths and octaves for better key detection
    const harmonicBoosts = [
      { interval: 7, boost: 1.2 }, // Perfect fifth
      { interval: 4, boost: 1.1 }, // Major third
      { interval: 3, boost: 1.1 }  // Minor third
    ];
    
    for (let i = 0; i < 12; i++) {
      for (const harmonic of harmonicBoosts) {
        const harmonicIndex = (i + harmonic.interval) % 12;
        chromagram[i] += chromagram[harmonicIndex] * (harmonic.boost - 1);
      }
    }
  }

  matchKeyTemplates(chromagram) {
    // Krumhansl-Schmuckler key profiles
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    let bestKey = null;
    let bestScore = -1;
    
    // Test all 24 keys (12 major + 12 minor)
    for (let tonic = 0; tonic < 12; tonic++) {
      // Major key
      const majorScore = this.correlateProfiles(chromagram, this.rotateProfile(majorProfile, tonic));
      if (majorScore > bestScore) {
        bestScore = majorScore;
        bestKey = {
          name: this.pitchClassToNoteName(tonic) + ' Major',
          mode: 'major',
          tonic: tonic
        };
      }
      
      // Minor key
      const minorScore = this.correlateProfiles(chromagram, this.rotateProfile(minorProfile, tonic));
      if (minorScore > bestScore) {
        bestScore = minorScore;
        bestKey = {
          name: this.pitchClassToNoteName(tonic) + ' Minor',
          mode: 'minor',
          tonic: tonic
        };
      }
    }
    
    return {
      key: bestKey,
      confidence: Math.min(bestScore, 1.0)
    };
  }

  correlateProfiles(profile1, profile2) {
    let correlation = 0;
    for (let i = 0; i < 12; i++) {
      correlation += profile1[i] * profile2[i];
    }
    return correlation;
  }

  rotateProfile(profile, steps) {
    const rotated = new Array(12);
    for (let i = 0; i < 12; i++) {
      rotated[i] = profile[(i - steps + 12) % 12];
    }
    return rotated;
  }

  pitchClassToNoteName(pitchClass) {
    const noteNames = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    return noteNames[pitchClass];
  }

  keyToCamelot(key) {
    const camelotMap = {
      'C Major': '8B', 'A Minor': '8A',
      'D♭ Major': '3B', 'B♭ Minor': '3A',
      'D Major': '10B', 'B Minor': '10A',
      'E♭ Major': '5B', 'C Minor': '5A',
      'E Major': '12B', 'D♭ Minor': '12A',
      'F Major': '7B', 'D Minor': '7A',
      'F♯ Major': '2B', 'E♭ Minor': '2A',
      'G Major': '9B', 'E Minor': '9A',
      'A♭ Major': '4B', 'F Minor': '4A',
      'A Major': '11B', 'F♯ Minor': '11A',
      'B♭ Major': '6B', 'G Minor': '6A',
      'B Major': '1B', 'A♭ Minor': '1A'
    };
    
    return camelotMap[key.name] || '8B';
  }

  // Simple FFT implementation for basic spectral analysis
  fft(signal) {
    const N = signal.length;
    if (N <= 1) return signal;
    
    // Zero pad to power of 2
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(N)));
    const padded = new Array(nextPow2 * 2).fill(0);
    for (let i = 0; i < N; i++) {
      padded[i * 2] = signal[i]; // Real part
      padded[i * 2 + 1] = 0;     // Imaginary part
    }
    
    return this.simpleDFT(padded);
  }
  
  simpleDFT(signal) {
    // Simplified DFT for basic frequency analysis
    const N = signal.length / 2;
    const result = new Array(signal.length);
    
    for (let k = 0; k < N; k++) {
      let realSum = 0, imagSum = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        realSum += signal[n * 2] * Math.cos(angle) - signal[n * 2 + 1] * Math.sin(angle);
        imagSum += signal[n * 2] * Math.sin(angle) + signal[n * 2 + 1] * Math.cos(angle);
      }
      
      result[k * 2] = realSum;
      result[k * 2 + 1] = imagSum;
    }
    
    return result;
  }

  /**
   * TRACK STRUCTURE ANALYSIS
   * Detects intro, verse, chorus, breakdown, outro sections
   */
  async analyzeTrackStructure(stems, beatGrid) {
    console.log('🏗️ Track Structure Analysis: Detecting sections and boundaries');
    
    const sections = [];
    const drumBuffer = stems.drums?.buffer;
    const vocalBuffer = stems.vocals?.buffer;
    
    if (!drumBuffer) {
      return { sections: [], introLength: 8, outroLength: 8 };
    }
    
    // Analyze energy patterns for section detection
    const energyAnalysis = this.analyzeEnergyPatterns(drumBuffer);
    const vocalActivity = vocalBuffer ? this.analyzeVocalActivity(vocalBuffer) : [];
    
    // Detect structural boundaries
    const boundaries = this.detectStructuralBoundaries(energyAnalysis, vocalActivity, beatGrid);
    
    // Classify sections based on energy and vocal patterns
    let currentSection = { type: 'intro', start: 0, end: 0, energy: 0 };
    
    boundaries.forEach((boundary, index) => {
      currentSection.end = boundary.time;
      currentSection.energy = boundary.energy;
      sections.push({...currentSection});
      
      // Predict next section type
      const nextType = this.predictSectionType(boundary, index, boundaries.length, vocalActivity);
      currentSection = {
        type: nextType,
        start: boundary.time,
        end: drumBuffer.duration,
        energy: boundary.energy
      };
    });
    
    // Add final section
    if (currentSection.start < drumBuffer.duration) {
      sections.push(currentSection);
    }
    
    // Determine intro and outro lengths
    const introSection = sections.find(s => s.type === 'intro');
    const outroSection = sections.find(s => s.type === 'outro');
    
    return {
      sections: sections,
      introLength: introSection ? introSection.end - introSection.start : 8,
      outroLength: outroSection ? outroSection.end - outroSection.start : 8
    };
  }
  
  analyzeEnergyPatterns(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = sampleRate * 4; // 4-second windows
    
    const energyWindows = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      const window = channelData.slice(i, Math.min(i + windowSize, channelData.length));
      
      // Calculate RMS energy
      let rms = 0;
      for (let j = 0; j < window.length; j++) {
        rms += window[j] * window[j];
      }
      rms = Math.sqrt(rms / window.length);
      
      energyWindows.push({
        time: i / sampleRate,
        energy: rms,
        variance: this.calculateVariance(window)
      });
    }
    
    return energyWindows;
  }
  
  analyzeVocalActivity(vocalBuffer) {
    const channelData = vocalBuffer.getChannelData(0);
    const sampleRate = vocalBuffer.sampleRate;
    const windowSize = sampleRate * 2; // 2-second windows
    
    const vocalWindows = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      const window = channelData.slice(i, Math.min(i + windowSize, channelData.length));
      
      let activity = 0;
      for (let j = 0; j < window.length; j++) {
        activity += Math.abs(window[j]);
      }
      activity /= window.length;
      
      vocalWindows.push({
        time: i / sampleRate,
        activity: activity,
        isActive: activity > 0.01 // Threshold for vocal presence
      });
    }
    
    return vocalWindows;
  }
  
  detectStructuralBoundaries(energyWindows, vocalWindows, beatGrid) {
    const boundaries = [];
    const energyThreshold = 0.3; // Minimum energy change to consider boundary
    
    // Look for significant energy changes
    for (let i = 1; i < energyWindows.length - 1; i++) {
      const prev = energyWindows[i - 1];
      const curr = energyWindows[i];
      const next = energyWindows[i + 1];
      
      const energyChange = Math.abs(curr.energy - prev.energy);
      const energyTrend = next.energy - prev.energy;
      
      if (energyChange > energyThreshold) {
        // Align boundary to nearest downbeat
        const alignedTime = this.alignToNearestDownbeat(curr.time, beatGrid);
        
        boundaries.push({
          time: alignedTime,
          energy: curr.energy,
          energyChange: energyChange,
          trend: energyTrend > 0 ? 'increase' : 'decrease'
        });
      }
    }
    
    return boundaries;
  }
  
  alignToNearestDownbeat(time, beatGrid) {
    if (!beatGrid.length) return time;
    
    const downbeats = beatGrid.filter(beat => beat.isDownbeat);
    if (!downbeats.length) return time;
    
    let nearestBeat = downbeats[0];
    let minDistance = Math.abs(nearestBeat.time - time);
    
    for (const beat of downbeats) {
      const distance = Math.abs(beat.time - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBeat = beat;
      }
    }
    
    return nearestBeat.time;
  }
  
  predictSectionType(boundary, index, totalBoundaries, vocalActivity) {
    const { energy, trend, time } = boundary;
    
    // Check vocal activity at this time
    const vocalAtTime = vocalActivity.find(v => Math.abs(v.time - time) < 2);
    const hasVocals = vocalAtTime?.isActive || false;
    
    // Section type prediction logic
    if (index === 0 && energy < 0.3) return 'intro';
    if (index === totalBoundaries - 1) return 'outro';
    if (energy > 0.7 && hasVocals) return 'chorus';
    if (energy < 0.4) return 'breakdown';
    if (hasVocals) return 'verse';
    return 'instrumental';
  }
  
  calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  /**
   * VOCAL PRESENCE ANALYSIS
   * Detects where vocals are present for intelligent mixing
   */
  async analyzeVocalPresence(vocalStem) {
    console.log('🎤 Vocal Presence Analysis: Mapping vocal sections');
    
    if (!vocalStem?.buffer) {
      return { sections: [], totalVocalTime: 0 };
    }
    
    const channelData = vocalStem.buffer.getChannelData(0);
    const sampleRate = vocalStem.buffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.5); // 500ms windows
    const hopSize = Math.floor(windowSize / 2);
    
    const vocalSections = [];
    let currentSection = null;
    let totalVocalTime = 0;
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const time = i / sampleRate;
      
      // Calculate vocal activity
      let rms = 0;
      let spectralCentroid = 0;
      
      for (let j = 0; j < window.length; j++) {
        rms += window[j] * window[j];
      }
      rms = Math.sqrt(rms / window.length);
      
      const isVocalActive = rms > 0.008; // Threshold for vocal presence
      
      if (isVocalActive && !currentSection) {
        // Start new vocal section
        currentSection = {
          start: time,
          end: time,
          intensity: rms,
          type: this.classifyVocalType(rms)
        };
      } else if (isVocalActive && currentSection) {
        // Continue current section
        currentSection.end = time;
        currentSection.intensity = Math.max(currentSection.intensity, rms);
      } else if (!isVocalActive && currentSection) {
        // End current section
        if (currentSection.end - currentSection.start > 1.0) { // Minimum 1 second
          vocalSections.push(currentSection);
          totalVocalTime += currentSection.end - currentSection.start;
        }
        currentSection = null;
      }
    }
    
    // Close final section if needed
    if (currentSection) {
      vocalSections.push(currentSection);
      totalVocalTime += currentSection.end - currentSection.start;
    }
    
    console.log(`🎤 Found ${vocalSections.length} vocal sections, ${totalVocalTime.toFixed(1)}s total`);
    
    return {
      sections: vocalSections,
      totalVocalTime: totalVocalTime,
      vocalDensity: totalVocalTime / (channelData.length / sampleRate)
    };
  }
  
  classifyVocalType(intensity) {
    if (intensity > 0.05) return 'lead_vocal';
    if (intensity > 0.02) return 'backing_vocal';
    return 'vocal_texture';
  }

  /**
   * ENERGY PROFILE ANALYSIS
   * Creates energy curve for intelligent transition planning
   */
  async analyzeEnergyProfile(stems) {
    console.log('⚡ Energy Profile Analysis: Creating dynamic energy map');
    
    const profile = [];
    const windowSize = 2; // 2-second windows
    
    // Combine energy from all stems
    const stemBuffers = Object.values(stems).filter(stem => stem?.buffer);
    if (!stemBuffers.length) return profile;
    
    const duration = Math.max(...stemBuffers.map(stem => stem.buffer.duration));
    
    for (let time = 0; time < duration; time += windowSize) {
      let totalEnergy = 0;
      let bassEnergy = 0;
      let drumEnergy = 0;
      let vocalEnergy = 0;
      
      stemBuffers.forEach(stem => {
        const stemName = Object.keys(stems).find(key => stems[key] === stem);
        const energy = this.calculateEnergyAtTime(stem.buffer, time, windowSize);
        
        totalEnergy += energy;
        
        switch (stemName) {
          case 'bass': bassEnergy = energy; break;
          case 'drums': drumEnergy = energy; break;
          case 'vocals': vocalEnergy = energy; break;
        }
      });
      
      profile.push({
        time: time,
        totalEnergy: totalEnergy / stemBuffers.length,
        bassEnergy: bassEnergy,
        drumEnergy: drumEnergy,
        vocalEnergy: vocalEnergy,
        energyLevel: this.classifyEnergyLevel(totalEnergy / stemBuffers.length)
      });
    }
    
    return profile;
  }
  
  calculateEnergyAtTime(audioBuffer, startTime, duration) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.min(startSample + Math.floor(duration * sampleRate), channelData.length);
    
    let energy = 0;
    for (let i = startSample; i < endSample; i++) {
      energy += channelData[i] * channelData[i];
    }
    
    return Math.sqrt(energy / (endSample - startSample));
  }
  
  classifyEnergyLevel(energy) {
    if (energy > 0.1) return 'high';
    if (energy > 0.05) return 'medium';
    if (energy > 0.02) return 'low';
    return 'minimal';
  }

  /**
   * PHRASE BOUNDARY DETECTION
   * Identifies musical phrases for seamless transitions
   */
  detectPhraseBoundaries(beatGrid, structuralSections) {
    console.log('🎼 Phrase Boundary Detection: Finding musical phrases');
    
    const phraseMarkers = [];
    
    // Standard phrase lengths in electronic music
    const phraseLengths = [8, 16, 32]; // bars
    
    beatGrid.forEach(beat => {
      if (beat.isDownbeat) {
        // Check if this downbeat starts a phrase
        for (const phraseLength of phraseLengths) {
          if ((beat.bar - 1) % phraseLength === 0) {
            // Check if this aligns with structural sections
            const inSection = structuralSections.find(section => 
              beat.time >= section.start && beat.time <= section.end
            );
            
            phraseMarkers.push({
              time: beat.time,
              bar: beat.bar,
              phraseLength: phraseLength,
              sectionType: inSection?.type || 'unknown',
              isStructuralBoundary: this.isNearStructuralBoundary(beat.time, structuralSections),
              priority: this.calculatePhrasePriority(phraseLength, inSection?.type)
            });
          }
        }
      }
    });
    
    console.log(`🎼 Found ${phraseMarkers.length} phrase boundaries`);
    return phraseMarkers;
  }
  
  isNearStructuralBoundary(time, sections) {
    return sections.some(section => 
      Math.abs(section.start - time) < 2 || Math.abs(section.end - time) < 2
    );
  }
  
  calculatePhrasePriority(phraseLength, sectionType) {
    let priority = phraseLength / 8; // Longer phrases have higher priority
    
    // Boost priority for certain section types
    const sectionBoosts = {
      'chorus': 1.5,
      'breakdown': 1.3,
      'intro': 1.2,
      'outro': 1.4
    };
    
    if (sectionBoosts[sectionType]) {
      priority *= sectionBoosts[sectionType];
    }
    
    return priority;
  }

  /**
   * PROFESSIONAL CUE POINT GENERATION
   * Creates intelligent cue points for mixing
   */
  generateProfessionalCuePoints(analysis) {
    console.log('🎯 Professional Cue Point Generation: Creating mix points');
    
    const cuePoints = [];
    const { structuralSections, vocalSections, energyProfile, beatGrid, duration } = analysis;
    
    // 1. INTRO CUE (First beat or vocal entry)
    const firstBeat = beatGrid.find(beat => beat.isDownbeat);
    if (firstBeat) {
      cuePoints.push({
        name: 'Intro',
        time: firstBeat.time,
        type: 'intro',
        color: '#00ff88',
        priority: 9,
        description: 'Track intro - optimal mix-in point'
      });
    }
    
    // 2. VOCAL IN (First vocal entry)
    const firstVocal = vocalSections[0];
    if (firstVocal) {
      const alignedTime = this.alignToNearestDownbeat(firstVocal.start, beatGrid);
      cuePoints.push({
        name: 'Vocal In',
        time: alignedTime,
        type: 'vocal_in',
        color: '#ff6b35',
        priority: 8,
        description: 'First vocal entry'
      });
    }
    
    // 3. CHORUS/DROP (High energy section)
    const chorusSection = structuralSections.find(s => s.type === 'chorus');
    if (chorusSection) {
      cuePoints.push({
        name: 'Chorus',
        time: chorusSection.start,
        type: 'chorus',
        color: '#ff4081',
        priority: 10,
        description: 'Main chorus - high energy'
      });
    }
    
    // 4. BREAKDOWN (Low energy section)
    const breakdownSection = structuralSections.find(s => s.type === 'breakdown');
    if (breakdownSection) {
      cuePoints.push({
        name: 'Breakdown',
        time: breakdownSection.start,
        type: 'breakdown',
        color: '#4a9eff',
        priority: 7,
        description: 'Breakdown section - good for transitions'
      });
    }
    
    // 5. VOCAL OUT (Last vocal section end)
    const lastVocal = vocalSections[vocalSections.length - 1];
    if (lastVocal) {
      const alignedTime = this.alignToNearestDownbeat(lastVocal.end, beatGrid);
      cuePoints.push({
        name: 'Vocal Out',
        time: alignedTime,
        type: 'vocal_out',
        color: '#9c27b0',
        priority: 8,
        description: 'Last vocal - mix-out opportunity'
      });
    }
    
    // 6. OUTRO (Final section or fade point)
    const outroSection = structuralSections.find(s => s.type === 'outro');
    const outroTime = outroSection ? outroSection.start : Math.max(0, duration - 30);
    
    cuePoints.push({
      name: 'Outro',
      time: outroTime,
      type: 'outro',
      color: '#ffc107',
      priority: 9,
      description: 'Outro section - mix-out point'
    });
    
    // 7. ENERGY-BASED CUE POINTS
    this.addEnergyBasedCuePoints(cuePoints, energyProfile, beatGrid);
    
    // Sort by time and remove duplicates
    return this.cleanupCuePoints(cuePoints);
  }
  
  addEnergyBasedCuePoints(cuePoints, energyProfile, beatGrid) {
    // Find significant energy changes
    for (let i = 1; i < energyProfile.length; i++) {
      const current = energyProfile[i];
      const previous = energyProfile[i - 1];
      
      const energyChange = current.totalEnergy - previous.totalEnergy;
      
      if (Math.abs(energyChange) > 0.1) { // Significant energy change
        const alignedTime = this.alignToNearestDownbeat(current.time, beatGrid);
        
        cuePoints.push({
          name: energyChange > 0 ? 'Energy Up' : 'Energy Down',
          time: alignedTime,
          type: energyChange > 0 ? 'energy_up' : 'energy_down',
          color: energyChange > 0 ? '#ff8f00' : '#00bcd4',
          priority: 5,
          description: `Energy ${energyChange > 0 ? 'increase' : 'decrease'} - transition opportunity`
        });
      }
    }
  }
  
  cleanupCuePoints(cuePoints) {
    // Remove cue points too close to each other (within 4 seconds)
    const cleaned = [];
    cuePoints.sort((a, b) => a.time - b.time);
    
    for (const cue of cuePoints) {
      const tooClose = cleaned.some(existing => Math.abs(existing.time - cue.time) < 4);
      if (!tooClose || cue.priority > 8) { // Always keep high priority cues
        cleaned.push(cue);
      }
    }
    
    return cleaned;
  }

  /**
   * OPTIMAL MIX POINT CALCULATION
   * Determines best points for mixing in/out
   */
  calculateOptimalMixPoints(analysis) {
    console.log('🎯 Mix Point Calculation: Finding optimal transition points');
    
    const { cuePoints, vocalSections, structuralSections, energyProfile, duration } = analysis;
    
    // MIX-IN POINT (Where to start this track)
    let mixInPoint = 0;
    const introCue = cuePoints.find(cue => cue.type === 'intro');
    if (introCue) {
      mixInPoint = introCue.time;
    } else {
      // Use first downbeat
      mixInPoint = analysis.beatGrid.find(beat => beat.isDownbeat)?.time || 0;
    }
    
    // MIX-OUT POINT (Where to start mixing out)
    let mixOutPoint = Math.max(0, duration - 30); // Default: 30s from end
    
    // Prefer vocal-out or outro cues
    const vocalOutCue = cuePoints.find(cue => cue.type === 'vocal_out');
    const outroCue = cuePoints.find(cue => cue.type === 'outro');
    
    if (vocalOutCue && vocalOutCue.time < duration - 15) {
      mixOutPoint = vocalOutCue.time;
    } else if (outroCue && outroCue.time < duration - 10) {
      mixOutPoint = outroCue.time;
    }
    
    // TRANSITION POINTS (Multiple options for different scenarios)
    const transitionPoints = this.findTransitionPoints(analysis);
    
    return {
      mixIn: mixInPoint,
      mixOut: mixOutPoint,
      transitions: transitionPoints
    };
  }
  
  findTransitionPoints(analysis) {
    const points = [];
    const { cuePoints, phraseMarkers, structuralSections, vocalSections } = analysis;
    
    // Add all phrase markers as potential transition points
    phraseMarkers.forEach(phrase => {
      // Check if this is a good transition point
      const nearVocal = vocalSections.some(vocal => 
        phrase.time >= vocal.start - 2 && phrase.time <= vocal.end + 2
      );
      
      points.push({
        time: phrase.time,
        type: 'phrase_boundary',
        quality: phrase.priority,
        hasVocals: nearVocal,
        sectionType: phrase.sectionType,
        description: `${phrase.phraseLength}-bar phrase boundary`
      });
    });
    
    // Add structural boundaries
    structuralSections.forEach(section => {
      if (section.type !== 'intro') { // Skip intro boundaries
        points.push({
          time: section.start,
          type: 'section_boundary',
          quality: this.getSectionTransitionQuality(section.type),
          sectionType: section.type,
          description: `${section.type} section start`
        });
      }
    });
    
    // Sort by quality and return top candidates
    return points
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 10); // Top 10 transition points
  }
  
  getSectionTransitionQuality(sectionType) {
    const qualityMap = {
      'breakdown': 9,
      'outro': 8,
      'chorus': 7,
      'verse': 6,
      'instrumental': 5
    };
    
    return qualityMap[sectionType] || 5;
  }

  /**
   * PROFESSIONAL TRANSITION EXECUTION
   * Implements multiple transition styles based on track compatibility
   */
  async executeTransition(currentTrack, nextTrack, style = null) {
    console.log(`🎵 EXECUTING PROFESSIONAL TRANSITION: ${currentTrack?.title || 'Unknown'} → ${nextTrack?.title || 'Unknown'}`);
    
    // Debug logging
    this.logTransitionAttempt(currentTrack, nextTrack);
    
    try {
      // Analyze both tracks if not already done
      const currentAnalysis = await this.analyzeTrack(currentTrack);
      const nextAnalysis = await this.analyzeTrack(nextTrack);
      
      if (!currentAnalysis || !nextAnalysis) {
        console.warn('Analysis failed, using fallback transition');
        return this.createFallbackTransition();
      }
      
      // Determine optimal transition style
      const transitionStyle = style || this.selectOptimalTransitionStyle(currentAnalysis, nextAnalysis);
      console.log(`🎭 Selected transition style: ${transitionStyle}`);
      
      // Execute the chosen transition
      try {
        switch (transitionStyle) {
          case 'relaxed_transition':
            return await this.executeRelaxedTransition(currentAnalysis, nextAnalysis);
          
          case 'high_energy_overlap':
            return await this.executeHighEnergyOverlap(currentAnalysis, nextAnalysis);
          
          case 'rolling_transition':
            return await this.executeRollingTransition(currentAnalysis, nextAnalysis);
          
          case 'double_drop':
            return await this.executeDoubleDrop(currentAnalysis, nextAnalysis);
          
          case 'quick_cut_with_effect':
            return await this.executeQuickCutWithEffect(currentAnalysis, nextAnalysis);
          
          case 'vocal_over_mix':
            return await this.executeVocalOverMix(currentAnalysis, nextAnalysis);
          
          case 'loop_transition':
            return await this.executeLoopTransition(currentAnalysis, nextAnalysis);
          
          default:
            return await this.executeRelaxedTransition(currentAnalysis, nextAnalysis);
        }
      } catch (transitionError) {
        console.error('Transition execution failed, using fallback:', transitionError);
        return this.createFallbackTransition();
      }
      
    } catch (error) {
      console.error('Professional transition failed completely:', error);
      return this.createFallbackTransition();
    }
  }

  createFallbackTransition() {
    console.log('🔄 Creating fallback transition');
    
    return {
      style: 'fallback_transition',
      duration: 8000,
      startTime: 0,
      
      phases: [
        {
          time: 0,
          description: 'Start fallback transition',
          actions: [
            { track: 'B', stem: 'all', volume: 0.3 }
          ]
        },
        {
          time: 2000,
          description: 'Gradual crossfade',
          actions: [
            { track: 'A', stem: 'all', volume: 0.7 },
            { track: 'B', stem: 'all', volume: 0.7 }
          ]
        },
        {
          time: 6000,
          description: 'Complete transition',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
  }

  selectOptimalTransitionStyle(currentAnalysis, nextAnalysis) {
    const bpmDiff = Math.abs(currentAnalysis.bpm - nextAnalysis.bpm);
    const keyCompatibility = this.calculateKeyCompatibility(currentAnalysis.camelotKey, nextAnalysis.camelotKey);
    const energyDiff = this.calculateEnergyDifference(currentAnalysis, nextAnalysis);
    
    // Decision matrix for transition style selection
    if (bpmDiff > 15) {
      return 'quick_cut_with_effect'; // Large BPM difference
    }
    
    if (keyCompatibility < 0.3) {
      return 'quick_cut_with_effect'; // Incompatible keys
    }
    
    if (energyDiff > 0.4) {
      return 'high_energy_overlap'; // High energy tracks
    }
    
    if (this.hasOverlappingVocals(currentAnalysis, nextAnalysis)) {
      return 'vocal_over_mix'; // Intelligent vocal handling
    }
    
    if (bpmDiff < 3 && keyCompatibility > 0.8) {
      return 'rolling_transition'; // Perfect compatibility
    }
    
    return 'relaxed_transition'; // Default safe transition
  }

  calculateKeyCompatibility(key1, key2) {
    if (!key1 || !key2) return 0.5;
    
    const wheel1 = this.camelotWheel[key1];
    const wheel2 = this.camelotWheel[key2];
    
    if (!wheel1 || !wheel2) return 0.5;
    
    if (key1 === key2) return 1.0; // Perfect match
    if (wheel1.complementary === key2) return 0.9; // Relative minor/major
    if (wheel1.adjacents.includes(key2)) return 0.8; // Adjacent keys
    
    return 0.3; // Distant keys
  }

  calculateEnergyDifference(analysis1, analysis2) {
    const energy1 = analysis1.energyProfile.reduce((sum, e) => sum + e.totalEnergy, 0) / analysis1.energyProfile.length;
    const energy2 = analysis2.energyProfile.reduce((sum, e) => sum + e.totalEnergy, 0) / analysis2.energyProfile.length;
    
    return Math.abs(energy1 - energy2);
  }

  hasOverlappingVocals(analysis1, analysis2) {
    const currentVocalEnd = Math.max(...analysis1.vocalSections.map(v => v.end));
    const nextVocalStart = Math.min(...analysis2.vocalSections.map(v => v.start));
    
    // Check if vocal sections would overlap during transition
    return currentVocalEnd > analysis1.mixOutPoint && nextVocalStart < 30;
  }

  /**
   * RELAXED TRANSITION (Outro to Intro)
   * Smooth crossfade between compatible sections
   */
  async executeRelaxedTransition(currentAnalysis, nextAnalysis) {
    console.log('🌊 RELAXED TRANSITION: Smooth outro-to-intro crossfade');
    
    const transitionPlan = {
      style: 'relaxed_transition',
      duration: 16000, // 16 seconds
      startTime: currentAnalysis.mixOutPoint,
      
      phases: [
        // Phase 1: Start next track quietly (0-4s)
        {
          time: 0,
          description: 'Start next track at low volume',
          actions: [
            { track: 'B', stem: 'all', volume: 0.2, filter: 'lowpass', cutoff: 8000 }
          ]
        },
        
        // Phase 2: Gradually introduce elements (4-8s)
        {
          time: 4000,
          description: 'Introduce drums and bass',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.6 },
            { track: 'B', stem: 'bass', volume: 0.5 },
            { track: 'A', stem: 'vocals', volume: 0.3 } // Fade out vocals
          ]
        },
        
        // Phase 3: Full crossfade (8-12s)
        {
          time: 8000,
          description: 'Main crossfade period',
          actions: [
            { track: 'A', stem: 'all', volume: 0.4 },
            { track: 'B', stem: 'all', volume: 0.8, filter: 'highpass', cutoff: 200 }
          ]
        },
        
        // Phase 4: Complete transition (12-16s)
        {
          time: 12000,
          description: 'Complete the transition',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0, filter: 'none' }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * HIGH ENERGY OVERLAP (Peak to Peak)
   * Powerful overlap of high-energy sections
   */
  async executeHighEnergyOverlap(currentAnalysis, nextAnalysis) {
    console.log('🔥 HIGH ENERGY OVERLAP: Peak-to-peak power transition');
    
    // Find the highest energy section in next track
    const peakEnergyPoint = nextAnalysis.energyProfile.reduce((max, current) =>
      current.totalEnergy > max.totalEnergy ? current : max
    );
    
    const transitionPlan = {
      style: 'high_energy_overlap',
      duration: 8000, // 8 seconds - shorter for impact
      startTime: currentAnalysis.mixOutPoint,
      
      phases: [
        // Phase 1: Immediate impact (0-2s)
        {
          time: 0,
          description: 'Immediate powerful entry',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.8 },
            { track: 'B', stem: 'bass', volume: 0.7 },
            { track: 'A', stem: 'bass', volume: 0.3 } // Reduce bass clash
          ]
        },
        
        // Phase 2: Layer building (2-4s)
        {
          time: 2000,
          description: 'Build the energy layers',
          actions: [
            { track: 'B', stem: 'other', volume: 0.9 },
            { track: 'A', stem: 'drums', volume: 0.4 } // Reduce drum clash
          ]
        },
        
        // Phase 3: Peak moment (4-6s)
        {
          time: 4000,
          description: 'Peak energy moment',
          actions: [
            { track: 'B', stem: 'all', volume: 1.0 },
            { track: 'A', stem: 'all', volume: 0.2 }
          ]
        },
        
        // Phase 4: Resolution (6-8s)
        {
          time: 6000,
          description: 'Clean resolution',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * ROLLING TRANSITION (Continuous Energy Flow)
   * Maintains energy through extended overlap
   */
  async executeRollingTransition(currentAnalysis, nextAnalysis) {
    console.log('🌀 ROLLING TRANSITION: Continuous energy flow');
    
    const transitionPlan = {
      style: 'rolling_transition',
      duration: 24000, // 24 seconds - extended for flow
      startTime: currentAnalysis.mixOutPoint - 8000, // Start earlier
      
      phases: [
        // Phase 1: Background introduction (0-8s)
        {
          time: 0,
          description: 'Subtle background introduction',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.2, filter: 'highpass', cutoff: 1000 },
            { track: 'B', stem: 'other', volume: 0.1 }
          ]
        },
        
        // Phase 2: Gradual layer building (8-16s)
        {
          time: 8000,
          description: 'Gradual element layering',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.5, filter: 'highpass', cutoff: 400 },
            { track: 'B', stem: 'bass', volume: 0.3 },
            { track: 'A', stem: 'vocals', volume: 0.6 }
          ]
        },
        
        // Phase 3: Equal presence (16-20s)
        {
          time: 16000,
          description: 'Both tracks at equal strength',
          actions: [
            { track: 'A', stem: 'all', volume: 0.7 },
            { track: 'B', stem: 'all', volume: 0.7, filter: 'none' }
          ]
        },
        
        // Phase 4: Smooth handover (20-24s)
        {
          time: 20000,
          description: 'Smooth handover to next track',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * DOUBLE DROP (Synchronized Peak Moments)
   * Aligns climactic moments of both tracks
   */
  async executeDoubleDrop(currentAnalysis, nextAnalysis) {
    console.log('💥 DOUBLE DROP: Synchronized peak moments');
    
    // Find chorus/drop sections in both tracks
    const currentDrop = currentAnalysis.cuePoints.find(cue => cue.type === 'chorus');
    const nextDrop = nextAnalysis.cuePoints.find(cue => cue.type === 'chorus');
    
    const transitionPlan = {
      style: 'double_drop',
      duration: 12000, // 12 seconds
      startTime: currentDrop?.time || currentAnalysis.mixOutPoint,
      
      phases: [
        // Phase 1: Build tension (0-4s)
        {
          time: 0,
          description: 'Build tension with both tracks',
          actions: [
            { track: 'A', stem: 'all', volume: 1.0 },
            { track: 'B', stem: 'drums', volume: 0.6, filter: 'highpass', cutoff: 2000 },
            { track: 'B', stem: 'vocals', volume: 0.0 } // No vocal clash
          ]
        },
        
        // Phase 2: DOUBLE DROP moment (4-6s)
        {
          time: 4000,
          description: 'SYNCHRONIZED DROP MOMENT',
          actions: [
            { track: 'A', stem: 'all', volume: 0.9 },
            { track: 'B', stem: 'all', volume: 0.9, filter: 'none' },
            { effect: 'reverb', amount: 0.3, duration: 2000 }
          ]
        },
        
        // Phase 3: Resolution battle (6-10s)
        {
          time: 6000,
          description: 'Let tracks compete briefly',
          actions: [
            { track: 'A', stem: 'drums', volume: 0.5 },
            { track: 'B', stem: 'drums', volume: 1.0 }
          ]
        },
        
        // Phase 4: Winner emerges (10-12s)
        {
          time: 10000,
          description: 'Next track emerges victorious',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * QUICK CUT WITH EFFECT
   * Rapid transition with masking effects
   */
  async executeQuickCutWithEffect(currentAnalysis, nextAnalysis) {
    console.log('⚡ QUICK CUT WITH EFFECT: Rapid masked transition');
    
    const transitionPlan = {
      style: 'quick_cut_with_effect',
      duration: 4000, // 4 seconds - very quick
      startTime: currentAnalysis.mixOutPoint,
      
      phases: [
        // Phase 1: Build effect (0-1s)
        {
          time: 0,
          description: 'Build transition effect',
          actions: [
            { track: 'A', stem: 'all', volume: 1.0, filter: 'lowpass', cutoff: 1000 },
            { effect: 'echo', feedback: 0.4, delay: 0.125 }
          ]
        },
        
        // Phase 2: Effect peak and cut (1-2s)
        {
          time: 1000,
          description: 'Effect peak and abrupt cut',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0, filter: 'none' },
            { track: 'B', stem: 'all', volume: 0.7 },
            { effect: 'reverb', amount: 0.5, duration: 1000 }
          ]
        },
        
        // Phase 3: Clean entry (2-4s)
        {
          time: 2000,
          description: 'Clean entry of next track',
          actions: [
            { track: 'B', stem: 'all', volume: 1.0 },
            { effect: 'none' }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * VOCAL OVER MIX
   * Intelligent vocal layering and separation
   */
  async executeVocalOverMix(currentAnalysis, nextAnalysis) {
    console.log('🎤 VOCAL OVER MIX: Intelligent vocal layering');
    
    // Find vocal-free sections for clean mixing
    const currentVocalGap = this.findVocalGap(currentAnalysis.vocalSections, currentAnalysis.mixOutPoint);
    const nextVocalStart = nextAnalysis.vocalSections[0];
    
    const transitionPlan = {
      style: 'vocal_over_mix',
      duration: 20000, // 20 seconds - extended for vocal management
      startTime: currentVocalGap?.start || currentAnalysis.mixOutPoint,
      
      phases: [
        // Phase 1: Instrumental introduction (0-6s)
        {
          time: 0,
          description: 'Start with instrumental only',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.4 },
            { track: 'B', stem: 'bass', volume: 0.3 },
            { track: 'B', stem: 'other', volume: 0.5 },
            { track: 'B', stem: 'vocals', volume: 0.0 } // NO vocals yet
          ]
        },
        
        // Phase 2: Current vocal isolated (6-12s)
        {
          time: 6000,
          description: 'Isolate current track vocals',
          actions: [
            { track: 'A', stem: 'drums', volume: 0.2 },
            { track: 'A', stem: 'bass', volume: 0.1 },
            { track: 'A', stem: 'other', volume: 0.3 },
            { track: 'A', stem: 'vocals', volume: 0.8 }, // Keep vocals
            { track: 'B', stem: 'all', volume: 0.7 }
          ]
        },
        
        // Phase 3: Vocal handover (12-16s)
        {
          time: 12000,
          description: 'Smooth vocal handover',
          actions: [
            { track: 'A', stem: 'vocals', volume: 0.3 },
            { track: 'B', stem: 'vocals', volume: 0.6 } // Introduce new vocals
          ]
        },
        
        // Phase 4: Complete transition (16-20s)
        {
          time: 16000,
          description: 'Complete the vocal transition',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0 },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  /**
   * LOOP TRANSITION
   * Uses loops to extend transition opportunities
   */
  async executeLoopTransition(currentAnalysis, nextAnalysis) {
    console.log('🔁 LOOP TRANSITION: Extended loop-based mixing');
    
    // Find good loop points (usually 4 or 8 bar sections)
    const currentLoopPoint = this.findBestLoopPoint(currentAnalysis);
    const nextIntroLoop = nextAnalysis.beatGrid.slice(0, 16); // First 16 beats
    
    const transitionPlan = {
      style: 'loop_transition',
      duration: 32000, // 32 seconds - extended for creative mixing
      startTime: currentLoopPoint.time,
      
      phases: [
        // Phase 1: Establish current loop (0-8s)
        {
          time: 0,
          description: 'Establish current track loop',
          actions: [
            { track: 'A', stem: 'all', volume: 1.0, loop: true, loopLength: 8 }
          ]
        },
        
        // Phase 2: Add next track loop (8-16s)
        {
          time: 8000,
          description: 'Layer next track loop',
          actions: [
            { track: 'B', stem: 'drums', volume: 0.5, loop: true, loopLength: 4 },
            { track: 'B', stem: 'bass', volume: 0.3 }
          ]
        },
        
        // Phase 3: Complex layering (16-24s)
        {
          time: 16000,
          description: 'Complex loop layering',
          actions: [
            { track: 'A', stem: 'vocals', volume: 0.6 },
            { track: 'B', stem: 'all', volume: 0.8, loop: false }
          ]
        },
        
        // Phase 4: Release to next track (24-32s)
        {
          time: 24000,
          description: 'Release into next track',
          actions: [
            { track: 'A', stem: 'all', volume: 0.0, loop: false },
            { track: 'B', stem: 'all', volume: 1.0 }
          ]
        }
      ]
    };
    
    return transitionPlan;
  }

  findVocalGap(vocalSections, afterTime) {
    for (let i = 0; i < vocalSections.length - 1; i++) {
      const current = vocalSections[i];
      const next = vocalSections[i + 1];
      
      if (current.end > afterTime && next.start - current.end > 4) {
        return {
          start: Math.max(current.end, afterTime),
          end: next.start,
          duration: next.start - Math.max(current.end, afterTime)
        };
      }
    }
    return null;
  }

  findBestLoopPoint(analysis) {
    // Find a good 8-bar loop point with high energy
    const candidates = analysis.beatGrid.filter(beat => 
      beat.isDownbeat && 
      (beat.bar - 1) % 8 === 0 && // 8-bar boundaries
      beat.confidence > 0.7
    );
    
    if (candidates.length === 0) return { time: analysis.mixOutPoint };
    
    // Find the one with highest energy in its vicinity
    let bestPoint = candidates[0];
    let bestEnergy = 0;
    
    for (const candidate of candidates) {
      const energy = analysis.energyProfile.find(e => 
        Math.abs(e.time - candidate.time) < 2
      )?.totalEnergy || 0;
      
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestPoint = candidate;
      }
    }
    
    return bestPoint;
  }

  /**
   * INTEGRATION WITH EXISTING AUDIO ENGINE
   */
  async integrateWithAudioEngine() {
    console.log('🔗 Integrating Professional Auto-DJ with Audio Engine');
    
    // Hook into existing audio engine events
    this.audioEngine.addEventListener('trackLoaded', (event, data) => {
      this.analyzeTrack(data.track);
    });
    
    this.audioEngine.addEventListener('transitionRequested', async (event, data) => {
      const currentTrack = this.audioEngine.currentTrack;
      const nextTrack = this.audioEngine.nextTrack;
      
      if (currentTrack && nextTrack) {
        const transitionPlan = await this.executeTransition(currentTrack, nextTrack);
        this.audioEngine.executeTransitionPlan(transitionPlan);
      }
    });
    
    // Replace existing beat matching with professional version
    this.audioEngine.performProfessionalBeatMatching = this.performProfessionalBeatMatching.bind(this);
  }

  /**
   * PERFORMANCE MONITORING AND OPTIMIZATION
   */
  getPerformanceMetrics() {
    return {
      cachedAnalyses: this.analysisCache.size,
      isAnalyzing: this.isAnalyzing,
      lastTransitionStyle: this.currentTransitionStyle,
      memoryUsage: this.estimateMemoryUsage(),
      availableTransitionStyles: this.transitionStyles
    };
  }

  // Debug helper to validate track data
  validateTrackData(trackData) {
    const issues = [];
    
    if (!trackData) {
      issues.push('Track data is null/undefined');
      return issues;
    }
    
    if (!trackData.title) issues.push('Missing track title');
    if (!trackData.stems) issues.push('Missing stems data');
    if (!trackData.duration) issues.push('Missing track duration');
    
    if (trackData.stems) {
      const stemTypes = ['vocals', 'drums', 'bass', 'other'];
      const availableStems = stemTypes.filter(stem => trackData.stems[stem]?.buffer);
      
      if (availableStems.length === 0) {
        issues.push('No valid stem buffers found');
      } else {
        console.log(`✅ Available stems for ${trackData.title}: ${availableStems.join(', ')}`);
      }
    }
    
    return issues;
  }

  // Enhanced logging for debugging
  logTransitionAttempt(currentTrack, nextTrack) {
    console.log(`🔍 PROFESSIONAL TRANSITION DEBUG:`);
    console.log(`   Current: ${currentTrack?.title || 'Unknown'}`);
    console.log(`   Next: ${nextTrack?.title || 'Unknown'}`);
    
    const currentIssues = this.validateTrackData(currentTrack);
    const nextIssues = this.validateTrackData(nextTrack);
    
    if (currentIssues.length > 0) {
      console.warn(`⚠️ Current track issues: ${currentIssues.join(', ')}`);
    }
    
    if (nextIssues.length > 0) {
      console.warn(`⚠️ Next track issues: ${nextIssues.join(', ')}`);
    }
    
    console.log(`   Cache size: ${this.analysisCache.size} tracks`);
    console.log(`   Analysis in progress: ${this.isAnalyzing}`);
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, analysis] of this.analysisCache) {
      totalSize += JSON.stringify(analysis).length;
    }
    return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
  }

  clearCache(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [key, analysis] of this.analysisCache) {
      if (now - analysis.lastAnalyzed > maxAge) {
        this.analysisCache.delete(key);
      }
    }
  }
}

// Export for use in audio engine
export default ProfessionalAutoDJ; 