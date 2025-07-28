import React from 'react';
import styled from 'styled-components';
import { Minimize2, Maximize2, X } from 'lucide-react';

const TitleBarContainer = styled.div`
  height: 40px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  -webkit-app-region: drag;
  user-select: none;
  position: relative;
  z-index: 1000;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`;

const AppIcon = styled.img`
  width: 20px;
  height: 20px;
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button`
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.$isClose ? '#e81123' : '#404040'};
  }

  &:active {
    background: ${props => props.$isClose ? '#c50e1f' : '#505050'};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

function CustomTitleBar() {
  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const handleMinimize = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('window-minimize');
    }
  };

  const handleMaximize = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('window-maximize');
    }
  };

  const handleClose = () => {
    if (ipcRenderer) {
      ipcRenderer.invoke('window-close');
    }
  };

  return (
    <TitleBarContainer>
      <TitleSection>
        <AppIcon src="./Assets/AI DJ - Logo.png" alt="AutoDJ" />
        <span>AutoDJ</span>
      </TitleSection>
      
      <WindowControls>
        <ControlButton onClick={handleMinimize} title="Minimize">
          <Minimize2 />
        </ControlButton>
        <ControlButton onClick={handleMaximize} title="Maximize">
          <Maximize2 />
        </ControlButton>
        <ControlButton onClick={handleClose} title="Close" $isClose>
          <X />
        </ControlButton>
      </WindowControls>
    </TitleBarContainer>
  );
}

export default CustomTitleBar; 