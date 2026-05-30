// ─────────────────────────────────────────────────────────────────────────────
// Database Configuration
//
// Central configuration for all database settings. Change connection details,
// timeouts, and behavior here without modifying any other files.
// ─────────────────────────────────────────────────────────────────────────────

export interface DatabaseConfig {
  /** Supabase project URL */
  url: string;
  /** Supabase anonymous/public key */
  anonKey: string;
  /** Auth configuration */
  auth: {
    autoRefreshToken: boolean;
    persistSession: boolean;
    detectSessionInUrl: boolean;
  };
  /** Query defaults */
  query: {
    /** Default timeout for queries in milliseconds */
    timeoutMs: number;
    /** Number of retries for failed queries */
    retryCount: number;
    /** Delay between retries in milliseconds */
    retryDelayMs: number;
  };
  /** Realtime configuration */
  realtime: {
    /** Enable realtime subscriptions */
    enabled: boolean;
    /** Presence channel name */
    presenceChannel: string;
  };
}

/**
 * Resolves environment variables with fallback priority:
 * NEXT_PUBLIC_ (Vercel) > VITE_ (local dev)
 */
function getEnvVar(nextPublicKey: string, viteKey: string): string {
  // Check for Next.js/Vercel env vars first
  if (typeof process !== 'undefined' && process.env) {
    const nextVal = process.env[nextPublicKey];
    if (nextVal) return nextVal;
  }
  
  // Check for Vite env vars
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const nextVal = import.meta.env[nextPublicKey];
    if (nextVal) return nextVal;
    
    const viteVal = import.meta.env[viteKey];
    if (viteVal) return viteVal;
  }
  
  return '';
}

/**
 * Default database configuration.
 * Override specific values by passing a partial config to createDatabaseConfig().
 */
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Disable automatic detection of session from URL (prevents reloads on tab switch)
    detectSessionInUrl: false,
  },
  query: {
    timeoutMs: 10000,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  realtime: {
    enabled: true,
    presenceChannel: 'online_players',
  },
};

/**
 * Create a database configuration by merging overrides with defaults.
 */
export function createDatabaseConfig(overrides?: Partial<DatabaseConfig>): DatabaseConfig {
  if (!overrides) return DEFAULT_DB_CONFIG;
  
  return {
    ...DEFAULT_DB_CONFIG,
    ...overrides,
    auth: {
      ...DEFAULT_DB_CONFIG.auth,
      ...overrides.auth,
    },
    query: {
      ...DEFAULT_DB_CONFIG.query,
      ...overrides.query,
    },
    realtime: {
      ...DEFAULT_DB_CONFIG.realtime,
      ...overrides.realtime,
    },
  };
}

/**
 * Check if the configuration has valid connection details.
 * Returns true if URL and key are present and valid.
 */
export function isConfigValid(config: DatabaseConfig): boolean {
  if (!config.url || !config.anonKey) return false;
  if (!config.url.includes('supabase')) return false;
  // Accept both JWT format (eyJ...) and Supabase marketplace format (sb_publishable_...)
  if (!config.anonKey.startsWith('eyJ') && !config.anonKey.startsWith('sb_')) return false;
  return true;
}

/**
 * Validate configuration and throw descriptive errors if invalid.
 * Only call this when you actually need to use the database.
 */
export function validateConfig(config: DatabaseConfig): void {
  const errors: string[] = [];
  
  if (!config.url) {
    errors.push('Missing database URL. Set NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL in your environment.');
  } else if (!config.url.includes('supabase')) {
    errors.push(`Invalid database URL: "${config.url}". Expected a Supabase URL.`);
  }
  
  if (!config.anonKey) {
    errors.push('Missing database anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY in your environment.');
  } else if (!config.anonKey.startsWith('eyJ') && !config.anonKey.startsWith('sb_')) {
    errors.push('Invalid anon key format. Expected a JWT token (eyJ...) or Supabase marketplace key (sb_...).');
  }
  
  if (config.query.timeoutMs < 1000) {
    errors.push('Query timeout must be at least 1000ms.');
  }
  
  if (config.query.retryCount < 0) {
    errors.push('Retry count cannot be negative.');
  }
  
  if (errors.length > 0) {
    const message = `Database configuration invalid:\n  - ${errors.join('\n  - ')}\n\nMake sure your Supabase environment variables are set.`;
    console.error('[v0] Database config error:', message);
    throw new Error(message);
  }
}
