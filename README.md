# AutoDJ - AI-Powered Music Mixing Desktop App

AutoDJ is a sophisticated desktop application that automatically mixes user-uploaded music using AI-powered stem separation and advanced DJ algorithms. Built with Electron, React, and Python, it provides a seamless experience for both casual music lovers and professional DJs.

![AutoDJ Logo](Assets/AI%20DJ%20-%20Logo.png)

## Features

### 🎵 AI DJ Mixing
- **Automatic Music Mixing**: AI-powered algorithms that seamlessly blend tracks
- **Stem-based Control**: Individual control over vocals, drums, bass, and other instruments
- **Queue Management**: Easy drag-and-drop queue system with real-time reordering
- **BPM Matching**: Automatic tempo synchronization between tracks
- **Smart Transitions**: Intelligent fade-ins, fade-outs, and crossfading

### 🎧 Audio Processing
- **Stem Separation**: Uses Meta's Demucs for high-quality source separation
- **Multiple Format Support**: MP3, WAV, FLAC, M4A, AAC
- **Automatic WAV Conversion**: Inputs are converted to 44.1&nbsp;kHz WAV for consistent stem extraction and BPM analysis
- **Batch Processing**: Process multiple tracks simultaneously
- **Real-time Visualization**: Live stem level monitoring and control

### 📥 Music Acquisition
- **YouTube Integration**: Download music directly from YouTube
- **SoundCloud Support**: Import tracks from SoundCloud
- **Quality Options**: Choose from 128kbps to 320kbps
- **Format Conversion**: Convert to your preferred audio format
- **Metadata Extraction**: Automatic title, artist, and duration detection

### 🎨 Modern Interface
- **Dark Theme**: Sleek greyscale design optimized for extended use
- **Responsive Layout**: Adaptive interface that works on various screen sizes
- **Real-time Feedback**: Live progress indicators and status updates
- **Intuitive Controls**: Easy-to-use interface inspired by professional DJ software

## Installation

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Python** (v3.8 or higher)
3. **FFmpeg** (for audio processing)

#### Installing FFmpeg

**Windows:**
```powershell
# Using chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
# Using homebrew
brew install ffmpeg
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

### Setup Instructions

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/AutoDJ.git
cd AutoDJ
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Install Python dependencies:**
```bash
npm run install-python-deps
# or manually:
pip install -r python/requirements.txt
```

4. **Start the development server:**
```bash
npm run electron-dev
```

5. **Build for production:**
```bash
npm run build
npm run electron-pack
```

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
- **Format Support**: Accepts MP3, WAV, FLAC, M4A, and AAC files

### Music Downloader
- **URL Input**: Paste YouTube or SoundCloud links
- **Quality Selection**: Choose audio quality from 128kbps to 320kbps
- **Format Options**: Download in MP3, WAV, FLAC, or M4A format
- **Auto Processing**: Optionally process stems immediately after download
- **Organized Folders**: Downloads are saved in `<Artist>/<Title>` folders within your chosen directory

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
2. **WAV Conversion**: All inputs are converted to 44.1 kHz WAV for consistent beat analysis
3. **Stem Separation**: Use Demucs to separate audio sources
4. **File Organization**: Save processed stems with proper naming
   in a subfolder named after each track
5. **File Organization**: Save processed stems with proper naming
6. **Quality Control**: Verify output quality and completeness


## Configuration

### Audio Settings
You can customize audio processing settings by modifying the configuration files:

- **Quality**: Choose between different Demucs models (htdemucs, hdemucs)
- **Output Format**: Configure default output formats
- **Processing Threads**: Adjust CPU usage for processing

### DJ Parameters
Fine-tune the AI mixing algorithms:

- **BPM Tolerance**: How strictly to match tempos
- **Transition Duration**: Length of crossfades
- **Stem Mixing Rules**: How stems are combined during transitions

## Development

### Project Structure
```
AutoDJ/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── App.js             # Main application component
│   └── main.js            # Electron main process
├── python/                # Python backend
│   ├── stem_processor.py  # Stem separation logic
│   ├── downloader.py      # Music download functionality
│   └── requirements.txt   # Python dependencies
├── public/                # Static assets
├── Assets/                # Application assets
└── package.json           # Node.js configuration
```

### Adding New Features

1. **Frontend Components**: Add new React components in `src/components/`
2. **Backend Processing**: Extend Python scripts in `python/`
3. **IPC Communication**: Use Electron's IPC for frontend-backend communication
4. **Styling**: Use styled-components for consistent theming

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure all dependencies are installed: `npm install && pip install -r python/requirements.txt`

**FFmpeg not found:**
- Install FFmpeg and ensure it's in your system PATH

**Demucs processing fails:**
- Check that you have enough RAM (8GB+ recommended)
- Verify CUDA installation for GPU acceleration (optional)

**Download failures:**
- Some videos may be geo-restricted or have download restrictions
- Try updating yt-dlp: `pip install --upgrade yt-dlp`

### Performance Optimization

**For better performance:**
- Use GPU acceleration if available (NVIDIA CUDA)
- Increase RAM allocation for large batch processing
- Use SSD storage for faster file operations
- Close other resource-intensive applications

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Meta AI** for the incredible Demucs source separation model
- **yt-dlp** community for the robust downloading capabilities
- **Electron** and **React** teams for the excellent frameworks
- **Music producers and DJs** who inspired this project

## Support

If you encounter any issues or have feature requests, please:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [GitHub issues](https://github.com/your-username/AutoDJ/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ for music lovers and DJs everywhere** 