import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Music, Upload, Download, Activity, Clock, Headphones } from 'lucide-react';
import storage from '../utils/storage';
import fileManager from '../utils/fileManager';

const DashboardContainer = styled.div`
  padding: 30px;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #000000 0%, #3d3d3d 100%);
`;

const Header = styled.div`
  margin-bottom: 40px;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ff2323, #ff5757);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: #b0b0b0;
    font-size: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: rgba(69, 69, 69, 0.3);
  border: 1px solid rgba(255, 35, 35, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(255, 35, 35, 0.2);
    border-color: #444;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff2323, #ff5757);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  svg {
    margin-right: 12px;
    color: #ff2323;
  }
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #d1d1d1;
  }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
`;

const StatSubtext = styled.div`
  font-size: 14px;
  color: #b0b0b0;
`;

const QuickActions = styled.div`
  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #d1d1d1;
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ActionCard = styled.div`
  background: rgba(69, 69, 69, 0.3);
  border: 1px solid rgba(255, 35, 35, 0.2);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 35, 35, 0.1);
    border-color: rgba(255, 35, 35, 0.4);
    transform: translateY(-2px);
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #fff;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
      color: #888;
    }
  }
  
  p {
    color: #aaa;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const RecentActivity = styled.div`
  margin-top: 40px;
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #ccc;
  }
`;

const ActivityList = styled.div`
  background: #252525;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #3a3a3a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #888;
`;

const ActivityDetails = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
`;

const ActivityTime = styled.div`
  font-size: 12px;
  color: #888;
`;

const ActivityStatus = styled.div`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: capitalize;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return 'background: #1a5d1a; color: #4caf50;';
      case 'processing':
        return 'background: #5d4a1a; color: #ffa500;';
      case 'failed':
        return 'background: #5d1a1a; color: #f44336;';
      default:
        return 'background: #3a3a3a; color: #888;';
    }
  }}
`;

function Dashboard() {
  const [stats, setStats] = useState({
    totalTracks: 0,
    processedTracks: 0,
    totalMixTime: 0,
    activeSessions: 0,
    totalDownloads: 0,
    storageUsed: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Load real stats from localStorage
    const loadStats = () => {
      const currentStats = storage.getStats();
      if (currentStats) {
        setStats(currentStats);
      }

      // Update storage usage
      const storageSize = storage.calculateStorageUsage();
      storage.updateStats({ storageUsed: storageSize });
    };

    // Load recent activity
    const loadRecentActivity = () => {
      const history = storage.getProcessingHistory();
      setRecentActivity(history.slice(0, 5)); // Show last 5 activities
    };

    loadStats();
    loadRecentActivity();

    // Start session tracking
    storage.startSession();

    // Update stats every 30 seconds
    const interval = setInterval(() => {
      loadStats();
      loadRecentActivity();
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      storage.endSession();
    };
  }, []);

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatStorageSize = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardContainer>
      <Header>
        <h1>Welcome to AutoDJ</h1>
        <p>Your AI-powered music mixing companion</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <Music size={20} />
            <h3>Total Tracks</h3>
          </StatHeader>
          <StatValue>{stats.totalTracks}</StatValue>
          <StatSubtext>Songs in your library</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <Activity size={20} />
            <h3>Processed Tracks</h3>
          </StatHeader>
          <StatValue>{stats.processedTracks}</StatValue>
          <StatSubtext>Ready for AI mixing</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <Clock size={20} />
            <h3>Total Mix Time</h3>
          </StatHeader>
          <StatValue>{formatTime(stats.totalMixTime)}</StatValue>
          <StatSubtext>Time spent mixing</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <Download size={20} />
            <h3>Downloads</h3>
          </StatHeader>
          <StatValue>{stats.totalDownloads || 0}</StatValue>
          <StatSubtext>Total downloads</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <Headphones size={20} />
            <h3>Active Sessions</h3>
          </StatHeader>
          <StatValue>{stats.activeSessions || 0}</StatValue>
          <StatSubtext>Current mix sessions</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <Activity size={20} />
            <h3>Storage Used</h3>
          </StatHeader>
          <StatValue>{formatStorageSize(stats.storageUsed || 0)}</StatValue>
          <StatSubtext>Data storage</StatSubtext>
        </StatCard>
      </StatsGrid>

      <QuickActions>
        <h2>Quick Actions</h2>
        <ActionGrid>
          <ActionCard>
            <h3><Upload size={18} />Upload & Process Music</h3>
            <p>Add new tracks to your library and process them into stems for AI mixing</p>
          </ActionCard>
          
          <ActionCard>
            <h3><Music size={18} />Start AI DJ Session</h3>
            <p>Create a new queue and let the AI automatically mix your music</p>
          </ActionCard>
          
          <ActionCard>
            <h3><Download size={18} />Download from URL</h3>
            <p>Import music directly from YouTube or SoundCloud links</p>
          </ActionCard>
        </ActionGrid>
      </QuickActions>

      {recentActivity.length > 0 && (
        <RecentActivity>
          <h2>Recent Activity</h2>
          <ActivityList>
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon>
                  {activity.type === 'download' && <Download size={16} />}
                  {activity.type === 'processing' && <Upload size={16} />}
                  {activity.type === 'mixing' && <Music size={16} />}
                </ActivityIcon>
                <ActivityDetails>
                  <ActivityTitle>{activity.title || 'Unknown Activity'}</ActivityTitle>
                  <ActivityTime>{new Date(activity.timestamp).toLocaleString()}</ActivityTime>
                </ActivityDetails>
                <ActivityStatus status={activity.status}>
                  {activity.status}
                </ActivityStatus>
              </ActivityItem>
            ))}
          </ActivityList>
        </RecentActivity>
      )}
    </DashboardContainer>
  );
}

export default Dashboard; 