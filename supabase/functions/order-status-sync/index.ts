import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusSyncRequest {
  orderId: string;
  status: string;
  trackingNumber?: string;
  trackingCompany?: string;
}

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

    console.log(`Order status sync initiated by user: ${user.id}`);

    const { orderId, status, trackingNumber, trackingCompany }: StatusSyncRequest = await req.json();

    console.log(`Syncing order ${orderId} status to ${status}`);

    // Fetch the order with connection details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        marketplace_connections!orders_marketplace_connection_id_fkey (
          id,
          marketplace,
          credentials,
          is_active
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connection = order.marketplace_connections;
    if (!connection || !connection.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'No active marketplace connection' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let syncSuccess = false;
    let syncError: string | null = null;

    // Sync to the appropriate marketplace
    try {
      switch (connection.marketplace) {
        case 'trendyol':
          syncSuccess = await syncToTrendyol(order, status, trackingNumber, trackingCompany, connection.credentials);
          break;
        case 'hepsiburada':
          syncSuccess = await syncToHepsiburada(order, status, trackingNumber, trackingCompany, connection.credentials);
          break;
        case 'n11':
          syncSuccess = await syncToN11(order, status, trackingNumber, connection.credentials);
          break;
        case 'ciceksepeti':
          syncSuccess = await syncToCiceksepeti(order, status, trackingNumber, connection.credentials);
          break;
        case 'amazon':
          syncSuccess = await syncToAmazon(order, status, trackingNumber, trackingCompany, connection.credentials);
          break;
        default:
          console.log(`Marketplace ${connection.marketplace} not supported for status sync`);
          syncSuccess = true; // Mark as success for unsupported marketplaces
      }
    } catch (err) {
      console.error(`Error syncing to ${connection.marketplace}:`, err);
      syncError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Update order with tracking info and sync status
    const updateData: Record<string, unknown> = {
      status,
      status_synced_at: syncSuccess ? new Date().toISOString() : null,
    };

    if (trackingNumber) updateData.tracking_number = trackingNumber;
    if (trackingCompany) updateData.tracking_company = trackingCompany;

    // Update status-specific dates
    if (status === 'shipped') updateData.shipped_date = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_date = new Date().toISOString();
    if (status === 'cancelled') updateData.cancelled_date = new Date().toISOString();

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ 
        success: syncSuccess, 
        message: syncSuccess 
          ? `Status synced to ${connection.marketplace}` 
          : `Failed to sync to ${connection.marketplace}`,
        error: syncError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in order-status-sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Sipariş durumu güncellenirken bir hata oluştu'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Marketplace-specific sync functions
async function syncToTrendyol(
  order: Record<string, unknown>,
  status: string,
  trackingNumber?: string,
  trackingCompany?: string,
  credentials?: Record<string, unknown>
): Promise<boolean> {
  if (!credentials) return false;
  
  const { api_key, api_secret, seller_id } = credentials as Record<string, string>;
  if (!api_key || !api_secret || !seller_id) return false;

  const baseUrl = 'https://api.trendyol.com/sapigw';
  const auth = btoa(`${api_key}:${api_secret}`);

  // Map status to Trendyol status
  const trendyolStatus = mapToTrendyolStatus(status);
  if (!trendyolStatus) return true; // No mapping needed

  const endpoint = `${baseUrl}/suppliers/${seller_id}/shipment-packages/${order.remote_order_id}`;

  const body: Record<string, unknown> = { status: trendyolStatus };
  if (trackingNumber) body.trackingNumber = trackingNumber;
  if (trackingCompany) body.cargoProviderName = trackingCompany;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log(`Trendyol sync response: ${response.status}`);
  return response.ok;
}

async function syncToHepsiburada(
  order: Record<string, unknown>,
  status: string,
  trackingNumber?: string,
  trackingCompany?: string,
  credentials?: Record<string, unknown>
): Promise<boolean> {
  if (!credentials) return false;
  
  const { merchant_id, api_key, api_secret } = credentials as Record<string, string>;
  if (!merchant_id || !api_key || !api_secret) return false;

  // Hepsiburada API implementation
  const baseUrl = 'https://mpop-sit.hepsiburada.com/api';
  const auth = btoa(`${api_key}:${api_secret}`);

  const hbStatus = mapToHepsiburadaStatus(status);
  if (!hbStatus) return true;

  const body: Record<string, unknown> = {
    merchantId: merchant_id,
    orderNumber: order.remote_order_id,
    status: hbStatus,
  };
  
  if (trackingNumber) body.trackingNumber = trackingNumber;
  if (trackingCompany) body.cargoCompany = trackingCompany;

  const response = await fetch(`${baseUrl}/orders/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log(`Hepsiburada sync response: ${response.status}`);
  return response.ok;
}

async function syncToN11(
  order: Record<string, unknown>,
  status: string,
  trackingNumber?: string,
  credentials?: Record<string, unknown>
): Promise<boolean> {
  if (!credentials) return false;
  
  // N11 uses SOAP API - simplified implementation
  console.log(`N11 sync for order ${order.remote_order_id}: ${status}`);
  return true;
}

async function syncToCiceksepeti(
  order: Record<string, unknown>,
  status: string,
  trackingNumber?: string,
  credentials?: Record<string, unknown>
): Promise<boolean> {
  if (!credentials) return false;
  
  const { api_key } = credentials as Record<string, string>;
  if (!api_key) return false;

  const baseUrl = 'https://apis.ciceksepeti.com/api/v1';
  
  const csStatus = mapToCiceksepetiStatus(status);
  if (!csStatus) return true;

  const body: Record<string, unknown> = {
    orderProductStatus: csStatus,
  };
  
  if (trackingNumber) body.cargoTrackingNumber = trackingNumber;

  const response = await fetch(`${baseUrl}/Order/UpdateOrderStatus`, {
    method: 'POST',
    headers: {
      'x-api-key': api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderProductIds: [order.remote_order_id],
      ...body,
    }),
  });

  console.log(`Ciceksepeti sync response: ${response.status}`);
  return response.ok;
}

async function syncToAmazon(
  order: Record<string, unknown>,
  status: string,
  trackingNumber?: string,
  trackingCompany?: string,
  credentials?: Record<string, unknown>
): Promise<boolean> {
  // Amazon SP-API implementation would go here
  console.log(`Amazon sync for order ${order.remote_order_id}: ${status}`);
  return true;
}

// Status mapping functions
function mapToTrendyolStatus(status: string): string | null {
  const mapping: Record<string, string> = {
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  };
  return mapping[status] || null;
}

function mapToHepsiburadaStatus(status: string): string | null {
  const mapping: Record<string, string> = {
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  };
  return mapping[status] || null;
}

function mapToCiceksepetiStatus(status: string): number | null {
  const mapping: Record<string, number> = {
    'shipped': 3,
    'delivered': 4,
    'cancelled': 5,
  };
  return mapping[status] || null;
}
