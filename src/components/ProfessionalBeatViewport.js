import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const ViewportContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #0a0a0a;
  border-radius: 12px;
  border: 1px solid #333;
`;

const DeckViewport = styled.div`
  position: relative;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${props => props.$deckColor || '#333'};
  background: linear-gradient(90deg, #111 0%, #1a1a1a 100%);
`;

const DeckHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 10;
  
  .deck-label {
    color: ${props => props.$deckColor || '#fff'};
    font-weight: bold;
    font-size: 12px;
  }
  
  .track-info {
    color: #ccc;
    font-size: 11px;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .bpm-display {
    color: ${props => props.$deckColor || '#fff'};
    font-weight: bold;
    font-size: 12px;
  }
`;

const WaveformCanvas = styled.canvas`
  position: absolute;
  top: 24px;
  left: 0;
  width: 100%;
  height: calc(100% - 24px);
  cursor: crosshair;
`;

const BeatGridCanvas = styled.canvas`
  position: absolute;
  top: 24px;
  left: 0;
  width: 100%;
  height: calc(100% - 24px);
  pointer-events: none;
  z-index: 5;
`;

const PlayheadLine = styled.div`
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: calc(100% - 24px);
  background: #ff0040;
  z-index: 8;
  box-shadow: 0 0 4px rgba(255, 0, 64, 0.6);
`;

const CuePointsOverlay = styled.div`
  position: absolute;
  top: 24px;
  left: 0;
  width: 100%;
  height: calc(100% - 24px);
  pointer-events: none;
  z-index: 6;
`;

const CuePoint = styled.div`
  position: absolute;
  top: 0;
  left: ${props => props.$position}%;
  transform: translateX(-50%);
  width: 8px;
  height: 100%;
  background: ${props => props.$color || '#ff6b35'};
  border-radius: 4px;
  opacity: 0.8;
  
  &::after {
    content: '${props => props.$label || ''}';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    white-space: nowrap;
  }
`;

const LoopRegion = styled.div`
  position: absolute;
  top: 24px;
  left: ${props => props.$start}%;
  width: ${props => props.$width}%;
  height: calc(100% - 24px);
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid #00ff88;
  z-index: 4;
  
  &::after {
    content: 'LOOP ${props => props.$beats} beats';
    position: absolute;
    top: 4px;
    left: 4px;
    color: #00ff88;
    font-size: 9px;
    font-weight: bold;
  }
`;

const TimeRuler = styled.div`
  height: 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 11px;
`;

const StemActivityBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 16px;
  display: flex;
  z-index: 3;
`;

const StemActivity = styled.div`
  flex: 1;
  height: 100%;
  opacity: ${props => props.$activity || 0.1};
  background: ${props => props.$color || '#666'};
  border-right: 1px solid #000;
  
  &:last-child {
    border-right: none;
  }
`;

function ProfessionalBeatViewport({ 
  deckATrack, 
  deckBTrack, 
  deckABeatGrid = [], 
  deckBBeatGrid = [],
  deckAWaveform = [],
  deckBWaveform = [],
  currentTime = 0,
  deckBCurrentTime = 0,
  onCuePointClick,
  onLoopRegionClick,
  onWaveformClick
}) {
  const deckAWaveformRef = useRef(null);
  const deckBWaveformRef = useRef(null);
  const deckABeatGridRef = useRef(null);
  const deckBBeatGridRef = useRef(null);

  const currentTimeRef = useRef(currentTime);
  const deckBTimeRef = useRef(deckBCurrentTime);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);


  const [zoom, setZoom] = useState(1.0); // 1.0 = normal, 2.0 = 2x zoom
  const [viewportTime, setViewportTime] = useState(20); // seconds visible in viewport

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    deckBTimeRef.current = deckBCurrentTime;
  }, [deckBCurrentTime]);
  
  const FRAME_RATE = 1000 / 30; // 30 FPS instead of 60

  const updateViewports = useCallback((timestamp) => {
    if (timestamp - lastUpdateTimeRef.current >= FRAME_RATE) {
      drawDeckWaveform('A', deckATrack, deckAWaveform, deckAWaveformRef.current, currentTimeRef.current);
      drawDeckWaveform('B', deckBTrack, deckBWaveform, deckBWaveformRef.current, deckBTimeRef.current);
      drawDeckBeatGrid('A', deckABeatGrid, deckABeatGridRef.current, currentTimeRef.current);
      drawDeckBeatGrid('B', deckBBeatGrid, deckBBeatGridRef.current, deckBTimeRef.current);
      lastUpdateTimeRef.current = timestamp;
    }
    animationFrameRef.current = requestAnimationFrame(updateViewports);
  }, [deckATrack, deckBTrack, deckAWaveform, deckBWaveform, deckABeatGrid, deckBBeatGrid]);

  const startAnimation = useCallback(() => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateViewports);
    }
  }, [updateViewports]);

  // Start or restart animation when track data is available
  useEffect(() => {

    let animationFrame;
    let lastUpdateTime = 0;
    const FRAME_RATE = 1000 / 30; // 30 FPS instead of 60
    
    const updateViewports = (timestamp) => {
      if (timestamp - lastUpdateTime >= FRAME_RATE) {
        drawDeckWaveform('A', deckATrack, deckAWaveform, deckAWaveformRef.current, currentTimeRef.current);
        drawDeckWaveform('B', deckBTrack, deckBWaveform, deckBWaveformRef.current, deckBTimeRef.current);
        drawDeckBeatGrid('A', deckABeatGrid, deckABeatGridRef.current, currentTimeRef.current);
        drawDeckBeatGrid('B', deckBBeatGrid, deckBBeatGridRef.current, deckBTimeRef.current);
        lastUpdateTime = timestamp;
      }
      
      animationFrame = requestAnimationFrame(updateViewports);
    };
    
    // Only start animation if we have track data

    if (deckATrack || deckBTrack) {
      startAnimation();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [deckATrack, deckBTrack, startAnimation]);

  // Ensure animation begins when playback starts
  useEffect(() => {
    startAnimation();
    currentTimeRef.current = currentTime;
  }, [currentTime, startAnimation]);

  useEffect(() => {
    startAnimation();
    deckBTimeRef.current = deckBCurrentTime;
  }, [deckBCurrentTime, startAnimation]);

  
  
  const drawDeckWaveform = (deck, track, waveformData, canvas, playTime) => {
    if (!canvas || !waveformData.length || !track) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2; // Retina
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const canvasWidth = width / 2;
    const canvasHeight = height / 2;
    
    // Clear canvas with darker background
    ctx.fillStyle = deck === 'A' ? '#0a1a0a' : '#1a1a00';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (waveformData.length === 0) return;
    
    // Calculate visible time window (centered on playhead)
    const windowStart = Math.max(0, playTime - viewportTime / 2);
    const windowEnd = windowStart + viewportTime;

    // Higher resolution sampling for smoother waveforms
    const startSample = Math.floor((windowStart / track.duration) * waveformData.length);
    const endSample = Math.min(waveformData.length, Math.floor((windowEnd / track.duration) * waveformData.length));
    
    // Enhanced layered stem waveforms with transparency and better sizing
    const stems = [
      { key: 'vocals', color: 'rgba(255, 64, 129, 0.8)', field: 'treble', layer: 0 },
      { key: 'drums', color: 'rgba(255, 193, 7, 0.7)', field: 'mid', layer: 1 },
      { key: 'bass', color: 'rgba(33, 150, 243, 0.8)', field: 'bass', layer: 2 },
      { key: 'other', color: 'rgba(156, 39, 176, 0.6)', field: 'rms', layer: 3 }
    ];

    // Draw background grid for better readability
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = (canvasHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Improved waveform rendering with better layering
    for (let x = 0; x < canvasWidth; x += 0.5) { // Higher resolution
      const sampleIndex = startSample + Math.floor((x / canvasWidth) * (endSample - startSample));
      if (sampleIndex >= 0 && sampleIndex < waveformData.length) {
        const sample = waveformData[sampleIndex];

        // Draw each stem layer with proper scaling and transparency
        stems.forEach((stem, idx) => {
          const value = sample[stem.field] !== undefined ? sample[stem.field] : sample.rms || 0;
          const amplitude = Math.min(Math.max(value * 2, 0), 1.0); // Enhanced amplitude
          const layerHeight = canvasHeight * 0.8; // Use 80% of canvas height
          const h = amplitude * layerHeight;
          const yCenter = canvasHeight / 2;

          if (h > 2) { // Minimum height threshold
            // Create gradient for better visual depth
            const gradient = ctx.createLinearGradient(0, yCenter - h/2, 0, yCenter + h/2);
            gradient.addColorStop(0, stem.color);
            gradient.addColorStop(0.5, stem.color.replace('0.', '0.9')); // More opaque in center
            gradient.addColorStop(1, stem.color);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, yCenter - h / 2, 1, h);
            
            // Add subtle outline for definition
            ctx.strokeStyle = stem.color.replace(/0\.\d/, '1.0');
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, yCenter - h / 2);
            ctx.lineTo(x, yCenter + h / 2);
            ctx.stroke();
          }
        });

        // Enhanced peak indicators
        if (sample.peak && sample.peak > 0.85) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(x, 0, 2, canvasHeight);
        }
      }
    }
    
    // Draw playhead position
    const playheadX = canvasWidth / 2;
    ctx.strokeStyle = deck === 'A' ? '#00ff88' : '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvasHeight);
    ctx.stroke();
    
    // Draw time markers with better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    for (let i = 0; i <= viewportTime; i += 5) {
      const x = (i / viewportTime) * canvasWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
      
      // Time labels
      const timeLabel = Math.floor(windowStart + i);
      ctx.fillText(`${Math.floor(timeLabel / 60)}:${(timeLabel % 60).toString().padStart(2, '0')}`, x + 2, 12);
    }
  };
  
  const drawDeckBeatGrid = (deck, beatGrid, canvas, playTime) => {
    if (!canvas || !beatGrid.length) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const canvasWidth = width / 2;
    const canvasHeight = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Calculate visible time window
    const windowStart = Math.max(0, playTime - viewportTime / 2);
    const windowEnd = windowStart + viewportTime;
    
    // Draw beat lines
    beatGrid.forEach(beat => {
      if (beat.time >= windowStart && beat.time <= windowEnd) {
        const x = ((beat.time - windowStart) / viewportTime) * canvasWidth;
        
        // Different colors for downbeats vs regular beats
        if (beat.type === 'downbeat') {
          ctx.strokeStyle = deck === 'A' ? '#00ff88' : '#ffff00';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = deck === 'A' ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 255, 0, 0.5)';
          ctx.lineWidth = 1;
        }
        
        // Draw vertical beat line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
        
        // Draw beat number for downbeats
        if (beat.type === 'downbeat' && beat.bar) {
          ctx.fillStyle = deck === 'A' ? '#00ff88' : '#ffff00';
          ctx.font = '10px monospace';
          ctx.fillText(beat.bar.toString(), x + 2, 12);
        }
      }
    });
    
    // Draw phrase markers (every 8 bars)
    beatGrid.forEach(beat => {
      if (beat.isPhraseStart && beat.time >= windowStart && beat.time <= windowEnd) {
        const x = ((beat.time - windowStart) / viewportTime) * canvasWidth;
        
        ctx.fillStyle = deck === 'A' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x, 0, 2, canvasHeight);
      }
    });
  };
  
  const handleWaveformClick = (deck, event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickRatio = x / rect.width;
    
    const windowStart = deck === 'A' ? 
      Math.max(0, currentTime - viewportTime / 2) :
      Math.max(0, deckBCurrentTime - viewportTime / 2);
    
    const clickTime = windowStart + (clickRatio * viewportTime);
    
    if (onWaveformClick) {
      onWaveformClick(deck, clickTime);
    }
  };
  
  const generateCuePoints = (track) => {
    if (!track) return [];
    
    // Generate some example cue points based on track structure
    const duration = track.duration || 180;
    return [
      { label: 'Intro', time: 8, color: '#00ff88', type: 'intro' },
      { label: 'Drop', time: duration * 0.25, color: '#ff6b35', type: 'hot' },
      { label: 'Break', time: duration * 0.5, color: '#4a9eff', type: 'break' },
      { label: 'Outro', time: duration * 0.85, color: '#ff4081', type: 'outro' }
    ];
  };
  
  const generateLoopRegions = (track) => {
    if (!track) return [];
    
    const duration = track.duration || 180;
    return [
      {
        start: duration * 0.6,
        end: duration * 0.7,
        beats: 16,
        label: 'Loop 16'
      }
    ];
  };
  
  const calculateTimePosition = (time, playTime, duration) => {
    const windowStart = Math.max(0, playTime - viewportTime / 2);
    const windowEnd = windowStart + viewportTime;
    
    if (time < windowStart || time > windowEnd) return -1; // Not visible
    
    return ((time - windowStart) / viewportTime) * 100;
  };
  
  return (
    <ViewportContainer>
      <TimeRuler>
        Professional Beat Viewport - Zoom: {zoom}x - Window: {viewportTime}s
      </TimeRuler>
      
      {/* Deck A Viewport */}
      <DeckViewport $deckColor="#00ff88">
        <DeckHeader $deckColor="#00ff88">
          <div className="deck-label">DECK A</div>
          <div className="track-info">
            {deckATrack ? `${deckATrack.title} - ${deckATrack.artist || 'Unknown'}` : 'No track loaded'}
          </div>
          <div className="bpm-display">
            {deckATrack?.bmp || deckATrack?.bpm || 120} BPM
          </div>
        </DeckHeader>
        
        <WaveformCanvas 
          ref={deckAWaveformRef}
          onClick={(e) => handleWaveformClick('A', e)}
        />
        
        <BeatGridCanvas ref={deckABeatGridRef} />
        
        <PlayheadLine />
        
        <CuePointsOverlay>
          {generateCuePoints(deckATrack).map((cue, index) => {
            const position = calculateTimePosition(cue.time, currentTime, deckATrack?.duration);
            return position >= 0 ? (
              <CuePoint
                key={index}
                $position={position}
                $color={cue.color}
                $label={cue.label}
                onClick={() => onCuePointClick && onCuePointClick('A', cue)}
              />
            ) : null;
          })}
        </CuePointsOverlay>
        
        {generateLoopRegions(deckATrack).map((loop, index) => {
          const startPos = calculateTimePosition(loop.start, currentTime, deckATrack?.duration);
          const endPos = calculateTimePosition(loop.end, currentTime, deckATrack?.duration);
          
          if (startPos >= 0 && endPos >= 0) {
            return (
              <LoopRegion
                key={index}
                $start={startPos}
                $width={endPos - startPos}
                $beats={loop.beats}
                onClick={() => onLoopRegionClick && onLoopRegionClick('A', loop)}
              />
            );
          }
          return null;
        })}
        
        <StemActivityBar>
          <StemActivity $color="#ff4081" $activity={0.8} title="Vocals" />
          <StemActivity $color="#ffc107" $activity={1.0} title="Drums" />
          <StemActivity $color="#2196f3" $activity={0.9} title="Bass" />
          <StemActivity $color="#9c27b0" $activity={0.6} title="Other" />
        </StemActivityBar>
      </DeckViewport>
      
      {/* Deck B Viewport */}
      <DeckViewport $deckColor="#ffff00">
        <DeckHeader $deckColor="#ffff00">
          <div className="deck-label">DECK B</div>
          <div className="track-info">
            {deckBTrack ? `${deckBTrack.title} - ${deckBTrack.artist || 'Unknown'}` : 'No track loaded'}
          </div>
          <div className="bpm-display">
            {deckBTrack?.bmp || deckBTrack?.bpm || 120} BPM
          </div>
        </DeckHeader>
        
        <WaveformCanvas 
          ref={deckBWaveformRef}
          onClick={(e) => handleWaveformClick('B', e)}
        />
        
        <BeatGridCanvas ref={deckBBeatGridRef} />
        
        <PlayheadLine />
        
        <CuePointsOverlay>
          {generateCuePoints(deckBTrack).map((cue, index) => {
            const position = calculateTimePosition(cue.time, deckBCurrentTime, deckBTrack?.duration);
            return position >= 0 ? (
              <CuePoint
                key={index}
                $position={position}
                $color={cue.color}
                $label={cue.label}
                onClick={() => onCuePointClick && onCuePointClick('B', cue)}
              />
            ) : null;
          })}
        </CuePointsOverlay>
        
        {generateLoopRegions(deckBTrack).map((loop, index) => {
          const startPos = calculateTimePosition(loop.start, deckBCurrentTime, deckBTrack?.duration);
          const endPos = calculateTimePosition(loop.end, deckBCurrentTime, deckBTrack?.duration);
          
          if (startPos >= 0 && endPos >= 0) {
            return (
              <LoopRegion
                key={index}
                $start={startPos}
                $width={endPos - startPos}
                $beats={loop.beats}
                onClick={() => onLoopRegionClick && onLoopRegionClick('B', loop)}
              />
            );
          }
          return null;
        })}
        
        <StemActivityBar>
          <StemActivity $color="#ff4081" $activity={0.3} title="Vocals" />
          <StemActivity $color="#ffc107" $activity={0.8} title="Drums" />
          <StemActivity $color="#2196f3" $activity={0.9} title="Bass" />
          <StemActivity $color="#9c27b0" $activity={0.5} title="Other" />
        </StemActivityBar>
      </DeckViewport>
      
      {/* Zoom Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'center',
        marginTop: '8px'
      }}>
        <button 
          onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
          style={{ 
            padding: '4px 8px', 
            background: '#333', 
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#ccc',
            cursor: 'pointer'
          }}
        >
          Zoom Out
        </button>
        <button 
          onClick={() => setZoom(Math.min(4.0, zoom + 0.5))}
          style={{ 
            padding: '4px 8px', 
            background: '#333', 
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#ccc',
            cursor: 'pointer'
          }}
        >
          Zoom In
        </button>
        <button 
          onClick={() => setViewportTime(viewportTime === 20 ? 10 : 20)}
          style={{ 
            padding: '4px 8px', 
            background: '#333', 
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#ccc',
            cursor: 'pointer'
          }}
        >
          Toggle Window: {viewportTime}s
        </button>
      </div>
    </ViewportContainer>
  );
}

export default ProfessionalBeatViewport; 
