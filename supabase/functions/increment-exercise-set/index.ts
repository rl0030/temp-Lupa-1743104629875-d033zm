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
    const { exerciseCategory } = await req.json()

    if (!exerciseCategory) {
      return new Response(
        JSON.stringify({ error: 'Exercise category is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First, check if there's an entry for this user and category
    const { data: existingSet, error: fetchError } = await supabaseClient
      .from('user_exercise_sets')
      .select('count')
      .eq('user_id', user.id)
      .eq('exercise_category', exerciseCategory)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let count = 1
    if (existingSet) {
      // Update existing record
      count = existingSet.count + 1
      const { error: updateError } = await supabaseClient
        .from('user_exercise_sets')
        .update({ 
          count,
          updated_at: new Date()
        })
        .eq('user_id', user.id)
        .eq('exercise_category', exerciseCategory)

      if (updateError) {
        throw updateError
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseClient
        .from('user_exercise_sets')
        .insert({
          user_id: user.id,
          exercise_category: exerciseCategory,
          count
        })

      if (insertError) {
        throw insertError
      }
    }

    // Check if this increment should trigger a new achievement
    await checkAndCreateAchievement(supabaseClient, user.id, exerciseCategory, count)

    return new Response(
      JSON.stringify({ success: true, count }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function checkAndCreateAchievement(supabase, userId, category, count) {
  // Get the achievement requirements
  // This is a simplified version - in a real app, you'd have a table of requirements
  const requirements = [
    { tier: 1, name: "Bronze", requiredSets: 5 },
    { tier: 2, name: "Silver", requiredSets: 25 },
    { tier: 3, name: "Gold", requiredSets: 75 },
    { tier: 4, name: "Platinum", requiredSets: 250 },
    { tier: 5, name: "Amethyst", requiredSets: 750 },
    { tier: 6, name: "Sapphire", requiredSets: 1500 },
    { tier: 7, name: "Diamond", requiredSets: 3500 },
    { tier: 8, name: "Onyx", requiredSets: 6500 }
  ]

  // Find the highest tier the user has achieved
  const { data: achievements } = await supabase
    .from('achievements')
    .select('tier')
    .eq('user_id', userId)
    .eq('exercise_category', category)
    .order('tier', { ascending: false })
    .limit(1)

  const currentTier = achievements && achievements.length > 0 ? achievements[0].tier : 0
  
  // Find the next tier the user can achieve
  const nextTierRequirement = requirements.find(req => req.tier > currentTier && count >= req.requiredSets)
  
  if (nextTierRequirement) {
    // Create a new achievement
    await supabase
      .from('achievements')
      .insert({
        uid: `${userId}_${category}_${nextTierRequirement.tier}`,
        user_id: userId,
        exercise_category: category,
        tier: nextTierRequirement.tier,
        current_sets: count,
        achieved_at: new Date()
      })
      
    // Update the user's progress
    await updateUserProgress(supabase, userId, category, count, nextTierRequirement.tier)
  } else {
    // Just update the progress
    await updateUserProgress(supabase, userId, category, count, currentTier)
  }
}

async function updateUserProgress(supabase, userId, category, count, currentTier) {
  // Find the next tier requirement
  const nextTier = currentTier + 1
  
  // Get the requirements for the next tier (simplified)
  const setsForNextTier = nextTier * 25 // This is a simplification
  const setsToNextTier = Math.max(0, setsForNextTier - count)
  
  // Update or insert the progress
  await supabase
    .from('user_achievement_progress')
    .upsert({
      user_id: userId,
      exercise_category: category,
      current_tier: currentTier,
      current_sets: count,
      next_tier: nextTier,
      sets_to_next_tier: setsToNextTier,
      updated_at: new Date()
    })
}