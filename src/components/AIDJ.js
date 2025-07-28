import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Settings, Plus, X, BarChart3, Music, Check, GripVertical, Info, Sliders, Zap, Filter, RotateCcw, FastForward, Rewind } from 'lucide-react';
import storage from '../utils/storage';
import audioEngine from '../utils/audioEngine';
import ProfessionalBeatViewport from './ProfessionalBeatViewport';

const AIDJContainer = styled.div`
  padding: 30px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  padding-bottom: 100px; /* Extra space for scrolling */
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
  min-height: calc(100vh - 150px);
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

const ModernSlider = styled.div.attrs(props => ({
  style: {
    '--slider-value': `${props.$value * 100}%`
  }
}))`
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
      width: var(--slider-value);
      transition: width 0.1s ease;
    }
    
    .slider-thumb {
      position: absolute;
      top: -4px;
      width: 14px;
      height: 14px;
      background: #888;
      border-radius: 50%;
      left: var(--slider-value);
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

const RotaryKnob = styled.div.attrs(props => ({
  style: {
    '--knob-rotation': `${(props.$value - 0.5) * 270}deg`,
    '--knob-color': props.$active ? '#888' : '#666'
  }
}))`
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
      background: var(--knob-color);
      border-radius: 2px;
      transform: translateX(-50%) rotate(var(--knob-rotation));
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

  .crossfader-value {
    font-size: 12px;
    color: #888;
    font-family: monospace;
  }
  
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

  .deck-label {
    background: #444;
    color: #fff;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
    margin-left: 6px;
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

const WaveformContainer = styled.div`
  width: 100%;
  height: 120px;
  background: #1a1a1a;
  border-radius: 8px;
  margin: 16px 0;
  position: relative;
  overflow: hidden;
  border: 1px solid #333;
`;

const WaveformCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const BeatGridOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const BeatMarker = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${props => 
    props.$type === 'downbeat' ? '#00ff88' : 
    props.$type === 'beat' ? '#88ff00' : '#666'
  };
  opacity: ${props => props.$confidence || 0.5};
  left: ${props => props.$position}%;
`;

const PlayheadMarker = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff4444;
  left: ${props => props.$position}%;
  z-index: 10;
`;

const FrequencyBands = styled.div`
  display: flex;
  height: 40px;
  margin-top: 8px;
  gap: 1px;
`;

const FrequencyBand = styled.div`
  flex: 1;
  background: linear-gradient(to top, 
    ${props => props.$level > 0.7 ? '#ff4444' : 
             props.$level > 0.4 ? '#ffaa00' : 
             props.$level > 0.2 ? '#88ff00' : '#004400'}
  );
  height: ${props => props.$level * 100}%;
  align-self: flex-end;
  min-height: 2px;
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
  const [beatGrid, setBeatGrid] = useState([]);
  const [waveformData, setWaveformData] = useState([]);
  const [deckBTrack, setDeckBTrack] = useState(null);
  const [deckBBeatGrid, setDeckBBeatGrid] = useState([]);
  const [deckBWaveform, setDeckBWaveform] = useState([]);
  const [deckBCurrentTime, setDeckBCurrentTime] = useState(0);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckAQueue, setDeckAQueue] = useState([]);
  const [deckBQueue, setDeckBQueue] = useState([]);
  
  const audioEngineRef = useRef(null);
  const waveformCanvasRef = useRef(null);

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
        case 'bpmDetected':
          console.log('🎵 BPM detected:', data.originalBPM, 'Current:', data.currentBPM);
          setCurrentTrack(prev => ({
            ...prev,
            bmp: data.bmp || data.bpm,
            bpm: data.bpm || data.bmp,
            originalBPM: data.originalBPM || data.bpm,
            currentBPM: data.currentBPM || data.bpm,
            pitchRatio: data.pitchRatio || 1.0,
            key: data.key // Key might be included with BPM detection
          }));
          setBeatGrid(data.beatGrid || []);
          setWaveformData(data.waveform || []);
          break;
        case 'keyDetected':
          console.log('🎼 Key detected:', data.originalKey?.name, 'Current:', data.currentKey?.name);
          setCurrentTrack(prev => ({
            ...prev,
            key: data.key || data.originalKey,
            originalKey: data.originalKey || data.key,
            currentKey: data.currentKey || data.key,
            keyShift: data.keyShift || 0
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
          // Handle deck-specific stem volume updates from AI DJ
          if (data.deck) {
            // Update deck-specific stem volumes
            setStemVolumes(prev => ({
              ...prev,
              [`deck${data.deck}_${data.stemName}`]: data.volume
            }));
            console.log(`🎛️ AI DJ updated Deck ${data.deck} ${data.stemName}: ${Math.round(data.volume * 100)}%`);
          } else {
            // Legacy single-deck update
            setStemVolumes(prev => ({
              ...prev,
              [data.stemName]: data.volume
            }));
          }
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
        case 'requestNextTrack':
          console.log('🎵 Audio engine requesting next track:', data);
          
          const currentDeck = data.currentDeck || 'A';
          const nextDeck = currentDeck === 'A' ? 'B' : 'A';
          
          let nextTrackData = null;
          
          // Get next track from appropriate deck queue
          if (nextDeck === 'A' && deckAQueue.length > 0) {
            nextTrackData = deckAQueue[0];
            console.log(`🎵 Loading track from Deck A queue: ${nextTrackData.title}`);
            setDeckAQueue(prev => prev.slice(1)); // Remove track from queue
          } else if (nextDeck === 'B' && deckBQueue.length > 0) {
            nextTrackData = deckBQueue[0];
            console.log(`🎵 Loading track from Deck B queue: ${nextTrackData.title}`);
            setDeckBQueue(prev => prev.slice(1)); // Remove track from queue
          } else if (queue.length > 1) {
            // Fallback to main queue
            nextTrackData = queue[1];
            console.log(`🎵 Loading track from main queue: ${nextTrackData.title}`);
            setQueue(prev => prev.slice(1));
          }
          
          if (nextTrackData) {
            console.log(`🎵 Loading track into Deck ${nextDeck}:`, nextTrackData.title);
            loadTrackIntoEngine(nextTrackData, nextDeck);
          } else {
            console.log('⚠️ No tracks available in any queue for transition');
          }
          break;
        case 'transitionButtonReset':
          // Reset transition button immediately when transition completes
          const transitionButton = document.querySelector('[title*="Force immediate AI transition"]');
          if (transitionButton) {
            transitionButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>Transition Quick!';
            transitionButton.disabled = false;
            transitionButton.style.opacity = '1';
          }
          break;
        case 'deckBTrackLoaded':
          console.log('🎵 Deck B track loaded with beatgrid:', data.track.title);
          setDeckBTrack(data.track);
          setDeckBBeatGrid(data.beatGrid || []);
          setDeckBWaveform(data.waveform || []);
          setDeckBCurrentTime(0); // Reset Deck B time when new track loads
          break;
        case 'deckBTimeUpdate':
          setDeckBCurrentTime(data.currentTime || 0);
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

  // Draw waveform when data changes
  useEffect(() => {
    if (waveformCanvasRef.current && waveformData.length > 0) {
      drawWaveform();
    }
  }, [waveformData, currentTrack.currentTime]);

  const drawWaveform = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2; // Retina display
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width / 2, height / 2);
    
    if (waveformData.length === 0) return;
    
    // Draw waveform
    ctx.fillStyle = '#00ff88';
    const barWidth = (width / 2) / waveformData.length;
    
    waveformData.forEach((point, index) => {
      const barHeight = (point.rms * height) / 2;
      const x = index * barWidth;
      const y = (height / 2 - barHeight) / 2;
      
      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
    });
    
    // Draw peak levels in lighter color
    ctx.fillStyle = '#88ff00';
    waveformData.forEach((point, index) => {
      const barHeight = (point.peak * height) / 4; // Peaks are more subtle
      const x = index * barWidth;
      const y = (height / 2 - barHeight) / 2;
      
      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), 2); // Thin peak line
    });
  };

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
        bmp: loadedTrack.bmp || loadedTrack.bpm || 120,
        bpm: loadedTrack.bpm || loadedTrack.bmp || 120,
        key: loadedTrack.key
      });
      
    } catch (error) {
      console.error('Error loading track:', error);
    }
  };

  const loadTrackIntoEngine = async (track, deck = 'A') => {
    console.log(`Loading track into Deck ${deck}:`, track.title);

    try {
      const trackData = {
        ...track,
        deck: deck,
        bmp: track.bmp || 120
      };

      // Load as next track for transitions
      await audioEngine.loadNextTrack(trackData);
      
      console.log(`Track loaded into Deck ${deck} successfully`);
    } catch (error) {
      console.error(`Error loading track into Deck ${deck}:`, error);
    }
  };

  const skipToNext = async () => {
    if (queue.length > 1) {
      console.log('Skipping to next track in queue');
      
      // Stop current playback completely
      audioEngine.stop();
      setIsPlaying(false);
      
      // Remove current track from queue
      setQueue(prev => prev.slice(1));
      
      // Wait a moment for audio to stop
      setTimeout(async () => {
        await loadCurrentTrack();
        if (isPlaying) {
          await audioEngine.play();
          setIsPlaying(true);
        }
      }, 100);
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

  const toggleDeckA = async () => {
    if (deckAPlaying) {
      audioEngine.pauseDeck('A');
      setDeckAPlaying(false);
    } else {
      audioEngine.playDeck('A');
      setDeckAPlaying(true);
    }
  };

  const toggleDeckB = async () => {
    if (deckBPlaying) {
      audioEngine.pauseDeck('B');
      setDeckBPlaying(false);
    } else {
      audioEngine.playDeck('B');
      setDeckBPlaying(true);
    }
  };

  const addToDeckQueue = (trackOrDeck, deckOrTracks) => {
    // Handle both signatures: (deck, tracks) and (track, deck)
    let deck, tracks;
    
    if (typeof deckOrTracks === 'string') {
      // New signature: (track, deck)
      deck = deckOrTracks;
      tracks = [trackOrDeck];
    } else {
      // Old signature: (deck, tracks)
      deck = trackOrDeck;
      tracks = deckOrTracks;
    }
    
    if (deck === 'A') {
      setDeckAQueue(prev => [...prev, ...tracks]);
    } else {
      setDeckBQueue(prev => [...prev, ...tracks]);
    }

    // Remove moved tracks from main queue for clarity
    setQueue(prev => prev.filter(q => !tracks.some(t => t.id === q.id)));

    console.log(`Added ${tracks.length} track(s) to Deck ${deck} queue`);
  };

  const removeFromDeckQueue = (deck, id) => {
    if (deck === 'A') {
      setDeckAQueue(prev => prev.filter(t => t.id !== id));
    } else {
      setDeckBQueue(prev => prev.filter(t => t.id !== id));
    }
  };

  const skipForward = () => {
    if (audioEngine.currentTrack && !audioEngine.isSeeking) {
      const currentTime = audioEngine.currentTime;
      const newTime = Math.min(
        currentTime + 15, 
        audioEngine.currentTrack.duration || audioEngine.duration
      );
      console.log(`Skip forward: ${currentTime}s → ${newTime}s`);
      audioEngine.seekToTime(newTime);
    }
  };

  const skipBackward = () => {
    if (audioEngine.currentTrack && !audioEngine.isSeeking) {
      const currentTime = audioEngine.currentTime;
      const newTime = Math.max(currentTime - 15, 0);
      console.log(`Skip backward: ${currentTime}s → ${newTime}s`);
      audioEngine.seekToTime(newTime);
    }
  };

  const seekToTime = (time) => {
    if (!audioEngine.currentTrack || audioEngine.isSeeking) return;
    
    console.log(`Manual seek to ${time}s`);
    audioEngine.seekToTime(time);
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
      hasStemsReady: true,
      bpm: 120 // Default BPM, will be detected when loaded
    }));
    
    // Add to main queue only (deck queues are now drag-and-drop only)
    const wasQueueEmpty = queue.length === 0;
    setQueue(prev => [...prev, ...newQueueItems]);
    
    // If queue was empty, load the first track
    if (wasQueueEmpty && newQueueItems.length > 0) {
      setTimeout(() => loadCurrentTrack(), 100); // Small delay to ensure state is updated
    }
    
    console.log(`Added ${selectedTracks.length} tracks to main queue`);
    
    closeSongSelection();
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
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
          
          {autoMixEnabled && (
            <button 
              onClick={() => {
                console.log('🚀 Manual transition trigger activated!');
                if (audioEngineRef.current) {
                  // Show immediate user feedback
                  const button = document.querySelector('[title*="Force immediate AI transition"]');
                  if (button) {
                    const originalText = button.innerHTML;
                    button.innerHTML = '<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 12px; height: 12px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>Processing...</div>';
                    button.disabled = true;
                    button.style.opacity = '0.8';
                    
                    // Restore button after 8 seconds (matches professional transition duration)
                    setTimeout(() => {
                      if (button) {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        button.style.opacity = '1';
                      }
                    }, 8000);
                  }
                  
                  audioEngineRef.current.triggerManualTransition();
                }
              }}
              style={{
                background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                border: '2px solid #fff',
                borderRadius: '8px',
                color: 'white',
                padding: '8px 16px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
                }
              }}
              title="🚀 Force immediate AI transition using advanced looping, layering, and beat-matching techniques!"
            >
              <Zap size={16} />
              Transition Quick!
            </button>
          )}
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

            {/* Professional DJ Beat Viewport - Serato Style */}
            <ProfessionalBeatViewport
              deckATrack={currentTrack}
              deckBTrack={deckBTrack}
              deckABeatGrid={beatGrid}
              deckBBeatGrid={deckBBeatGrid}
              deckAWaveform={waveformData}
              deckBWaveform={deckBWaveform}
              currentTime={currentTrack.currentTime || 0}
              deckBCurrentTime={deckBCurrentTime}
              onCuePointClick={(deck, cue) => {
                console.log(`🎯 Cue point clicked: ${deck} - ${cue.label} @ ${cue.time}s`);
                // TODO: Implement cue point functionality
              }}
              onLoopRegionClick={(deck, loop) => {
                console.log(`🔁 Loop region clicked: ${deck} - ${loop.beats} beats`);
                // TODO: Implement loop functionality
              }}
              onWaveformClick={(deck, clickTime) => {
                console.log(`🎵 Waveform clicked: ${deck} @ ${clickTime.toFixed(2)}s`);
                if (deck === 'A' && audioEngineRef.current) {
                  audioEngineRef.current.seekToTime(clickTime);
                }
              }}
            />

            {/* Frequency Spectrum Display */}
            <FrequencyBands>
              {Array.from({ length: 24 }, (_, i) => (
                <FrequencyBand key={i} $level={Math.random() * 0.8} />
              ))}
            </FrequencyBands>
          </PlayerSection>

          <StemVisualizer>
            <h3>
              <BarChart3 size={20} />
              Dual-Deck Stem Controls
            </h3>
            
            {/* Deck A Stem Controls */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#00ff88', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎵 Deck A Stems {autoMixEnabled && '🔒'}
              </h4>
              <StemGrid style={{ opacity: autoMixEnabled ? 0.6 : 1 }}>
                {stems.map(stem => {
                  // Get real-time volume from AI DJ or manual control
                  const realTimeVolume = stemVolumes[`deckA_${stem.key}`] || stem.volume;
                  return (
                    <StemCard key={`deckA_${stem.key}`} $volume={realTimeVolume * 100}>
                      <h4>
                        {stem.name}
                        {autoMixEnabled && (
                          <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px' }}>
                            (AI: {Math.round(realTimeVolume * 100)}%)
                          </span>
                        )}
                      </h4>
                      <div 
                        className="volume-slider"
                        onMouseDown={autoMixEnabled ? undefined : (e) => {
                          e.preventDefault();
                          const sliderElement = e.currentTarget;
                          const rect = sliderElement.getBoundingClientRect();
                          
                          const handleMouseMove = (moveEvent) => {
                            const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
                            const volume = x / rect.width;
                            handleStemVolumeChange(`deckA_${stem.key}`, Math.max(0, Math.min(1, volume)));
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            document.body.style.userSelect = '';
                          };
                          
                          // Set initial value
                          handleMouseMove(e);
                          
                          // Prevent text selection during drag
                          document.body.style.userSelect = 'none';
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        style={{ 
                          cursor: autoMixEnabled ? 'not-allowed' : 'grab',
                          pointerEvents: autoMixEnabled ? 'none' : 'auto'
                        }}
                      >
                        <div 
                          className="slider-fill" 
                          style={{ width: `${realTimeVolume * 100}%` }}
                        />
                      </div>
                      <div className="volume-label">
                        {Math.round(realTimeVolume * 100)}%
                        {autoMixEnabled && ' 🎛️'}
                      </div>
                    </StemCard>
                  );
                })}
              </StemGrid>
            </div>

            {/* Deck B Stem Controls */}
            <div>
              <h4 style={{ color: '#88ff00', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎵 Deck B Stems {autoMixEnabled && '🔒'}
              </h4>
                             <StemGrid style={{ opacity: autoMixEnabled ? 0.6 : 1 }}>
                 {stems.map(stem => {
                   // Get real-time volume from AI DJ or manual control
                   const realTimeVolume = stemVolumes[`deckB_${stem.key}`] || stem.volume;
                   return (
                     <StemCard key={`deckB_${stem.key}`} $volume={realTimeVolume * 100}>
                       <h4>
                         {stem.name}
                         {autoMixEnabled && (
                           <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px' }}>
                             (AI: {Math.round(realTimeVolume * 100)}%)
                           </span>
                         )}
                       </h4>
                       <div 
                         className="volume-slider"
                         onMouseDown={autoMixEnabled ? undefined : (e) => {
                           e.preventDefault();
                           const sliderElement = e.currentTarget;
                           const rect = sliderElement.getBoundingClientRect();
                           
                           const handleMouseMove = (moveEvent) => {
                             const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
                             const volume = x / rect.width;
                             handleStemVolumeChange(`deckB_${stem.key}`, Math.max(0, Math.min(1, volume)));
                           };
                           
                           const handleMouseUp = () => {
                             document.removeEventListener('mousemove', handleMouseMove);
                             document.removeEventListener('mouseup', handleMouseUp);
                             document.body.style.userSelect = '';
                           };
                           
                           // Set initial value
                           handleMouseMove(e);
                           
                           // Prevent text selection during drag
                           document.body.style.userSelect = 'none';
                           
                           document.addEventListener('mousemove', handleMouseMove);
                           document.addEventListener('mouseup', handleMouseUp);
                         }}
                         style={{ 
                           cursor: autoMixEnabled ? 'not-allowed' : 'grab',
                           pointerEvents: autoMixEnabled ? 'none' : 'auto'
                         }}
                       >
                         <div 
                           className="slider-fill" 
                           style={{ width: `${realTimeVolume * 100}%` }}
                         />
                       </div>
                       <div className="volume-label">
                         {Math.round(realTimeVolume * 100)}%
                         {autoMixEnabled && ' 🎛️'}
                       </div>
                     </StemCard>
                   );
                 })}
               </StemGrid>
            </div>
          </StemVisualizer>

          <DJMixer>
            <BPMSection $synced={bpmSynced}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="deck-info">
                  <div className="bmp-value" style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold' }}>
                    {currentTrack.currentBPM || currentTrack.bmp || 120}
                    {currentTrack.originalBPM && currentTrack.currentBPM !== currentTrack.originalBPM && (
                      <div style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
                        (Original: {currentTrack.originalBPM})
                      </div>
                    )}
                  </div>
                  <div className="bmp-label">Deck A BPM</div>
                  <div className="key-display" style={{ 
                    marginTop: '4px', 
                    fontSize: '12px', 
                    color: '#00ff88',
                    fontFamily: 'monospace'
                  }}>
                    {currentTrack.key ? (
                      <div>
                        <span title={`Musical Key: ${currentTrack.currentKey?.name || currentTrack.key.name} (${currentTrack.currentKey?.camelot || currentTrack.key.camelot} on Camelot Wheel)`}>
                          🎼 {currentTrack.currentKey?.name || currentTrack.key.name} ({currentTrack.currentKey?.camelot || currentTrack.key.camelot})
                        </span>
                        {currentTrack.originalKey && currentTrack.keyShift !== 0 && (
                          <div style={{ fontSize: '10px', color: '#aaa' }}>
                            (Original: {currentTrack.originalKey.name})
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#666' }}>🎼 Analyzing key...</span>
                    )}
                  </div>
                </div>
                <div className="deck-info">
                  <div className="bmp-value" style={{ color: '#88ff00', fontSize: '24px', fontWeight: 'bold' }}>
                    {deckBTrack?.currentBPM || deckBTrack?.bmp || (deckBQueue.length > 0 ? deckBQueue[0].bmp || 120 : 120)}
                    {deckBTrack?.originalBPM && deckBTrack?.currentBPM !== deckBTrack?.originalBPM && (
                      <div style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
                        (Original: {deckBTrack.originalBPM})
                      </div>
                    )}
                  </div>
                  <div className="bmp-label">Deck B BPM</div>
                  <div className="key-display" style={{ 
                    marginTop: '4px', 
                    fontSize: '12px', 
                    color: '#88ff00',
                    fontFamily: 'monospace'
                  }}>
                    {deckBTrack?.key ? (
                      <div>
                        <span title={`Musical Key: ${deckBTrack.currentKey?.name || deckBTrack.key.name} (${deckBTrack.currentKey?.camelot || deckBTrack.key.camelot} on Camelot Wheel)`}>
                          🎼 {deckBTrack.currentKey?.name || deckBTrack.key.name} ({deckBTrack.currentKey?.camelot || deckBTrack.key.camelot})
                        </span>
                        {deckBTrack.originalKey && deckBTrack.keyShift !== 0 && (
                          <div style={{ fontSize: '10px', color: '#aaa' }}>
                            (Original: {deckBTrack.originalKey.name})
                          </div>
                        )}
                      </div>
                    ) : deckBQueue.length > 0 ? (
                      <span style={{ color: '#666' }}>🎼 Loading key...</span>
                    ) : (
                      <span style={{ color: '#333' }}>🎼 No track loaded</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Harmonic Compatibility Indicator */}
              {currentTrack.key && deckBTrack?.key && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginBottom: '8px',
                  backgroundColor: (() => {
                    // Calculate compatibility using audioEngine logic (simplified)
                    const areCompatible = currentTrack.key.camelot === deckBTrack.key.camelot ||
                      Math.abs(parseInt(currentTrack.key.camelot) - parseInt(deckBTrack.key.camelot)) <= 1;
                    return areCompatible ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)';
                  })(),
                  color: (() => {
                    const areCompatible = currentTrack.key.camelot === deckBTrack.key.camelot ||
                      Math.abs(parseInt(currentTrack.key.camelot) - parseInt(deckBTrack.key.camelot)) <= 1;
                    return areCompatible ? '#00ff88' : '#ff6b6b';
                  })(),
                  border: (() => {
                    const areCompatible = currentTrack.key.camelot === deckBTrack.key.camelot ||
                      Math.abs(parseInt(currentTrack.key.camelot) - parseInt(deckBTrack.key.camelot)) <= 1;
                    return areCompatible ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 107, 107, 0.3)';
                  })()
                }}>
                  🎼 {(() => {
                    if (currentTrack.key.camelot === deckBTrack.key.camelot) {
                      return "PERFECT KEY MATCH ✨";
                    }
                    const numDiff = Math.abs(parseInt(currentTrack.key.camelot) - parseInt(deckBTrack.key.camelot));
                    if (numDiff <= 1) {
                      return "HARMONIC COMPATIBLE 🎵";
                    }
                    return "KEY CLASH RISK ⚠️";
                  })()}
                </div>
              )}

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
                <div className="channel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎵 Deck A</span>
                  <button 
                    onClick={toggleDeckA}
                    style={{ 
                      background: deckAPlaying ? '#ff4444' : '#00ff88',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title={deckAPlaying ? '⏸️ Pause Deck A' : '▶️ Play Deck A'}
                  >
                    {deckAPlaying ? '⏸️' : '▶️'}
                  </button>
                </div>
                <EQSection>
                  <RotaryKnob 
                    $value={eqSettings.deckA.high} 
                    $active={eqSettings.deckA.high !== 0.5}
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">High {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">Mid {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">Low {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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

              <Crossfader $position={crossfadePosition} style={{ opacity: autoMixEnabled ? 0.5 : 1 }}>
                <div className="crossfader-value">
                  {Math.round(crossfadePosition * 100)}%
                </div>
                <div
                  className="crossfader-track"
                  onMouseDown={autoMixEnabled ? undefined : (e) => {
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startPosition = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                  style={{
                    cursor: autoMixEnabled ? 'not-allowed' : 'pointer',
                    pointerEvents: autoMixEnabled ? 'none' : 'auto'
                  }}
                >
                  <div className="crossfader-thumb"></div>
                </div>
                <div className="crossfader-labels">
                  <span>A {autoMixEnabled && '🔒'}</span>
                  <span>B {autoMixEnabled && '🔒'}</span>
                </div>
              </Crossfader>

              <ChannelStrip>
                <div className="channel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎵 Deck B</span>
                  <button 
                    onClick={toggleDeckB}
                    style={{ 
                      background: deckBPlaying ? '#ff4444' : '#00ff88',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title={deckBPlaying ? '⏸️ Pause Deck B' : '▶️ Play Deck B'}
                  >
                    {deckBPlaying ? '⏸️' : '▶️'}
                  </button>
                </div>
                <EQSection>
                  <RotaryKnob 
                    $value={eqSettings.deckB.high} 
                    $active={eqSettings.deckB.high !== 0.5}
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">High {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">Mid {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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
                    style={{ opacity: autoMixEnabled ? 0.5 : 1, pointerEvents: autoMixEnabled ? 'none' : 'auto' }}
                  >
                    <div className="knob-label">Low {autoMixEnabled && '🔒'}</div>
                    <div 
                      className="knob-container"
                      onMouseDown={autoMixEnabled ? undefined : (e) => {
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
              
              <ModernSlider $value={deckEffects.deckA.reverb} style={{ opacity: autoMixEnabled ? 0.5 : 1 }}>
                <div className="slider-label">
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  Reverb {autoMixEnabled && '🔒'}
                </div>
                <div 
                  className="slider-container"
                  style={{
                    cursor: autoMixEnabled ? 'not-allowed' : 'pointer',
                    pointerEvents: autoMixEnabled ? 'none' : 'auto'
                  }}
                  onMouseDown={autoMixEnabled ? undefined : (e) => {
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                    const sliderElement = e.currentTarget;
                    const rect = sliderElement.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startValue = startX / rect.width;
                    
                    const handleMouseMove = (e) => {
                      const rect = sliderElement.getBoundingClientRect();
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
                Deck Queues
              </h3>
              
              {/* Deck A Queue */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: 0, color: '#00ff88', marginBottom: '8px' }}>🎵 Deck A Queue ({deckAQueue.length})</h4>
                <div 
                  style={{ 
                    maxHeight: '150px', 
                    overflow: 'auto', 
                    background: '#1a1a1a', 
                    borderRadius: '4px', 
                    padding: '8px',
                    border: '2px dashed #00ff88',
                    minHeight: '60px'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#002a1a';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    const trackData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    addToDeckQueue(trackData, 'A');
                  }}
                >
                  {deckAQueue.length === 0 ? (
                    <div style={{ padding: '12px', color: '#666', textAlign: 'center', fontSize: '12px' }}>
                      🎵 Drag tracks from Main Queue to Deck A
                    </div>
                  ) : (
                    deckAQueue.map((track, index) => (
                      <div key={track.id} style={{
                        padding: '4px 8px',
                        background: '#2a2a2a',
                        margin: '2px 0',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{track.title}</span>
                        <span style={{ color: '#00ff88' }}>{track.bpm || 120} BPM</span>
                        <button style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }} onClick={() => removeFromDeckQueue('A', track.id)} title="Remove from Deck A">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Deck B Queue */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: 0, color: '#88ff00', marginBottom: '8px' }}>🎵 Deck B Queue ({deckBQueue.length})</h4>
                <div 
                  style={{ 
                    maxHeight: '150px', 
                    overflow: 'auto', 
                    background: '#1a1a1a', 
                    borderRadius: '4px', 
                    padding: '8px',
                    border: '2px dashed #88ff00',
                    minHeight: '60px'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#2a2a00';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    const trackData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    addToDeckQueue(trackData, 'B');
                  }}
                >
                  {deckBQueue.length === 0 ? (
                    <div style={{ padding: '12px', color: '#666', textAlign: 'center', fontSize: '12px' }}>
                      🎵 Drag tracks from Main Queue to Deck B
                    </div>
                  ) : (
                    deckBQueue.map((track, index) => (
                      <div key={track.id} style={{
                        padding: '4px 8px',
                        background: '#2a2a2a',
                        margin: '2px 0',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{track.title}</span>
                        <span style={{ color: '#88ff00' }}>{track.bpm || 120} BPM</span>
                        <button style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }} onClick={() => removeFromDeckQueue('B', track.id)} title="Remove from Deck B">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Legacy Main Queue */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>Main Queue ({queue.length})</h4>
                  <AddButton 
                    onClick={openSongSelection}
                    title="➕ Add songs to main queue - Select from your processed tracks ready for DJ mixing"
                  >
                    <Plus size={14} />
                    <div className="tooltip">
                      🎵 Add processed songs to main queue
                    </div>
                  </AddButton>
                </div>
              </div>
            
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
                        onDragStart={(e) => {
                          console.log('Dragging track:', track.title);
                          e.dataTransfer.setData('text/plain', JSON.stringify(track));
                          handleDragStart(e, index);
                        }}
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
                          <h4>
                            {track.title}
                            {deckAQueue.some(t => t.id === track.id) && (
                              <span className="deck-label">A</span>
                            )}
                            {deckBQueue.some(t => t.id === track.id) && (
                              <span className="deck-label">B</span>
                            )}
                          </h4>
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
              Add Songs to Main Queue
            </h3>
            <p className="modal-subtitle">
              Select processed songs with stems ready for mixing. Drag from Main Queue to Deck A/B queues.
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
                    ? "Select songs first to add them to the main queue"
                    : `Add ${selectedTracks.length} selected song${selectedTracks.length !== 1 ? 's' : ''} to the main queue for mixing`
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
    </>
  );
}

export default AIDJ; 
