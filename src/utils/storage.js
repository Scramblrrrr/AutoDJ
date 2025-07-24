/**
 * Local Storage Utility for AutoDJ
 * Manages user data, stats, and app state persistence
 */

class AutoDJStorage {
  constructor() {
    this.keys = {
      TRACKS: 'autodj_tracks',
      DOWNLOADS: 'autodj_downloads',
      STATS: 'autodj_stats',
      SETTINGS: 'autodj_settings',
      QUEUES: 'autodj_queues',
      PROCESSING_HISTORY: 'autodj_processing_history'
    };
    
    // Initialize default data if not exists
    this.initializeDefaults();
  }

  initializeDefaults() {
    if (!this.getStats()) {
      this.setStats({
        totalTracks: 0,
        processedTracks: 0,
        totalMixTime: 0,
        activeSessions: 0,
        totalDownloads: 0,
        storageUsed: 0,
        lastUpdated: Date.now()
      });
    }

    if (!this.getSettings()) {
      this.setSettings({
        downloadPath: './downloads',
        processedPath: './processed',
        defaultQuality: '320',
        defaultFormat: 'mp3',
        autoProcess: true,
        theme: 'dark',
        stemModel: 'htdemucs'
      });
    }
  }

  // Generic storage methods
  setItem(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // Stats management
  getStats() {
    return this.getItem(this.keys.STATS);
  }

  setStats(stats) {
    const updatedStats = {
      ...stats,
      lastUpdated: Date.now()
    };
    return this.setItem(this.keys.STATS, updatedStats);
  }

  updateStats(updates) {
    const currentStats = this.getStats() || {};
    const newStats = { ...currentStats, ...updates };
    return this.setStats(newStats);
  }

  incrementStat(statName, value = 1) {
    const stats = this.getStats() || {};
    stats[statName] = (stats[statName] || 0) + value;
    return this.setStats(stats);
  }

  // Tracks management
  getTracks() {
    return this.getItem(this.keys.TRACKS) || [];
  }

  addTrack(track) {
    const tracks = this.getTracks();
    const newTrack = {
      id: Date.now() + Math.random(),
      ...track,
      addedAt: Date.now()
    };
    tracks.push(newTrack);
    this.setItem(this.keys.TRACKS, tracks);
    this.incrementStat('totalTracks');
    return newTrack;
  }

  updateTrack(trackId, updates) {
    const tracks = this.getTracks();
    const index = tracks.findIndex(t => t.id === trackId);
    if (index !== -1) {
      tracks[index] = { ...tracks[index], ...updates, updatedAt: Date.now() };
      this.setItem(this.keys.TRACKS, tracks);
      
      // Update processed count if status changed to completed
      if (updates.status === 'completed' && tracks[index].status !== 'completed') {
        this.incrementStat('processedTracks');
      }
      
      return tracks[index];
    }
    return null;
  }

  removeTrack(trackId) {
    const tracks = this.getTracks();
    const filteredTracks = tracks.filter(t => t.id !== trackId);
    this.setItem(this.keys.TRACKS, filteredTracks);
    this.incrementStat('totalTracks', -1);
    return true;
  }

  // Downloads management
  getDownloads() {
    return this.getItem(this.keys.DOWNLOADS) || [];
  }

  addDownload(download) {
    const downloads = this.getDownloads();
    const newDownload = {
      id: Date.now() + Math.random(),
      ...download,
      addedAt: Date.now(),
      status: 'pending'
    };
    downloads.push(newDownload);
    this.setItem(this.keys.DOWNLOADS, downloads);
    this.incrementStat('totalDownloads');
    return newDownload;
  }

  updateDownload(downloadId, updates) {
    const downloads = this.getDownloads();
    const index = downloads.findIndex(d => d.id === downloadId);
    if (index !== -1) {
      downloads[index] = { ...downloads[index], ...updates, updatedAt: Date.now() };
      this.setItem(this.keys.DOWNLOADS, downloads);
      return downloads[index];
    }
    return null;
  }

  // Settings management
  getSettings() {
    return this.getItem(this.keys.SETTINGS);
  }

  setSettings(settings) {
    return this.setItem(this.keys.SETTINGS, settings);
  }

  updateSetting(key, value) {
    const settings = this.getSettings() || {};
    settings[key] = value;
    return this.setSettings(settings);
  }

  // Queue management
  getQueues() {
    return this.getItem(this.keys.QUEUES) || [];
  }

  saveQueue(queue) {
    const queues = this.getQueues();
    const existingIndex = queues.findIndex(q => q.id === queue.id);
    
    if (existingIndex !== -1) {
      queues[existingIndex] = { ...queue, updatedAt: Date.now() };
    } else {
      queues.push({ ...queue, id: Date.now(), createdAt: Date.now() });
    }
    
    this.setItem(this.keys.QUEUES, queues);
    return queues;
  }

  // Processing history
  getProcessingHistory() {
    return this.getItem(this.keys.PROCESSING_HISTORY) || [];
  }

  addProcessingRecord(record) {
    const history = this.getProcessingHistory();
    const newRecord = {
      id: Date.now() + Math.random(),
      ...record,
      timestamp: Date.now()
    };
    history.unshift(newRecord); // Add to beginning
    
    // Keep only last 100 records
    if (history.length > 100) {
      history.splice(100);
    }
    
    this.setItem(this.keys.PROCESSING_HISTORY, history);
    return newRecord;
  }

  // Utility methods
  calculateStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('autodj_')) {
        totalSize += localStorage[key].length;
      }
    }
    return totalSize;
  }

  exportData() {
    const data = {};
    Object.values(this.keys).forEach(key => {
      data[key] = this.getItem(key);
    });
    return data;
  }

  importData(data) {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(this.keys).includes(key)) {
          this.setItem(key, value);
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  clearAllData() {
    Object.values(this.keys).forEach(key => {
      this.removeItem(key);
    });
    this.initializeDefaults();
  }

  // Session tracking
  startSession() {
    this.updateStats({ 
      activeSessions: (this.getStats().activeSessions || 0) + 1,
      lastSessionStart: Date.now()
    });
  }

  endSession(duration = 0) {
    const stats = this.getStats();
    this.updateStats({
      activeSessions: Math.max(0, (stats.activeSessions || 1) - 1),
      totalMixTime: (stats.totalMixTime || 0) + Math.floor(duration / 60000), // Convert to minutes
      lastSessionEnd: Date.now()
    });
  }
}

// Create singleton instance
const storage = new AutoDJStorage();

export default storage; 