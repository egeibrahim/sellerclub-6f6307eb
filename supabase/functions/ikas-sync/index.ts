import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPHQL_URL = 'https://api.myikas.com/api/v1/admin/graphql';

interface Credentials {
  clientId?: string;
  clientSecret?: string;
  storeName?: string;
  // Also support snake_case from DB
  client_id?: string;
  client_secret?: string;
  store_name?: string;
}

// Normalize store name to get proper host
function normalizeStoreHost(storeName: string): string {
  // Remove protocol if present
  let normalized = storeName.replace(/^https?:\/\//, '');
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // If it already has .myikas.com, use as-is
  if (normalized.includes('.myikas.com')) {
    return normalized;
  }
  
  // Otherwise, append .myikas.com
  return `${normalized}.myikas.com`;
}

// Convert imageId to CDN URL with size parameters
function getImageUrl(imageId: string, width: number = 800, height: number = 800): string {
  if (!imageId) return '';
  // ikas CDN URL format with size - format: https://cdn.myikas.com/images/{imageId}/image_{width}.webp
  return `https://cdn.myikas.com/images/${imageId}/image_${width}.webp`;
}

// OAuth2 token fetching function - now uses store-specific URL
async function getAccessToken(
  clientId: string, 
  clientSecret: string, 
  storeName?: string
): Promise<{ token: string | null; error: string | null; details?: string }> {
  
  console.log('=== Fetching OAuth2 Token ===');
  console.log('Store name provided:', storeName || '(none)');
  
  // Determine token URL based on store name
  let tokenUrl: string;
  if (storeName) {
    const storeHost = normalizeStoreHost(storeName);
    tokenUrl = `https://${storeHost}/api/admin/oauth/token`;
    console.log('Using store-specific token URL:', tokenUrl);
  } else {
    // Fallback to central API (may not work for all stores)
    tokenUrl = 'https://api.myikas.com/api/admin/oauth/token';
    console.log('WARNING: No store name provided, using central API (may fail)');
  }
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    console.log('OAuth Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('OAuth Response Body:', responseText.substring(0, 300));

    if (!response.ok) {
      let errorDetail = responseText.substring(0, 300);
      
      // Try to parse as JSON for better error message
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.error_description || errorJson.error || errorDetail;
      } catch {}
      
      return { 
        token: null, 
        error: `OAuth token alınamadı (HTTP ${response.status})`,
        details: `URL: ${tokenUrl}\n${errorDetail}`
      };
    }

    const data = JSON.parse(responseText);
    
    if (data.access_token) {
      console.log('✅ OAuth token obtained successfully');
      return { token: data.access_token, error: null };
    } else {
      return { 
        token: null, 
        error: 'Token yanıtında access_token bulunamadı',
        details: JSON.stringify(data).substring(0, 200)
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('OAuth token fetch error:', errorMsg);
    return { 
      token: null, 
      error: `OAuth bağlantı hatası: ${errorMsg}`,
      details: `Token URL: ${tokenUrl}`
    };
  }
}

// GraphQL Introspection query to discover available schema
const INTROSPECTION_QUERY = `
  query IntrospectProduct {
    __type(name: "Product") {
      name
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
`;

const INTROSPECT_VARIANT_QUERY = `
  query IntrospectVariant {
    __type(name: "Variant") {
      name
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
`;

// GraphQL query for fetching products - simplified to avoid schema-dependent fields
const PRODUCTS_QUERY = `
  query ListProducts($pagination: PaginationInput) {
    listProduct(pagination: $pagination) {
      data {
        id
        name
        description
        shortDescription
        totalStock
        type
        weight
        brandId
        categoryIds
        tagIds
        variants {
          id
          sku
          isActive
          barcodeList
          weight
          prices {
            sellPrice
            discountPrice
            buyPrice
            currency
          }
          stocks {
            stockCount
            stockLocationId
          }
          images {
            imageId
            isMain
            order
          }
        }
        brand {
          id
          name
        }
        categories {
          id
          name
        }
        tags {
          id
          name
        }
      }
      count
    }
  }
`;

// GraphQL query for fetching full category tree
const CATEGORIES_QUERY = `
  query ListCategories($pagination: PaginationInput) {
    listCategory(pagination: $pagination) {
      data {
        id
        name
        description
        parentId
        categoryPath
        categoryPathItems {
          id
          name
        }
        imageId
        isAutomated
        orderType
        salesChannelIds
        metaData {
          title
          description
        }
      }
      count
    }
  }
`;

// Query to fetch variant types (color, size, etc.)
const VARIANT_TYPES_QUERY = `
  query ListVariantTypes($pagination: PaginationInput) {
    listVariantType(pagination: $pagination) {
      data {
        id
        name
        values {
          id
          name
          colorCode
        }
      }
      count
    }
  }
`;

// Simple query to check connection
const CHECK_CONNECTION_QUERY = `
  query {
    me {
      id
      email
    }
  }
`;

async function executeGraphQL(accessToken: string, query: string, variables?: Record<string, any>) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const responseText = await response.text();
  console.log('GraphQL Response Status:', response.status);
  console.log('GraphQL Response Body:', responseText.substring(0, 500));

  if (!response.ok) {
    console.error('GraphQL request failed:', response.status, responseText);
    throw new Error('GraphQL isteği başarısız oldu');
  }

  const data = JSON.parse(responseText);
  
  if (data.errors && data.errors.length > 0) {
    console.error('GraphQL errors:', JSON.stringify(data.errors));
    throw new Error('GraphQL işlemi başarısız oldu');
  }

  return data.data;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`IKAS sync initiated by user: ${user.id}`);

    const body = await req.json().catch(() => ({}));
    const { action, credentials, limit = 50, page = 1 } = body;

    console.log('=== IKAS Edge Function ===');
    console.log('Action:', action);
    console.log('Credentials provided:', !!credentials);

    // Support both camelCase and snake_case credential keys
    const creds = credentials as Credentials || {};
    
    // Get credentials - prefer body, fallback to server-side env (no VITE_ prefix for security)
    const clientId = creds.clientId || creds.client_id || Deno.env.get('IKAS_CLIENT_ID');
    const clientSecret = creds.clientSecret || creds.client_secret || Deno.env.get('IKAS_CLIENT_SECRET');
    const storeName = creds.storeName || creds.store_name || Deno.env.get('IKAS_STORE_NAME');

    console.log('Using credentials from:', (creds.clientId || creds.client_id) ? 'request body' : 'environment');
    console.log('Store name:', storeName || '(not provided)');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'İkas Client ID veya Client Secret eksik',
          errorType: 'CONFIG_MISSING',
          statusCode: 400,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth token with store-specific URL
    const { token: accessToken, error: tokenError, details: tokenDetails } = await getAccessToken(
      clientId, 
      clientSecret, 
      storeName
    );
    
    if (tokenError || !accessToken) {
      const missingStoreName = !storeName;
      return new Response(
        JSON.stringify({ 
          success: false,
          error: tokenError || 'OAuth2 token alınamadı',
          errorType: 'OAUTH_ERROR',
          statusCode: 401,
          details: tokenDetails || 'Unknown OAuth error',
          message: missingStoreName 
            ? 'Store Name (Mağaza Adı) girilmedi. Lütfen mağaza adınızı girin (örn: dev-listele)'
            : 'Client ID veya Client Secret hatalı olabilir. Lütfen ikas panelden "Uygulama" tipindeki doğru bilgileri aldığınızdan emin olun.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'check_connection') {
      try {
        const result = await executeGraphQL(accessToken, CHECK_CONNECTION_QUERY);
        console.log('Connection check result:', result);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Bağlantı başarılı',
            user: result.me 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Connection check failed:', error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Bağlantı kontrolü başarısız, lütfen kimlik bilgilerinizi kontrol edin',
            errorType: 'CONNECTION_ERROR',
            statusCode: 401
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle introspection action - discover available schema fields
    if (action === 'introspect') {
      try {
        console.log('Running GraphQL introspection...');
        
        const productSchema = await executeGraphQL(accessToken, INTROSPECTION_QUERY);
        const variantSchema = await executeGraphQL(accessToken, INTROSPECT_VARIANT_QUERY);
        
        console.log('Introspection result:', JSON.stringify({ productSchema, variantSchema }).substring(0, 500));
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            productFields: productSchema.__type?.fields || [],
            variantFields: variantSchema.__type?.fields || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Introspection error:', error);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'GraphQL şema sorgulaması başarısız oldu',
            errorType: 'INTROSPECTION_ERROR'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle get_variant_types action - fetch variant types (color, size, etc.)
    if (action === 'get_variant_types') {
      try {
        console.log('Fetching variant types...');
        
        const result = await executeGraphQL(accessToken, VARIANT_TYPES_QUERY, {
          pagination: { page: 1, limit: 100 }
        });

        const variantTypes = result.listVariantType?.data || [];
        const total = result.listVariantType?.count || 0;

        console.log('Fetched variant types count:', variantTypes.length);

        return new Response(
          JSON.stringify({ 
            success: true, 
            variantTypes: variantTypes.map((vt: any) => ({
              id: vt.id,
              name: vt.name,
              values: vt.values?.map((v: any) => ({
                id: v.id,
                name: v.name,
                colorCode: v.colorCode
              })) || []
            })),
            total
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Variant types fetch error:', errorMsg);
        
        // Return empty array - variant types may not be available
        return new Response(
          JSON.stringify({ 
            success: true, 
            variantTypes: [],
            total: 0,
            note: 'Variant types not available or not configured'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle get_categories action
    if (action === 'get_categories') {
      try {
        console.log('Fetching categories with pagination:', { page, limit });
        
        const result = await executeGraphQL(accessToken, CATEGORIES_QUERY, {
          pagination: { page, limit: 100 } // Get more categories at once
        });

        const rawCategories = result.listCategory?.data || [];
        const total = result.listCategory?.count || 0;

        console.log('Fetched categories count:', rawCategories.length, 'Total:', total);

        // Transform categories
        const categories = rawCategories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          parentId: cat.parentId,
          categoryPath: cat.categoryPath,
          fullPath: cat.categoryPathItems?.map((p: any) => p.name).join(' > ') || cat.name,
          imageUrl: cat.imageId ? getImageUrl(cat.imageId) : null,
          isAutomated: cat.isAutomated,
          orderType: cat.orderType,
          salesChannelIds: cat.salesChannelIds,
          metaTitle: cat.metaData?.title,
          metaDescription: cat.metaData?.description,
        }));

        return new Response(
          JSON.stringify({ 
            success: true, 
            categories, 
            total,
            page,
            limit
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Categories fetch error:', error);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Kategoriler alınamadı, lütfen daha sonra tekrar deneyin',
            errorType: 'FETCH_ERROR',
            statusCode: 500
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle sync_orders action
    if (action === 'sync_orders') {
      // For now, return empty success - orders sync to be implemented
      return new Response(
        JSON.stringify({ 
          success: true, 
          orders: [],
          message: 'İkas sipariş senkronizasyonu henüz aktif değil'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: fetch_products
    try {
      console.log('Fetching products with pagination:', { page, limit });
      
      const result = await executeGraphQL(accessToken, PRODUCTS_QUERY, {
        pagination: { page, limit }
      });

      const rawProducts = result.listProduct?.data || [];
      const total = result.listProduct?.count || 0;

      console.log('Fetched products count:', rawProducts.length, 'Total:', total);

      // Transform products to full format with all details
      const products = rawProducts.map((product: any) => {
        const mainVariant = product.variants?.[0] || {};
        const firstStock = mainVariant.stocks?.[0];
        const mainImage = mainVariant.images?.find((img: any) => img.isMain) || mainVariant.images?.[0];
        
        // Get all variant images with CDN URLs
        const allImages: string[] = [];
        product.variants?.forEach((v: any) => {
          v.images?.forEach((img: any) => {
            if (img.imageId) {
              allImages.push(getImageUrl(img.imageId));
            }
          });
        });
        // Remove duplicates
        const uniqueImages = [...new Set(allImages)];

        // Variant types & attributes are store-schema-dependent in ikas; omit for now.
        const variantTypes: any[] = [];
        const attributes: Record<string, any> = {};


        return {
          id: product.id,
          title: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          sku: mainVariant.sku || '',
          barcode: mainVariant.barcodeList?.[0] || '',
          price: mainVariant.prices?.sellPrice || 0,
          discountPrice: mainVariant.prices?.discountPrice || 0,
          buyPrice: mainVariant.prices?.buyPrice || 0,
          currency: mainVariant.prices?.currency || 'TRY',
          stock: firstStock?.stockCount || 0,
          totalStock: product.totalStock || 0,
          weight: product.weight || mainVariant.weight || 0,
          brand: product.brand?.name || '',
          brandId: product.brandId,
          category: product.categories?.[0]?.name || '',
          categoryId: product.categoryIds?.[0],
          categoryIds: product.categoryIds || [],
          categories: product.categories?.map((c: any) => ({
            id: c.id,
            name: c.name
          })) || [],
          tags: product.tags?.map((t: any) => ({
            id: t.id,
            name: t.name
          })) || [],
          tagIds: product.tagIds || [],
          images: uniqueImages,
          mainImage: mainImage?.imageId ? getImageUrl(mainImage.imageId) : '',
          type: product.type,
          attributes,
          variantTypes,
          variants: product.variants?.map((v: any) => {
            const variantMainImage = v.images?.find((img: any) => img.isMain) || v.images?.[0];
            return {
              id: v.id,
              sku: v.sku,
              barcode: v.barcodeList?.[0] || '',
              price: v.prices?.sellPrice || 0,
              discountPrice: v.prices?.discountPrice || 0,
              buyPrice: v.prices?.buyPrice || 0,
              currency: v.prices?.currency || 'TRY',
              stock: v.stocks?.[0]?.stockCount || 0,
              stockLocationId: v.stocks?.[0]?.stockLocationId,
              weight: v.weight || 0,
              isActive: v.isActive,
              images: v.images?.map((img: any) => ({
                url: getImageUrl(img.imageId),
                isMain: img.isMain,
                order: img.order
              })) || [],
              mainImage: variantMainImage?.imageId ? getImageUrl(variantMainImage.imageId) : '',
              values: [],
            };
          }) || [],
        };
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          products, 
          total,
          page,
          limit
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Products fetch error:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Ürünler alınamadı, lütfen daha sonra tekrar deneyin',
          errorType: 'FETCH_ERROR',
          statusCode: 500
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'İşlem sırasında bir hata oluştu, lütfen daha sonra tekrar deneyin',
        errorType: 'EDGE_FUNCTION_ERROR',
        statusCode: 500,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
