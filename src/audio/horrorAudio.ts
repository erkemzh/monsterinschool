/**
 * Procedural Web Audio API Horror Sound Engine
 * Generates dynamic, spine-chilling horror soundscapes in real-time.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private noiseNode: AudioNode | null = null;
  private humGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private isInitialized = false;
  private isMuted = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientDrone();
      this.startFluorescentHum();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    // Deep sub-bass horror drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(48, this.ctx.currentTime); // ~G1

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(51.5, this.ctx.currentTime); // Beating detune

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.droneFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Subtle LFO modulation for breathing darkness
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);
    lfo.start();
  }

  private startFluorescentHum() {
    if (!this.ctx || !this.masterGain) return;

    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(100, this.ctx.currentTime); // 50/100 Hz mains hum

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'bandpass';
    humFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
    humFilter.Q.setValueAtTime(8, this.ctx.currentTime);

    humOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain);
    humOsc.start();
  }

  public updateSanityAndTension(sanity: number, isHunt: boolean, ghostDistance: number) {
    if (!this.ctx || !this.droneFilter || !this.ambientGain) return;

    const t = this.ctx.currentTime;
    const terror = Math.max(0, Math.min(1, 1 - ghostDistance / 30));

    if (isHunt) {
      this.droneFilter.frequency.setTargetAtTime(350, t, 0.5);
      this.ambientGain.gain.setTargetAtTime(0.65, t, 0.3);
    } else {
      const baseFreq = 100 + (100 - sanity) * 1.5 + terror * 150;
      this.droneFilter.frequency.setTargetAtTime(baseFreq, t, 1.0);
      this.ambientGain.gain.setTargetAtTime(0.25 + terror * 0.25, t, 1.0);
    }
  }

  public playFootstep(isSprinting: boolean, isCrouching: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const basePitch = isSprinting ? 65 : isCrouching ? 45 : 55;
    osc.frequency.setValueAtTime(basePitch, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    const vol = isSprinting ? 0.35 : isCrouching ? 0.08 : 0.18;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playGhostStep() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(38, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playHeartbeat(bpm: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // First beat (Lub)
    this.synthHeartThump(t, 60, 0.3);
    // Second beat (Dub)
    this.synthHeartThump(t + 0.18, 52, 0.22);
  }

  private synthHeartThump(time: number, freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.14);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  public playHuntStinger() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Dissonant screeching brass/violin sound
    const freqs = [311.13, 329.63, 622.25, 659.25, 1244.5]; // Minor 2nd dissonance
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.08, t + 1.2);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 1.6);
    });
  }

  public playGlassShatter() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // High frequency noise burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);

    // Clattering shards
    [1200, 1800, 2400, 950].forEach((freq, i) => {
      const chime = this.ctx!.createOscillator();
      const cGain = this.ctx!.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, t + i * 0.05);

      cGain.gain.setValueAtTime(0.15, t + i * 0.05);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.15);

      chime.connect(cGain);
      cGain.connect(this.masterGain!);

      chime.start(t + i * 0.05);
      chime.stop(t + i * 0.05 + 0.16);
    });
  }

  public playDoorCreak() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.15);
    osc.frequency.linearRampToValueAtTime(120, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(6, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  public playBarricadeImpact() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Heavy wooden thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playFlashlightClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playGasp() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.3);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  public playRelicPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    [220, 277.18, 329.63, 440].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);
      gain.gain.setValueAtTime(0.2, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.8);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.85);
    });
  }

  public playNpcVoice(role: 'student' | 'watchman' | 'ghost_girl') {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    if (role === 'student') {
      // Trembling nervous whisper breath
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(240, t + 0.2);
      osc.frequency.linearRampToValueAtTime(160, t + 0.4);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (role === 'watchman') {
      // Gruff low raspy radio voice
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.35);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.42);
    } else {
      // Ethereal bell-like ghost chime chords
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.04);
        gain.gain.setValueAtTime(0.12, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 1.2);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 1.25);
      });
    }
  }
}

export const horrorAudio = new HorrorAudioEngine();
