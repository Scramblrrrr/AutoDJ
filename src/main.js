const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../Assets/AI DJ - Logo.png'),
    titleBarStyle: 'default'
  });

  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Python backend communication
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac'] }
    ]
  });
  return result.filePaths;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// Handler for loading audio files (for DJ mixing)
ipcMain.handle('load-audio-file', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    console.log('Loading audio file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`Audio file not found: ${filePath}`));
      return;
    }
    
    try {
      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Convert to ArrayBuffer for Web Audio API
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
      
      console.log(`Successfully loaded audio file: ${filePath} (${arrayBuffer.byteLength} bytes)`);
      resolve(arrayBuffer);
    } catch (error) {
      console.error('Error reading audio file:', error);
      reject(error);
    }
  });
});

// Add a simple test handler first
ipcMain.handle('test-python', async (event) => {
  return new Promise((resolve, reject) => {
    const testScriptPath = path.join(__dirname, '../python/test_simple.py');
    console.log('Testing Python with simple script:', testScriptPath);
    
    const pythonProcess = spawn('py', ['-3', '-u', testScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let output = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log('TEST stdout:', dataStr);
      output += dataStr;
      event.sender.send('stem-progress', `TEST: ${dataStr}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      console.log('TEST stderr:', dataStr);
      event.sender.send('stem-progress', `TEST ERROR: ${dataStr}`);
    });

    pythonProcess.on('close', (code) => {
      console.log('Test Python process closed with code:', code);
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.log('Test Python spawn error:', err);
      reject(err);
    });
  });
});

ipcMain.handle('process-stems', async (event, filePath, outputDir) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../python/stem_processor_demucs_simple.py');
    
    console.log('Attempting to start Python script:', scriptPath);
    console.log('File path:', filePath);
    console.log('Output dir:', outputDir);
    
    // Try 'py' first (Windows Python Launcher), then 'python'
    // Use -u flag to force unbuffered stdout/stderr
    console.log('Spawning Python with args:', ['py', '-3', '-u', scriptPath, filePath, outputDir]);
    
    const pythonProcess = spawn('py', ['-3', '-u', scriptPath, filePath, outputDir], {
      stdio: ['pipe', 'pipe', 'pipe'],  // Explicitly set stdio pipes
      env: process.env  // Pass current environment
    });

    let output = '';
    let error = '';
    let isProcessing = true;
    let hasReceivedData = false;
    const startTime = Date.now();
    
    // Log spawn success
    console.log('Python process spawned successfully with PID:', pythonProcess.pid);
    
    // Handle spawn errors immediately
    pythonProcess.on('error', (err) => {
      console.log('Python spawn error:', err.message);
      if (err.code === 'ENOENT') {
        // Try fallback to 'python' command
        console.log('Trying fallback to python command...');
        const fallbackProcess = spawn('python', ['-u', scriptPath, filePath, outputDir]);
        
        fallbackProcess.on('error', (fallbackErr) => {
          console.log('Fallback python spawn error:', fallbackErr.message);
          reject(new Error(`Could not start Python process. Make sure Python is installed and in PATH. Error: ${fallbackErr.message}`));
        });
        
        // Replace the original process reference
        pythonProcess = fallbackProcess;
      } else {
        reject(new Error(`Python process error: ${err.message}`));
      }
    });
    
    // Set a timeout for very long processing (15 minutes max)
    const timeout = setTimeout(() => {
      if (isProcessing) {
        pythonProcess.kill('SIGTERM');
        reject(new Error('Stem processing timed out after 15 minutes'));
      }
    }, 15 * 60 * 1000); // 15 minutes

    // Send immediate start message
    event.sender.send('stem-progress', 'PROGRESS: Python process starting...\n');
    
    // Debug: Check if python process actually started
    setTimeout(() => {
      if (isProcessing) {
        console.log('Python process PID:', pythonProcess.pid);
        console.log('Python process killed:', pythonProcess.killed);
        event.sender.send('stem-progress', `DEBUG: Python process status - PID: ${pythonProcess.pid}, killed: ${pythonProcess.killed}\n`);
      }
    }, 2000);
    
    // Send keepalive messages during processing
    const keepAliveInterval = setInterval(() => {
      if (isProcessing) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        event.sender.send('stem-progress', `PROGRESS: Still waiting for Python response... ${elapsed}s elapsed\n`);
        console.log(`Keepalive: ${elapsed}s elapsed, process status:`, {
          pid: pythonProcess.pid,
          killed: pythonProcess.killed,
          connected: pythonProcess.connected
        });
      }
    }, 10000); // Every 10 seconds for debugging

    pythonProcess.stdout.on('data', (data) => {
      hasReceivedData = true;
      const dataStr = data.toString();
      console.log('Python stdout received:', dataStr);
      output += dataStr;
      event.sender.send('stem-progress', dataStr);
    });

    pythonProcess.stderr.on('data', (data) => {
      hasReceivedData = true;
      const dataStr = data.toString();
      console.log('Python stderr received:', dataStr);
      error += dataStr;
      event.sender.send('stem-progress', `INFO: ${dataStr}`);
    });
    
    // Check if we're receiving any data at all
    setTimeout(() => {
      if (!hasReceivedData && isProcessing) {
        console.log('WARNING: No data received from Python process after 5 seconds');
        event.sender.send('stem-progress', 'WARNING: Python process not sending output - checking if process is actually running...\n');
      }
    }, 5000);

    pythonProcess.on('close', (code) => {
      isProcessing = false;
      clearTimeout(timeout);
      clearInterval(keepAliveInterval);
      
      if (code === 0) {
        try {
          // Look for JSON result in the output
          const lines = output.split('\n');
          let jsonResult = null;
          
          // Find the last JSON line (the result)
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              try {
                jsonResult = JSON.parse(line);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          
          if (jsonResult) {
            resolve(jsonResult);
          } else {
            // Fallback: assume success if code 0
            resolve({ success: true, message: 'Processing completed', output: output });
          }
        } catch (parseError) {
          console.log('Failed to parse Python output:', parseError);
          resolve({ success: true, message: 'Processing completed', output: output });
        }
      } else {
        reject(new Error(error || 'Processing failed'));
      }
    });

    pythonProcess.on('error', (err) => {
      isProcessing = false;
      clearTimeout(timeout);
      clearInterval(keepAliveInterval);
      reject(err);
    });
  });
});

ipcMain.handle('download-audio', async (event, url, outputDir) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../python/downloader.py'),
      url,
      outputDir
    ]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      event.sender.send('download-progress', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error));
      }
    });
  });
}); 