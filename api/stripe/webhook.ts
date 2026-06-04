import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body for signature verification
  },
};

async function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, productId, productType } = session.metadata || {};

      if (productType === 'battle_pass' && userId) {
        // Record the purchase in the database
        const { error } = await supabase.from('purchases').insert({
          user_id: userId,
          product_id: productId,
          product_type: productType,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          amount_cents: session.amount_total,
          currency: session.currency,
          status: 'completed',
          purchased_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Failed to record purchase:', error);
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
        }

        console.log(`Battle Pass purchased for user: ${userId}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
