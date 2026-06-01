// ─────────────────────────────────────────────────────────────────────────────
// OVERCLOCK — Asset Configuration
//
// This file centralizes all monster sprites and stage background images.
// To change sprites or backgrounds, simply:
//   1. Add your image file to the appropriate folder:
//      - Enemies: public/assets/enemies/
//      - Backgrounds: public/assets/backgrounds/
//   2. Update the config arrays below with the new filename
//
// NAMING CONVENTION:
//   - Enemies: public/assets/enemies/{name}.png
//   - Backgrounds: public/assets/backgrounds/{name}.png
// ─────────────────────────────────────────────────────────────────────────────

// ── ENEMY SPRITES ────────────────────────────────────────────────────────────
// Each tier can have multiple sprites. A random one is chosen when spawning.
// Set to null to use the default pixel-art fallback.

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

export interface EnemyTierSprites {
  /** Tier index (0-9, matches ENEMY_CONFIG.enemyNamesByTier) */
  tier: number;
  /** Regular enemy sprites for this tier */
  sprites: EnemySpriteDef[];
  /** Boss sprite for this tier (optional, falls back to default if not set) */
  bossSprite?: EnemySpriteDef;
  /** Elite sprite for this tier (optional, uses regular sprite with glow if not set) */
  eliteSprite?: EnemySpriteDef;
}

export const ENEMY_SPRITES: EnemyTierSprites[] = [
  // ── Tier 0 (Stages 1-50): PERIMETER ─────────────────────────────────────────
  {
    tier: 0,
    sprites: [
      { id: 'adware', name: 'ADWARE.EXE', src: '/assets/enemies/adware.png', scale: 2.0 },
      { id: 'null_ptr', name: 'null_ptr', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/null%20ptr-9EIVZzWNy7ZqQjNwEmmCBpirXpKxXL.png', scale: 1.2 },
      { id: 'rootkit', name: 'ROOTKIT', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rootkit.png-kgLkahgVM9h4CKjghfwyx5DcEz7bwW.jpeg', scale: 1.5 },
      { id: 'malware_bat', name: 'MALWARE.BAT', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/malware.bat-QlLlMhm1zUJU0XYHbSu1bS34rHLFUF.png', scale: 1.4 },
      { id: 'spam_bot', name: 'SPAM_BOT', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spam%20bot-kUHqrduhRo2ZlQSIg9Tqz7yqJ9ZLQq.png', scale: 1.3 },
      { id: 'corrupt_proc', name: 'CORRUPT_PROC', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/corrupt%20proc-mei2JE2wxrsGoRt3K1iZH9N7fsOMOv.png', scale: 1.6 },
      { id: 'stackoverflow', name: 'STACKOVERFLOW', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stackoverflow.png-K241Fy8VF6Fi7MUKLOlKPy2Q7bbo5o.jpeg', scale: 1.1 },
    ],
    // bossSprite: { id: 'firewall_boss', name: 'THE_FIREWALL', src: '/assets/enemies/firewall-boss.png', scale: 1.2 },
  },
  // ── Tier 1 (Stages 51-100): FIREWALL ────────────────────────────────────────
  {
    tier: 1,
    sprites: [
      // Add tier 1 sprites here:
      // { id: 'virus', name: 'VIRUS_V2', src: '/assets/enemies/virus.png', scale: 0.4 },
    ],
  },
  // ── Tier 2 (Stages 101-150): KERNEL ─────────────────────────────────────────
  {
    tier: 2,
    sprites: [],
  },
  // ── Tier 3 (Stages 151-200): CORE ───────────────────────────────────────────
  {
    tier: 3,
    sprites: [],
  },
  // ── Tier 4 (Stages 201-250): THE VOID ───────────────────────────────────────
  {
    tier: 4,
    sprites: [],
  },
  // ── Tier 5+ : Add more tiers as needed ──────────────────────────────────────
];

/**
 * Get sprites for a specific tier
 * Falls back to pixel-art if no sprites defined
 */
export function getEnemySpritesForTier(tier: number): EnemyTierSprites | null {
  return ENEMY_SPRITES.find(t => t.tier === tier) ?? null;
}

/**
 * Get a random sprite for a tier
 * Returns null if no sprites defined (use pixel-art fallback)
 */
export function getRandomEnemySprite(tier: number, isBoss: boolean, isElite: boolean): EnemySpriteDef | null {
  const tierSprites = getEnemySpritesForTier(tier);
  if (!tierSprites) return null;

  // Boss takes priority
  if (isBoss && tierSprites.bossSprite) {
    return tierSprites.bossSprite;
  }

  // Elite takes second priority
  if (isElite && tierSprites.eliteSprite) {
    return tierSprites.eliteSprite;
  }

  // Regular sprites
  if (tierSprites.sprites.length === 0) return null;
  const idx = Math.floor(Math.random() * tierSprites.sprites.length);
  return tierSprites.sprites[idx];
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
  // ── Zone 0: PERIMETER ───────────────────────────────────────────────────────
  {
    zoneId: 0,
    src: '/assets/backgrounds/zone-0.png',
    fit: 'cover',
    position: 'center',
    overlayOpacity: 0.6,
  },
  // ── Zone 1: FIREWALL ────────────────────────────────────────────────────────
  // {
  //   zoneId: 1,
  //   src: '/assets/backgrounds/zone-1.png',
  //   fit: 'cover',
  //   position: 'center',
  //   overlayOpacity: 0.65,
  // },
  // ── Zone 2: KERNEL ──────────────────────────────────────────────────────────
  // Add more zone backgrounds here...
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

  // Collect enemy sprites
  for (const tier of ENEMY_SPRITES) {
    for (const sprite of tier.sprites) {
      imagesToLoad.push(sprite.src);
    }
    if (tier.bossSprite) imagesToLoad.push(tier.bossSprite.src);
    if (tier.eliteSprite) imagesToLoad.push(tier.eliteSprite.src);
  }

  // Collect zone backgrounds
  for (const bg of ZONE_BACKGROUNDS) {
    imagesToLoad.push(bg.src);
  }

  // Preload all in parallel
  await Promise.allSettled(imagesToLoad.map(preloadImage));
}
