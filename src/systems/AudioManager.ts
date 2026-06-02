// ══════════════════════════════════════════════════════════════════════════════
// OVERCLOCK Audio System - Synthesized Cyberpunk SFX using Web Audio API
// ══════════════════════════════════════════════════════════════════════════════

type SoundType = 
  | 'click' | 'critical' | 'enemy_death' | 'level_up' | 'gold' 
  | 'boss_spawn' | 'boss_death' | 'stage_clear' | 'damage' | 'purchase'
  | 'error' | 'hover' | 'menu_open' | 'menu_close' | 'notification';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getContext();
    return this.masterGain!;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  setEnabled(e: boolean) {
    this.enabled = e;
  }

  // ── Synthesizer helpers ─────────────────────────────────────────────────────

  private createOsc(type: OscillatorType, freq: number, duration: number): OscillatorNode {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.start();
    osc.stop(ctx.currentTime + duration);
    return osc;
  }

  private createGain(attack: number, decay: number, sustain: number, release: number, duration: number): GainNode {
    const ctx = this.getContext();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + attack);
    gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    gain.gain.setValueAtTime(sustain, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    return gain;
  }

  private createFilter(type: BiquadFilterType, freq: number, q: number = 1): BiquadFilterNode {
    const ctx = this.getContext();
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    return filter;
  }

  private createDistortion(amount: number): WaveShaperNode {
    const ctx = this.getContext();
    const distortion = ctx.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    distortion.curve = curve;
    return distortion;
  }

  // ── Sound Effects ───────────────────────────────────────────────────────────

  play(sound: SoundType) {
    if (!this.enabled) return;
    
    try {
      switch (sound) {
        case 'click': this.playClick(); break;
        case 'critical': this.playCritical(); break;
        case 'enemy_death': this.playEnemyDeath(); break;
        case 'level_up': this.playLevelUp(); break;
        case 'gold': this.playGold(); break;
        case 'boss_spawn': this.playBossSpawn(); break;
        case 'boss_death': this.playBossDeath(); break;
        case 'stage_clear': this.playStageClear(); break;
        case 'damage': this.playDamage(); break;
        case 'purchase': this.playPurchase(); break;
        case 'error': this.playError(); break;
        case 'hover': this.playHover(); break;
        case 'menu_open': this.playMenuOpen(); break;
        case 'menu_close': this.playMenuClose(); break;
        case 'notification': this.playNotification(); break;
      }
    } catch (e) {
      console.warn('[AudioManager] Failed to play sound:', sound, e);
    }
  }

  // Click/tap damage - short digital zap
  private playClick() {
    const ctx = this.getContext();
    const duration = 0.08;
    
    const osc = this.createOsc('square', 800, duration);
    const gain = this.createGain(0.01, 0.02, 0.3, 0.04, duration);
    const filter = this.createFilter('highpass', 400);
    
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    
    osc.connect(filter).connect(gain).connect(this.getMaster());
  }

  // Critical hit - glitchy surge with bass
  private playCritical() {
    const ctx = this.getContext();
    const duration = 0.2;
    
    // High glitch
    const osc1 = this.createOsc('sawtooth', 1200, duration);
    const gain1 = this.createGain(0.01, 0.05, 0.4, 0.1, duration);
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    
    // Bass punch
    const osc2 = this.createOsc('sine', 80, duration);
    const gain2 = this.createGain(0.01, 0.1, 0.6, 0.05, duration);
    
    const distortion = this.createDistortion(20);
    
    osc1.connect(distortion).connect(gain1).connect(this.getMaster());
    osc2.connect(gain2).connect(this.getMaster());
  }

  // Enemy death - digital disintegration
  private playEnemyDeath() {
    const ctx = this.getContext();
    const duration = 0.25;
    
    // Noise burst
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.createFilter('bandpass', 2000, 5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    // Descending tone
    const osc = this.createOsc('square', 400, duration);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);
    const oscGain = this.createGain(0.01, 0.05, 0.3, 0.1, duration);
    
    noise.connect(filter).connect(gain).connect(this.getMaster());
    osc.connect(oscGain).connect(this.getMaster());
    noise.start();
  }

  // Level up - ascending arpeggio
  private playLevelUp() {
    const ctx = this.getContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
      
      osc.connect(gain).connect(this.getMaster());
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  }

  // Gold/currency - crystalline ding
  private playGold() {
    const ctx = this.getContext();
    const duration = 0.15;
    
    const osc1 = this.createOsc('sine', 1800, duration);
    const osc2 = this.createOsc('sine', 2400, duration);
    
    const gain = this.createGain(0.01, 0.03, 0.2, 0.08, duration);
    
    osc1.connect(gain).connect(this.getMaster());
    osc2.connect(gain);
  }

  // Boss spawn - deep alarm
  private playBossSpawn() {
    const ctx = this.getContext();
    const duration = 0.8;
    
    // Warning siren
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    
    // Wobble effect
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain).connect(osc.frequency);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    const filter = this.createFilter('lowpass', 800);
    
    osc.connect(filter).connect(gain).connect(this.getMaster());
    
    osc.start();
    lfo.start();
    osc.stop(ctx.currentTime + duration);
    lfo.stop(ctx.currentTime + duration);
  }

  // Boss death - big explosion
  private playBossDeath() {
    const ctx = this.getContext();
    const duration = 0.6;
    
    // Explosion noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.createFilter('lowpass', 1000);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    // Bass boom
    const osc = this.createOsc('sine', 60, duration);
    const oscGain = this.createGain(0.01, 0.1, 0.5, 0.3, duration);
    
    noise.connect(filter).connect(gain).connect(this.getMaster());
    osc.connect(oscGain).connect(this.getMaster());
    noise.start();
  }

  // Stage clear - victory fanfare
  private playStageClear() {
    const ctx = this.getContext();
    const notes = [392, 523, 659, 784]; // G4, C5, E5, G5
    
    notes.forEach((freq, i) => {
      const delay = i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      const dur = i === notes.length - 1 ? 0.5 : 0.15;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + dur);
      
      osc.connect(gain).connect(this.getMaster());
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  }

  // Damage taken - static burst
  private playDamage() {
    const ctx = this.getContext();
    const duration = 0.1;
    
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.createFilter('highpass', 1000);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noise.connect(filter).connect(gain).connect(this.getMaster());
    noise.start();
  }

  // Purchase success - ka-ching with synth
  private playPurchase() {
    const ctx = this.getContext();
    
    // Coin sound
    const osc1 = this.createOsc('sine', 2000, 0.1);
    const osc2 = this.createOsc('sine', 2500, 0.15);
    
    const gain1 = this.createGain(0.01, 0.02, 0.25, 0.05, 0.1);
    const gain2 = this.createGain(0.01, 0.02, 0.2, 0.1, 0.15);
    
    osc1.connect(gain1).connect(this.getMaster());
    
    setTimeout(() => {
      osc2.connect(gain2).connect(this.getMaster());
    }, 50);
  }

  // Error - soft buzz
  private playError() {
    const ctx = this.getContext();
    const duration = 0.15;
    
    const osc = this.createOsc('sawtooth', 150, duration);
    const gain = this.createGain(0.01, 0.02, 0.2, 0.1, duration);
    const filter = this.createFilter('lowpass', 500);
    
    osc.connect(filter).connect(gain).connect(this.getMaster());
  }

  // Hover - subtle blip
  private playHover() {
    const ctx = this.getContext();
    const duration = 0.04;
    
    const osc = this.createOsc('sine', 1200, duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain).connect(this.getMaster());
  }

  // Menu open - whoosh up
  private playMenuOpen() {
    const ctx = this.getContext();
    const duration = 0.15;
    
    const osc = this.createOsc('sine', 300, duration);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
    
    const gain = this.createGain(0.01, 0.05, 0.15, 0.08, duration);
    const filter = this.createFilter('bandpass', 600, 2);
    
    osc.connect(filter).connect(gain).connect(this.getMaster());
  }

  // Menu close - whoosh down
  private playMenuClose() {
    const ctx = this.getContext();
    const duration = 0.12;
    
    const osc = this.createOsc('sine', 600, duration);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    
    const gain = this.createGain(0.01, 0.03, 0.12, 0.06, duration);
    
    osc.connect(gain).connect(this.getMaster());
  }

  // Notification - gentle ping
  private playNotification() {
    const ctx = this.getContext();
    
    const osc = this.createOsc('sine', 880, 0.2);
    const gain = this.createGain(0.01, 0.02, 0.2, 0.15, 0.2);
    
    osc.connect(gain).connect(this.getMaster());
  }
}

// Singleton instance
export const audioManager = new AudioManager();
export type { SoundType };
