import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Settings, Plus, X, BarChart3, Music, Check, GripVertical, Info, Sliders, Zap, Filter, RotateCcw, FastForward, Rewind, Activity, Headphones, Radio } from 'lucide-react';
import storage from '../utils/storage';
import audioEngine from '../utils/audioEngine';
import ProfessionalBeatViewport from './ProfessionalBeatViewport';
import AutoDJEngine from '../utils/autoDJEngine';
import optimizedAudioProcessor from '../utils/optimizedAudioProcessor';

const AIDJContainer = styled.div`
  min-height: 100%;
  background: linear-gradient(135deg, 
    #000000 0%, 
    #3d3d3d 25%, 
    #454545 50%, 
    #5d5d5d 75%, 
    #000000 100%);
  color: #ffffff;
  padding: 20px;
  overflow-y: auto;
`;

const DJHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 35, 35, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 35, 35, 0.2);
`;

const DJTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ff2323, #ff5757);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const AutoDJControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const AutoDJButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.$active ? 
    'linear-gradient(45deg, #ff2323, #ff5757)' : 
    'rgba(109, 109, 109, 0.3)'};
  color: ${props => props.$active ? '#fff' : '#fff'};
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 35, 35, 0.4);
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 35, 35, 0.1);
  border: 1px solid rgba(255, 35, 35, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
`;

const DJLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px 1fr;
  gap: 30px;
  margin-bottom: 30px;
`;

const DeckContainer = styled.div`
  background: rgba(69, 69, 69, 0.2);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(109, 109, 109, 0.3);
  backdrop-filter: blur(10px);
`;

const DeckHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DeckTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: ${props => props.$deckColor || '#ff2323'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TrackInfo = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
`;

const TrackTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #888;
`;

const WaveformContainer = styled.div`
  height: 180px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DeckControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const ControlButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$primary ? 
    'linear-gradient(45deg, #ff2323, #ff5757)' : 
    'rgba(109, 109, 109, 0.3)'};
  color: ${props => props.$primary ? '#fff' : '#fff'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 20px rgba(255, 35, 35, 0.4);
  }
`;

const StemControls = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const StemControl = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const StemLabel = styled.div`
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
`;

const StemSlider = styled.input`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: ${props => props.$stemColor || '#00ff88'};
    border-radius: 50%;
    cursor: pointer;
  }
`;

const CenterControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(69, 69, 69, 0.2);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(109, 109, 109, 0.3);
  backdrop-filter: blur(10px);
`;

const CrossfaderContainer = styled.div`
  width: 100%;
  margin: 30px 0;
  text-align: center;
`;

const CrossfaderLabel = styled.div`
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 15px;
  text-transform: uppercase;
  font-weight: 600;
`;

const Crossfader = styled.input`
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #ff2323 0%, rgba(109,109,109,0.5) 50%, #ff5757 100%);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
`;

const TransitionControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const TransitionButton = styled.button`
  padding: 15px 30px;
  background: linear-gradient(45deg, #ff2323, #ff5757);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 35, 35, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const AutoDJStatus = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
`;

const StatusItem = styled.div`
  text-align: center;
`;

const StatusValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ff88;
`;

const StatusLabel = styled.div`
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
`;

const QueueContainer = styled.div`
  background: rgba(69, 69, 69, 0.2);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(109, 109, 109, 0.3);
  backdrop-filter: blur(10px);
  margin-top: 30px;
`;

const QueueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const QueueTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QueueControls = styled.div`
  display: flex;
  gap: 10px;
`;

const QueueButton = styled.button`
  padding: 8px 16px;
  background: rgba(109, 109, 109, 0.3);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: rgba(255, 35, 35, 0.4);
    transform: translateY(-1px);
  }
`;

const QueueList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const QueueItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const QueueItemInfo = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const QueueItemTitle = styled.div`
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const QueueItemMeta = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const QueueItemActions = styled.div`
  display: flex;
  gap: 8px;
`;

const QueueActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const AvailableTracksModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  max-height: 70vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: #ffffff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TracksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AddTrackButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(45deg, #ff2323, #ff5757);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(255, 35, 35, 0.4);
  }
