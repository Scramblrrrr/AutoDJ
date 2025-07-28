#!/usr/bin/env python3
"""
Music downloader for YouTube and SoundCloud using yt-dlp.
This script downloads audio from various platforms and converts to specified formats.
"""

import sys
import os
import yt_dlp
import json
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Optional
import logging
import subprocess
import re

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MusicDownloader:
    def __init__(self, output_dir: str = "./downloads", quality: str = "320", format: str = "mp3"):
        """
        Initialize the music downloader.
        
        Args:
            output_dir: Directory to save downloaded files
            quality: Audio quality (128, 192, 256, 320 kbps)
            format: Output format (mp3, wav, flac, m4a)
        """
        self.output_dir = Path(output_dir)
        self.quality = quality
        self.format = format.lower()
        self.supported_sites = ['youtube', 'soundcloud', 'bandcamp', 'vimeo']
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure yt-dlp options
        self.ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best',  # Prefer formats that don't need conversion
            'outtmpl': str(self.output_dir / '%(title)s.%(ext)s'),
            'extractaudio': True,
            'audioformat': 'mp3',  # Default, will be changed based on format
            'audioquality': quality if quality != '320' else '0',  # 0 means best quality
            'embed_subs': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'noplaylist': True,  # Only download single video, not playlist
            'prefer_ffmpeg': False,  # Don't require ffmpeg
        }
        
        # Adjust options based on format
        if self.format == 'wav':
            self.ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }]
        elif self.format == 'flac':
            self.ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'flac',
            }]
        elif self.format == 'm4a':
            self.ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'm4a',
            }]
        else:  # mp3
            self.ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }]
    
    def is_supported_url(self, url: str) -> bool:
        """Check if the URL is from a supported platform."""
        url_lower = url.lower()
        return any(site in url_lower for site in self.supported_sites)
    
    def get_video_info(self, url: str) -> Optional[Dict]:
        """
        Extract video information without downloading.
        
        Args:
            url: Video URL
            
        Returns:
            Dictionary with video info or None if failed
        """
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'artist': info.get('uploader', 'Unknown Artist'),
                    'duration': info.get('duration', 0),
                    'duration_string': self._format_duration(info.get('duration', 0)),
                    'platform': self._get_platform(url),
                    'thumbnail': info.get('thumbnail'),
                    'view_count': info.get('view_count', 0),
                    'upload_date': info.get('upload_date', ''),
                    'description': info.get('description', '')
                }
        except Exception as e:
            logger.error(f"Error extracting video info: {str(e)}")
            return None
    
    def _format_duration(self, seconds: int) -> str:
        """Format duration from seconds to MM:SS format."""
        if not seconds:
            return "0:00"
        
        minutes = seconds // 60
        seconds = seconds % 60
        return f"{minutes}:{seconds:02d}"
    
    def _get_platform(self, url: str) -> str:
        """Determine the platform from URL."""
        url_lower = url.lower()
        if 'youtube' in url_lower or 'youtu.be' in url_lower:
            return 'youtube'
        elif 'soundcloud' in url_lower:
            return 'soundcloud'
        elif 'bandcamp' in url_lower:
            return 'bandcamp'
        elif 'vimeo' in url_lower:
            return 'vimeo'
        else:
            return 'unknown'
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to be safe for filesystem."""
        # Remove or replace problematic characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'\s+', ' ', filename).strip()
        return filename[:200]  # Limit length
    
    def download_progress_hook(self, d):
        """Hook function to track download progress."""
        if d['status'] == 'downloading':
            try:
                percent = d.get('_percent_str', 'N/A')
                speed = d.get('_speed_str', 'N/A')
                print(f"PROGRESS: Downloading {percent} at {speed}")
            except:
                print("PROGRESS: Downloading...")
        elif d['status'] == 'finished':
            print(f"PROGRESS: Download completed - {d['filename']}")
        elif d['status'] == 'error':
            print(f"ERROR: Download failed - {d.get('error', 'Unknown error')}")
    
    def download(self, url: str, custom_filename: Optional[str] = None) -> Dict:
        """
        Download audio from URL.
        
        Args:
            url: Video URL to download
            custom_filename: Custom filename (optional)
            
        Returns:
            Dictionary with download results
        """
        try:
            logger.info(f"Starting download from: {url}")
            
            # Validate URL
            if not self.is_supported_url(url):
                raise ValueError(f"Unsupported URL or platform: {url}")
            
            print("PROGRESS: 5% - Extracting video information...")
            
            # Get video info first
            video_info = self.get_video_info(url)
            if not video_info:
                raise RuntimeError("Failed to extract video information")
            
            logger.info(f"Video info: {video_info['title']} by {video_info['artist']}")
            print(f"PROGRESS: 10% - Found: {video_info['title']}")
            
            # Set up filename and hierarchical directories
            if custom_filename:
                filename = self.sanitize_filename(custom_filename)
            else:
                filename = self.sanitize_filename(f"{video_info['artist']} - {video_info['title']}")

            artist_dir = self.sanitize_filename(video_info.get('artist', 'Unknown Artist'))
            title_dir = self.sanitize_filename(video_info.get('title', 'Unknown Title'))
            target_dir = self.output_dir / artist_dir / title_dir
            target_dir.mkdir(parents=True, exist_ok=True)

            # Update yt-dlp options with progress hook
            download_opts = self.ydl_opts.copy()
            download_opts['progress_hooks'] = [self.download_progress_hook]
            download_opts['outtmpl'] = str(target_dir / f"{filename}.%(ext)s")
            
            print("PROGRESS: 15% - Starting download...")
            
            # Download the audio
            with yt_dlp.YoutubeDL(download_opts) as ydl:
                try:
                    ydl.download([url])
                except Exception as e:
                    error_str = str(e)
                    # Check if it's just an FFmpeg issue but download might have succeeded
                    if 'ffmpeg' in error_str.lower() or 'ffprobe' in error_str.lower():
                        logger.warning(f"FFmpeg warning during download: {error_str}")
                        # Continue to check if file was downloaded anyway
                    else:
                        raise e
            
            # Find the downloaded file and ensure it exists
            output_pattern = f"{filename}.{self.format}"
            output_file = target_dir / output_pattern
            
            # Sometimes the extension might be different, so search for files
            if not output_file.exists():
                possible_files = list(target_dir.glob(f"{filename}.*"))
                if possible_files:
                    output_file = possible_files[0]
                    logger.info(f"Found alternative file: {output_file}")
                else:
                    # Search for any files with similar names (in case of title differences)
                    similar_files = []
                    # Try with video title
                    similar_files.extend(list(target_dir.glob(f"*{video_info['title'][:20]}*")))
                    # Try with sanitized filename
                    base_name = filename.split(' - ')[0] if ' - ' in filename else filename[:20]
                    similar_files.extend(list(target_dir.glob(f"*{base_name}*")))
                    
                    if similar_files:
                        # Pick the most recent file
                        output_file = max(similar_files, key=lambda f: f.stat().st_mtime)
                        logger.info(f"Found similar file: {output_file}")
                    else:
                        raise RuntimeError(f"Downloaded file not found. Expected: {output_pattern}")
            
            # Verify the file actually exists and has size
            if not output_file.exists():
                raise RuntimeError(f"Output file does not exist: {output_file}")
            
            file_size = output_file.stat().st_size
            if file_size == 0:
                raise RuntimeError(f"Downloaded file is empty: {output_file}")
            
            logger.info(f"Successfully verified downloaded file: {output_file} ({file_size / (1024*1024):.2f} MB)")
            
            print("PROGRESS: 95% - Finalizing...")
            
            # Create minimal metadata (no separate JSON file)
            metadata = {
                'url': url,
                'video_info': video_info,
                'download_settings': {
                    'quality': self.quality,
                    'format': self.format,
                    'output_dir': str(self.output_dir)
                },
                'final_directory': str(target_dir),
                'output_file': str(output_file),
                'file_size_mb': file_size / (1024 * 1024)
            }
            
            # Don't create separate JSON file - metadata is returned in response
            
            print("PROGRESS: 100% - Download complete!")
            print(f"SUCCESS: Successfully downloaded: {video_info['title']}")
            print(f"File saved to: {str(output_file)}")
            
            logger.info(f"Download completed successfully: {output_file}")
            
            return {
                'success': True,
                'output_file': str(output_file),
                'metadata': metadata,
                'video_info': video_info,
                'message': f"Successfully downloaded: {video_info['title']}"
            }
            
        except Exception as e:
            error_msg = f"Error downloading from {url}: {str(e)}"
            logger.error(error_msg)
            print(f"ERROR: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'url': url
            }
    
    def download_playlist(self, url: str, max_items: int = 50) -> List[Dict]:
        """
        Download multiple items from a playlist.
        
        Args:
            url: Playlist URL
            max_items: Maximum number of items to download
            
        Returns:
            List of download results
        """
        try:
            logger.info(f"Starting playlist download from: {url}")
            
            # Get playlist info
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                playlist_info = ydl.extract_info(url, download=False)
                
                if 'entries' not in playlist_info:
                    raise ValueError("Not a valid playlist URL")
                
                entries = playlist_info['entries'][:max_items]
                logger.info(f"Found {len(entries)} items in playlist")
            
            results = []
            for i, entry in enumerate(entries, 1):
                if entry:  # Some entries might be None
                    entry_url = entry.get('webpage_url') or entry.get('url')
                    if entry_url:
                        print(f"PROGRESS: Downloading item {i}/{len(entries)}")
                        result = self.download(entry_url)
                        results.append(result)
                        
                        if not result['success']:
                            logger.warning(f"Failed to download item {i}: {result.get('error')}")
            
            return results
            
        except Exception as e:
            error_msg = f"Error downloading playlist: {str(e)}"
            logger.error(error_msg)
            return [{
                'success': False,
                'error': error_msg,
                'url': url
            }]

def main():
    """Main function to run when script is called directly."""
    if len(sys.argv) < 3:
        print("Usage: python downloader.py <url> <output_dir> [quality] [format]")
        print("Example: python downloader.py 'https://youtube.com/watch?v=...' ./downloads 320 mp3")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else "320"
    format_type = sys.argv[4] if len(sys.argv) > 4 else "mp3"
    
    downloader = MusicDownloader(output_dir, quality, format_type)
    result = downloader.download(url)
    
    if result['success']:
        print(f"SUCCESS: {result['message']}")
        print(f"File saved to: {result['output_file']}")
        sys.exit(0)
    else:
        print(f"ERROR: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main() 