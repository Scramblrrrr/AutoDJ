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
    def __init__(self, output_dir: str = "./Library/Downloads", quality: str = "320", format: str = "wav"):
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
        
        # Configure yt-dlp options with better compatibility
        self.ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best[height<=720]',
            'outtmpl': str(self.output_dir / '%(title)s.%(ext)s'),
            'extractaudio': True,
            'audioformat': self.format,
            'audioquality': quality if quality != '320' else '0',
            'embed_subs': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'no_warnings': False,
            'ignoreerrors': False,
            'retries': 3,
            'fragment_retries': 3,
            'noplaylist': True,
            'prefer_ffmpeg': True,
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
            # Enhanced yt-dlp options for better title extraction
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'writeinfojson': False,
                'writesubtitles': False,
                'ignoreerrors': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Get the title with comprehensive fallbacks
                title = info.get('title', '')
                
                # Log the raw info for debugging
                print(f"DEBUG: Raw title from yt-dlp: '{title}'")
                print(f"DEBUG: Available title fields: {[k for k in info.keys() if 'title' in k.lower()]}")
                
                # If title is generic or contains YouTube artifacts, try alternatives
                if not title or 'youtube video #' in title.lower() or len(title) < 5:
                    print("DEBUG: Title appears generic, trying alternatives...")
                    # Try alternative title fields
                    alternatives = [
                        info.get('alt_title'),
                        info.get('display_title'), 
                        info.get('fulltitle'),
                        info.get('track'),
                        info.get('album'),
                    ]
                    
                    for alt in alternatives:
                        if alt and len(alt) > 5 and 'youtube video #' not in alt.lower():
                            print(f"DEBUG: Using alternative title: '{alt}'")
                            title = alt
                            break
                    
                    # If still no good title, try to extract from URL or description
                    if not title or title == 'Unknown Title':
                        # Try to extract from description or other fields
                        desc = info.get('description', '')
                        if desc and len(desc) > 10:
                            # Look for title patterns in description
                            import re
                            title_match = re.search(r'^([^-\n]+(?:-[^-\n]+)?)', desc.strip())
                            if title_match:
                                potential_title = title_match.group(1).strip()
                                if len(potential_title) > 5:
                                    print(f"DEBUG: Extracted from description: '{potential_title}'")
                                    title = potential_title
                        
                        # Final fallback
                        if not title or title == 'Unknown Title':
                            title = f"Track from {info.get('uploader', 'Unknown')}"
                
                # Get artist with fallbacks
                artist = (info.get('artist') or 
                         info.get('creator') or 
                         info.get('uploader') or 
                         'Unknown Artist')
                
                # Clean up artist if it's a channel name
                if artist and ('- Topic' in artist or 'VEVO' in artist):
                    artist = artist.replace('- Topic', '').replace('VEVO', '').strip()
                
                return {
                    'title': title,
                    'artist': artist,
                    'duration': info.get('duration', 0),
                    'duration_string': self._format_duration(info.get('duration', 0)),
                    'platform': self._get_platform(url),
                    'thumbnail': info.get('thumbnail'),
                    'view_count': info.get('view_count', 0),
                    'upload_date': info.get('upload_date', ''),
                    'description': info.get('description', ''),
                    'raw_info': {k: v for k, v in info.items() if k in ['title', 'alt_title', 'display_title', 'fulltitle', 'track', 'artist', 'creator', 'uploader']}
                }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error extracting video info: {error_msg}")
            
            # Try alternative extraction method for problematic URLs
            if 'format code' in error_msg or 'float' in error_msg:
                logger.info("Trying alternative extraction method...")
                try:
                    return self._extract_info_fallback(url)
                except:
                    pass
            
            return None
    
    def _extract_info_fallback(self, url: str) -> Optional[Dict]:
        """
        Fallback method for info extraction when primary method fails.
        Uses minimal yt-dlp options to avoid formatting errors.
        """
        try:
            minimal_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(minimal_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                title = info.get('title', 'Unknown Track')
                artist = info.get('uploader', 'Unknown Artist')
                
                # Clean up artist name
                if '- Topic' in artist:
                    artist = artist.replace('- Topic', '').strip()
                
                return {
                    'title': title,
                    'artist': artist,
                    'duration': 180,  # Default duration
                    'duration_string': "3:00",
                    'platform': self._get_platform(url),
                    'thumbnail': info.get('thumbnail'),
                    'view_count': 0,
                    'upload_date': '',
                    'description': info.get('description', ''),
                    'raw_info': {'title': title, 'uploader': artist}
                }
        except Exception as e:
            logger.error(f"Fallback extraction also failed: {str(e)}")
            return {
                'title': 'Unknown Track',
                'artist': 'Unknown Artist', 
                'duration': 180,
                'duration_string': "3:00",
                'platform': self._get_platform(url),
                'thumbnail': None,
                'view_count': 0,
                'upload_date': '',
                'description': '',
                'raw_info': {}
            }
    
    def _format_duration(self, seconds) -> str:
        """Format duration from seconds to MM:SS format."""
        if not seconds:
            return "0:00"
        
        # Convert to int to handle float values from yt-dlp
        seconds = int(float(seconds))
        
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
        """Sanitize filename to be safe for filesystem and remove YouTube artifacts."""
        # Remove YouTube artifacts and unwanted patterns
        filename = re.sub(r'youtube video #\w+', '', filename, flags=re.IGNORECASE)
        filename = re.sub(r'#\w+', '', filename)  # Remove any hash tags
        filename = re.sub(r'\s*\|\s*.+$', '', filename)  # Remove " | Channel Name" suffix
        filename = re.sub(r'\s*-\s*Topic$', '', filename, flags=re.IGNORECASE)  # Remove "- Topic"
        
        # Remove or replace problematic characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'[^\w\s\-_\.\(\)\[\]]', '', filename)  # Keep only safe characters
        filename = re.sub(r'\s+', ' ', filename).strip()
        
        # Remove leading/trailing underscores and dashes
        filename = filename.strip('_-').strip()
        
        # Ensure we have something
        if not filename or len(filename) < 2:
            filename = "downloaded_track"
            
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
            
            # Let yt-dlp generate the filename automatically for better compatibility
            print(f"PROGRESS: 12% - Using yt-dlp automatic filename generation")
            
            # Update yt-dlp options with progress hook and automatic filename
            download_opts = self.ydl_opts.copy()
            download_opts['progress_hooks'] = [self.download_progress_hook]
            # Use yt-dlp's default filename generation which works better
            download_opts['outtmpl'] = str(self.output_dir / "%(title)s.%(ext)s")
            
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
            
            # Find the downloaded file - look for the most recent file in the output directory
            # This is more reliable than trying to guess the exact filename
            existing_files = list(self.output_dir.glob(f"*.{self.format}"))
            if not existing_files:
                # Try other common extensions
                for ext in ['wav', 'mp3', 'flac', 'm4a']:
                    existing_files.extend(list(self.output_dir.glob(f"*.{ext}")))
            
            if existing_files:
                # Pick the most recently created file (most likely the one we just downloaded)
                output_file = max(existing_files, key=lambda f: f.stat().st_mtime)
                logger.info(f"Found downloaded file: {output_file}")
            else:
                raise RuntimeError(f"No downloaded file found in {self.output_dir}")
            
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
        print("Example: python downloader.py 'https://youtube.com/watch?v=...' ./downloads 320 wav")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else "320"
    format_type = sys.argv[4] if len(sys.argv) > 4 else "wav"
    
    downloader = MusicDownloader(output_dir, quality, format_type)
    result = downloader.download(url)
    
    if result['success']:
        print(f"SUCCESS: {result['message']}")
        print(f"File saved to: {result['output_file']}")
        # Output the complete result as JSON on the last line for parsing
        print(json.dumps(result))
        sys.exit(0)
    else:
        print(f"ERROR: {result['error']}")
        # Output the error result as JSON on the last line for parsing
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main() 