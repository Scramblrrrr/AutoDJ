#!/usr/bin/env python3
"""
Stem processor using Meta's Demucs for audio source separation.
This script processes audio files and separates them into stems (vocals, drums, bass, other).
"""

print("IMMEDIATE TEST: Can you see this output?", flush=True)
print("PROGRESS: Script file loading started...", flush=True)
import sys

print("PROGRESS: Basic imports loading...")
sys.stdout.flush()

import os
import subprocess
import tempfile
import shutil
from pathlib import Path
import json

print("PROGRESS: Loading heavy AI libraries (this may take 30-60 seconds)...")
sys.stdout.flush()

import librosa
print("PROGRESS: librosa loaded")
sys.stdout.flush()

import numpy as np
print("PROGRESS: numpy loaded")
sys.stdout.flush()

from typing import Dict, List, Tuple
import logging

print("PROGRESS: All imports completed successfully!")
sys.stdout.flush()

# Additional imports for webm conversion
print("PROGRESS: Loading pydub...")
sys.stdout.flush()

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
    print("PROGRESS: pydub loaded successfully")
    sys.stdout.flush()
except ImportError:
    PYDUB_AVAILABLE = False
    print("PROGRESS: pydub not available (skipping)")
    sys.stdout.flush()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("PROGRESS: Logging configured, script initialization complete!")
sys.stdout.flush()