`;

const AIDJ = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [nextTrack, setNextTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [crossfaderValue, setCrossfaderValue] = useState(50);
  const [autoDJEnabled, setAutoDJEnabled] = useState(false);
  const [autoDJStats, setAutoDJStats] = useState({
    totalTransitions: 0,
    successRate: 0,
    tracksAnalyzed: 0
  });
  const [stemLevels, setStemLevels] = useState({
    deckA: { vocals: 100, drums: 100, bass: 100, other: 100 },
    deckB: { vocals: 100, drums: 100, bass: 100, other: 100 }
  });
  const [transitionStatus, setTransitionStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [nextTrackTime, setNextTrackTime] = useState(0);
  const [showAddTracksModal, setShowAddTracksModal] = useState(false);
  const [availableTracks, setAvailableTracks] = useState([]);
  
  const autoDJRef = useRef(null);
  const waveformRefA = useRef(null);
  const waveformRefB = useRef(null);

  useEffect(() => {
    // Initialize audioEngine if needed
    const initializeAudio = async () => {
      try {
        if (audioEngine && !audioEngine.audioContext) {
          console.log('🎵 Initializing audioEngine...');
          await audioEngine.initialize();
        }
        
        // Initialize Auto-DJ engine
        if (audioEngine && !autoDJRef.current) {
          autoDJRef.current = new AutoDJEngine(audioEngine);
        }

        // Load initial data
        await loadTracks();
      } catch (error) {
        console.error('Error initializing audio system:', error);
        setTransitionStatus('Error initializing audio system - please refresh');
      }
    };

    initializeAudio();
    
    // Listen for storage updates to reload tracks
    const handleStorageUpdate = () => {
      console.log('Storage updated, reloading tracks...');
      loadTracks();
    };
    
    window.addEventListener('storage-updated', handleStorageUpdate);
    
    // Set up audioEngine event listeners
    const handleAudioEngineEvents = (event, data) => {
      switch (event) {
        case 'transitionComplete':
          console.log('🎧 AIDJ: Transition completed', data);
          
          // Update current track to the new track
          if (data.newCurrentTrack) {
            setCurrentTrack(data.newCurrentTrack);
          }
          
          // Load next track from queue
          const tracks = storage.getTracks().filter(track => {
            const isCompleted = track.status === 'completed';
            const hasStems = track.stemsPath || track.stems;
            return isCompleted && hasStems;
          });
          
          const currentIndex = tracks.findIndex(t => t.id === data.newCurrentTrack?.id);
          if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
            setNextTrack(tracks[currentIndex + 1]);
          } else {
            setNextTrack(null);
          }
          
          setTransitionStatus('Transition completed successfully!');
          setTimeout(() => setTransitionStatus(null), 3000);
          break;
          
        case 'trackEnded':
          console.log('🎧 AIDJ: Track ended');
          setTransitionStatus('Track ended - loading next track...');
          break;
          
        case 'bpmRestored':
          console.log('🎧 AIDJ: BPM restored to original', data);
          setTransitionStatus('BPM restored to original tempo');
          setTimeout(() => setTransitionStatus(null), 2000);
          break;
          
        case 'bmpDetected':
        case 'bpmDetected':
          // Update current track with BPM info
          if (data.bpm && currentTrack) {
            setCurrentTrack(prev => ({ ...prev, bpm: data.bpm }));
          }
          break;
          
        case 'deckBTrackLoaded':
          // Update next track with analyzed data
          if (data.track) {
            setNextTrack(data.track);
          }
          break;
          
        case 'stemVolumeChanged':
          // Update UI sliders when AutoDJ changes stem volumes
          if (data.deck && data.stemName && typeof data.volume === 'number') {
            setStemLevels(prev => ({
              ...prev,
              [data.deck]: {
                ...prev[data.deck],
                [data.stemName]: Math.round(data.volume * 100)
              }
            }));
          }
          break;
      }
    };
    
    // Add event listener
    if (audioEngine && audioEngine.addEventListener) {
      audioEngine.addEventListener(handleAudioEngineEvents);
    }
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateCurrentState();
      if (autoDJRef.current) {
        setAutoDJStats(autoDJRef.current.getStatistics());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      
      // Remove storage listener
      window.removeEventListener('storage-updated', handleStorageUpdate);
      
      // Remove event listener
      if (audioEngine && audioEngine.removeEventListener) {
        audioEngine.removeEventListener(handleAudioEngineEvents);
      }
      
      if (autoDJRef.current) {
        autoDJRef.current.destroy();
      }
    };
  }, []);

  const loadTracks = async () => {
    const allTracks = storage.getTracks();
    console.log('All tracks from storage:', allTracks);
    
    const tracks = allTracks.filter(track => {
      const isCompleted = track.status === 'completed';
      const hasStems = track.stemsPath || track.stems;
      console.log(`Track ${track.name}: status=${track.status}, hasStems=${hasStems}`);
      return isCompleted && hasStems;
    });
    
    console.log('Filtered completed tracks with stems:', tracks);
    setQueue(tracks);
    
    if (tracks.length > 0) {
              // Load the first track through optimized processor
        try {
          const firstTrack = tracks[0];
          console.log('Loading first track:', firstTrack.title || firstTrack.name);
          
          // If track already has analysis data (from processing), use it directly
          if (firstTrack.bpm && firstTrack.key) {
            console.log(`Track already analyzed - BPM: ${firstTrack.bpm}, Key: ${firstTrack.key.name}`);
            const loadedTrack = await audioEngine.loadTrack(firstTrack);
            setCurrentTrack(loadedTrack);
          } else {
            // Track needs analysis - use optimized processor
            console.log('Analyzing track with optimized processor...');
            
            // Create audio data for analysis
            const audioData = {
              sampleRate: 44100,
              channelData: new Float32Array(44100 * 30) // Placeholder data
            };
            
            const analysis = await optimizedAudioProcessor.analyzeAudioFile(
              firstTrack.id,
              audioData,
              (progress) => {
                console.log(`Analysis progress: ${progress.progress}% - ${progress.stage}`);
              }
            );
            
            // Update track with analysis data
            const analyzedTrack = {
              ...firstTrack,
              bpm: analysis.bpm || 120,
              key: { name: analysis.key || 'C Major', camelot: '8B' },
              waveform: analysis.waveform || []
            };
            
            setCurrentTrack(analyzedTrack);
            
            // Update storage with analysis data
            storage.updateTrack(firstTrack.id, {
              bpm: analyzedTrack.bpm,
              key: analyzedTrack.key,
              waveform: analyzedTrack.waveform
            });
          }
        
        // Load next track if available
        if (tracks.length > 1) {
          const secondTrack = tracks[1];
          console.log('Loading next track for deck B:', secondTrack.title || secondTrack.name);
          const analyzedNextTrack = await audioEngine.loadNextTrack(secondTrack);
          setNextTrack(analyzedNextTrack);
        }
        
        console.log(`Loaded ${tracks.length} tracks successfully`);
      } catch (error) {
        console.error('Error loading tracks through audioEngine:', error);
        // Fallback to direct loading without analysis
        setCurrentTrack(tracks[0]);
        if (tracks.length > 1) {
          setNextTrack(tracks[1]);
        }
        setTransitionStatus('Error analyzing tracks - basic functionality available');
        setTimeout(() => setTransitionStatus(null), 5000);
      }
    } else {
      console.log('No completed tracks with stems found');
      setCurrentTrack(null);
      setNextTrack(null);
    }
  };

  const updateCurrentState = () => {
    if (audioEngine) {
      setIsPlaying(audioEngine.isPlaying);
      
      // Update current track info from audioEngine
      if (audioEngine.currentTrack) {
        setCurrentTrack(audioEngine.currentTrack);
      }
      
      // Update next track info
      if (audioEngine.nextTrack) {
        setNextTrack(audioEngine.nextTrack);
      }
      
      // Update current playback time
      if (audioEngine.currentTime !== undefined) {
        setCurrentTime(audioEngine.currentTime);
      }
      
      // Update next track time if playing
      if (audioEngine.deckBCurrentTime !== undefined) {
        setNextTrackTime(audioEngine.deckBCurrentTime);
      }
      
      // Update crossfader position if changed
      if (audioEngine.crossfadePosition !== undefined) {
        setCrossfaderValue(audioEngine.crossfadePosition * 100);
      }
    }
  };

  const toggleAutoDJ = async () => {
    if (!autoDJRef.current) {
      console.error('AutoDJ engine not initialized');
      return;
    }
    
    // Prevent double-clicks by checking if already processing
    if (autoDJRef.current.isToggling) {
      console.log('AutoDJ toggle already in progress');
      return;
    }
    
    autoDJRef.current.isToggling = true;
    
    try {
      const currentState = autoDJRef.current.isActive;
      console.log(`Toggling AutoDJ from ${currentState} to ${!currentState}`);
      
      if (currentState) {
        const success = await autoDJRef.current.disable();
        if (success) {
          setAutoDJEnabled(false);
          setTransitionStatus(null);
          console.log('AutoDJ disabled successfully');
        }
      } else {
        const success = await autoDJRef.current.enable();
        if (success) {
          setAutoDJEnabled(true);
          setTransitionStatus('Auto-DJ enabled - monitoring for transitions...');
          console.log('AutoDJ enabled successfully');
        }
      }
    } catch (error) {
      console.error('Error toggling AutoDJ:', error);
      setTransitionStatus('Error toggling Auto-DJ - please try again');
      setTimeout(() => setTransitionStatus(null), 3000);
    } finally {
      autoDJRef.current.isToggling = false;
    }
  };

  const executeQuickTransition = async () => {
    if (!audioEngine) {
      setTransitionStatus('Audio system not initialized');
      setTimeout(() => setTransitionStatus(null), 3000);
      return;
    }
    
    if (!audioEngine.nextTrack) {
      setTransitionStatus('No next track available - add tracks to queue first');
      setTimeout(() => setTransitionStatus(null), 3000);
      return;
    }
    
    try {
      setTransitionStatus('Executing refined transition...');
      
      // Use the refined transition system
      await audioEngine.triggerProfessionalTransition();
      
      setTransitionStatus('Refined transition completed successfully!');
      setTimeout(() => setTransitionStatus(null), 3000);
      
    } catch (error) {
      console.error('Error executing refined transition:', error);
      setTransitionStatus(`Transition error: ${error.message}`);
      setTimeout(() => setTransitionStatus(null), 5000);
    }
  };

  const handlePlay = async () => {
    console.log('🎵 Play button clicked');
    console.log('🎵 AudioEngine exists:', !!audioEngine);
    console.log('🎵 AudioEngine initialized:', !!audioEngine?.audioContext);
    console.log('🎵 Current playing state:', isPlaying);
    console.log('🎵 Current track in state:', currentTrack?.title || currentTrack?.name || 'None');
    console.log('🎵 Current track in audioEngine:', audioEngine?.currentTrack?.title || audioEngine?.currentTrack?.name || 'None');
    
    if (!audioEngine) {
      console.error('🎵 AudioEngine not available');
      setTransitionStatus('Audio system not initialized');
      setTimeout(() => setTransitionStatus(null), 3000);
      return;
    }
    
    if (!audioEngine.audioContext) {
      console.error('🎵 AudioEngine not initialized');
      setTransitionStatus('Audio system not ready - please refresh');
      setTimeout(() => setTransitionStatus(null), 3000);
      return;
    }
    
    if (isPlaying) {
      console.log('🎵 Pausing playback');
      audioEngine.pause();
      return;
    }
    
    // If no track is loaded in audioEngine but we have one in state, load it
    if (!audioEngine.currentTrack && currentTrack) {
      try {
        console.log('🎵 Loading current track into audioEngine:', currentTrack.title || currentTrack.name);
        setTransitionStatus('Loading track...');
        const loadedTrack = await audioEngine.loadTrack(currentTrack);
        setCurrentTrack(loadedTrack); // Update with analyzed data
        setTransitionStatus('Starting playback...');
        await audioEngine.play();
        setTransitionStatus(null);
        console.log('🎵 Track loaded and playing successfully');
      } catch (error) {
        console.error('🎵 Error loading and playing track:', error);
        setTransitionStatus(`Error loading track: ${error.message}`);
        setTimeout(() => setTransitionStatus(null), 5000);
      }
    } else if (audioEngine.currentTrack) {
      // Track already loaded, just play
      console.log('🎵 Track already loaded, starting playback');
      try {
        setTransitionStatus('Starting playback...');
        await audioEngine.play();
        setTransitionStatus(null);
        console.log('🎵 Playback started successfully');
      } catch (error) {
        console.error('🎵 Error starting playback:', error);
        setTransitionStatus(`Error playing: ${error.message}`);
        setTimeout(() => setTransitionStatus(null), 5000);
      }
    } else {
      console.warn('🎵 No track available to play');
      setTransitionStatus('No track available - add tracks to queue first');
      setTimeout(() => setTransitionStatus(null), 3000);
    }
  };

  const handleStemChange = (deck, stem, value) => {
    setStemLevels(prev => ({
      ...prev,
      [deck]: {
        ...prev[deck],
        [stem]: value
      }
    }));
    
    // Apply to audio engine
    if (audioEngine) {
      const stemName = `${deck}_${stem}`; // Format: "deckA_vocals", "deckB_drums", etc.
      audioEngine.setStemVolume(stemName, value / 100);
    }
  };

  const handleCrossfaderChange = (value) => {
    setCrossfaderValue(value);
    
    // Apply crossfader to audio engine
    if (audioEngine) {
      audioEngine.setCrossfade(value / 100);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBPMColor = (bpm) => {
    if (bpm < 100) return '#b0b0b0';
    if (bpm < 130) return '#d1d1d1';
    if (bpm < 160) return '#ff5757';
    return '#ff2323';
  };

  const openAddTracksModal = () => {
    // Load all completed tracks that aren't already in queue
    const allTracks = storage.getTracks().filter(track => {
      const isCompleted = track.status === 'completed';
      const hasStems = track.stemsPath || track.stems;
      return isCompleted && hasStems;
    });
    
    console.log('All completed tracks for modal:', allTracks);
    
    const queueIds = queue.map(t => t.id);
    const available = allTracks.filter(track => !queueIds.includes(track.id));
    
    console.log('Available tracks not in queue:', available);
    setAvailableTracks(available);
    setShowAddTracksModal(true);
  };

  const addTrackToQueue = async (track) => {
    setQueue(prev => [...prev, track]);
    setAvailableTracks(prev => prev.filter(t => t.id !== track.id));
    
    // If no current track, set this as current and load into audioEngine
    if (!currentTrack) {
      setCurrentTrack(track);
      try {
        if (audioEngine) {
          console.log('Loading first track into audioEngine:', track.title || track.name);
          const loadedTrack = await audioEngine.loadTrack(track);
          setCurrentTrack(loadedTrack);
        }
      } catch (error) {
        console.error('Error loading track into audioEngine:', error);
      }
    }
    // If no next track and we have a current track, set this as next and load into audioEngine
    else if (!nextTrack) {
      setNextTrack(track);
      try {
        if (audioEngine) {
          console.log('Loading next track into audioEngine:', track.title || track.name);
          const loadedNextTrack = await audioEngine.loadNextTrack(track);
          setNextTrack(loadedNextTrack);
        }
      } catch (error) {
        console.error('Error loading next track into audioEngine:', error);
      }
    }
    
    console.log(`Added "${track.title || track.name}" to queue`);
  };

  const removeTrackFromQueue = (trackId) => {
    const trackToRemove = queue.find(t => t.id === trackId);
    setQueue(prev => prev.filter(t => t.id !== trackId));
    
    // If removing current track, advance to next
    if (currentTrack?.id === trackId) {
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        const remainingQueue = queue.filter(t => t.id !== trackId && t.id !== nextTrack.id);
        setNextTrack(remainingQueue.length > 0 ? remainingQueue[0] : null);
      } else {
        const remainingQueue = queue.filter(t => t.id !== trackId);
        setCurrentTrack(remainingQueue.length > 0 ? remainingQueue[0] : null);
        setNextTrack(remainingQueue.length > 1 ? remainingQueue[1] : null);
      }
    }
    // If removing next track, set new next
    else if (nextTrack?.id === trackId) {
      const remainingQueue = queue.filter(t => t.id !== trackId && t.id !== currentTrack?.id);
      setNextTrack(remainingQueue.length > 0 ? remainingQueue[0] : null);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentTrack(null);
    setNextTrack(null);
  };

  return (
    <AIDJContainer>
      <DJHeader>
        <DJTitle>
          <Radio />
          AI|DJ Professional
        </DJTitle>
        <AutoDJControls>
          <StatusIndicator>
            <Activity size={16} />
            {autoDJEnabled ? 'Auto-DJ Active' : 'Manual Mode'}
          </StatusIndicator>
          <AutoDJButton 
            $active={autoDJEnabled} 
            onClick={toggleAutoDJ}
          >
            <Zap size={18} />
            {autoDJEnabled ? 'Disable Auto-DJ' : 'Enable Auto-DJ'}
          </AutoDJButton>
          <AutoDJButton onClick={() => {}}>
            <Settings size={18} />
            Settings
          </AutoDJButton>
        </AutoDJControls>
      </DJHeader>

      <DJLayout>
        {/* Deck A */}
        <DeckContainer>
          <DeckHeader>
            <DeckTitle $deckColor="#ff2323">
              <Music size={20} />
              Deck A
            </DeckTitle>
            <div style={{ color: getBPMColor(currentTrack?.bpm) }}>
              {currentTrack?.bpm ? `${Math.round(currentTrack.bpm)} BPM` : '--'}
            </div>
          </DeckHeader>

          <TrackInfo>
            <TrackTitle>
              {currentTrack?.title || 'No Track Loaded'}
            </TrackTitle>
            <TrackMeta>
              <span>{currentTrack?.artist || 'Unknown Artist'}</span>
              <span>{currentTrack?.duration ? formatTime(currentTrack.duration) : '--:--'}</span>
            </TrackMeta>
          </TrackInfo>

          <WaveformContainer>
            <ProfessionalBeatViewport
              ref={waveformRefA}
              deckATrack={currentTrack}
              deckBTrack={null}
              currentTime={currentTime}
              deckBCurrentTime={0}
              isActive={true}
              deckId="A"
              color="#ff2323"
            />
          </WaveformContainer>

          <DeckControls>
            <ControlButton onClick={handlePlay} $primary>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </ControlButton>
            <ControlButton>
              <SkipForward size={20} />
            </ControlButton>
            <ControlButton>
              <Volume2 size={20} />
            </ControlButton>
          </DeckControls>

          <StemControls>
            {['vocals', 'drums', 'bass', 'other'].map(stem => (
              <StemControl key={stem}>
                <StemLabel>{stem}</StemLabel>
                <StemSlider
                  type="range"
                  min="0"
                  max="100"
                  value={stemLevels.deckA[stem]}
                  onChange={(e) => handleStemChange('deckA', stem, parseInt(e.target.value))}
                  $stemColor={stem === 'vocals' ? '#ff6b6b' : stem === 'drums' ? '#ffa500' : stem === 'bass' ? '#4ecdc4' : '#00ff88'}
                />
              </StemControl>
            ))}
          </StemControls>
        </DeckContainer>

        {/* Center Controls */}
        <CenterControls>
          <CrossfaderContainer>
            <CrossfaderLabel>Crossfader</CrossfaderLabel>
            <Crossfader
              type="range"
              min="0"
              max="100"
              value={crossfaderValue}
              onChange={(e) => handleCrossfaderChange(parseInt(e.target.value))}
            />
          </CrossfaderContainer>

          <TransitionControls>
            <TransitionButton 
              onClick={executeQuickTransition}
              disabled={!audioEngine?.nextTrack}
            >
              <Zap size={18} />
              Refined Transition
            </TransitionButton>
          </TransitionControls>

          <AutoDJStatus>
            <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '600' }}>
              Auto-DJ Status
            </div>
            {transitionStatus && (
              <div style={{ 
                textAlign: 'center', 
                padding: '10px', 
                background: 'rgba(0, 255, 136, 0.1)',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.9rem'
              }}>
                {transitionStatus}
              </div>
            )}
            <StatusGrid>
              <StatusItem>
                <StatusValue>{autoDJStats.totalTransitions}</StatusValue>
                <StatusLabel>Transitions</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{Math.round(autoDJStats.successRate)}%</StatusValue>
                <StatusLabel>Success Rate</StatusLabel>
              </StatusItem>
            </StatusGrid>
          </AutoDJStatus>
        </CenterControls>

        {/* Deck B */}
        <DeckContainer>
          <DeckHeader>
            <DeckTitle $deckColor="#ff5757">
              <Music size={20} />
              Deck B
            </DeckTitle>
            <div style={{ color: getBPMColor(nextTrack?.bpm) }}>
              {nextTrack?.bpm ? `${Math.round(nextTrack.bpm)} BPM` : '--'}
            </div>
          </DeckHeader>

          <TrackInfo>
            <TrackTitle>
              {nextTrack?.title || 'No Track Loaded'}
            </TrackTitle>
            <TrackMeta>
              <span>{nextTrack?.artist || 'Unknown Artist'}</span>
              <span>{nextTrack?.duration ? formatTime(nextTrack.duration) : '--:--'}</span>
            </TrackMeta>
          </TrackInfo>

          <WaveformContainer>
            <ProfessionalBeatViewport
              ref={waveformRefB}
              deckATrack={null}
              deckBTrack={nextTrack}
              currentTime={0}
              deckBCurrentTime={nextTrackTime}
              isActive={false}
              deckId="B"
              color="#ff5757"
            />
          </WaveformContainer>

          <DeckControls>
            <ControlButton>
              <Play size={20} />
            </ControlButton>
            <ControlButton>
              <SkipForward size={20} />
            </ControlButton>
            <ControlButton>
              <Volume2 size={20} />
            </ControlButton>
          </DeckControls>

          <StemControls>
            {['vocals', 'drums', 'bass', 'other'].map(stem => (
              <StemControl key={stem}>
                <StemLabel>{stem}</StemLabel>
                <StemSlider
                  type="range"
                  min="0"
                  max="100"
                  value={stemLevels.deckB[stem]}
                  onChange={(e) => handleStemChange('deckB', stem, parseInt(e.target.value))}
                  $stemColor={stem === 'vocals' ? '#ff6b6b' : stem === 'drums' ? '#ffa500' : stem === 'bass' ? '#4ecdc4' : '#00ff88'}
                />
              </StemControl>
            ))}
          </StemControls>
        </DeckContainer>
      </DJLayout>

      {/* Queue */}
      <QueueContainer>
        <QueueHeader>
          <QueueTitle>
            <Shuffle size={20} />
            Track Queue ({queue.length} tracks)
          </QueueTitle>
          <QueueControls>
            <QueueButton onClick={openAddTracksModal}>
              <Plus size={16} />
              Add Tracks
            </QueueButton>
            <QueueButton onClick={loadTracks}>
              <Activity size={16} />
              Refresh
            </QueueButton>
            <QueueButton onClick={clearQueue}>
              <X size={16} />
              Clear Queue
            </QueueButton>
          </QueueControls>
        </QueueHeader>
        <QueueList>
          {queue.map((track, index) => (
            <QueueItem key={track.id}>
              <Music size={16} color="#888" />
              <QueueItemInfo>
                <QueueItemTitle>
                  {track.title || track.name || 'Unknown Track'}
                  {index === 0 && <span style={{ color: '#ff2323', marginLeft: '8px' }}>• Now Playing</span>}
                  {index === 1 && <span style={{ color: '#ff5757', marginLeft: '8px' }}>• Up Next</span>}
                </QueueItemTitle>
                <QueueItemMeta>
                  {track.artist || 'Unknown Artist'} • {track.bpm ? `${Math.round(track.bpm)} BPM` : 'Unknown BPM'}
                </QueueItemMeta>
              </QueueItemInfo>
              <QueueItemActions>
                <QueueActionButton 
                  onClick={() => removeTrackFromQueue(track.id)}
                  title="Remove from queue"
                >
                  <X size={14} />
                </QueueActionButton>
              </QueueItemActions>
            </QueueItem>
          ))}
          {queue.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#888',
              fontStyle: 'italic'
            }}>
              No tracks in queue. Click "Add Tracks" to get started.
            </div>
          )}
        </QueueList>
      </QueueContainer>

      {/* Add Tracks Modal */}
      {showAddTracksModal && (
        <AvailableTracksModal onClick={() => setShowAddTracksModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add Tracks to Queue</ModalTitle>
              <CloseButton onClick={() => setShowAddTracksModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <TracksList>
              {availableTracks.length > 0 ? (
                availableTracks.map(track => (
                  <TrackItem key={track.id}>
                    <QueueItemInfo>
                      <QueueItemTitle>{track.title || track.name || 'Unknown Track'}</QueueItemTitle>
                      <QueueItemMeta>
                        {track.artist || 'Unknown Artist'} • {track.bpm ? `${Math.round(track.bpm)} BPM` : 'Unknown BPM'}
                      </QueueItemMeta>
                    </QueueItemInfo>
                    <AddTrackButton onClick={() => addTrackToQueue(track)}>
                      Add to Queue
                    </AddTrackButton>
                  </TrackItem>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  No available tracks. Process some music first!
                </div>
              )}
            </TracksList>
          </ModalContent>
        </AvailableTracksModal>
      )}
    </AIDJContainer>
  );
};

export default AIDJ;
