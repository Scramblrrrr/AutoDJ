#!/usr/bin/env python3
"""
Simplified but robust Demucs-based stem processor.
Uses the proven Demucs model with excellent error handling and progress feedback.
"""

print("IMMEDIATE TEST: Demucs processor starting...", flush=True)
print("PROGRESS: Script file loading started...", flush=True)
import sys
sys.stdout.flush()

print("PROGRESS: Basic imports loading...", flush=True)
sys.stdout.flush()

import os
import subprocess
import tempfile
import shutil
from pathlib import Path
import json
import logging
import time

print("PROGRESS: Loading audio processing libraries...", flush=True)
sys.stdout.flush()

import librosa
import soundfile as sf
import numpy as np
from typing import Dict

print("PROGRESS: Demucs libraries loaded successfully!", flush=True)
sys.stdout.flush()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("PROGRESS: All imports completed successfully!", flush=True)
sys.stdout.flush()

class DemucsSimpleProcessor:
    def __init__(self):
        """
        Initialize the robust Demucs processor.
        """
        self.supported_formats = ['.mp3', '.wav', '.flac', '.m4a', '.aac']
        print("PROGRESS: DemucsSimpleProcessor initialized", flush=True)
        sys.stdout.flush()
        
    def is_supported_format(self, file_path: str) -> bool:
        """Check if the file format is supported."""
        return Path(file_path).suffix.lower() in self.supported_formats

    def convert_to_analysis_wav(self, input_file: str) -> str:
        """Convert any audio file to a high quality WAV for analysis."""
        try:
            y, sr = librosa.load(input_file, sr=48000, mono=False)
            temp_wav = os.path.join(tempfile.gettempdir(), f"analysis_{Path(input_file).stem}.wav")
            sf.write(temp_wav, y.T if len(y.shape) > 1 else y, 48000)
            return temp_wav
        except Exception as e:
            logger.error(f"Conversion to analysis WAV failed: {e}")
            raise
    
    def run_demucs_separation(self, input_file: str, temp_dir: str) -> bool:
        """
        Run Demucs separation with robust error handling and progress feedback.
        """
        try:
            print("PROGRESS: 30% - Initializing Demucs model...", flush=True)
            sys.stdout.flush()
            
            # Demucs command with proper settings
            cmd = [
                'python', '-m', 'demucs.separate',
                '-n', 'htdemucs',
                '-o', temp_dir,
                '--filename', '{track}/{stem}.{ext}',
                input_file
            ]
            
            print("PROGRESS: 40% - Starting Demucs separation (this may take 2-5 minutes)...", flush=True)
            sys.stdout.flush()
            
            # Run Demucs with real-time output
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                universal_newlines=True
            )
            
            # Monitor progress
            start_time = time.time()
            last_progress_time = start_time
            
            # Read output line by line
            while True:
                output = process.stderr.readline()
                if output == '' and process.poll() is not None:
                    break
                    
                if output:
                    current_time = time.time()
                    elapsed = current_time - start_time
                    
                    # Parse Demucs percentage from output like "16%|#########3..."
                    output_str = output.strip()
                    if '%|' in output_str:
                        try:
                            percentage_str = output_str.split('%|')[0].strip()
                            # Handle decimal percentages
                            if '.' in percentage_str:
                                percentage = int(float(percentage_str))
                            else:
                                percentage = int(percentage_str)
                            
                            # Convert to our progress scale (40% = start of Demucs, 80% = end)
                            # Demucs goes 0-100%, we map it to 40-80% of our total progress
                            mapped_percentage = 40 + int(percentage * 0.4)
                            print(f"PROGRESS: {mapped_percentage}% - Demucs separation progress...", flush=True)
                            sys.stdout.flush()
                        except (ValueError, IndexError):
                            # If parsing fails, fall back to time-based updates
                            if current_time - last_progress_time >= 10:
                                minutes = int(elapsed // 60)
                                seconds = int(elapsed % 60)
                                print(f"PROGRESS: Demucs processing... {minutes}m {seconds}s elapsed", flush=True)
                                sys.stdout.flush()
                                last_progress_time = current_time
                    else:
                        # Send progress updates every 10 seconds if no percentage found
                        if current_time - last_progress_time >= 10:
                            minutes = int(elapsed // 60)
                            seconds = int(elapsed % 60)
                            print(f"PROGRESS: Demucs processing... {minutes}m {seconds}s elapsed", flush=True)
                            sys.stdout.flush()
                            last_progress_time = current_time
                    
                    # Log Demucs output
                    logger.info(f"Demucs: {output.strip()}")
            
            # Wait for completion
            return_code = process.wait()
            
            elapsed_total = time.time() - start_time
            minutes = int(elapsed_total // 60)
            seconds = int(elapsed_total % 60)
            
            if return_code == 0:
                print(f"PROGRESS: 80% - Demucs completed successfully in {minutes}m {seconds}s!", flush=True)
                sys.stdout.flush()
                return True
            else:
                error_output = process.stderr.read()
                logger.error(f"Demucs failed with return code {return_code}: {error_output}")
                return False
                
        except Exception as e:
            logger.error(f"Error running Demucs: {str(e)}")
            return False
    
    def find_and_organize_stems(self, temp_dir: str, input_file: str, output_dir: str) -> Dict[str, str]:
        """
        Find Demucs output files and organize them properly.
        """
        print("PROGRESS: 85% - Locating and organizing stem files...", flush=True)
        sys.stdout.flush()
        
        stem_files = {}
        base_name = Path(input_file).stem
        
        # Demucs creates output in: temp_dir/htdemucs/track_name/
        demucs_output_dir = None
        
        # Find the Demucs output directory
        for root, dirs, files in os.walk(temp_dir):
            if 'htdemucs' in root and files:
                demucs_output_dir = root
                break
        
        if not demucs_output_dir:
            raise FileNotFoundError("Demucs output directory not found")
        
        print(f"PROGRESS: Found Demucs output in: {demucs_output_dir}", flush=True)
        sys.stdout.flush()
        
        # Expected stem names from Demucs
        expected_stems = ['vocals', 'drums', 'bass', 'other']
        
        # Copy and rename stems to output directory
        for stem_name in expected_stems:
            source_file = os.path.join(demucs_output_dir, f"{stem_name}.wav")
            if os.path.exists(source_file):
                dest_file = os.path.join(output_dir, f"{base_name}_{stem_name}.wav")
                shutil.copy2(source_file, dest_file)
                stem_files[stem_name] = dest_file
                print(f"PROGRESS: Organized {stem_name} stem", flush=True)
                sys.stdout.flush()
            
        
        if len(stem_files) == 0:
            raise FileNotFoundError("No stem files found in Demucs output")
        
        return stem_files
    
    def enhance_stems_quality(self, stem_files: Dict[str, str]) -> Dict[str, str]:
        """
        Apply subtle enhancements to improve stem quality.
        """
        print("PROGRESS: 90% - Applying quality enhancements...", flush=True)
        sys.stdout.flush()
        
        enhanced_files = {}
        
        for stem_name, file_path in stem_files.items():
            try:
                # Load the stem
                audio, sr = librosa.load(file_path, sr=None, mono=False)
                
                # Apply stem-specific enhancements
                if stem_name == 'vocals':
                    # Subtle vocal enhancement: reduce low-end rumble
                    if len(audio.shape) == 1:
                        audio_filtered = librosa.effects.preemphasis(audio, coef=0.1)
                    else:
                        audio_filtered = np.array([librosa.effects.preemphasis(ch, coef=0.1) for ch in audio])
                    enhanced_audio = audio_filtered
                    
                elif stem_name == 'drums':
                    # Subtle drum enhancement: slight compression
                    enhanced_audio = np.tanh(audio * 1.1) / 1.1
                    
                elif stem_name == 'bass':
                    # Bass enhancement: slight warmth
                    enhanced_audio = audio * 1.05
                    
                else:  # other/instrumental
                    # Minimal processing for instrumental
                    enhanced_audio = audio
                
                # Save enhanced version
                enhanced_path = file_path.replace('.wav', '_enhanced.wav')
                sf.write(enhanced_path, enhanced_audio.T if len(enhanced_audio.shape) > 1 else enhanced_audio, sr)
                
                # Replace original with enhanced version
                os.replace(enhanced_path, file_path)
                enhanced_files[stem_name] = file_path
                
            except Exception as e:
                logger.warning(f"Enhancement failed for {stem_name}: {e}, using original")
                enhanced_files[stem_name] = file_path
        
        return enhanced_files
    
    def process_stems(self, input_file: str, output_dir: str) -> Dict:
        """
        Process audio file using Demucs with robust error handling.
        """
        try:
            print("PROGRESS: Entered Demucs process_stems method", flush=True)
            sys.stdout.flush()
            
            logger.info(f"Starting Demucs stem processing for: {input_file}")
            
            print(f"PROGRESS: Validating input file: {input_file}", flush=True)
            sys.stdout.flush()
            
            # Validate input file
            if not os.path.exists(input_file):
                raise FileNotFoundError(f"Input file not found: {input_file}")
            
            if not self.is_supported_format(input_file):
                raise ValueError(f"Unsupported format: {Path(input_file).suffix}")
            
            print("PROGRESS: File validation passed, creating output directory", flush=True)
            sys.stdout.flush()
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            print("PROGRESS: 10% - Loading audio file info...", flush=True)
            sys.stdout.flush()
            
            # Get audio info
            try:
                audio_info = librosa.get_duration(filename=input_file)
                sample_rate = librosa.get_samplerate(input_file)
                print(f"PROGRESS: Audio info: {audio_info:.1f}s at {sample_rate}Hz", flush=True)
                sys.stdout.flush()
            except Exception as e:
                logger.warning(f"Could not get audio info: {e}")
                audio_info = 0
                sample_rate = 44100
            
            print("PROGRESS: 20% - Creating temporary workspace...", flush=True)
            sys.stdout.flush()
            
            analysis_input = self.convert_to_analysis_wav(input_file)

            # Create temporary directory for Demucs
            with tempfile.TemporaryDirectory() as temp_dir:
                print(f"PROGRESS: Temporary directory: {temp_dir}", flush=True)
                sys.stdout.flush()

                # Run Demucs separation
                success = self.run_demucs_separation(analysis_input, temp_dir)
                
                if not success:
                    raise RuntimeError("Demucs separation failed")
                
                # Find and organize stems
                stem_files = self.find_and_organize_stems(temp_dir, input_file, output_dir)
                
                # Apply quality enhancements
                enhanced_stems = self.enhance_stems_quality(stem_files)
                
                print("PROGRESS: 95% - Finalizing stems...", flush=True)
                sys.stdout.flush()
                
                # Verify all stems were created
                missing_stems = []
                for stem_name in ['vocals', 'drums', 'bass', 'other']:
                    if stem_name not in enhanced_stems:
                        missing_stems.append(stem_name)
                
                if missing_stems:
                    logger.warning(f"Missing stems: {missing_stems}")
                
                print("PROGRESS: 100% - Demucs processing complete!", flush=True)
                sys.stdout.flush()
                
                result = {
                    'success': True,
                    'message': f'Successfully processed {len(enhanced_stems)} high-quality stems using Demucs for {Path(input_file).name}',
                    'stems': enhanced_stems,
                    'input_file': input_file,
                    'output_dir': output_dir,
                    'duration': audio_info,
                    'sample_rate': sample_rate,
                    'model_used': 'htdemucs'
                }
                
                logger.info(f"Demucs processing completed successfully: {len(enhanced_stems)} stems created")
                return result

        except Exception as e:
            error_msg = f"Error processing stems: {str(e)}"
            logger.error(error_msg)
            print(f"ERROR: {error_msg}", flush=True)
            sys.stdout.flush()
            return {
                'success': False,
                'error': error_msg,
                'input_file': input_file
            }

        finally:
            if os.path.exists(analysis_input):
                try:
                    os.remove(analysis_input)
                except Exception:
                    pass

def main():
    """Main function to run when script is called directly."""
    print("PROGRESS: Python script started", flush=True)
    sys.stdout.flush()
    
    if len(sys.argv) != 3:
        print("Usage: python stem_processor_demucs_simple.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    print(f"PROGRESS: Initializing DemucsSimpleProcessor...", flush=True)
    sys.stdout.flush()
    
    processor = DemucsSimpleProcessor()
    
    print(f"PROGRESS: Starting Demucs processing for: {input_file}", flush=True)
    sys.stdout.flush()
    
    result = processor.process_stems(input_file, output_dir)
    
    # Output result as JSON for Node.js to parse
    import json
    print(json.dumps(result), flush=True)
    sys.stdout.flush()
    
    if result['success']:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 