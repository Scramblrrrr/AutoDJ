/**
 * Test Web Worker Data Conversion
 * Verifies that AudioBuffer objects can be properly converted for Web Worker transfer
 */

import ProfessionalAutoDJ from './professionalAutoDJ.js';

class WebWorkerDataConversionTest {
  constructor() {
    this.professionalAutoDJ = new ProfessionalAutoDJ();
  }

  /**
   * Test AudioBuffer conversion
   */
  testAudioBufferConversion() {
    console.log('🧪 Testing AudioBuffer conversion...');
    
    // Create mock audio data
    const sampleRate = 44100;
    const duration = 5; // 5 seconds
    const samples = sampleRate * duration;
    
    const mockAudioData = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      // Create a simple sine wave pattern
      mockAudioData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
    }

    // Create mock AudioBuffer-like object
    const mockAudioBuffer = {
      channelData: mockAudioData,
      sampleRate: sampleRate,
      length: samples
    };

    // Test conversion
    const converted = this.professionalAutoDJ.convertAudioBufferForWorker(mockAudioBuffer);
    
    console.log('✅ Conversion result:', {
      originalLength: mockAudioData.length,
      convertedLength: converted.channelData.length,
      sampleRate: converted.sampleRate,
      isArray: Array.isArray(converted.channelData),
      firstValue: converted.channelData[0],
      lastValue: converted.channelData[converted.channelData.length - 1]
    });

    // Verify data integrity
    const isDataIntact = this.verifyDataIntegrity(mockAudioData, converted.channelData);
    console.log('✅ Data integrity check:', isDataIntact ? 'PASS' : 'FAIL');

    return {
      success: isDataIntact,
      converted: converted
    };
  }

  /**
   * Test stems conversion
   */
  testStemsConversion() {
    console.log('🧪 Testing stems conversion...');
    
    // Create mock stems
    const mockStems = {
      vocals: this.createMockAudioBuffer(44100, 5),
      drums: this.createMockAudioBuffer(44100, 5),
      bass: this.createMockAudioBuffer(44100, 5),
      other: this.createMockAudioBuffer(44100, 5)
    };

    // Test conversion
    const converted = this.professionalAutoDJ.convertStemsForWorker(mockStems);
    
    console.log('✅ Stems conversion result:', {
      originalKeys: Object.keys(mockStems),
      convertedKeys: Object.keys(converted),
      vocalsLength: converted.vocals?.channelData?.length,
      drumsLength: converted.drums?.channelData?.length,
      bassLength: converted.bass?.channelData?.length,
      otherLength: converted.other?.channelData?.length
    });

    // Verify all stems are converted
    const allStemsConverted = Object.keys(mockStems).every(key => 
      converted[key] && Array.isArray(converted[key].channelData)
    );

    console.log('✅ All stems converted:', allStemsConverted ? 'PASS' : 'FAIL');

    return {
      success: allStemsConverted,
      converted: converted
    };
  }

  /**
   * Create mock AudioBuffer
   */
  createMockAudioBuffer(sampleRate, duration) {
    const samples = sampleRate * duration;
    const mockAudioData = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      mockAudioData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
    }

    return {
      channelData: mockAudioData,
      sampleRate: sampleRate,
      length: samples
    };
  }

  /**
   * Verify data integrity after conversion
   */
  verifyDataIntegrity(original, converted) {
    if (original.length !== converted.length) {
      console.warn('❌ Length mismatch:', original.length, 'vs', converted.length);
      return false;
    }

    // Check first few values
    for (let i = 0; i < Math.min(10, original.length); i++) {
      if (Math.abs(original[i] - converted[i]) > 0.0001) {
        console.warn('❌ Value mismatch at index', i, ':', original[i], 'vs', converted[i]);
        return false;
      }
    }

    // Check last few values
    for (let i = Math.max(0, original.length - 10); i < original.length; i++) {
      if (Math.abs(original[i] - converted[i]) > 0.0001) {
        console.warn('❌ Value mismatch at index', i, ':', original[i], 'vs', converted[i]);
        return false;
      }
    }

    return true;
  }

  /**
   * Test Web Worker message transfer
   */
  async testWebWorkerMessageTransfer() {
    console.log('🧪 Testing Web Worker message transfer...');
    
    try {
      // Create mock track data
      const mockTrackData = {
        id: 'test-track',
        title: 'Test Track',
        artist: 'Test Artist',
        duration: 5,
        stems: {
          vocals: this.createMockAudioBuffer(44100, 5),
          drums: this.createMockAudioBuffer(44100, 5),
          bass: this.createMockAudioBuffer(44100, 5),
          other: this.createMockAudioBuffer(44100, 5)
        }
      };

      // Test Web Worker analysis
      const result = await this.professionalAutoDJ.webWorkerAnalysis('bpm', mockTrackData);
      
      console.log('✅ Web Worker analysis result:', result);
      
      return {
        success: true,
        result: result
      };

    } catch (error) {
      console.error('❌ Web Worker message transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Web Worker Data Conversion Tests...');
    console.log('=============================================');

    // Test AudioBuffer conversion
    const audioBufferTest = this.testAudioBufferConversion();
    
    // Test stems conversion
    const stemsTest = this.testStemsConversion();
    
    // Test Web Worker message transfer
    const workerTest = await this.testWebWorkerMessageTransfer();

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log('AudioBuffer Conversion:', audioBufferTest.success ? '✅ PASS' : '❌ FAIL');
    console.log('Stems Conversion:', stemsTest.success ? '✅ PASS' : '❌ FAIL');
    console.log('Web Worker Transfer:', workerTest.success ? '✅ PASS' : '❌ FAIL');

    const allPassed = audioBufferTest.success && stemsTest.success && workerTest.success;
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Web Worker data conversion is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the errors above.');
    }

    return {
      audioBufferTest,
      stemsTest,
      workerTest,
      allPassed
    };
  }
}

// Export for use in other files
export default WebWorkerDataConversionTest;

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
  const test = new WebWorkerDataConversionTest();
  test.runAllTests();
} 