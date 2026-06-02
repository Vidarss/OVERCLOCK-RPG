import { useCallback, useEffect, useState } from 'react';
import { audioManager, SoundType } from '@/systems/AudioManager';

export function useAudio() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    audioManager.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    audioManager.setVolume(volume);
  }, [volume]);

  const play = useCallback((sound: SoundType) => {
    audioManager.play(sound);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(e => !e);
  }, []);

  return {
    play,
    enabled,
    setEnabled,
    volume,
    setVolume,
    toggle,
  };
}

// Pre-bound functions for direct use without hook
export const playSound = (sound: SoundType) => audioManager.play(sound);
export const playSFX = {
  click: () => audioManager.play('click'),
  critical: () => audioManager.play('critical'),
  enemyDeath: () => audioManager.play('enemy_death'),
  levelUp: () => audioManager.play('level_up'),
  gold: () => audioManager.play('gold'),
  bossSpawn: () => audioManager.play('boss_spawn'),
  bossDeath: () => audioManager.play('boss_death'),
  stageClear: () => audioManager.play('stage_clear'),
  damage: () => audioManager.play('damage'),
  purchase: () => audioManager.play('purchase'),
  error: () => audioManager.play('error'),
  hover: () => audioManager.play('hover'),
  menuOpen: () => audioManager.play('menu_open'),
  menuClose: () => audioManager.play('menu_close'),
  notification: () => audioManager.play('notification'),
};
