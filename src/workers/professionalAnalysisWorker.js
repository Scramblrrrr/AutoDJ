/**
 * Professional Analysis Web Worker
 * Handles heavy audio analysis tasks to prevent UI freezing
 */

// Analysis function implementations
class ProfessionalAnalysisWorker {
  constructor() {
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
   * ADVANCED BPM ANALYSIS with Dynamic Beat Tracking
   */
  async advancedBPMAnalysis(stems) {
    try {
      const bpmResults = [];
      let totalConfidence = 0;
      let validResults = 0;

      // Analyze each stem for BPM
      for (const [stemType, audioBuffer] of Object.entries(stems)) {
        if (audioBuffer && audioBuffer.length > 0) {
          const stemBPM = await this.analyzeBeatTrack(audioBuffer, stemType);
          if (stemBPM && stemBPM.bpm > 0) {
            bpmResults.push(stemBPM);
            totalConfidence += stemBPM.confidence || 0.5;
            validResults++;
          }
        }
      }

      if (validResults === 0) {
        return { bpm: 120, bmp: 120, confidence: 0.3, beatGrid: [] };
      }

      // Calculate weighted average BPM
      const averageBPM = bpmResults.reduce((sum, result) => sum + result.bpm, 0) / validResults;
      const averageConfidence = totalConfidence / validResults;

      // Generate beat grid
      const beatGrid = await this.generateAdvancedBeatGrid({ bpm: averageBPM }, stems.beats || stems.drums);

      return {
        bpm: Math.round(averageBPM),
        bmp: Math.round(averageBPM),
        confidence: averageConfidence,
        beatGrid: beatGrid
      };

    } catch (error) {
      console.warn('BPM analysis failed:', error);
      return { bpm: 120, bmp: 120, confidence: 0.3, beatGrid: [] };
    }
  }

  /**
   * Analyze individual beat track for BPM
   */
  async analyzeBeatTrack(audioBuffer, stemType) {
    try {
      const sampleRate = audioBuffer.sampleRate || 44100;
      const channelData = audioBuffer.channelData || audioBuffer;
      
      // Convert back to Float32Array if it's a regular array
      const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);

      // Apply high-pass filter to emphasize transients
      const filteredData = this.highPassFilter(float32Data, sampleRate, 80);
      const emphasizedData = this.emphasizeTransients(filteredData, sampleRate);

      // Analyze BPM in different ranges
      const bpmRanges = [
        { min: 60, max: 90, weight: 0.3 },   // Downtempo
        { min: 90, max: 120, weight: 0.4 },  // Mid-tempo
        { min: 120, max: 150, weight: 0.2 }, // Up-tempo
        { min: 150, max: 180, weight: 0.1 }  // High-tempo
      ];

      let bestBPM = 120;
      let bestConfidence = 0;

      for (const range of bpmRanges) {
        const result = this.autocorrelationBPMInRange(emphasizedData, sampleRate, range.min, range.max);
        if (result.confidence > bestConfidence) {
          bestBPM = result.bpm;
          bestConfidence = result.confidence * range.weight;
        }
      }

      return {
        bpm: bestBPM,
        confidence: bestConfidence,
        stemType: stemType
      };

    } catch (error) {
      console.warn(`Beat track analysis failed for ${stemType}:`, error);
      return { bpm: 120, confidence: 0.3, stemType: stemType };
    }
  }

  /**
   * High-pass filter to emphasize transients
   */
  highPassFilter(data, sampleRate, cutoffFreq) {
    const filtered = new Float32Array(data.length);
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = rc / (rc + dt);

    filtered[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
    }

    return filtered;
  }

  /**
   * Emphasize transients for better beat detection
   */
  emphasizeTransients(data, sampleRate) {
    const emphasized = new Float32Array(data.length);
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms window

    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;

      // Calculate local average
      for (let j = Math.max(0, i - windowSize); j < Math.min(data.length, i + windowSize); j++) {
        sum += Math.abs(data[j]);
        count++;
      }

      const localAverage = sum / count;
      const currentMagnitude = Math.abs(data[i]);

      // Emphasize if current sample is significantly above local average
      if (currentMagnitude > localAverage * 1.5) {
        emphasized[i] = data[i] * 2.0;
      } else {
        emphasized[i] = data[i] * 0.5;
      }
    }

