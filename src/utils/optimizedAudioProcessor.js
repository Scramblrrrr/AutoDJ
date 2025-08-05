/**
 * Optimized Audio Processor for AutoDJ
 * Uses Web Workers for non-blocking analysis and proper progress tracking
 */

class OptimizedAudioProcessor {
  constructor() {
    this.workers = new Map();
    this.progressCallbacks = new Map();
    this.analysisCache = new Map();
    this.processingQueue = new Map();
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.activeWorkers = 0;
    
    // Progress tracking per file
    this.fileProgress = new Map();
    this.progressIntervals = new Map();
    
    console.log(`🎵 Optimized Audio Processor initialized with ${this.maxWorkers} workers`);
  }

  /**
   * Create a Web Worker for audio processing
   */
  createWorker() {
    const workerCode = `
      // Audio Analysis Worker
      self.onmessage = function(e) {
        const { type, data, fileId } = e.data;
        
        switch (type) {
          case 'analyze-bpm':
            analyzeBPM(data, fileId);
            break;
          case 'analyze-key':
            analyzeKey(data, fileId);
            break;
          case 'generate-waveform':
            generateWaveform(data, fileId);
            break;
          case 'detect-structure':
            detectStructure(data, fileId);
            break;
        }
      };

      function analyzeBPM(audioData, fileId) {
        try {
          // Optimized BPM detection using autocorrelation
          const sampleRate = audioData.sampleRate;
          const channelData = audioData.channelData;
          
          // Downsample for faster processing
          const downsampleFactor = 4;
          const downsampledData = new Float32Array(Math.floor(channelData.length / downsampleFactor));
          
          for (let i = 0; i < downsampledData.length; i++) {
            downsampledData[i] = channelData[i * downsampleFactor];
          }
          
          const downsampledSampleRate = sampleRate / downsampleFactor;
          
          // High-pass filter to focus on rhythmic content
          const filteredData = highPassFilter(downsampledData, downsampledSampleRate, 80);
          
          // Autocorrelation for BPM detection
          const bpm = autocorrelationBPM(filteredData, downsampledSampleRate);
          
          // Report progress
          self.postMessage({
            type: 'progress',
            fileId,
            progress: 25,
            stage: 'bpm-analysis'
          });
          
          self.postMessage({
            type: 'result',
            fileId,
            result: { bpm, confidence: 0.8 }
          });
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            fileId,
            error: error.message
          });
        }
      }

      function analyzeKey(audioData, fileId) {
        try {
          // Optimized key detection using chromagram
          const sampleRate = audioData.sampleRate;
          const channelData = audioData.channelData;
          
          // Use shorter segment for key detection
          const segmentLength = Math.min(channelData.length, sampleRate * 30); // 30 seconds max
          const segment = channelData.slice(0, segmentLength);
          
          const chromagram = generateChromagram(segment, sampleRate);
          const key = detectKeyFromChromagram(chromagram);
          
          // Report progress
          self.postMessage({
            type: 'progress',
            fileId,
            progress: 50,
            stage: 'key-analysis'
          });
          
          self.postMessage({
            type: 'result',
            fileId,
            result: { key, confidence: 0.7 }
          });
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            fileId,
            error: error.message
          });
        }
      }

      function generateWaveform(audioData, fileId) {
        try {
          const channelData = audioData.channelData;
          const sampleRate = audioData.sampleRate;
          
          // Generate optimized waveform data
          const waveformPoints = 1000; // Reduced for performance
          const waveform = new Float32Array(waveformPoints);
          const samplesPerPoint = Math.floor(channelData.length / waveformPoints);
          
          for (let i = 0; i < waveformPoints; i++) {
            const start = i * samplesPerPoint;
            const end = Math.min(start + samplesPerPoint, channelData.length);
            
            let sum = 0;
            let max = 0;
            
            for (let j = start; j < end; j++) {
              sum += Math.abs(channelData[j]);
              max = Math.max(max, Math.abs(channelData[j]));
            }
            
            waveform[i] = max; // Use peak for better visualization
          }
          
          // Report progress
          self.postMessage({
            type: 'progress',
            fileId,
            progress: 75,
            stage: 'waveform-generation'
          });
          
          self.postMessage({
            type: 'result',
            fileId,
            result: { waveform }
          });
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            fileId,
            error: error.message
          });
        }
      }

      function detectStructure(audioData, fileId) {
        try {
          const channelData = audioData.channelData;
          const sampleRate = audioData.sampleRate;
          
          // Simple energy-based structure detection
          const windowSize = sampleRate * 2; // 2-second windows
          const windows = Math.floor(channelData.length / windowSize);
          const energyProfile = new Float32Array(windows);
          
          for (let i = 0; i < windows; i++) {
            const start = i * windowSize;
            const end = Math.min(start + windowSize, channelData.length);
            
            let energy = 0;
            for (let j = start; j < end; j++) {
              energy += channelData[j] * channelData[j];
            }
            energyProfile[i] = Math.sqrt(energy / (end - start));
          }
          
          // Detect sections based on energy changes
          const sections = detectSectionsFromEnergy(energyProfile);
          
          // Report progress
          self.postMessage({
            type: 'progress',
            fileId,
            progress: 100,
            stage: 'structure-detection'
          });
          
          self.postMessage({
            type: 'result',
            fileId,
            result: { sections, energyProfile }
          });
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            fileId,
            error: error.message
          });
        }
      }

      // Utility functions
      function highPassFilter(data, sampleRate, cutoffFreq) {
        const filtered = new Float32Array(data.length);
        const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = rc / (rc + dt);
        
        filtered[0] = data[0];
        for (let i = 1; i < data.length; i++) {
          filtered[i] = alpha * (filtered[i-1] + data[i] - data[i-1]);
        }
        
        return filtered;
      }

      function autocorrelationBPM(data, sampleRate) {
        const maxLag = Math.floor(sampleRate * 2); // 2 seconds max
        const minLag = Math.floor(sampleRate * 0.5); // 0.5 seconds min
        
        let maxCorrelation = 0;
        let bestLag = minLag;
        
        for (let lag = minLag; lag < maxLag; lag++) {
          let correlation = 0;
          for (let i = 0; i < data.length - lag; i++) {
            correlation += data[i] * data[i + lag];
          }
          
          if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestLag = lag;
          }
        }
        
        return 60.0 / (bestLag / sampleRate);
      }

      function generateChromagram(data, sampleRate) {
        const fftSize = 2048;
        const hopSize = fftSize / 4;
        const chromagram = new Float32Array(12);
        
        for (let i = 0; i < data.length - fftSize; i += hopSize) {
          const frame = data.slice(i, i + fftSize);
          const spectrum = fft(frame);
          
          // Map frequencies to chroma bins
          for (let bin = 0; bin < fftSize / 2; bin++) {
            const freq = bin * sampleRate / fftSize;
            const chromaBin = Math.floor((Math.log2(freq / 440) + 0.5) % 12);
            if (chromaBin >= 0 && chromaBin < 12) {
              chromagram[chromaBin] += Math.abs(spectrum[bin]);
            }
          }
        }
        
        return chromagram;
      }

      function detectKeyFromChromagram(chromagram) {
        const keyProfiles = {
          'C': [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
          'G': [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        };
        
        let bestKey = 'C';
        let bestCorrelation = 0;
        
        for (const [key, profile] of Object.entries(keyProfiles)) {
          let correlation = 0;
          for (let i = 0; i < 12; i++) {
            correlation += chromagram[i] * profile[i];
          }
          
          if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestKey = key;
          }
        }
        
        return bestKey;
      }

      function detectSectionsFromEnergy(energyProfile) {
        const sections = [];
        const threshold = 0.1;
        
        let currentSection = { start: 0, energy: energyProfile[0] };
        
        for (let i = 1; i < energyProfile.length; i++) {
          const energyChange = Math.abs(energyProfile[i] - currentSection.energy);
          
          if (energyChange > threshold) {
            currentSection.end = i;
            sections.push(currentSection);
            currentSection = { start: i, energy: energyProfile[i] };
          }
        }
        
        currentSection.end = energyProfile.length;
        sections.push(currentSection);
        
        return sections;
      }

      function fft(data) {
        // Simple FFT implementation
        const n = data.length;
        const real = new Float32Array(n);
        const imag = new Float32Array(n);
        
        // Copy input data
        for (let i = 0; i < n; i++) {
          real[i] = data[i];
        }
        
        // Radix-2 FFT
        for (let step = 1; step < n; step *= 2) {
          for (let group = 0; group < n; group += 2 * step) {
            for (let pair = group; pair < group + step; pair++) {
              const match = pair + step;
              const angle = -Math.PI * (pair - group) / step;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              
              const realMatch = real[match] * cos - imag[match] * sin;
              const imagMatch = real[match] * sin + imag[match] * cos;
              
              real[match] = real[pair] - realMatch;
              imag[match] = imag[pair] - imagMatch;
              real[pair] += realMatch;
              imag[pair] += imagMatch;
            }
          }
        }
        
        // Calculate magnitude
        const magnitude = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }
        
        return magnitude;
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (e) => {
      this.handleWorkerMessage(e.data);
    };
    
    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
    
    return worker;
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(message) {
    const { type, fileId, progress, stage, result, error } = message;
    
    switch (type) {
      case 'progress':
        this.updateFileProgress(fileId, progress, stage);
        break;
        
      case 'result':
        this.handleAnalysisResult(fileId, result);
        break;
        
      case 'error':
        this.handleAnalysisError(fileId, error);
        break;
    }
  }

  /**
   * Update progress for a specific file
   */
  updateFileProgress(fileId, progress, stage) {
    const currentProgress = this.fileProgress.get(fileId) || 0;
    const newProgress = Math.max(currentProgress, progress);
    
    this.fileProgress.set(fileId, newProgress);
    
    // Notify progress callback
    const callback = this.progressCallbacks.get(fileId);
    if (callback) {
      callback({
        fileId,
        progress: newProgress,
        stage,
        message: `${stage}: ${newProgress}%`
      });
    }
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('file-progress-update', {
      detail: {
        fileId,
        progress: newProgress,
        stage,
        message: `${stage}: ${newProgress}%`
      }
    }));
  }

  /**
   * Handle analysis results
   */
  handleAnalysisResult(fileId, result) {
    const analysis = this.analysisCache.get(fileId) || {};
    Object.assign(analysis, result);
    this.analysisCache.set(fileId, analysis);
    
    // Mark as complete
    this.updateFileProgress(fileId, 100, 'complete');
    
    // Clean up worker
    this.releaseWorker(fileId);
  }

  /**
   * Handle analysis errors
   */
  handleAnalysisError(fileId, error) {
    console.error(`Analysis error for file ${fileId}:`, error);
    
    // Mark as error
    this.updateFileProgress(fileId, -1, 'error');
    
    // Clean up worker
    this.releaseWorker(fileId);
  }

  /**
   * Get or create a worker
   */
  getWorker() {
    // Find available worker
    for (const [workerId, worker] of this.workers) {
      if (!this.processingQueue.has(workerId)) {
        return { workerId, worker };
      }
    }
    
    // Create new worker if under limit
    if (this.workers.size < this.maxWorkers) {
      const workerId = `worker_${Date.now()}_${Math.random()}`;
      const worker = this.createWorker();
      this.workers.set(workerId, worker);
      return { workerId, worker };
    }
    
    return null;
  }

  /**
   * Release a worker
   */
  releaseWorker(fileId) {
    const workerId = this.processingQueue.get(fileId);
    if (workerId) {
      this.processingQueue.delete(fileId);
      this.progressCallbacks.delete(fileId);
      
      // Clear progress interval
      const interval = this.progressIntervals.get(fileId);
      if (interval) {
        clearInterval(interval);
        this.progressIntervals.delete(fileId);
      }
    }
  }

  /**
   * Analyze audio file with progress tracking
   */
  async analyzeAudioFile(fileId, audioData, progressCallback) {
    return new Promise((resolve, reject) => {
      // Set up progress tracking
      this.progressCallbacks.set(fileId, progressCallback);
      this.fileProgress.set(fileId, 0);
      
      // Get available worker
      const workerInfo = this.getWorker();
      if (!workerInfo) {
        reject(new Error('No available workers'));
        return;
      }
      
      const { workerId, worker } = workerInfo;
      this.processingQueue.set(fileId, workerId);
      
      // Start analysis pipeline
      this.runAnalysisPipeline(fileId, worker, audioData, resolve, reject);
    });
  }

  /**
   * Run the complete analysis pipeline
   */
  async runAnalysisPipeline(fileId, worker, audioData, resolve, reject) {
    try {
      const analysis = {};
      
      // Step 1: BPM Analysis
      worker.postMessage({
        type: 'analyze-bpm',
        fileId,
        data: audioData
      });
      
      // Wait for BPM result
      await this.waitForResult(fileId, 'bpm');
      analysis.bpm = this.analysisCache.get(fileId)?.bpm || 120;
      
      // Step 2: Key Analysis
      worker.postMessage({
        type: 'analyze-key',
        fileId,
        data: audioData
      });
      
      await this.waitForResult(fileId, 'key');
      analysis.key = this.analysisCache.get(fileId)?.key || 'C';
      
      // Step 3: Waveform Generation
      worker.postMessage({
        type: 'generate-waveform',
        fileId,
        data: audioData
      });
      
      await this.waitForResult(fileId, 'waveform');
      analysis.waveform = this.analysisCache.get(fileId)?.waveform;
      
      // Step 4: Structure Detection
      worker.postMessage({
        type: 'detect-structure',
        fileId,
        data: audioData
      });
      
      await this.waitForResult(fileId, 'structure');
      analysis.sections = this.analysisCache.get(fileId)?.sections;
      
      resolve(analysis);
      
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Wait for a specific analysis result
   */
  waitForResult(fileId, resultType, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkResult = () => {
        const analysis = this.analysisCache.get(fileId);
        if (analysis && analysis[resultType]) {
          resolve(analysis[resultType]);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for ${resultType} analysis`));
          return;
        }
        
        setTimeout(checkResult, 100);
      };
      
      checkResult();
    });
  }

  /**
   * Process multiple files in parallel with proper progress tracking
   */
  async processFilesInParallel(files, maxConcurrent = 3) {
    const results = new Map();
    const processing = new Set();
    const queue = [...files];
    
    const processFile = async (file) => {
      try {
        const result = await this.analyzeAudioFile(
          file.id,
          file.audioData,
          (progress) => {
            // File-specific progress callback
            console.log(`File ${file.name}: ${progress.progress}% - ${progress.stage}`);
          }
        );
        
        results.set(file.id, result);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.set(file.id, { error: error.message });
      } finally {
        processing.delete(file);
      }
    };
    
    // Process files with controlled concurrency
    while (queue.length > 0 || processing.size > 0) {
      // Start new files if we have capacity
      while (processing.size < maxConcurrent && queue.length > 0) {
        const file = queue.shift();
        processing.add(file);
        processFile(file);
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    
    this.workers.clear();
    this.progressCallbacks.clear();
    this.analysisCache.clear();
    this.processingQueue.clear();
    this.fileProgress.clear();
    
    // Clear all intervals
    for (const interval of this.progressIntervals.values()) {
      clearInterval(interval);
    }
    this.progressIntervals.clear();
  }
}

// Export singleton instance
const optimizedAudioProcessor = new OptimizedAudioProcessor();

export default optimizedAudioProcessor; 