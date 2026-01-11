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

    // SECURITY: Require authentication - reject requests without valid auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid auth token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // Fetch active marketplace connections for authenticated user only
    const query = supabase
      .from('marketplace_connections')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', userId);

    const { data: connections, error: connError } = await query;

    if (connError) {
      console.error('Error fetching connections:', connError);
      throw connError;
    }

    console.log(`Found ${connections?.length || 0} active connections to sync`);

    const results: Array<{ marketplace: string; success: boolean; ordersCount?: number; error?: string }> = [];

    // Process each connection
    for (const connection of connections || []) {
      try {
        console.log(`Syncing orders for ${connection.marketplace}...`);

        // Call the appropriate sync function for each marketplace
        const functionName = `${connection.marketplace}-sync`;
        
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: {
            connectionId: connection.id,
            action: 'sync_orders',
          },
        });

        if (error) {
          console.error(`Error syncing ${connection.marketplace}:`, error);
          results.push({
            marketplace: connection.marketplace,
            success: false,
            error: error.message,
          });
        } else {
          // Update last_sync_at
          await supabase
            .from('marketplace_connections')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', connection.id);

          results.push({
            marketplace: connection.marketplace,
            success: true,
            ordersCount: data?.ordersCount || 0,
          });
        }
      } catch (err) {
        console.error(`Exception syncing ${connection.marketplace}:`, err);
        results.push({
          marketplace: connection.marketplace,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Sync completed: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${successCount}/${results.length} marketplaces`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-all-orders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
