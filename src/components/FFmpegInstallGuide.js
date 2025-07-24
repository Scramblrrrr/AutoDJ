import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, Download, ExternalLink, CheckCircle, Copy } from 'lucide-react';

const GuideContainer = styled.div`
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  svg {
    margin-right: 12px;
    color: #ffa500;
  }
  
  h3 {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }
`;

const Description = styled.p`
  color: #ccc;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const InstallSection = styled.div`
  margin-bottom: 24px;
  
  h4 {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
    }
  }
`;

const CodeBlock = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  font-family: 'Courier New', monospace;
  position: relative;
  
  code {
    color: #4ade80;
    font-size: 14px;
  }
  
  .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #3a3a3a;
    border: none;
    border-radius: 4px;
    padding: 6px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #4a4a4a;
      color: #ccc;
    }
  }
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ccc;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-right: 12px;
  margin-bottom: 8px;
  
  &:hover {
    background: #4a4a4a;
    border-color: #666;
    color: #fff;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const TestSection = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  
  h4 {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  p {
    color: #888;
    font-size: 12px;
    margin-bottom: 12px;
  }
`;

function FFmpegInstallGuide({ onClose }) {
  const [copiedCommand, setCopiedCommand] = useState('');

  const copyToClipboard = (text, command) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(''), 2000);
  };

  const isWindows = navigator.platform.toLowerCase().includes('win');
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const isLinux = !isWindows && !isMac;

  return (
    <GuideContainer>
      <Header>
        <AlertTriangle size={24} />
        <h3>FFmpeg Installation Required</h3>
      </Header>
      
      <Description>
        FFmpeg is required to convert downloaded audio files to your preferred format. 
        Choose your operating system below for installation instructions:
      </Description>

      {isWindows && (
        <InstallSection>
          <h4>🪟 Windows Installation</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Option 1: Using Chocolatey (Recommended)</strong>
            <CodeBlock>
              <code>choco install ffmpeg</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard('choco install ffmpeg', 'choco')}
              >
                {copiedCommand === 'choco' ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </CodeBlock>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Option 2: Manual Download</strong>
            <div style={{ marginTop: '8px' }}>
              <LinkButton href="https://ffmpeg.org/download.html#build-windows" target="_blank">
                <Download size={16} />
                Download FFmpeg for Windows
                <ExternalLink size={14} style={{ marginLeft: '4px' }} />
              </LinkButton>
            </div>
          </div>
        </InstallSection>
      )}

      {isMac && (
        <InstallSection>
          <h4>🍎 macOS Installation</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Using Homebrew (Recommended)</strong>
            <CodeBlock>
              <code>brew install ffmpeg</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard('brew install ffmpeg', 'brew')}
              >
                {copiedCommand === 'brew' ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </CodeBlock>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Manual Download</strong>
            <div style={{ marginTop: '8px' }}>
              <LinkButton href="https://ffmpeg.org/download.html#build-mac" target="_blank">
                <Download size={16} />
                Download FFmpeg for macOS
                <ExternalLink size={14} style={{ marginLeft: '4px' }} />
              </LinkButton>
            </div>
          </div>
        </InstallSection>
      )}

      {isLinux && (
        <InstallSection>
          <h4>🐧 Linux Installation</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Ubuntu/Debian</strong>
            <CodeBlock>
              <code>sudo apt update && sudo apt install ffmpeg</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard('sudo apt update && sudo apt install ffmpeg', 'apt')}
              >
                {copiedCommand === 'apt' ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </CodeBlock>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>CentOS/RHEL/Fedora</strong>
            <CodeBlock>
              <code>sudo dnf install ffmpeg</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard('sudo dnf install ffmpeg', 'dnf')}
              >
                {copiedCommand === 'dnf' ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </CodeBlock>
          </div>
        </InstallSection>
      )}

      <TestSection>
        <h4>Test Installation</h4>
        <p>After installation, restart AutoDJ and try downloading again. You can test FFmpeg by running:</p>
        <CodeBlock>
          <code>ffmpeg -version</code>
          <button 
            className="copy-btn"
            onClick={() => copyToClipboard('ffmpeg -version', 'version')}
          >
            {copiedCommand === 'version' ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
        </CodeBlock>
      </TestSection>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button className="btn-primary" onClick={onClose}>
          Got it!
        </button>
      </div>
    </GuideContainer>
  );
}

export default FFmpegInstallGuide; 