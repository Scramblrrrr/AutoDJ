# AutoDJ - AI-Powered Desktop DJ Application

An intelligent desktop DJ application that uses AI to automatically mix and process music tracks.

## Features

- 🎵 **AI-Powered Stem Separation** - Separate vocals, drums, bass, and other instruments
- 🎧 **Automatic Music Mixing** - Intelligent beat matching and transitions
- 📥 **Music Download** - Download tracks from various sources
- 🎛️ **Professional DJ Interface** - Intuitive controls for live mixing
- 🔧 **Multiple Processing Options** - Choose from different AI models
- 📱 **Cross-Platform** - Works on Windows, macOS, and Linux

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher) with pip
- **FFmpeg** installed and in your PATH

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AutoDJ.git
   cd AutoDJ
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run install-python-deps
   ```

3. **Start development**
   ```bash
   npm run electron-dev
   ```

## Packaging & Distribution

### Quick Packaging (Windows)

```bash
# Run the automated packaging script
package-windows.bat
```

### Manual Packaging

```bash
# Package for Windows
npm run electron-pack-win

# Package for macOS
npm run electron-pack-mac

# Package for Linux
npm run electron-pack-linux

# Package for all platforms
npm run electron-pack-all
```

### Using the Custom Script

```bash
# Use the Node.js packaging script
node scripts/package.js win    # Windows
node scripts/package.js mac    # macOS
node scripts/package.js linux  # Linux
node scripts/package.js all    # All platforms
```

## Generated Packages

### File Locations
AutoDJ keeps music organized under `~/Music/AutoDJ/Library`:

- **Downloads**: raw downloads from YouTube or SoundCloud are stored in `Library/Downloads`
- **Processed**: copies of tracks that have been processed live in `Library/Processed`
- **Stems**: extracted stems are saved in `Library/Stems`
- **Temp**: temporary working files are placed in `Temp`


## Usage

### Getting Started

1. **Launch AutoDJ** and you'll see the Dashboard with an overview of your music library
2. **Upload Music**: Go to the "Upload & Process" tab to add your music files
3. **Process Stems**: Click "Process All Files" to separate your tracks into stems
4. **Start DJing**: Switch to the "AI|DJ" tab to create queues and start mixing

### Dashboard
- View statistics about your music library
- See processing status and active sessions
- Quick access to main features

### AI|DJ Studio
- **Player Controls**: Play, pause, skip, and control volume
- **Stem Visualization**: Real-time stem level display and individual volume controls
- **Queue Management**: Add tracks, reorder queue, and manage upcoming songs
- **Auto Mix**: Let the AI automatically transition between tracks

### Upload & Process
- **Drag & Drop**: Simply drag music files into the upload area
- **Batch Processing**: Process multiple files at once
- **Progress Tracking**: Monitor processing status for each file
- **Format Support**: Accepts MP3, WAV, FLAC, M4A, and AAC files (WAV preferred for analysis)

### Music Downloader
- **URL Input**: Paste YouTube or SoundCloud links
- **Quality Selection**: Choose audio quality from 128kbps to 320kbps
- **Format Options**: Download in MP3, WAV, FLAC, or M4A format (WAV is used by default)
 - **Manual Processing**: After download, process stems from the **Upload & Process** tab

## Technical Architecture

### Frontend (Electron + React)
- **Electron**: Cross-platform desktop application framework
- **React**: Modern UI library with hooks and functional components
- **Styled Components**: CSS-in-JS for dynamic styling
- **Lucide React**: Beautiful, customizable icons

### Backend (Python)
- **Demucs**: Meta's state-of-the-art music source separation
- **yt-dlp**: Robust YouTube and SoundCloud downloader
- **librosa**: Audio analysis and feature extraction
- **PyTorch**: Deep learning framework for AI models

### Audio Processing Pipeline
1. **Input Validation**: Check file format and integrity
2. **Stem Separation**: Use Demucs to separate audio sources
3. **Metadata Extraction**: Extract audio properties and tags
4. **File Organization**: Save processed stems with proper naming
5. **Quality Control**: Verify output quality and completeness
=======
Original files are never deleted automatically.


## Configuration

### Windows
- `AutoDJ Setup.exe` - NSIS installer with shortcuts
- `AutoDJ.exe` - Portable executable
- `AutoDJ-win32-x64.zip` - Zipped application


### macOS
- `AutoDJ.dmg` - Disk image installer
- `AutoDJ-mac.zip` - Zipped application

### Linux
- `AutoDJ.AppImage` - AppImage format
- `AutoDJ.deb` - Debian package
- `AutoDJ.rpm` - RPM package

## Development

### Available Scripts

- `npm start` - Start React development server
- `npm run electron-dev` - Start Electron in development mode
- `npm run build` - Build React app for production
- `npm run electron` - Run Electron with built app

### Project Structure

```
AutoDJ/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   └── main.js            # Electron main process
├── python/                # Python backend
│   ├── stem_processor.py  # AI stem separation
│   ├── downloader.py      # Music downloader
│   └── requirements.txt   # Python dependencies
├── Assets/                # Application assets
├── build-resources/       # Build configuration
└── scripts/               # Packaging scripts
```

## AI Models

The application supports multiple AI models for stem separation:

- **Demucs** - High-quality separation (default)
- **Open-Unmix** - Fast processing
- **Spectral** - Lightweight option
- **Professional** - Advanced features

## Configuration

### Python Dependencies

Install required Python packages:
```bash
pip install -r python/requirements.txt
```

### FFmpeg Installation

**Windows:**
1. Download from https://ffmpeg.org/
2. Extract to a folder
3. Add to system PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg  # CentOS/RHEL
```

## Troubleshooting

### Common Issues

1. **Python not found**
   - Ensure Python is installed and in PATH
   - Run `npm run install-python-deps`

2. **FFmpeg not found**
   - Install FFmpeg and add to PATH
   - Restart terminal after installation

3. **Build fails**
   - Clear `node_modules` and reinstall
   - Check Python dependencies
   - Verify all assets exist

### Getting Help

- Check the [PACKAGING.md](PACKAGING.md) for detailed packaging information
- Review build logs in the `dist` directory
- Ensure all prerequisites are met

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the documentation
3. Open an issue on GitHub

---

**AutoDJ** - Making AI-powered DJing accessible to everyone! 🎧✨ 