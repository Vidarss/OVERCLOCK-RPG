// ─────────────────────────────────────────────────────────────────────────────
// OVERCLOCK — Asset Configuration
//
// This file centralizes all monster sprites and stage background images.
// 
// SPRITE SYSTEM:
//   - Each monster has a unique name (e.g., "MALWARE_BAT", "VIRUS_V2")
//   - Each monster can have multiple SPRITE TIERS (visual evolution)
//   - Sprite tier determines which visual variant to show based on game progression
//   - Higher sprite tiers = more evolved/menacing appearance
//
// TO ADD SPRITES:
//   1. Add your image file to: public/assets/enemies/{monster_name}/tier{N}.png
//   2. Add the sprite definition to MONSTER_SPRITES below
//   3. The game will automatically pick the appropriate tier based on progression
//
// NAMING CONVENTION:
//   - Enemies: public/assets/enemies/{monster_name}/tier{1-6}.png
//   - Backgrounds: public/assets/backgrounds/{zone_name}.png
// ─────────────────────────────────────────────────────────────────────────────

// ── MONSTER SPRITE TYPES ─────────────────────────────────────────────────────

export interface SpriteTierDef {
  /** Sprite tier (1-6, higher = more evolved visual) */
  tier: number;
  /** Path to the sprite image */
  src: string;
  /** Scale factor (1.0 = 200px base) */
  scale?: number;
  /** Optional vertical offset in pixels */
  offsetY?: number;
}

export interface MonsterSpriteDef {
  /** Monster name (must match ENEMY_CONFIG.monsters, .elites, or .bosses entries) */
  name: string;
  /** Available sprite tiers for this monster (sorted by tier) */
  tiers: SpriteTierDef[];
  /** Boss variant sprite tiers (optional) */
  bossTiers?: SpriteTierDef[];
  /** Elite variant sprite tiers (optional, uses regular with glow if not set) */
  eliteTiers?: SpriteTierDef[];
}

// ── MONSTER SPRITES REGISTRY ─────────────────────────────────────────────────
// Add all monster sprites here. Each monster can have multiple tiers.
// The game will select the appropriate tier based on overclock count or stage.

export const MONSTER_SPRITES: MonsterSpriteDef[] = [
  // ════════════════════════════════════════════════════════════════════════════
  // MONSTERS - Regular enemies (stages 1-150)
  // ════════════════════════════════════════════════════════════════════════════
  { name: 'NULL_PROCESS_ENTITY', tiers: [{ tier: 1, src: '/assets/enemies/monsters/null_process_entity.png', scale: 1.0 }] },
  { name: 'CACHE_BREAKER', tiers: [{ tier: 1, src: '/assets/enemies/monsters/cache_breaker.png', scale: 1.0 }] },
  { name: 'ADWARE_GLITCHLING', tiers: [{ tier: 1, src: '/assets/enemies/monsters/adware_glitchling.png', scale: 1.0 }] },
  { name: 'FIREWALL_ORPHAN', tiers: [{ tier: 1, src: '/assets/enemies/monsters/firewall_orphan.png', scale: 1.0 }] },
  { name: 'OVERCLOCK_ERROR', tiers: [{ tier: 1, src: '/assets/enemies/monsters/overclock_error.png', scale: 1.0 }] },
  { name: 'KERNEL_LEAK_SPAWN', tiers: [{ tier: 1, src: '/assets/enemies/monsters/kernel_leak_spawn.png', scale: 1.0 }] },
  { name: 'AUTOUPDATE_HORROR', tiers: [{ tier: 1, src: '/assets/enemies/monsters/autoupdate_horror.png', scale: 1.0 }] },
  { name: 'DEBUG_SPECTER', tiers: [{ tier: 1, src: '/assets/enemies/monsters/debug_specter.png', scale: 1.0 }] },
  { name: 'SYSTEM_POPUP_PREDATOR', tiers: [{ tier: 1, src: '/assets/enemies/monsters/system_popup_predator.png', scale: 1.0 }] },
  { name: 'SYNC_FAILURE_CORE', tiers: [{ tier: 1, src: '/assets/enemies/monsters/sync_failure_core.png', scale: 1.0 }] },

  // ════════════════════════════════════════════════════════════════════════════
  // ELITES - Stronger enemies with unique sprites
  // ════════════════════════════════════════════════════════════════════════════
  { name: 'RECURSIVE_UPGRADE_MISTAKE', tiers: [{ tier: 1, src: '/assets/enemies/elites/recursive_upgrade_mistake.png', scale: 1.1 }], eliteTiers: [{ tier: 1, src: '/assets/enemies/elites/recursive_upgrade_mistake.png', scale: 1.1 }] },
  { name: 'UNAUTHORIZED_PROCESS_AGENT', tiers: [{ tier: 1, src: '/assets/enemies/elites/unauthorized_process_agent.png', scale: 1.1 }], eliteTiers: [{ tier: 1, src: '/assets/enemies/elites/unauthorized_process_agent.png', scale: 1.1 }] },
  { name: 'MEMORY_DRIFT_ENFORCER', tiers: [{ tier: 1, src: '/assets/enemies/elites/memory_drift_enforcer.png', scale: 1.1 }], eliteTiers: [{ tier: 1, src: '/assets/enemies/elites/memory_drift_enforcer.png', scale: 1.1 }] },
  { name: 'PATCH_NOTES_ABERRATION', tiers: [{ tier: 1, src: '/assets/enemies/elites/patch_notes_aberration.png', scale: 1.1 }], eliteTiers: [{ tier: 1, src: '/assets/enemies/elites/patch_notes_aberration.png', scale: 1.1 }] },
  { name: 'SYNTHETIC_FAILURE_UNIT', tiers: [{ tier: 1, src: '/assets/enemies/elites/synthetic_failure_unit.png', scale: 1.1 }], eliteTiers: [{ tier: 1, src: '/assets/enemies/elites/synthetic_failure_unit.png', scale: 1.1 }] },

  // ════════════════════════════════════════════════════════════════════════════
  // BOSSES - Phase 10 enemies
  // ════════════════════════════════════════════════════════════════════════════
  { name: 'THE_PATCH_THAT_NEVER_FINISHED', tiers: [{ tier: 1, src: '/assets/enemies/bosses/the_patch_that_never_finished.png', scale: 1.3 }], bossTiers: [{ tier: 1, src: '/assets/enemies/bosses/the_patch_that_never_finished.png', scale: 1.3 }] },
  { name: 'CORE_SYSTEM_AUTONOMY', tiers: [{ tier: 1, src: '/assets/enemies/bosses/core_system_autonomy.png', scale: 1.3 }], bossTiers: [{ tier: 1, src: '/assets/enemies/bosses/core_system_autonomy.png', scale: 1.3 }] },
  { name: 'ADMINISTRATIVE_GOD_PROCESS', tiers: [{ tier: 1, src: '/assets/enemies/bosses/administrative_god_process.png', scale: 1.3 }], bossTiers: [{ tier: 1, src: '/assets/enemies/bosses/administrative_god_process.png', scale: 1.3 }] },
];

