// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { packId } = await req.json()

    if (!packId) {
      return new Response(
        JSON.stringify({ error: 'Pack ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the pack
    const { data: pack, error: packError } = await supabaseClient
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single()

    if (packError) {
      throw packError
    }

    // Check if the user is in the pending invites
    if (!pack.pending_invites.includes(user.id)) {
      return new Response(
        JSON.stringify({ error: 'User is not invited to this pack' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update the pack
    const updatedPendingInvites = pack.pending_invites.filter((uid: string) => uid !== user.id)
    const updatedMembers = [...pack.members, user.id]
    
    const { error: updateError } = await supabaseClient
      .from('packs')
      .update({
        pending_invites: updatedPendingInvites,
        members: updatedMembers,
        is_live: updatedPendingInvites.length === 0 ? true : pack.is_live,
        updated_at: new Date()
      })
      .eq('id', packId)

    if (updateError) {
      throw updateError
    }

    // Create notifications
    if (updatedPendingInvites.length === 0 && !pack.is_live) {
      // Pack is now live, notify all members
      for (const memberUid of updatedMembers) {
        await supabaseClient
          .from('notifications')
          .insert({
            receiver: memberUid,
            type: 'PACK_LIVE',
            message: `Your pack ${pack.name} is now live!`,
            created_at: new Date(),
            is_read: false
          })
      }
    } else {
      // Notify existing members about the new member
      for (const memberUid of pack.members) {
        await supabaseClient
          .from('notifications')
          .insert({
            receiver: memberUid,
            type: 'PACK_MEMBER_JOINED',
            message: `A new member has joined your pack ${pack.name}`,
            created_at: new Date(),
            is_read: false
          })
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})