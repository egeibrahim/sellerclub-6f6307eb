import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication is required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'Invalid token');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Low stock check for user: ${userId}`);

    // Fetch master listings with variants - always filtered by authenticated user
    const { data: listings, error: listingsError } = await supabase
      .from('master_listings')
      .select(`
        id,
        title,
        user_id,
        low_stock_threshold,
        master_listing_variants (
          id,
          name,
          stock
        )
      `)
      .eq('user_id', userId);

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw listingsError;
    }

    let alertsCreated = 0;
    let alertsUpdated = 0;

    for (const listing of listings || []) {
      const threshold = listing.low_stock_threshold || 10;
      const variants = listing.master_listing_variants || [];

      for (const variant of variants) {
        if (variant.stock <= threshold) {
          // Check if alert already exists
          const { data: existingAlert } = await supabase
            .from('low_stock_alerts')
            .select('id')
            .eq('variant_id', variant.id)
            .eq('is_read', false)
            .maybeSingle();

          if (existingAlert) {
            // Update existing alert
            await supabase
              .from('low_stock_alerts')
              .update({
                current_stock: variant.stock,
                created_at: new Date().toISOString(),
              })
              .eq('id', existingAlert.id);
            alertsUpdated++;
          } else {
            // Create new alert
            await supabase
              .from('low_stock_alerts')
              .insert({
                user_id: listing.user_id,
                master_listing_id: listing.id,
                variant_id: variant.id,
                product_title: listing.title,
                variant_name: variant.name,
                current_stock: variant.stock,
                threshold,
              });
            alertsCreated++;
          }
        }
      }
    }

    console.log(`Low stock check completed: ${alertsCreated} created, ${alertsUpdated} updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated,
        alertsUpdated,
        message: `${alertsCreated} new alerts, ${alertsUpdated} updated`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in low-stock-check:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
