#!/usr/bin/env python3
"""
AutoDJ Track Analyzer
Professional-grade audio analysis for seamless DJ transitions
Analyzes tempo, key, vocal activity, and generates optimal cue points
"""

import os
import sys
import json
import numpy as np
import librosa
import soundfile as sf
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import essentia
    import essentia.standard as es
    ESSENTIA_AVAILABLE = True
    logger.info("Essentia available for advanced analysis")
except ImportError:
    ESSENTIA_AVAILABLE = False
    logger.warning("Essentia not available, using librosa fallbacks")

class AutoDJAnalyzer:
    """
    Professional Auto-DJ track analyzer for seamless mixing
    """
    
    def __init__(self):
        self.sample_rate = 44100
        self.hop_length = 512
        self.frame_length = 2048
        
        # Camelot wheel mapping for harmonic mixing
        self.camelot_wheel = {
            'C major': '8B', 'A minor': '8A',
            'G major': '9B', 'E minor': '9A', 
            'D major': '10B', 'B minor': '10A',
            'A major': '11B', 'F# minor': '11A',
            'E major': '12B', 'C# minor': '12A',
            'B major': '1B', 'G# minor': '1A',
            'F# major': '2B', 'D# minor': '2A',
            'Db major': '3B', 'Bb minor': '3A',
            'Ab major': '4B', 'F minor': '4A',
            'Eb major': '5B', 'C minor': '5A',
            'Bb major': '6B', 'G minor': '6A',
            'F major': '7B', 'D minor': '7A'
        }
        
        logger.info("AutoDJ Analyzer initialized")
    
    def analyze_track(self, audio_file: str, stems_dir: str = None) -> Dict:
        """
        Comprehensive track analysis for Auto-DJ mixing
        
        Args:
            audio_file: Path to main audio file
            stems_dir: Optional path to stems directory
            
        Returns:
            Complete analysis data structure
        """
        try:
            logger.info(f"Analyzing track: {audio_file}")
            
            # Load audio
            y, sr = librosa.load(audio_file, sr=self.sample_rate)
            duration = len(y) / sr
            
            logger.info(f"Loaded audio: {duration:.1f}s at {sr}Hz")
            
            # Core analysis
            analysis = {
                'file': audio_file,
                'duration': duration,
                'sample_rate': sr
            }
            
            # 1. Beat & Tempo Analysis
            logger.info("Analyzing tempo and beats...")
            beat_analysis = self._analyze_beats(y, sr)
            analysis.update(beat_analysis)
            
            # 2. Key Detection
            logger.info("Detecting musical key...")
            key_analysis = self._analyze_key(y, sr)
            analysis.update(key_analysis)
            
            # 3. Vocal Activity (using stems if available)
            logger.info("Analyzing vocal activity...")
            vocal_analysis = self._analyze_vocals(y, sr, stems_dir, os.path.basename(audio_file))
            analysis.update(vocal_analysis)
            
            # 4. Structure Analysis (intro/outro detection)
            logger.info("Analyzing track structure...")
            structure_analysis = self._analyze_structure(y, sr, analysis['beatgrid'])
            analysis.update(structure_analysis)
            
            # 5. Generate Cue Points
            logger.info("Generating optimal cue points...")
            cue_analysis = self._generate_cue_points(analysis)
            analysis.update(cue_analysis)
            
            # 6. Waveform Data for Visualization
            logger.info("Generating waveform visualization data...")
            waveform_data = self._generate_waveform_data(y, sr)
            analysis['waveform'] = waveform_data
            
            logger.info("Track analysis complete!")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing track {audio_file}: {str(e)}")
            logger.info("Returning fallback analysis...")
            return self._create_fallback_analysis(audio_file, str(e))
    
    def _analyze_beats(self, y: np.ndarray, sr: int) -> Dict:
        """
        Advanced beat and tempo analysis using librosa
        """
        try:
            # Tempo and beat tracking
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=self.hop_length)
            
            # Convert beat frames to timestamps
            beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=self.hop_length)
            
            # Detect downbeats (every 4 beats typically)
            downbeat_spacing = 4
            downbeats = beat_times[::downbeat_spacing]
            
            # Calculate beat intervals for consistency check
            beat_intervals = np.diff(beat_times)
            tempo_stability = 1.0 - (np.std(beat_intervals) / np.mean(beat_intervals))
            
            logger.info(f"Detected tempo: {tempo:.1f} BPM, {len(beat_times)} beats, stability: {tempo_stability:.2f}")
            
            return {
                'bpm': float(tempo),
                'tempo_stability': float(tempo_stability),
                'beatgrid': beat_times.tolist(),
                'downbeats': downbeats.tolist(),
                'beat_count': len(beat_times)
            }
            
        except Exception as e:
            logger.warning(f"Beat analysis failed: {e}")
            # Fallback: estimate from duration
            estimated_bpm = 120.0
            duration = len(y) / sr
            beat_interval = 60.0 / estimated_bpm
            beat_times = np.arange(0, duration, beat_interval)
            
            return {
                'bpm': estimated_bpm,
                'tempo_stability': 0.5,
                'beatgrid': beat_times.tolist(),
                'downbeats': beat_times[::4].tolist(),
                'beat_count': len(beat_times)
            }
    
    def _analyze_key(self, y: np.ndarray, sr: int) -> Dict:
        """
        Musical key detection using chroma features
        """
        try:
            if ESSENTIA_AVAILABLE:
                # Use Essentia for more accurate key detection
                return self._essentia_key_detection(y, sr)
            else:
                # Fallback to librosa chroma analysis
                return self._librosa_key_detection(y, sr)
                
        except Exception as e:
            logger.warning(f"Key detection failed: {e}")
            return {
                'key': 'Unknown',
                'camelot': 'Unknown',
                'key_confidence': 0.0
            }
    
    def _essentia_key_detection(self, y: np.ndarray, sr: int) -> Dict:
        """
        Key detection using Essentia (more accurate)
        """
        try:
            # Convert to Essentia format
            audio_essentia = es.MonoLoader(filename='', sampleRate=sr)(y.astype(np.float32))
            
            # Key detection
            key_extractor = es.KeyExtractor()
            key, scale, strength = key_extractor(audio_essentia)
            
            # Format key name
            key_name = f"{key} {scale}"
            camelot = self.camelot_wheel.get(key_name, 'Unknown')
            
            logger.info(f"Detected key: {key_name} (Camelot: {camelot}, confidence: {strength:.2f})")
            
            return {
                'key': key_name,
                'camelot': camelot,
                'key_confidence': float(strength)
            }
            
        except Exception as e:
            logger.warning(f"Essentia key detection failed: {e}")
            return self._librosa_key_detection(y, sr)
    
    def _librosa_key_detection(self, y: np.ndarray, sr: int) -> Dict:
        """
        Key detection using librosa chroma features (fallback)
        """
        try:
            # Chroma features
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            chroma_mean = np.mean(chroma, axis=1)
            
            # Simple key detection based on strongest chroma
            key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            key_idx = np.argmax(chroma_mean)
            detected_key = key_names[key_idx]
            
            # Estimate major/minor (simplified)
            major_profile = np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1])
            minor_profile = np.array([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0])
            
            # Rotate profiles to match detected key
            major_rotated = np.roll(major_profile, key_idx)
            minor_rotated = np.roll(minor_profile, key_idx)
            
            major_score = np.corrcoef(chroma_mean, major_rotated)[0, 1]
            minor_score = np.corrcoef(chroma_mean, minor_rotated)[0, 1]
            
            if major_score > minor_score:
                key_name = f"{detected_key} major"
                confidence = major_score
            else:
                key_name = f"{detected_key} minor"
                confidence = minor_score
            
            camelot = self.camelot_wheel.get(key_name, 'Unknown')
            
            logger.info(f"Detected key: {key_name} (Camelot: {camelot}, confidence: {confidence:.2f})")
            
            return {
                'key': key_name,
                'camelot': camelot,
                'key_confidence': float(confidence) if not np.isnan(confidence) else 0.5
            }
            
        except Exception as e:
            logger.warning(f"Librosa key detection failed: {e}")
            return {
                'key': 'C major',
                'camelot': '8B',
                'key_confidence': 0.5
            }
    
    def _analyze_vocals(self, y: np.ndarray, sr: int, stems_dir: str, filename: str) -> Dict:
        """
        Analyze vocal activity using stem separation if available
        """
        try:
            vocal_segments = []
            
            if stems_dir and os.path.exists(stems_dir):
                # Try to find vocal stem
                base_name = os.path.splitext(filename)[0]
                vocal_patterns = [
                    os.path.join(stems_dir, f"{base_name}_vocals.wav"),
                    os.path.join(stems_dir, f"{base_name}", "vocals.wav"),
                    os.path.join(stems_dir, "vocals.wav")
                ]
                
                vocal_file = None
                for pattern in vocal_patterns:
                    if os.path.exists(pattern):
                        vocal_file = pattern
                        break
                
                if vocal_file:
                    logger.info(f"Using vocal stem: {vocal_file}")
                    vocal_y, _ = librosa.load(vocal_file, sr=sr)
                    vocal_segments = self._detect_vocal_segments(vocal_y, sr)
                else:
                    logger.info("No vocal stem found, using main audio for vocal detection")
                    vocal_segments = self._detect_vocal_segments_from_main(y, sr)
            else:
                logger.info("No stems directory, using main audio for vocal detection")
                vocal_segments = self._detect_vocal_segments_from_main(y, sr)
            
            return {
                'vocals': vocal_segments,
                'vocal_coverage': sum(seg['end'] - seg['start'] for seg in vocal_segments)
            }
            
        except Exception as e:
            logger.warning(f"Vocal analysis failed: {e}")
            return {
                'vocals': [],
                'vocal_coverage': 0.0
            }
    
    def _detect_vocal_segments(self, vocal_y: np.ndarray, sr: int, window_size: float = 1.0) -> List[Dict]:
        """
        Detect vocal segments from vocal stem using RMS energy
        """
        try:
            # Calculate RMS energy in windows
            hop_length = int(sr * window_size)
            rms = librosa.feature.rms(y=vocal_y, hop_length=hop_length)[0]
            
            # Threshold for vocal activity (adjust based on testing)
            threshold = np.percentile(rms, 75)  # Use 75th percentile as threshold
            
            # Find segments above threshold
            vocal_active = rms > threshold
            
            # Convert to time segments
            segments = []
            in_segment = False
            start_time = 0
            
            for i, active in enumerate(vocal_active):
                time = i * window_size
                
                if active and not in_segment:
                    # Start of vocal segment
                    start_time = time
                    in_segment = True
                elif not active and in_segment:
                    # End of vocal segment
                    if time - start_time > 2.0:  # Minimum 2 second segments
                        segments.append({
                            'start': start_time,
                            'end': time
                        })
                    in_segment = False
            
            # Close final segment if needed
            if in_segment:
                segments.append({
                    'start': start_time,
                    'end': len(vocal_y) / sr
                })
            
            logger.info(f"Detected {len(segments)} vocal segments")
            return segments
            
        except Exception as e:
            logger.warning(f"Vocal segment detection failed: {e}")
            return []
    
    def _detect_vocal_segments_from_main(self, y: np.ndarray, sr: int) -> List[Dict]:
        """
        Estimate vocal segments from main audio using spectral features
        """
        try:
            # Use spectral centroid and MFCC to estimate vocal presence
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Vocal frequency range typically has higher spectral centroid
            # and specific MFCC patterns
            vocal_indicator = spectral_centroids * np.mean(mfccs[1:4], axis=0)
            
            # Smooth and threshold
            from scipy import ndimage
            vocal_smooth = ndimage.gaussian_filter1d(vocal_indicator, sigma=2)
            threshold = np.percentile(vocal_smooth, 70)
            
            # Convert to segments (simplified)
            hop_length = 512
            times = librosa.frames_to_time(np.arange(len(vocal_smooth)), sr=sr, hop_length=hop_length)
            
            segments = []
            in_segment = False
            start_time = 0
            
            for i, (time, value) in enumerate(zip(times, vocal_smooth)):
                if value > threshold and not in_segment:
                    start_time = time
                    in_segment = True
                elif value <= threshold and in_segment:
                    if time - start_time > 3.0:  # Minimum 3 seconds for main audio
                        segments.append({
                            'start': start_time,
                            'end': time
                        })
                    in_segment = False
            
            if in_segment:
                segments.append({
                    'start': start_time,
                    'end': len(y) / sr
                })
            
            logger.info(f"Estimated {len(segments)} vocal segments from main audio")
            return segments
            
        except Exception as e:
            logger.warning(f"Main audio vocal detection failed: {e}")
            return []
    
    def _analyze_structure(self, y: np.ndarray, sr: int, beatgrid: List[float]) -> Dict:
        """
        Analyze track structure to identify intro, outro, and energy sections
        """
        try:
            duration = len(y) / sr
            
            # Calculate RMS energy over time
            hop_length = 1024
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
            times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)
            
            # Smooth RMS for structure analysis
            from scipy import ndimage
            rms_smooth = ndimage.gaussian_filter1d(rms, sigma=3)
            
            # Detect intro (low energy start)
            intro_threshold = np.percentile(rms_smooth, 40)
            intro_end = 0
            
            for i, (time, energy) in enumerate(zip(times, rms_smooth)):
                if energy > intro_threshold and time > 5.0:  # Must be at least 5s
                    intro_end = time
                    break
            
            # Limit intro to reasonable length
            intro_end = min(intro_end, 32.0)  # Max 32 second intro
            
            # Detect outro (low energy end, going backwards)
            outro_start = duration
            for i in range(len(rms_smooth) - 1, -1, -1):
                time = times[i]
                energy = rms_smooth[i]
                if energy > intro_threshold and (duration - time) > 5.0:
                    outro_start = time
                    break
            
            # Limit outro
            outro_start = max(outro_start, duration - 32.0)  # Max 32 second outro
            
            # Find energy peaks (potential drops/builds)
            energy_peaks = []
            peak_threshold = np.percentile(rms_smooth, 85)
            
            for i, (time, energy) in enumerate(zip(times, rms_smooth)):
                if energy > peak_threshold:
                    energy_peaks.append(time)
            
            logger.info(f"Structure: intro=0-{intro_end:.1f}s, outro={outro_start:.1f}s-{duration:.1f}s")
            
            return {
                'intro': {
                    'start': 0.0,
                    'end': intro_end
                },
                'outro': {
                    'start': outro_start,
                    'end': duration
                },
                'energy_peaks': energy_peaks[:10]  # Limit to 10 peaks
            }
            
        except Exception as e:
            logger.warning(f"Structure analysis failed: {e}")
            duration = len(y) / sr
            return {
                'intro': {'start': 0.0, 'end': 8.0},
                'outro': {'start': max(0, duration - 16.0), 'end': duration},
                'energy_peaks': []
            }
    
    def _generate_cue_points(self, analysis: Dict) -> Dict:
        """
        Generate optimal cue-in and cue-out points for DJ mixing
        """
        try:
            duration = analysis['duration']
            beatgrid = analysis['beatgrid']
            vocals = analysis['vocals']
            intro = analysis['intro']
            outro = analysis['outro']
            
            # Cue In: First good mixing point after intro
            cue_in = intro['end']
            
            # Align to nearest beat
            if beatgrid:
                beat_diffs = [abs(beat - cue_in) for beat in beatgrid if beat >= cue_in]
                if beat_diffs:
                    min_idx = beat_diffs.index(min(beat_diffs))
                    cue_in = [beat for beat in beatgrid if beat >= cue_in][min_idx]
            
            # Cue Out: Last good mixing point before outro, avoiding vocals
            cue_out = outro['start']
            
            # Avoid vocal sections for cue out
            for vocal in reversed(vocals):  # Check from end
                if vocal['end'] < cue_out:
                    # Find a gap after this vocal
                    potential_cue = vocal['end'] + 2.0  # 2 second buffer
                    if potential_cue < outro['start']:
                        cue_out = potential_cue
                        break
            
            # Align cue out to beat
            if beatgrid:
                beat_diffs = [abs(beat - cue_out) for beat in beatgrid if beat <= cue_out]
                if beat_diffs:
                    min_idx = beat_diffs.index(min(beat_diffs))
                    cue_out = [beat for beat in beatgrid if beat <= cue_out][min_idx]
            
            # Ensure reasonable cue points
            cue_in = max(0, min(cue_in, duration * 0.3))  # Max 30% into track
            cue_out = max(duration * 0.7, min(cue_out, duration))  # Min 70% into track
            
            logger.info(f"Generated cue points: in={cue_in:.1f}s, out={cue_out:.1f}s")
            
            return {
                'cue_in': cue_in,
                'cue_out': cue_out,
                'mix_length': max(8.0, (cue_out - cue_in) * 0.1)  # Suggested mix length
            }
            
        except Exception as e:
            logger.warning(f"Cue point generation failed: {e}")
            duration = analysis.get('duration', 180)
            return {
                'cue_in': 8.0,
                'cue_out': max(duration - 16.0, 60.0),
                'mix_length': 8.0
            }
    
    def _generate_waveform_data(self, y: np.ndarray, sr: int, points: int = 2000) -> Dict:
        """
        Generate multi-color waveform data for visualization
        """
        try:
            # Downsample for visualization
            hop_length = len(y) // points
            if hop_length < 1:
                hop_length = 1
            
            # Extract frequency bands using STFT
            stft = librosa.stft(y, hop_length=hop_length, n_fft=2048)
            magnitude = np.abs(stft)
            
            # Define frequency bands (bass, mid, treble)
            freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
            bass_idx = np.where(freqs <= 250)[0]
            mid_idx = np.where((freqs > 250) & (freqs <= 4000))[0]
            treble_idx = np.where(freqs > 4000)[0]
            
            # Calculate energy in each band
            bass_energy = np.mean(magnitude[bass_idx], axis=0)
            mid_energy = np.mean(magnitude[mid_idx], axis=0)
            treble_energy = np.mean(magnitude[treble_idx], axis=0)
            
            # Normalize
            max_energy = max(np.max(bass_energy), np.max(mid_energy), np.max(treble_energy))
            if max_energy > 0:
                bass_energy /= max_energy
                mid_energy /= max_energy
                treble_energy /= max_energy
            
            # Time points
            times = librosa.frames_to_time(np.arange(len(bass_energy)), sr=sr, hop_length=hop_length)
            
            return {
                'times': times.tolist(),
                'bass': bass_energy.tolist(),
                'mid': mid_energy.tolist(),
                'treble': treble_energy.tolist()
            }
            
        except Exception as e:
            logger.warning(f"Waveform generation failed: {e}")
            # Fallback: simple RMS waveform
            hop_length = len(y) // points
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
            times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)
            
            return {
                'times': times.tolist(),
                'bass': (rms * 0.8).tolist(),
                'mid': rms.tolist(),
                'treble': (rms * 0.6).tolist()
            }
    
    def _create_fallback_analysis(self, audio_file: str, error: str) -> Dict:
        """
        Create minimal analysis when full analysis fails
        """
        return {
            'file': audio_file,
            'error': error,
            'duration': 180.0,
            'bpm': 120.0,
            'key': 'C major',
            'camelot': '8B',
            'beatgrid': list(np.arange(0, 180, 0.5)),
            'vocals': [],
            'cue_in': 8.0,
            'cue_out': 164.0,
            'intro': {'start': 0.0, 'end': 8.0},
            'outro': {'start': 164.0, 'end': 180.0}
        }

