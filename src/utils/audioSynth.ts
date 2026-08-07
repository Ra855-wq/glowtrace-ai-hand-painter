// Polyphonic Futuristic Web Audio Synthesizer for Hand Gesture Interactions

const PENTATONIC_C = [
  130.81, // C3
  146.83, // D3
  164.81, // E3
  196.00, // G3
  220.00, // A3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
];

class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Continuous Theremin-like Synth nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private panner: StereoPannerNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Quantizes a normalized vertical screen coordinate (0 top to 1 bottom) to a pentatonic musical note.
   */
  private getNoteFromY(normY: number): number {
    const clampedY = Math.max(0, Math.min(1, normY));
    // Invert Y so top of screen = high pitch, bottom = low pitch
    const idx = Math.floor((1 - clampedY) * (PENTATONIC_C.length - 1));
    return PENTATONIC_C[idx];
  }

  /**
   * Continuous Laser String Web Theremin Synthesizer
   * Modulates dual oscillators and filter based on hand positions and inter-hand distance.
   */
  public updateContinuousSynth(
    active: boolean,
    hand1Pos: { x: number; y: number } | null,
    hand2Pos: { x: number; y: number } | null,
    volume: number = 0.5
  ) {
    if (this.isMuted || !active || (!hand1Pos && !hand2Pos)) {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }

    this.init();
    if (!this.ctx) return;

    try {
      // Lazy init continuous synth node graph
      if (!this.osc1) {
        this.osc1 = this.ctx.createOscillator();
        this.osc2 = this.ctx.createOscillator();
        this.subOsc = this.ctx.createOscillator();
        this.filter = this.ctx.createBiquadFilter();
        this.masterGain = this.ctx.createGain();

        // Stereo panner fallback
        if (typeof this.ctx.createStereoPanner === 'function') {
          this.panner = this.ctx.createStereoPanner();
        }

        this.osc1.type = 'sine';
        this.osc2.type = 'triangle';
        this.subOsc.type = 'sine';

        this.filter.type = 'lowpass';
        this.filter.Q.value = 4.0; // Resonant synth feel

        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.osc1.connect(this.filter);
        this.osc2.connect(this.filter);
        this.subOsc.connect(this.filter);

        if (this.panner) {
          this.filter.connect(this.panner);
          this.panner.connect(this.masterGain);
        } else {
          this.filter.connect(this.masterGain);
        }

        this.masterGain.connect(this.ctx.destination);

        this.osc1.start();
        this.osc2.start();
        this.subOsc.start();
      }

      // Calculate primary note from Hand 1 Y
      const h1 = hand1Pos || hand2Pos!;
      const freq1 = this.getNoteFromY(h1.y);

      // Calculate harmony note from Hand 2 Y (or perfect 5th above hand 1)
      let freq2 = freq1 * 1.5; // Perfect fifth
      if (hand2Pos) {
        freq2 = this.getNoteFromY(hand2Pos.y);
      }

      // Smoothly slide pitch (glide / portamento)
      this.osc1.frequency.setTargetAtTime(freq1, this.ctx.currentTime, 0.05);
      this.osc2.frequency.setTargetAtTime(freq2, this.ctx.currentTime, 0.05);
      this.subOsc.frequency.setTargetAtTime(freq1 * 0.5, this.ctx.currentTime, 0.05); // Sub octave bass

      // X position controls filter cutoff (brightness) and stereo pan
      const avgX = hand2Pos ? (h1.x + hand2Pos.x) / 2 : h1.x;
      const cutoff = 400 + avgX * 2800; // 400Hz to 3200Hz
      this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.06);

      if (this.panner) {
        const panValue = (avgX - 0.5) * 1.6; // -0.8 to +0.8
        this.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, panValue)), this.ctx.currentTime, 0.06);
      }

      // Inter-hand distance boosts gain & filter resonance
      let targetGain = Math.max(0, Math.min(0.25, volume * 0.2));
      if (hand1Pos && hand2Pos) {
        const dist = Math.hypot(hand2Pos.x - hand1Pos.x, hand2Pos.y - hand1Pos.y);
        targetGain *= 0.7 + dist * 0.8;
      }

      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Plays a melodic bell / chime sound when a pinch gesture is made.
   */
  public playPinchSound(handedness: 'Left' | 'Right', normY: number = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const baseFreq = this.getNoteFromY(normY);
      const freq = handedness === 'Left' ? baseFreq : baseFreq * 1.25; // Major third offset for right hand

      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      oscHarmonic.type = 'triangle';

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      oscHarmonic.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      oscHarmonic.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      oscHarmonic.start();
      osc.stop(this.ctx.currentTime + 0.25);
      oscHarmonic.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Fallback
    }
  }

  /**
   * Sound effect when grabbing or snapping a neon square.
   */
  public playSquareSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Fallback
    }
  }

  /**
   * Dynamic pitch glide when stretching or scaling squares with two hands.
   */
  public playSquareStretchTone(scaleFactor: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const freq = Math.max(150, Math.min(1200, 300 * scaleFactor));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Fallback
    }
  }

  public destroy() {
    if (this.osc1) {
      try {
        this.osc1.stop();
        this.osc2?.stop();
        this.subOsc?.stop();
      } catch {
        // Silent
      }
      this.osc1 = null;
      this.osc2 = null;
      this.subOsc = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioSynth = new AudioSynth();
