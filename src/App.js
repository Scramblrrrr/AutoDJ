import React, { useState } from 'react';
import styled from 'styled-components';
import { Home, Music, Upload, Download } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AIDJ from './components/AIDJ';
import UploadProcess from './components/UploadProcess';
import MusicDownloader from './components/MusicDownloader';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: #ffffff;
`;

const Sidebar = styled.div`
  width: 250px;
  background: #252525;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  padding: 0 20px 30px 20px;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  
  img {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #888, #ccc);
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
  background: ${props => props.$active ? '#3a3a3a' : 'transparent'};
  border-right: ${props => props.$active ? '3px solid #666' : '3px solid transparent'};
  
  &:hover {
    background: #3a3a3a;
  }
  
  svg {
    margin-right: 12px;
    opacity: 0.8;
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, component: Dashboard },
  { id: 'aidj', name: 'AI|DJ', icon: Music, component: AIDJ },
  { id: 'upload', name: 'Upload & Process', icon: Upload, component: UploadProcess },
  { id: 'downloader', name: 'Music Downloader', icon: Download, component: MusicDownloader }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  return (
    <AppContainer>
      <Sidebar>
        <Logo>
          <img src="/Assets/AI%20DJ%20-%20Logo.png" alt="AutoDJ Logo" />
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
    </AppContainer>
  );
}

export default App; 