/**
 * AsteroidsAudio - WebAudio-based synthesized sound engine
 * All sounds are generated at runtime using the Web Audio API
 * Aesthetic: "retro arcade upgraded" - original analog character but cleaner and punchier
 */

// Tweakable sound parameters - modify these in browser console via window.audio.params
export const SoundParams = {
  shoot: {
    startFreq: 880,
    endFreq: 220,
    sweepTime: 0.08,
    decay: 0.1,
    volume: 0.3,
    distortion: 20,
  },
  thrust: {
    oscFreq: 60,
    oscType: 'sine' as OscillatorType,
    noiseHighpass: 500,
    volume: 0.25,
    fadeTime: 0.25,
  },
  hit: {
    large: { filterFreq: 200, decay: 0.4, thumpFreq: 70, volume: 0.5 },
    medium: { filterFreq: 350, decay: 0.25, thumpFreq: 60, volume: 0.5 },
    small: { filterFreq: 500, decay: 0.15, volume: 0.5 },
    alien: { filterFreq: 300, decay: 0.3, whoopStart: 600, whoopEnd: 100, volume: 0.5 },
  },
  alienEngine: {
    osc1Freq: 120,
    osc2Freq: 126,
    lfoFreq: 0.5,
    lfoDepth: 10,
    filterFreq: 400,
    volume: 0.15,
  },
  backbeat: {
    freq1: 55,
    freq2: 46.25,
    holdTime: 0.08,
    decayTime: 0.05,
    volume: 0.4,
    filterFreq: 100,
  },
}

export class AsteroidsAudio {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private masterVolume: number = 0.5

  // Expose params for console tweaking
  public params = SoundParams

  // Alien engine state
  private alienEngineOsc1: OscillatorNode | null = null
  private alienEngineOsc2: OscillatorNode | null = null
  private alienEngineLfo: OscillatorNode | null = null
  private alienEngineGain: GainNode | null = null

  // Backbeat state
  private backbeatInterval: ReturnType<typeof setInterval> | null = null
  private backbeatGain: GainNode | null = null
  private currentBpm: number = 60
  private targetBpm: number = 60
  private backbeatBeat: number = 0
  private backbeatActive: boolean = false

  // Noise buffer for explosions (created once and reused)
  private noiseBuffer: AudioBuffer | null = null

  constructor() {
    // AudioContext will be created on first user interaction
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  private ensureContext(): boolean {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        this.masterGain = this.audioContext.createGain()
        this.masterGain.gain.value = this.masterVolume
        this.masterGain.connect(this.audioContext.destination)
        this.createNoiseBuffer()
      } catch (e) {
        console.warn('Web Audio API not supported:', e)
        return false
      }
    }

