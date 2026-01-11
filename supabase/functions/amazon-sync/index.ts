import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmazonCredentials {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  sellerId: string;
  marketplaceId?: string;
}

interface ProductData {
  sku: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  condition?: string;
  asin?: string;
}

// Amazon SP-API endpoints
const AMAZON_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const AMAZON_SP_API_BASE = "https://sellingpartnerapi-eu.amazon.com";
const TURKEY_MARKETPLACE_ID = "A33AVAJ2PDY3EV"; // Amazon.com.tr

async function getAccessToken(credentials: AmazonCredentials): Promise<{ token: string | null; error: string | null }> {
  try {
    const response = await fetch(AMAZON_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amazon token error:", response.status, errorText);
      return { token: null, error: 'Token alınamadı, kimlik bilgilerinizi kontrol edin' };
    }

    const data = await response.json();
    return { token: data.access_token, error: null };
  } catch (error: any) {
    console.error("Amazon token exception:", error);
    return { token: null, error: error.message };
  }
}

async function testConnection(credentials: AmazonCredentials): Promise<{ success: boolean; error?: string }> {
  const { token, error } = await getAccessToken(credentials);
  if (error) {
    return { success: false, error };
  }

  try {
    const marketplaceId = credentials.marketplaceId || TURKEY_MARKETPLACE_ID;
    const response = await fetch(
      `${AMAZON_SP_API_BASE}/sellers/v1/marketplaceParticipations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-amz-access-token": token!,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amazon marketplace check error:", response.status, errorText);
      return { success: false, error: 'Bağlantı doğrulanamadı, kimlik bilgilerinizi kontrol edin' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function fetchProducts(credentials: AmazonCredentials): Promise<any[]> {
  const { token, error } = await getAccessToken(credentials);
  if (error || !token) {
    throw new Error(error || "Token alınamadı");
  }

  const marketplaceId = credentials.marketplaceId || TURKEY_MARKETPLACE_ID;
  const products: any[] = [];
  let nextToken: string | null = null;

  do {
    const params = new URLSearchParams({
      marketplaceIds: marketplaceId,
      maxResultsPerPage: "50",
    });
    if (nextToken) {
      params.append("nextToken", nextToken);
    }

    const response = await fetch(
      `${AMAZON_SP_API_BASE}/listings/2021-08-01/items/${credentials.sellerId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-amz-access-token": token,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amazon fetch products error:", errorText);
      break;
    }

    const data = await response.json();
    if (data.items) {
      products.push(...data.items);
    }
    nextToken = data.nextToken || null;
  } while (nextToken);

  return products;
}

