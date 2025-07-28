#!/usr/bin/env python3
"""
AutoDJ Transition Engine
Professional transition logic for seamless DJ mixing
Handles beatmatching, harmonic compatibility, and transition timing
"""

import json
import math
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class AutoDJTransitionEngine:
    """
    Intelligent transition engine for Auto-DJ mixing
    """
    
    def __init__(self):
        # Harmonic compatibility rules (Camelot wheel)
        self.harmonic_rules = {
            # Perfect matches (same key)
            'perfect': 0,
            # Adjacent keys (±1 on Camelot wheel)
            'compatible': 1,
            # Relative major/minor
            'relative': 'A/B',
            # Energy boost (+7 on wheel)
            'energy_boost': 7,
            # Energy drop (-7 on wheel)  
            'energy_drop': -7
        }
        
        # Transition styles
        self.transition_styles = {
            'crossfade': 'Standard crossfade with EQ',
            'echo_out': 'Echo tail + drop in',
            'quick_cut': 'Beat-aligned quick transition',
            'slam': 'Hard cut with effects',
            'loop_extend': 'Loop extension for timing'
        }
        
        logger.info("AutoDJ Transition Engine initialized")
    
    def plan_transition(self, current_track: Dict, next_track: Dict, 
                       transition_type: str = 'auto', force_time: float = None) -> Dict:
        """
        Plan optimal transition between two tracks
        
        Args:
            current_track: Analysis data for currently playing track
            next_track: Analysis data for next track
            transition_type: 'auto', 'quick', or 'forced'
            force_time: Force transition at specific time (for quick transitions)
            
        Returns:
            Comprehensive transition plan
        """
        try:
            logger.info(f"Planning transition: {transition_type}")
            
            # Analyze compatibility
            compatibility = self._analyze_compatibility(current_track, next_track)
            
            # Determine transition timing
            timing = self._calculate_transition_timing(
                current_track, next_track, transition_type, force_time
            )
            
            # Select transition style
            style = self._select_transition_style(current_track, next_track, compatibility)
            
            # Generate beatmatching plan
            beatmatch = self._plan_beatmatching(current_track, next_track, timing)
            
            # Plan stem mixing
            stem_plan = self._plan_stem_mixing(current_track, next_track, timing)
            
            # Create transition plan
            plan = {
                'compatibility': compatibility,
                'timing': timing,
                'style': style,
                'beatmatch': beatmatch,
                'stem_plan': stem_plan,
                'effects': self._plan_effects(style, compatibility),
                'success_probability': self._calculate_success_probability(compatibility, timing)
            }
            
            logger.info(f"Transition planned: {style['name']} at {timing['start_time']:.1f}s")
            return plan
            
        except Exception as e:
            logger.error(f"Transition planning failed: {e}")
            return self._create_fallback_plan(current_track, next_track)
    
    def _analyze_compatibility(self, track_a: Dict, track_b: Dict) -> Dict:
        """
        Analyze harmonic and tempo compatibility between tracks
        """
        try:
            # Tempo compatibility
            bpm_a = track_a.get('bpm', 120)
            bpm_b = track_b.get('bpm', 120)
            
            tempo_diff = abs(bpm_a - bpm_b)
            tempo_ratio = max(bpm_a, bpm_b) / min(bpm_a, bpm_b)
            
            # Tempo compatibility levels
            if tempo_diff <= 2:
                tempo_compat = 'perfect'
            elif tempo_diff <= 6:
                tempo_compat = 'good'
            elif tempo_ratio <= 1.06:  # Within 6% stretch
                tempo_compat = 'acceptable'
            elif tempo_ratio <= 2.0 and abs(bpm_a - bpm_b/2) <= 6:
                tempo_compat = 'half_time'  # One track is double/half tempo
            else:
                tempo_compat = 'poor'
            
            # Harmonic compatibility
            key_a = track_a.get('camelot', 'Unknown')
            key_b = track_b.get('camelot', 'Unknown')
            
            harmonic_compat = self._check_harmonic_compatibility(key_a, key_b)
            
            # Overall compatibility score
            tempo_scores = {'perfect': 1.0, 'good': 0.9, 'acceptable': 0.7, 'half_time': 0.6, 'poor': 0.3}
            harmonic_scores = {'perfect': 1.0, 'compatible': 0.8, 'relative': 0.7, 'boost': 0.6, 'clash': 0.2}
            
            overall_score = (tempo_scores.get(tempo_compat, 0.3) + 
                           harmonic_scores.get(harmonic_compat, 0.2)) / 2
            
            return {
                'tempo': {
                    'bpm_a': bpm_a,
                    'bpm_b': bpm_b,
                    'difference': tempo_diff,
                    'ratio': tempo_ratio,
                    'compatibility': tempo_compat
                },
                'harmonic': {
                    'key_a': key_a,
                    'key_b': key_b,
                    'compatibility': harmonic_compat
                },
                'overall_score': overall_score,
                'mixable': overall_score > 0.5
            }
            
        except Exception as e:
            logger.warning(f"Compatibility analysis failed: {e}")
            return {
                'tempo': {'compatibility': 'unknown'},
                'harmonic': {'compatibility': 'unknown'},
                'overall_score': 0.5,
                'mixable': True
            }
    
    def _check_harmonic_compatibility(self, key_a: str, key_b: str) -> str:
        """
        Check harmonic compatibility using Camelot wheel rules
        """
        if key_a == 'Unknown' or key_b == 'Unknown':
            return 'unknown'
        
        if key_a == key_b:
            return 'perfect'
        
        # Extract number and letter from Camelot notation
        try:
            num_a, letter_a = int(key_a[:-1]), key_a[-1]
            num_b, letter_b = int(key_b[:-1]), key_b[-1]
            
            # Same number, different letter = relative major/minor
            if num_a == num_b and letter_a != letter_b:
                return 'relative'
            
            # Adjacent numbers, same letter = compatible
            if letter_a == letter_b:
                diff = abs(num_a - num_b)
                if diff == 1 or diff == 11:  # Adjacent on wheel
                    return 'compatible'
                elif diff == 7 or diff == 5:  # Energy change
                    return 'boost' if num_b > num_a else 'drop'
            
            return 'clash'
            
        except (ValueError, IndexError):
            return 'unknown'
    
    def _calculate_transition_timing(self, track_a: Dict, track_b: Dict, 
                                   transition_type: str, force_time: float = None) -> Dict:
        """
        Calculate optimal transition timing
        """
        try:
            duration_a = track_a.get('duration', 180)
            cue_out_a = track_a.get('cue_out', duration_a - 16)
            cue_in_b = track_b.get('cue_in', 8.0)
            
            if transition_type == 'auto':
                # Standard end-of-track transition
                start_time = cue_out_a - 16.0  # Start mixing 16s before cue out
                mix_duration = 16.0
                
            elif transition_type == 'quick' and force_time:
                # Quick transition at user-specified time
                start_time = self._find_next_phrase_boundary(track_a, force_time)
                mix_duration = 8.0  # Shorter mix for quick transitions
                
            else:
                # Fallback timing
                start_time = max(duration_a - 20, duration_a * 0.8)
                mix_duration = 12.0
            
            # Ensure timing makes sense
            start_time = max(0, min(start_time, duration_a - 4))
            end_time = start_time + mix_duration
            
            return {
                'start_time': start_time,
                'end_time': end_time,
                'mix_duration': mix_duration,
                'track_a_out': end_time,
                'track_b_in': cue_in_b,
                'overlap_duration': mix_duration
            }
            
        except Exception as e:
            logger.warning(f"Timing calculation failed: {e}")
            duration = track_a.get('duration', 180)
            return {
                'start_time': max(0, duration - 16),
                'end_time': duration,
                'mix_duration': 16.0,
                'track_a_out': duration,
                'track_b_in': 8.0,
                'overlap_duration': 16.0
            }
    
    def _find_next_phrase_boundary(self, track: Dict, current_time: float) -> float:
        """
        Find the next musical phrase boundary for clean transitions
        """
        try:
            beatgrid = track.get('beatgrid', [])
            downbeats = track.get('downbeats', [])
            
            # Prefer downbeats (phrase boundaries)
            future_downbeats = [beat for beat in downbeats if beat > current_time]
            if future_downbeats:
                # Look for downbeat within reasonable time (max 30s ahead)
                for downbeat in future_downbeats:
                    if downbeat - current_time <= 30:
                        return downbeat
            
            # Fallback to regular beats
            future_beats = [beat for beat in beatgrid if beat > current_time]
            if future_beats:
                return future_beats[0]
            
            # Last resort: just add a few seconds
            return current_time + 4.0
            
        except Exception as e:
            logger.warning(f"Phrase boundary detection failed: {e}")
            return current_time + 8.0
    
    def _select_transition_style(self, track_a: Dict, track_b: Dict, compatibility: Dict) -> Dict:
        """
        Select appropriate transition style based on track characteristics
        """
        try:
            score = compatibility.get('overall_score', 0.5)
            tempo_compat = compatibility.get('tempo', {}).get('compatibility', 'unknown')
            
            # Vocal considerations
            vocals_a = track_a.get('vocals', [])
            vocals_b = track_b.get('vocals', [])
            
            # Check if tracks have long intros/outros
            intro_b = track_b.get('intro', {}).get('end', 0) - track_b.get('intro', {}).get('start', 0)
            outro_a = track_a.get('outro', {}).get('end', 0) - track_a.get('outro', {}).get('start', 0)
            
            if score >= 0.8 and tempo_compat in ['perfect', 'good']:
                # High quality mix possible
                style = {
                    'name': 'crossfade',
                    'description': 'Professional crossfade with EQ and stem control',
                    'mix_curve': 'equal_power',
                    'use_stems': True,
                    'eq_transition': True
                }
                
            elif score >= 0.6 and intro_b > 8:
                # Good compatibility with long intro
                style = {
                    'name': 'echo_out',
                    'description': 'Echo tail on outgoing track, clean drop-in',
                    'mix_curve': 'linear',
                    'use_stems': True,
                    'add_echo': True
                }
                
            elif tempo_compat == 'poor':
                # Poor tempo match - use effects
                style = {
                    'name': 'slam',
                    'description': 'Hard cut with filter effects',
                    'mix_curve': 'immediate',
                    'use_stems': False,
                    'add_filter': True
                }
                
            else:
                # Standard quick transition
                style = {
                    'name': 'quick_cut',
                    'description': 'Beat-aligned quick transition',
                    'mix_curve': 'fast_fade',
                    'use_stems': True,
                    'eq_transition': False
                }
            
            return style
            
        except Exception as e:
            logger.warning(f"Style selection failed: {e}")
            return {
                'name': 'crossfade',
                'description': 'Standard crossfade',
                'mix_curve': 'linear',
                'use_stems': False
            }
    
    def _plan_beatmatching(self, track_a: Dict, track_b: Dict, timing: Dict) -> Dict:
        """
        Plan beatmatching and time-stretching if needed
        """
        try:
            bpm_a = track_a.get('bpm', 120)
            bpm_b = track_b.get('bpm', 120)
            
            # Calculate if time-stretching is needed
            tempo_diff = abs(bpm_a - bpm_b)
            
            if tempo_diff <= 2:
                # No stretching needed
                return {
                    'stretch_needed': False,
                    'target_bpm': bpm_a,
                    'stretch_factor_a': 1.0,
                    'stretch_factor_b': 1.0,
                    'sync_method': 'natural'
                }
            
            elif tempo_diff <= 6:
                # Subtle stretching - meet in the middle
                target_bpm = (bpm_a + bpm_b) / 2
                stretch_a = target_bpm / bpm_a
                stretch_b = target_bpm / bpm_b
                
                # Limit stretch to ±6%
                stretch_a = max(0.94, min(1.06, stretch_a))
                stretch_b = max(0.94, min(1.06, stretch_b))
                
                return {
                    'stretch_needed': True,
                    'target_bpm': target_bpm,
                    'stretch_factor_a': stretch_a,
                    'stretch_factor_b': stretch_b,
                    'sync_method': 'time_stretch'
                }
            
            else:
                # Large tempo difference - no beatmatching
                return {
                    'stretch_needed': False,
                    'target_bpm': bpm_b,  # Use incoming track's tempo
                    'stretch_factor_a': 1.0,
                    'stretch_factor_b': 1.0,
                    'sync_method': 'none'
                }
                
        except Exception as e:
            logger.warning(f"Beatmatching planning failed: {e}")
            return {
                'stretch_needed': False,
                'target_bpm': 120,
                'stretch_factor_a': 1.0,
                'stretch_factor_b': 1.0,
                'sync_method': 'natural'
            }
    
    def _plan_stem_mixing(self, track_a: Dict, track_b: Dict, timing: Dict) -> Dict:
        """
        Plan how to mix individual stems to avoid vocal clashes
        """
        try:
            start_time = timing['start_time']
            mix_duration = timing['mix_duration']
            
            vocals_a = track_a.get('vocals', [])
            vocals_b = track_b.get('vocals', [])
            
            # Check for vocal conflicts during transition
            transition_end = start_time + mix_duration
            
            # Find vocals in track A during transition
            vocals_a_active = any(
                vocal['start'] <= transition_end and vocal['end'] >= start_time
                for vocal in vocals_a
            )
            
            # Find vocals in track B at entry point
            cue_in_b = track_b.get('cue_in', 8.0)
            vocals_b_early = any(
                vocal['start'] <= cue_in_b + mix_duration
                for vocal in vocals_b
            )
            
            # Plan stem mixing strategy
            stem_plan = {
                'track_a': {
                    'vocals': self._plan_vocal_fade(vocals_a_active, 'out', mix_duration),
                    'drums': {'fade': 'linear_out', 'delay': 0},
                    'bass': {'fade': 'linear_out', 'delay': mix_duration * 0.3},
                    'other': {'fade': 'linear_out', 'delay': 0}
                },
                'track_b': {
                    'vocals': self._plan_vocal_fade(vocals_b_early, 'in', mix_duration),
                    'drums': {'fade': 'linear_in', 'delay': 0},
                    'bass': {'fade': 'linear_in', 'delay': mix_duration * 0.2},
                    'other': {'fade': 'linear_in', 'delay': mix_duration * 0.1}
                }
            }
            
            return stem_plan
            
        except Exception as e:
            logger.warning(f"Stem mixing planning failed: {e}")
            return {
                'track_a': {'fade': 'linear_out'},
                'track_b': {'fade': 'linear_in'}
            }
    
    def _plan_vocal_fade(self, vocals_present: bool, direction: str, duration: float) -> Dict:
        """
        Plan vocal stem fading to avoid clashes
        """
        if not vocals_present:
            return {'fade': f'linear_{direction}', 'delay': 0}
        
        if direction == 'out':
            # Fade out vocals faster to make room for incoming vocals
            return {
                'fade': 'fast_out',
                'delay': 0,
                'duration_factor': 0.6  # Fade out in 60% of mix time
            }
        else:
            # Delay incoming vocals until outgoing vocals are gone
            return {
                'fade': 'linear_in',
                'delay': duration * 0.4,  # Start vocals 40% into mix
                'duration_factor': 0.6
            }
    
    def _plan_effects(self, style: Dict, compatibility: Dict) -> Dict:
        """
        Plan audio effects for the transition
        """
        effects = {
            'track_a': [],
            'track_b': []
        }
        
        style_name = style.get('name', 'crossfade')
        
        if style_name == 'echo_out':
            effects['track_a'].append({
                'type': 'echo',
                'delay': 0.125,  # 1/8 note at 120 BPM
                'feedback': 0.3,
                'mix': 0.4
            })
        
        elif style_name == 'slam':
            effects['track_a'].append({
                'type': 'highpass',
                'frequency': 8000,
                'fade_in_time': 0.5
            })
            effects['track_b'].append({
                'type': 'lowpass',
                'frequency': 200,
                'fade_out_time': 0.5
            })
        
        if style.get('eq_transition'):
            # Add complementary EQ during transition
            effects['track_a'].append({
                'type': 'eq',
                'low_cut': 0.8,  # Reduce bass on outgoing track
                'fade_time': compatibility.get('overall_score', 0.5) * 2
            })
        
        return effects
    
    def _calculate_success_probability(self, compatibility: Dict, timing: Dict) -> float:
        """
        Calculate probability of successful transition
        """
        try:
            base_score = compatibility.get('overall_score', 0.5)
            
            # Adjust for timing quality
            mix_duration = timing.get('mix_duration', 8)
            if 8 <= mix_duration <= 16:
                timing_bonus = 0.1
            else:
                timing_bonus = -0.1
            
            # Adjust for tempo compatibility
            tempo_compat = compatibility.get('tempo', {}).get('compatibility', 'unknown')
            tempo_bonuses = {
                'perfect': 0.2,
                'good': 0.1,
                'acceptable': 0.0,
                'poor': -0.2
            }
            tempo_bonus = tempo_bonuses.get(tempo_compat, 0)
            
            success_prob = base_score + timing_bonus + tempo_bonus
            return max(0.0, min(1.0, success_prob))
            
        except Exception as e:
            logger.warning(f"Success probability calculation failed: {e}")
            return 0.7
    
    def _create_fallback_plan(self, track_a: Dict, track_b: Dict) -> Dict:
        """
        Create a safe fallback transition plan
        """
        duration_a = track_a.get('duration', 180)
        
        return {
            'compatibility': {
                'overall_score': 0.5,
                'mixable': True
            },
            'timing': {
                'start_time': max(0, duration_a - 12),
                'mix_duration': 8.0,
                'track_b_in': 8.0
            },
            'style': {
                'name': 'quick_cut',
                'description': 'Safe fallback transition'
            },
            'beatmatch': {
                'stretch_needed': False,
                'sync_method': 'none'
            },
            'stem_plan': {
                'track_a': {'fade': 'linear_out'},
                'track_b': {'fade': 'linear_in'}
            },
            'effects': {'track_a': [], 'track_b': []},
            'success_probability': 0.7
        }

def main():
    """
    Command line interface for transition planning
    """
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python autodj_transition_engine.py <track_a_analysis.json> <track_b_analysis.json>")
        sys.exit(1)
    
    # Load track analyses
    with open(sys.argv[1], 'r') as f:
        track_a = json.load(f)
    
    with open(sys.argv[2], 'r') as f:
        track_b = json.load(f)
    
    # Create transition engine and plan transition
    engine = AutoDJTransitionEngine()
    plan = engine.plan_transition(track_a, track_b)
    
    # Output transition plan
    print(json.dumps(plan, indent=2))

if __name__ == "__main__":
    main() 