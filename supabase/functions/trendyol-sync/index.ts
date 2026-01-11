import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductPayload {
  barcode: string;
  title: string;
  productMainId: string;
  brandId: number;
  categoryId: number;
  quantity: number;
  stockCode: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  description: string;
  currencyCode: string;
  images: Array<{ url: string }>;
  attributes: Array<{ attributeId: number; attributeValueId?: number; customAttributeValue?: string }>;
  color?: string;
  size?: string;
}

interface RequestBody {
  action?: string;
  products?: ProductPayload[];
  categoryId?: number;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    console.log(`Trendyol sync initiated by user: ${user.id}`);

    const body = (await req.json()) as RequestBody & {
      credentials?: Record<string, string>;
    };

    const action = body.action || "push_products";

    // Prefer per-user credentials coming from the client; fall back to environment variables for backwards compatibility.
    const supplierId =
      body.credentials?.seller_id ||
      body.credentials?.supplier_id ||
      Deno.env.get("VITE_TRENDYOL_PARTNER_ID");
    const apiKey = body.credentials?.api_key || Deno.env.get("VITE_TRENDYOL_API_KEY");
    const apiSecret = body.credentials?.api_secret || Deno.env.get("VITE_TRENDYOL_API_SECRET");

    console.log("=== Trendyol Sync Edge Function ===");
    console.log("Using body credentials:", {
      supplierId: !!(body.credentials?.seller_id || body.credentials?.supplier_id),
      apiKey: !!body.credentials?.api_key,
      apiSecret: !!body.credentials?.api_secret,
    });
    console.log("Credentials present:", {
      supplierId: !!supplierId,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
    });

