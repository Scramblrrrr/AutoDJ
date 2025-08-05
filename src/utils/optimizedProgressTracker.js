/**
 * Optimized Progress Tracker for AutoDJ
 * Handles per-file progress tracking with proper isolation between parallel jobs
 */

class OptimizedProgressTracker {
  constructor() {
    this.fileProgress = new Map();
    this.fileStages = new Map();
    this.fileMessages = new Map();
    this.processingJobs = new Map();
    this.progressCallbacks = new Map();
    this.stageWeights = {
      'downloading': 0.1,
      'stem-processing': 0.6,
      'analysis': 0.3
    };
    
    // Event listeners for progress updates
    this.listeners = new Set();
    
    console.log('📊 Optimized Progress Tracker initialized');
  }

  /**
   * Start tracking progress for a file
   */
  startTracking(fileId, fileName, stages = ['downloading', 'stem-processing', 'analysis']) {
    const jobId = `job_${fileId}_${Date.now()}`;
    
    this.fileProgress.set(fileId, 0);
    this.fileStages.set(fileId, stages);
    this.fileMessages.set(fileId, 'Initializing...');
    this.processingJobs.set(fileId, jobId);
    
    console.log(`📊 Started tracking progress for ${fileName} (${fileId})`);
    
    return jobId;
  }

  /**
   * Update progress for a specific file and stage
   */
  updateProgress(fileId, stage, progress, message = null) {
    if (!this.fileProgress.has(fileId)) {
      console.warn(`📊 No progress tracking found for file ${fileId}`);
      return;
    }

    const stages = this.fileStages.get(fileId) || [];
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex === -1) {
      console.warn(`📊 Unknown stage '${stage}' for file ${fileId}`);
      return;
    }

    // Calculate weighted progress
    const stageWeight = this.stageWeights[stage] || 0.1;
    const stageProgress = Math.min(100, Math.max(0, progress));
    
    // Calculate total progress based on completed stages + current stage
    let totalProgress = 0;
    
    // Add progress from completed stages
    for (let i = 0; i < stageIndex; i++) {
      const completedStage = stages[i];
      const completedWeight = this.stageWeights[completedStage] || 0.1;
      totalProgress += completedWeight * 100;
    }
    
    // Add progress from current stage
    totalProgress += stageWeight * stageProgress;
    
    // Ensure progress doesn't go backwards
    const currentProgress = this.fileProgress.get(fileId) || 0;
    const newProgress = Math.max(currentProgress, Math.round(totalProgress));
    
    // Update progress
    this.fileProgress.set(fileId, newProgress);
    
    // Update message
    if (message) {
      this.fileMessages.set(fileId, message);
    } else {
      this.fileMessages.set(fileId, `${stage}: ${stageProgress}%`);
    }
    
    // Notify listeners
    this.notifyProgressUpdate(fileId, {
      fileId,
      progress: newProgress,
      stage,
      stageProgress,
      message: this.fileMessages.get(fileId),
      timestamp: Date.now()
    });
    
