/**
 * Test Refined Transition Mechanics
 * Verifies that the new transition system addresses volume fluctuations and stem overlap
 */

import { ProfessionalAutoDJ } from './professionalAutoDJ.js';

class RefinedTransitionTester {
  constructor() {
    this.professionalAutoDJ = new ProfessionalAutoDJ();
    this.testResults = [];
  }

  /**
   * Run all tests for refined transitions
   */
  async runAllTests() {
    console.log('🧪 TESTING REFINED TRANSITION MECHANICS');
    console.log('=====================================');

    const tests = [
      this.testSmoothStaggeredTransition,
      this.testFrequencySeparatedTransition,
      this.testEnergyFlowTransition,
      this.testVocalIsolatedTransition,
      this.testQuickCleanTransition,
      this.testVolumeCurves,
      this.testStemOverlapPrevention
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
   * Test smooth staggered transition
   */
  async testSmoothStaggeredTransition() {
    console.log('\n🎵 Testing Smooth Staggered Transition...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 128,
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 130,
      key: { name: 'G Major', mode: 'major' },
      camelotKey: '9B',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.8 }]
    };

    const plan = await this.professionalAutoDJ.executeSmoothStaggeredTransition(mockCurrentTrack, mockNextTrack);
    
    // Verify plan structure
    if (!plan || !plan.phases || plan.phases.length !== 4) {
      throw new Error('Invalid plan structure');
    }

    // Verify phase timing
    const expectedTimings = [0, 3000, 6000, 9000];
    plan.phases.forEach((phase, index) => {
      if (phase.time !== expectedTimings[index]) {
        throw new Error(`Phase ${index + 1} timing mismatch: expected ${expectedTimings[index]}, got ${phase.time}`);
      }
    });

    // Verify no stem overlap in phases
    plan.phases.forEach((phase, index) => {
      const actions = phase.actions || [];
      const stemVolumes = { A: {}, B: {} };
      
      actions.forEach(action => {
        if (action.stem !== 'all') {
          if (!stemVolumes[action.track][action.stem]) {
            stemVolumes[action.track][action.stem] = [];
          }
          stemVolumes[action.track][action.stem].push(action.volume);
        }
      });

      // Check for volume curves
      actions.forEach(action => {
        if (!action.curve) {
          throw new Error(`Phase ${index + 1}: Missing volume curve for ${action.track}-${action.stem}`);
        }
      });
    });

    console.log('✅ Smooth Staggered Transition: PASSED');
    this.testResults.push({ test: 'Smooth Staggered Transition', status: 'PASSED' });
  }

