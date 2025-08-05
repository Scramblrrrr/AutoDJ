/**
 * Test Chunked Analysis
 * Verifies that the new chunked analysis prevents UI freezing
 */

import { ProfessionalAutoDJ } from './professionalAutoDJ.js';

class ChunkedAnalysisTester {
  constructor() {
    this.professionalAutoDJ = new ProfessionalAutoDJ();
    this.testResults = [];
  }

  /**
   * Test UI responsiveness during analysis
   */
  async testUIResponsiveness() {
    console.log('🧪 TESTING UI RESPONSIVENESS DURING ANALYSIS');
    console.log('============================================');

    // Mock track data
    const mockTrack = {
      id: 'test_track_1',
      title: 'Test Track',
      artist: 'Test Artist',
      duration: 180,
      stems: {
        drums: new Float32Array(44100 * 30), // 30 seconds of audio
        bass: new Float32Array(44100 * 30),
        other: new Float32Array(44100 * 30),
        vocals: new Float32Array(44100 * 30)
      }
    };

    // Start UI responsiveness monitoring
    const startTime = Date.now();
    let uiBlocked = false;
    let lastCheck = startTime;

    // Monitor UI responsiveness
    const checkUI = () => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheck;
      
      // If more than 100ms has passed, UI might be blocked
      if (timeSinceLastCheck > 100) {
        uiBlocked = true;
        console.warn(`⚠️ UI potentially blocked for ${timeSinceLastCheck}ms`);
      }
      
      lastCheck = now;
    };

    // Set up UI monitoring
    const uiMonitor = setInterval(checkUI, 16); // Check every 16ms (~60fps)

    try {
      console.log('🎵 Starting chunked analysis...');
      
      // Start the analysis
      const analysisPromise = this.professionalAutoDJ.analyzeTrack(mockTrack);
      
      // Wait for analysis to complete
      const analysis = await analysisPromise;
      
      console.log('✅ Analysis completed');
      console.log(`📊 Analysis result: BPM=${analysis.bpm}, Key=${analysis.key?.name}`);
      
      if (!uiBlocked) {
        console.log('✅ UI remained responsive during analysis');
        this.testResults.push({ test: 'UI Responsiveness', status: 'PASSED' });
      } else {
        console.log('❌ UI was blocked during analysis');
        this.testResults.push({ test: 'UI Responsiveness', status: 'FAILED', error: 'UI blocked' });
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.testResults.push({ test: 'UI Responsiveness', status: 'FAILED', error: error.message });
    } finally {
      clearInterval(uiMonitor);
    }
  }

  /**
   * Test chunked analysis performance
   */
  async testChunkedAnalysisPerformance() {
    console.log('\n⚡ TESTING CHUNKED ANALYSIS PERFORMANCE');
    console.log('=====================================');

    const mockTrack = {
      id: 'test_track_2',
      title: 'Performance Test Track',
      artist: 'Test Artist',
      duration: 180,
      stems: {
        drums: new Float32Array(44100 * 30),
        bass: new Float32Array(44100 * 30),
        other: new Float32Array(44100 * 30),
        vocals: new Float32Array(44100 * 30)
      }
    };

    try {
      const startTime = performance.now();
      
      console.log('🎵 Starting performance test...');
      const analysis = await this.professionalAutoDJ.analyzeTrack(mockTrack);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ Analysis completed in ${duration.toFixed(2)}ms`);
      
      if (duration < 5000) { // Should complete within 5 seconds
        console.log('✅ Analysis completed within acceptable time');
        this.testResults.push({ test: 'Analysis Performance', status: 'PASSED', duration });
      } else {
        console.log('⚠️ Analysis took longer than expected');
        this.testResults.push({ test: 'Analysis Performance', status: 'WARNING', duration });
      }
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      this.testResults.push({ test: 'Analysis Performance', status: 'FAILED', error: error.message });
    }
  }

  /**
   * Test fallback behavior
   */
  async testFallbackBehavior() {
    console.log('\n🔄 TESTING FALLBACK BEHAVIOR');
    console.log('============================');

    // Test with invalid track data
    const invalidTrack = {
      id: 'invalid_track',
      title: 'Invalid Track',
      stems: null // Invalid stems
    };

    try {
      console.log('🎵 Testing fallback with invalid data...');
      const analysis = await this.professionalAutoDJ.analyzeTrack(invalidTrack);
      
      if (analysis && analysis.bpm === 120) {
        console.log('✅ Fallback analysis worked correctly');
        this.testResults.push({ test: 'Fallback Behavior', status: 'PASSED' });
      } else {
        console.log('❌ Fallback analysis failed');
        this.testResults.push({ test: 'Fallback Behavior', status: 'FAILED' });
      }
      
    } catch (error) {
      console.error('❌ Fallback test failed:', error);
      this.testResults.push({ test: 'Fallback Behavior', status: 'FAILED', error: error.message });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 RUNNING CHUNKED ANALYSIS TESTS');
    console.log('================================');
    
    const tests = [
      this.testUIResponsiveness,
      this.testChunkedAnalysisPerformance,
      this.testFallbackBehavior
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error);
        this.testResults.push({ test: test.name, status: 'FAILED', error: error.message });
      }
    }

    this.printTestResults();
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n📊 CHUNKED ANALYSIS TEST RESULTS');
    console.log('===============================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.duration) {
        console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
      }
    });

    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! Chunked analysis is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
    }
  }
}

// Export for use in other modules
export { ChunkedAnalysisTester };

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - can be called from console
  window.ChunkedAnalysisTester = ChunkedAnalysisTester;
  console.log('🧪 ChunkedAnalysisTester available. Run: new ChunkedAnalysisTester().runAllTests()');
} 