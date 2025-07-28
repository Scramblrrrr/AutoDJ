import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Download, Link, CheckCircle, AlertCircle, Clock, Play, Youtube, Music, FolderOpen, X, ExternalLink } from 'lucide-react';
import storage from '../utils/storage';
import fileManager from '../utils/fileManager';
import FFmpegInstallGuide from './FFmpegInstallGuide';

const DownloaderContainer = styled.div`
  padding: 30px;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #000000 0%, #3d3d3d 100%);
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

const DownloadSection = styled.div`
  background: rgba(69, 69, 69, 0.3);
  border: 1px solid rgba(255, 35, 35, 0.2);
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
    background: rgba(109, 109, 109, 0.3);
    border: 1px solid rgba(255, 35, 35, 0.3);
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  
  h3 {
    color: #ff6b6b;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #333;
    color: #fff;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 16px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
`;

const ExampleSection = styled.div`
  margin-top: 20px;
  
  h4 {
    color: #fff;
    font-size: 16px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ExampleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ExampleItem = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #555;
    background: #222;
  }
  
  .platform {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #888;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  
  .url {
    color: #4a9eff;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    word-break: break-all;
    cursor: pointer;
    
    &:hover {
      color: #66b3ff;
      text-decoration: underline;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  
  &.primary {
    background: #4a9eff;
    color: white;
    
    &:hover {
      background: #3a8eef;
    }
  }
  
  &.secondary {
    background: #333;
    color: #ccc;
    
    &:hover {
      background: #444;
      color: #fff;
    }
  }
`;

function MusicDownloader() {
  const [url, setUrl] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [quality, setQuality] = useState('320');
  const [format, setFormat] = useState('wav');
  const [downloads, setDownloads] = useState([]);
  const [showFFmpegGuide, setShowFFmpegGuide] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  useEffect(() => {
    // Initialize paths and load settings
    const initializePaths = async () => {
      // Wait for fileManager to initialize its paths
      await fileManager.initializePaths();
      
      // Load settings and downloads from storage
      const settings = storage.getSettings();
      if (settings) {
        // Always use the proper downloads path from fileManager
        setOutputPath(fileManager.getDefaultPath('downloads'));
        setQuality(settings.defaultQuality || '320');
        setFormat(settings.defaultFormat || 'wav');
      } else {
        setOutputPath(fileManager.getDefaultPath('downloads'));
      }
    };

    initializePaths();

    // Load existing downloads
    const existingDownloads = storage.getDownloads();
    setDownloads(existingDownloads);

    // Set up progress listener
    fileManager.setupProgressListener((type, data) => {
      if (type === 'download' && data && typeof data === 'object') {
        const { id, message } = data;
        if (!id || !message) return;

        const percentMatch = message.match(/(\d+(?:\.\d+)?)%/);
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1]);
          setDownloads(prev => prev.map(d =>
            d.id === id ? { ...d, progress: percent, status: 'downloading' } : d
          ));
          storage.updateDownload(id, { progress: percent, status: 'downloading' });
        }
      }
    });

    return () => {
      fileManager.removeProgressListener();
    };
  }, []);

  const validateURL = (url) => {
    const trimmedUrl = url.trim();
    
    // Check if URL is empty
    if (!trimmedUrl) {
      return { valid: false, error: "Please enter a URL" };
    }
    
    // Check if it's a valid URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
    
    // Check if it's a supported platform
    const supportedPlatforms = [
      'youtube.com', 'youtu.be', 'y2u.be', 'm.youtube.com',
      'soundcloud.com', 'on.soundcloud.com', 'w.soundcloud.com'
    ];
    
    const isSupported = supportedPlatforms.some(platform => 
      trimmedUrl.toLowerCase().includes(platform)
    );
    
    if (!isSupported) {
      return { 
        valid: false, 
        error: "Unsupported platform. Please use YouTube or SoundCloud URLs" 
      };
    }
    
    return { valid: true };
  };

  const startDownload = async (download) => {
    setDownloads(prev => prev.map(d =>
      d.id === download.id ? { ...d, status: 'downloading', progress: 0 } : d
    ));
    storage.updateDownload(download.id, { status: 'downloading', progress: 0 });

    try {
      const result = await fileManager.downloadAudio(download.url, outputPath, download.id);

      if (result.success) {
        console.log('Download result received:', result); // Debug log
        console.log('Video info:', result.video_info); // Debug log
        
        // Simply use the actual downloaded filename as the title
        let cleanTitle = 'Downloaded Track';
        
        if (result.output_file) {
          console.log('Using actual filename as title:', result.output_file);
          // Extract title from the actual downloaded filename
          const filename = result.output_file.split(/[/\\]/).pop();
          cleanTitle = filename.replace(/\.[^/.]+$/, ''); // Remove extension
          console.log('Clean title from filename:', cleanTitle);
        }

        // Clean up common YouTube title patterns
        cleanTitle = cleanTitle
          .replace(/youtube video #\w+/gi, '') // Remove "youtube video #xyz"
          .replace(/\s*\|\s*.+$/, '') // Remove " | Channel Name" suffix
          .replace(/\s*-\s*.+$/, '') // Remove " - Channel Name" suffix
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        // If title is still empty or too short, use URL-based fallback
        if (!cleanTitle || cleanTitle.length < 3) {
          cleanTitle = `Downloaded from ${new URL(download.url).hostname}`;
        }

        const completedDownload = {
          ...download,
          status: 'completed',
          progress: 100,
          title: cleanTitle,
          artist: result.video_info?.artist || result.video_info?.uploader || 'Unknown Artist',
          duration: result.video_info?.duration_string || '0:00',
          filePath: result.output_file,
          completedAt: Date.now()
        };

        setDownloads(prev => prev.map(d =>
          d.id === download.id ? completedDownload : d
        ));

        storage.updateDownload(download.id, completedDownload);

        storage.addProcessingRecord({
          type: 'download',
          title: `Downloaded ${completedDownload.title}`,
          status: 'completed',
          filePath: result.output_file
        });

        // Add to processing queue
        await addDownloadedFileToQueue(completedDownload, result.output_file);

      } else {
        const possibleFiles = await fileManager.findRecentDownloads(outputPath, download.url);

        if (possibleFiles && possibleFiles.length > 0) {
          const foundFile = possibleFiles[0];

          // Extract title from filename for fallback case
          let cleanTitle = 'Downloaded Track';
          if (download.title && download.title !== 'New Download') {
            cleanTitle = download.title;
          } else {
            // Extract from filename
            const filename = foundFile.split(/[/\\]/).pop();
            cleanTitle = filename.replace(/\.[^/.]+$/, ''); // Remove extension
          }

          // Clean up the title
          cleanTitle = cleanTitle
            .replace(/youtube video #\w+/gi, '')
            .replace(/\s*\|\s*.+$/, '')
            .replace(/\s*-\s*.+$/, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (!cleanTitle || cleanTitle.length < 3) {
            cleanTitle = `Downloaded from ${new URL(download.url).hostname}`;
          }

          const completedDownload = {
            ...download,
            status: 'completed',
            progress: 100,
            title: cleanTitle,
            artist: 'Downloaded',
            duration: '0:00',
            filePath: foundFile,
            completedAt: Date.now()
          };

          setDownloads(prev => prev.map(d =>
            d.id === download.id ? completedDownload : d
          ));

          storage.updateDownload(download.id, completedDownload);

          // Add to processing queue
          await addDownloadedFileToQueue(completedDownload, foundFile);

        } else {
          const errorDownload = {
            ...download,
            status: 'error',
            progress: 0,
            error: result.error
          };

          setDownloads(prev => prev.map(d =>
            d.id === download.id ? errorDownload : d
          ));

          storage.updateDownload(download.id, errorDownload);

          storage.addProcessingRecord({
            type: 'download',
            title: `Failed to download from ${download.url}`,
            status: 'failed',
            error: result.error
          });

          if (result.error && result.error.toLowerCase().includes('ffmpeg')) {
            setShowFFmpegGuide(true);
          }
        }
      }

    } catch (error) {
      console.error('Download error:', error);

      const errorDownload = {
        ...download,
        status: 'error',
        progress: 0,
        error: error.message
      };

      setDownloads(prev => prev.map(d =>
        d.id === download.id ? errorDownload : d
      ));

      storage.updateDownload(download.id, errorDownload);

      if (error.message && error.message.toLowerCase().includes('ffmpeg')) {
        setShowFFmpegGuide(true);
      }
    }
  };

  const addDownload = () => {
    if (!url.trim()) return;

    const validation = validateURL(url);
    if (!validation.valid) {
      setErrorModalMessage(validation.error);
      setShowErrorModal(true);
      return;
    }

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

    startDownload(savedDownload);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorModalMessage('');
  };

  const copyExampleURL = (url) => {
    setUrl(url);
    setShowErrorModal(false);
    // Focus back to the input after copying
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) input.focus();
    }, 100);
  };

  const addDownloadedFileToQueue = async (download, filePath) => {
    try {
      console.log('Adding downloaded file to processing queue:', download.title, 'at:', filePath);
      
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

      // Get file size
      let fileSize = 0;
      try {
        const stats = await fileManager.getFileStats(filePath);
        fileSize = stats?.size || 0;
      } catch (error) {
        console.warn('Could not get file size:', error);
      }
      
      // Add as a track for processing (but don't auto-process)
      const trackData = {
        name: download.title,
        title: download.title, // Add title for compatibility
        artist: download.artist || download.uploader || 'Unknown Artist', // Add artist
        filePath: filePath,
        size: fileSize,
        sizeFormatted: fileManager.formatFileSize ? fileManager.formatFileSize(fileSize) : `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
        status: 'pending', // Ready to be processed, but not processing yet
        progress: 0,
        type: 'downloaded',
        downloadId: download.id,
        duration: download.duration || 0 // Add duration if available
      };

      const savedTrack = storage.addTrack(trackData);
      console.log('Added downloaded track to processing queue:', savedTrack.id);

      // Update download status to show it's ready for processing
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { ...d, status: 'completed', processingMessage: 'Ready for processing in Upload & Process tab!' }
          : d
      ));

    } catch (error) {
      console.error('Error adding downloaded file to queue:', error);
      
      // Update download to show error
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { ...d, status: 'error', processingMessage: `Error: ${error.message}` }
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
            disabled={!url.trim()}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            Add Download
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
            <div style={{ 
              padding: '12px', 
              background: '#1a3a1a', 
              border: '1px solid #2a5a2a', 
              borderRadius: '8px',
              color: '#88ff88',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <CheckCircle size={16} />
              After downloading, process stems from the Upload & Process page
            </div>
            <div style={{ 
              padding: '12px', 
              background: '#2a2a1a', 
              border: '1px solid #4a4a2a', 
              borderRadius: '8px',
              color: '#ffdd88',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FolderOpen size={14} />
              <div>
                <strong>Download Location:</strong><br/>
                {outputPath || 'No path selected'}
              </div>
            </div>
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
                <p>{download.artist} • {download.duration} • {download.quality} kbps {download.format.toUpperCase()}</p>
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

      {/* Error Modal for Invalid URLs */}
      {showErrorModal && (
        <ModalOverlay onClick={closeErrorModal}>
          <ModalContent 
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape') closeErrorModal();
              if (e.key === 'Enter') {
                setUrl('');
                closeErrorModal();
              }
            }}
            tabIndex={0}
          >
            <ModalHeader>
              <h3>
                <AlertCircle size={20} />
                Invalid URL
              </h3>
              <ModalCloseButton onClick={closeErrorModal}>
                <X size={20} />
              </ModalCloseButton>
            </ModalHeader>

            <ErrorMessage>
              {errorModalMessage}
            </ErrorMessage>

            <div style={{ 
              color: '#ccc', 
              fontSize: '14px', 
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
              AutoDJ supports downloading music from <strong>YouTube</strong> and <strong>SoundCloud</strong>. 
              Click any example below to use it, or paste your own supported URL.
            </div>

            <ExampleSection>
              <h4>
                <ExternalLink size={16} />
                Click to Use These Examples:
              </h4>
              <ExampleList>
                <ExampleItem 
                  onClick={() => copyExampleURL('https://www.youtube.com/watch?v=jNQXAC9IVRw')}
                  title="Click to use this URL"
                >
                  <div className="platform">
                    <Youtube size={14} />
                    YouTube - Full URL
                  </div>
                  <div className="url">https://www.youtube.com/watch?v=jNQXAC9IVRw</div>
                </ExampleItem>

                <ExampleItem 
                  onClick={() => copyExampleURL('https://youtu.be/jNQXAC9IVRw')}
                  title="Click to use this URL"
                >
                  <div className="platform">
                    <Youtube size={14} />
                    YouTube - Short URL
                  </div>
                  <div className="url">https://youtu.be/jNQXAC9IVRw</div>
                </ExampleItem>

                <ExampleItem 
                  onClick={() => copyExampleURL('https://soundcloud.com/user-123456789/cool-track')}
                  title="Click to use this URL"
                >
                  <div className="platform">
                    <Music size={14} />
                    SoundCloud
                  </div>
                  <div className="url">https://soundcloud.com/user-123456789/cool-track</div>
                </ExampleItem>

                <ExampleItem 
                  onClick={() => copyExampleURL('https://m.youtube.com/watch?v=jNQXAC9IVRw')}
                  title="Click to use this URL"
                >
                  <div className="platform">
                    <Youtube size={14} />
                    YouTube - Mobile
                  </div>
                  <div className="url">https://m.youtube.com/watch?v=jNQXAC9IVRw</div>
                </ExampleItem>
              </ExampleList>
            </ExampleSection>

            <ModalActions>
              <ModalButton className="secondary" onClick={closeErrorModal}>
                Close
              </ModalButton>
              <ModalButton className="primary" onClick={() => {
                setUrl('');
                closeErrorModal();
              }}>
                Try Again
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </DownloaderContainer>
  );
}

export default MusicDownloader; 