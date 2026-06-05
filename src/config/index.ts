// ══════════════════════════════════════════════════════════════════════════════
// OVERCLOCK CONFIG INDEX
// ══════════════════════════════════════════════════════════════════════════════
//
// Central export for all game configuration.
// Import from here for cleaner imports throughout the codebase.
//
// Usage:
//   import { ZONE_CONFIG, INVENTORY_CONFIG, isPluginEnabled } from '@/config';
//
// ══════════════════════════════════════════════════════════════════════════════

// ── Game Config (main) ────────────────────────────────────────────────────────
export * from './game.config';

// ── Audio Config ──────────────────────────────────────────────────────────────
export * from './audio.config';

// ── Plugin Config ─────────────────────────────────────────────────────────────
export * from './plugins.config';

// ── Assets Config ─────────────────────────────────────────────────────────────
export * from './assets.config';

// ── Modules Config ────────────────────────────────────────────────────────────
export * from './modules.config';
