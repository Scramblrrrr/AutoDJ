import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Home, Music, Upload, Download } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AIDJ from './components/AIDJ';
import UploadProcess from './components/UploadProcess';
import MusicDownloader from './components/MusicDownloader';
import CustomTitleBar from './components/CustomTitleBar';
import FirstTimeSetup from './components/FirstTimeSetup';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    #000000 0%, 
    #3d3d3d 25%, 
    #454545 50%, 
    #5d5d5d 75%, 
    #000000 100%);
  color: #ffffff;
  border-radius: 12px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  min-height: calc(100vh - 40px); /* Account for title bar */
`;

const Sidebar = styled.div`
  width: 250px;
  background: rgba(69, 69, 69, 0.3);
  border-right: 1px solid rgba(255, 35, 35, 0.2);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px 30px 20px;
  border-bottom: 1px solid rgba(255, 35, 35, 0.3);
  margin-bottom: 20px;
  
  img {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #ff2323, #ff5757);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(255, 35, 35, 0.2)' : 'transparent'};
  border-right: ${props => props.$active ? '3px solid #ff2323' : '3px solid transparent'};
  
  &:hover {
    background: rgba(255, 35, 35, 0.1);
  }
  
  svg {
    margin-right: 12px;
    opacity: 0.8;
    color: ${props => props.$active ? '#ff2323' : '#b0b0b0'};
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.$active ? '#ff2323' : '#d1d1d1'};
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 40px); /* Account for title bar */
`;

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, component: Dashboard },
  { id: 'aidj', name: 'AI|DJ', icon: Music, component: AIDJ },
  { id: 'upload', name: 'Upload & Process', icon: Upload, component: UploadProcess },
  { id: 'downloader', name: 'Music Downloader', icon: Download, component: MusicDownloader }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSetup, setShowSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    if (!ipcRenderer) {
      setIsCheckingSetup(false);
      return;
    }

    try {
      const config = await ipcRenderer.invoke('get-app-config');
      if (!config || !config.setupCompleted) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setShowSetup(true);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const handleSetupComplete = (libraryPath) => {
    console.log('Setup completed with path:', libraryPath);
    setShowSetup(false);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  // Show loading or setup modal
  if (isCheckingSetup) {
    return (
      <AppContainer>
        <CustomTitleBar />
        <ContentContainer>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#888',
            fontSize: '16px'
          }}>
            Loading AutoDJ...
          </div>
        </ContentContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <CustomTitleBar />
      <ContentContainer>
        <Sidebar>
          <Logo>
            <img src="./Assets/AI DJ - Logo.png" alt="AutoDJ Logo" />
            <h1>AutoDJ</h1>
          </Logo>
          
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <NavItem
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={20} />
                <span>{tab.name}</span>
              </NavItem>
            );
          })}
        </Sidebar>
        
        <MainContent>
          <ActiveComponent />
        </MainContent>
      </ContentContainer>
      
      {showSetup && (
        <FirstTimeSetup onComplete={handleSetupComplete} />
      )}
    </AppContainer>
  );
}

export default App; 