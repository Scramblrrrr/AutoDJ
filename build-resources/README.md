# Build Resources

This directory contains resources needed for building and packaging the AutoDJ application.

## Files

- `entitlements.mac.plist` - macOS entitlements file for app signing and permissions
- `dmg-background.png` - Background image for macOS DMG installer (optional)

## macOS Entitlements

The entitlements file grants the following permissions to the AutoDJ app:

- JIT compilation (required for some audio processing libraries)
- Unsigned executable memory (required for Python integration)
- Library validation bypass (for Python dependencies)
- Network access (for downloading music)
- File system access (for reading/writing audio files)
- Audio device access (for input/output)
- Apple Events (for system integration)

## DMG Background

To create a custom DMG background:
1. Create a PNG image with dimensions 540x380 pixels
2. Name it `dmg-background.png`
3. Place it in this directory

The background will be used when creating the macOS DMG installer. 