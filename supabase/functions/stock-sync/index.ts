import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockSyncRequest {
  masterListingId: string;
  newStock: number;
  sourceMarketplace: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Use authenticated user ID instead of client-provided userId
    const userId = user.id;
    console.log(`Stock sync initiated by user: ${userId}`);

    const { masterListingId, newStock, sourceMarketplace }: Omit<StockSyncRequest, 'userId'> = await req.json();

    console.log(`Starting stock sync for master listing ${masterListingId}, new stock: ${newStock}`);

    // Get all marketplace products for this master listing
    const { data: marketplaceProducts, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('*, marketplace_connections(*)')
      .eq('master_listing_id', masterListingId);

    if (fetchError) throw fetchError;

    const results: any[] = [];

    for (const product of marketplaceProducts || []) {
      const connection = product.marketplace_connections as any;
      if (!connection || !connection.is_active) continue;

      const marketplace = connection.marketplace as string;
      if (marketplace === sourceMarketplace) continue;

      const specificData = (product.marketplace_specific_data || {}) as Record<string, any>;
      const previousStock = specificData.stock || 0;

      console.log(`Syncing stock to ${marketplace}, product: ${product.remote_product_id}`);

      try {
        // Determine the correct sync function
        const functionName = `${marketplace}-sync`;
        
        const { data: syncData, error: syncError } = await supabase.functions.invoke(functionName, {
          body: {
            action: 'update_product',
            connectionId: connection.id,
            productId: product.remote_product_id,
            updates: { stock: newStock },
          },
        });

        if (syncError) throw syncError;

        // Update local marketplace product
        await supabase
          .from('marketplace_products')
          .update({
            marketplace_specific_data: {
              ...specificData,
              stock: newStock,
            },
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
          })
          .eq('id', product.id);

        // Log the sync
        await supabase.from('stock_sync_logs').insert({
          user_id: userId,
          master_listing_id: masterListingId,
          source_marketplace: sourceMarketplace,
          target_marketplace: marketplace,
          previous_stock: previousStock,
          new_stock: newStock,
          sync_status: 'success',
        });

        results.push({
          marketplace,
          success: true,
          previousStock,
          newStock,
        });
      } catch (error: any) {
        console.error(`Stock sync failed for ${marketplace}:`, error);

        // Log the failed sync
        await supabase.from('stock_sync_logs').insert({
          user_id: userId,
          master_listing_id: masterListingId,
          source_marketplace: sourceMarketplace,
          target_marketplace: marketplace,
          previous_stock: previousStock,
          new_stock: newStock,
          sync_status: 'failed',
          error_message: error.message,
        });

        results.push({
          marketplace,
          success: false,
          error: error.message,
        });
      }
    }

    // Update master listing total stock
    await supabase
      .from('master_listings')
      .update({ total_stock: newStock })
      .eq('id', masterListingId);

    console.log(`Stock sync completed. Results:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stock sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
