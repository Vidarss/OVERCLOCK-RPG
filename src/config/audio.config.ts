// ══════════════════════════════════════════════════════════════════════════════
// AUDIO CONFIGURATION - Stage Music, Boss Themes, and Sound Settings
// ══════════════════════════════════════════════════════════════════════════════
// 
// HOW TO ADD NEW MUSIC:
// 1. Add the audio file to /public/audio/ (mp3, ogg, or wav)
// 2. Add a new entry to MUSIC_TRACKS with a unique id
// 3. Assign the track id to a zone or boss in the appropriate config section
//
// SCHEMA:
// MusicTrackDef {
//   id: string           - Unique identifier for the track
//   name: string         - Display name in settings/credits
//   src: string          - Path relative to public folder (e.g., '/audio/bgm-zone1.mp3')
//   loop: boolean        - Whether to loop the track
//   volume: number       - Base volume (0-1), will be multiplied by master volume
//   fadeInMs?: number    - Fade in duration (default 500ms)
//   fadeOutMs?: number   - Fade out duration (default 500ms)
// }
// ══════════════════════════════════════════════════════════════════════════════

export interface MusicTrackDef {
  id: string;
  name: string;
  src: string;
  loop: boolean;
  volume: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface ZoneMusicDef {
  zoneId: number;
  trackId: string;
  /** Optional override for boss fights in this zone */
  bossTrackId?: string;
}

export interface BossMusicOverrideDef {
  /** Stage number where this override applies (for special bosses) */
  stage?: number;
  /** Zone id where this override applies */
  zoneId?: number;
  /** The track to play */
  trackId: string;
}

// ── TRACK LIBRARY ─────────────────────────────────────────────────────────────
// All available music tracks. Add new tracks here first.

export const MUSIC_TRACKS: MusicTrackDef[] = [
  // Main theme / menu
  { id: 'main_theme',    name: 'Main Theme',       src: '/audio/bgm-main.mp3',      loop: true, volume: 0.7 },
  
  // Zone themes - one per zone
  { id: 'zone_0',        name: 'Perimeter',        src: '/audio/bgm-zone0.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_1',        name: 'Firewall',         src: '/audio/bgm-zone1.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_2',        name: 'Kernel',           src: '/audio/bgm-zone2.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_3',        name: 'Core',             src: '/audio/bgm-zone3.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_4',        name: 'The Void',         src: '/audio/bgm-zone4.mp3',     loop: true, volume: 0.5 },
  { id: 'zone_5',        name: 'Abyss',            src: '/audio/bgm-zone5.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_6',        name: 'Fracture',         src: '/audio/bgm-zone6.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_7',        name: 'Entropy',          src: '/audio/bgm-zone7.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_8',        name: 'Overload',         src: '/audio/bgm-zone8.mp3',     loop: true, volume: 0.6 },
  { id: 'zone_9',        name: 'Singularity',      src: '/audio/bgm-zone9.mp3',     loop: true, volume: 0.5 },
  
  // Boss themes
  { id: 'boss_generic',  name: 'Boss Battle',      src: '/audio/bgm-boss.mp3',      loop: true, volume: 0.7 },
  { id: 'boss_elite',    name: 'Elite Encounter',  src: '/audio/bgm-elite.mp3',     loop: true, volume: 0.7 },
  { id: 'boss_final',    name: 'Final Boss',       src: '/audio/bgm-final.mp3',     loop: true, volume: 0.8, fadeInMs: 1000 },
  
  // Special / event
  { id: 'victory',       name: 'Victory',          src: '/audio/bgm-victory.mp3',   loop: false, volume: 0.8 },
  { id: 'defeat',        name: 'Defeat',           src: '/audio/bgm-defeat.mp3',    loop: false, volume: 0.6 },
  { id: 'shop',          name: 'Shop',             src: '/audio/bgm-shop.mp3',      loop: true, volume: 0.5 },
];

// ── ZONE MUSIC MAPPING ────────────────────────────────────────────────────────
// Assign tracks to zones. Each zone can have a main track and optional boss override.

export const ZONE_MUSIC: ZoneMusicDef[] = [
  { zoneId: 0, trackId: 'zone_0', bossTrackId: 'boss_generic' },
  { zoneId: 1, trackId: 'zone_1', bossTrackId: 'boss_generic' },
  { zoneId: 2, trackId: 'zone_2', bossTrackId: 'boss_generic' },
  { zoneId: 3, trackId: 'zone_3', bossTrackId: 'boss_generic' },
  { zoneId: 4, trackId: 'zone_4', bossTrackId: 'boss_elite' },
  { zoneId: 5, trackId: 'zone_5', bossTrackId: 'boss_elite' },
  { zoneId: 6, trackId: 'zone_6', bossTrackId: 'boss_elite' },
  { zoneId: 7, trackId: 'zone_7', bossTrackId: 'boss_elite' },
  { zoneId: 8, trackId: 'zone_8', bossTrackId: 'boss_elite' },
  { zoneId: 9, trackId: 'zone_9', bossTrackId: 'boss_final' },
];

// ── SPECIAL BOSS OVERRIDES ────────────────────────────────────────────────────
// Override music for specific stages or special encounters.

export const BOSS_MUSIC_OVERRIDES: BossMusicOverrideDef[] = [
  // Example: Stage 100 has a special boss theme
  { stage: 100, trackId: 'boss_elite' },
  // Example: Stage 500 (zone 0 final boss) has special music
  { stage: 500, trackId: 'boss_final' },
  // Example: All zone 9 bosses use final boss theme
  { zoneId: 9, trackId: 'boss_final' },
];

// ── AUDIO SETTINGS ────────────────────────────────────────────────────────────

export const AUDIO_CONFIG = {
  /** Default master volume (0-1) */
  defaultMasterVolume: 0.5,
  /** Default BGM volume multiplier (0-1) */
  defaultBgmVolume: 0.7,
  /** Default SFX volume multiplier (0-1) */
  defaultSfxVolume: 1.0,
  /** Default fade duration in ms */
  defaultFadeMs: 500,
  /** Whether audio is enabled by default */
  defaultEnabled: true,
  /** Track to play on main menu / login */
  menuTrackId: 'main_theme',
  /** Track to play in shop screen */
  shopTrackId: 'shop',
  /** Fallback track if zone track not found */
  fallbackTrackId: 'main_theme',
} as const;

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Get track definition by id
 */
export function getTrack(trackId: string): MusicTrackDef | undefined {
  return MUSIC_TRACKS.find(t => t.id === trackId);
}

/**
 * Get the music track for a given zone
 */
export function getZoneTrack(zoneId: number): MusicTrackDef | undefined {
  const zoneMusic = ZONE_MUSIC.find(zm => zm.zoneId === zoneId);
  if (!zoneMusic) return getTrack(AUDIO_CONFIG.fallbackTrackId);
  return getTrack(zoneMusic.trackId);
}

/**
 * Get the boss music track for a given zone/stage
 */
export function getBossTrack(zoneId: number, stage?: number): MusicTrackDef | undefined {
  // Check stage-specific overrides first
  if (stage !== undefined) {
    const stageOverride = BOSS_MUSIC_OVERRIDES.find(o => o.stage === stage);
    if (stageOverride) return getTrack(stageOverride.trackId);
  }
  
  // Check zone-specific overrides
  const zoneOverride = BOSS_MUSIC_OVERRIDES.find(o => o.zoneId === zoneId && o.stage === undefined);
  if (zoneOverride) return getTrack(zoneOverride.trackId);
  
  // Fall back to zone's default boss track
  const zoneMusic = ZONE_MUSIC.find(zm => zm.zoneId === zoneId);
  if (zoneMusic?.bossTrackId) return getTrack(zoneMusic.bossTrackId);
  
  // Ultimate fallback
  return getTrack('boss_generic');
}