def main():
    """
    Command line interface for track analysis
    """
    try:
        if len(sys.argv) < 2:
            logger.error("Insufficient arguments provided")
            fallback_analysis = {
                'file': 'unknown',
                'error': 'Insufficient arguments: Usage: python autodj_analyzer.py <audio_file> [stems_dir]',
                'duration': 180.0,
                'bpm': 120.0,
                'key': 'C major',
                'camelot': '8B',
                'beatgrid': list(np.arange(0, 180, 0.5)),
                'vocals': [],
                'cue_in': 8.0,
                'cue_out': 164.0,
                'intro': {'start': 0.0, 'end': 8.0},
                'outro': {'start': 164.0, 'end': 180.0}
            }
            print(json.dumps(fallback_analysis, indent=2))
            return
        
        audio_file = sys.argv[1]
        stems_dir = sys.argv[2] if len(sys.argv) > 2 else None
        
        if not os.path.exists(audio_file):
            logger.error(f"Audio file not found: {audio_file}")
            fallback_analysis = {
                'file': audio_file,
                'error': f'Audio file not found: {audio_file}',
                'duration': 180.0,
                'bpm': 120.0,
                'key': 'C major',
                'camelot': '8B',
                'beatgrid': list(np.arange(0, 180, 0.5)),
                'vocals': [],
                'cue_in': 8.0,
                'cue_out': 164.0,
                'intro': {'start': 0.0, 'end': 8.0},
                'outro': {'start': 164.0, 'end': 180.0}
            }
            print(json.dumps(fallback_analysis, indent=2))
            return
        
        analyzer = AutoDJAnalyzer()
        analysis = analyzer.analyze_track(audio_file, stems_dir)
        
        # Output analysis as JSON
        print(json.dumps(analysis, indent=2))
        
    except Exception as e:
        logger.error(f"Fatal error in main: {str(e)}")
        # Return fallback analysis even on fatal errors
        fallback_analysis = {
            'file': sys.argv[1] if len(sys.argv) > 1 else 'unknown',
            'error': f"Fatal analysis error: {str(e)}",
            'duration': 180.0,
            'bpm': 120.0,
            'key': 'C major',
            'camelot': '8B',
            'beatgrid': list(np.arange(0, 180, 0.5)),
            'vocals': [],
            'cue_in': 8.0,
            'cue_out': 164.0,
            'intro': {'start': 0.0, 'end': 8.0},
            'outro': {'start': 164.0, 'end': 180.0}
        }
        print(json.dumps(fallback_analysis, indent=2))

if __name__ == "__main__":
    main() 