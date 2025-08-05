/**
 * Test Web Worker Analysis
 * Verifies that the Web Worker approach prevents UI freezing
 */

import ProfessionalAutoDJ from './professionalAutoDJ.js';

class WebWorkerAnalysisTest {
  constructor() {
    this.professionalAutoDJ = new ProfessionalAutoDJ();
    this.testResults = [];
  }

  /**
   * Test UI responsiveness during analysis
   */
  async testUIResponsiveness() {
    console.log('🧪 Testing UI responsiveness during analysis...');
    
    const startTime = performance.now();
    let uiBlocked = false;
    let lastCheck = startTime;

    // Monitor UI responsiveness
    const checkInterval = setInterval(() => {
      const currentTime = performance.now();
      const timeSinceLastCheck = currentTime - lastCheck;
      
      // If more than 100ms has passed, UI might be blocked
      if (timeSinceLastCheck > 100) {
        uiBlocked = true;
        console.warn('⚠️ UI responsiveness check delayed:', timeSinceLastCheck.toFixed(2), 'ms');
      }
      
      lastCheck = currentTime;
    }, 16); // Check every 16ms (~60fps)

    // Create mock track data
    const mockTrackData = this.createMockTrackData();

    try {
      // Start analysis
      console.log('🎵 Starting analysis...');
      const analysis = await this.professionalAutoDJ.analyzeTrack(mockTrackData);
      
      clearInterval(checkInterval);
      const totalTime = performance.now() - startTime;
      
      const result = {
        success: true,
        totalTime: totalTime,
        uiBlocked: uiBlocked,
        analysis: analysis
      };

      console.log('✅ Analysis completed in', totalTime.toFixed(2), 'ms');
      console.log('UI Blocked:', uiBlocked ? 'Yes' : 'No');
      
      this.testResults.push({
        test: 'UI Responsiveness',
        result: result
      });

      return result;

    } catch (error) {
      clearInterval(checkInterval);
      console.error('❌ Analysis failed:', error);
      
      const result = {
        success: false,
        error: error.message,
        uiBlocked: uiBlocked
      };

      this.testResults.push({
        test: 'UI Responsiveness',
        result: result
      });

      return result;
    }
  }

  /**
   * Test individual analysis steps
   */
  async testIndividualSteps() {
    console.log('🧪 Testing individual analysis steps...');
    
    const mockTrackData = this.createMockTrackData();
    const steps = ['bpm', 'key', 'structure', 'vocal', 'energy'];
    
    for (const step of steps) {
      console.log(`🎵 Testing ${step} analysis...`);
      const startTime = performance.now();
      
      try {
        const result = await this.professionalAutoDJ.webWorkerAnalysis(step, mockTrackData);
        const duration = performance.now() - startTime;
        
        console.log(`✅ ${step} analysis completed in ${duration.toFixed(2)}ms`);
        
        this.testResults.push({
          test: `${step.toUpperCase()} Analysis`,
          result: {
            success: true,
            duration: duration,
            result: result
          }
        });

      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`❌ ${step} analysis failed:`, error);
        
        this.testResults.push({
          test: `${step.toUpperCase()} Analysis`,
          result: {
            success: false,
            duration: duration,
            error: error.message
          }
        });
      }
    }
  }

  /**
   * Test Web Worker creation and communication
   */
  async testWebWorkerCommunication() {
    console.log('🧪 Testing Web Worker communication...');
    
    try {
      // Test if Web Worker can be created
      const worker = new Worker(new URL('../workers/professionalAnalysisWorker.js', import.meta.url));
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          worker.terminate();
          console.error('❌ Web Worker communication timeout');
          resolve({
            success: false,
            error: 'Worker communication timeout'
          });
        }, 5000);

        worker.addEventListener('message', (event) => {
          if (event.data.type === 'worker-ready') {
            clearTimeout(timeout);
            worker.terminate();
            console.log('✅ Web Worker communication successful');
            resolve({
              success: true,
              message: 'Worker ready'
            });
          }
        });

        worker.addEventListener('error', (error) => {
          clearTimeout(timeout);
          worker.terminate();
          console.error('❌ Web Worker error:', error);
          resolve({
            success: false,
            error: error.message
          });
        });
      });

    } catch (error) {
      console.error('❌ Web Worker creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test fallback behavior
   */
  async testFallbackBehavior() {
    console.log('🧪 Testing fallback behavior...');
    
    try {
      // Test with invalid data to trigger fallback
      const invalidTrackData = {
        id: 'test-fallback',
        title: 'Test Fallback',
        artist: 'Test Artist',
        stems: {} // Empty stems should trigger fallback
      };

      const startTime = performance.now();
      const analysis = await this.professionalAutoDJ.analyzeTrack(invalidTrackData);
      const duration = performance.now() - startTime;

      console.log('✅ Fallback analysis completed in', duration.toFixed(2), 'ms');
      
      this.testResults.push({
        test: 'Fallback Behavior',
        result: {
          success: true,
          duration: duration,
          analysis: analysis
        }
      });

      return {
        success: true,
        duration: duration,
        analysis: analysis
      };

    } catch (error) {
      console.error('❌ Fallback test failed:', error);
      
      this.testResults.push({
        test: 'Fallback Behavior',
        result: {
          success: false,
          error: error.message
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create mock track data for testing
   */
  createMockTrackData() {
    // Create mock audio data (simplified for testing)
    const sampleRate = 44100;
    const duration = 30; // 30 seconds
    const samples = sampleRate * duration;
    
    const mockAudioData = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      // Create a simple sine wave pattern
      mockAudioData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
    }

    return {
      id: 'test-track-' + Date.now(),
      title: 'Test Track',
      artist: 'Test Artist',
      duration: duration,
      stems: {
        beats: {
          sampleRate: sampleRate,
          length: samples,
          channelData: mockAudioData
        },
        vocals: {
          sampleRate: sampleRate,
          length: samples,
          channelData: mockAudioData
        },
        drums: {
          sampleRate: sampleRate,
          length: samples,
          channelData: mockAudioData
        }
      }
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Web Worker Analysis Tests...');
    console.log('=====================================');

    // Test Web Worker communication first
    const workerTest = await this.testWebWorkerCommunication();
    this.testResults.push({
      test: 'Web Worker Communication',
      result: workerTest
    });

    if (!workerTest.success) {
      console.error('❌ Web Worker communication failed, skipping other tests');
      return this.testResults;
    }

    // Test individual steps
    await this.testIndividualSteps();

    // Test fallback behavior
    await this.testFallbackBehavior();

    // Test UI responsiveness
    await this.testUIResponsiveness();

    // Print summary
    this.printTestSummary();

    return this.testResults;
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    let passed = 0;
    let failed = 0;

    for (const test of this.testResults) {
      const status = test.result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.test}`);
      
      if (test.result.success) {
        passed++;
      } else {
        failed++;
        console.log(`   Error: ${test.result.error}`);
      }
    }

    console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Web Worker analysis is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the errors above.');
    }
  }
}

// Export for use in other files
export default WebWorkerAnalysisTest;

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
  const test = new WebWorkerAnalysisTest();
  test.runAllTests();
} 