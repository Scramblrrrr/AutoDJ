#!/usr/bin/env python3
"""
Advanced spectral stem processor using librosa's source separation techniques.
Much better separation quality using harmonic-percussive decomposition and spectral analysis.
"""

print("IMMEDIATE TEST: Advanced spectral processor starting...", flush=True)
print("PROGRESS: Script file loading started...", flush=True)
import sys
sys.stdout.flush()

print("PROGRESS: Basic imports loading...", flush=True)
sys.stdout.flush()

import os
import tempfile
import shutil
from pathlib import Path
import json
import logging
import numpy as np
import soundfile as sf
from typing import Dict, List, Tuple

print("PROGRESS: Loading advanced audio processing libraries...", flush=True)
sys.stdout.flush()

import librosa
from scipy import signal
from scipy.ndimage import median_filter

print("PROGRESS: Advanced spectral analysis libraries loaded successfully!", flush=True)
sys.stdout.flush()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("PROGRESS: All imports completed successfully!", flush=True)
sys.stdout.flush()

class SpectralStemProcessor:
    def __init__(self):
        """
        Initialize the spectral stem processor using advanced librosa techniques.
        """
        self.supported_formats = ['.mp3', '.wav', '.flac', '.m4a', '.aac']
        print("PROGRESS: SpectralStemProcessor initialized", flush=True)
        sys.stdout.flush()
        
    def is_supported_format(self, file_path: str) -> bool:
        """Check if the file format is supported."""
        return Path(file_path).suffix.lower() in self.supported_formats
    
    def advanced_spectral_separation(self, audio: np.ndarray, sr: int) -> Dict[str, np.ndarray]:
        """
        Advanced spectral source separation using multiple librosa techniques.
        """
        print("PROGRESS: 20% - Computing spectral representation...", flush=True)
        sys.stdout.flush()
        
        # Ensure mono for spectral analysis, then reconstruct stereo
        if len(audio.shape) > 1:
            # Convert to mono for analysis
            y_mono = librosa.to_mono(audio)
            is_stereo = True
            original_audio = audio
        else:
            y_mono = audio
            is_stereo = False
            original_audio = audio
        
        print("PROGRESS: 30% - Harmonic-percussive separation...", flush=True)
        sys.stdout.flush()
        
        # Step 1: Harmonic-Percussive Separation
        # This separates harmonic content (vocals, bass, melody) from percussive (drums)
        y_harmonic, y_percussive = librosa.effects.hpss(y_mono, margin=3.0)
        
        print("PROGRESS: 40% - Extracting vocals using spectral subtraction...", flush=True)
        sys.stdout.flush()
        
        # Step 2: Vocal extraction using spectral features
        # Get the STFT for detailed frequency analysis
        stft = librosa.stft(y_mono, n_fft=2048, hop_length=512)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Vocal isolation: focus on center frequencies where vocals typically sit
        vocal_mask = self.create_vocal_mask(magnitude, sr)
        vocals_stft = stft * vocal_mask
        vocals = librosa.istft(vocals_stft, hop_length=512)
        
        # Ensure vocals match original length (STFT can change length)
        if len(vocals) != len(y_mono):
            min_len = min(len(vocals), len(y_mono))
            vocals = vocals[:min_len]
            y_mono = y_mono[:min_len]
        
        print("PROGRESS: 50% - Isolating bass frequencies...", flush=True)
        sys.stdout.flush()
        
        # Step 3: Bass extraction using frequency filtering and harmonic content
        bass = self.extract_bass(y_harmonic, sr)
        
        print("PROGRESS: 60% - Processing drum elements...", flush=True)
        sys.stdout.flush()
        
        # Step 4: Drum enhancement from percussive component
        drums = self.enhance_drums(y_percussive, sr)
        
        # Ensure all components match the mono audio length
        target_length = len(y_mono)
        bass = bass[:target_length]
        drums = drums[:target_length]
        
        print("PROGRESS: 70% - Creating instrumental/other content...", flush=True)
        sys.stdout.flush()
        
        # Step 5: Create instrumental by removing vocals and enhancing harmonic content
        instrumental = self.create_instrumental(y_mono, vocals, sr)
        
        print("PROGRESS: 80% - Reconstructing stereo field...", flush=True)
        sys.stdout.flush()
        
        # Step 6: Ensure all stems have the same length
        min_length = min(len(vocals), len(drums), len(bass), len(instrumental))
        vocals = vocals[:min_length]
        drums = drums[:min_length]
        bass = bass[:min_length]
        instrumental = instrumental[:min_length]
        
        print(f"PROGRESS: Stems normalized to {min_length} samples", flush=True)
        sys.stdout.flush()
        
        # Step 7: Reconstruct stereo field if original was stereo
        if is_stereo:
            stems = self.reconstruct_stereo({
                'vocals': vocals,
                'drums': drums,
                'bass': bass,
                'other': instrumental
            }, original_audio, sr)
        else:
            stems = {
                'vocals': vocals,
                'drums': drums,
                'bass': bass,
                'other': instrumental
            }
        
        return stems
    
    def create_vocal_mask(self, magnitude: np.ndarray, sr: int) -> np.ndarray:
        """
        Create a mask to isolate vocal frequencies using spectral characteristics.
        """
        # Vocals typically have strong harmonics in 80Hz-8kHz range
        # with particular strength in 200Hz-2kHz range
        freq_bins = magnitude.shape[0]
        freqs = librosa.fft_frequencies(sr=sr, n_fft=(freq_bins-1)*2)
        
        # Create frequency-based mask
        vocal_freq_mask = np.zeros_like(freqs, dtype=bool)
        vocal_freq_mask[(freqs >= 80) & (freqs <= 8000)] = True
        
        # Enhance vocal frequencies (200Hz-2kHz)
        vocal_enhance_mask = (freqs >= 200) & (freqs <= 2000)
        
        # Create time-frequency mask
        mask = np.ones_like(magnitude)
        
        # Apply frequency masking
        mask[~vocal_freq_mask, :] *= 0.3  # Reduce non-vocal frequencies
        mask[vocal_enhance_mask, :] *= 1.5  # Enhance vocal frequencies
        
        # Use median filtering to smooth the mask
        mask = median_filter(mask, size=(3, 3))
        
        # Ensure mask values are reasonable
        mask = np.clip(mask, 0.1, 2.0)
        
        return mask
    
    def extract_bass(self, harmonic_audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Extract bass using low-pass filtering and harmonic enhancement.
        """
        # Strong low-pass filter for bass (20Hz-250Hz)
        nyquist = sr // 2
        low_freq = 250 / nyquist
        
        # Design a sharp low-pass filter
        b, a = signal.butter(8, low_freq, btype='low')
        bass = signal.filtfilt(b, a, harmonic_audio)
        
        # Enhance bass using harmonic content
        bass *= 1.8
        
        # Apply gentle compression to even out bass response
        bass = np.tanh(bass * 2) / 2
        
        return bass
    
    def enhance_drums(self, percussive_audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Enhance drum content from percussive component.
        """
        # Drums typically have strong content in 60Hz-10kHz
        nyquist = sr // 2
        low_freq = 60 / nyquist
        high_freq = 10000 / nyquist
        
        # Band-pass filter for drum frequencies
        b, a = signal.butter(6, [low_freq, high_freq], btype='band')
        drums = signal.filtfilt(b, a, percussive_audio)
        
        # Enhance transients (drum hits)
        drums *= 1.5
        
        # Apply dynamic range compression for punchy drums
        drums = np.sign(drums) * np.power(np.abs(drums), 0.7)
        
        return drums
    
    def create_instrumental(self, original: np.ndarray, vocals: np.ndarray, sr: int) -> np.ndarray:
        """
        Create instrumental by spectral subtraction of vocals.
        """
        # Ensure arrays are the same length (STFT can change length slightly)
        min_length = min(len(original), len(vocals))
        original_trimmed = original[:min_length]
        vocals_trimmed = vocals[:min_length]
        
        # Simple spectral subtraction
        instrumental = original_trimmed - vocals_trimmed * 0.7
        
        # Enhance instrumental content in non-vocal frequencies
        nyquist = sr // 2
        
        # Boost instrument frequencies (avoid vocal range)
        low_freq = 20 / nyquist
        mid_low = 150 / nyquist
        mid_high = 3000 / nyquist
        high_freq = 12000 / nyquist
        
        # Filter different frequency bands
        b_low, a_low = signal.butter(4, [low_freq, mid_low], btype='band')
        b_high, a_high = signal.butter(4, [mid_high, high_freq], btype='band')
        
        instrumental_low = signal.filtfilt(b_low, a_low, instrumental) * 1.2
        instrumental_high = signal.filtfilt(b_high, a_high, instrumental) * 1.1
        
        # Combine enhanced instrumental
        instrumental = instrumental + instrumental_low * 0.3 + instrumental_high * 0.2
        
        return instrumental
    
    def reconstruct_stereo(self, mono_stems: Dict[str, np.ndarray], original_stereo: np.ndarray, sr: int) -> Dict[str, np.ndarray]:
        """
        Reconstruct stereo field for stems based on original stereo image.
        """
        if len(original_stereo.shape) < 2:
            return mono_stems
        
        left_channel = original_stereo[0]
        right_channel = original_stereo[1]
        
        # Analyze stereo field
        correlation = np.corrcoef(left_channel, right_channel)[0, 1]
        
        stereo_stems = {}
        for stem_name, mono_stem in mono_stems.items():
            if stem_name == 'vocals':
                # Vocals usually center - slight stereo width
                stereo_width = 0.8
                left = mono_stem * (1.0 + stereo_width * 0.1)
                right = mono_stem * (1.0 - stereo_width * 0.1)
            elif stem_name == 'drums':
                # Drums often have wide stereo image
                stereo_width = 1.2
                left = mono_stem * (1.0 + stereo_width * 0.2)
                right = mono_stem * (1.0 - stereo_width * 0.2)
            elif stem_name == 'bass':
                # Bass usually centered
                left = mono_stem
                right = mono_stem
            else:  # other/instrumental
                # Preserve some original stereo character
                left = mono_stem * 1.1
                right = mono_stem * 0.9
            
            stereo_stems[stem_name] = np.array([left, right])
        
        return stereo_stems
    
    def process_stems(self, input_file: str, output_dir: str) -> Dict:
        """
        Process a single audio file to extract stems using advanced spectral techniques.
        """
        try:
            print("PROGRESS: Entered process_stems method", flush=True)
            sys.stdout.flush()
            
            logger.info(f"Starting advanced spectral processing for: {input_file}")
            
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
            
            print("PROGRESS: 10% - Loading audio file...", flush=True)
            sys.stdout.flush()
            
            # Load audio file
            audio, sr = librosa.load(input_file, sr=None, mono=False)
            duration = len(audio) / sr if len(audio.shape) == 1 else len(audio[0]) / sr
            
            print(f"PROGRESS: Audio loaded: {duration:.1f}s at {sr}Hz", flush=True)
            sys.stdout.flush()
            
            # Perform advanced spectral separation
            stems = self.advanced_spectral_separation(audio, sr)
            
            print("PROGRESS: 90% - Saving stem files...", flush=True)
            sys.stdout.flush()
            
            # Save stems
            base_name = Path(input_file).stem
            stem_files = {}
            
            for stem_name, stem_audio in stems.items():
                output_file = os.path.join(output_dir, f"{base_name}_{stem_name}.wav")
                
                # Handle both mono and stereo stems
                if len(stem_audio.shape) > 1:
                    sf.write(output_file, stem_audio.T, sr)
                else:
                    sf.write(output_file, stem_audio, sr)
                
                stem_files[stem_name] = output_file
                print(f"PROGRESS: Saved {stem_name} stem", flush=True)
                sys.stdout.flush()
            
            print("PROGRESS: 100% - Advanced stem processing complete!", flush=True)
            sys.stdout.flush()
            
            result = {
                'success': True,
                'message': f'Successfully processed stems for {Path(input_file).name}',
                'stems': stem_files,
                'input_file': input_file,
                'output_dir': output_dir,
                'duration': duration,
                'sample_rate': sr
            }
            
            logger.info(f"Advanced spectral processing completed successfully: {len(stem_files)} stems created")
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

def main():
    """Main function to run when script is called directly."""
    print("PROGRESS: Python script started", flush=True)
    sys.stdout.flush()
    
    if len(sys.argv) != 3:
        print("Usage: python stem_processor_spectral.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    print(f"PROGRESS: Initializing SpectralStemProcessor...", flush=True)
    sys.stdout.flush()
    
    processor = SpectralStemProcessor()
    
    print(f"PROGRESS: Starting advanced spectral processing for: {input_file}", flush=True)
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