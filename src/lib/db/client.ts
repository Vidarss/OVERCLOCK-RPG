// ─────────────────────────────────────────────────────────────────────────────
// Database Client Factory
//
// Creates and manages the Supabase client instance. Supports lazy initialization
// and client recreation with new configurations.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type DatabaseConfig, DEFAULT_DB_CONFIG, validateConfig, isConfigValid } from './config';

let clientInstance: SupabaseClient | null = null;
let currentConfig: DatabaseConfig | null = null;

/**
 * Get or create the Supabase client singleton.
 * Lazily initializes on first call using the default configuration.
 * Throws a helpful error if env vars are not configured.
 */
export function getClient(): SupabaseClient {
  if (!clientInstance) {
    if (!isConfigValid(DEFAULT_DB_CONFIG)) {
      console.warn('[v0] Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      // Still attempt to create - validation will throw with detailed error
    }
    clientInstance = createClientFromConfig(DEFAULT_DB_CONFIG);
    currentConfig = DEFAULT_DB_CONFIG;
  }
  return clientInstance;
}

/**
 * Create a new Supabase client with the given configuration.
 * Does not affect the singleton - use initializeClient() for that.
 */
export function createClientFromConfig(config: DatabaseConfig): SupabaseClient {
  validateConfig(config);
  
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: config.auth.autoRefreshToken,
      persistSession: config.auth.persistSession,
      detectSessionInUrl: config.auth.detectSessionInUrl,
    },
  });
}

/**
 * Initialize or reinitialize the singleton client with a new configuration.
 * Returns the new client instance.
 */
export function initializeClient(config: DatabaseConfig): SupabaseClient {
  // Clean up existing client if any
  if (clientInstance) {
    // Remove all channels to clean up realtime subscriptions
    clientInstance.removeAllChannels();
  }
  
  clientInstance = createClientFromConfig(config);
  currentConfig = config;
  
  return clientInstance;
}

/**
 * Get the current configuration being used by the client.
 * Returns null if client hasn't been initialized yet.
 */
export function getCurrentConfig(): DatabaseConfig | null {
  return currentConfig;
}

/**
 * Check if the client has been initialized.
 */
export function isInitialized(): boolean {
  return clientInstance !== null;
}

/**
 * Reset the client singleton (primarily for testing).
 */
export function resetClient(): void {
  if (clientInstance) {
    clientInstance.removeAllChannels();
    clientInstance = null;
    currentConfig = null;
  }
}
