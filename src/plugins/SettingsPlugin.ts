import type { IPlugin, IEngine } from '../engine/types';

export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  particleEffects: boolean;
  autoSell: boolean;
}

export class SettingsPlugin implements IPlugin {
  name = 'settings';
  private engine!: IEngine;
  private settings: SettingsState = {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    screenShake: true,
    particleEffects: true,
    autoSell: false,
  };
  private listeners: Array<() => void> = [];

  initialize(engine: IEngine): void {
    this.engine = engine;
    // Load settings from localStorage
    const saved = localStorage.getItem('overclock_settings');
    if (saved) {
      try {
        this.settings = JSON.parse(saved);
      } catch (e) {
        console.log('[SettingsPlugin] Failed to load saved settings');
      }
    }
  }

  getSettings(): SettingsState {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<SettingsState>): void {
    this.settings = { ...this.settings, ...partial };
    localStorage.setItem('overclock_settings', JSON.stringify(this.settings));
    this.notify();
  }

  setMusicVolume(v: number): void {
    this.updateSettings({ musicVolume: Math.max(0, Math.min(1, v)) });
  }

  setSFXVolume(v: number): void {
    this.updateSettings({ sfxVolume: Math.max(0, Math.min(1, v)) });
  }

  toggleScreenShake(): void {
    this.updateSettings({ screenShake: !this.settings.screenShake });
  }

  toggleParticleEffects(): void {
    this.updateSettings({ particleEffects: !this.settings.particleEffects });
  }

  toggleAutoSell(): void {
    this.updateSettings({ autoSell: !this.settings.autoSell });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  cleanup(): void {
    this.listeners = [];
  }
}