    // Resume context if it was suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    return true
  }

  /**
   * Create a reusable noise buffer for explosion sounds
   */
  private createNoiseBuffer(): void {
    if (!this.audioContext) return

    const bufferSize = this.audioContext.sampleRate * 2 // 2 seconds of noise
    this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = this.noiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
  }

  /**
   * Set the master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume
    }
  }

  /**
   * Get the current master volume
   */
  getVolume(): number {
    return this.masterVolume
  }

  // ========================================
  // SOUND: Shoot
  // ========================================

  /**
   * Sharp, snappy laser zap
   * Square wave with rapid pitch sweep down
   */
  playShoot(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const p = this.params.shoot
    const now = this.audioContext.currentTime

    // Create oscillator
    const osc = this.audioContext.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(p.startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(p.endFreq, now + p.sweepTime)

    // Create gain envelope
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(p.volume, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    // Add subtle distortion for grit
    const waveshaper = this.audioContext.createWaveShaper()
    waveshaper.curve = this.makeDistortionCurve(p.distortion)
    waveshaper.oversample = '2x'

    // Connect: osc -> waveshaper -> gain -> master
    osc.connect(waveshaper)
    waveshaper.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + p.decay)
  }

  /**
   * Create a distortion curve for waveshaper
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve
  }

  // ========================================
  // SOUND: Hit (Explosions)
  // ========================================

  /**
   * Chunky explosion with pitch/duration varying by target size
   */
  playHit(size: 'large' | 'medium' | 'small' | 'alien'): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain || !this.noiseBuffer) return

    const now = this.audioContext.currentTime

    // Size-specific parameters
    const params = {
      large: { filterFreq: 200, decay: 0.4, thump: true, thumpFreq: 70 },
      medium: { filterFreq: 350, decay: 0.25, thump: true, thumpFreq: 60 },
      small: { filterFreq: 500, decay: 0.15, thump: false, thumpFreq: 0 },
      alien: { filterFreq: 300, decay: 0.3, thump: false, thumpFreq: 0, whoop: true }
    }

    const p = params[size]

    // Create noise source
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = this.noiseBuffer

    // Bandpass filter
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = p.filterFreq
    filter.Q.value = 1.5

    // Gain envelope
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    // Connect noise chain
    noiseSource.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain)

    noiseSource.start(now)
    noiseSource.stop(now + p.decay)

    // Add low-frequency thump for large/medium explosions
    if (p.thump) {
      const thumpOsc = this.audioContext.createOscillator()
      thumpOsc.type = 'sine'
      thumpOsc.frequency.value = p.thumpFreq

      const thumpGain = this.audioContext.createGain()
      thumpGain.gain.setValueAtTime(0.6, now)
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      thumpOsc.connect(thumpGain)
      thumpGain.connect(this.masterGain)

      thumpOsc.start(now)
      thumpOsc.stop(now + 0.05)
    }

    // Add descending "whoop" for alien destruction
    if (size === 'alien') {
      const whoopOsc = this.audioContext.createOscillator()
      whoopOsc.type = 'sine'
      whoopOsc.frequency.setValueAtTime(600, now)
      whoopOsc.frequency.exponentialRampToValueAtTime(100, now + 0.2)

      const whoopGain = this.audioContext.createGain()
      whoopGain.gain.setValueAtTime(0.3, now)
      whoopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

      whoopOsc.connect(whoopGain)
      whoopGain.connect(this.masterGain)

      whoopOsc.start(now)
      whoopOsc.stop(now + 0.2)
    }
  }

  // ========================================
  // SOUND: Alien Engine
  // ========================================

  /**
   * Eerie, warbling hum that loops while alien is on screen
   */
  playAlienEngine(start: boolean): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    if (start) {
      // Don't restart if already playing
      if (this.alienEngineOsc1) return

      const now = this.audioContext.currentTime

      // Create two slightly detuned oscillators for beat frequency wobble
      this.alienEngineOsc1 = this.audioContext.createOscillator()
      this.alienEngineOsc1.type = 'square'
      this.alienEngineOsc1.frequency.value = 120

      this.alienEngineOsc2 = this.audioContext.createOscillator()
      this.alienEngineOsc2.type = 'square'
      this.alienEngineOsc2.frequency.value = 126

      // Create LFO for slow pitch drift
      this.alienEngineLfo = this.audioContext.createOscillator()
      this.alienEngineLfo.type = 'sine'
      this.alienEngineLfo.frequency.value = 0.5

      const lfoGain = this.audioContext.createGain()
      lfoGain.gain.value = 10 // ±10Hz modulation

      // Connect LFO to oscillator frequencies
      this.alienEngineLfo.connect(lfoGain)
      lfoGain.connect(this.alienEngineOsc1.frequency)
      lfoGain.connect(this.alienEngineOsc2.frequency)

      // Lowpass filter to soften the sound
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400

      // Gain node for fade in/out and volume control
      this.alienEngineGain = this.audioContext.createGain()
      this.alienEngineGain.gain.setValueAtTime(0, now)
      this.alienEngineGain.gain.linearRampToValueAtTime(0.15, now + 0.1)

      // Connect oscillators -> filter -> gain -> master
      this.alienEngineOsc1.connect(filter)
      this.alienEngineOsc2.connect(filter)
      filter.connect(this.alienEngineGain)
      this.alienEngineGain.connect(this.masterGain)

      // Start all oscillators
      this.alienEngineOsc1.start(now)
      this.alienEngineOsc2.start(now)
      this.alienEngineLfo.start(now)
    } else {
      // Stop the alien engine
      if (this.alienEngineGain && this.audioContext) {
        const now = this.audioContext.currentTime
        this.alienEngineGain.gain.linearRampToValueAtTime(0, now + 0.1)

        // Schedule stop after fade out
        setTimeout(() => {
          this.alienEngineOsc1?.stop()
          this.alienEngineOsc2?.stop()
          this.alienEngineLfo?.stop()
          this.alienEngineOsc1 = null
          this.alienEngineOsc2 = null
          this.alienEngineLfo = null
          this.alienEngineGain = null
        }, 150)
      }
    }
  }

  // ========================================
  // BACKBEAT SYSTEM
  // ========================================

  /**
   * Start the minimalist two-tone bass pulse
   */
  startBackbeat(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return
    if (this.backbeatActive) return

    this.backbeatActive = true
    this.currentBpm = 60
    this.targetBpm = 60
    this.backbeatBeat = 0

    // Create persistent gain node for backbeat
    this.backbeatGain = this.audioContext.createGain()
    this.backbeatGain.gain.value = 1.0
    this.backbeatGain.connect(this.masterGain)

    // Start the beat loop
    this.scheduleNextBeat()
  }

  /**
   * Schedule the next backbeat
   */
  private scheduleNextBeat(): void {
    if (!this.backbeatActive || !this.audioContext || !this.backbeatGain) return

    // Smoothly transition to target BPM
    const bpmDiff = this.targetBpm - this.currentBpm
    if (Math.abs(bpmDiff) > 1) {
      this.currentBpm += bpmDiff * 0.1 // Smooth transition
    } else {
      this.currentBpm = this.targetBpm
    }

    // Calculate interval from BPM
    const intervalMs = (60 / this.currentBpm) * 1000

    // Play the beat
    this.playBackbeatTone()

    // Schedule next beat
    this.backbeatInterval = setTimeout(() => {
      this.scheduleNextBeat()
    }, intervalMs)
  }

  /**
   * Play a single backbeat tone
   */
  private playBackbeatTone(): void {
    if (!this.audioContext || !this.backbeatGain) return

    const now = this.audioContext.currentTime

    // Alternating frequencies: A1 (55Hz) and F#1 (~46Hz)
    const freq = this.backbeatBeat % 2 === 0 ? 55 : 46.25
    this.backbeatBeat++

    // Create oscillator
    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq

    // Lowpass filter to keep it subby
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 100

    // Gain envelope
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(0.4, now)
    gainNode.gain.setValueAtTime(0.4, now + 0.08) // Hold for 80ms
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.13) // 50ms decay tail

    // Connect: osc -> filter -> gain -> backbeat gain -> master
    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.backbeatGain)

    osc.start(now)
    osc.stop(now + 0.13)
  }

  /**
   * Set the backbeat tempo (60-180 BPM)
   */
  setBackbeatTempo(bpm: number): void {
    this.targetBpm = Math.max(60, Math.min(180, bpm))
  }

  /**
   * Helper to calculate and set BPM based on level progress
   * Formula: bpm = 60 + (1 - remainingObjects/totalObjects) * 120
   */
  escalateBackbeat(remainingObjects: number, totalObjects: number): void {
    if (totalObjects <= 0) return
    const progress = 1 - (remainingObjects / totalObjects)
    const bpm = 60 + progress * 120
    this.setBackbeatTempo(bpm)
  }

  /**
   * Stop the backbeat with fade out
   */
  stopBackbeat(): void {
    if (!this.backbeatActive) return

    this.backbeatActive = false

    if (this.backbeatInterval) {
      clearTimeout(this.backbeatInterval)
      this.backbeatInterval = null
    }

    if (this.backbeatGain && this.audioContext) {
      const now = this.audioContext.currentTime
      this.backbeatGain.gain.linearRampToValueAtTime(0, now + 0.2)

      setTimeout(() => {
        this.backbeatGain?.disconnect()
        this.backbeatGain = null
      }, 250)
    }
  }

  // ========================================
  // BONUS SOUNDS
  // ========================================

  /**
   * Rising arpeggio for extra life - major chord, 3 quick notes
   */
  playExtraLife(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime
    // C major arpeggio: C5, E5, G5
    const notes = [523.25, 659.25, 783.99]
    const noteLength = 0.1
    const gap = 0.08

    notes.forEach((freq, i) => {
      const startTime = now + i * (noteLength + gap)

      const osc = this.audioContext!.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const gainNode = this.audioContext!.createGain()
      gainNode.gain.setValueAtTime(0.3, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength)

      osc.connect(gainNode)
      gainNode.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + noteLength)
    })
  }

  /**
   * Descending minor arpeggio with noise for game over
   */
  playGameOver(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain || !this.noiseBuffer) return

    const now = this.audioContext.currentTime
    // A minor descending: A4, E4, C4
    const notes = [440, 329.63, 261.63]
    const noteLength = 0.3
    const gap = 0.15

    notes.forEach((freq, i) => {
      const startTime = now + i * (noteLength + gap)

      const osc = this.audioContext!.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq

      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const gainNode = this.audioContext!.createGain()
      gainNode.gain.setValueAtTime(0.25, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength)

      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + noteLength)
    })

    // Add noise layer underneath
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = this.noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 200

    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.15, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.masterGain)

    noiseSource.start(now)
    noiseSource.stop(now + 1.2)
  }

  /**
   * Short crisp "chunk" sound for level start / new wave
   */
  playLevelStart(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime

    // Quick dual-tone punch
    const osc1 = this.audioContext.createOscillator()
    osc1.type = 'square'
    osc1.frequency.setValueAtTime(200, now)
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.1)

    const osc2 = this.audioContext.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 80

    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(0.4, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.15)
    osc2.stop(now + 0.15)
  }

  /**
   * Play thrust sound - continuous while thrusting
   * Tweak via window.audio.params.thrust in console
   */
  private thrustOsc: OscillatorNode | null = null
  private thrustNoiseSource: AudioBufferSourceNode | null = null
  private thrustGain: GainNode | null = null
  private thrustNoiseGain: GainNode | null = null

  playThrust(start: boolean): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const p = this.params.thrust

    if (start) {
      if (this.thrustOsc) return // Already playing

      const now = this.audioContext.currentTime

      // Low rumble oscillator
      this.thrustOsc = this.audioContext.createOscillator()
      this.thrustOsc.type = p.oscType
      this.thrustOsc.frequency.value = p.oscFreq

      // Oscillator gain (separate from noise)
      const oscGain = this.audioContext.createGain()
      oscGain.gain.value = 0.7 // Relative mix of osc vs noise

      // White noise for hiss
      if (this.noiseBuffer) {
        this.thrustNoiseSource = this.audioContext.createBufferSource()
        this.thrustNoiseSource.buffer = this.noiseBuffer
        this.thrustNoiseSource.loop = true

        // Noise gain (separate control)
        this.thrustNoiseGain = this.audioContext.createGain()
        this.thrustNoiseGain.gain.value = 0.3 // Relative mix
      }

      // Highpass filter for noise
      const noiseFilter = this.audioContext.createBiquadFilter()
      noiseFilter.type = 'highpass'
      noiseFilter.frequency.value = p.noiseHighpass

      // Combined master gain for thrust
      this.thrustGain = this.audioContext.createGain()
      this.thrustGain.gain.setValueAtTime(0, now)
      this.thrustGain.gain.linearRampToValueAtTime(p.volume, now + p.fadeTime)

      // Connect oscillator path
      this.thrustOsc.connect(oscGain)
      oscGain.connect(this.thrustGain)

      // Connect noise path
      if (this.thrustNoiseSource && this.thrustNoiseGain) {
        this.thrustNoiseSource.connect(noiseFilter)
        noiseFilter.connect(this.thrustNoiseGain)
        this.thrustNoiseGain.connect(this.thrustGain)
      }

      this.thrustGain.connect(this.masterGain)

      this.thrustOsc.start(now)
      this.thrustNoiseSource?.start(now)
    } else {
      // Stop thrust sound
      if (this.thrustGain && this.audioContext) {
        const now = this.audioContext.currentTime
        this.thrustGain.gain.linearRampToValueAtTime(0, now + p.fadeTime)

        setTimeout(() => {
          this.thrustOsc?.stop()
          this.thrustNoiseSource?.stop()
          this.thrustOsc = null
          this.thrustNoiseSource = null
          this.thrustGain = null
          this.thrustNoiseGain = null
        }, p.fadeTime * 1000 + 50)
      }
    }
  }

  /**
   * Test thrust sound with current params (for console debugging)
   * Usage: window.audio.testThrust(1000) - plays for 1 second
   */
  testThrust(durationMs: number = 500): void {
    this.playThrust(true)
    setTimeout(() => this.playThrust(false), durationMs)
  }

  // ========================================
  // CLEANUP
  // ========================================

  /**
   * Clean up all audio resources
   */
  cleanup(): void {
    this.stopBackbeat()
    this.playAlienEngine(false)
    this.playThrust(false)

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.masterGain = null
    this.noiseBuffer = null
  }
}
