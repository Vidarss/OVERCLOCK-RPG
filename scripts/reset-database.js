/**
 * Reset all data from database tables (without dropping tables)
 * Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/reset-database.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to clear (in order to respect foreign key constraints)
const TABLES_TO_CLEAR = [
  'daily_challenges',
  'clan_members',
  'clan_chat_messages', 
  'clans',
  'player_saves',
  'leaderboard',
  'profiles',
];

async function resetDatabase() {
  console.log('=== RESETTING DATABASE DATA ===\n');
  
  for (const table of TABLES_TO_CLEAR) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (dummy condition)
      
      if (error) {
        // Try alternative delete for tables without 'id' column
        const { error: error2 } = await supabase
          .from(table)
          .delete()
          .gte('created_at', '1970-01-01');
        
        if (error2) {
          console.log(`[SKIP] ${table}: ${error2.message}`);
        } else {
          console.log(`[OK] ${table}: Cleared`);
        }
      } else {
        console.log(`[OK] ${table}: Cleared`);
      }
    } catch (err) {
      console.log(`[SKIP] ${table}: ${err.message}`);
    }
  }
  
  console.log('\n=== DATABASE RESET COMPLETE ===');
}

resetDatabase();
