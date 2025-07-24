import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Download, Link, CheckCircle, AlertCircle, Clock, Play, Youtube, Music, FolderOpen } from 'lucide-react';
import storage from '../utils/storage';
import fileManager from '../utils/fileManager';
import FFmpegInstallGuide from './FFmpegInstallGuide';

const DownloaderContainer = styled.div`
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

const DownloadSection = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
`;

const URLInput = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  
  input {
    flex: 1;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 14px 16px;
    color: #fff;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #666;
    }
    
    &::placeholder {
      color: #666;
    }
  }
  
  button {
    padding: 14px 20px;
    white-space: nowrap;
  }
`;

const SupportedPlatforms = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .platform {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    color: #888;
    font-size: 14px;
    
    svg {
      margin-right: 8px;
    }
  }
`;

const DownloadOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  
  .option-group {
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #ccc;
    }
    
    select {
      width: 100%;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      color: #fff;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #666;
      }
    }
  }
`;

const OutputSettings = styled.div`
  border-top: 1px solid #333;
  padding-top: 20px;
  
  .output-path {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
    
    input {
      flex: 1;
    }
    
    button {
      padding: 12px 16px;
    }
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    
    label {
      display: flex;
      align-items: center;
      color: #ccc;
      font-size: 14px;
      cursor: pointer;
      
      input[type="checkbox"] {
        margin-right: 8px;
        accent-color: #666;
      }
    }
  }
