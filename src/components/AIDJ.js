import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Settings, Plus, X, BarChart3, Music, Check, GripVertical, Info, Sliders, Zap, Filter, RotateCcw, FastForward, Rewind } from 'lucide-react';
import storage from '../utils/storage';
import audioEngine from '../utils/audioEngine';

const AIDJContainer = styled.div`
  padding: 30px;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #888, #ccc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  height: calc(100vh - 150px);
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PlayerSection = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  min-height: 200px;
`;

const NowPlaying = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    background: #333;
    margin-right: 16px;
  }
  
  .track-info {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #fff;
    }
    
    p {
      font-size: 14px;
      color: #888;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
  
  button {
    background: #3a3a3a;
    border: 1px solid #555;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #fff;
    
    &:hover {
      background: #4a4a4a;
      transform: scale(1.05);
    }
    
    &.play-button {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #666, #888);
      
      &:hover {
        background: linear-gradient(135deg, #777, #999);
      }
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  margin-bottom: 12px;
  position: relative;
  
  .progress {
    height: 100%;
    background: linear-gradient(90deg, #666, #888);
    border-radius: 3px;
    width: ${props => props.$progress}%;
    transition: width 0.1s ease;
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
`;

const StemVisualizer = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  flex: 1;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
      color: #888;
    }
  }
`;

const DJMixer = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
      color: #888;
    }
  }
`;

const MixerControls = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: start;
`;

const ChannelStrip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .channel-header {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const EQSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .eq-label {
    font-size: 12px;
    color: #888;
    text-align: center;
    text-transform: uppercase;
  }
`;

const ModernSlider = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .slider-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .slider-container {
    width: 80px;
    height: 6px;
    background: #333;
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    
    &:hover {
      background: #3a3a3a;
    }
    
    .slider-track {
      height: 100%;
      background: linear-gradient(90deg, #666, #888);
      border-radius: 3px;
      width: ${props => props.$value * 100}%;
      transition: width 0.1s ease;
    }
    
    .slider-thumb {
      position: absolute;
      top: -4px;
      width: 14px;
      height: 14px;
      background: #888;
      border-radius: 50%;
      left: ${props => props.$value * 100}%;
      transform: translateX(-50%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.1s ease;
      
      &:hover {
        background: #999;
        transform: translateX(-50%) scale(1.1);
      }
    }
  }
  
  .slider-value {
    font-size: 10px;
    color: #666;
    min-width: 24px;
    text-align: center;
  }
`;

const RotaryKnob = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .knob-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .knob-container {
    width: 50px;
    height: 50px;
    background: radial-gradient(circle, #2a2a2a, #1a1a1a);
    border: 2px solid #444;
    border-radius: 50%;
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #666;
      box-shadow: 0 0 10px rgba(136, 136, 136, 0.2);
    }
    
    &::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 50%;
      width: 3px;
      height: 15px;
      background: ${props => props.$active ? '#888' : '#666'};
      border-radius: 2px;
      transform: translateX(-50%) rotate(${props => (props.$value - 0.5) * 270}deg);
      transform-origin: center 19px;
      transition: all 0.2s ease;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      background: #333;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  }
  
  .knob-value {
    font-size: 10px;
    color: #666;
    min-width: 24px;
    text-align: center;
  }
`;

const Crossfader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  .crossfader-track {
    width: 200px;
    height: 8px;
    background: #333;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    
    .crossfader-thumb {
      position: absolute;
      top: -8px;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #666, #888);
      border-radius: 50%;
      left: ${props => props.$position * 100}%;
      transform: translateX(-50%);
      transition: all 0.1s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      
      &:hover {
        background: linear-gradient(135deg, #777, #999);
        transform: translateX(-50%) scale(1.1);
      }
    }
  }
  
  .crossfader-labels {
    display: flex;
    justify-content: space-between;
    width: 200px;
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
  }
`;

const EffectsRack = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 20px;
`;

const EffectControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .effect-name {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .effect-slider {
    width: 100px;
    height: 4px;
    background: #333;
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    
    .slider-fill {
      height: 100%;
      background: linear-gradient(90deg, #666, #888);
      border-radius: 2px;
      width: ${props => props.$value * 100}%;
    }
    
    .slider-thumb {
      position: absolute;
      top: -6px;
      width: 16px;
      height: 16px;
      background: #888;
      border-radius: 50%;
      left: ${props => props.$value * 100}%;
      transform: translateX(-50%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  }
  
  .effect-value {
    font-size: 11px;
    color: #666;
  }
`;

const BPMSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .bpm-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .bpm-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }
    
    .bpm-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
    }
  }
  
  .sync-button {
    background: ${props => props.$synced ? 'linear-gradient(135deg, #4a4a4a, #666)' : '#3a3a3a'};
    border: 1px solid ${props => props.$synced ? '#888' : '#555'};
    border-radius: 8px;
    padding: 8px 16px;
    color: ${props => props.$synced ? '#fff' : '#888'};
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, #4a4a4a, #666);
      color: #fff;
    }
  }
`;

const AutoMixIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #2a4a2a, #4a6a4a)' : '#3a3a3a'};
  border: 1px solid ${props => props.$active ? '#4a8a4a' : '#555'};
  border-radius: 8px;
  font-size: 12px;
  color: ${props => props.$active ? '#8af48a' : '#888'};
  
  .indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$active ? '#4af44a' : '#666'};
    animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const StemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const StemCard = styled.div`
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 16px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .volume-slider {
    width: 100%;
    height: 4px;
    background: #333;
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    
    .slider-fill {
      height: 100%;
      background: linear-gradient(90deg, #666, #888);
      border-radius: 2px;
      width: ${props => props.$volume}%;
    }
  }
  
  .volume-label {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
  }
`;

const QueueSection = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const QueueList = styled.div`
  overflow-y: auto;
  max-height: calc(100% - 60px);
`;

const SongSelectionModal = styled.div`
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
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #fff;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
      color: #888;
    }
  }
  
  .modal-subtitle {
    font-size: 14px;
    color: #888;
    margin-bottom: 24px;
  }
`;

const SongList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
    
    &:hover {
      background: #777;
    }
  }
`;

const SongItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: ${props => props.$selected ? '#3a3a3a' : 'transparent'};
  border: 1px solid ${props => props.$selected ? '#555' : 'transparent'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3a3a;
  }
  
  .song-checkbox {
    margin-right: 12px;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #666;
    }
  }
  
  .song-info {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;
      color: #fff;
    }
    
    p {
      font-size: 12px;
      color: #888;
    }
  }
  
  .song-stems {
    display: flex;
    align-items: center;
    font-size: 10px;
    color: #666;
    
    svg {
      margin-right: 4px;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #333;
  padding-top: 16px;
  
  .selection-info {
    font-size: 12px;
    color: #888;
  }
  
  .modal-buttons {
    display: flex;
    gap: 12px;
    
    button {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &.btn-cancel {
        background: transparent;
        border: 1px solid #555;
        color: #888;
        
        &:hover {
          background: #3a3a3a;
          color: #aaa;
        }
      }
      
      &.btn-add {
        background: linear-gradient(135deg, #666, #888);
        border: none;
        color: #fff;
        
        &:hover {
          background: linear-gradient(135deg, #777, #999);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

const QueueItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: ${props => props.$active ? '#3a3a3a' : 'transparent'};
  border: 1px solid ${props => props.$isDragging ? '#666' : 'transparent'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3a3a;
  }
  
  .drag-handle {
    margin-right: 12px;
    color: #666;
    cursor: grab;
    
    &:hover {
      color: #888;
    }
  }
  
  .track-thumb {
    width: 40px;
    height: 40px;
    background: #333;
    border-radius: 6px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      color: #666;
    }
  }
  
  .track-details {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;
      color: #fff;
    }
    
    p {
      font-size: 12px;
      color: #888;
    }
  }
  
  .track-stems {
    display: flex;
    align-items: center;
    margin-right: 12px;
    font-size: 10px;
    color: #666;
    
    svg {
      margin-right: 4px;
    }
  }
  
  .remove-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: #888;
      background: #333;
    }
  }
`;

const AddButton = styled.button`
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 8px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #4a4a4a;
    color: #aaa;
  }
  
  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    margin-bottom: 8px;
    z-index: 1000;
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1a1a1a;
    }
  }
  
  &:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  padding: 40px 0;
  
  svg {
    margin-bottom: 16px;
    opacity: 0.3;
  }
  
  p {
    margin-bottom: 8px;
  }
  
  .empty-subtitle {
    font-size: 12px;
    opacity: 0.8;
  }
`;

function AIDJ() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: "Select a track to start mixing",
    artist: "No track loaded",
    duration: 0,
    currentTime: 0,
    bpm: 120
  });
  const [queue, setQueue] = useState([]);
  const [stemVolumes, setStemVolumes] = useState({
    vocals: 0.75,
    drums: 0.85,
    bass: 0.80,
    other: 0.70
  });
  const [showSongSelection, setShowSongSelection] = useState(false);
  const [processedTracks, setProcessedTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // DJ Controls State
  const [autoMixEnabled, setAutoMixEnabled] = useState(false);
  const [crossfadePosition, setCrossfadePosition] = useState(0.5);
  const [bpmSynced, setBpmSynced] = useState(false);
  const [deckEffects, setDeckEffects] = useState({
    deckA: {
      reverb: 0,
      delay: 0,  
      filter: 0,
      distortion: 0
    },
    deckB: {
      reverb: 0,
      delay: 0,
      filter: 0, 
      distortion: 0
    }
  });
  const [eqSettings, setEqSettings] = useState({
    deckA: { high: 0.5, mid: 0.5, low: 0.5 },
    deckB: { high: 0.5, mid: 0.5, low: 0.5 }
  });
  
  const audioEngineRef = useRef(null);

  // Load processed tracks and initialize audio engine
  useEffect(() => {
    const loadProcessedTracks = () => {
      const allTracks = storage.getTracks();
      const processed = allTracks.filter(track => 
        track.status === 'completed' && track.stemsPath
      );
      setProcessedTracks(processed);
    };

    loadProcessedTracks();
    
    // Initialize audio engine
    audioEngineRef.current = audioEngine;
    
    // Set up audio engine listeners
    const handleAudioEvent = (event, data) => {
      switch (event) {
        case 'playbackStarted':
          setIsPlaying(true);
          break;
        case 'playbackPaused':
        case 'playbackStopped':
          setIsPlaying(false);
          break;
        case 'timeUpdate':
          setCurrentTrack(prev => ({
            ...prev,
            currentTime: data.currentTime,
            duration: data.duration,
            currentTimeFormatted: data.currentTimeFormatted,
            durationFormatted: data.durationFormatted,
            progress: data.progress
          }));
          break;
        case 'trackEnded':
          // Auto-progress to next track if queue has more tracks
          if (queue.length > 1) {
            setQueue(prev => prev.slice(1));
            setTimeout(() => loadCurrentTrack(), 100);
          } else {
            setIsPlaying(false);
          }
          break;
        case 'stemVolumeChanged':
          setStemVolumes(prev => ({
            ...prev,
            [data.stemName]: data.volume
          }));
          break;
        case 'crossfadeChanged':
          setCrossfadePosition(data.position);
          break;
        case 'deckEffectChanged':
          setDeckEffects(prev => ({
            ...prev,
            [`deck${data.deck}`]: {
              ...prev[`deck${data.deck}`],
              [data.effectName]: data.value
            }
          }));
          break;
        case 'deckEQChanged':
          setEqSettings(prev => ({
            ...prev,
            [`deck${data.deck}`]: {
              ...prev[`deck${data.deck}`],
              [data.band]: data.value
            }
          }));
          break;
        case 'autoMixChanged':
          setAutoMixEnabled(data.enabled);
          break;
        case 'transitionComplete':
          // Load next track from queue
          if (queue.length > 1) {
            const nextTrack = queue[1];
            setCurrentTrack({
              title: nextTrack.title,
              artist: nextTrack.artist,
              duration: nextTrack.duration,
              currentTime: 0,
              bpm: nextTrack.bpm || 120
            });
            setQueue(prev => prev.slice(1));
          }
          break;
      }
    };
    
    audioEngine.addEventListener(handleAudioEvent);
    
    // Refresh processed tracks every 5 seconds to catch newly processed songs
    const interval = setInterval(loadProcessedTracks, 5000);
    
    return () => {
      clearInterval(interval);
      audioEngine.removeEventListener(handleAudioEvent);
    };
  }, []);

  const stems = [
    { key: 'vocals', name: 'Vocals', volume: stemVolumes.vocals },
    { key: 'drums', name: 'Drums', volume: stemVolumes.drums },
    { key: 'bass', name: 'Bass', volume: stemVolumes.bass },
    { key: 'other', name: 'Other', volume: stemVolumes.other }
  ];

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        audioEngine.pause();
      } else {
        if (!audioEngine.currentTrack && queue.length > 0) {
          await loadCurrentTrack();
        }
        await audioEngine.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const loadCurrentTrack = async () => {
    if (queue.length === 0) return;
    
    try {
      const trackToLoad = queue[0];
      console.log('Loading track for playback:', trackToLoad);
      
      const loadedTrack = await audioEngine.loadTrack(trackToLoad);
      audioEngine.currentTrack = loadedTrack;
      audioEngine.duration = loadedTrack.duration;
      
      // Load next track if available
      if (queue.length > 1) {
        const nextTrack = await audioEngine.loadTrack(queue[1]);
        audioEngine.loadNextTrack(nextTrack);
      }
      
      setCurrentTrack({
        title: loadedTrack.title,
        artist: loadedTrack.artist,
        duration: loadedTrack.duration,
        currentTime: 0,
        bpm: loadedTrack.bpm
      });
      
    } catch (error) {
      console.error('Error loading track:', error);
    }
  };

  const skipToNext = async () => {
    if (queue.length > 1) {
      setQueue(prev => prev.slice(1));
      await loadCurrentTrack();
      if (isPlaying) {
        await audioEngine.play();
      }
    }
  };

  const handleStemVolumeChange = (stemName, volume) => {
    audioEngine.setStemVolume(stemName, volume);
  };

  const handleCrossfadeChange = (position) => {
    audioEngine.setCrossfade(position);
  };

  const handleDeckEffectChange = (deck, effectName, value) => {
    audioEngine.setDeckEffect(deck, effectName, value);
  };

  const handleDeckEQChange = (deck, band, value) => {
    audioEngine.setDeckEQ(deck, band, value);
  };

  const toggleAutoMix = () => {
    const newState = !autoMixEnabled;
    audioEngine.setAutoMix(newState);
    setAutoMixEnabled(newState);
  };

  const syncBPM = () => {
    setBpmSynced(!bpmSynced);
    // In a real implementation, this would sync the BPM between tracks
    console.log('BPM sync toggled:', !bpmSynced);
  };

  const skipForward = () => {
    if (audioEngine.currentTrack) {
      const newTime = Math.min(
        audioEngine.currentTime + 15, 
        audioEngine.currentTrack.duration || audioEngine.duration
      );
      seekToTime(newTime);
    }
  };

  const skipBackward = () => {
    if (audioEngine.currentTrack) {
      const newTime = Math.max(audioEngine.currentTime - 15, 0);
      seekToTime(newTime);
    }
  };

  const seekToTime = (time) => {
    if (!audioEngine.currentTrack) return;
    
    // Stop current playback
    audioEngine.stopAllSources();
    
    // Update current time
    audioEngine.currentTime = time;
    
    // Restart playback from new position if playing
    if (isPlaying) {
      audioEngine.startPlayback();
    }
  };

  const openSongSelection = () => {
    setShowSongSelection(true);
    setSelectedTracks([]);
  };

  const closeSongSelection = () => {
    setShowSongSelection(false);
    setSelectedTracks([]);
  };

  const toggleTrackSelection = (track) => {
    setSelectedTracks(prev => {
      const isSelected = prev.some(t => t.id === track.id);
      if (isSelected) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const addSelectedToQueue = async () => {
    if (selectedTracks.length === 0) return;
    
    const newQueueItems = selectedTracks.map(track => ({
      id: `queue_${Date.now()}_${track.id}`,
      trackId: track.id,
      title: track.name,
      artist: 'Processed Track',
      duration: '0:00', // Would be calculated from audio info
      filePath: track.filePath,
      stemsPath: track.stemsPath,
      hasStemsReady: true
    }));
    
    const wasQueueEmpty = queue.length === 0;
    setQueue(prev => [...prev, ...newQueueItems]);
    closeSongSelection();
    
    // If queue was empty, load the first track
    if (wasQueueEmpty && newQueueItems.length > 0) {
      setTimeout(() => loadCurrentTrack(), 100); // Small delay to ensure state is updated
    }
    
    console.log(`Added ${selectedTracks.length} tracks to queue`);
  };

  const removeFromQueue = (id) => {
    setQueue(queue.filter(track => track.id !== id));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const items = Array.from(queue);
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, reorderedItem);
    
    setQueue(items);
    console.log(`Moved track from position ${draggedIndex + 1} to ${dropIndex + 1}`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getProcessedStemCount = (track) => {
    if (!track.stemsPath) return 0;
    
    // Count available stem files (vocals, drums, bass, other)
    const expectedStems = ['vocals', 'drums', 'bass', 'other'];
    return expectedStems.length; // For now, assume all 4 stems if track is completed
  };

  const progress = currentTrack.duration > 0 ? (currentTrack.currentTime / currentTrack.duration) * 100 : 0;

  return (
    <AIDJContainer>
      <Header>
        <h1>AI|DJ Studio</h1>
        <div>
          <button 
            className="btn-secondary" 
            style={{ marginRight: '12px' }}
            title="Open DJ Settings and Preferences"
          >
            <Settings size={16} style={{ marginRight: '8px' }} />
            Settings
          </button>
          <button 
            className={autoMixEnabled ? "btn-primary" : "btn-secondary"}
            onClick={toggleAutoMix}
            title={autoMixEnabled 
              ? "🤖 AI Auto-Mix is ON - AI will handle transitions automatically. Click to switch to manual control." 
              : "🎛️ Manual Mode - You control all mixing. Click to enable AI Auto-Mix for intelligent transitions."
            }
            style={{
              background: autoMixEnabled 
                ? 'linear-gradient(135deg, #4a6a4a, #6a8a6a)' 
                : undefined
            }}
          >
            <Shuffle size={16} style={{ marginRight: '8px' }} />
            Auto Mix {autoMixEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </Header>

      <MainGrid>
        <LeftPanel>
          <PlayerSection>
            <NowPlaying>
              <div className="track-thumb" />
              <div className="track-info">
                <h3>{currentTrack.title}</h3>
                <p>{currentTrack.artist}</p>
              </div>
            </NowPlaying>

            <Controls>
              <button title="🔀 Shuffle queue - Randomize the order of tracks in your queue">
                <Shuffle size={20} />
              </button>
              <button onClick={skipBackward} title="⏪ Rewind 15 seconds - Jump back in the current track">
                <Rewind size={18} />
              </button>
              <button title="⏮️ Previous Track - Go to the previous song in queue">
                <SkipBack size={20} />
              </button>
              <button 
                className="play-button" 
                onClick={togglePlayback} 
                title={isPlaying ? '⏸️ Pause - Stop the music playback' : '▶️ Play - Start the music with stem mixing'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={skipToNext} title="⏭️ Next Track - Skip to the next song in queue">
                <SkipForward size={20} />
              </button>
              <button onClick={skipForward} title="⏩ Skip 15 seconds - Jump forward in the current track">
                <FastForward size={18} />
              </button>
              <button title="🔊 Master Volume - Adjust overall output level">
                <Volume2 size={20} />
              </button>
            </Controls>

            <ProgressBar $progress={currentTrack.progress || 0}>
              <div className="progress" />
            </ProgressBar>

            <TimeDisplay>
              <span>{currentTrack.currentTimeFormatted || '0:00'}</span>
              <span>{currentTrack.durationFormatted || '0:00'}</span>
            </TimeDisplay>
          </PlayerSection>

          <StemVisualizer>
            <h3>
              <BarChart3 size={20} />
              Stem Controls
            </h3>
            <StemGrid>
              {stems.map(stem => (
                <StemCard key={stem.key} $volume={stem.volume * 100}>
                  <h4>{stem.name}</h4>
                  <div 
                    className="volume-slider"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const volume = x / rect.width;
                      handleStemVolumeChange(stem.key, Math.max(0, Math.min(1, volume)));
                    }}
                  >
                    <div className="slider-fill" />
                  </div>
                  <div className="volume-label">{Math.round(stem.volume * 100)}%</div>
                </StemCard>
              ))}
            </StemGrid>
          </StemVisualizer>

          <DJMixer>
            <BPMSection $synced={bpmSynced}>
              <div className="bpm-display">
                <div className="bpm-value">{currentTrack.bpm}</div>
                <div className="bpm-label">BPM</div>
              </div>
              <AutoMixIndicator $active={autoMixEnabled}>
                <div className="indicator-dot"></div>
                AI Auto-Mix {autoMixEnabled ? 'ON' : 'OFF'}
              </AutoMixIndicator>
              <button 
                className="sync-button" 
                onClick={syncBPM}
                title={bpmSynced 
                  ? "🔄 BPM Sync is ON - Tracks are tempo-matched for smooth mixing" 
                  : "🔄 Enable BPM Sync - Automatically match track tempos for seamless transitions"
                }
              >
                <RotateCcw size={14} style={{ marginRight: '4px' }} />
                SYNC
              </button>
            </BPMSection>

            <h3>
              <Sliders size={20} />
              Professional DJ Mixer
            </h3>
            
            <MixerControls>
              <ChannelStrip>
                <div className="channel-header">🎵 Deck A</div>
                <EQSection>
                  <RotaryKnob 
                    $value={eqSettings.deckA.high} 
                    $active={eqSettings.deckA.high !== 0.5}
                  >
                    <div className="knob-label">High</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckA.high;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('A', 'high', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckA.high - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                  
                  <RotaryKnob 
                    $value={eqSettings.deckA.mid} 
                    $active={eqSettings.deckA.mid !== 0.5}
                  >
                    <div className="knob-label">Mid</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckA.mid;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('A', 'mid', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckA.mid - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                  
                  <RotaryKnob 
                    $value={eqSettings.deckA.low} 
                    $active={eqSettings.deckA.low !== 0.5}
                  >
                    <div className="knob-label">Low</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckA.low;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('A', 'low', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);  
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckA.low - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                </EQSection>
              </ChannelStrip>

              <Crossfader $position={crossfadePosition}>
                <div 
                  className="crossfader-track"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startPosition = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const position = Math.max(0, Math.min(1, x / rect.width));
                      handleCrossfadeChange(position);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleCrossfadeChange(startPosition);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="crossfader-thumb"></div>
                </div>
                <div className="crossfader-labels">
                  <span>A</span>
                  <span>B</span>
                </div>
              </Crossfader>

              <ChannelStrip>
                <div className="channel-header">🎵 Deck B</div>
                <EQSection>
                  <RotaryKnob 
                    $value={eqSettings.deckB.high} 
                    $active={eqSettings.deckB.high !== 0.5}
                  >
                    <div className="knob-label">High</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckB.high;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('B', 'high', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckB.high - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                  
                  <RotaryKnob 
                    $value={eqSettings.deckB.mid} 
                    $active={eqSettings.deckB.mid !== 0.5}
                  >
                    <div className="knob-label">Mid</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckB.mid;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('B', 'mid', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckB.mid - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                  
                  <RotaryKnob 
                    $value={eqSettings.deckB.low} 
                    $active={eqSettings.deckB.low !== 0.5}
                  >
                    <div className="knob-label">Low</div>
                    <div 
                      className="knob-container"
                      onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startValue = eqSettings.deckB.low;
                        
                        const handleMouseMove = (e) => {
                          const deltaY = startY - e.clientY;
                          const newValue = Math.max(0, Math.min(1, startValue + deltaY / 100));
                          handleDeckEQChange('B', 'low', newValue);
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                    <div className="knob-value">{Math.round((eqSettings.deckB.low - 0.5) * 40)}dB</div>
                  </RotaryKnob>
                </EQSection>
              </ChannelStrip>
            </MixerControls>

            <EffectsRack>
              <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '14px', color: '#888' }}>
                <strong>Deck A Effects</strong>
              </div>
              
              <ModernSlider $value={deckEffects.deckA.reverb}>
                <div className="slider-label">
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  Reverb
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('A', 'reverb', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('A', 'reverb', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckA.reverb * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckA.delay}>
                <div className="slider-label">
                  <RotateCcw size={10} style={{ marginRight: '4px' }} />
                  Delay
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('A', 'delay', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('A', 'delay', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckA.delay * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckA.filter}>
                <div className="slider-label">
                  <Filter size={10} style={{ marginRight: '4px' }} />
                  Filter
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('A', 'filter', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('A', 'filter', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckA.filter * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckA.distortion}>
                <div className="slider-label">
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  Distortion
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('A', 'distortion', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('A', 'distortion', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckA.distortion * 100)}%</div>
              </ModernSlider>

              <div style={{ textAlign: 'center', margin: '24px 0 16px', fontSize: '14px', color: '#888' }}>
                <strong>Deck B Effects</strong>
              </div>

              <ModernSlider $value={deckEffects.deckB.reverb}>
                <div className="slider-label">
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  Reverb
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('B', 'reverb', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('B', 'reverb', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckB.reverb * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckB.delay}>
                <div className="slider-label">
                  <RotateCcw size={10} style={{ marginRight: '4px' }} />
                  Delay
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('B', 'delay', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('B', 'delay', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckB.delay * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckB.filter}>
                <div className="slider-label">
                  <Filter size={10} style={{ marginRight: '4px' }} />
                  Filter
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('B', 'filter', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('B', 'filter', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckB.filter * 100)}%</div>
              </ModernSlider>

              <ModernSlider $value={deckEffects.deckB.distortion}>
                <div className="slider-label">
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  Distortion
                </div>
                <div 
                  className="slider-container"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const value = Math.max(0, Math.min(1, x / rect.width));
                      handleDeckEffectChange('B', 'distortion', value);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    handleDeckEffectChange('B', 'distortion', startValue);
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="slider-track"></div>
                  <div className="slider-thumb"></div>
                </div>
                <div className="slider-value">{Math.round(deckEffects.deckB.distortion * 100)}%</div>
              </ModernSlider>
            </EffectsRack>
          </DJMixer>
        </LeftPanel>

        <RightPanel>
          <QueueSection>
            <h3>
              Queue ({queue.length})
              <AddButton 
                onClick={openSongSelection}
                title="➕ Add songs to queue - Select from your processed tracks ready for DJ mixing"
              >
                <Plus size={16} />
                <div className="tooltip">
                  🎵 Add processed songs to DJ queue
                </div>
              </AddButton>
            </h3>
            
            <QueueList>
              {queue.length === 0 ? (
                <EmptyState>
                  <Music size={48} />
                  <p>No tracks in queue</p>
                  <p className="empty-subtitle">Click + to add processed music</p>
                </EmptyState>
                              ) : (
                  <div>
                    {queue.map((track, index) => (
                      <QueueItem
                        key={track.id}
                        $active={index === 0}
                        $isDragging={false}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div 
                          className="drag-handle"
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} />
                        </div>
                        <div className="track-thumb">
                          <Music size={20} />
                        </div>
                        <div className="track-details">
                          <h4>{track.title}</h4>
                          <p>{track.artist} • {track.duration}</p>
                        </div>
                        {track.hasStemsReady && (
                          <div className="track-stems" title="Stems ready for AI mixing">
                            <BarChart3 size={12} />
                            4 stems
                          </div>
                        )}
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromQueue(track.id)}
                          title="Remove from queue"
                        >
                          <X size={16} />
                        </button>
                      </QueueItem>
                    ))}
                  </div>
                )}
            </QueueList>
          </QueueSection>
        </RightPanel>
      </MainGrid>

      {/* Song Selection Modal */}
      {showSongSelection && (
        <SongSelectionModal>
          <ModalContent>
            <h3>
              <Music size={20} />
              Add Songs to Queue
            </h3>
            <p className="modal-subtitle">
              Select processed songs with stems ready for AI mixing
            </p>
            
            <SongList>
              {processedTracks.length === 0 ? (
                <EmptyState>
                  <Info size={36} />
                  <p>No processed songs available</p>
                  <p className="empty-subtitle">
                    Go to "Upload & Process" to add and process music first
                  </p>
                </EmptyState>
              ) : (
                processedTracks.map(track => (
                  <SongItem 
                    key={track.id}
                    $selected={selectedTracks.some(t => t.id === track.id)}
                    onClick={() => toggleTrackSelection(track)}
                  >
                    <div className="song-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTracks.some(t => t.id === track.id)}
                        onChange={() => {}} // Handled by parent onClick
                      />
                    </div>
                    <div className="song-info">
                      <h4>{track.name}</h4>
                      <p>Ready for AI mixing • Processed track</p>
                    </div>
                    <div className="song-stems" title="Available stems for mixing">
                      <BarChart3 size={12} />
                      {getProcessedStemCount(track)} stems
                    </div>
                  </SongItem>
                ))
              )}
            </SongList>
            
            <ModalActions>
              <div className="selection-info">
                {selectedTracks.length > 0 
                  ? `${selectedTracks.length} song${selectedTracks.length !== 1 ? 's' : ''} selected`
                  : 'Select songs to add to queue'
                }
              </div>
              <div className="modal-buttons">
                <button 
                  className="btn-cancel" 
                  onClick={closeSongSelection}
                  title="Close song selection without adding tracks"
                >
                  Cancel
                </button>
                <button 
                  className="btn-add" 
                  onClick={addSelectedToQueue}
                  disabled={selectedTracks.length === 0}
                  title={selectedTracks.length === 0 
                    ? "Select songs first to add them to the DJ queue"
                    : `Add ${selectedTracks.length} selected song${selectedTracks.length !== 1 ? 's' : ''} to the DJ queue for mixing`
                  }
                >
                  Add {selectedTracks.length > 0 ? `${selectedTracks.length} ` : ''}to Queue
                </button>
              </div>
            </ModalActions>
          </ModalContent>
        </SongSelectionModal>
      )}
    </AIDJContainer>
  );
}

export default AIDJ; 