// ── SPRITE LOOKUP FUNCTIONS ──────────────────────────────────────────────────

/**
 * Get sprite definition for a monster by name
 */
export function getMonsterSprite(name: string): MonsterSpriteDef | null {
  // Normalize name for matching (handle case differences)
  const normalizedName = name.toUpperCase().replace(/[^A-Z0-9_\.]/g, '');
  return MONSTER_SPRITES.find(m => 
    m.name.toUpperCase().replace(/[^A-Z0-9_\.]/g, '') === normalizedName
  ) ?? null;
}

/**
 * Get the best sprite tier for a monster based on progression
 * @param name Monster name
 * @param spriteTier Desired sprite tier (1-6, based on overclock count or game progression)
 * @param isBoss Whether this is a boss variant
 * @param isElite Whether this is an elite variant
 * @returns The sprite definition or null if no sprite available
 */
export function getSpriteForMonster(
  name: string, 
  spriteTier: number, 
  isBoss: boolean = false, 
  isElite: boolean = false
): SpriteTierDef | null {
  const monster = getMonsterSprite(name);
  if (!monster) return null;

  // Select the tier array based on variant
  let tiers: SpriteTierDef[];
  if (isBoss && monster.bossTiers && monster.bossTiers.length > 0) {
    tiers = monster.bossTiers;
  } else if (isElite && monster.eliteTiers && monster.eliteTiers.length > 0) {
    tiers = monster.eliteTiers;
  } else {
    tiers = monster.tiers;
  }

  if (tiers.length === 0) return null;

  // Sort tiers by tier number
  const sortedTiers = [...tiers].sort((a, b) => a.tier - b.tier);

  // Find the highest tier that doesn't exceed the requested tier
  // This ensures we use the best available sprite up to the requested tier
  let bestMatch: SpriteTierDef | null = null;
  for (const t of sortedTiers) {
    if (t.tier <= spriteTier) {
      bestMatch = t;
    } else {
      break;
    }
  }

  // If no match found (requested tier is lower than all available), use the lowest tier
  return bestMatch ?? sortedTiers[0];
}

/**
 * Calculate sprite tier based on overclock count
 * More overclocks = higher sprite tier = more evolved visuals
 */
