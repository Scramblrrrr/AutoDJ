/**
 * File Manager Utility for AutoDJ
 * Handles file operations, path management, and Electron IPC communication
 */

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
const path = window.require ? window.require('path') : null;
const fs = window.require ? window.require('fs') : null;
const os = window.require ? window.require('os') : null;

class FileManager {
  constructor() {
    this.defaultPaths = {
      downloads: path ? path.join(os.homedir(), 'Music', 'AutoDJ', 'Downloads') : './downloads',
      processed: path ? path.join(os.homedir(), 'Music', 'AutoDJ', 'Processed') : './processed',
      stems: path ? path.join(os.homedir(), 'Music', 'AutoDJ', 'Stems') : './stems',
      temp: path ? path.join(os.homedir(), 'Music', 'AutoDJ', 'Temp') : './temp'
    };
    
    this.ensureDirectories();
  }

  async ensureDirectories() {
    if (!fs) return;
    
    try {
      for (const [key, dirPath] of Object.entries(this.defaultPaths)) {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Created directory: ${dirPath}`);
        }
      }
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  getDefaultPath(type) {
    return this.defaultPaths[type] || this.defaultPaths.downloads;
  }

  async selectFiles() {
    if (!ipcRenderer) {
      // Fallback for web environment
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.mp3,.wav,.flac,.m4a,.aac';
        
        input.onchange = (e) => {
          const files = Array.from(e.target.files);
          resolve(files.map(f => f.path || f.name));
        };
        
        input.click();
      });
    }
    
    try {
      return await ipcRenderer.invoke('select-files');
    } catch (error) {
      console.error('Error selecting files:', error);
      return [];
    }
  }

  async selectFolder() {
    if (!ipcRenderer) {
      return this.defaultPaths.downloads;
    }
    
    try {
      return await ipcRenderer.invoke('select-folder');
    } catch (error) {
      console.error('Error selecting folder:', error);
      return this.defaultPaths.downloads;
    }
  }

  async findRecentDownloads(downloadPath, originalUrl) {
    if (!fs) return []; // Web environment fallback
    
    try {
      const downloadDir = downloadPath || this.defaultPaths.downloads;
      
      // Get all files in download directory
      const files = fs.readdirSync(downloadDir);
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes ago
      
      const recentFiles = files
        .map(filename => {
          const fullPath = path.join(downloadDir, filename);
          try {
            const stats = fs.statSync(fullPath);
            return {
              path: fullPath,
              name: filename,
              mtime: stats.mtime.getTime(),
              size: stats.size
            };
          } catch (error) {
            return null;
          }
        })
        .filter(file => 
          file && 
          file.mtime > fiveMinutesAgo && 
          file.size > 0 &&
          (file.name.endsWith('.mp3') || file.name.endsWith('.webm') || file.name.endsWith('.m4a'))
        )
        .sort((a, b) => b.mtime - a.mtime); // Most recent first
      
      return recentFiles.map(file => file.path);
    } catch (error) {
      console.error('Error finding recent downloads:', error);
      return [];
    }
  }

  async checkFileExists(filePath) {
    if (!fs) return true; // In web environment, assume exists
    
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  async processStems(filePath, outputDir = null) {
    const actualOutputDir = outputDir || this.defaultPaths.stems;
    
    if (!ipcRenderer) {
      // Simulate processing in web environment
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            stems: {
              vocals: path ? path.join(actualOutputDir, 'vocals.wav') : 'vocals.wav',
              drums: path ? path.join(actualOutputDir, 'drums.wav') : 'drums.wav',
              bass: path ? path.join(actualOutputDir, 'bass.wav') : 'bass.wav',
              other: path ? path.join(actualOutputDir, 'other.wav') : 'other.wav'
            }
          });
        }, 3000);
      });
    }

    try {
      return await ipcRenderer.invoke('process-stems', filePath, actualOutputDir);
    } catch (error) {
      console.error('Error processing stems:', error);
      return { success: false, error: error.message };
    }
  }

  async downloadAudio(url, outputDir = null, downloadId = null) {
    const actualOutputDir = outputDir || this.defaultPaths.downloads;
    
    if (!ipcRenderer) {
      // Simulate download in web environment
      return new Promise((resolve) => {
        setTimeout(() => {
          const filename = `downloaded_${Date.now()}.mp3`;
          resolve({
            success: true,
            output_file: path ? path.join(actualOutputDir, filename) : filename,
            video_info: {
              title: 'Sample Track',
              artist: 'Sample Artist',
              duration: '3:45'
            }
          });
        }, 2000);
      });
    }

    try {
      const result = await ipcRenderer.invoke('download-audio', url, actualOutputDir, downloadId);
      
      // The Python script returns success info via stdout, but we need to parse it properly
      if (result && typeof result === 'string' && result.includes('SUCCESS:')) {
        const lines = result.split('\n');
        let title = 'Downloaded Track';
        let filePath = '';
        
        for (const line of lines) {
          if (line.includes('Successfully downloaded:')) {
            title = line.split('Successfully downloaded:')[1].trim();
          }
          if (line.includes('File saved to:')) {
            filePath = line.split('File saved to:')[1].trim();
          }
        }
        
        return {
          success: true,
          output_file: filePath,
          video_info: {
            title: title,
            artist: 'Downloaded',
            duration_string: '0:00'
          }
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error downloading audio:', error);
      
      // Check if the error message contains success info (sometimes thrown as error but actually successful)
      if (error.message && error.message.includes('SUCCESS:')) {
        const lines = error.message.split('\n');
        let title = 'Downloaded Track';
        let filePath = '';
        
        for (const line of lines) {
          if (line.includes('Successfully downloaded:')) {
            title = line.split('Successfully downloaded:')[1].trim();
          }
          if (line.includes('File saved to:')) {
            filePath = line.split('File saved to:')[1].trim();
          }
        }
        
        return {
          success: true,
          output_file: filePath,
          video_info: {
            title: title,
            artist: 'Downloaded',
            duration_string: '0:00'
          }
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  getFileInfo(filePath) {
    if (!fs || !path) {
      return {
        name: filePath,
        size: 0,
        extension: '',
        exists: false
      };
    }

    try {
      const stats = fs.statSync(filePath);
      return {
        name: path.basename(filePath),
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        extension: path.extname(filePath),
        exists: true,
        created: stats.birthtime,
        modified: stats.mtime,
        fullPath: filePath
      };
    } catch (error) {
      return {
        name: path ? path.basename(filePath) : filePath,
        size: 0,
        extension: path ? path.extname(filePath) : '',
        exists: false,
        error: error.message
      };
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async openFileLocation(filePath) {
    if (!ipcRenderer) {
      console.log('Would open file location:', filePath);
      return;
    }

    try {
      const { shell } = window.require('electron');
      shell.showItemInFolder(filePath);
    } catch (error) {
      console.error('Error opening file location:', error);
    }
  }

  async deleteFile(filePath) {
    if (!fs) {
      console.log('Would delete file:', filePath);
      return true;
    }

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async moveFile(sourcePath, destinationPath) {
    if (!fs) {
      console.log('Would move file from', sourcePath, 'to', destinationPath);
      return true;
    }

    try {
      fs.renameSync(sourcePath, destinationPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  async getDirContents(dirPath) {
    if (!fs) {
      return [];
    }

    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const items = fs.readdirSync(dirPath);
      return items.map(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        return {
          name: item,
          path: itemPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  generateUniqueFilename(directory, baseName, extension) {
    if (!fs || !path) {
      return `${baseName}.${extension}`;
    }

    let counter = 1;
    let filename = `${baseName}.${extension}`;
    let fullPath = path.join(directory, filename);

    while (fs.existsSync(fullPath)) {
      filename = `${baseName}_${counter}.${extension}`;
      fullPath = path.join(directory, filename);
      counter++;
    }

    return filename;
  }

  isAudioFile(filePath) {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma'];
    const extension = path ? path.extname(filePath).toLowerCase() : '';
    return audioExtensions.includes(extension);
  }

  async calculateDirectorySize(dirPath) {
    if (!fs || !path) {
      return 0;
    }

    try {
      let totalSize = 0;
      const items = await this.getDirContents(dirPath);

      for (const item of items) {
        if (item.isDirectory) {
          totalSize += await this.calculateDirectorySize(item.path);
        } else {
          totalSize += item.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating directory size:', error);
      return 0;
    }
  }

  // Progress tracking for file operations
  setupProgressListener(callback) {
    if (!ipcRenderer) return;

    ipcRenderer.on('stem-progress', (event, data) => {
      callback('stem-processing', data);
    });

    ipcRenderer.on('download-progress', (event, data) => {
      callback('download', data);
    });
  }

  removeProgressListener() {
    if (!ipcRenderer) return;

    ipcRenderer.removeAllListeners('stem-progress');
    ipcRenderer.removeAllListeners('download-progress');
  }
}

// Export singleton instance
const fileManager = new FileManager();

export default fileManager; 