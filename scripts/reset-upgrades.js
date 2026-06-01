import { createClient } from '@supabase/supabase-js';

/**
 * Script to reset all player upgrades due to balance rebalancing
 * Run this once after deploying the new balance config
 * 
 * Usage: node scripts/reset-upgrades.js
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

async function resetUpgrades() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[RESET] Starting upgrade reset...');

  try {
    // Get all player saves
    const { data: saves, error: fetchError } = await supabase
      .from('player_saves')
      .select('id, user_id, save_data');

    if (fetchError) {
      console.error('[ERROR] Failed to fetch player saves:', fetchError);
      return;
    }

    if (!saves || saves.length === 0) {
      console.log('[INFO] No player saves found');
      return;
    }

    console.log(`[INFO] Found ${saves.length} player saves to reset`);

    let resetCount = 0;

    // Reset each player's upgrades
    for (const save of saves) {
      const saveData = typeof save.save_data === 'string' 
        ? JSON.parse(save.save_data) 
        : save.save_data;

      // Reset hero upgrades and components
      const resetData = {
        ...saveData,
        heroUpgrades: {},        // Empty hero upgrades
        skillUpgrades: {},       // Empty skill upgrades
        components: [],          // Empty components array
      };

      const { error: updateError } = await supabase
        .from('player_saves')
        .update({ save_data: resetData })
        .eq('id', save.id);

      if (updateError) {
        console.error(`[ERROR] Failed to reset user ${save.user_id}:`, updateError);
      } else {
        resetCount++;
        console.log(`[SUCCESS] Reset user ${save.user_id}`);
      }
    }

    console.log(`[COMPLETE] Reset ${resetCount}/${saves.length} player saves`);
  } catch (error) {
    console.error('[FATAL ERROR]:', error);
    process.exit(1);
  }
}

resetUpgrades();
