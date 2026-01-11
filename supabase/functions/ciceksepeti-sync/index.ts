import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CICEKSEPETI_API_BASE = 'https://apis.ciceksepeti.com';

interface CiceksepetiCredentials {
  api_key: string;
  api_secret: string;
}

interface ProductData {
  title: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  categoryId: string;
  images?: string[];
  barcode?: string;
  deliveryType?: number;
}

// Get auth token from Çiçeksepeti
async function getAuthToken(credentials: CiceksepetiCredentials): Promise<string> {
  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: credentials.api_key,
      apiSecret: credentials.api_secret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Çiçeksepeti auth error:', error);
    throw new Error('Çiçeksepeti kimlik doğrulama başarısız');
  }

  const data = await response.json();
  return data.accessToken || data.token;
}

// Test connection
async function testConnection(credentials: CiceksepetiCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken(credentials);
    
    // Try to fetch seller info to verify connection
    const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/seller/info`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Satıcı bilgisi alınamadı');
    }

    return { success: true };
  } catch (error) {
    console.error('Connection test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return { success: false, error: errorMessage };
  }
}

// Fetch categories
async function fetchCategories(credentials: CiceksepetiCredentials): Promise<any[]> {
  const token = await getAuthToken(credentials);

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch categories error:', error);
    throw new Error('Kategoriler alınamadı');
  }

  const data = await response.json();
  return data.categories || data.data || [];
}

// Fetch category attributes
async function fetchCategoryAttributes(credentials: CiceksepetiCredentials, categoryId: string): Promise<any[]> {
  const token = await getAuthToken(credentials);

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/categories/${categoryId}/attributes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch category attributes error:', error);
    throw new Error('Kategori özellikleri alınamadı');
  }

  const data = await response.json();
  return data.attributes || data.data || [];
}

// Fetch products from Çiçeksepeti store
async function fetchProducts(credentials: CiceksepetiCredentials, page = 1, pageSize = 50): Promise<any[]> {
  const token = await getAuthToken(credentials);

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/products?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch products error:', error);
    throw new Error('Ürünler alınamadı');
  }

  const data = await response.json();
  return data.products || data.data || [];
}

// Create product on Çiçeksepeti
async function createProduct(credentials: CiceksepetiCredentials, product: ProductData): Promise<any> {
  const token = await getAuthToken(credentials);

  const payload = {
    productName: product.title,
    mainProductCode: product.sku || `CS-${Date.now()}`,
    stockCode: product.sku,
    categoryId: parseInt(product.categoryId),
    description: product.description || product.title,
    deliveryType: product.deliveryType || 1, // 1: Kargo, 2: Kurye
    stockQuantity: product.stock,
    salesPrice: product.price,
    listPrice: product.price,
    barcode: product.barcode,
    images: product.images?.map((url, index) => ({
      url,
      isMainImage: index === 0,
      sequence: index + 1,
    })) || [],
  };

  console.log('Creating Çiçeksepeti product:', JSON.stringify(payload));

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Create product error:', response.status, error);
    throw new Error('Ürün oluşturulamadı, lütfen daha sonra tekrar deneyin');
  }

  const data = await response.json();
  return data;
}

// Update product price and stock
async function updateProduct(credentials: CiceksepetiCredentials, productId: string, updates: { price?: number; stock?: number }): Promise<any> {
  const token = await getAuthToken(credentials);

  const payload: any = {};
  
  if (updates.price !== undefined) {
    payload.salesPrice = updates.price;
    payload.listPrice = updates.price;
  }
  
  if (updates.stock !== undefined) {
    payload.stockQuantity = updates.stock;
  }

  console.log('Updating Çiçeksepeti product:', productId, JSON.stringify(payload));

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Update product error:', response.status, error);
    throw new Error('Ürün güncellenemedi, lütfen daha sonra tekrar deneyin');
  }

  const data = await response.json();
  return data;
}

// Bulk update stock
async function bulkUpdateStock(credentials: CiceksepetiCredentials, items: { stockCode: string; quantity: number }[]): Promise<any> {
  const token = await getAuthToken(credentials);

  const payload = {
    items: items.map(item => ({
      stockCode: item.stockCode,
      stockQuantity: item.quantity,
    })),
  };

  console.log('Bulk updating stock:', JSON.stringify(payload));

  const response = await fetch(`${CICEKSEPETI_API_BASE}/api/v1/products/stock/batch`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bulk stock update error:', response.status, error);
    throw new Error('Toplu stok güncellemesi başarısız oldu, lütfen daha sonra tekrar deneyin');
  }

  const data = await response.json();
  return data;
}

// Fetch orders
async function fetchOrders(credentials: CiceksepetiCredentials, startDate?: string, endDate?: string): Promise<any[]> {
  const token = await getAuthToken(credentials);

  let url = `${CICEKSEPETI_API_BASE}/api/v1/orders`;
  const params = new URLSearchParams();
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fetch orders error:', error);
    throw new Error('Siparişler alınamadı');
  }

  const data = await response.json();
  return data.orders || data.data || [];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    console.log(`Ciceksepeti sync initiated by user: ${user.id}`);

    const { action, connectionId, credentials: directCredentials, ...params } = await req.json();

    console.log('Çiçeksepeti sync action:', action);

    let credentials: CiceksepetiCredentials;

    // Get credentials from connection or use direct credentials
    if (connectionId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: connection, error } = await supabase
        .from('marketplace_connections')
        .select('credentials')
        .eq('id', connectionId)
        .single();

      if (error || !connection) {
        throw new Error('Bağlantı bulunamadı');
      }

      credentials = connection.credentials as CiceksepetiCredentials;
    } else if (directCredentials) {
      credentials = directCredentials;
    } else {
      throw new Error('Kimlik bilgileri gerekli');
    }

    let result;

    switch (action) {
      case 'check_connection':
      case 'testConnection':
        result = await testConnection(credentials);
        break;

      case 'fetchCategories':
        result = { categories: await fetchCategories(credentials) };
        break;

      case 'fetchCategoryAttributes':
        result = { attributes: await fetchCategoryAttributes(credentials, params.categoryId) };
        break;

      case 'fetchProducts':
        result = { products: await fetchProducts(credentials, params.page, params.pageSize) };
        break;

      case 'createProduct':
        result = await createProduct(credentials, params.product);
        break;

      case 'updateProduct':
        result = await updateProduct(credentials, params.productId, params.updates);
        break;

      case 'bulkUpdateStock':
        result = await bulkUpdateStock(credentials, params.items);
        break;

      case 'fetchOrders':
        result = { orders: await fetchOrders(credentials, params.startDate, params.endDate) };
        break;

      default:
        throw new Error(`Bilinmeyen işlem: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Çiçeksepeti sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
