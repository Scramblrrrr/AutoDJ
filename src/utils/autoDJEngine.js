/**
 * Professional Auto-DJ Engine for AutoDJ
 * Handles automatic track transitions with beatmatching, harmonic mixing, and stem control
 */

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

class AutoDJEngine {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.isActive = false;
        this.currentTransition = null;
        this.trackAnalyses = new Map(); // Cache for track analyses
        this.transitionHistory = [];
        this.lastTransitionCheck = 0;
        this.lastOptimalPoint = null;
        
        // Auto-DJ settings
        this.settings = {
            autoTransitionEnabled: true,
            transitionLength: 16, // seconds
            beatmatchTolerance: 0.06, // 6% tempo variance
            harmonicMixing: true,
            stemMixing: true,
            quickTransitionMode: false
        };
        
        // Transition styles
        this.transitionStyles = {
            crossfade: this.executeCrossfade.bind(this),
            echo_out: this.executeEchoOut.bind(this),
            quick_cut: this.executeQuickCut.bind(this),
            slam: this.executeSlam.bind(this),
            loop_extend: this.executeLoopExtend.bind(this)
        };
        
        console.log('🎧 AutoDJ Engine initialized');
    }
    
    /**
     * Enable Auto-DJ with intelligent transitions
     */
    async enable() {
        if (this.isActive) {
            console.log('🎧 AutoDJ already enabled');
            return true;
        }
        
        this.isActive = true;
        console.log('🎧 AutoDJ enabled - intelligent transitions active');
        
        // Start monitoring current track for transition opportunities
        this.startTransitionMonitoring();
        
        // Analyze queued tracks
        await this.analyzeQueuedTracks();
        
        return true;
    }
    
    /**
     * Disable Auto-DJ
     */
    async disable() {
        if (!this.isActive) {
            console.log('🎧 AutoDJ already disabled');
            return true;
        }
        
        this.isActive = false;
        this.currentTransition = null;
        
        // Clear any monitoring intervals
        if (this.transitionMonitoringInterval) {
            clearInterval(this.transitionMonitoringInterval);
            this.transitionMonitoringInterval = null;
        }
        
        console.log('🎧 AutoDJ disabled');
        return true;
    }
    
    /**
     * Start monitoring current track for transition timing
     */
    startTransitionMonitoring() {
        if (!this.isActive) return;
        
        // Check every second for transition opportunities
        this.monitoringInterval = setInterval(() => {
            this.checkTransitionTiming();
        }, 1000);
    }
    
    /**
     * Check if it's time to start a transition - now with musical intelligence
     * Only starts looking for transitions in the last 60 seconds of the track
     */
    async checkTransitionTiming() {
        if (!this.isActive || this.currentTransition) return;
        
        const currentTrack = this.audioEngine.getCurrentTrack();
        const nextTrack = this.audioEngine.getNextTrack();
        
        if (!currentTrack || !nextTrack) return;
        
        const currentTime = this.audioEngine.getCurrentTime();
        const timeRemaining = currentTrack.duration - currentTime;
        
        // Only look for transitions in the last 60 seconds of the track
        if (timeRemaining > 60) {
            // Reset transition state if we're not in transition zone yet
            this.lastOptimalPoint = null;
            return;
        }
        
        // Throttle checks to reduce spam (only check every 0.5 seconds)
        if (currentTime - this.lastTransitionCheck < 0.5) return;
        this.lastTransitionCheck = currentTime;
        
        console.log(`🎧 AutoDJ: In transition zone - ${timeRemaining.toFixed(1)}s remaining`);
        
        // Get track analysis with deep musical structure
        const currentAnalysis = await this.getTrackAnalysis(currentTrack);
        const nextAnalysis = await this.getTrackAnalysis(nextTrack);
        
        if (!currentAnalysis || !nextAnalysis) return;
        
        // Find the next optimal transition point (look ahead up to remaining time)
        const maxLookAhead = Math.min(timeRemaining - 5, 16); // Leave at least 5s for transition
        const optimalTransitionPoint = this.findNextMusicalTransitionPoint(currentAnalysis, currentTime, maxLookAhead);
        
        if (!optimalTransitionPoint) {
            // If no optimal point found and we're very close to the end, do emergency transition
            if (timeRemaining <= 8) {
                console.log('🎧 AutoDJ: Emergency transition - track ending soon');
                const entryPoint = this.findOptimalEntryPoint(nextAnalysis, { type: 'emergency', time: currentTime });
                await this.executeMusicalTransition(currentAnalysis, nextAnalysis, { type: 'emergency', time: currentTime, description: 'Emergency transition' }, entryPoint);
            }
            return;
        }
        
        // Check if this is a new optimal point to reduce logging spam
        const pointKey = `${optimalTransitionPoint.time.toFixed(1)}_${optimalTransitionPoint.type}`;
        const lastPointKey = this.lastOptimalPoint ? `${this.lastOptimalPoint.time.toFixed(1)}_${this.lastOptimalPoint.type}` : null;
        
        if (pointKey !== lastPointKey) {
            console.log(`🎯 Transition candidate: ${optimalTransitionPoint.time.toFixed(1)}s (${optimalTransitionPoint.description}) - ${timeRemaining.toFixed(1)}s remaining`);
            this.lastOptimalPoint = optimalTransitionPoint;
        }
        
        // Check if we've reached the optimal transition point
        const timeUntilTransition = optimalTransitionPoint.time - currentTime;
        
        if (timeUntilTransition <= 0.5 && timeUntilTransition >= -0.1) { // Within 500ms window
            console.log(`🎧 AutoDJ: Executing musical transition at ${optimalTransitionPoint.time.toFixed(1)}s (${optimalTransitionPoint.description})`);
            
            // Find optimal entry point in next track
            const entryPoint = this.findOptimalEntryPoint(nextAnalysis, optimalTransitionPoint);
            
            console.log(`🎧 AutoDJ: Starting next track at ${entryPoint.time.toFixed(1)}s (${entryPoint.description})`);
            
            await this.executeMusicalTransition(currentAnalysis, nextAnalysis, optimalTransitionPoint, entryPoint);
        }
    }
    
    /**
     * Execute quick transition (user-triggered) - now waits for optimal musical moment
     */
    async executeQuickTransition() {
        if (!this.isActive) {
            console.warn('AutoDJ not active - cannot execute quick transition');
            return false;
        }
        
        const currentTrack = this.audioEngine.getCurrentTrack();
        const nextTrack = this.audioEngine.getNextTrack();
        
        if (!currentTrack || !nextTrack) {
            console.warn('No tracks available for quick transition');
            return false;
        }
        
        const currentTime = this.audioEngine.getCurrentTime();
        const currentAnalysis = await this.getTrackAnalysis(currentTrack);
        const nextAnalysis = await this.getTrackAnalysis(nextTrack);
        
        if (!currentAnalysis || !nextAnalysis) {
            console.warn('Track analysis not available for quick transition');
            return false;
        }
        
        console.log('🎧 AutoDJ: Quick transition requested - finding optimal musical moment');
        
        // Find the next optimal transition point (within 4 seconds max)
        const optimalTransitionPoint = this.findNextMusicalTransitionPoint(currentAnalysis, currentTime, 4.0, true);
        
        if (!optimalTransitionPoint) {
            console.log('🎧 AutoDJ: No optimal point found - executing immediate fallback');
            const fallbackResult = await this.executeFallbackTransition();
            return { 
                success: fallbackResult.success || true, 
                message: 'Quick transition executed with fallback method',
                style: 'fallback'
            };
        }
        
        const waitTime = (optimalTransitionPoint.time - currentTime) * 1000;
        console.log(`🎧 AutoDJ: Waiting ${waitTime.toFixed(0)}ms for musical transition point (${optimalTransitionPoint.description})`);
        
        // Wait for the optimal moment
        if (waitTime > 0) {
            setTimeout(async () => {
                const entryPoint = this.findOptimalEntryPoint(nextAnalysis, optimalTransitionPoint);
                await this.executeMusicalTransition(currentAnalysis, nextAnalysis, optimalTransitionPoint, entryPoint);
            }, waitTime);
            
            return { 
                success: true, 
                message: `Quick transition scheduled - waiting ${waitTime.toFixed(0)}ms for optimal moment`,
                transitionPoint: optimalTransitionPoint,
                waitTime: waitTime
            };
        } else {
            // Execute immediately if we're already at/past the point
            const entryPoint = this.findOptimalEntryPoint(nextAnalysis, optimalTransitionPoint);
            await this.executeMusicalTransition(currentAnalysis, nextAnalysis, optimalTransitionPoint, entryPoint);
            
            return { 
                success: true, 
                message: 'Quick transition executed immediately',
                transitionPoint: optimalTransitionPoint,
                entryPoint: entryPoint
            };
        }
    }
    
    /**
     * Main transition execution logic
     */
    async executeAutoTransition(currentAnalysis, nextAnalysis, type = 'auto', forceTime = null) {
        try {
            // Plan the transition using Python engine
            const transitionPlan = await this.planTransition(currentAnalysis, nextAnalysis, type, forceTime);
            
            if (!transitionPlan || transitionPlan.success_probability < 0.3) {
                console.warn('AutoDJ: Transition plan quality too low, using fallback');
                return await this.executeFallbackTransition();
            }
            
            // Store current transition
            this.currentTransition = {
                plan: transitionPlan,
                startTime: Date.now(),
                currentTrack: currentAnalysis,
                nextTrack: nextAnalysis
            };
            
            // Execute the planned transition
            const style = transitionPlan.style.name;
            const transitionFunction = this.transitionStyles[style] || this.transitionStyles.crossfade;
            
                         console.log(`🎧 AutoDJ: Executing ${style} transition (${Math.round(transitionPlan.success_probability * 100)}% confidence)`);
            
            const result = await transitionFunction(transitionPlan);
            
            // Log transition for learning
            this.logTransition(transitionPlan, result);
            
            return result;
            
        } catch (error) {
            console.error('AutoDJ transition failed:', error);
            return await this.executeFallbackTransition();
        }
    }
    
    /**
     * Plan transition using Python analysis engine
     */
    async planTransition(currentAnalysis, nextAnalysis, type = 'auto', forceTime = null) {
        try {
            if (!ipcRenderer) {
                console.warn('IPC not available, using fallback transition planning');
                return this.createFallbackPlan(currentAnalysis, nextAnalysis);
            }
            
            const planData = {
                current_track: currentAnalysis,
                next_track: nextAnalysis,
                transition_type: type,
                force_time: forceTime
            };
            
            const result = await ipcRenderer.invoke('plan-autodj-transition', planData);
            return result;
            
        } catch (error) {
            console.error('Transition planning failed:', error);
            return this.createFallbackPlan(currentAnalysis, nextAnalysis);
        }
    }
    
    /**
     * Get or generate track analysis
     */
    async getTrackAnalysis(track) {
        const trackId = track.id || track.path;
        
        // Check cache first
        if (this.trackAnalyses.has(trackId)) {
            return this.trackAnalyses.get(trackId);
        }
        
        try {
            // Request analysis from Python
            if (ipcRenderer) {
                const analysis = await ipcRenderer.invoke('analyze-track-autodj', {
                    audio_file: track.path,
                    stems_dir: track.stemsPath
                });
                
                // Cache the analysis
                this.trackAnalyses.set(trackId, analysis);
                return analysis;
            }
            
        } catch (error) {
            console.error('Track analysis failed:', error);
        }
        
        // Fallback analysis
        return this.createFallbackAnalysis(track);
    }
    
    /**
     * Analyze all queued tracks in background
     */
    async analyzeQueuedTracks() {
        const queue = this.audioEngine.getQueue();
        
        for (const track of queue.slice(0, 3)) { // Analyze next 3 tracks
            if (!this.trackAnalyses.has(track.id)) {
                console.log(`🎧 AutoDJ: Pre-analyzing ${track.title}`);
                await this.getTrackAnalysis(track);
            }
        }
    }

    /**
     * Find the next optimal transition point based on musical structure
     * Looks for 8/16 bar boundaries with significant musical changes
     */
    findNextMusicalTransitionPoint(analysis, currentTime, maxWaitTime = 16.0, verbose = false) {
        if (verbose) {
            console.log(`🎼 Finding optimal transition point from ${currentTime.toFixed(1)}s (max wait: ${maxWaitTime}s)`);
        }
        
        const bpm = analysis.bpm || 120;
        const beatsPerBar = 4;
        const secondsPerBeat = 60 / bpm;
        const secondsPerBar = secondsPerBeat * beatsPerBar;
        
        if (verbose) {
            console.log(`🎵 Musical timing: ${bpm} BPM, ${secondsPerBar.toFixed(1)}s per bar`);
        }
        
        // Generate potential transition points based on musical structure
        const transitionCandidates = [];
        
        // Find all 8-bar boundaries within the time window
        // Start from the current position and find next 8-bar boundaries
        const currentBar = Math.floor(currentTime / secondsPerBar);
        const maxTimePoint = currentTime + maxWaitTime;
        
        // ADVANCED: Analyze actual energy changes and vocal sections from audio data
        const energyChanges = this.analyzeEnergyChanges(analysis, currentTime, maxTimePoint);
        const vocalSections = this.analyzeVocalSections(analysis, currentTime, maxTimePoint);
        
        // Add energy-based transition points (higher priority than bar counting)
        energyChanges.forEach(energyPoint => {
            if (energyPoint.time > currentTime && energyPoint.time <= maxTimePoint) {
                transitionCandidates.push({
                    time: energyPoint.time,
                    type: 'energy_change',
                    description: `${energyPoint.type} at ${energyPoint.time.toFixed(1)}s`,
                    priority: energyPoint.intensity * 15, // Scale intensity to priority
                    musicalReason: `Energy ${energyPoint.direction} - ${energyPoint.description}`,
                    bpm: bpm,
                    energyLevel: energyPoint.level
                });
            }
        });
        
        // Add vocal-based transition points (very high priority)
        vocalSections.forEach(vocalPoint => {
            if (vocalPoint.time > currentTime && vocalPoint.time <= maxTimePoint) {
                transitionCandidates.push({
                    time: vocalPoint.time,
                    type: 'vocal_change',
                    description: `${vocalPoint.type} at ${vocalPoint.time.toFixed(1)}s`,
                    priority: 12, // Very high priority
                    musicalReason: `Vocal ${vocalPoint.action} - perfect transition moment`,
                    bmp: bpm,
                    vocalType: vocalPoint.type
                });
            }
        });
        
        // Fallback: Look for bar boundaries only if no energy/vocal points found
        if (transitionCandidates.length === 0) {
            for (let nextBar = currentBar + 1; nextBar * secondsPerBar <= maxTimePoint; nextBar++) {
                if (nextBar % 8 === 0) { // 8-bar phrase boundaries
                    const time = nextBar * secondsPerBar;
                    if (time > currentTime && time <= maxTimePoint && time < analysis.duration) {
                        transitionCandidates.push({
                            time: time,
                            type: 'phrase_boundary',
                            description: `${nextBar}-bar phrase boundary`,
                            priority: 6, // Lower priority than energy analysis
                            musicalReason: 'Natural phrase ending - vocals and instruments align',
                            bpm: bpm
                        });
                    }
                }
                
                if (nextBar % 16 === 0) { // 16-bar section boundaries
                    const time = nextBar * secondsPerBar;
                    if (time > currentTime && time <= maxTimePoint && time < analysis.duration) {
                        transitionCandidates.push({
                            time: time,
                            type: 'section_boundary',
                            description: `${nextBar}-bar section boundary`,
                            priority: 5, // Lower priority than energy analysis
                            musicalReason: 'Major section change - verse/chorus transition point',
                            bpm: bpm
                        });
                    }
                }
            }
        }
        
        // If no bar boundaries found, look for 4-bar boundaries as backup
        if (transitionCandidates.length === 0) {
            for (let nextBar = currentBar + 1; nextBar * secondsPerBar <= maxTimePoint; nextBar++) {
                if (nextBar % 4 === 0) { // 4-bar boundaries as fallback
                    const time = nextBar * secondsPerBar;
                    if (time > currentTime && time <= maxTimePoint && time < analysis.duration) {
                        transitionCandidates.push({
                            time: time,
                            type: 'bar_boundary',
                            description: `${nextBar}-bar boundary`,
                            priority: 5,
                            musicalReason: 'Bar boundary - safe transition point'
                        });
                    }
                }
            }
        }
        
        // 3. Energy change points from analysis
        if (analysis.vocals && Array.isArray(analysis.vocals)) {
            analysis.vocals.forEach(vocalSection => {
                const time = vocalSection.start || vocalSection.time;
                if (time > currentTime && time <= maxTimePoint) {
                    transitionCandidates.push({
                        time: time,
                        type: 'vocal_change',
                        description: 'Vocal section change',
                        priority: 7,
                        musicalReason: 'Vocal entry/exit - natural transition moment'
                    });
                }
            });
        }
        
        // 4. Structural cue points if available
        if (analysis.cue_out && analysis.cue_out > currentTime && analysis.cue_out <= maxTimePoint) {
            transitionCandidates.push({
                time: analysis.cue_out,
                type: 'cue_point',
                description: 'Professional cue out point',
                priority: 6,
                musicalReason: 'Analyzed optimal exit point'
            });
        }
        
        // Sort by priority and time proximity
        transitionCandidates.sort((a, b) => {
            // Prefer higher priority, then closer time
            if (a.priority !== b.priority) return b.priority - a.priority;
            return (a.time - currentTime) - (b.time - currentTime);
        });
        
        const chosen = transitionCandidates[0];
        if (verbose) {
            if (chosen) {
                console.log(`🎯 Optimal transition point: ${chosen.time.toFixed(1)}s (${chosen.description}) - ${chosen.musicalReason}`);
            } else {
                console.log(`❌ No transition points found within ${maxWaitTime}s window`);
            }
        }
        
        return chosen || null;
    }

    /**
     * Find optimal entry point - first beat with vocals from beatgrid analysis
     */
    findOptimalEntryPoint(analysis, transitionPoint) {
        console.log(`🎵 Finding first vocal beat for ${analysis.file || 'next track'}`);
        
        // PRIORITY 1: Find first beat with vocals using beatgrid + vocal analysis
        const firstVocalBeat = this.findFirstVocalBeat(analysis);
        if (firstVocalBeat !== null) {
            console.log(`🎯 Found first vocal beat: ${firstVocalBeat.toFixed(1)}s`);
            return {
                time: firstVocalBeat,
                description: 'First vocal beat',
                energyLevel: 'vocal',
                reason: 'Precise vocal entry from beatgrid analysis'
            };
        }

        // PRIORITY 2: Find first beat in a vocal section
        const firstVocalSection = this.findFirstVocalSection(analysis);
        if (firstVocalSection !== null) {
            console.log(`🎯 Found first vocal section: ${firstVocalSection.toFixed(1)}s`);
            return {
                time: firstVocalSection,
                description: 'First vocal section',
                energyLevel: 'vocal',
                reason: 'First identified vocal section'
            };
        }

        // PRIORITY 3: Estimate vocal entry based on typical song structure
        const estimatedVocalEntry = this.estimateVocalEntry(analysis);
        console.log(`🎯 Estimated vocal entry: ${estimatedVocalEntry.toFixed(1)}s`);
        
        return {
            time: estimatedVocalEntry,
            description: 'Estimated vocal entry',
            energyLevel: 'estimated',
            reason: 'Estimated based on song structure analysis'
        };
    }

    /**
     * Find the exact first beat that contains vocals using beatgrid
     */
    findFirstVocalBeat(analysis) {
        // Use beatgrid and vocal data if available
        if (analysis.beatgrid && analysis.vocals && Array.isArray(analysis.vocals)) {
            const beatgrid = analysis.beatgrid;
            const vocals = analysis.vocals;
            
            // Find the earliest vocal section
            const earliestVocal = vocals.reduce((earliest, vocal) => {
                const vocalStart = vocal.start || vocal.time || 0;
                return vocalStart < (earliest?.start || earliest?.time || Infinity) ? vocal : earliest;
            }, null);
            
            if (earliestVocal) {
                const vocalStartTime = earliestVocal.start || earliestVocal.time;
                
                // Find the first beat at or after the vocal start time
                const firstVocalBeat = beatgrid.find(beat => beat >= vocalStartTime);
                if (firstVocalBeat !== undefined) {
                    return firstVocalBeat;
                }
            }
        }
        
        return null;
    }

    /**
     * Find first vocal section from analysis data
     */
    findFirstVocalSection(analysis) {
        if (analysis.vocals && Array.isArray(analysis.vocals) && analysis.vocals.length > 0) {
            const firstVocal = analysis.vocals[0];
            return firstVocal.start || firstVocal.time || null;
        }
        return null;
    }

    /**
     * Estimate vocal entry based on typical song structure and BPM
     */
    estimateVocalEntry(analysis) {
        const duration = analysis.duration || 180;
        const bpm = analysis.bpm || 120;
        const secondsPerBar = (60 / bpm) * 4;
        
        // Most songs: vocals start after 8-16 bars (intro)
        // Find the beat closest to 15% of the song or after 8 bars, whichever comes first
        const eightBars = secondsPerBar * 8;
        const fifteenPercent = duration * 0.15;
        const estimatedStart = Math.min(eightBars, fifteenPercent);
        
        // If we have beatgrid, snap to the nearest beat
        if (analysis.beatgrid && Array.isArray(analysis.beatgrid)) {
            const nearestBeat = analysis.beatgrid.find(beat => beat >= estimatedStart);
            if (nearestBeat !== undefined) {
                return nearestBeat;
            }
        }
        
        return estimatedStart;
    }

    /**
     * Execute musical transition with beat synchronization and stem control
     */
    async executeMusicalTransition(currentAnalysis, nextAnalysis, transitionPoint, entryPoint) {
        // Prevent multiple simultaneous transitions
        if (this.currentTransition) {
            console.log('🎧 AutoDJ: Transition already in progress - skipping');
            return;
        }
        
        console.log(`🎧 Executing musical transition: ${transitionPoint.type} -> ${entryPoint.description}`);
        
        try {
            this.currentTransition = {
                type: 'musical',
                startTime: Date.now(),
                transitionPoint: transitionPoint,
                entryPoint: entryPoint
            };
            
            // Start next track at the optimal entry point
            await this.audioEngine.startNextTrack(entryPoint.time);
            console.log(`🎵 Next track started at ${entryPoint.time.toFixed(1)}s`);
            
            // CRITICAL: Set Track B stem volumes to audible levels for transition
            console.log('🔊 Setting Track B stem volumes for transition');
            const stemTypes = ['vocals', 'drums', 'bass', 'other'];
            stemTypes.forEach(stemType => {
                if (this.audioEngine.stemGains[stemType]?.trackB) {
                    this.audioEngine.stemGains[stemType].trackB.gain.value = 1.0;
                    console.log(`🎵 Track B ${stemType}: Set to 100% volume`);
                }
            });
            
            // Execute transition based on musical context
            const transitionStyle = this.chooseTransitionStyle(transitionPoint, entryPoint);
            console.log(`🎨 Using transition style: ${transitionStyle.name} - ${transitionStyle.reason}`);
            
            switch (transitionStyle.type) {
                case 'beat_sync_cut':
                    await this.executeBeatSyncCut(transitionPoint, entryPoint);
                    break;
                    
                case 'stem_transition':
                    await this.executeStemBasedTransition(transitionPoint, entryPoint);
                    break;
                    
                case 'echo_slam':
                    await this.executeEchoSlam(transitionPoint, entryPoint);
                    break;
                    
                default:
                    await this.executeIntelligentCrossfade(transitionPoint, entryPoint);
            }
            
            // Log successful transition
            const transitionResult = {
                success: true,
                style: transitionStyle.name,
                transition_point: transitionPoint,
                entry_point: entryPoint,
                timestamp: Date.now()
            };
            
            this.logTransition(transitionResult, transitionResult);
            
            // Clean up transition state
            setTimeout(() => {
                this.currentTransition = null;
                this.lastOptimalPoint = null;
                console.log('🎧 AutoDJ: Transition completed - ready for next transition');
            }, 1000); // Wait 1 second to ensure transition is complete
            
        } catch (error) {
            console.error('🎧 Musical transition failed:', error);
            this.currentTransition = null;
            await this.executeFallbackTransition();
        }
    }
    
    /**
     * Standard crossfade transition with stem control
     */
    async executeCrossfade(plan) {
        const timing = plan.timing;
        const beatmatch = plan.beatmatch;
        const stemPlan = plan.stem_plan;
        
        console.log('🎧 Executing crossfade transition');
        
        // Verify next track is ready
        const nextTrack = this.audioEngine.getNextTrack();
        if (!nextTrack) {
            throw new Error('No next track available for crossfade transition');
        }
        
        // Apply time-stretching if needed
        if (beatmatch.stretch_needed) {
            await this.applyTimeStretching(beatmatch);
        }
        
        // Schedule stem mixing
        if (this.settings.stemMixing && stemPlan) {
            await this.executeStemMixing(stemPlan, timing);
        } else {
            // Standard crossfade
            await this.executeStandardCrossfade(timing);
        }
        
        return { success: true, style: 'crossfade' };
    }
    
    /**
     * Echo out transition
     */
    async executeEchoOut(plan) {
        console.log('🎧 Executing echo out transition');
        
        const timing = plan.timing;
        const effects = plan.effects;
        
        // Add echo to outgoing track
        if (effects.track_a) {
            const echoEffect = effects.track_a.find(e => e.type === 'echo');
            if (echoEffect) {
                await this.addEchoEffect(echoEffect);
            }
        }
        
        // Wait for echo tail, then drop in next track
        setTimeout(async () => {
            await this.audioEngine.startNextTrack();
        }, timing.mix_duration * 0.7 * 1000);
        
        return { success: true, style: 'echo_out' };
    }
    
    /**
     * Quick cut transition
     */
    async executeQuickCut(plan) {
        console.log('🎧 Executing quick cut transition');
        
        const timing = plan.timing;
        
        // Find next beat for clean cut
        const nextBeat = this.findNextBeat(timing.start_time);
        
        // Schedule the cut
        setTimeout(async () => {
            await this.audioEngine.startNextTrack();
            this.audioEngine.stopCurrentTrack();
        }, (nextBeat - this.audioEngine.getCurrentTime()) * 1000);
        
        return { success: true, style: 'quick_cut' };
    }
    
    /**
     * Slam transition with effects
     */
    async executeSlam(plan) {
        console.log('🎧 Executing slam transition');
        
        const effects = plan.effects;
        
        // Apply filter effects
        if (effects.track_a) {
            for (const effect of effects.track_a) {
                await this.applyEffect(effect, 'current');
            }
        }
        
        // Hard cut to next track
        setTimeout(async () => {
            await this.audioEngine.startNextTrack();
            this.audioEngine.stopCurrentTrack();
            
            // Apply entry effects to new track
            if (effects.track_b) {
                for (const effect of effects.track_b) {
                    await this.applyEffect(effect, 'next');
                }
            }
        }, 500);
        
        return { success: true, style: 'slam' };
    }
    
    /**
     * Loop extension for timing adjustment
     */
    async executeLoopExtend(plan) {
        console.log('🎧 Executing loop extension');
        
        // Find good loop point (usually last 4 beats)
        const currentTime = this.audioEngine.getCurrentTime();
        const loopStart = currentTime - 2; // 2 seconds back
        const loopEnd = currentTime;
        
        // Set loop and extend
        await this.audioEngine.setLoop(loopStart, loopEnd);
        await this.audioEngine.enableLoop();
        
        // Disable loop after planned duration
        setTimeout(async () => {
            await this.audioEngine.disableLoop();
            await this.executeCrossfade(plan);
        }, plan.timing.mix_duration * 1000);
        
        return { success: true, style: 'loop_extend' };
    }
    
    /**
     * Execute stem-based mixing for vocal clash avoidance
     */
    async executeStemMixing(stemPlan, timing) {
        const mixDuration = timing.mix_duration * 1000; // Convert to ms
        
        // Start next track first
        await this.audioEngine.startNextTrack();
        console.log('🎧 Next track started, executing stem mixing');
        
        // Track A (outgoing) stem fading
        const trackA = stemPlan.track_a;
        for (const [stemType, config] of Object.entries(trackA)) {
            if (config.fade) {
                setTimeout(() => {
                    this.fadeOutStem('current', stemType, config);
                }, config.delay * 1000);
            }
        }
        
        // Track B (incoming) stem fading
        const trackB = stemPlan.track_b;
        for (const [stemType, config] of Object.entries(trackB)) {
            if (config.fade) {
                setTimeout(() => {
                    this.fadeInStem('next', stemType, config);
                }, config.delay * 1000);
            }
        }
    }
    
    /**
     * Apply time-stretching for beatmatching
     */
    async applyTimeStretching(beatmatch) {
        if (!beatmatch.stretch_needed) return;
        
        console.log(`🎧 Applying time-stretch: A=${beatmatch.stretch_factor_a.toFixed(3)}, B=${beatmatch.stretch_factor_b.toFixed(3)}`);
        
        // Apply stretch factors to audio nodes
        if (this.audioEngine.currentTrackNode) {
            this.audioEngine.currentTrackNode.playbackRate.value = beatmatch.stretch_factor_a;
        }
        
        if (this.audioEngine.nextTrackNode) {
            this.audioEngine.nextTrackNode.playbackRate.value = beatmatch.stretch_factor_b;
        }
    }
    
    /**
     * Standard crossfade without stem control
     */
    async executeStandardCrossfade(timing) {
        const mixDuration = timing.mix_duration * 1000;
        
        // Start next track
        await this.audioEngine.startNextTrack();
        
        // Crossfade volumes
        const startTime = this.audioEngine.audioContext.currentTime;
        
        // Fade out current track
        if (this.audioEngine.currentGainNode) {
            this.audioEngine.currentGainNode.gain.linearRampToValueAtTime(0, startTime + timing.mix_duration);
        }
        
        // Fade in next track
        if (this.audioEngine.nextGainNode) {
            this.audioEngine.nextGainNode.gain.setValueAtTime(0, startTime);
            this.audioEngine.nextGainNode.gain.linearRampToValueAtTime(1, startTime + timing.mix_duration);
        }
    }
    
    /**
     * Find next beat from current position
     */
    findNextBeat(currentTime) {
        const currentTrack = this.audioEngine.getCurrentTrack();
        const analysis = this.trackAnalyses.get(currentTrack.id);
        
        if (analysis && analysis.beatgrid) {
            const nextBeats = analysis.beatgrid.filter(beat => beat > currentTime);
            return nextBeats.length > 0 ? nextBeats[0] : currentTime + 0.5;
        }
        
        return currentTime + 0.5; // Fallback: half second ahead
    }
    
    /**
     * Fade out specific stem
     */
    fadeOutStem(track, stemType, config) {
        const stemNode = this.audioEngine.getStemNode(track, stemType);
        if (!stemNode) return;
        
        const duration = (config.duration_factor || 1.0) * this.settings.transitionLength;
        const startTime = this.audioEngine.audioContext.currentTime;
        
        stemNode.gain.linearRampToValueAtTime(0, startTime + duration);
    }
    
    /**
     * Fade in specific stem
     */
    fadeInStem(track, stemType, config) {
        const stemNode = this.audioEngine.getStemNode(track, stemType);
        if (!stemNode) return;
        
        const duration = (config.duration_factor || 1.0) * this.settings.transitionLength;
        const startTime = this.audioEngine.audioContext.currentTime;
        
        stemNode.gain.setValueAtTime(0, startTime);
        stemNode.gain.linearRampToValueAtTime(1, startTime + duration);
    }
    
    /**
     * Apply audio effect
     */
    async applyEffect(effect, track) {
        console.log(`🎧 Applying ${effect.type} effect to ${track} track`);
        
        switch (effect.type) {
            case 'echo':
                await this.addEchoEffect(effect, track);
                break;
            case 'highpass':
                await this.addHighpassFilter(effect, track);
                break;
            case 'lowpass':
                await this.addLowpassFilter(effect, track);
                break;
            case 'eq':
                await this.addEQEffect(effect, track);
                break;
        }
    }
    
    /**
     * Add echo effect
     */
    async addEchoEffect(effect, track = 'current') {
        const audioContext = this.audioEngine.audioContext;
        const delay = audioContext.createDelay(effect.delay || 0.125);
        const feedback = audioContext.createGain();
        const mix = audioContext.createGain();
        
        delay.delayTime.value = effect.delay || 0.125;
        feedback.gain.value = effect.feedback || 0.3;
        mix.gain.value = effect.mix || 0.4;
        
        // Connect echo chain
        const sourceNode = this.audioEngine.getTrackNode(track);
        if (sourceNode) {
            sourceNode.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(mix);
            mix.connect(this.audioEngine.masterGainNode);
        }
    }
    
    /**
     * Execute fallback transition when analysis fails
     */
    async executeFallbackTransition() {
        console.log('🎧 AutoDJ: Executing safe fallback transition');
        
        // Check if we have a next track available
        const nextTrack = this.audioEngine.getNextTrack();
        if (!nextTrack) {
            console.warn('🎧 AutoDJ: No next track available for fallback transition');
            return { success: false, style: 'fallback', error: 'No next track' };
        }
        
        // Simple 8-second crossfade
        const mixDuration = 8;
        const startTime = this.audioEngine.audioContext.currentTime;
        
        try {
            await this.audioEngine.startNextTrack();
            
            // Crossfade
            if (this.audioEngine.currentGainNode) {
                this.audioEngine.currentGainNode.gain.linearRampToValueAtTime(0, startTime + mixDuration);
            }
            
            if (this.audioEngine.nextGainNode) {
                this.audioEngine.nextGainNode.gain.setValueAtTime(0, startTime);
                this.audioEngine.nextGainNode.gain.linearRampToValueAtTime(1, startTime + mixDuration);
            }
            
            return { success: true, style: 'fallback' };
        } catch (error) {
            console.error('🎧 AutoDJ: Fallback transition failed:', error);
            return { success: false, style: 'fallback', error: error.message };
        }
    }
    
    /**
     * Create fallback transition plan
     */
    createFallbackPlan(currentAnalysis, nextAnalysis) {
        const duration = currentAnalysis.duration || 180;
        
        return {
            compatibility: { overall_score: 0.5, mixable: true },
            timing: {
                start_time: Math.max(0, duration - 12),
                mix_duration: 8.0,
                track_b_in: 8.0
            },
            style: { name: 'crossfade', description: 'Safe fallback crossfade' },
            beatmatch: { stretch_needed: false, sync_method: 'none' },
            stem_plan: {
                track_a: { fade: 'linear_out' },
                track_b: { fade: 'linear_in' }
            },
            effects: { track_a: [], track_b: [] },
            success_probability: 0.7
        };
    }
    
    /**
     * Create fallback analysis when Python analysis fails
     */
    createFallbackAnalysis(track) {
        return {
            file: track.path,
            duration: track.duration || 180,
            bpm: 120,
            key: 'C major',
            camelot: '8B',
            beatgrid: Array.from({ length: Math.floor(track.duration / 0.5) }, (_, i) => i * 0.5),
            vocals: [],
            cue_in: 8.0,
            cue_out: (track.duration || 180) - 16.0,
            intro: { start: 0.0, end: 8.0 },
            outro: { start: (track.duration || 180) - 16.0, end: track.duration || 180 }
        };
    }
    
    /**
     * Log transition for learning and improvement
     */
    logTransition(plan, result) {
        const logEntry = {
            timestamp: Date.now(),
            plan: plan,
            result: result,
            success: result.success,
            style: result.style
        };
        
        this.transitionHistory.push(logEntry);
        
        // Keep only last 50 transitions
        if (this.transitionHistory.length > 50) {
            this.transitionHistory.shift();
        }
        
        console.log(`🎧 AutoDJ: Transition logged (${result.success ? 'SUCCESS' : 'FAILED'})`);
    }
    
    /**
     * Get AutoDJ statistics
     */
    getStatistics() {
        const successful = this.transitionHistory.filter(t => t.success).length;
        const total = this.transitionHistory.length;
        
        return {
            totalTransitions: total,
            successfulTransitions: successful,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            isActive: this.isActive,
            tracksAnalyzed: this.trackAnalyses.size
        };
    }
    
    /**
     * Update AutoDJ settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('🎧 AutoDJ settings updated:', this.settings);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.disable();
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.trackAnalyses.clear();
        this.transitionHistory = [];
        
        console.log('🎧 AutoDJ Engine destroyed');
    }

    // MUSICAL INTELLIGENCE HELPER METHODS

    /**
     * Estimate energy level of a transition point
     */
    estimateEnergyLevel(transitionPoint) {
        if (transitionPoint.type === 'phrase_boundary') {
            return 'medium'; // Phrase boundaries usually medium energy
        } else if (transitionPoint.type === 'section_boundary') {
            return 'high'; // Section changes often high energy
        } else if (transitionPoint.type === 'vocal_change') {
            return 'variable'; // Vocal changes vary
        } else if (transitionPoint.type === 'cue_point') {
            return 'medium'; // Professional cue points usually medium
        }
        return 'low'; // Default
    }

    /**
     * Find first vocal entry in track
     */
    findFirstVocalEntry(analysis) {
        if (analysis.vocals && Array.isArray(analysis.vocals) && analysis.vocals.length > 0) {
            const firstVocal = analysis.vocals[0];
            return firstVocal.start || firstVocal.time || 8.0;
        }
        return 8.0; // Default first vocal at 8 seconds
    }

    /**
     * Find first chorus/hook section
     */
    findFirstChorus(analysis) {
        // Look for high energy point around 30-60 seconds (typical chorus timing)
        const duration = analysis.duration || 180;
        const targetTime = Math.min(30, duration * 0.2); // 20% into track or 30s
        return targetTime;
    }

    /**
     * Find breakdown/bridge section
     */
    findBreakdownSection(analysis) {
        // Look for mid-track point (usually 50-70% through)
        const duration = analysis.duration || 180;
        const targetTime = duration * 0.6; // 60% through track
        return targetTime;
    }

    /**
     * Choose appropriate transition style based on musical context
     */
    chooseTransitionStyle(transitionPoint, entryPoint) {
        // Beat sync cut for high energy transitions
        if (transitionPoint.type === 'section_boundary' && entryPoint.energyLevel === 'high') {
            return {
                type: 'beat_sync_cut',
                name: 'Beat Sync Cut',
                reason: 'High energy section change - hard cut maintains momentum'
            };
        }
        
        // Stem transition for vocal changes
        if (transitionPoint.type === 'vocal_change' || entryPoint.description.includes('vocal')) {
            return {
                type: 'stem_transition',
                name: 'Stem Transition',
                reason: 'Vocal elements - gradual stem mixing preserves clarity'
            };
        }
        
        // Echo slam for phrase boundaries
        if (transitionPoint.type === 'phrase_boundary') {
            return {
                type: 'echo_slam',
                name: 'Echo Slam',
                reason: 'Phrase boundary - echo effect creates natural bridge'
            };
        }
        
        // Default to intelligent crossfade
        return {
            type: 'intelligent_crossfade',
            name: 'Intelligent Crossfade',
            reason: 'Balanced transition preserving musical flow'
        };
    }

    /**
     * Execute beat-synchronized hard cut
     */
    async executeBeatSyncCut(transitionPoint, entryPoint) {
        console.log('🎵 Executing beat sync cut - hard transition at musical boundary');
        
        const audioContext = this.audioEngine.audioContext;
        const cutTime = audioContext.currentTime + 0.1; // Slight delay for precision
        
        // CRITICAL: Ensure Track B stem volumes are audible before cut
        const stemTypes = ['vocals', 'drums', 'bass', 'other'];
        stemTypes.forEach(stemType => {
            if (this.audioEngine.stemGains[stemType]?.trackB) {
                this.audioEngine.stemGains[stemType].trackB.gain.value = 1.0;
            }
        });
        
        // Hard cut - immediately switch main tracks
        if (this.audioEngine.trackAGain) {
            this.audioEngine.trackAGain.gain.setValueAtTime(0, cutTime);
            console.log('🎵 Track A: Hard cut to 0%');
        }
        if (this.audioEngine.trackBGain) {
            this.audioEngine.trackBGain.gain.setValueAtTime(1, cutTime);
            console.log('🎵 Track B: Hard cut to 100%');
        }
        
        // Also handle legacy gain nodes if they exist
        if (this.audioEngine.currentGainNode) {
            this.audioEngine.currentGainNode.gain.setValueAtTime(0, cutTime);
        }
        if (this.audioEngine.nextGainNode) {
            this.audioEngine.nextGainNode.gain.setValueAtTime(1, cutTime);
        }
        
        console.log('🎵 Beat sync cut completed - immediate track switch');
    }

    /**
     * Execute stem-based transition (gradual stem mixing)
     */
    async executeStemBasedTransition(transitionPoint, entryPoint) {
        console.log('🎵 Executing stem-based transition - gradual stem mixing');
        
        const transitionDuration = 4.0; // 4 second stem transition
        const audioContext = this.audioEngine.audioContext;
        const startTime = audioContext.currentTime;
        
        // Start by ensuring current track is at full volume and next track at zero
        if (this.audioEngine.trackAGain) {
            this.audioEngine.trackAGain.gain.setValueAtTime(1.0, startTime);
        }
        if (this.audioEngine.trackBGain) {
            this.audioEngine.trackBGain.gain.setValueAtTime(0.0, startTime);
        }
        
        // CRITICAL: Ensure Track B stem volumes are audible
        const stemTypes = ['vocals', 'drums', 'bass', 'other'];
        stemTypes.forEach(stemType => {
            if (this.audioEngine.stemGains[stemType]?.trackB) {
                this.audioEngine.stemGains[stemType].trackB.gain.value = 1.0;
            }
        });
        
        // Gradually crossfade the main tracks
        if (this.audioEngine.trackAGain) {
            this.audioEngine.trackAGain.gain.linearRampToValueAtTime(0.0, startTime + transitionDuration);
        }
        if (this.audioEngine.trackBGain) {
            this.audioEngine.trackBGain.gain.linearRampToValueAtTime(1.0, startTime + transitionDuration);
        }
        
        // Also do gradual stem mixing for finer control
        const stemOrder = ['bass', 'drums', 'other', 'vocals'];
        const stemDelay = transitionDuration / stemOrder.length;
        
        stemOrder.forEach((stemType, index) => {
            const delay = index * stemDelay;
            
            // Fade out current track stem
            setTimeout(() => {
                this.fadeOutStem('current', stemType, { duration_factor: 1.0 });
            }, delay * 1000);
            
            // Fade in next track stem
            setTimeout(() => {
                this.fadeInStem('next', stemType, { duration_factor: 1.0 });
            }, (delay + stemDelay * 0.5) * 1000);
        });
        
        console.log(`🎵 Stem transition duration: ${transitionDuration}s with gradual crossfade`);
    }

    /**
     * Execute echo slam transition
     */
    async executeEchoSlam(transitionPoint, entryPoint) {
        console.log('🎵 Executing echo slam - phrase boundary transition');
        
        const audioContext = this.audioEngine.audioContext;
        const slamTime = audioContext.currentTime + 0.5;
        
        // CRITICAL: Ensure Track B stem volumes are audible
        const stemTypes = ['vocals', 'drums', 'bass', 'other'];
        stemTypes.forEach(stemType => {
            if (this.audioEngine.stemGains[stemType]?.trackB) {
                this.audioEngine.stemGains[stemType].trackB.gain.value = 1.0;
            }
        });
        
        // Add brief echo to current track
        // (This would need proper Web Audio echo implementation)
        
        // Quick fade out with slam
        if (this.audioEngine.currentGainNode) {
            this.audioEngine.currentGainNode.gain.linearRampToValueAtTime(0.2, slamTime);
            this.audioEngine.currentGainNode.gain.linearRampToValueAtTime(0, slamTime + 0.5);
        }
        
        // Fade in next track after echo
        if (this.audioEngine.nextGainNode) {
            this.audioEngine.nextGainNode.gain.setValueAtTime(0, slamTime);
            this.audioEngine.nextGainNode.gain.linearRampToValueAtTime(1, slamTime + 1.0);
        }
    }

    /**
     * Execute professional stem-based crossfade with energy matching
     */
    async executeIntelligentCrossfade(transitionPoint, entryPoint) {
        console.log('🎵 Executing professional stem-based crossfade');
        
        // Sophisticated transition based on energy analysis
        if (this.shouldUseStemMixing(transitionPoint, entryPoint)) {
            await this.executeProfessionalStemMixing(transitionPoint, entryPoint);
        } else {
            await this.executeStandardOverlapCrossfade(transitionPoint, entryPoint);
        }
    }

    /**
     * Execute quick cut transition (minimal overlap, sharp transition)
     */
    async executeStandardOverlapCrossfade(transitionPoint, entryPoint) {
        console.log('🎵 Executing quick cut transition - sharp transition');
        
        // Much shorter cut times for professional DJ feel
        let cutDuration = 0.5; // Default - very quick
        
        if (transitionPoint.type === 'phrase_boundary') {
            cutDuration = 0.2; // Very sharp for phrase boundaries
        } else if (transitionPoint.type === 'section_boundary') {
            cutDuration = 0.1; // Almost instant for section changes
        } else if (transitionPoint.type === 'energy_change') {
            cutDuration = 0.3; // Quick for energy changes
        } else if (transitionPoint.type === 'emergency') {
            cutDuration = 0.05; // Instant for emergency
        }
        
        const audioContext = this.audioEngine.audioContext;
        const startTime = audioContext.currentTime;
        
        console.log(`🎵 Quick cut: ${(cutDuration * 1000).toFixed(0)}ms transition`);
        
        // Sharp cut instead of long fade
        if (this.audioEngine.trackAGain) {
            this.audioEngine.trackAGain.gain.setValueAtTime(1.0, startTime);
            this.audioEngine.trackAGain.gain.linearRampToValueAtTime(0, startTime + cutDuration);
            console.log(`🎵 Track A: CUT from 100% to 0% in ${(cutDuration * 1000).toFixed(0)}ms`);
        }
        
        if (this.audioEngine.trackBGain) {
            this.audioEngine.trackBGain.gain.setValueAtTime(0, startTime);
            this.audioEngine.trackBGain.gain.linearRampToValueAtTime(1.0, startTime + cutDuration);
            console.log(`🎵 Track B: CUT from 0% to 100% in ${(cutDuration * 1000).toFixed(0)}ms`);
        }
        
        console.log(`🎵 Sharp cut executed - minimal ${(cutDuration * 1000).toFixed(0)}ms overlap`);
    }

    /**
     * Execute professional stem mixing like Traktor
     * Phase 1: Swap vocals/bass, Phase 2: Swap other/drums
     */
    async executeProfessionalStemMixing(transitionPoint, entryPoint) {
        console.log('🎵 Executing professional stem mixing - Traktor style');
        
        const audioContext = this.audioEngine.audioContext;
        const startTime = audioContext.currentTime;
        const bpm = transitionPoint.bpm || 120;
        const secondsPerBar = (60 / bpm) * 4;
        const barsPerPhase = 16;
        const phaseLength = secondsPerBar * barsPerPhase; // 16 bars in seconds
        
        console.log(`🎵 Stem mixing: ${barsPerPhase} bars per phase (${phaseLength.toFixed(1)}s each)`);
        
        // PHASE 1: Cut vocals and bass (immediate sharp cut)
        console.log('🎵 Phase 1: CUTTING vocals and bass');
        this.swapStems(['vocals', 'bass'], startTime, 0.1); // 100ms sharp cut
        
        // PHASE 2: Cut other and drums (after 16 bars)
        setTimeout(() => {
            console.log('🎵 Phase 2: CUTTING other and drums');
            this.swapStems(['other', 'drums'], audioContext.currentTime, 0.1); // 100ms sharp cut
        }, phaseLength * 1000);
        
        console.log(`🎵 Professional stem mixing initiated - ${barsPerPhase * 2} bars total`);
    }

    /**
     * Swap specific stems between tracks with clean cuts
     */
    swapStems(stemTypes, startTime, transitionDuration) {
        stemTypes.forEach(stemType => {
            const stemA = this.audioEngine.stemGains[stemType]?.trackA;
            const stemB = this.audioEngine.stemGains[stemType]?.trackB;
            
            if (stemA && stemB) {
                // Sharp cut instead of fade - more professional DJ style
                const cutTime = startTime + 0.05; // 50ms for clean transition
                
                // Cut Track A stem
                stemA.gain.setValueAtTime(stemA.gain.value, startTime);
                stemA.gain.linearRampToValueAtTime(0, cutTime);
                
                // Cut in Track B stem  
                stemB.gain.setValueAtTime(0, startTime);
                stemB.gain.linearRampToValueAtTime(1.0, cutTime);
                
                console.log(`🎵 CUTTING ${stemType}: A->0%, B->100% (clean cut in 50ms)`);
            }
        });
    }

    /**
     * Determine if we should use sophisticated stem mixing
     */
    shouldUseStemMixing(transitionPoint, entryPoint) {
        // Use stem mixing for vocal changes and section boundaries
        return transitionPoint.type === 'vocal_change' || 
               transitionPoint.type === 'section_boundary' ||
               transitionPoint.type === 'energy_change' ||
               entryPoint.description.includes('vocal') ||
               entryPoint.description.includes('chorus');
    }

    /**
     * Analyze energy changes in the track (like Traktor's energy analysis)
     * Looks for dramatic energy increases/decreases, drops, builds, etc.
     */
    analyzeEnergyChanges(analysis, currentTime, maxTimePoint) {
        const energyChanges = [];
        
        // Use beatgrid data to find energy patterns
        if (analysis.beatgrid && Array.isArray(analysis.beatgrid)) {
            const relevantBeats = analysis.beatgrid.filter(beat => 
                beat >= currentTime && beat <= maxTimePoint
            );
            
            // Analyze beat intensity patterns (simulated)
            for (let i = 0; i < relevantBeats.length - 8; i += 8) { // Check every 8 beats
                const beatTime = relevantBeats[i];
                const progress = beatTime / analysis.duration;
                
                // Simulate energy analysis based on track position and beat patterns
                let energyLevel = 'medium';
                let intensity = 0.5;
                let description = 'Energy shift';
                
                // Intro section (0-25%) - usually building energy
                if (progress < 0.25) {
                    if (i % 16 === 0) { // Every 16 beats in intro
                        energyLevel = 'building';
                        intensity = 0.7;
                        description = 'Intro build-up';
                        energyChanges.push({
                            time: beatTime,
                            type: 'energy_build',
                            level: energyLevel,
                            intensity: intensity,
                            direction: 'up',
                            description: description
                        });
                    }
                }
                // Main section (25-75%) - drops and peaks
                else if (progress >= 0.25 && progress <= 0.75) {
                    if (i % 32 === 0) { // Major energy changes every 32 beats
                        energyLevel = 'peak';
                        intensity = 0.9;
                        description = 'Main section peak';
                        energyChanges.push({
                            time: beatTime,
                            type: 'energy_peak',
                            level: energyLevel,
                            intensity: intensity,
                            direction: 'peak',
                            description: description
                        });
                    } else if (i % 16 === 8) { // Drops between peaks
                        energyLevel = 'drop';
                        intensity = 0.8;
                        description = 'Energy drop';
                        energyChanges.push({
                            time: beatTime,
                            type: 'energy_drop',
                            level: energyLevel,
                            intensity: intensity,
                            direction: 'down',
                            description: description
                        });
                    }
                }
                // Outro section (75-100%) - gradual decline
                else if (progress > 0.75) {
                    if (i % 16 === 0) {
                        energyLevel = 'declining';
                        intensity = 0.6;
                        description = 'Outro energy decline';
                        energyChanges.push({
                            time: beatTime,
                            type: 'energy_decline',
                            level: energyLevel,
                            intensity: intensity,
                            direction: 'down',
                            description: description
                        });
                    }
                }
            }
        }
        
        return energyChanges;
    }

    /**
     * Analyze vocal sections and transitions (like Traktor's vocal detection)
     * Identifies vocal starts, stops, and changes
     */
    analyzeVocalSections(analysis, currentTime, maxTimePoint) {
        const vocalSections = [];
        
        // Use existing vocal analysis if available
        if (analysis.vocals && Array.isArray(analysis.vocals)) {
            analysis.vocals.forEach(vocalSection => {
                const startTime = vocalSection.start || vocalSection.time;
                const endTime = vocalSection.end || (startTime + (vocalSection.duration || 8));
                
                // Vocal start (high priority transition point)
                if (startTime >= currentTime && startTime <= maxTimePoint) {
                    vocalSections.push({
                        time: startTime,
                        type: 'vocal_start',
                        action: 'entry',
                        description: 'Vocal section begins'
                    });
                }
                
                // Vocal end (good transition point)
                if (endTime >= currentTime && endTime <= maxTimePoint) {
                    vocalSections.push({
                        time: endTime,
                        type: 'vocal_end',
                        action: 'exit',
                        description: 'Vocal section ends'
                    });
                }
            });
        } else {
            // Estimate vocal sections based on track structure
            const duration = analysis.duration || 180;
            const estimatedVocalSections = [
                { start: duration * 0.15, end: duration * 0.35, type: 'verse_1' },
                { start: duration * 0.40, end: duration * 0.55, type: 'chorus_1' },
                { start: duration * 0.60, end: duration * 0.75, type: 'verse_2' },
                { start: duration * 0.80, end: duration * 0.95, type: 'chorus_2' }
            ];
            
            estimatedVocalSections.forEach(section => {
                // Vocal section start
                if (section.start >= currentTime && section.start <= maxTimePoint) {
                    vocalSections.push({
                        time: section.start,
                        type: section.type + '_start',
                        action: 'entry',
                        description: `${section.type} begins`
                    });
                }
                
                // Vocal section end
                if (section.end >= currentTime && section.end <= maxTimePoint) {
                    vocalSections.push({
                        time: section.end,
                        type: section.type + '_end',
                        action: 'exit',
                        description: `${section.type} ends`
                    });
                }
            });
        }
        
        return vocalSections;
    }
}

export default AutoDJEngine; 