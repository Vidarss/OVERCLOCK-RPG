// ─────────────────────────────────────────────────────────────────────────────
// Sprite Preloader Hook
// Preloads enemy sprites ahead of time to prevent loading delays
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { MONSTER_SPRITES } from '../config/assets.config';

// Cache of already loaded images
const loadedSprites = new Set<string>();
const loadingSprites = new Set<string>();

/**
 * Preload a single image
 */
function preloadSprite(src: string): Promise<void> {
  if (loadedSprites.has(src) || loadingSprites.has(src)) {
    return Promise.resolve();
  }

  loadingSprites.add(src);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedSprites.add(src);
      loadingSprites.delete(src);
      resolve();
    };
    img.onerror = () => {
      loadingSprites.delete(src);
      resolve(); // Don't reject, just continue
    };
    img.src = src;
  });
}

/**
 * Preload all sprites for a specific tier
 */
export function preloadTierSprites(tier: number): void {
  // Preload all monster sprites (we have a small set now)
  for (const enemy of MONSTER_SPRITES) {
    for (const sprite of enemy.tiers) {
      preloadSprite(sprite.src);
    }
  }
}

/**
 * Preload boss sprites
 */
export function preloadBossSprites(): void {
  // Find all monsters with bossTiers
  const bosses = MONSTER_SPRITES.filter(m => m.bossTiers && m.bossTiers.length > 0);
  
  for (const boss of bosses) {
    if (boss.bossTiers) {
      for (const sprite of boss.bossTiers) {
        preloadSprite(sprite.src);
      }
    }
  }
}

/**
 * Preload ALL sprites immediately
 */
export function preloadAllSprites(): void {
  for (const monster of MONSTER_SPRITES) {
    for (const sprite of monster.tiers) {
      preloadSprite(sprite.src);
    }
    if (monster.bossTiers) {
      for (const sprite of monster.bossTiers) {
        preloadSprite(sprite.src);
      }
    }
  }
}

/**
 * Check if a sprite is loaded
 */
export function isSpriteLoaded(src: string): boolean {
  return loadedSprites.has(src);
}

/**
 * Hook to preload sprites based on current stage
 * Preloads current tier + next tier
 */
export function useSpritePreloader(stage: number): void {
  const preloadedTiers = useRef(new Set<number>());

  useEffect(() => {
    const currentTier = Math.floor((stage - 1) / 50);
    const nextTier = currentTier + 1;

    // Preload current tier if not already done
    if (!preloadedTiers.current.has(currentTier)) {
      preloadTierSprites(currentTier);
      preloadedTiers.current.add(currentTier);
    }

    // Preload next tier if not already done
    if (!preloadedTiers.current.has(nextTier) && nextTier <= 4) {
      preloadTierSprites(nextTier);
      preloadedTiers.current.add(nextTier);
    }

    // Always preload bosses
    preloadBossSprites();
  }, [stage]);
}

/**
 * Hook to preload all sprites on mount
 */
export function usePreloadAllSprites(): void {
  useEffect(() => {
    preloadAllSprites();
  }, []);
}
