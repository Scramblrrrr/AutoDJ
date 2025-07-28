# AutoDJ Packaging Guide

This guide explains how to package the AutoDJ application for distribution on different platforms.

## Prerequisites

Before packaging, ensure you have:

1. **Node.js** (v16 or higher)
2. **Python** (v3.8 or higher) with pip
3. **FFmpeg** installed and in your PATH
4. **Git** (for version control)

## Quick Start

### For Windows (Recommended for your current setup)

```bash
# Install dependencies
npm install

# Install Python dependencies
npm run install-python-deps

# Package for Windows
npm run electron-pack-win
```

### For All Platforms

```bash
# Package for all platforms (Windows, macOS, Linux)
npm run electron-pack-all
```

## Available Scripts

### Development
- `npm start` - Start React development server
- `npm run electron-dev` - Start Electron in development mode
- `npm run build` - Build React app for production

### Packaging
- `npm run electron-pack` - Package for current platform
- `npm run electron-pack-win` - Package for Windows
- `npm run electron-pack-mac` - Package for macOS
- `npm run electron-pack-linux` - Package for Linux
- `npm run electron-pack-all` - Package for all platforms
- `npm run create-installer` - Create Windows installer
- `npm run dist` - Build and package

### Python Dependencies
- `npm run install-python-deps` - Install Python requirements

## Platform-Specific Details

### Windows

**Generated Files:**
- `AutoDJ Setup.exe` - NSIS installer
- `AutoDJ.exe` - Portable executable
- `AutoDJ-win32-x64.zip` - Zipped application

**Features:**
- Custom installer with desktop and start menu shortcuts
- Portable version available
- Automatic Python dependency inclusion

### macOS

**Generated Files:**
- `AutoDJ.dmg` - Disk image installer
- `AutoDJ-mac.zip` - Zipped application

**Features:**
- Hardened runtime for security
- Proper entitlements for audio access
- Universal binary (Intel + Apple Silicon)

### Linux

**Generated Files:**
- `AutoDJ.AppImage` - AppImage format
- `AutoDJ.deb` - Debian package
- `AutoDJ.rpm` - RPM package

**Features:**
- AppImage for easy distribution
- Native package formats
- Proper desktop integration

## Advanced Packaging

### Using the Packaging Script

```bash
# Use the custom packaging script
node scripts/package.js win    # Windows
node scripts/package.js mac    # macOS
node scripts/package.js linux  # Linux
node scripts/package.js all    # All platforms
```

### Custom Build Configuration

The build configuration is in `package.json` under the `build` section. Key options:

```json
{
  "build": {
    "appId": "com.autodj.app",
    "productName": "AutoDJ",
    "directories": {
      "output": "dist",
      "buildResources": "build-resources"
    }
  }
}
```

### File Inclusion/Exclusion

The build process automatically includes:
- React build files
- Python scripts and dependencies
- Assets (images, icons)
- Main Electron process

Excluded files:
- Development dependencies
- Test files
- Documentation
- Git files

## Code Signing

### Windows Code Signing

1. Obtain a code signing certificate
2. Add to `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password"
    }
  }
}
```

### macOS Code Signing

1. Get Apple Developer certificate
2. Add to `package.json`:

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

## Distribution

### GitHub Releases

The app is configured for GitHub releases. To publish:

1. Create a GitHub release
2. Upload the generated files
3. Tag with version number

### Other Platforms

- **Windows**: Microsoft Store, direct download
- **macOS**: Mac App Store, direct download
- **Linux**: Snap Store, Flathub, direct download

## Troubleshooting

### Common Issues

1. **Python not found**
   - Ensure Python is installed and in PATH
   - Run `npm run install-python-deps`

2. **FFmpeg not found**
   - Install FFmpeg and add to PATH
   - Windows: Download from https://ffmpeg.org/

3. **Build fails**
   - Clear `node_modules` and reinstall
   - Check Python dependencies
   - Verify all assets exist

4. **Large package size**
   - Python dependencies are included
   - Consider using PyInstaller for Python bundling
   - Exclude unnecessary files

### Build Logs

Check the `dist` directory for build logs and generated files.

## Performance Optimization

### Package Size Reduction

1. **Exclude unnecessary Python packages**
   - Edit `python/requirements.txt`
   - Remove unused dependencies

2. **Optimize assets**
   - Compress images
   - Remove unused files

3. **Use compression**
   - Enable gzip compression
   - Use UPX for executable compression

### Runtime Performance

1. **Lazy loading**
   - Load Python modules on demand
   - Split large components

2. **Memory management**
   - Proper cleanup of audio resources
   - Monitor memory usage

## Security Considerations

1. **Code signing** - Sign all releases
2. **Dependencies** - Keep dependencies updated
3. **Permissions** - Request minimal permissions
4. **Updates** - Implement auto-update mechanism

## Version Management

Update version in `package.json`:

```json
{
  "version": "1.0.1"
}
```

The version number is automatically included in the package name.

## Support

For packaging issues:
1. Check the troubleshooting section
2. Review build logs in `dist` directory
3. Verify all prerequisites are met
4. Test on clean environment 