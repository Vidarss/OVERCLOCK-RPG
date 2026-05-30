// ─────────────────────────────────────────────────────────────────────────────
// Legacy Supabase Client Export
//
// This file provides backward compatibility for existing code that imports
// `supabase` directly. New code should import from '@/lib/db' instead.
//
// Migration guide:
//   OLD: import { supabase } from '../lib/supabase';
//   NEW: import { getClient, loadOne, upsert, ... } from '../lib/db';
// ─────────────────────────────────────────────────────────────────────────────

import { getClient } from './db';

/**
 * @deprecated Use `getClient()` from '@/lib/db' instead.
 * This export exists for backward compatibility during migration.
 */
export const supabase = getClient();
