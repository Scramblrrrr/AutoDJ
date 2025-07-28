#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function checkPrerequisites() {
  logStep(1, 'Checking prerequisites...');
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    logError('package.json not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    logWarning('node_modules not found. Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('Dependencies installed successfully');
    } catch (error) {
      logError('Failed to install dependencies');
      process.exit(1);
    }
  }
  
  // Check if Python requirements exist
  if (!fs.existsSync('python/requirements.txt')) {
    logError('python/requirements.txt not found');
    process.exit(1);
  }
  
  logSuccess('Prerequisites check passed');
}

function buildReactApp() {
  logStep(2, 'Building React application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('React app built successfully');
  } catch (error) {
    logError('Failed to build React app');
    process.exit(1);
  }
}

function copyMainJs() {
  logStep(3, 'Copying main.js to build directory...');
  
  try {
    const sourcePath = path.join('src', 'main.js');
    const destPath = path.join('build', 'electron.js');
    
    if (!fs.existsSync(sourcePath)) {
      logError('src/main.js not found');
      process.exit(1);
    }
    
    fs.copyFileSync(sourcePath, destPath);
    logSuccess('main.js copied successfully');
  } catch (error) {
    logError('Failed to copy main.js');
    process.exit(1);
  }
}

function packageApp(platform) {
  logStep(4, `Packaging for ${platform}...`);
  
  try {
    const command = platform === 'all' ? 'npm run electron-pack-all' : `npm run electron-pack-${platform}`;
    execSync(command, { stdio: 'inherit' });
    logSuccess(`App packaged successfully for ${platform}`);
  } catch (error) {
    logError(`Failed to package for ${platform}`);
    process.exit(1);
  }
}

function showResults() {
  logStep(5, 'Packaging completed!');
  
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    log('\nGenerated files:', 'bright');
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      log(`  ${file} (${size} MB)`, 'green');
    });
  }
  
  log('\nNext steps:', 'bright');
  log('1. Test the packaged application', 'yellow');
  log('2. Sign the application (recommended for distribution)', 'yellow');
  log('3. Upload to your distribution platform', 'yellow');
}

function main() {
  const platform = process.argv[2] || 'win';
  
  log('AutoDJ Packaging Script', 'bright');
  log('=======================\n', 'bright');
  
  if (!['win', 'mac', 'linux', 'all'].includes(platform)) {
    logError('Invalid platform. Use: win, mac, linux, or all');
    process.exit(1);
  }
  
  try {
    checkPrerequisites();
    buildReactApp();
    copyMainJs();
    packageApp(platform);
    showResults();
  } catch (error) {
    logError('Packaging failed with error: ' + error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, checkPrerequisites, buildReactApp, copyMainJs, packageApp }; 