export function calculateSpriteTier(overclockCount: number): number {
  // Tier 1: 0 overclocks
  // Tier 2: 1-2 overclocks
  // Tier 3: 3-5 overclocks
  // Tier 4: 6-10 overclocks
  // Tier 5: 11-20 overclocks
  // Tier 6: 21+ overclocks
  if (overclockCount >= 21) return 6;
  if (overclockCount >= 11) return 5;
  if (overclockCount >= 6) return 4;
  if (overclockCount >= 3) return 3;
  if (overclockCount >= 1) return 2;
  return 1;
}

// ── LEGACY COMPATIBILITY ─────────────────────────────────────────────────────
// These types and functions maintain backwards compatibility with existing code

export interface EnemySpriteDef {
  /** Unique identifier */
  id: string;
  /** Display name for this sprite variant */
  name: string;
  /** Path relative to /public (e.g., '/assets/enemies/adware.png') */
  src: string;
  /** Scale factor (1.0 = 200px base, 0.5 = 100px, 2.0 = 400px) */
  scale?: number;
  /** Optional vertical offset in pixels */
  offsetY?: number;
}

/**
 * Legacy function - Get a sprite for an enemy
 * Now uses the new monster-based sprite system
 */
export function getRandomEnemySprite(
  tier: number, 
  isBoss: boolean, 
  isElite: boolean,
  enemyName?: string,
  overclockCount: number = 0
): EnemySpriteDef | null {
  // If no enemy name provided, we can't look up the sprite
  if (!enemyName) return null;

  const spriteTier = calculateSpriteTier(overclockCount);
  const sprite = getSpriteForMonster(enemyName, spriteTier, isBoss, isElite);
  
  if (!sprite) return null;

  // Convert to legacy format
  return {
    id: enemyName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: enemyName,
    src: sprite.src,
    scale: sprite.scale,
    offsetY: sprite.offsetY,
  };
}


// ── ZONE BACKGROUNDS ─────────────────────────────────────────────────────────
// Each zone can have a custom background image.
// Set to null to use the default procedural background.

export interface ZoneBackgroundDef {
  /** Zone ID (0-9, matches ZONE_CONFIG.zones) */
  zoneId: number;
  /** Path relative to /public (e.g., '/assets/backgrounds/zone-0.png') */
  src: string;
  /** How the image should fill the zone ('cover' | 'contain' | 'fill') */
  fit?: 'cover' | 'contain' | 'fill';
  /** Background position (e.g., 'center', 'bottom', 'top') */
  position?: string;
  /** Overlay opacity for readability (0-1, default 0.7) */
  overlayOpacity?: number;
  /** Overlay color (default: zone's bgColor) */
  overlayColor?: string;
}

export const ZONE_BACKGROUNDS: ZoneBackgroundDef[] = [
  // ── Stages 1-150: SYSTEM CORE MEGACITY ─────────────────────────────────────
  {
    zoneId: 0,
    src: '/assets/backgrounds/system_core_megacity.jpg',
    fit: 'cover',
    position: 'center',
    overlayOpacity: 0.4,
  },
  {
    zoneId: 1,
    src: '/assets/backgrounds/system_core_megacity.jpg',
    fit: 'cover',
    position: 'center',
    overlayOpacity: 0.4,
  },
  {
    zoneId: 2,
    src: '/assets/backgrounds/system_core_megacity.jpg',
    fit: 'cover',
    position: 'center',
    overlayOpacity: 0.4,
  },
];

/**
 * Get background config for a specific zone
 * Returns null if no custom background (use procedural fallback)
 */
export function getZoneBackground(zoneId: number): ZoneBackgroundDef | null {
  return ZONE_BACKGROUNDS.find(z => z.zoneId === zoneId) ?? null;
}


// ── ASSET LOADING HELPERS ────────────────────────────────────────────────────

/**
 * Preload an image and return a promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload all configured assets
 * Call this on game boot for smoother experience
 */
export async function preloadAllAssets(): Promise<void> {
  const imagesToLoad: string[] = [];

  // Collect monster sprites from new system
  for (const monster of MONSTER_SPRITES) {
    for (const tier of monster.tiers) {
      imagesToLoad.push(tier.src);
    }
    if (monster.bossTiers) {
      for (const tier of monster.bossTiers) {
        imagesToLoad.push(tier.src);
      }
    }
    if (monster.eliteTiers) {
      for (const tier of monster.eliteTiers) {
        imagesToLoad.push(tier.src);
      }
    }
  }

  // Collect zone backgrounds
  for (const bg of ZONE_BACKGROUNDS) {
    imagesToLoad.push(bg.src);
  }

  // Preload all in parallel
  await Promise.allSettled(imagesToLoad.map(preloadImage));
}
