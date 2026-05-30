// ─────────────────────────────────────────────────────────────────────────────
// Database Module Index
//
// Re-exports all database functionality from a single entry point.
// Import from '@/lib/db' or '../lib/db' for all database operations.
// ─────────────────────────────────────────────────────────────────────────────

// Configuration
export {
  type DatabaseConfig,
  DEFAULT_DB_CONFIG,
  createDatabaseConfig,
  validateConfig,
} from './config';

// Client management
export {
  getClient,
  createClientFromConfig,
  initializeClient,
  getCurrentConfig,
  isInitialized,
  resetClient,
} from './client';

// Query utilities
export {
  type QueryResult,
  type QueryManyResult,
  loadOne,
  loadMany,
  upsert,
  insert,
  update,
  remove,
  rpc,
} from './queries';

// Authentication
export {
  type AuthResult,
  type AuthStateChange,
  signUp,
  signIn,
  signOut,
  getSession,
  getUser,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from './auth';

// Realtime
export {
  type PresencePayload,
  type PresenceState,
  type RealtimeSubscription,
  createPresenceChannel,
  subscribeToTable,
  createBroadcastChannel,
} from './realtime';

// Legacy compatibility - export the client getter as 'supabase' for gradual migration
export { getClient as supabase } from './client';
