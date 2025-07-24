import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Play, Pause, SkipForward, Volume2, Shuffle, Settings, Plus, X, BarChart3, Music, Check, GripVertical, Info } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import storage from '../utils/storage';

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
    currentTime: 0
  });
  const [queue, setQueue] = useState([]);
  const [stemVolumes, setStemVolumes] = useState({
    vocals: 75,
    drums: 85,
    bass: 80,
    other: 70
  });
  const [showSongSelection, setShowSongSelection] = useState(false);
  const [processedTracks, setProcessedTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);

  // Load processed tracks on component mount
  useEffect(() => {
    const loadProcessedTracks = () => {
      const allTracks = storage.getTracks();
      const processed = allTracks.filter(track => 
        track.status === 'completed' && track.stemsPath
      );
      setProcessedTracks(processed);
    };

    loadProcessedTracks();
    
    // Refresh processed tracks every 5 seconds to catch newly processed songs
    const interval = setInterval(loadProcessedTracks, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const stems = [
    { key: 'vocals', name: 'Vocals', volume: stemVolumes.vocals },
    { key: 'drums', name: 'Drums', volume: stemVolumes.drums },
    { key: 'bass', name: 'Bass', volume: stemVolumes.bass },
    { key: 'other', name: 'Other', volume: stemVolumes.other }
  ];

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
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

  const addSelectedToQueue = () => {
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
    
    setQueue(prev => [...prev, ...newQueueItems]);
    closeSongSelection();
    
    console.log(`Added ${selectedTracks.length} tracks to queue`);
  };

  const removeFromQueue = (id) => {
    setQueue(queue.filter(track => track.id !== id));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQueue(items);
    console.log(`Moved track from position ${result.source.index + 1} to ${result.destination.index + 1}`);
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
          <button className="btn-secondary" style={{ marginRight: '12px' }}>
            <Settings size={16} style={{ marginRight: '8px' }} />
            Settings
          </button>
          <button className="btn-primary">
            <Shuffle size={16} style={{ marginRight: '8px' }} />
            Auto Mix
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
              <button>
                <Shuffle size={20} />
              </button>
              <button>
                <SkipForward size={20} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button className="play-button" onClick={togglePlayback}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button>
                <SkipForward size={20} />
              </button>
              <button>
                <Volume2 size={20} />
              </button>
            </Controls>

            <ProgressBar $progress={progress}>
              <div className="progress" />
            </ProgressBar>

            <TimeDisplay>
              <span>0:00</span>
              <span>3:45</span>
            </TimeDisplay>
          </PlayerSection>

          <StemVisualizer>
            <h3>
              <BarChart3 size={20} />
              Stem Controls
            </h3>
            <StemGrid>
              {stems.map(stem => (
                <StemCard key={stem.key} $volume={stem.volume}>
                  <h4>{stem.name}</h4>
                  <div className="volume-slider">
                    <div className="slider-fill" />
                  </div>
                  <div className="volume-label">{stem.volume}%</div>
                </StemCard>
              ))}
            </StemGrid>
          </StemVisualizer>
        </LeftPanel>

        <RightPanel>
          <QueueSection>
            <h3>
              Queue ({queue.length})
              <AddButton onClick={openSongSelection}>
                <Plus size={16} />
                <div className="tooltip">
                  Add processed songs to queue
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
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="queue">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.ref}>
                        {queue.map((track, index) => (
                          <Draggable key={track.id} draggableId={track.id} index={index}>
                            {(provided, snapshot) => (
                              <QueueItem
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                $active={index === 0}
                                $isDragging={snapshot.isDragging}
                              >
                                <div 
                                  className="drag-handle"
                                  {...provided.dragHandleProps}
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                <button className="btn-cancel" onClick={closeSongSelection}>
                  Cancel
                </button>
                <button 
                  className="btn-add" 
                  onClick={addSelectedToQueue}
                  disabled={selectedTracks.length === 0}
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