import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Battle Pass product - the only product we sell
const BATTLE_PASS_PRODUCT = {
  id: 'battle_pass_season_1',
  name: 'OVERCLOCK PROTOCOL - Season 1 Battle Pass',
  description: 'Unlock 50 premium tiers of rewards including exclusive cosmetics, XP boosts, and currencies.',
  priceInCents: 799, // $7.99
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: BATTLE_PASS_PRODUCT.name,
              description: BATTLE_PASS_PRODUCT.description,
            },
            unit_amount: BATTLE_PASS_PRODUCT.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId,
        productId: BATTLE_PASS_PRODUCT.id,
        productType: 'battle_pass',
      },
    });

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