    return emphasized;
  }

  /**
   * Autocorrelation-based BPM detection in specific range
   */
  autocorrelationBPMInRange(data, sampleRate, minBPM, maxBPM) {
    const maxLag = Math.floor(sampleRate * 60 / minBPM);
    const minLag = Math.floor(sampleRate * 60 / maxBPM);
    const correlation = new Float32Array(maxLag);

    // Calculate autocorrelation
    for (let lag = minLag; lag < maxLag; lag++) {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < data.length - lag; i++) {
        sum += data[i] * data[i + lag];
        count++;
      }

      correlation[lag] = count > 0 ? sum / count : 0;
    }

    // Find peaks in correlation
    const peaks = [];
    for (let i = 1; i < correlation.length - 1; i++) {
      if (correlation[i] > correlation[i - 1] && correlation[i] > correlation[i + 1]) {
        peaks.push({ lag: i, value: correlation[i] });
      }
    }

    // Sort peaks by value
    peaks.sort((a, b) => b.value - a.value);

    // Find BPM from peak lag
    let bestBPM = 120;
    let bestConfidence = 0;

    for (const peak of peaks.slice(0, 5)) {
      const bpm = 60 * sampleRate / peak.lag;
      if (bpm >= minBPM && bpm <= maxBPM) {
        const confidence = peak.value / Math.max(...correlation);
        if (confidence > bestConfidence) {
          bestBPM = bpm;
          bestConfidence = confidence;
        }
      }
    }

    return { bpm: bestBPM, confidence: bestConfidence };
  }

  /**
   * Generate advanced beat grid
   */
  async generateAdvancedBeatGrid(bpmInfo, audioBuffer) {
    try {
      if (!audioBuffer || !bpmInfo.bpm) {
        return [];
      }

      const sampleRate = audioBuffer.sampleRate || 44100;
      const duration = audioBuffer.length / sampleRate;
      const bpm = bpmInfo.bpm;
      const beatInterval = 60 / bpm;

      // Detect onsets for precise beat alignment
      const onsets = this.detectOnsets(audioBuffer.channelData || audioBuffer, sampleRate);

      const beatGrid = [];
      let currentTime = 0;

      while (currentTime < duration) {
        // Find closest onset to theoretical beat time
        const closestOnset = this.findClosestOnset(onsets, currentTime, beatInterval * 0.5);
        const beatTime = closestOnset !== null ? closestOnset : currentTime;

        beatGrid.push({
          time: beatTime,
          type: 'beat',
          strength: 1.0
        });

        currentTime += beatInterval;
      }

      return beatGrid;

    } catch (error) {
      console.warn('Beat grid generation failed:', error);
      return [];
    }
  }

  /**
   * Detect onsets in audio data
   */
  detectOnsets(channelData, sampleRate) {
    const onsets = [];
    const frameSize = Math.floor(sampleRate * 0.046); // 46ms frames
    const hopSize = Math.floor(frameSize * 0.5);

    let previousFrame = null;

    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      
      if (previousFrame) {
        const flux = this.calculateSpectralFlux(previousFrame, frame);
        
        // Threshold-based onset detection
        if (flux > 0.1) {
          const onsetTime = i / sampleRate;
          onsets.push(onsetTime);
        }
      }

      previousFrame = frame;
    }

    return onsets;
  }

  /**
   * Calculate spectral flux between two frames
   */
  calculateSpectralFlux(frame1, frame2) {
    let sum = 0;
    for (let i = 0; i < frame1.length; i++) {
      const diff = Math.abs(frame2[i]) - Math.abs(frame1[i]);
      sum += diff > 0 ? diff : 0;
    }
    return sum / frame1.length;
  }

  /**
   * Find closest onset to target time
   */
  findClosestOnset(onsets, targetTime, maxDistance) {
    let closest = null;
    let minDistance = maxDistance;

    for (const onset of onsets) {
      const distance = Math.abs(onset - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        closest = onset;
      }
    }

    return closest;
  }

  /**
   * ADVANCED KEY DETECTION
   */
  async advancedKeyDetection(stems) {
    try {
      const keyResults = [];
      let totalConfidence = 0;
      let validResults = 0;

      // Analyze each stem for key
      for (const [stemType, audioBuffer] of Object.entries(stems)) {
        if (audioBuffer && audioBuffer.length > 0) {
          const stemKey = await this.analyzeKeyFromStem(audioBuffer, stemType);
          if (stemKey && stemKey.key) {
            keyResults.push(stemKey);
            totalConfidence += stemKey.confidence || 0.5;
            validResults++;
          }
        }
      }

      if (validResults === 0) {
        return { key: { name: 'C Major', mode: 'major' }, camelotKey: '8B', confidence: 0.3 };
      }

      // Use most confident result
      const bestResult = keyResults.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );

      return {
        key: bestResult.key,
        camelotKey: bestResult.camelotKey,
        confidence: bestResult.confidence
      };

    } catch (error) {
      console.warn('Key detection failed:', error);
      return { key: { name: 'C Major', mode: 'major' }, camelotKey: '8B', confidence: 0.3 };
    }
  }

  /**
   * Analyze key from individual stem
   */
  async analyzeKeyFromStem(audioBuffer, stemType) {
    try {
      const sampleRate = audioBuffer.sampleRate || 44100;
      const channelData = audioBuffer.channelData || audioBuffer;
      
      // Convert back to Float32Array if it's a regular array
      const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);

      // Generate chromagram
      const chromagram = this.generateChromagram(float32Data, sampleRate);
      
      // Match against key templates
      const keyMatch = this.matchKeyTemplates(chromagram);
      
      // Convert to Camelot notation
      const camelotKey = this.keyToCamelot(keyMatch.key.name);

      return {
        key: keyMatch.key,
        camelotKey: camelotKey,
        confidence: keyMatch.confidence,
        stemType: stemType
      };

    } catch (error) {
      console.warn(`Key analysis failed for ${stemType}:`, error);
      return { key: { name: 'C Major', mode: 'major' }, confidence: 0.3, stemType: stemType };
    }
  }

  /**
   * Generate chromagram from audio data
   */
  generateChromagram(channelData, sampleRate) {
    const chromagram = new Float32Array(12);
    const frameSize = Math.floor(sampleRate * 0.046); // 46ms frames
    const hopSize = Math.floor(frameSize * 0.5);

    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      
      // Simple FFT for frequency analysis
      const spectrum = this.simpleDFT(frame);
      
      // Map frequencies to pitch classes
      for (let j = 0; j < spectrum.length; j++) {
        const frequency = j * sampleRate / frameSize;
        if (frequency > 20 && frequency < 20000) {
          const pitchClass = this.frequencyToPitchClass(frequency);
          const magnitude = Math.abs(spectrum[j]);
          chromagram[pitchClass] += magnitude;
        }
      }
    }

    // Normalize chromagram
    const maxVal = Math.max(...chromagram);
    if (maxVal > 0) {
      for (let i = 0; i < 12; i++) {
        chromagram[i] /= maxVal;
      }
    }

    return chromagram;
  }

  /**
   * Convert frequency to pitch class (0-11)
   */
  frequencyToPitchClass(frequency) {
    const a4 = 440;
    const semitones = Math.round(12 * Math.log2(frequency / a4));
    return ((semitones % 12) + 12) % 12;
  }

  /**
   * Emphasize harmonics in chromagram
   */
  emphasizeHarmonics(chromagram) {
    const emphasized = new Float32Array(12);
    
    for (let i = 0; i < 12; i++) {
      emphasized[i] = chromagram[i];
      
      // Add harmonic contributions
      for (let harmonic = 2; harmonic <= 4; harmonic++) {
        const harmonicClass = (i * harmonic) % 12;
        emphasized[i] += chromagram[harmonicClass] * (1.0 / harmonic);
      }
    }

    return emphasized;
  }

  /**
   * Match chromagram against key templates
   */
  matchKeyTemplates(chromagram) {
    const keyTemplates = {
      'C Major': [1, 0, 0.5, 0, 1, 0, 0, 1, 0, 0, 0.5, 0],
      'G Major': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0.5],
      'D Major': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      'A Major': [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      'E Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      'B Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'F# Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'C# Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'A♭ Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'E♭ Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'B♭ Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'F Major': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    let bestKey = 'C Major';
    let bestCorrelation = 0;

    for (const [keyName, template] of Object.entries(keyTemplates)) {
      const correlation = this.correlateProfiles(chromagram, template);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = keyName;
      }
    }

    return {
      key: { name: bestKey, mode: 'major' },
      confidence: bestCorrelation
    };
  }

  /**
   * Correlate two profiles
   */
  correlateProfiles(profile1, profile2) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += profile1[i] * profile2[i];
    }
    return sum / 12;
  }

  /**
   * Convert key to Camelot notation
   */
  keyToCamelot(keyName) {
    const keyMap = {
      'C Major': '8B', 'G Major': '9B', 'D Major': '10B', 'A Major': '11B',
      'E Major': '12B', 'B Major': '1B', 'F# Major': '2B', 'C# Major': '3B',
      'A♭ Major': '4B', 'E♭ Major': '5B', 'B♭ Major': '6B', 'F Major': '7B'
    };
    return keyMap[keyName] || '8B';
  }

  /**
   * Simple DFT implementation
   */
  simpleDFT(signal) {
    const N = signal.length;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);

    for (let k = 0; k < N; k++) {
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real[k] += signal[n] * Math.cos(angle);
        imag[k] += signal[n] * Math.sin(angle);
      }
    }

    const magnitude = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      magnitude[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
    }

    return magnitude;
  }

  /**
   * TRACK STRUCTURE ANALYSIS
   */
  async analyzeTrackStructure(stems, beatGrid) {
    try {
      const sections = [];
      const duration = stems.beats ? stems.beats.length / (stems.beats.sampleRate || 44100) : 180;

      // Analyze energy patterns
      const energyPatterns = this.analyzeEnergyPatterns(stems.beats || stems.drums);
      
      // Analyze vocal activity
      const vocalActivity = this.analyzeVocalActivity(stems.vocals);

      // Detect structural boundaries
      const boundaries = this.detectStructuralBoundaries(energyPatterns, vocalActivity, beatGrid);

      // Create sections
      for (let i = 0; i < boundaries.length - 1; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        const sectionType = this.predictSectionType(boundaries[i], i, boundaries.length, vocalActivity);
        
        sections.push({
          type: sectionType,
          start: start,
          end: end,
          energy: this.calculateAverageEnergy(energyPatterns, start, end)
        });
      }

      return {
        sections: sections,
        introLength: this.findIntroLength(sections),
        outroLength: this.findOutroLength(sections)
      };

    } catch (error) {
      console.warn('Structure analysis failed:', error);
      return {
        sections: [{ type: 'unknown', start: 0, end: 180, energy: 0.5 }],
        introLength: 8,
        outroLength: 8
      };
    }
  }

  /**
   * Analyze energy patterns
   */
  analyzeEnergyPatterns(audioBuffer) {
    if (!audioBuffer) return [];

    const sampleRate = audioBuffer.sampleRate || 44100;
    const channelData = audioBuffer.channelData || audioBuffer;
    
    // Convert back to Float32Array if it's a regular array
    const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);
    const windowSize = Math.floor(sampleRate * 0.5); // 0.5s windows
    const hopSize = Math.floor(windowSize * 0.5);

    const energyWindows = [];

    for (let i = 0; i < float32Data.length - windowSize; i += hopSize) {
      const window = float32Data.slice(i, i + windowSize);
      let energy = 0;

      for (let j = 0; j < window.length; j++) {
        energy += window[j] * window[j];
      }

      energyWindows.push({
        time: i / sampleRate,
        energy: energy / window.length
      });
    }

    return energyWindows;
  }

  /**
   * Analyze vocal activity
   */
  analyzeVocalActivity(vocalBuffer) {
    if (!vocalBuffer) return [];

    const sampleRate = vocalBuffer.sampleRate || 44100;
    const channelData = vocalBuffer.channelData || vocalBuffer;
    
    // Convert back to Float32Array if it's a regular array
    const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);
    
    const windowSize = Math.floor(sampleRate * 1.0); // 1s windows
    const hopSize = Math.floor(windowSize * 0.5);

    const vocalWindows = [];

    for (let i = 0; i < float32Data.length - windowSize; i += hopSize) {
      const window = float32Data.slice(i, i + windowSize);
      let activity = 0;

      for (let j = 0; j < window.length; j++) {
        activity += Math.abs(window[j]);
      }

      vocalWindows.push({
        time: i / sampleRate,
        activity: activity / window.length
      });
    }

    return vocalWindows;
  }

  /**
   * Detect structural boundaries
   */
  detectStructuralBoundaries(energyWindows, vocalWindows, beatGrid) {
    const boundaries = [0];
    const duration = energyWindows.length > 0 ? 
      energyWindows[energyWindows.length - 1].time : 180;

    // Find significant energy changes
    for (let i = 1; i < energyWindows.length - 1; i++) {
      const prevEnergy = energyWindows[i - 1].energy;
      const currEnergy = energyWindows[i].energy;
      const nextEnergy = energyWindows[i + 1].energy;

      const change = Math.abs(currEnergy - prevEnergy) / Math.max(prevEnergy, 0.001);
      
      if (change > 0.3) {
        const boundaryTime = this.alignToNearestDownbeat(energyWindows[i].time, beatGrid);
        if (boundaryTime > boundaries[boundaries.length - 1] + 8) {
          boundaries.push(boundaryTime);
        }
      }
    }

    boundaries.push(duration);
    return boundaries;
  }

  /**
   * Align time to nearest downbeat
   */
  alignToNearestDownbeat(time, beatGrid) {
    if (!beatGrid || beatGrid.length === 0) return time;

    let closestBeat = beatGrid[0].time;
    let minDistance = Math.abs(time - closestBeat);

    for (const beat of beatGrid) {
      const distance = Math.abs(time - beat.time);
      if (distance < minDistance) {
        minDistance = distance;
        closestBeat = beat.time;
      }
    }

    return closestBeat;
  }

  /**
   * Predict section type
   */
  predictSectionType(boundary, index, totalBoundaries, vocalActivity) {
    if (index === 0) return 'intro';
    if (index === totalBoundaries - 2) return 'outro';
    
    // Simple heuristic based on position
    const progress = index / (totalBoundaries - 1);
    if (progress < 0.2) return 'intro';
    if (progress > 0.8) return 'outro';
    if (progress > 0.4 && progress < 0.6) return 'breakdown';
    return 'verse';
  }

  /**
   * Calculate average energy for a time range
   */
  calculateAverageEnergy(energyPatterns, start, end) {
    if (!energyPatterns || energyPatterns.length === 0) return 0.5;

    let totalEnergy = 0;
    let count = 0;

    for (const pattern of energyPatterns) {
      if (pattern.time >= start && pattern.time <= end) {
        totalEnergy += pattern.energy;
        count++;
      }
    }

    return count > 0 ? totalEnergy / count : 0.5;
  }

  /**
   * Find intro length
   */
  findIntroLength(sections) {
    for (const section of sections) {
      if (section.type === 'intro') {
        return section.end - section.start;
      }
    }
    return 8; // Default intro length
  }

  /**
   * Find outro length
   */
  findOutroLength(sections) {
    for (const section of sections) {
      if (section.type === 'outro') {
        return section.end - section.start;
      }
    }
    return 8; // Default outro length
  }

  /**
   * VOCAL PRESENCE ANALYSIS
   */
  async analyzeVocalPresence(vocalStem) {
    try {
      if (!vocalStem || vocalStem.length === 0) {
        return { sections: [], intensity: 0 };
      }

      const sampleRate = vocalStem.sampleRate || 44100;
      const channelData = vocalStem.channelData || vocalStem;
      
      // Convert back to Float32Array if it's a regular array
      const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);
      const windowSize = Math.floor(sampleRate * 2.0); // 2s windows
      const hopSize = Math.floor(windowSize * 0.5);

      const vocalSections = [];
      let totalIntensity = 0;
      let windowCount = 0;

          for (let i = 0; i < float32Data.length - windowSize; i += hopSize) {
      const window = float32Data.slice(i, i + windowSize);
        const intensity = this.calculateVocalIntensity(window);
        const time = i / sampleRate;

        if (intensity > 0.1) {
          vocalSections.push({
            start: time,
            end: time + windowSize / sampleRate,
            intensity: intensity,
            type: this.classifyVocalType(intensity)
          });
        }

        totalIntensity += intensity;
        windowCount++;
      }

      const averageIntensity = windowCount > 0 ? totalIntensity / windowCount : 0;

      return {
        sections: vocalSections,
        intensity: averageIntensity
      };

    } catch (error) {
      console.warn('Vocal analysis failed:', error);
      return { sections: [], intensity: 0 };
    }
  }

  /**
   * Calculate vocal intensity
   */
  calculateVocalIntensity(window) {
    let energy = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < window.length; i++) {
      energy += window[i] * window[i];
      if (i > 0 && (window[i] * window[i - 1]) < 0) {
        zeroCrossings++;
      }
    }

    const avgEnergy = energy / window.length;
    const zeroCrossingRate = zeroCrossings / window.length;

    // Vocal characteristics: high energy, moderate zero-crossing rate
    const vocalScore = avgEnergy * (1 - Math.abs(zeroCrossingRate - 0.1));
    return Math.min(vocalScore * 10, 1.0);
  }

  /**
   * Classify vocal type
   */
  classifyVocalType(intensity) {
    if (intensity > 0.7) return 'strong_vocal';
    if (intensity > 0.4) return 'moderate_vocal';
    if (intensity > 0.1) return 'light_vocal';
    return 'instrumental';
  }

  /**
   * ENERGY PROFILE ANALYSIS
   */
  async analyzeEnergyProfile(stems) {
    try {
      const energyProfile = [];
      const duration = stems.beats ? stems.beats.length / (stems.beats.sampleRate || 44100) : 180;
      const windowSize = Math.floor((stems.beats?.sampleRate || 44100) * 1.0); // 1s windows

      for (let time = 0; time < duration; time += 1) {
        const energy = this.calculateEnergyAtTime(stems, time, 1.0);
        energyProfile.push({
          time: time,
          totalEnergy: energy,
          energyLevel: this.classifyEnergyLevel(energy)
        });
      }

      return energyProfile;

    } catch (error) {
      console.warn('Energy profile analysis failed:', error);
      return [{ time: 0, totalEnergy: 0.5, energyLevel: 'medium' }];
    }
  }

  /**
   * Calculate energy at specific time
   */
  calculateEnergyAtTime(stems, startTime, duration) {
    let totalEnergy = 0;
    let stemCount = 0;

    for (const [stemType, audioBuffer] of Object.entries(stems)) {
      if (audioBuffer && audioBuffer.length > 0) {
        const sampleRate = audioBuffer.sampleRate || 44100;
        const channelData = audioBuffer.channelData || audioBuffer;
        
        // Convert back to Float32Array if it's a regular array
        const float32Data = channelData instanceof Float32Array ? channelData : new Float32Array(channelData);
        
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.min(startSample + Math.floor(duration * sampleRate), float32Data.length);
        
        if (startSample < float32Data.length) {
          const segment = float32Data.slice(startSample, endSample);
          let energy = 0;
          
          for (let i = 0; i < segment.length; i++) {
            energy += segment[i] * segment[i];
          }
          
          totalEnergy += energy / segment.length;
          stemCount++;
        }
      }
    }

    return stemCount > 0 ? totalEnergy / stemCount : 0;
  }

  /**
   * Classify energy level
   */
  classifyEnergyLevel(energy) {
    if (energy > 0.7) return 'high';
    if (energy > 0.4) return 'medium';
    return 'low';
  }
}

// Create worker instance
const worker = new ProfessionalAnalysisWorker();

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'analyze-bpm':
        result = await worker.advancedBPMAnalysis(data.stems);
        break;
      
      case 'analyze-key':
        result = await worker.advancedKeyDetection(data.stems);
        break;
      
      case 'analyze-structure':
        result = await worker.analyzeTrackStructure(data.stems, data.beatGrid);
        break;
      
      case 'analyze-vocal':
        result = await worker.analyzeVocalPresence(data.vocalStem);
        break;
      
      case 'analyze-energy':
        result = await worker.analyzeEnergyProfile(data.stems);
        break;
      
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    self.postMessage({
      type: 'analysis-complete',
      id: id,
      result: result,
      success: true
    });

  } catch (error) {
    console.error('Worker analysis error:', error);
    self.postMessage({
      type: 'analysis-error',
      id: id,
      error: error.message,
      success: false
    });
  }
});

// Notify main thread that worker is ready
self.postMessage({ type: 'worker-ready' }); 