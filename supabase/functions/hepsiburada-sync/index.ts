import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HepsiburadaCredentials {
  merchantId: string;
  username: string;
  password: string;
}

const HEPSIBURADA_API_BASE = "https://mpop-sit.hepsiburada.com";

async function getHepsiburadaHeaders(credentials: HepsiburadaCredentials) {
  const auth = btoa(`${credentials.username}:${credentials.password}`);
  return {
    "Authorization": `Basic ${auth}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function testConnection(credentials: HepsiburadaCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    // Test by fetching merchant info
    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/merchants/${credentials.merchantId}/account`,
      { headers }
    );

    if (response.ok) {
      return { success: true };
    }

    const errorText = await response.text();
    console.error("Hepsiburada connection test failed:", response.status, errorText);
    
    if (response.status === 401) {
      return { success: false, error: "Geçersiz kullanıcı adı veya şifre" };
    }
    if (response.status === 403) {
      return { success: false, error: "Bu merchant ID için yetkiniz yok" };
    }
    
    return { success: false, error: `Bağlantı hatası: ${response.status}` };
  } catch (error) {
    console.error("Hepsiburada connection error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bağlantı kurulamadı" };
  }
}

async function fetchCategories(credentials: HepsiburadaCredentials): Promise<any[]> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/product/api/categories/get-all-categories`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch Hepsiburada categories:", response.status, errorText);
      throw new Error(`Kategori çekme hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Hepsiburada categories error:", error);
    throw error;
  }
}

async function fetchCategoryAttributes(credentials: HepsiburadaCredentials, categoryId: string): Promise<any[]> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/product/api/categories/${categoryId}/attributes`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch Hepsiburada category attributes:", response.status, errorText);
      throw new Error(`Özellik çekme hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Hepsiburada attributes error:", error);
    throw error;
  }
}

async function createProduct(credentials: HepsiburadaCredentials, product: any): Promise<{ success: boolean; trackingId?: string; error?: string }> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    // Format product for Hepsiburada API
    const hbProduct = {
      categoryId: product.categoryId,
      merchant: credentials.merchantId,
      attributes: product.attributes || {},
      productListings: [{
        sku: product.sku,
        listingPrice: product.price,
        availableStock: product.stock,
        dispatchTime: product.dispatchTime || 2,
        cargoCompany: product.cargoCompany || "YURTICI_KARGO",
      }],
      images: product.images?.map((url: string, index: number) => ({
        url,
        order: index + 1,
      })) || [],
      productName: product.title,
      description: product.description || product.title,
      brandName: product.brand || "Belirtilmemiş",
    };

    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/product/api/products/import`,
      {
        method: "POST",
        headers,
        body: JSON.stringify([hbProduct]),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create Hepsiburada product:", response.status, errorText);
      return { success: false, error: `Ürün oluşturma hatası: ${response.status}` };
    }

    const data = await response.json();
    return { 
      success: true, 
      trackingId: data.trackingId || data.data?.trackingId 
    };
  } catch (error) {
    console.error("Hepsiburada create product error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ürün oluşturulamadı" };
  }
}

async function updateProduct(credentials: HepsiburadaCredentials, product: any): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    // Update price and stock
    const updateData = {
      sku: product.sku,
      merchantId: credentials.merchantId,
      price: product.price,
      availableStock: product.stock,
    };

    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/listing/api/listings/update-all`,
      {
        method: "POST",
        headers,
        body: JSON.stringify([updateData]),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update Hepsiburada product:", response.status, errorText);
      return { success: false, error: `Ürün güncelleme hatası: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Hepsiburada update product error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ürün güncellenemedi" };
  }
}

async function checkProductStatus(credentials: HepsiburadaCredentials, trackingId: string): Promise<any> {
  try {
    const headers = await getHepsiburadaHeaders(credentials);
    
    const response = await fetch(
      `${HEPSIBURADA_API_BASE}/product/api/products/status/${trackingId}`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to check Hepsiburada product status:", response.status, errorText);
      throw new Error(`Durum sorgulama hatası: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Hepsiburada status check error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

    console.log(`Hepsiburada sync initiated by user: ${user.id}`);

    const { action, connectionId, credentials, product, categoryId, trackingId } = await req.json();
    
    let hbCredentials: HepsiburadaCredentials;
    
    // If connectionId provided, fetch credentials from database
    if (connectionId) {
      const { data: connection, error } = await supabase
        .from('marketplace_connections')
        .select('credentials')
        .eq('id', connectionId)
        .single();
      
      if (error || !connection) {
        throw new Error("Bağlantı bulunamadı");
      }
      
      const creds = connection.credentials as any;
      hbCredentials = {
        merchantId: creds.merchantId,
        username: creds.username,
        password: creds.password,
      };
    } else if (credentials) {
      hbCredentials = credentials;
    } else {
      throw new Error("Credentials veya connectionId gerekli");
    }

    console.log(`Hepsiburada action: ${action}`);

    switch (action) {
      case 'test': {
        const result = await testConnection(hbCredentials);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'categories': {
        const categories = await fetchCategories(hbCredentials);
        return new Response(JSON.stringify({ categories }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'category-attributes': {
        if (!categoryId) {
          throw new Error("categoryId gerekli");
        }
        const attributes = await fetchCategoryAttributes(hbCredentials, categoryId);
        return new Response(JSON.stringify({ attributes }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'create-product': {
        if (!product) {
          throw new Error("product gerekli");
        }
        const result = await createProduct(hbCredentials, product);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'update-product': {
        if (!product) {
          throw new Error("product gerekli");
        }
        const result = await updateProduct(hbCredentials, product);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'check-status': {
        if (!trackingId) {
          throw new Error("trackingId gerekli");
        }
        const status = await checkProductStatus(hbCredentials, trackingId);
        return new Response(JSON.stringify({ status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Bilinmeyen action: ${action}`);
    }

  } catch (error) {
    console.error("Hepsiburada sync error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'İşlem sırasında bir hata oluştu, lütfen daha sonra tekrar deneyin'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
