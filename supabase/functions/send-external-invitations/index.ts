// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

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
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the auth context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Parse the request body
    const { packName, inviter, invitees, inviterDocId, packId, headerInformation } = await req.json()

    if (!packName || !inviter || !invitees || !inviterDocId || !packId || !headerInformation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Set up SMTP client
    const client = new SmtpClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOSTNAME") || "",
        port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USERNAME") || "",
          password: Deno.env.get("SMTP_PASSWORD") || "",
        },
      },
    })

    // Send emails to invitees
    const results = []
    for (const invitee of invitees) {
      try {
        if (!invitee.email) {
          results.push({ success: false, email: invitee.email, error: 'Email is required' })
          continue
        }

        // Update the pack's external invites
        const { error: updateError } = await supabaseClient
          .from('packs')
          .update({
            external_invites: [...(packData?.external_invites || []), { email: invitee.email.toLowerCase(), status: 'pending' }]
          })
          .eq('id', packId)

        if (updateError) {
          throw updateError
        }

        // Send the email
        await client.send({
          from: Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lupa.com",
          to: invitee.email,
          subject: `${inviter} has invited you to join a pack on Lupa`,
          content: `
            <html>
              <body>
                <h1>You've been invited to join a pack on Lupa!</h1>
                <p>${inviter} has invited you to join the pack "${packName}".</p>
                <p>Download the Lupa app to accept this invitation:</p>
                <p><a href="https://apps.apple.com/us/app/lupa-health/id1501904877">Download on iOS</a></p>
                <p>Once you've created an account, you'll be able to join the pack.</p>
              </body>
            </html>
          `,
          html: true,
        })

        results.push({ success: true, email: invitee.email })
      } catch (error) {
        results.push({ success: false, email: invitee.email, error: error.message })
      }
    }

    await client.close()

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})