class StemProcessor:
    def __init__(self, model_name: str = "htdemucs"):
        """
        Initialize the stem processor.
        
        Args:
            model_name: The demucs model to use (htdemucs, hdemucs, etc.)
        """
        self.model_name = model_name
        self.supported_formats = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.webm']
        
    def convert_webm_to_wav(self, input_file: str, output_file: str) -> bool:
        """
        Convert webm file to wav format for Demucs processing.
        
        Args:
            input_file: Path to webm file
            output_file: Path for output wav file
            
        Returns:
            True if conversion successful, False otherwise
        """
        try:
            if not PYDUB_AVAILABLE:
                logger.warning("pydub not available for webm conversion")
                return self._convert_with_librosa(input_file, output_file)
                
            logger.info("Converting webm to wav using pydub...")
            print("PROGRESS: 6% - Loading webm file...")
            
            # Check input file size
            input_size = os.path.getsize(input_file) / (1024 * 1024)  # MB
            logger.info(f"Input file size: {input_size:.2f} MB")
            print(f"PROGRESS: 7% - Processing {input_size:.1f}MB webm file...")
            
            try:
                # Load the audio file
                audio = AudioSegment.from_file(input_file)
                logger.info(f"Audio loaded: {len(audio)}ms duration, {audio.frame_rate}Hz")
                print("PROGRESS: 8% - Converting to wav format...")
                
                # Export to wav
                audio.export(output_file, format="wav")
                
                # Verify output file
                if os.path.exists(output_file):
                    output_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
                    logger.info(f"Successfully converted {input_file} to {output_file} ({output_size:.2f} MB)")
                    print("PROGRESS: 9% - Conversion complete!")
                    return True
                else:
                    logger.error("Output file was not created")
                    return False
                    
            except Exception as pydub_error:
                logger.warning(f"pydub conversion failed: {pydub_error}")
                print("PROGRESS: 7% - pydub failed, trying librosa...")
                return self._convert_with_librosa(input_file, output_file)
                
        except Exception as e:
            logger.error(f"Error converting webm to wav: {str(e)}")
            print(f"ERROR: WebM conversion failed: {str(e)}")
            return False

    def convert_to_wav(self, input_file: str, output_file: str, sample_rate: int = 44100) -> bool:
        """Convert any supported audio file to WAV format."""
        try:
            if PYDUB_AVAILABLE:
                audio = AudioSegment.from_file(input_file)
                audio = audio.set_frame_rate(sample_rate).set_channels(2)
                audio.export(output_file, format="wav")
                return os.path.exists(output_file)
            else:
                y, sr = librosa.load(input_file, sr=sample_rate, mono=False)
                import soundfile as sf
                sf.write(output_file, y.T if y.ndim > 1 else y, sample_rate)
                return os.path.exists(output_file)
        except Exception as e:
            logger.error(f"Failed to convert {input_file} to wav: {e}")
            return False
    
    def _convert_with_librosa(self, input_file: str, output_file: str) -> bool:
        """
        Fallback conversion using librosa (doesn't require FFmpeg for some formats).
        """
        try:
            logger.info("Attempting conversion with librosa...")
            print("PROGRESS: 7% - Trying librosa conversion...")
            
            # Try to load with librosa 
            y, sr = librosa.load(input_file, sr=None)
            
            if len(y) > 0:
                logger.info(f"Loaded audio: {len(y)} samples at {sr}Hz")
                print("PROGRESS: 8% - Saving as wav...")
                
                # Save as wav using soundfile
                import soundfile as sf
                sf.write(output_file, y, sr)
                
                if os.path.exists(output_file):
                    output_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
                    logger.info(f"Successfully converted with librosa: {output_size:.2f} MB")
                    print("PROGRESS: 9% - Librosa conversion complete!")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Librosa conversion failed: {e}")
            print(f"PROGRESS: 7% - Librosa conversion failed: {e}")
            return False
    
    def is_supported_format(self, file_path: str) -> bool:
        """Check if the file format is supported."""
        return Path(file_path).suffix.lower() in self.supported_formats
    
    def get_audio_info(self, file_path: str) -> Dict:
        """Get basic information about the audio file."""
        try:
            y, sr = librosa.load(file_path, sr=None)
            duration = len(y) / sr
            
            return {
                'duration': duration,
                'sample_rate': sr,
                'channels': 1 if len(y.shape) == 1 else y.shape[0],
                'format': Path(file_path).suffix.lower(),
                'size_mb': os.path.getsize(file_path) / (1024 * 1024)
            }
        except Exception as e:
            logger.error(f"Error getting audio info for {file_path}: {str(e)}")
            return {}
    
    def process_stems(self, input_file: str, output_dir: str) -> Dict:
        """
        Process a single audio file to extract stems.
        
        Args:
            input_file: Path to the input audio file
            output_dir: Directory to save the separated stems
            
        Returns:
            Dictionary with processing results and stem file paths
        """
        try:
            print("PROGRESS: Entered process_stems method")
            sys.stdout.flush()
            
            logger.info(f"Starting stem processing for: {input_file}")
            
            print(f"PROGRESS: Validating input file: {input_file}")
            sys.stdout.flush()
            
            # Validate input file
            if not os.path.exists(input_file):
                raise FileNotFoundError(f"Input file not found: {input_file}")
            
            if not self.is_supported_format(input_file):
                raise ValueError(f"Unsupported format: {Path(input_file).suffix}")
            
            print("PROGRESS: File validation passed, creating output directory")
            sys.stdout.flush()
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Handle conversion to wav for consistent processing
            actual_input_file = input_file
            temp_wav_file = None

            # Convert other formats or resample if needed
            if Path(actual_input_file).suffix.lower() != '.wav':
                if not temp_wav_file:
                    temp_wav_file = os.path.join(tempfile.gettempdir(), f"temp_{Path(input_file).stem}.wav")
                if self.convert_to_wav(actual_input_file, temp_wav_file):
                    actual_input_file = temp_wav_file
            
            
            # Get audio info (use original file for metadata)
            audio_info = self.get_audio_info(input_file)
            logger.info(f"Audio info: {audio_info}")
            
            print("PROGRESS: 10% - Initializing demucs...")
            
            # Create temporary directory for demucs output
            with tempfile.TemporaryDirectory() as temp_dir:
                # Run demucs separation  
                cmd = [
                    'python', '-m', 'demucs.separate',
                    '-n', self.model_name,
                    '-o', temp_dir,
                    '--filename', '{track}/{stem}.{ext}',
                    actual_input_file  # Don't quote - subprocess handles it properly
                ]
                
                print("PROGRESS: 20% - Running stem separation...")
                logger.info(f"Running command: {' '.join(cmd)}")
                
                process = subprocess.Popen(
                    cmd, 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    universal_newlines=True
                )
                
                # Monitor progress
                progress_steps = [30, 50, 70, 85, 95]
                step_index = 0
                
                while True:
                    output = process.stdout.readline()
                    if output == '' and process.poll() is not None:
                        break
                    if output:
                        logger.info(f"Demucs output: {output.strip()}")
                        
                        # Update progress
                        if step_index < len(progress_steps):
                            print(f"PROGRESS: {progress_steps[step_index]}% - Processing...")
                            step_index += 1
                
                rc = process.poll()
                if rc != 0:
                    error_output = process.stderr.read()
                    raise RuntimeError(f"Demucs failed with return code {rc}: {error_output}")
                
                print("PROGRESS: 98% - Organizing output files...")
                
                # Find the output directory (demucs creates subdirectories)
                model_output_dir = os.path.join(temp_dir, self.model_name)
                
                # List all directories in the model output directory
                if not os.path.exists(model_output_dir):
                    raise RuntimeError(f"Demucs model output directory not found: {model_output_dir}")
                
                # Find the actual track directory (demucs might name it differently)
                track_dirs = [d for d in os.listdir(model_output_dir) if os.path.isdir(os.path.join(model_output_dir, d))]
                
                if not track_dirs:
                    raise RuntimeError(f"No track directories found in: {model_output_dir}")
                
                # Use the first (should be only) track directory
                actual_track_name = track_dirs[0]
                demucs_output_dir = os.path.join(model_output_dir, actual_track_name)
                
                logger.info(f"Found demucs output directory: {demucs_output_dir}")
                print(f"PROGRESS: Found stems in: {actual_track_name}")
                
                # Expected stem names from demucs
                stem_names = ['vocals', 'drums', 'bass', 'other']
                stem_files = {}
                
                # Copy and organize stem files
                original_track_name = Path(input_file).stem
                
                for stem in stem_names:
                    stem_pattern = f"{stem}.wav"  # Demucs outputs wav files
                    source_path = os.path.join(demucs_output_dir, stem_pattern)
                    
                    if os.path.exists(source_path):
                        # Create organized output path using original filename
                        output_filename = f"{original_track_name}_{stem}.wav"
                        output_path = os.path.join(output_dir, output_filename)
                        
                        # Copy file
                        shutil.copy2(source_path, output_path)
                        stem_files[stem] = output_path
                        
                        logger.info(f"Stem saved: {stem} -> {output_path}")
                        print(f"PROGRESS: Extracted {stem} stem")
                    else:
                        logger.warning(f"Stem file not found: {source_path}")
                        
                        # List available files for debugging
                        if os.path.exists(demucs_output_dir):
                            available_files = os.listdir(demucs_output_dir)
                            logger.warning(f"Available files in {demucs_output_dir}: {available_files}")
                
                print("PROGRESS: 100% - Processing complete!")
                
                # Create metadata file
                metadata = {
                    'original_file': input_file,
                    'processing_model': self.model_name,
                    'audio_info': audio_info,
                    'stems': stem_files,
                    'timestamp': str(np.datetime64('now'))
                }
                
                metadata_path = os.path.join(output_dir, f"{original_track_name}_metadata.json")
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                logger.info(f"Processing completed successfully. Stems saved to: {output_dir}")
                
                return {
                    'success': True,
                    'stems': stem_files,
                    'metadata': metadata,
                    'message': f"Successfully processed {len(stem_files)} stems from {Path(input_file).name}"
                }
                
        except Exception as e:
            error_msg = f"Error processing stems: {str(e)}"
            logger.error(error_msg)
            print(f"ERROR: {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'input_file': input_file
            }
        
        finally:
            # Clean up temporary wav file if created
            if temp_wav_file and os.path.exists(temp_wav_file):
                try:
                    os.remove(temp_wav_file)
                    logger.info(f"Cleaned up temporary file: {temp_wav_file}")
                except Exception as e:
                    logger.warning(f"Could not clean up temporary file {temp_wav_file}: {e}")

def main():
    """Main function to run when script is called directly."""
    print("PROGRESS: Python script started")
    sys.stdout.flush()
    
    if len(sys.argv) != 3:
        print("Usage: python stem_processor.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    print(f"PROGRESS: Initializing StemProcessor...")
    sys.stdout.flush()
    
    processor = StemProcessor()
    
    print(f"PROGRESS: Starting stem processing for: {input_file}")
    sys.stdout.flush()
    
    result = processor.process_stems(input_file, output_dir)
    
    if result['success']:
        print(f"SUCCESS: {result['message']}")
        sys.exit(0)
    else:
        print(f"ERROR: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main() 