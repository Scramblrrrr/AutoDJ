import React, { useState } from 'react';
import styled from 'styled-components';
import { FolderOpen, CheckCircle, Music, Download, Settings, ArrowRight, Home } from 'lucide-react';

const SetupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const SetupModal = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
`;

const SetupHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const WelcomeTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #888, #ccc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
`;

const WelcomeSubtitle = styled.p`
  font-size: 16px;
  color: #888;
  margin-bottom: 24px;
`;

const AppLogo = styled.img`
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
`;

const SetupContent = styled.div`
  margin-bottom: 32px;
`;

const SetupStep = styled.div`
  margin-bottom: 24px;
`;

const StepTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepDescription = styled.p`
  font-size: 14px;
  color: #aaa;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const FolderStructure = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #ccc;
`;

const FolderLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FolderIcon = styled.div`
  color: #ffd700;
  width: 16px;
`;

const PathSelection = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
`;

const PathDisplay = styled.div`
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #fff;
  margin-bottom: 16px;
  min-height: 20px;
  display: flex;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const SetupButton = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(135deg, #666, #888)' : '#3a3a3a'};
  border: 1px solid ${props => props.$primary ? '#888' : '#555'};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;

  &:hover {
    background: ${props => props.$primary ? 'linear-gradient(135deg, #777, #999)' : '#4a4a4a'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CompleteButton = styled(SetupButton)`
  background: linear-gradient(135deg, #4a9eff, #0066cc);
  border-color: #0066cc;
  font-weight: 600;
  padding: 16px 24px;
  font-size: 16px;
  width: 100%;
  justify-content: center;

  &:hover {
    background: linear-gradient(135deg, #5badff, #0077dd);
  }

  &:disabled {
    background: #333;
    border-color: #555;
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #1a3a1a;
  border: 1px solid #2a5a2a;
  border-radius: 8px;
  color: #88ff88;
  font-size: 14px;
  margin-top: 16px;
`;

function FirstTimeSetup({ onComplete }) {
  const [selectedPath, setSelectedPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState('select'); // 'select' or 'confirm'

  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const handleChooseLocation = async () => {
    if (!ipcRenderer) return;

    try {
      const result = await ipcRenderer.invoke('select-folder');
      if (result) {
        const autodjPath = `${result}\\AutoDJ`;
        setSelectedPath(autodjPath);
        setStep('confirm');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleUseDefault = () => {
    const os = window.require ? window.require('os') : null;
    const path = window.require ? window.require('path') : null;
    
    if (os && path) {
      const defaultPath = path.join(os.homedir(), 'Music', 'AutoDJ');
      setSelectedPath(defaultPath);
      setStep('confirm');
    }
  };

  const handleComplete = async () => {
    if (!selectedPath || isCreating) return;

    setIsCreating(true);

    try {
      // Create the library structure
      const result = await ipcRenderer.invoke('create-library-structure', selectedPath);
      
      if (result.success) {
        // Save configuration
        await ipcRenderer.invoke('save-app-config', {
          libraryPath: selectedPath,
          setupCompleted: true,
          setupDate: new Date().toISOString()
        });

        setTimeout(() => {
          onComplete(selectedPath);
        }, 1000);
      } else {
        console.error('Failed to create library structure:', result.error);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Setup error:', error);
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedPath('');
  };

  if (step === 'select') {
    return (
      <SetupOverlay>
        <SetupModal>
          <SetupHeader>
            <AppLogo src="./Assets/AI DJ - Logo.png" alt="AutoDJ" />
            <WelcomeTitle>Welcome to AutoDJ!</WelcomeTitle>
            <WelcomeSubtitle>Let's set up your music library</WelcomeSubtitle>
          </SetupHeader>

          <SetupContent>
            <SetupStep>
              <StepTitle>
                <Home size={20} />
                Choose Your Library Location
              </StepTitle>
              <StepDescription>
                AutoDJ needs a place to store your music library. This will create an organized folder structure for all your downloaded music, processed stems, and DJ projects.
              </StepDescription>

              <FolderStructure>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>AutoDJ/</span>
                </FolderLine>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>&nbsp;&nbsp;├── Library/</span>
                </FolderLine>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Downloads/</span>
                </FolderLine>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Processed/</span>
                </FolderLine>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── Stems/</span>
                </FolderLine>
                <FolderLine>
                  <FolderIcon>📁</FolderIcon>
                  <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Projects/</span>
                </FolderLine>
              </FolderStructure>

              <ButtonGroup>
                <SetupButton onClick={handleChooseLocation}>
                  <FolderOpen size={16} />
                  Choose Location
                </SetupButton>
                <SetupButton onClick={handleUseDefault}>
                  <Music size={16} />
                  Use Default (Music Folder)
                </SetupButton>
              </ButtonGroup>
            </SetupStep>
          </SetupContent>
        </SetupModal>
      </SetupOverlay>
    );
  }

  return (
    <SetupOverlay>
      <SetupModal>
        <SetupHeader>
          <AppLogo src="./Assets/AI DJ - Logo.png" alt="AutoDJ" />
          <WelcomeTitle>Confirm Setup</WelcomeTitle>
          <WelcomeSubtitle>Review your library location</WelcomeSubtitle>
        </SetupHeader>

        <SetupContent>
          <SetupStep>
            <StepTitle>
              <CheckCircle size={20} />
              Library Location
            </StepTitle>
            <StepDescription>
              Your AutoDJ library will be created at the following location:
            </StepDescription>

            <PathSelection>
              <PathDisplay>{selectedPath}</PathDisplay>
              
              <ButtonGroup>
                <SetupButton onClick={handleBack}>
                  Back
                </SetupButton>
                <SetupButton $primary onClick={handleChooseLocation}>
                  <FolderOpen size={16} />
                  Change Location
                </SetupButton>
              </ButtonGroup>
            </PathSelection>

            <StepDescription>
              This will create all the necessary folders for organizing your music, stems, and projects.
            </StepDescription>
          </SetupStep>
        </SetupContent>

        <CompleteButton 
          onClick={handleComplete} 
          disabled={!selectedPath || isCreating}
        >
          {isCreating ? (
            <>
              <Settings size={16} className="spinning" />
              Creating Library...
            </>
          ) : (
            <>
              <ArrowRight size={16} />
              Complete Setup
            </>
          )}
        </CompleteButton>

        {isCreating && (
          <ProgressIndicator>
            <CheckCircle size={16} />
            Setting up your AutoDJ library...
          </ProgressIndicator>
        )}
      </SetupModal>
    </SetupOverlay>
  );
}

export default FirstTimeSetup; 