    if (!supplierId || !apiKey || !apiSecret) {
      const missing: string[] = [];
      if (!supplierId) missing.push("seller_id");
      if (!apiKey) missing.push("api_key");
      if (!apiSecret) missing.push("api_secret");

      return new Response(
        JSON.stringify({
          success: false,
          errorType: "MISSING_CREDENTIALS",
          message: `Eksik Trendyol kimlik bilgileri: ${missing.join(", ")}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authString = `${apiKey}:${apiSecret}`;
    const authBase64 = btoa(authString);
    const baseHeaders = {
      Authorization: `Basic ${authBase64}`,
      "Content-Type": "application/json",
      "User-Agent": `${supplierId} - SelfIntegration`,
    };

    console.log("Action:", action);
    // ACTION: Check Connection
    if (action === 'check_connection') {
      try {
        const testUrl = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/products?page=0&size=1`;
        console.log('Testing connection to:', testUrl);
        console.log('Using Supplier ID:', supplierId);
        
        const response = await fetch(testUrl, { headers: baseHeaders });
        const responseText = await response.text();
        
        console.log('Connection test response status:', response.status);
        console.log('Connection test response body:', responseText);
        
        let errorMessage = 'Bağlantı başarısız';
        if (response.status === 403) {
          errorMessage = 'Yetkisiz (403): Satıcı ID ile API anahtarları eşleşmiyor olabilir veya hesap API erişimine açık değil.';
        } else if (response.status === 401) {
          errorMessage = 'Kimlik doğrulama hatası (401): API anahtarı veya secret yanlış.';
        } else if (response.status === 404) {
          errorMessage = 'Satıcı bulunamadı (404): Satıcı ID yanlış olabilir.';
        }
        
        return new Response(
          JSON.stringify({
            success: response.ok,
            statusCode: response.status,
            message: response.ok ? 'Bağlantı başarılı' : errorMessage,
            supplierId: supplierId,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Connection test error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            errorType: 'CONNECTION_ERROR',
            message: 'Bağlantı test edilemedi, lütfen daha sonra tekrar deneyin',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ACTION: Get Categories
    if (action === 'get_categories') {
      console.log('Fetching Trendyol categories...');
      const categoryUrl = 'https://api.trendyol.com/sapigw/product-categories';
      
      const response = await fetch(categoryUrl, { headers: baseHeaders });
      const responseText = await response.text();
      
      console.log('Categories response status:', response.status);
      
      if (!response.ok) {
        console.error('Categories fetch failed:', response.status, responseText);
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: response.status,
            errorType: 'API_ERROR',
            message: 'Kategoriler alınamadı, lütfen daha sonra tekrar deneyin',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const categories = JSON.parse(responseText);
      return new Response(
        JSON.stringify({
          success: true,
          categories: categories.categories || categories,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Get Category Attributes
    if (action === 'get_attributes') {
      const categoryId = body.categoryId;
      if (!categoryId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'categoryId gerekli',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching attributes for category ${categoryId}...`);
      const attrUrl = `https://api.trendyol.com/sapigw/product-categories/${categoryId}/attributes`;
      
      const response = await fetch(attrUrl, { headers: baseHeaders });
      const responseText = await response.text();
      
      console.log('Attributes response status:', response.status);
      
      if (!response.ok) {
        console.error('Category attributes fetch failed:', response.status, responseText);
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: response.status,
            errorType: 'API_ERROR',
            message: 'Kategori özellikleri alınamadı, lütfen daha sonra tekrar deneyin',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const attributes = JSON.parse(responseText);
      return new Response(
        JSON.stringify({
          success: true,
          categoryAttributes: attributes.categoryAttributes || attributes,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Fetch Products from Trendyol
    if (action === 'fetch_products') {
      console.log('Fetching products from Trendyol...');
      const productsUrl = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/products?page=0&size=100`;
      
      const response = await fetch(productsUrl, { headers: baseHeaders });
      const responseText = await response.text();
      
      console.log('Products response status:', response.status);
      
      if (!response.ok) {
        console.error('Products fetch failed:', response.status, responseText);
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: response.status,
            errorType: 'API_ERROR',
            message:
              response.status === 403
                ? "Yetkisiz (403): Satıcı hesabı pasif olabilir veya API anahtarınız bu Satıcı ID ile eşleşmiyor."
                : "Ürünler alınamadı, lütfen daha sonra tekrar deneyin",
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = JSON.parse(responseText);
      return new Response(
        JSON.stringify({
          success: true,
          products: data.content || [],
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Push Products to Trendyol (default)
    if (action === 'push_products' || !action) {
      const products = body.products;
      
      if (!products || products.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            errorType: 'NO_PRODUCTS',
            message: 'Gönderilecek ürün bulunamadı',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Pushing ${products.length} products to Trendyol...`);

      const trendyolItems = products.map((product) => ({
        barcode: product.barcode,
        title: product.title,
        productMainId: product.productMainId || product.stockCode,
        brandId: product.brandId || 102,
        categoryId: product.categoryId || 411,
        quantity: product.quantity,
        stockCode: product.stockCode,
        dimensionalWeight: 1,
        description: product.description || product.title,
        currencyType: product.currencyCode || "TRY",
        listPrice: product.listPrice,
        salePrice: product.salePrice,
        vatRate: product.vatRate || 18,
        cargoCompanyId: 17,
        images: product.images?.length > 0 
          ? product.images 
          : [{ url: "https://via.placeholder.com/500" }],
        attributes: [
          ...(product.color ? [{ attributeId: 348, attributeValueId: getColorValueId(product.color) }] : []),
          ...(product.size ? [{ attributeId: 338, customAttributeValue: product.size }] : []),
          ...(product.attributes || []),
        ],
      }));

      const apiUrl = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/v2/products`;
      console.log('Trendyol API URL:', apiUrl);
      console.log('Sending items:', JSON.stringify(trendyolItems, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ items: trendyolItems }),
      });

      const responseText = await response.text();
      console.log('Trendyol API Response Status:', response.status);
      console.log('Trendyol API Response Body:', responseText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = null;
      }

      if (!response.ok) {
        console.error('Trendyol API error:', response.status, responseText);
        return new Response(
          JSON.stringify({
            success: false,
            errorType: `TRENDYOL_ERROR_${response.status}`,
            statusCode: response.status,
            message:
              response.status === 403
                ? "Yetkisiz (403): Satıcı hesabı pasif olabilir veya API anahtarınız bu Satıcı ID ile eşleşmiyor."
                : "Ürün gönderimi başarısız oldu, lütfen daha sonra tekrar deneyin",
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `${products.length} ürün başarıyla Trendyol'a gönderildi`,
          batchRequestId: parsedResponse?.batchRequestId,
          details: parsedResponse,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({
        success: false,
        message: `Bilinmeyen action: ${action}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trendyol sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        errorType: 'INTERNAL_ERROR',
        message: 'İşlem sırasında bir hata oluştu, lütfen daha sonra tekrar deneyin',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getColorValueId(color: string): number {
  const colorMap: Record<string, number> = {
    'siyah': 52, 'black': 52,
    'beyaz': 53, 'white': 53,
    'kırmızı': 54, 'red': 54,
    'mavi': 55, 'blue': 55,
    'yeşil': 56, 'green': 56,
    'sarı': 57, 'yellow': 57,
    'turuncu': 58, 'orange': 58,
    'mor': 59, 'purple': 59,
    'pembe': 60, 'pink': 60,
    'gri': 61, 'gray': 61, 'grey': 61,
    'kahverengi': 62, 'brown': 62,
  };
  return colorMap[color.toLowerCase()] || 52;
}
