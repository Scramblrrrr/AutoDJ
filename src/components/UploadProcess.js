import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, Clock, AlertCircle, Play, Trash2, FolderOpen } from 'lucide-react';
import storage from '../utils/storage';
import fileManager from '../utils/fileManager';

const UploadContainer = styled.div`
  padding: 30px;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
`;

const Header = styled.div`
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #888, #ccc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #aaa;
    font-size: 16px;
  }
`;

const UploadSection = styled.div`
  margin-bottom: 30px;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? '#666' : '#444'};
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isDragActive ? '#2a2a2a' : '#252525'};
  margin-bottom: 20px;
  
  &:hover {
    border-color: #555;
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
  padding: 16px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
  
  .file-icon {
    margin-right: 16px;
    color: #666;
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
      color: #888;
    }
  }
  
  .file-status {
    display: flex;
    align-items: center;
    margin-right: 16px;
    
    .status-icon {
      margin-right: 8px;
    }
    
    .status-text {
      font-size: 12px;
      font-weight: 500;
    }
    
    &.pending .status-text { color: #888; }
    &.processing .status-text { color: #ffa500; }
    &.completed .status-text { color: #4caf50; }
    &.error .status-text { color: #f44336; }
  }
  
  .file-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    background: #3a3a3a;
    border: 1px solid #555;
    border-radius: 6px;
    padding: 6px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #4a4a4a;
      color: #aaa;
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

function UploadProcess() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessages, setProgressMessages] = useState({});

  useEffect(() => {
    // Load existing tracks from storage
    const existingTracks = storage.getTracks();
    const tracksAsFiles = existingTracks.map(track => ({
      id: track.id,
      name: track.name,
      size: track.sizeFormatted || 'Unknown',
      status: track.status,
      progress: track.progress || 0,
      filePath: track.filePath,
      stemsPath: track.stemsPath
    }));
    setFiles(tracksAsFiles);

    // Set up progress listener
    fileManager.setupProgressListener((type, data) => {
      console.log(`Progress [${type}]:`, data); // Debug: log all progress messages
      setProgressMessages(prev => ({
        ...prev,
        [type]: data
      }));
    });

    return () => {
      fileManager.removeProgressListener();
    };
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => {
      const fileInfo = fileManager.getFileInfo(file.path || file.name);
      const trackData = {
        name: file.name,
        filePath: file.path || file.name,
        size: file.size,
        sizeFormatted: fileManager.formatFileSize ? fileManager.formatFileSize(file.size) : ((file.size / (1024 * 1024)).toFixed(2) + ' MB'),
        status: 'pending',
        progress: 0,
        type: 'uploaded'
      };

      // Save to storage
      const savedTrack = storage.addTrack(trackData);
      
      return {
        id: savedTrack.id,
        file,
        name: savedTrack.name,
        size: savedTrack.sizeFormatted,
        status: savedTrack.status,
        progress: savedTrack.progress,
        filePath: savedTrack.filePath
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.aac']
    },
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
    storage.removeTrack(id);

    // Also remove from file system if exists
    const file = files.find(f => f.id === id);
    if (file && file.filePath) {
      fileManager.deleteFile(file.filePath);
    }
  };

  const processAllFiles = async () => {
    setIsProcessing(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      
      try {
        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', progress: 0 }
            : f
        ));
        
        storage.updateTrack(file.id, { status: 'processing', progress: 0 });

        // Process stems using file manager
        const result = await fileManager.processStems(
          file.filePath, 
          fileManager.getDefaultPath('stems')
        );

        if (result.success) {
          // Update with completed status
          const updatedFile = {
            status: 'completed',
            progress: 100,
            stemsPath: result.stems,
            processedAt: Date.now()
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
            title: `Processed ${file.name}`,
            status: 'completed',
            filePath: file.filePath,
            stemsPath: result.stems
          });

        } else {
          // Handle error
          const errorUpdate = {
            status: 'error',
            progress: 0,
            error: result.error
          };

          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, ...errorUpdate }
              : f
          ));

          storage.updateTrack(file.id, errorUpdate);

          storage.addProcessingRecord({
            type: 'processing',
            title: `Failed to process ${file.name}`,
            status: 'failed',
            error: result.error
          });
        }

      } catch (error) {
        console.error('Processing error:', error);
        
        const errorUpdate = {
          status: 'error',
          progress: 0,
          error: error.message
        };

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, ...errorUpdate }
            : f
        ));

        storage.updateTrack(file.id, errorUpdate);
      }
    }
    
    setIsProcessing(false);
  };

  const handleBrowseClick = async () => {
    try {
      const selectedFiles = await fileManager.selectFiles();
      if (selectedFiles && selectedFiles.length > 0) {
        // Convert file paths to file objects for processing
        const fileObjects = selectedFiles.map(filePath => {
          const fileInfo = fileManager.getFileInfo(filePath);
          return {
            name: fileInfo.name,
            path: filePath,
            size: fileInfo.size
          };
        });
        
        onDrop(fileObjects);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
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
          <p>or click to browse your computer</p>
                      <button className="btn-primary" onClick={handleBrowseClick}>
              <FolderOpen size={16} style={{ marginRight: '8px' }} />
              Browse Files
            </button>
          <div className="supported-formats">
            Supported formats: MP3, WAV, FLAC, M4A, AAC
          </div>
        </DropZone>

        <ActionButtons>
          <button 
            className="btn-secondary" 
            onClick={async () => {
              try {
                console.log('Testing Python execution...');
                const { ipcRenderer } = window.require('electron');
                
                // Set up progress listener to see output
                ipcRenderer.on('stem-progress', (event, data) => {
                  console.log('Python test output:', data);
                });
                
                await ipcRenderer.invoke('test-python');
                console.log('Python test completed successfully');
                
                // Clean up listener
                setTimeout(() => {
                  ipcRenderer.removeAllListeners('stem-progress');
                }, 1000);
              } catch (error) {
                console.error('Python test failed:', error);
              }
            }}
          >
            🐍 Test Python
          </button>
          {files.length > 0 && (
            <>
              <button 
                className="btn-primary" 
                onClick={processAllFiles}
                disabled={isProcessing || pendingFiles === 0}
              >
                <Upload size={16} style={{ marginRight: '8px' }} />
                {isProcessing ? 'Processing...' : `Process ${pendingFiles} Files`}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                Clear All
              </button>
              <span className="file-count">
                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
              </span>
            </>
          )}
        </ActionButtons>
      </UploadSection>

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
            <FileItem key={file.id}>
              <File size={20} className="file-icon" />
              <div className="file-details">
                <h4>{file.name}</h4>
                <p>{file.size}</p>
                {(file.status === 'processing' || file.status === 'completed') && (
                  <ProgressBar $progress={file.progress}>
                    <div className="progress-fill" />
                  </ProgressBar>
                )}
              </div>
              <div className={`file-status ${file.status}`}>
                {getStatusIcon(file.status)}
                <span className="status-text">
                  {file.status === 'pending' && 'Waiting'}
                  {file.status === 'processing' && `${file.progress}%`}
                  {file.status === 'completed' && 'Ready'}
                  {file.status === 'error' && 'Failed'}
                </span>
              </div>
              <div className="file-actions">
                {file.status === 'completed' && (
                  <button 
                    className="action-btn" 
                    title="Open File Location"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <FolderOpen size={14} />
                  </button>
                )}
                <button 
                  className="action-btn" 
                  onClick={() => removeFile(file.id)}
                  title="Remove"
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
      {Object.keys(progressMessages).length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#1a1a1a', 
          border: '1px solid #333',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#ccc',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#888' }}>Processing Output:</h4>
          {Object.entries(progressMessages).map(([type, message]) => (
            <div key={type} style={{ marginBottom: '5px' }}>
              <strong style={{ color: '#66d9ef' }}>[{type}]:</strong> {message}
            </div>
          ))}
        </div>
      )}
    </UploadContainer>
  );
}

export default UploadProcess; 