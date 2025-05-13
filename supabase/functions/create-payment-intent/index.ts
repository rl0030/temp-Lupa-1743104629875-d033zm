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
    const { price, product_uid, metadata, seller_id, platform_percentage } = await req.json()

    if (!price || !product_uid || !seller_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Convert price to cents for Stripe
    const amountInCents = Math.round(price * 100)
    
    // Calculate platform and seller amounts
    const platformPercentage = platform_percentage || 3
    const platformAmount = Math.round((amountInCents * platformPercentage) / 100)
    const sellerAmount = amountInCents - platformAmount

    // Create a transfer group ID
    const transferGroup = `group_${Date.now()}`

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product_uid,
        ...metadata,
      },
      transfer_group: transferGroup,
    })

    // Prepare transfer info for the client
    const transferInfo = {
      amount: sellerAmount,
      sellerId: seller_id,
      platformPercentage,
      transferGroup,
    }

    return new Response(
      JSON.stringify({
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
        },
        transferInfo,
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