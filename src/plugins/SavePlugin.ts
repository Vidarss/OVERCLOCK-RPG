import type { IPlugin, IEngine, GameState, GameEventType } from '../engine/types';
import { SAVE_CONFIG } from '../config/game.config';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * SavePlugin - Manages game state persistence with configurable triggers.
 * 
 * Features:
 * - Periodic auto-save at configurable intervals
 * - Action-based saving on important game events (configurable)
 * - Debouncing to prevent rapid-fire saves
 * - Save on tab hide / beforeunload for data safety (web)
 * - Save on app pause/background for data safety (mobile via Capacitor)
 * - Manual save via saveNow() method
 * 
 * Configuration (in SAVE_CONFIG):
 * - autoSaveIntervalMs: How often to auto-save (default: 5 minutes)
 * - saveOnActions: Array of event types that trigger immediate saves
 * - saveDebounceMs: Minimum time between saves (default: 2 seconds)
 * - saveOnActionsEnabled: Toggle action-based saving on/off
 */
export class SavePlugin implements IPlugin {
  id = 'save';
  dependencies = ['supabase'];
  stateKeys = ['totalDamageDealt', 'overclockCount', 'lastSaveTime'] as (keyof GameState)[];
  defaultState = { totalDamageDealt: 0, overclockCount: 0, lastSaveTime: 0 };

  private engine!: IEngine;
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSaveTime = 0;
  private isAuthenticated = false;
  private actionUnsubscribers: Array<() => void> = [];
  
  // Centralized cleanup references for all listeners
  private cleanupListeners: (() => void)[] = [];

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.on('auth_success', () => {
      this.isAuthenticated = true;
      this.startAutoSave();
      this.subscribeToActions();
    });

    engine.on('auth_signout', () => {
      this.isAuthenticated = false;
      this.stopAutoSave();
      this.unsubscribeFromActions();
    });

    this.setupListeners();
  }

  /**
   * Set up platform-specific lifecycle listeners.
   * All listeners are tracked in cleanupListeners for guaranteed cleanup.
   */
  private setupListeners(): void {
    if (Capacitor.isNativePlatform()) {
      // Mobile: Use Capacitor App plugin for lifecycle events
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && this.isAuthenticated) {
          this.saveImmediate();
        }
      }).then(handle => {
        this.cleanupListeners.push(() => handle.remove());
      });
    } else {
      // Web: Use browser events
      const handleBeforeUnload = () => {
        if (this.isAuthenticated) {
          this.saveImmediate();
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && this.isAuthenticated) {
          this.saveImmediate();
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      this.cleanupListeners.push(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      });
    }
  }

  /**
   * Subscribe to all configured "important action" events.
   * Each action triggers a debounced save.
   */
  private subscribeToActions(): void {
    if (!SAVE_CONFIG.saveOnActionsEnabled) return;

    SAVE_CONFIG.saveOnActions.forEach(action => {
      this.actionUnsubscribers.push(
        this.engine.on(action as GameEventType, () => this.saveDebounced())
      );
    });
  }

  /**
   * Unsubscribe from all action listeners.
   */
  private unsubscribeFromActions(): void {
    this.actionUnsubscribers.forEach(unsub => unsub());
    this.actionUnsubscribers = [];
  }

  /**
   * Start the periodic auto-save timer.
   */
  private startAutoSave(): void {
    this.stopAutoSave();
    this.saveTimer = setInterval(
      () => this.saveDebounced(),
      SAVE_CONFIG.autoSaveIntervalMs
    );
  }

  /**
   * Stop the periodic auto-save timer.
   */
  private stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Clear any pending debounce timer.
   * Extracted to DRY principle - used in multiple places.
   */
  private clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Trigger a save with debouncing to prevent rapid-fire saves.
   * Multiple calls within saveDebounceMs will result in a single save.
   */
  private saveDebounced(): void {
    if (!this.isAuthenticated) return;

    this.clearDebounce();

    const now = Date.now();
    const delay = Math.max(0, SAVE_CONFIG.saveDebounceMs - (now - this.lastSaveTime));

    if (delay === 0) {
      this.saveImmediate();
    } else {
      this.debounceTimer = setTimeout(() => this.saveImmediate(), delay);
    }
  }

  /**
   * Perform an immediate save (bypasses debounce).
   * Captures state atomically and emits save event.
   * Used for critical moments like page unload.
   */
  private saveImmediate(): void {
    if (!this.isAuthenticated) return;

    try {
      this.lastSaveTime = Date.now();
      // Capture state atomically at save time
      this.engine.updateState({ lastSaveTime: this.lastSaveTime });
      this.engine.emit('save_requested', {});
      this.clearDebounce();
    } catch (error) {
      console.error('[SavePlugin] Failed to perform immediate save', error);
    }
  }

  /**
   * Public method to manually trigger a save (e.g., from UI "Save" button).
   * Respects debouncing.
   */
  saveNow(): void {
    this.saveDebounced();
  }

  /**
   * Public method to force an immediate save (bypasses debounce).
   * Use sparingly - prefer saveNow() for normal operations.
   */
  forceSave(): void {
    this.saveImmediate();
  }

  /**
   * Get the timestamp of the last successful save.
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * Check if a save is currently pending (debounce timer active).
   */
  isSavePending(): boolean {
    return this.debounceTimer !== null;
  }

  /**
   * Clean up all resources: timers, listeners, and subscriptions.
   */
  cleanup(): void {
    this.stopAutoSave();
    this.unsubscribeFromActions();
    this.clearDebounce();
    
    // Execute all cleanup listeners in guaranteed order
    this.cleanupListeners.forEach(fn => fn());
    this.cleanupListeners = [];
  }
}
