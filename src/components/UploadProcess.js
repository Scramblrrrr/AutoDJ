import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, Clock, AlertCircle, Play, Trash2, FolderOpen, Pause, Settings, Zap, Square, CheckSquare } from 'lucide-react';
import storage from '../utils/storage';
import fileManager from '../utils/fileManager';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

const UploadContainer = styled.div`
  padding: 30px;
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #3d3d3d 100%);
  padding-bottom: 150px; /* Extra space at bottom for better scrolling */
`;

const Header = styled.div`
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ff2323, #ff5757);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #b0b0b0;
    font-size: 16px;
  }
`;

const UploadSection = styled.div`
  margin-bottom: 30px;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? 'rgba(255, 35, 35, 0.6)' : 'rgba(255, 35, 35, 0.3)'};
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isDragActive ? 'rgba(255, 35, 35, 0.1)' : 'rgba(69, 69, 69, 0.3)'};
  margin-bottom: 20px;
  
  &:hover {
    border-color: rgba(255, 35, 35, 0.5);
    background: #2a2a2a;
  }
  
  svg {
    margin-bottom: 16px;
    color: #666;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #ccc;
  }
  
  p {
    color: #888;
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .supported-formats {
    font-size: 12px;
    color: #666;
    margin-top: 16px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  .file-count {
    color: #888;
    font-size: 14px;
  }
`;

const FileList = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
      color: #888;
    }
  }
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(69, 69, 69, 0.3);
  border: 1px solid rgba(255, 35, 35, 0.2);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  
  &.selected {
    border-color: #ff2323;
    background: rgba(255, 35, 35, 0.1);
  }
  
  .file-checkbox {
    margin-right: 12px;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
  
  .file-icon {
    margin-right: 16px;
    color: #ff2323;
    flex-shrink: 0;
  }
  
  .file-details {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: #fff;
    }
    
    p {
      font-size: 12px;
      color: #b0b0b0;
      margin: 0;
    }
  }
  
  .file-status {
    display: flex;
    align-items: center;
    margin-right: 16px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    
    .status-icon {
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    &.pending {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }
    
    &.processing {
      background: rgba(0, 123, 255, 0.2);
      color: #007bff;
    }
    
    &.completed {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
    }
    
    &.error {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
    }
  }
  
  .file-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    background: #333;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 6px;
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #3a3a3a;
      color: #fff;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #666, #888);
    width: ${props => props.$progress}%;
    transition: width 0.3s ease;
  }
`;

const ProcessingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  
  .stat-number {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const BulkControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 12px;
  
  .select-all {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #ccc;
    
    &:hover {
      color: #fff;
    }
  }
  
  .selection-count {
    color: #888;
    font-size: 13px;
  }
  
  .bulk-actions {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }
`;

const ParallelSettings = styled.div`
  position: relative;
  
  .settings-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #333;
    border: 1px solid #444;
    border-radius: 8px;
    color: #ccc;
    cursor: pointer;
    font-size: 13px;
    
    &:hover {
      background: #3a3a3a;
      color: #fff;
    }
  }
  
  .settings-panel {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 12px;
    padding: 20px;
    width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
    
    h4 {
      margin: 0 0 12px 0;
      color: #fff;
      font-size: 14px;
    }
    
    .setting-item {
      margin-bottom: 16px;
      
      label {
        display: block;
        margin-bottom: 6px;
        color: #ccc;
        font-size: 13px;
      }
      
      input[type="range"] {
        width: 100%;
        margin-bottom: 4px;
      }
      
      .setting-value {
        color: #888;
        font-size: 12px;
      }
    }
    
    .setting-description {
      color: #666;
      font-size: 11px;
      line-height: 1.4;
      margin-top: 4px;
    }
  }
`;