`;

const DownloadQueue = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  
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

const QueueItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
  
  .thumbnail {
    width: 60px;
    height: 60px;
    background: #333;
    border-radius: 8px;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      color: #666;
    }
  }
  
  .download-details {
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
      margin-bottom: 2px;
    }
    
    .progress-bar {
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
    }
  }
  
  .download-status {
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
    &.downloading .status-text { color: #ffa500; }
    &.completed .status-text { color: #4caf50; }
    &.error .status-text { color: #f44336; }
  }
  
  .download-actions {
    display: flex;
    gap: 8px;
    
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
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

function MusicDownloader() {
  const [url, setUrl] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [quality, setQuality] = useState('320');
  const [format, setFormat] = useState('mp3');
  const [downloads, setDownloads] = useState([]);
  const [autoProcess, setAutoProcess] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFFmpegGuide, setShowFFmpegGuide] = useState(false);

  useEffect(() => {
    // Load settings and downloads from storage
    const settings = storage.getSettings();
    if (settings) {
      setOutputPath(settings.downloadPath || fileManager.getDefaultPath('downloads'));
      setQuality(settings.defaultQuality || '320');
      setFormat(settings.defaultFormat || 'mp3');
      setAutoProcess(settings.autoProcess !== undefined ? settings.autoProcess : true);
    } else {
      setOutputPath(fileManager.getDefaultPath('downloads'));
    }

    // Load existing downloads
    const existingDownloads = storage.getDownloads();
    setDownloads(existingDownloads);

    // Set up progress listener
    fileManager.setupProgressListener((type, data) => {
      if (type === 'download') {
        // Update download progress in real-time
        console.log('Download progress:', data);
      }
    });

    return () => {
      fileManager.removeProgressListener();
    };
  }, []);

  const addDownload = async () => {
    if (!url.trim()) return;
    
    setIsDownloading(true);
    
    const downloadData = {
      url,
      title: 'Fetching info...',
      artist: 'Unknown',
      duration: '0:00',
      progress: 0,
      platform: url.includes('youtube') ? 'youtube' : 'soundcloud',
      quality,
      format,
      outputPath
    };
    
    const savedDownload = storage.addDownload(downloadData);
    setDownloads(prev => [...prev, savedDownload]);
    setUrl('');
    
    try {
      // Use real file manager to download
      const result = await fileManager.downloadAudio(savedDownload.url, outputPath);
      
      if (result.success) {
        const completedDownload = {
          ...savedDownload,
          status: 'completed',
          progress: 100,
          title: result.video_info?.title || 'Downloaded Track',
          artist: result.video_info?.artist || 'Unknown Artist',
          duration: result.video_info?.duration_string || '0:00',
          filePath: result.output_file,
          completedAt: Date.now()
        };

        setDownloads(prev => prev.map(d => 
          d.id === savedDownload.id ? completedDownload : d
        ));

        storage.updateDownload(savedDownload.id, completedDownload);

        // Add to processing history
        storage.addProcessingRecord({
          type: 'download',
          title: `Downloaded ${completedDownload.title}`,
          status: 'completed',
          filePath: result.output_file
        });

        // Auto-process if enabled
        if (autoProcess && result.output_file) {
          console.log('Auto-processing enabled, starting stem processing...');
          await processDownloadedFile(completedDownload, result.output_file);
        }

      } else {
        // Handle download error - but first check if a file was actually created
        console.log('Download reported failure, but checking for actual files...');
        
        // Check if any files were created recently in the download directory
        const possibleFiles = await fileManager.findRecentDownloads(outputPath, savedDownload.url);
        
        if (possibleFiles && possibleFiles.length > 0) {
          // A file was found! Treat as successful
          const foundFile = possibleFiles[0];
          console.log('Found downloaded file despite error:', foundFile);
          
          const completedDownload = {
            ...savedDownload,
            status: 'completed',
            progress: 100,
            title: savedDownload.title || 'Downloaded Track',
            artist: 'Downloaded',
            duration: '0:00',
            filePath: foundFile,
            completedAt: Date.now()
          };

          setDownloads(prev => prev.map(d => 
            d.id === savedDownload.id ? completedDownload : d
          ));

          storage.updateDownload(savedDownload.id, completedDownload);

          // Auto-process if enabled
          if (autoProcess) {
            console.log('Auto-processing enabled, starting stem processing...');
            await processDownloadedFile(completedDownload, foundFile);
          }
        } else {
          // Actual failure
          console.log('Download failed:', result.error);
          const errorDownload = {
            ...savedDownload,
            status: 'error',
            progress: 0,
            error: result.error
          };

          setDownloads(prev => prev.map(d => 
            d.id === savedDownload.id ? errorDownload : d
          ));

          storage.updateDownload(savedDownload.id, errorDownload);

          storage.addProcessingRecord({
            type: 'download',
            title: `Failed to download from ${savedDownload.url}`,
            status: 'failed',
            error: result.error
          });

          // Show FFmpeg guide if it's an FFmpeg-related error
          if (result.error && result.error.toLowerCase().includes('ffmpeg')) {
            setShowFFmpegGuide(true);
          }
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      
      const errorDownload = {
        ...savedDownload,
        status: 'error',
        progress: 0,
        error: error.message
      };

      setDownloads(prev => prev.map(d => 
        d.id === savedDownload.id ? errorDownload : d
      ));

      storage.updateDownload(savedDownload.id, errorDownload);

      // Show FFmpeg guide if it's an FFmpeg-related error
      if (error.message && error.message.toLowerCase().includes('ffmpeg')) {
        setShowFFmpegGuide(true);
      }
    }
    
    setIsDownloading(false);
  };

  const processDownloadedFile = async (download, filePath) => {
    try {
      console.log('Starting auto-processing for:', download.title, 'at:', filePath);
      
      // Check if the downloaded file actually exists
      const fileExists = await fileManager.checkFileExists(filePath);
      if (!fileExists) {
        console.error('Downloaded file not found at:', filePath);
        setDownloads(prev => prev.map(d => 
          d.id === download.id 
            ? { ...d, status: 'error', processingMessage: `File not found: ${filePath}` }
            : d
        ));
        return;
      }
      
      // Add as a track for processing
      const trackData = {
        name: download.title,
        filePath: filePath,
        size: 0, // Will be calculated by file manager
        sizeFormatted: 'Processing...',
        status: 'pending',
        progress: 0,
        type: 'downloaded',
        downloadId: download.id
      };

      const savedTrack = storage.addTrack(trackData);
      console.log('Added track to storage for processing:', savedTrack.id);

      // Update the download to show processing status
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { ...d, status: 'auto-processing', processingMessage: 'Processing stems... This may take several minutes.' }
          : d
      ));

      // Process stems
      console.log('Starting stem processing...');
      const result = await fileManager.processStems(
        filePath, 
        fileManager.getDefaultPath('stems')
      );

      if (result.success) {
        storage.updateTrack(savedTrack.id, {
          status: 'completed',
          progress: 100,
          stemsPath: result.stems,
          processedAt: Date.now()
        });

        storage.addProcessingRecord({
          type: 'processing',
          title: `Auto-processed ${download.title}`,
          status: 'completed',
          filePath: filePath,
          stemsPath: result.stems
        });

        // Update download status to show completion
        setDownloads(prev => prev.map(d => 
          d.id === download.id 
            ? { ...d, status: 'completed', processingMessage: 'Stems processed successfully!' }
            : d
        ));

      } else {
        storage.updateTrack(savedTrack.id, {
          status: 'error',
          error: result.error
        });

        // Update download to show error
        setDownloads(prev => prev.map(d => 
          d.id === download.id 
            ? { ...d, status: 'error', processingMessage: `Processing failed: ${result.error}` }
            : d
        ));
      }

    } catch (error) {
      console.error('Auto-processing error:', error);
      
      // Update download to show error
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { ...d, status: 'error', processingMessage: `Processing failed: ${error.message}` }
          : d
      ));
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selectedFolder = await fileManager.selectFolder();
      if (selectedFolder) {
        setOutputPath(selectedFolder);
        storage.updateSetting('downloadPath', selectedFolder);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleOpenFile = (download) => {
    if (download.filePath) {
      fileManager.openFileLocation(download.filePath);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="status-icon" />;
      case 'downloading': return <Download size={16} className="status-icon" />;
      case 'completed': return <CheckCircle size={16} className="status-icon" />;
      case 'error': return <AlertCircle size={16} className="status-icon" />;
      default: return null;
    }
  };

  const pendingDownloads = downloads.filter(d => d.status === 'pending').length;
  const activeDownloads = downloads.filter(d => d.status === 'downloading').length;
  const completedDownloads = downloads.filter(d => d.status === 'completed').length;
  const errorDownloads = downloads.filter(d => d.status === 'error').length;

  return (
    <DownloaderContainer>
      <Header>
        <h1>Music Downloader</h1>
        <p>Download music from YouTube and SoundCloud</p>
      </Header>

      {showFFmpegGuide && (
        <FFmpegInstallGuide onClose={() => setShowFFmpegGuide(false)} />
      )}

      {downloads.length > 0 && (
        <StatsGrid>
          <StatCard>
            <div className="stat-number">{pendingDownloads}</div>
            <div className="stat-label">Queued</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{activeDownloads}</div>
            <div className="stat-label">Downloading</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{completedDownloads}</div>
            <div className="stat-label">Completed</div>
          </StatCard>
          <StatCard>
            <div className="stat-number">{errorDownloads}</div>
            <div className="stat-label">Failed</div>
          </StatCard>
        </StatsGrid>
      )}

      <DownloadSection>
        <URLInput>
          <input
            type="text"
            placeholder="Paste YouTube or SoundCloud URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDownload()}
          />
          <button 
            className="btn-primary" 
            onClick={addDownload} 
            disabled={!url.trim() || isDownloading}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            {isDownloading ? 'Processing...' : 'Add Download'}
          </button>
        </URLInput>

        <SupportedPlatforms>
          <div className="platform">
            <Youtube size={16} />
            YouTube
          </div>
          <div className="platform">
            <Music size={16} />
            SoundCloud
          </div>
        </SupportedPlatforms>

        <DownloadOptions>
          <div className="option-group">
            <h4>Audio Quality</h4>
            <select value={quality} onChange={(e) => {
              setQuality(e.target.value);
              storage.updateSetting('defaultQuality', e.target.value);
            }}>
              <option value="128">128 kbps</option>
              <option value="192">192 kbps</option>
              <option value="256">256 kbps</option>
              <option value="320">320 kbps</option>
            </select>
          </div>
          <div className="option-group">
            <h4>Format</h4>
            <select value={format} onChange={(e) => {
              setFormat(e.target.value);
              storage.updateSetting('defaultFormat', e.target.value);
            }}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="flac">FLAC</option>
              <option value="m4a">M4A</option>
            </select>
          </div>
        </DownloadOptions>

        <OutputSettings>
          <div className="output-path">
            <input
              type="text"
              placeholder="Download folder path"
              value={outputPath}
              onChange={(e) => {
                setOutputPath(e.target.value);
                storage.updateSetting('downloadPath', e.target.value);
              }}
            />
            <button className="btn-secondary" onClick={handleSelectFolder}>
              <FolderOpen size={16} />
            </button>
          </div>
          
          <div className="settings-grid">
            <label>
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => {
                  setAutoProcess(e.target.checked);
                  storage.updateSetting('autoProcess', e.target.checked);
                }}
              />
              Auto-process stems after download
            </label>
          </div>
        </OutputSettings>
      </DownloadSection>

      {downloads.length > 0 && (
        <DownloadQueue>
          <h3>
            <Download size={20} />
            Download Queue
          </h3>
          {downloads.map(download => (
            <QueueItem key={download.id} $progress={download.progress}>
              <div className="thumbnail">
                {download.platform === 'youtube' ? <Youtube size={24} /> : <Music size={24} />}
              </div>
              <div className="download-details">
                <h4>{download.title}</h4>
                <p>{download.artist} • {download.duration} • {quality} kbps {format.toUpperCase()}</p>
                <p style={{ fontSize: '11px', color: '#666' }}>
                  {download.url.length > 60 ? download.url.substring(0, 60) + '...' : download.url}
                </p>
                {(download.status === 'downloading' || download.status === 'completed') && (
                  <div className="progress-bar">
                    <div className="progress-fill" />
                  </div>
                )}
              </div>
              <div className={`download-status ${download.status}`}>
                {getStatusIcon(download.status)}
                <span className="status-text">
                  {download.status === 'pending' && 'Queued'}
                  {download.status === 'downloading' && `${download.progress}%`}
                  {download.status === 'auto-processing' && 'Processing...'}
                  {download.status === 'completed' && 'Done'}
                  {download.status === 'error' && 'Failed'}
                </span>
                {download.processingMessage && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#888', 
                    marginTop: '2px',
                    fontStyle: 'italic',
                    wordWrap: 'break-word'
                  }}>
                    {download.processingMessage}
                  </div>
                )}
              </div>
              <div className="download-actions">
                {download.status === 'completed' && (
                  <button 
                    className="action-btn" 
                    title="Open File Location"
                    onClick={() => handleOpenFile(download)}
                  >
                    <FolderOpen size={14} />
                  </button>
                )}
              </div>
            </QueueItem>
          ))}
        </DownloadQueue>
      )}
    </DownloaderContainer>
  );
}

export default MusicDownloader; 