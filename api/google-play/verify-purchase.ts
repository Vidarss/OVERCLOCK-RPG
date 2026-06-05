import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Google Play purchase
// Documentation: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, purchaseToken, productId, packageName } = req.body;

    if (!userId || !purchaseToken || !productId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production, you would verify the purchase with Google Play API
    // For now, we'll trust the client (you should implement server-side verification)
    // 
    // To verify, use Google Play Developer API:
    // GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}
    //
    // This requires OAuth2 authentication with a service account that has access to the Google Play Console

    const googlePlayVerificationEnabled = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
    
    if (googlePlayVerificationEnabled) {
      // TODO: Implement Google Play verification
      // const verified = await verifyGooglePlayPurchase(packageName, productId, purchaseToken);
      // if (!verified) {
      //   return res.status(400).json({ error: 'Invalid purchase' });
      // }
    }

    // Record the purchase in the database
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: userId,
      product_id: productId,
      product_type: 'battle_pass',
      google_play_purchase_token: purchaseToken,
      google_play_package_name: packageName || 'com.overclock.exe',
      amount_cents: 799, // $7.99
      currency: 'usd',
      status: 'completed',
      platform: 'google_play',
      purchased_at: new Date().toISOString(),
    });

    if (purchaseError) {
      console.error('Failed to record purchase:', purchaseError);
      return res.status(500).json({ error: 'Failed to record purchase' });
    }

    // Update the battle_pass table to mark user as premium
    const { error: bpError } = await supabase
      .from('battle_pass')
      .upsert({
        user_id: userId,
        season_id: 'season_1',
        is_premium: true,
        purchase_date: Date.now(),
      }, {
        onConflict: 'user_id,season_id',
      });

    if (bpError) {
      console.error('Failed to update battle pass:', bpError);
      return res.status(500).json({ error: 'Failed to update battle pass' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Google Play verification error:', error);
    return res.status(500).json({ error: 'Failed to verify purchase' });
  }
}