const ProcessingStatus = styled.div`
  background: #1a3a1a;
  border: 1px solid #2a5a2a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  
  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    
    h4 {
      margin: 0;
      color: #88ff88;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .pause-button {
      background: #333;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 6px 10px;
      color: #ccc;
      cursor: pointer;
      font-size: 12px;
      
      &:hover {
        background: #3a3a3a;
      }
    }
  }
  
  .parallel-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #88ff88;
    
    .progress-text {
      flex: 1;
    }
    
    .concurrent-indicator {
      display: flex;
      gap: 4px;
      
      .job-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #88ff88;
        animation: pulse 1.5s infinite;
      }
      
      .job-dot.waiting {
        background: #666;
        animation: none;
      }
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;



function UploadProcess() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessages, setProgressMessages] = useState({});
  
  // Bulk selection states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Parallel processing settings
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(3); // Default: 3 concurrent jobs
  const [activeJobs, setActiveJobs] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  
  // Processing queue management
  const [processingQueue, setProcessingQueue] = useState([]);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    // Load existing tracks from storage (including downloaded ones)
    const existingTracks = storage.getTracks();
    const tracksAsFiles = existingTracks.map(track => ({
      id: track.id,
      name: track.name,
      size: track.sizeFormatted || 'Unknown',
      status: track.status,
      progress: track.progress || 0,
      filePath: track.filePath,
      stemsPath: track.stemsPath,
      type: track.type || 'uploaded' // Include type (downloaded/uploaded)
    }));
    setFiles(tracksAsFiles);

    // Set up a listener for new downloads
    const handleStorageUpdate = () => {
      const updatedTracks = storage.getTracks();
      const updatedFiles = updatedTracks.map(track => ({
        id: track.id,
        name: track.name,
        size: track.sizeFormatted || 'Unknown',
        status: track.status,
        progress: track.progress || 0,
        filePath: track.filePath,
        stemsPath: track.stemsPath,
        type: track.type || 'uploaded'
      }));
      setFiles(updatedFiles);
    };

    // Set up progress listener
    fileManager.setupProgressListener((type, data) => {
      console.log(`Progress [${type}]:`, data); // Debug: log all progress messages
      setProgressMessages(prev => ({
        ...prev,
        [type]: data
      }));
    });

    // Also listen for processing updates
    const handleProcessingUpdate = (event, data) => {
      // Handle both custom events and IPC events
      let updateType, updateData;
      
      if (event.detail) {
        // Custom event format
        updateType = event.detail.type;
        updateData = event.detail.data;
      } else {
        // IPC event format
        updateType = data?.type || 'stem-processing';
        updateData = data?.data || data;
      }
      
      console.log(`Processing update [${updateType}]:`, updateData);
      setProgressMessages(prev => ({
        ...prev,
        [updateType]: updateData
      }));
    };

    // Listen for storage updates (when downloads are added)
    window.addEventListener('storage-updated', handleStorageUpdate);
    window.addEventListener('processing-update', handleProcessingUpdate);
    
    // Listen for IPC processing updates from main process
    if (ipcRenderer) {
      ipcRenderer.on('processing-update', handleProcessingUpdate);
    }

    return () => {
      fileManager.removeProgressListener();
      window.removeEventListener('storage-updated', handleStorageUpdate);
      window.removeEventListener('processing-update', handleProcessingUpdate);
      
      // Remove IPC listener
      if (ipcRenderer) {
        ipcRenderer.removeListener('processing-update', handleProcessingUpdate);
      }
    };
  }, []);

  // Watch for progress message changes and update file progress
  useEffect(() => {
    // Process all progress messages, not just 'stem-processing'
    Object.entries(progressMessages).forEach(([messageType, progressData]) => {
      if (progressData && typeof progressData === 'string') {
        console.log(`Processing progress message [${messageType}]:`, progressData); // Debug log
        
        // Look for file-specific progress patterns with better matching
        const fileNameMatch = progressData.match(/Processing:\s*(.+?)\s*-/) ||
                             progressData.match(/File:\s*(.+?)(?:\s|$)/) ||
                             progressData.match(/Working on:\s*(.+?)(?:\s|$)/) ||
                             progressData.match(/Starting.*processing for:\s*.*[/\\](.+?)$/);
        
        // Look for various progress patterns
        const percentageMatch = progressData.match(/(\d+)%/) || 
                              progressData.match(/PROGRESS:\s*(\d+)%/) ||
                              progressData.match(/Progress:\s*(\d+)%/) ||
                              progressData.match(/(\d+)\s*percent/i);
        
        if (percentageMatch) {
          const percentage = parseInt(percentageMatch[1]);
          console.log('Extracted percentage:', percentage); // Debug log
          
          // Try to match progress to specific file if filename is in message
          let targetFileName = null;
          if (fileNameMatch) {
            targetFileName = fileNameMatch[1].trim();
            // Clean up the filename
            targetFileName = targetFileName.split(/[/\\]/).pop(); // Get just filename
            targetFileName = targetFileName.replace(/\.[^/.]+$/, ''); // Remove extension
            console.log('Target filename extracted:', targetFileName);
          }
          
          setFiles(prevFiles => {
            const processingFiles = prevFiles.filter(f => f.status === 'processing');
            console.log('Processing files found:', processingFiles.length); // Debug log
            
            return prevFiles.map(file => {
              // Create a clean version of the file name for comparison
              const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
              
              // If we have a specific filename, only update that file
              if (targetFileName) {
                const isMatch = cleanFileName.includes(targetFileName) || 
                               targetFileName.includes(cleanFileName) ||
                               cleanFileName.toLowerCase() === targetFileName.toLowerCase();
                
                if (isMatch) {
                  console.log(`Updating specific file ${file.name} progress: ${file.progress}% → ${percentage}%`);
                  // Only update if progress is moving forward or it's a reasonable jump
                  const newProgress = Math.max(file.progress || 0, percentage);
                  storage.updateTrack(file.id, { progress: newProgress });
                  return { ...file, progress: newProgress };
                }
                return file;
              } 
              // Otherwise, update only if it makes sense
              else if (file.status === 'processing') {
                // Only update if progress is moving forward or starting from 0
                const currentProgress = file.progress || 0;
                if (percentage >= currentProgress || currentProgress === 0) {
                  console.log(`Updating file ${file.name} progress: ${currentProgress}% → ${percentage}%`);
                  storage.updateTrack(file.id, { progress: percentage });
                  return { ...file, progress: percentage };
                }
              }
              return file;
            });
          });
        } else {
          console.log(`No percentage match found in [${messageType}]:`, progressData);
        }
      }
    });
  }, [progressMessages]);

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => {
      const trackData = {
        name: file.name,
        filePath: file.path || file.name,
        size: file.size,
        sizeFormatted: fileManager.formatFileSize ? fileManager.formatFileSize(file.size) : ((file.size / (1024 * 1024)).toFixed(2) + ' MB'),
        status: 'pending',
        progress: 0,
        type: 'uploaded'
      };

      // Save to storage - this will trigger the storage update listener
      // which will reload all files, so we don't need to manually add to state
      storage.addTrack(trackData);
    });
    
    // Don't manually add to files state - let the storage update handler do it
    // to prevent duplicates
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.aac']
    },
    multiple: true
  });

  // Bulk selection functions
  const toggleFileSelection = (id) => {
    setSelectedFiles(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter(fileId => fileId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    const selectableFiles = files.filter(f => f.status === 'pending').map(f => f.id);
    if (selectAll) {
      setSelectedFiles([]);
      setSelectAll(false);
    } else {
      setSelectedFiles(selectableFiles);
      setSelectAll(true);
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
    setSelectedFiles(prev => prev.filter(fileId => fileId !== id));
    storage.removeTrack(id);

    // Do not delete the original file from disk
  };

  const removeSelectedFiles = () => {
    selectedFiles.forEach(id => removeFile(id));
    setSelectedFiles([]);
    setSelectAll(false);
  };

  // Process a single file (for parallel execution)
  const processSingleFile = async (file) => {
    const jobId = `job_${file.id}_${Date.now()}`;
    
    try {
      // Add to active jobs
      setActiveJobs(prev => new Set([...prev, jobId]));
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'processing', progress: 0, jobId }
          : f
      ));
      
      storage.updateTrack(file.id, { status: 'processing', progress: 0 });

      // Process stems using file manager
      const result = await fileManager.processStems(
        file.filePath, 
        fileManager.getDefaultPath('stems')
      );

      if (result.success) {
        console.log(`🎵 Starting audio analysis for ${file.name}...`);
        
        // Perform audio analysis on the processed stems
        let analysisData = {};
        try {
          // Create a temporary audio engine instance for analysis
          const audioEngineModule = await import('../utils/audioEngine');
          const AudioEngine = audioEngineModule.default || audioEngineModule;
          const tempAudioEngine = new AudioEngine();
          await tempAudioEngine.initialize();
          
          // Load and analyze the track
          const trackForAnalysis = {
            ...file,
            stemsPath: result.stems,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
            name: file.name
          };
          
          const analyzedTrack = await tempAudioEngine.loadTrack(trackForAnalysis);
          
          analysisData = {
            bpm: analyzedTrack.bmp || analyzedTrack.bpm || 120,
            key: analyzedTrack.key || { name: 'C Major', camelot: '8B' },
            duration: analyzedTrack.duration || 0,
            beatGrid: analyzedTrack.beatGrid || [],
            waveform: analyzedTrack.waveform || []
          };
          
          console.log(`🎵 Analysis complete for ${file.name}: ${analysisData.bpm} BPM, ${analysisData.key.name}`);
          
        } catch (error) {
          console.warn('Audio analysis failed, using defaults:', error);
          analysisData = {
            bpm: 120,
            key: { name: 'C Major', camelot: '8B' },
            duration: 180
          };
        }
        
        // Update with completed status and analysis data
        const updatedFile = {
          status: 'completed',
          progress: 100,
          stemsPath: result.stems,
          processedAt: Date.now(),
          jobId: null,
          // Add analysis data
          ...analysisData,
          title: file.name.replace(/\.[^/.]+$/, ''), // Clean title
          artist: 'Unknown Artist' // Default artist
        };

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, ...updatedFile }
            : f
        ));

        storage.updateTrack(file.id, updatedFile);

        // Add to processing history
        storage.addProcessingRecord({
          type: 'processing',
          title: `✅ Processed ${file.name}`,
          status: 'completed',
          filePath: file.filePath,
          stemsPath: result.stems
        });

      } else {
        // Handle error
        const errorUpdate = {
          status: 'error',
          progress: 0,
          error: result.error,
          jobId: null
        };

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, ...errorUpdate }
            : f
        ));

        storage.updateTrack(file.id, errorUpdate);

        storage.addProcessingRecord({
          type: 'processing',
          title: `❌ Failed to process ${file.name}`,
          status: 'failed',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Processing error:', error);
      
      const errorUpdate = {
        status: 'error',
        progress: 0,
        error: error.message,
        jobId: null
      };

      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, ...errorUpdate }
          : f
      ));

      storage.updateTrack(file.id, errorUpdate);
    } finally {
      // Remove from active jobs
      setActiveJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
      
      // Update completed count
      setCompletedJobs(prev => prev + 1);
    }
  };

  // Parallel processing with controlled concurrency
  const processFilesInParallel = async (filesToProcess) => {
    setIsProcessing(true);
    setCompletedJobs(0);
    setTotalJobs(filesToProcess.length);
    setProcessingQueue(filesToProcess);
    
    console.log(`🚀 Starting parallel processing of ${filesToProcess.length} files with max ${maxConcurrentJobs} concurrent jobs`);
    
    const processingPromises = [];
    let processedCount = 0;
    
    // Create a semaphore to limit concurrent jobs
    const semaphore = {
      count: maxConcurrentJobs,
      waitingQueue: [],
      
      async acquire() {
        return new Promise(resolve => {
          if (this.count > 0) {
            this.count--;
            resolve();
          } else {
            this.waitingQueue.push(resolve);
          }
        });
      },
      
      release() {
        this.count++;
        if (this.waitingQueue.length > 0) {
          const resolve = this.waitingQueue.shift();
          this.count--;
          resolve();
        }
      }
    };
    
    // Process files with controlled concurrency
    for (const file of filesToProcess) {
      const processFileWithSemaphore = async () => {
        await semaphore.acquire();
        try {
          await processSingleFile(file);
          processedCount++;
          console.log(`✅ Completed ${processedCount}/${filesToProcess.length}: ${file.name}`);
        } finally {
          semaphore.release();
        }
      };
      
      processingPromises.push(processFileWithSemaphore());
    }
    
    // Wait for all files to complete
    await Promise.all(processingPromises);
    
    setIsProcessing(false);
    setActiveJobs(new Set());
    setProcessingQueue([]);
    
    console.log(`🎉 Parallel processing complete! Processed ${filesToProcess.length} files.`);
  };

  // Process all pending files
  const processAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    await processFilesInParallel(pendingFiles);
  };

  // Process only selected files
  const processSelectedFiles = async () => {
    const filesToProcess = files.filter(f => 
      selectedFiles.includes(f.id) && f.status === 'pending'
    );
    
    if (filesToProcess.length === 0) return;
    
    await processFilesInParallel(filesToProcess);
    
    // Clear selection after processing
    setSelectedFiles([]);
    setSelectAll(false);
  };



  const handlePreviewFile = (file) => {
    if (file.stemsPath) {
      // Open file location to show processed stems
      fileManager.openFileLocation(file.stemsPath.vocals || Object.values(file.stemsPath)[0]);
    } else if (file.filePath) {
      // Open original file location
      fileManager.openFileLocation(file.filePath);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="status-icon" />;
      case 'processing': return <Upload size={16} className="status-icon" />;
      case 'completed': return <CheckCircle size={16} className="status-icon" />;
      case 'error': return <AlertCircle size={16} className="status-icon" />;
      default: return <File size={16} className="status-icon" />;
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <UploadContainer>
      <Header>
        <h1>Upload & Process</h1>
        <p>Upload your music files and process them into stems for AI mixing</p>
      </Header>

      <UploadSection>
        <DropZone {...getRootProps()} $isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <Upload size={48} />
          <h3>Drop your music files here</h3>
          <p>or click anywhere to browse your computer</p>
          <div className="supported-formats">
            Supported formats: MP3, WAV, FLAC, M4A, AAC
          </div>
        </DropZone>

        <ActionButtons>
          {files.length > 0 && (
            <>
              <button 
                className="btn-primary" 
                onClick={processAllFiles}
                disabled={isProcessing || pendingFiles === 0}
                title={`Process all ${pendingFiles} pending files in parallel (max ${maxConcurrentJobs} concurrent)`}
              >
                <Zap size={16} style={{ marginRight: '8px' }} />
                {isProcessing ? `Processing ${activeJobs.size}/${totalJobs}...` : `⚡ Process All (${pendingFiles})`}
              </button>
              {selectedFiles.length > 0 && (
                <button 
                  className="btn-secondary" 
                  onClick={processSelectedFiles}
                  disabled={isProcessing}
                  title={`Process ${selectedFiles.length} selected files in parallel`}
                >
                  <Play size={16} style={{ marginRight: '8px' }} />
                  Process Selected ({selectedFiles.length})
                </button>
              )}
              <button 
                className="btn-secondary"
                onClick={() => {
                  setFiles([]);
                  setSelectedFiles([]);
                  setSelectAll(false);
                }}
                disabled={isProcessing}
              >
                Clear All
              </button>
              <ParallelSettings>
                <div 
                  className="settings-button"
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configure parallel processing settings"
                >
                  <Settings size={14} />
                  Parallel Settings
                </div>
                {showSettings && (
                  <div className="settings-panel">
                    <h4>⚡ Parallel Processing</h4>
                    <div className="setting-item">
                      <label>Concurrent Jobs: {maxConcurrentJobs}</label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={maxConcurrentJobs}
                        onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value))}
                      />
                      <div className="setting-value">
                        {maxConcurrentJobs} job{maxConcurrentJobs !== 1 ? 's' : ''} at once
                      </div>
                      <div className="setting-description">
                        Higher values = faster processing but more system resource usage.
                        Recommended: 2-4 for most systems.
                      </div>
                    </div>
                  </div>
                )}
              </ParallelSettings>
              <span className="file-count">
                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
              </span>
            </>
          )}
        </ActionButtons>
      </UploadSection>

      {/* Bulk Controls */}
      {files.length > 0 && (
        <BulkControls>
          <div 
            className="select-all" 
            onClick={toggleSelectAll}
            title="Select or deselect all pending files"
          >
            {selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
            Select All Pending
          </div>
          <div className="selection-count">
            {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : `${files.filter(f => f.status === 'pending').length} files available`}
          </div>
          <div className="bulk-actions">
            {selectedFiles.length > 0 && (
              <button 
                className="btn-secondary"
                onClick={removeSelectedFiles}
                disabled={isProcessing}
                title="Remove selected files"
              >
                <Trash2 size={14} style={{ marginRight: '6px' }} />
                Remove Selected
              </button>
            )}
          </div>
        </BulkControls>
      )}

      {/* Parallel Processing Status */}
      {isProcessing && (
        <ProcessingStatus>
          <div className="status-header">
            <h4>
              <Zap size={16} />
              Parallel Processing Active
            </h4>
            <button 
              className="pause-button"
              onClick={() => {
                // Note: This would require implementing pause/resume functionality
                console.log('Pause/Resume would be implemented here');
              }}
              title="Pause/Resume processing (coming soon)"
            >
              <Pause size={12} />
              Pause
            </button>
          </div>
          <div className="parallel-progress">
            <div className="progress-text">
              {completedJobs}/{totalJobs} completed • {activeJobs.size} running • {totalJobs - completedJobs - activeJobs.size} queued
            </div>
            <div className="concurrent-indicator">
              {Array.from({length: maxConcurrentJobs}, (_, i) => (
                <div 
                  key={i} 
                  className={`job-dot ${i < activeJobs.size ? '' : 'waiting'}`}
                  title={i < activeJobs.size ? 'Active job' : 'Waiting slot'}
                />
              ))}
            </div>
          </div>
        </ProcessingStatus>
      )}

      {files.length > 0 && (
        <ProcessingStats>
          <StatCard>
            <div className="stat-number">{pendingFiles}</div>
            <div className="stat-label">Pending</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{processingFiles}</div>
            <div className="stat-label">Processing</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{completedFiles}</div>
            <div className="stat-label">Completed</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{errorFiles}</div>
            <div className="stat-label">Errors</div>
          </StatCard>
        </ProcessingStats>
      )}

      {files.length > 0 && (
        <FileList>
          <h3>
            <File size={20} />
            File Processing Queue
          </h3>
          {files.map(file => (
            <FileItem 
              key={file.id}
              className={selectedFiles.includes(file.id) ? 'selected' : ''}
            >
              {/* Bulk selection checkbox */}
              {file.status === 'pending' && (
                <div className="file-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    title="Select for bulk processing"
                  />
                </div>
              )}
              
              <File size={20} className="file-icon" />
              <div className="file-details">
                <h4>{file.name}</h4>
                <p>
                  {file.size}
                  {file.jobId && (
                    <span style={{ color: '#007bff', marginLeft: '8px' }}>
                      • Job {file.jobId.split('_')[2]}
                    </span>
                  )}
                </p>
                {(file.status === 'processing' || file.status === 'completed') && (
                  <ProgressBar $progress={file.progress}>
                    <div className="progress-fill" />
                  </ProgressBar>
                )}
              </div>
              <div className={`file-status ${file.status}`}>
                {getStatusIcon(file.status)}
                <span className="status-text">
                  {file.status === 'pending' && 'Queued'}
                  {file.status === 'processing' && `${file.progress}%`}
                  {file.status === 'completed' && '✅ Ready'}
                  {file.status === 'error' && '❌ Failed'}
                </span>
              </div>
              <div className="file-actions">
                {file.status === 'completed' && (
                  <button 
                    className="action-btn" 
                    title="Open stems folder"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <FolderOpen size={14} />
                  </button>
                )}
                <button 
                  className="action-btn" 
                  onClick={() => removeFile(file.id)}
                  title="Remove file"
                  disabled={file.status === 'processing'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </FileItem>
          ))}
        </FileList>
      )}
      
      {/* Progress Messages Display */}
      {(Object.keys(progressMessages).length > 0 || files.some(f => f.status === 'processing')) && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', 
          border: '1px solid #444',
          borderRadius: '12px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ccc',
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <h4 style={{ 
            margin: '0 0 15px 0', 
            color: '#00ff88',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔄 Live Processing Output:
          </h4>
          {Object.keys(progressMessages).length > 0 ? (
            Object.entries(progressMessages).map(([type, message]) => (
              <div key={type} style={{ 
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(0, 255, 136, 0.1)',
                borderRadius: '6px',
                borderLeft: '3px solid #00ff88'
              }}>
                <strong style={{ color: '#00ff88' }}>[{type}]:</strong> 
                <span style={{ marginLeft: '8px' }}>{message}</span>
              </div>
            ))
          ) : (
            <div style={{ 
              color: '#888',
              fontStyle: 'italic',
              padding: '10px',
              textAlign: 'center'
            }}>
              Processing started... Console output will appear here.
            </div>
          )}
        </div>
      )}
    </UploadContainer>
  );
}

export default UploadProcess; 