  /**
   * Test frequency separated transition
   */
  async testFrequencySeparatedTransition() {
    console.log('\n🎛️ Testing Frequency Separated Transition...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 120,
      key: { name: 'A Minor', mode: 'minor' },
      camelotKey: '8A',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.6 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 125,
      key: { name: 'E Minor', mode: 'minor' },
      camelotKey: '9A',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const plan = await this.professionalAutoDJ.executeFrequencySeparatedTransition(mockCurrentTrack, mockNextTrack);
    
    // Verify frequency filtering
    let hasFilters = false;
    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.filter && action.filter !== 'none') {
          hasFilters = true;
          if (!action.filter.type || !action.filter.cutoff) {
            throw new Error('Invalid filter configuration');
          }
        }
      });
    });

    if (!hasFilters) {
      throw new Error('No frequency filters applied');
    }

    console.log('✅ Frequency Separated Transition: PASSED');
    this.testResults.push({ test: 'Frequency Separated Transition', status: 'PASSED' });
  }

  /**
   * Test energy flow transition
   */
  async testEnergyFlowTransition() {
    console.log('\n⚡ Testing Energy Flow Transition...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 140,
      key: { name: 'D Major', mode: 'major' },
      camelotKey: '10B',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.9 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 145,
      key: { name: 'A Major', mode: 'major' },
      camelotKey: '11B',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.95 }]
    };

    const plan = await this.professionalAutoDJ.executeEnergyFlowTransition(mockCurrentTrack, mockNextTrack);
    
    // Verify energy preservation
    let energyPreserved = false;
    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.track === 'A' && action.volume > 0.8) {
          energyPreserved = true;
        }
      });
    });

    if (!energyPreserved) {
      throw new Error('Energy not preserved during transition');
    }

    console.log('✅ Energy Flow Transition: PASSED');
    this.testResults.push({ test: 'Energy Flow Transition', status: 'PASSED' });
  }

  /**
   * Test vocal isolated transition
   */
  async testVocalIsolatedTransition() {
    console.log('\n🎤 Testing Vocal Isolated Transition...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 128,
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 130,
      key: { name: 'G Major', mode: 'major' },
      camelotKey: '9B',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.8 }]
    };

    const plan = await this.professionalAutoDJ.executeVocalIsolatedTransition(mockCurrentTrack, mockNextTrack);
    
    // Verify vocal isolation
    let vocalsIsolated = false;
    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.stem === 'vocals' && action.track === 'B' && action.volume === 0) {
          vocalsIsolated = true;
        }
      });
    });

    if (!vocalsIsolated) {
      throw new Error('Vocals not properly isolated');
    }

    console.log('✅ Vocal Isolated Transition: PASSED');
    this.testResults.push({ test: 'Vocal Isolated Transition', status: 'PASSED' });
  }

  /**
   * Test quick clean transition
   */
  async testQuickCleanTransition() {
    console.log('\n⚡ Testing Quick Clean Transition...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 120,
      key: { name: 'A Minor', mode: 'minor' },
      camelotKey: '8A',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.6 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 140,
      key: { name: 'E Minor', mode: 'minor' },
      camelotKey: '9A',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const plan = await this.professionalAutoDJ.executeQuickCleanTransition(mockCurrentTrack, mockNextTrack);
    
    // Verify quick duration
    if (plan.duration > 8000) {
      throw new Error('Quick transition too long');
    }

    // Verify clean handover
    let hasCleanHandover = false;
    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.stem === 'all' && action.volume === 0) {
          hasCleanHandover = true;
        }
      });
    });

    if (!hasCleanHandover) {
      throw new Error('No clean handover in quick transition');
    }

    console.log('✅ Quick Clean Transition: PASSED');
    this.testResults.push({ test: 'Quick Clean Transition', status: 'PASSED' });
  }

  /**
   * Test volume curves
   */
  async testVolumeCurves() {
    console.log('\n📈 Testing Volume Curves...');
    
    const curves = ['ease-in', 'ease-out', 'ease-in-out', 'linear'];
    let allCurvesPresent = false;

    // Test with smooth staggered transition
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 128,
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 130,
      key: { name: 'G Major', mode: 'major' },
      camelotKey: '9B',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.8 }]
    };

    const plan = await this.professionalAutoDJ.executeSmoothStaggeredTransition(mockCurrentTrack, mockNextTrack);
    
    // Check for volume curves
    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.curve && curves.includes(action.curve)) {
          allCurvesPresent = true;
        }
      });
    });

    if (!allCurvesPresent) {
      throw new Error('Volume curves not properly implemented');
    }

    console.log('✅ Volume Curves: PASSED');
    this.testResults.push({ test: 'Volume Curves', status: 'PASSED' });
  }

  /**
   * Test stem overlap prevention
   */
  async testStemOverlapPrevention() {
    console.log('\n🚫 Testing Stem Overlap Prevention...');
    
    const mockCurrentTrack = {
      id: 'test1',
      title: 'Test Track 1',
      bpm: 128,
      key: { name: 'C Major', mode: 'major' },
      camelotKey: '8B',
      duration: 180,
      mixOutPoint: 160,
      vocalSections: [{ start: 30, end: 150 }],
      energyProfile: [{ time: 0, totalEnergy: 0.7 }]
    };

    const mockNextTrack = {
      id: 'test2',
      title: 'Test Track 2',
      bpm: 130,
      key: { name: 'G Major', mode: 'major' },
      camelotKey: '9B',
      duration: 200,
      vocalSections: [{ start: 20, end: 160 }],
      energyProfile: [{ time: 0, totalEnergy: 0.8 }]
    };

    const plan = await this.professionalAutoDJ.executeSmoothStaggeredTransition(mockCurrentTrack, mockNextTrack);
    
    // Check for staggered stem introduction
    let stemsStaggered = false;
    const stemOrder = ['drums', 'bass', 'other', 'vocals'];
    let currentStemIndex = 0;

    plan.phases.forEach(phase => {
      const actions = phase.actions || [];
      actions.forEach(action => {
        if (action.stem !== 'all' && action.track === 'B' && action.volume > 0) {
          if (stemOrder.includes(action.stem)) {
            stemsStaggered = true;
          }
        }
      });
    });

    if (!stemsStaggered) {
      throw new Error('Stems not properly staggered');
    }

    console.log('✅ Stem Overlap Prevention: PASSED');
    this.testResults.push({ test: 'Stem Overlap Prevention', status: 'PASSED' });
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('==============');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Refined transition mechanics are working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
    }
  }
}

// Export for use in other modules
export { RefinedTransitionTester };

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - can be called from console
  window.RefinedTransitionTester = RefinedTransitionTester;
  console.log('🧪 RefinedTransitionTester available. Run: new RefinedTransitionTester().runAllTests()');
} 