async function fetchOrders(credentials: AmazonCredentials, createdAfter?: string): Promise<any[]> {
  const { token, error } = await getAccessToken(credentials);
  if (error || !token) {
    throw new Error(error || "Token alınamadı");
  }

  const marketplaceId = credentials.marketplaceId || TURKEY_MARKETPLACE_ID;
  const orders: any[] = [];
  let nextToken: string | null = null;

  // Default to last 30 days if not specified
  const afterDate = createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  do {
    const params = new URLSearchParams({
      MarketplaceIds: marketplaceId,
      CreatedAfter: afterDate,
      MaxResultsPerPage: "100",
    });
    if (nextToken) {
      params.append("NextToken", nextToken);
    }

    const response = await fetch(
      `${AMAZON_SP_API_BASE}/orders/v0/orders?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-amz-access-token": token,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amazon fetch orders error:", errorText);
      break;
    }

    const data = await response.json();
    if (data.payload?.Orders) {
      for (const order of data.payload.Orders) {
        // Fetch order items
        const itemsResponse = await fetch(
          `${AMAZON_SP_API_BASE}/orders/v0/orders/${order.AmazonOrderId}/orderItems`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-amz-access-token": token,
            },
          }
        );

        let items: any[] = [];
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          items = itemsData.payload?.OrderItems || [];
        }

        orders.push({
          id: order.AmazonOrderId,
          orderNumber: order.AmazonOrderId,
          status: mapOrderStatus(order.OrderStatus),
          customerName: order.BuyerInfo?.BuyerName || null,
          customerEmail: order.BuyerInfo?.BuyerEmail || null,
          shippingAddress: order.ShippingAddress || {},
          items: items.map((item: any) => ({
            title: item.Title,
            sku: item.SellerSKU,
            quantity: item.QuantityOrdered,
            unit_price: parseFloat(item.ItemPrice?.Amount || 0),
            total_price: parseFloat(item.ItemPrice?.Amount || 0) * item.QuantityOrdered,
          })),
          subtotal: parseFloat(order.OrderTotal?.Amount || 0),
          total: parseFloat(order.OrderTotal?.Amount || 0),
          currency: order.OrderTotal?.CurrencyCode || "TRY",
          orderDate: order.PurchaseDate,
          marketplaceData: order,
        });
      }
    }
    nextToken = data.payload?.NextToken || null;
  } while (nextToken);

  return orders;
}

function mapOrderStatus(amazonStatus: string): string {
  const statusMap: Record<string, string> = {
    Pending: "pending",
    Unshipped: "processing",
    PartiallyShipped: "processing",
    Shipped: "shipped",
    Delivered: "delivered",
    Canceled: "cancelled",
    Unfulfillable: "cancelled",
  };
  return statusMap[amazonStatus] || "pending";
}

async function createProduct(credentials: AmazonCredentials, product: ProductData): Promise<any> {
  const { token, error } = await getAccessToken(credentials);
  if (error || !token) {
    throw new Error(error || "Token alınamadı");
  }

  const marketplaceId = credentials.marketplaceId || TURKEY_MARKETPLACE_ID;

  const listingData = {
    productType: "PRODUCT",
    requirements: "LISTING",
    attributes: {
      condition_type: [{ value: product.condition || "new_new" }],
      item_name: [{ value: product.title, language_tag: "tr_TR" }],
      merchant_suggested_asin: product.asin ? [{ value: product.asin }] : undefined,
      fulfillment_availability: [
        {
          fulfillment_channel_code: "DEFAULT",
          quantity: product.quantity,
        },
      ],
      purchasable_offer: [
        {
          marketplace_id: marketplaceId,
          currency: "TRY",
          our_price: [{ schedule: [{ value_with_tax: product.price }] }],
        },
      ],
    },
  };

  const response = await fetch(
    `${AMAZON_SP_API_BASE}/listings/2021-08-01/items/${credentials.sellerId}/${product.sku}?marketplaceIds=${marketplaceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-amz-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(listingData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Amazon create product error:", response.status, errorText);
    throw new Error('Ürün oluşturulamadı, lütfen daha sonra tekrar deneyin');
  }

  return await response.json();
}

async function updateProduct(
  credentials: AmazonCredentials,
  sku: string,
  updates: { price?: number; quantity?: number }
): Promise<any> {
  const { token, error } = await getAccessToken(credentials);
  if (error || !token) {
    throw new Error(error || "Token alınamadı");
  }

  const marketplaceId = credentials.marketplaceId || TURKEY_MARKETPLACE_ID;

  const patchOperations: any[] = [];

  if (updates.price !== undefined) {
    patchOperations.push({
      op: "replace",
      path: "/attributes/purchasable_offer",
      value: [
        {
          marketplace_id: marketplaceId,
          currency: "TRY",
          our_price: [{ schedule: [{ value_with_tax: updates.price }] }],
        },
      ],
    });
  }

  if (updates.quantity !== undefined) {
    patchOperations.push({
      op: "replace",
      path: "/attributes/fulfillment_availability",
      value: [
        {
          fulfillment_channel_code: "DEFAULT",
          quantity: updates.quantity,
        },
      ],
    });
  }

  const response = await fetch(
    `${AMAZON_SP_API_BASE}/listings/2021-08-01/items/${credentials.sellerId}/${sku}?marketplaceIds=${marketplaceId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-amz-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productType: "PRODUCT",
        patches: patchOperations,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Amazon update product error:", response.status, errorText);
    throw new Error('Ürün güncellenemedi, lütfen daha sonra tekrar deneyin');
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`Amazon sync initiated by user: ${user.id}`);

    const body = await req.json();
    // Support both 'credentials' and 'directCredentials' parameter names
    const { action, connectionId, directCredentials, credentials: bodyCredentials, ...params } = body;
    const providedCredentials = directCredentials || bodyCredentials;

    let credentials: AmazonCredentials;

    if (connectionId) {
      // Fetch credentials from database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: connection, error } = await supabase
        .from("marketplace_connections")
        .select("credentials")
        .eq("id", connectionId)
        .single();

      if (error || !connection) {
        throw new Error("Bağlantı bulunamadı");
      }

      const creds = connection.credentials as Record<string, any>;
      credentials = {
        refreshToken: creds.refreshToken,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        sellerId: creds.sellerId,
        marketplaceId: creds.marketplaceId || TURKEY_MARKETPLACE_ID,
      };
    } else if (providedCredentials) {
      credentials = providedCredentials as AmazonCredentials;
    } else {
      console.error('Missing credentials: neither connectionId nor directCredentials provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Bağlantı ID veya kimlik bilgileri gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any;

    switch (action) {
      case "test_connection":
      case "check_connection":
        result = await testConnection(credentials);
        break;

      case "fetch_products":
        result = { products: await fetchProducts(credentials) };
        break;

      case "fetch_orders":
        result = { orders: await fetchOrders(credentials, params.createdAfter) };
        break;

      case "create_product":
        result = await createProduct(credentials, params.product);
        break;

      case "update_product":
        result = await updateProduct(credentials, params.sku, params.updates);
        break;

      default:
        throw new Error(`Bilinmeyen action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Amazon sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'İşlem sırasında bir hata oluştu, lütfen daha sonra tekrar deneyin' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
