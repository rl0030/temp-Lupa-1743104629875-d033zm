// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Parse the request body
    const { paymentIntentId, transferInfo, metadata, latest_charge } = await req.json()

    if (!paymentIntentId || !transferInfo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the payment intent to verify it's succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Payment intent has not succeeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a transfer to the seller
    const sellerTransfer = await stripe.transfers.create({
      amount: transferInfo.amount,
      currency: 'usd',
      destination: transferInfo.sellerId,
      transfer_group: transferInfo.transferGroup,
      source_transaction: latest_charge || paymentIntent.latest_charge,
      metadata: {
        ...metadata,
        payout_text: metadata.payout_text || `Payment for product ${metadata.product_uid}`,
      },
    })

    // Calculate platform amount
    const platformAmount = paymentIntent.amount - transferInfo.amount

    return new Response(
      JSON.stringify({
        sellerTransfer,
        platformAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})