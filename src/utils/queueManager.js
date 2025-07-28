/**
 * Professional Queue Management System
 * Handles automatic deck assignment, metadata display, and intelligent track loading
 */

class QueueManager {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.queue = [];
    this.upcomingIndex = 0;
    this.currentDeck = 'A'; // Tracks which deck is currently playing
    this.deckStates = {
      A: { track: null, status: 'idle', isPlaying: false },
      B: { track: null, status: 'idle', isPlaying: false }
    };
    
    this.autoDJEnabled = true;
    this.transitionInProgress = false;
    this.preloadEnabled = true;
    
    // Listeners for UI updates
    this.listeners = new Set();
    
    // Start the auto-loading loop
    this.startAutoLoadLoop();
    
    console.log('🎵 Queue Manager initialized');
  }

  /**
   * Add tracks to queue with comprehensive metadata
   */
  addToQueue(tracks) {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    
    const queueItems = tracksArray.map(track => ({
      id: track.id || `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: track.title || track.name || 'Unknown Track',
      artist: track.artist || 'Unknown Artist',
      duration: track.duration || 0,
      bpm: track.bpm || 120,
      originalBPM: track.originalBPM || track.bpm || 120,
      currentBPM: track.currentBPM || track.bpm || 120,
      key: track.key || { name: 'C Major', camelot: '8B' },
      originalKey: track.originalKey || track.key,
      currentKey: track.currentKey || track.key,
      genre: track.genre || 'Unknown',
      energy: track.energy || 0.5,
      stemsAvailable: !!track.stemsPath,
      filePath: track.filePath,
      stemsPath: track.stemsPath,
      analysisComplete: track.analysisComplete !== false, // Default to true
      addedAt: Date.now(),
      
      // Professional DJ metadata
      harmonic: this.calculateHarmonic(track.key),
      energyLevel: this.categorizeEnergy(track.energy || 0.5),
      compatibility: this.calculateCompatibility(track),
      mixInPoint: track.mixInPoint || 0,
      mixOutPoint: track.mixOutPoint || (track.duration || 180) - 30
    }));
    
    this.queue.push(...queueItems);
    console.log(`🎵 Added ${queueItems.length} tracks to queue (Total: ${this.queue.length})`);
    
    // Notify listeners
    this.notifyListeners('queueUpdated', {
      queue: this.queue,
      added: queueItems
    });
    
    // Auto-load if queue was empty and auto-DJ is enabled
    if (this.queue.length === queueItems.length && this.autoDJEnabled) {
      setTimeout(() => this.loadNextTrackIfNeeded(), 100);
    }
    
    return queueItems;
  }

  /**
   * Remove track from queue
   */
  removeFromQueue(trackId) {
    const index = this.queue.findIndex(track => track.id === trackId);
    if (index === -1) return false;
    
    const removedTrack = this.queue.splice(index, 1)[0];
    
    // Adjust upcoming index if needed
    if (index < this.upcomingIndex) {
      this.upcomingIndex--;
    }
    
    console.log(`🗑️ Removed "${removedTrack.title}" from queue`);
    
    this.notifyListeners('queueUpdated', {
      queue: this.queue,
      removed: removedTrack
    });
    
    return true;
  }

  /**
   * Reorder queue (drag and drop support)
   */
  reorderQueue(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const track = this.queue.splice(fromIndex, 1)[0];
    this.queue.splice(toIndex, 0, track);
    
    // Adjust upcoming index
    if (fromIndex < this.upcomingIndex && toIndex >= this.upcomingIndex) {
      this.upcomingIndex--;
    } else if (fromIndex >= this.upcomingIndex && toIndex < this.upcomingIndex) {
      this.upcomingIndex++;
    }
    
    console.log(`🔄 Moved "${track.title}" from position ${fromIndex} to ${toIndex}`);
    
    this.notifyListeners('queueUpdated', {
      queue: this.queue,
      reordered: { from: fromIndex, to: toIndex, track }
    });
  }

  /**
   * Smart deck assignment and track loading
   */
  loadNextTrackIfNeeded() {
    if (!this.autoDJEnabled || this.transitionInProgress) return;
    
    const nextTrack = this.queue[this.upcomingIndex];
    if (!nextTrack || !nextTrack.analysisComplete) {
      console.log('⏭️ No suitable next track available');
      return;
    }
    
    const nextDeck = this.currentDeck === 'A' ? 'B' : 'A';
    
    if (this.deckStates[nextDeck].status === 'idle') {
      console.log(`🎵 Loading "${nextTrack.title}" to Deck ${nextDeck}`);
      this.loadTrackToDeck(nextDeck, nextTrack);
      this.upcomingIndex++;
    }
  }

  /**
   * Load track to specific deck
   */
  async loadTrackToDeck(deck, track) {
    try {
      this.deckStates[deck].status = 'loading';
      this.deckStates[deck].track = track;
      
      // Load track into audio engine
      const loadedTrack = await this.audioEngine.loadTrack(track);
      
      if (deck === 'A') {
        this.audioEngine.currentTrack = loadedTrack;
      } else {
        this.audioEngine.nextTrack = loadedTrack;
      }
      
      this.deckStates[deck].status = 'ready';
      
      console.log(`✅ Loaded "${track.title}" to Deck ${deck} (${track.bpm} BPM, ${track.key.name})`);
      
      // Notify listeners
      this.notifyListeners('trackLoaded', {
        deck,
        track: loadedTrack,
        deckState: this.deckStates[deck]
      });
      
      // Update UI with loaded track info
      if (deck === 'B') {
        this.notifyListeners('deckBTrackLoaded', {
          track: loadedTrack
        });
      }
      
    } catch (error) {
      console.error(`❌ Failed to load track to Deck ${deck}:`, error);
      this.deckStates[deck].status = 'error';
      this.deckStates[deck].track = null;
    }
  }

  /**
   * Handle track transitions
   */
  onTrackTransition(fromDeck) {
    console.log(`🔄 Transition from Deck ${fromDeck}`);
    
    this.transitionInProgress = true;
    this.currentDeck = fromDeck === 'A' ? 'B' : 'A';
    
    // Update deck states
    this.deckStates[fromDeck].status = 'idle';
    this.deckStates[fromDeck].track = null;
    this.deckStates[fromDeck].isPlaying = false;
    
    this.deckStates[this.currentDeck].status = 'playing';
    this.deckStates[this.currentDeck].isPlaying = true;
    
    // Load next track to the now-idle deck
    setTimeout(() => {
      this.transitionInProgress = false;
      this.loadNextTrackIfNeeded();
    }, 1000);
    
    this.notifyListeners('transitionComplete', {
      currentDeck: this.currentDeck,
      deckStates: this.deckStates
    });
  }

  /**
   * Skip to next track immediately
   */
  skipToNext() {
    if (this.queue.length <= this.upcomingIndex) {
      console.log('⏭️ No more tracks to skip to');
      return false;
    }
    
    console.log('⏭️ Skipping to next track');
    
    // Trigger immediate transition
    if (this.audioEngine.triggerManualTransition) {
      this.audioEngine.triggerManualTransition();
    }
    
    return true;
  }

  /**
   * Auto-loading loop for professional DJ operation
   */
  startAutoLoadLoop() {
    setInterval(() => {
      if (!this.autoDJEnabled || this.transitionInProgress) return;
      
      const currentTrack = this.deckStates[this.currentDeck].track;
      if (!currentTrack) return;
      
      // Calculate time remaining
      const currentTime = this.audioEngine.currentTime || 0;
      const duration = currentTrack.duration || 0;
      const timeLeft = duration - currentTime;
      
      // Load next track when 30 seconds remain
      if (timeLeft <= 30 && timeLeft > 25) {
        const nextDeck = this.currentDeck === 'A' ? 'B' : 'A';
        if (this.deckStates[nextDeck].status === 'idle') {
          this.loadNextTrackIfNeeded();
        }
      }
      
      // Trigger transition when 5 seconds remain
      if (timeLeft <= 5 && timeLeft > 4 && !this.transitionInProgress) {
        console.log('🎵 Auto-triggering transition (5s remaining)');
        if (this.audioEngine.triggerManualTransition) {
          this.audioEngine.triggerManualTransition();
        }
      }
      
    }, 500); // Check every 500ms
  }

  /**
   * Calculate harmonic compatibility
   */
  calculateHarmonic(key) {
    if (!key || !key.camelot) return 'Unknown';
    
    const camelot = key.camelot;
    const num = parseInt(camelot);
    const letter = camelot.charAt(camelot.length - 1);
    
    // Adjacent keys on Camelot wheel
    const adjacent = [
      `${num === 12 ? 1 : num + 1}${letter}`,
      `${num === 1 ? 12 : num - 1}${letter}`,
      `${num}${letter === 'A' ? 'B' : 'A'}`
    ];
    
    return adjacent;
  }

  /**
   * Categorize energy level
   */
  categorizeEnergy(energy) {
    if (energy < 0.3) return 'Chill';
    if (energy < 0.5) return 'Relaxed';
    if (energy < 0.7) return 'Moderate';
    if (energy < 0.85) return 'High Energy';
    return 'Peak Time';
  }

  /**
   * Calculate overall compatibility score
   */
  calculateCompatibility(track) {
    // This would analyze BPM difference, key compatibility, energy flow
    // For now, return a basic score
    return Math.random() * 0.4 + 0.6; // 0.6-1.0 range
  }

  /**
   * Get queue with enhanced metadata for UI
   */
  getQueueForUI() {
    return this.queue.map((track, index) => ({
      ...track,
      position: index + 1,
      isNext: index === this.upcomingIndex,
      isLoaded: this.deckStates.A.track?.id === track.id || this.deckStates.B.track?.id === track.id,
      loadedDeck: this.deckStates.A.track?.id === track.id ? 'A' : 
                  this.deckStates.B.track?.id === track.id ? 'B' : null,
      timeUntilPlay: this.calculateTimeUntilPlay(index),
      keyCompatibility: index > 0 ? this.checkKeyCompatibility(track, this.queue[index - 1]) : null
    }));
  }

  /**
   * Calculate estimated time until track plays
   */
  calculateTimeUntilPlay(queueIndex) {
    if (queueIndex < this.upcomingIndex) return 0;
    
    let totalTime = 0;
    const currentTime = this.audioEngine.currentTime || 0;
    const currentDuration = this.deckStates[this.currentDeck].track?.duration || 0;
    
    // Time left in current track
    totalTime += Math.max(0, currentDuration - currentTime);
    
    // Add duration of tracks before this one
    for (let i = this.upcomingIndex; i < queueIndex; i++) {
      totalTime += this.queue[i]?.duration || 180;
    }
    
    return totalTime;
  }

  /**
   * Check key compatibility between tracks
   */
  checkKeyCompatibility(track1, track2) {
    if (!track1.key?.camelot || !track2.key?.camelot) return 'Unknown';
    
    const harmonics1 = this.calculateHarmonic(track1.key);
    const harmonics2 = this.calculateHarmonic(track2.key);
    
    if (track1.key.camelot === track2.key.camelot) return 'Perfect';
    if (harmonics1.includes(track2.key.camelot)) return 'Compatible';
    if (harmonics2.includes(track1.key.camelot)) return 'Compatible';
    
    return 'Clash';
  }

  /**
   * Filter queue by criteria
   */
  filterQueue(criteria) {
    return this.queue.filter(track => {
      if (criteria.bpmRange) {
        const [min, max] = criteria.bpmRange;
        if (track.bpm < min || track.bpm > max) return false;
      }
      
      if (criteria.key && track.key?.camelot !== criteria.key) {
        const harmonics = this.calculateHarmonic({ camelot: criteria.key });
        if (!harmonics.includes(track.key?.camelot)) return false;
      }
      
      if (criteria.energy && Math.abs(track.energy - criteria.energy) > 0.2) {
        return false;
      }
      
      if (criteria.genre && track.genre !== criteria.genre) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get current deck states for UI
   */
  getDeckStates() {
    return {
      current: this.currentDeck,
      states: this.deckStates,
      queue: {
        total: this.queue.length,
        upcoming: this.upcomingIndex,
        remaining: this.queue.length - this.upcomingIndex
      }
    };
  }

  /**
   * Toggle Auto DJ
   */
  toggleAutoDJ(enabled) {
    this.autoDJEnabled = enabled;
    console.log(`🤖 Auto DJ ${enabled ? 'enabled' : 'disabled'}`);
    
    this.notifyListeners('autoDJToggled', { enabled });
    
    if (enabled) {
      this.loadNextTrackIfNeeded();
    }
  }

  /**
   * Add event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Queue listener error:', error);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      queueLength: this.queue.length,
      tracksRemaining: this.queue.length - this.upcomingIndex,
      currentDeck: this.currentDeck,
      autoDJEnabled: this.autoDJEnabled,
      deckStates: this.deckStates,
      averageBPM: this.queue.reduce((sum, t) => sum + t.bpm, 0) / this.queue.length || 0,
      averageEnergy: this.queue.reduce((sum, t) => sum + t.energy, 0) / this.queue.length || 0
    };
  }
}

// Export for use in other modules
window.QueueManager = QueueManager;
export default QueueManager; 