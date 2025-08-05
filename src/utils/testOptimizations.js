/**
 * Test file for optimized audio processing and progress tracking
 */

import optimizedAudioProcessor from './optimizedAudioProcessor';
import optimizedProgressTracker from './optimizedProgressTracker';

export async function testOptimizedProcessing() {
  console.log('🧪 Testing optimized audio processing...');
  
  try {
    // Test 1: Progress tracking
    console.log('📊 Test 1: Progress tracking');
    const testFileId = 'test_file_1';
    const testFileName = 'test_song.mp3';
    
    // Start tracking
    optimizedProgressTracker.startTracking(testFileId, testFileName);
    
    // Simulate progress updates
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'stem-processing', 25, 'Processing vocals...'), 100);
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'stem-processing', 50, 'Processing drums...'), 200);
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'stem-processing', 75, 'Processing bass...'), 300);
    setTimeout(() => optimizedProgressTracker.completeStage(testFileId, 'stem-processing', 'Stem processing complete'), 400);
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'analysis', 25, 'Analyzing BPM...'), 500);
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'analysis', 50, 'Analyzing key...'), 600);
    setTimeout(() => optimizedProgressTracker.updateStageProgress(testFileId, 'analysis', 75, 'Generating waveform...'), 700);
    setTimeout(() => optimizedProgressTracker.completeFile(testFileId, 'Processing complete!'), 800);
    
    // Test 2: Audio processor
    console.log('🎵 Test 2: Audio processor');
    const testAudioData = {
      sampleRate: 44100,
      channelData: new Float32Array(44100 * 10) // 10 seconds of silence
    };
    
    // Fill with some test data (simple sine wave)
    for (let i = 0; i < testAudioData.channelData.length; i++) {
      testAudioData.channelData[i] = Math.sin(2 * Math.PI * 440 * i / testAudioData.sampleRate) * 0.1;
    }
    
    const analysisResult = await optimizedAudioProcessor.analyzeAudioFile(
      'test_audio_1',
      testAudioData,
      (progress) => {
        console.log(`🎵 Audio analysis progress: ${progress.progress}% - ${progress.stage}`);
      }
    );
    
    console.log('🎵 Analysis result:', analysisResult);
    
    // Test 3: Parallel processing
    console.log('🚀 Test 3: Parallel processing');
    const testFiles = [
      { id: 'file_1', name: 'song1.mp3', audioData: testAudioData },
      { id: 'file_2', name: 'song2.mp3', audioData: testAudioData },
      { id: 'file_3', name: 'song3.mp3', audioData: testAudioData }
    ];
    
    const parallelResults = await optimizedAudioProcessor.processFilesInParallel(testFiles, 2);
    console.log('🚀 Parallel processing results:', parallelResults);
    
    // Test 4: Progress tracker statistics
    console.log('📊 Test 4: Progress tracker statistics');
    const stats = optimizedProgressTracker.getStatistics();
    console.log('📊 Progress tracker stats:', stats);
    
    console.log('✅ All optimization tests completed successfully!');
    
    return {
      success: true,
      analysisResult,
      parallelResults,
      stats
    };
    
  } catch (error) {
    console.error('❌ Optimization test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function cleanupTestResources() {
  console.log('🧹 Cleaning up test resources...');
  
  // Clean up progress tracker
  optimizedProgressTracker.reset();
  
  // Clean up audio processor
  optimizedAudioProcessor.destroy();
  
  console.log('✅ Test resources cleaned up');
}

// Auto-run test if this file is executed directly
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
  testOptimizedProcessing().then(result => {
    console.log('Test completed:', result);
  });
} 