    console.log(`📊 File ${fileId}: ${newProgress}% (${stage}: ${stageProgress}%)`);
  }

  /**
   * Update progress for a specific stage with percentage
   */
  updateStageProgress(fileId, stage, percentage, message = null) {
    this.updateProgress(fileId, stage, percentage, message);
  }

  /**
   * Mark a stage as complete
   */
  completeStage(fileId, stage, message = null) {
    this.updateProgress(fileId, stage, 100, message || `${stage} complete`);
  }

  /**
   * Mark a file as complete
   */
  completeFile(fileId, message = 'Processing complete') {
    this.updateProgress(fileId, 'analysis', 100, message);
    this.fileProgress.set(fileId, 100);
    this.fileMessages.set(fileId, message);
    
    // Clean up after a delay
    setTimeout(() => {
      this.cleanupFile(fileId);
    }, 5000);
  }

  /**
   * Mark a file as failed
   */
  failFile(fileId, error, message = null) {
    this.fileProgress.set(fileId, -1);
    this.fileMessages.set(fileId, message || `Error: ${error}`);
    
    // Notify listeners of failure
    this.notifyProgressUpdate(fileId, {
      fileId,
      progress: -1,
      stage: 'error',
      stageProgress: 0,
      message: this.fileMessages.get(fileId),
      error: error,
      timestamp: Date.now()
    });
    
    console.error(`📊 File ${fileId} failed: ${error}`);
    
    // Clean up after a delay
    setTimeout(() => {
      this.cleanupFile(fileId);
    }, 10000);
  }

  /**
   * Get current progress for a file
   */
  getFileProgress(fileId) {
    return {
      progress: this.fileProgress.get(fileId) || 0,
      stage: this.getCurrentStage(fileId),
      message: this.fileMessages.get(fileId) || 'Unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Get current stage for a file
   */
  getCurrentStage(fileId) {
    const stages = this.fileStages.get(fileId) || [];
    const progress = this.fileProgress.get(fileId) || 0;
    
    if (progress <= 0) return stages[0] || 'unknown';
    if (progress >= 100) return 'complete';
    
    // Find the current stage based on progress
    let cumulativeWeight = 0;
    for (const stage of stages) {
      const stageWeight = this.stageWeights[stage] || 0.1;
      cumulativeWeight += stageWeight * 100;
      
      if (progress <= cumulativeWeight) {
        return stage;
      }
    }
    
    return stages[stages.length - 1] || 'unknown';
  }

  /**
   * Get all active file progress
   */
  getAllProgress() {
    const progress = {};
    for (const [fileId, fileProgress] of this.fileProgress) {
      progress[fileId] = this.getFileProgress(fileId);
    }
    return progress;
  }

  /**
   * Add a progress listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove a progress listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of progress update
   */
  notifyProgressUpdate(fileId, progressData) {
    // Notify registered listeners
    for (const listener of this.listeners) {
      try {
        listener(fileId, progressData);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    }
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('optimized-progress-update', {
      detail: progressData
    }));
  }

  /**
   * Clean up file tracking data
   */
  cleanupFile(fileId) {
    this.fileProgress.delete(fileId);
    this.fileStages.delete(fileId);
    this.fileMessages.delete(fileId);
    this.processingJobs.delete(fileId);
    this.progressCallbacks.delete(fileId);
    
    console.log(`📊 Cleaned up progress tracking for file ${fileId}`);
  }

  /**
   * Handle stem processing progress updates
   */
  handleStemProgress(fileId, progressData) {
    if (typeof progressData === 'string') {
      // Parse progress message
      const percentageMatch = progressData.match(/(\d+)%/);
      if (percentageMatch) {
        const percentage = parseInt(percentageMatch[1]);
        this.updateStageProgress(fileId, 'stem-processing', percentage, progressData);
      } else {
        // Update message without changing percentage
        this.fileMessages.set(fileId, progressData);
        this.notifyProgressUpdate(fileId, {
          fileId,
          progress: this.fileProgress.get(fileId) || 0,
          stage: 'stem-processing',
          stageProgress: 0,
          message: progressData,
          timestamp: Date.now()
        });
      }
    } else if (typeof progressData === 'object') {
      // Handle structured progress data
      const { progress, stage, message } = progressData;
      this.updateStageProgress(fileId, stage || 'stem-processing', progress || 0, message);
    }
  }

  /**
   * Handle download progress updates
   */
  handleDownloadProgress(fileId, progressData) {
    if (typeof progressData === 'string') {
      const percentageMatch = progressData.match(/(\d+)%/);
      if (percentageMatch) {
        const percentage = parseInt(percentageMatch[1]);
        this.updateStageProgress(fileId, 'downloading', percentage, progressData);
      }
    } else if (typeof progressData === 'object') {
      const { progress, message } = progressData;
      this.updateStageProgress(fileId, 'downloading', progress || 0, message);
    }
  }

  /**
   * Handle analysis progress updates
   */
  handleAnalysisProgress(fileId, progressData) {
    if (typeof progressData === 'string') {
      const percentageMatch = progressData.match(/(\d+)%/);
      if (percentageMatch) {
        const percentage = parseInt(percentageMatch[1]);
        this.updateStageProgress(fileId, 'analysis', percentage, progressData);
      }
    } else if (typeof progressData === 'object') {
      const { progress, stage, message } = progressData;
      this.updateStageProgress(fileId, stage || 'analysis', progress || 0, message);
    }
  }

  /**
   * Create a progress callback for a specific file
   */
  createProgressCallback(fileId, stage) {
    return (progressData) => {
      switch (stage) {
        case 'downloading':
          this.handleDownloadProgress(fileId, progressData);
          break;
        case 'stem-processing':
          this.handleStemProgress(fileId, progressData);
          break;
        case 'analysis':
          this.handleAnalysisProgress(fileId, progressData);
          break;
        default:
          this.updateStageProgress(fileId, stage, progressData);
      }
    };
  }

  /**
   * Batch update multiple files
   */
  batchUpdate(files) {
    for (const file of files) {
      const { fileId, progress, stage, message } = file;
      this.updateProgress(fileId, stage, progress, message);
    }
  }

  /**
   * Get processing statistics
   */
  getStatistics() {
    const totalFiles = this.fileProgress.size;
    const completedFiles = Array.from(this.fileProgress.values()).filter(p => p === 100).length;
    const failedFiles = Array.from(this.fileProgress.values()).filter(p => p === -1).length;
    const processingFiles = totalFiles - completedFiles - failedFiles;
    
    const averageProgress = totalFiles > 0 
      ? Array.from(this.fileProgress.values()).reduce((sum, p) => sum + Math.max(0, p), 0) / totalFiles
      : 0;
    
    return {
      totalFiles,
      completedFiles,
      failedFiles,
      processingFiles,
      averageProgress: Math.round(averageProgress),
      activeJobs: this.processingJobs.size
    };
  }

  /**
   * Reset all progress tracking
   */
  reset() {
    this.fileProgress.clear();
    this.fileStages.clear();
    this.fileMessages.clear();
    this.processingJobs.clear();
    this.progressCallbacks.clear();
    
    console.log('📊 Progress tracker reset');
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.reset();
    this.listeners.clear();
    
    console.log('📊 Progress tracker destroyed');
  }
}

// Export singleton instance
const optimizedProgressTracker = new OptimizedProgressTracker();

export default optimizedProgressTracker; 