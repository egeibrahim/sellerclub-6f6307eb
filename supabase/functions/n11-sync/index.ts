import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N11_API_BASE = 'https://api.n11.com/ws';

interface N11Credentials {
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
  brand?: string;
  attributes?: Record<string, string>;
}

// Build SOAP envelope for N11 API
function buildSoapEnvelope(method: string, credentials: N11Credentials, params: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:${method}Request>
      <auth>
        <appKey>${credentials.api_key}</appKey>
        <appSecret>${credentials.api_secret}</appSecret>
      </auth>
      ${params}
    </sch:${method}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// Parse SOAP response
function parseSoapResponse(xml: string, resultTag: string): any {
  // Simple XML parsing for common response patterns
  const resultMatch = xml.match(new RegExp(`<${resultTag}>([\\s\\S]*?)</${resultTag}>`));
  if (!resultMatch) return null;
  
  const resultXml = resultMatch[1];
  
  // Parse status
  const statusMatch = resultXml.match(/<status>(\w+)<\/status>/);
  const status = statusMatch ? statusMatch[1] : 'unknown';
  
  // Parse error message if exists
  const errorMatch = resultXml.match(/<errorMessage>([^<]*)<\/errorMessage>/);
  const errorMessage = errorMatch ? errorMatch[1] : null;
  
  return { status, errorMessage, raw: resultXml };
}

// Make SOAP request to N11
async function soapRequest(service: string, method: string, credentials: N11Credentials, params: string): Promise<string> {
  const url = `${N11_API_BASE}/${service}`;
  const envelope = buildSoapEnvelope(method, credentials, params);
  
  console.log(`N11 SOAP Request to ${service}/${method}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"${method}"`,
    },
    body: envelope,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('N11 SOAP error:', error);
    throw new Error(`N11 API hatası: ${response.status}`);
  }

  return await response.text();
}

// Test connection
async function testConnection(credentials: N11Credentials): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await soapRequest(
      'CategoryService.wsdl',
      'GetTopLevelCategories',
      credentials,
      ''
    );
    
    const result = parseSoapResponse(response, 'GetTopLevelCategoriesResponse');
    
    if (result?.status === 'success' || response.includes('<category>')) {
      return { success: true };
    }
    
    return { success: false, error: result?.errorMessage || 'Bağlantı doğrulanamadı' };
  } catch (error) {
    console.error('Connection test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return { success: false, error: errorMessage };
  }
}

// Fetch top level categories
async function fetchCategories(credentials: N11Credentials): Promise<any[]> {
  const response = await soapRequest(
    'CategoryService.wsdl',
    'GetTopLevelCategories',
    credentials,
    ''
  );
  
  // Parse categories from response
  const categories: any[] = [];
  const categoryMatches = response.matchAll(/<category>([\s\S]*?)<\/category>/g);
  
  for (const match of categoryMatches) {
    const categoryXml = match[1];
    const idMatch = categoryXml.match(/<id>(\d+)<\/id>/);
    const nameMatch = categoryXml.match(/<name>([^<]*)<\/name>/);
    
    if (idMatch && nameMatch) {
      categories.push({
        id: idMatch[1],
        name: nameMatch[1],
      });
    }
  }
  
  return categories;
}

// Fetch subcategories
async function fetchSubCategories(credentials: N11Credentials, categoryId: string): Promise<any[]> {
  const response = await soapRequest(
    'CategoryService.wsdl',
    'GetSubCategories',
    credentials,
    `<categoryId>${categoryId}</categoryId>`
  );
  
  const categories: any[] = [];
  const categoryMatches = response.matchAll(/<category>([\s\S]*?)<\/category>/g);
  
  for (const match of categoryMatches) {
    const categoryXml = match[1];
    const idMatch = categoryXml.match(/<id>(\d+)<\/id>/);
    const nameMatch = categoryXml.match(/<name>([^<]*)<\/name>/);
    
    if (idMatch && nameMatch) {
      categories.push({
        id: idMatch[1],
        name: nameMatch[1],
        parentId: categoryId,
      });
    }
  }
  
  return categories;
}

// Fetch category attributes
async function fetchCategoryAttributes(credentials: N11Credentials, categoryId: string): Promise<any[]> {
  const response = await soapRequest(
    'CategoryService.wsdl',
    'GetCategoryAttributes',
    credentials,
    `<categoryId>${categoryId}</categoryId>`
  );
  
  const attributes: any[] = [];
  const attrMatches = response.matchAll(/<attribute>([\s\S]*?)<\/attribute>/g);
  
  for (const match of attrMatches) {
    const attrXml = match[1];
    const idMatch = attrXml.match(/<id>(\d+)<\/id>/);
    const nameMatch = attrXml.match(/<name>([^<]*)<\/name>/);
    const mandatoryMatch = attrXml.match(/<mandatory>(\w+)<\/mandatory>/);
    
    if (idMatch && nameMatch) {
      attributes.push({
        id: idMatch[1],
        name: nameMatch[1],
        mandatory: mandatoryMatch ? mandatoryMatch[1] === 'true' : false,
      });
    }
  }
  
  return attributes;
}

// Fetch products from N11 store
async function fetchProducts(credentials: N11Credentials, page = 0, pageSize = 50): Promise<any[]> {
  const response = await soapRequest(
    'ProductService.wsdl',
    'GetProductList',
    credentials,
    `<pagingData>
      <currentPage>${page}</currentPage>
      <pageSize>${pageSize}</pageSize>
    </pagingData>`
  );
  
  const products: any[] = [];
  const productMatches = response.matchAll(/<product>([\s\S]*?)<\/product>/g);
  
  for (const match of productMatches) {
    const productXml = match[1];
    const idMatch = productXml.match(/<id>(\d+)<\/id>/);
    const titleMatch = productXml.match(/<title>([^<]*)<\/title>/);
    const priceMatch = productXml.match(/<displayPrice>([^<]*)<\/displayPrice>/);
    const stockMatch = productXml.match(/<stockItems>[\s\S]*?<quantity>(\d+)<\/quantity>/);
    const skuMatch = productXml.match(/<productSellerCode>([^<]*)<\/productSellerCode>/);
    
    products.push({
      id: idMatch ? idMatch[1] : null,
      title: titleMatch ? titleMatch[1] : 'Bilinmeyen Ürün',
      price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      stock: stockMatch ? parseInt(stockMatch[1]) : 0,
      sku: skuMatch ? skuMatch[1] : null,
    });
  }
  
  return products;
}

// Create product on N11
async function createProduct(credentials: N11Credentials, product: ProductData): Promise<any> {
  const imagesXml = product.images?.map((url, index) => 
    `<image>
      <url>${url}</url>
      <order>${index + 1}</order>
    </image>`
  ).join('') || '';
  
  const attributesXml = product.attributes 
    ? Object.entries(product.attributes).map(([name, value]) =>
        `<attribute>
          <name>${name}</name>
          <value>${value}</value>
        </attribute>`
      ).join('')
    : '';

  const params = `
    <product>
      <productSellerCode>${product.sku || `N11-${Date.now()}`}</productSellerCode>
      <title>${escapeXml(product.title)}</title>
      <subtitle></subtitle>
      <description>${escapeXml(product.description || product.title)}</description>
      <category>
        <id>${product.categoryId}</id>
      </category>
      <price>${product.price}</price>
      <currencyType>1</currencyType>
      <images>${imagesXml}</images>
      <approvalStatus>1</approvalStatus>
      <attributes>${attributesXml}</attributes>
      <productCondition>1</productCondition>
      <preparingDay>3</preparingDay>
      <discount>
        <type>1</type>
        <value>0</value>
      </discount>
      <shipmentTemplate>default</shipmentTemplate>
      <stockItems>
        <stockItem>
          <quantity>${product.stock}</quantity>
          <sellerStockCode>${product.sku || `N11-${Date.now()}`}</sellerStockCode>
        </stockItem>
      </stockItems>
    </product>
  `;

  console.log('Creating N11 product');
  
  const response = await soapRequest(
    'ProductService.wsdl',
    'SaveProduct',
    credentials,
    params
  );
  
  const result = parseSoapResponse(response, 'SaveProductResponse');
  
  if (result?.status !== 'success' && result?.errorMessage) {
    throw new Error(result.errorMessage);
  }
  
  // Extract product ID from response
  const productIdMatch = response.match(/<productId>(\d+)<\/productId>/);
  
  return {
    success: true,
    productId: productIdMatch ? productIdMatch[1] : null,
  };
}

// Update product stock and price
async function updateProduct(credentials: N11Credentials, productId: string, updates: { price?: number; stock?: number; sku?: string }): Promise<any> {
  // Update stock if provided
  if (updates.stock !== undefined && updates.sku) {
    const stockParams = `
      <stockItems>
        <stockItem>
          <sellerStockCode>${updates.sku}</sellerStockCode>
          <quantity>${updates.stock}</quantity>
        </stockItem>
      </stockItems>
    `;
    
    await soapRequest(
      'ProductStockService.wsdl',
      'UpdateStockByStockSellerCode',
      credentials,
      stockParams
    );
  }
  
  // Update price if provided
  if (updates.price !== undefined) {
    const priceParams = `
      <productId>${productId}</productId>
      <price>${updates.price}</price>
    `;
    
    await soapRequest(
      'ProductService.wsdl',
      'UpdateProductPrice',
      credentials,
      priceParams
    );
  }
  
  return { success: true };
}

// Bulk update stock
async function bulkUpdateStock(credentials: N11Credentials, items: { sku: string; quantity: number }[]): Promise<any> {
  const stockItemsXml = items.map(item => 
    `<stockItem>
      <sellerStockCode>${item.sku}</sellerStockCode>
      <quantity>${item.quantity}</quantity>
    </stockItem>`
  ).join('');
  
  const response = await soapRequest(
    'ProductStockService.wsdl',
    'UpdateStockByStockSellerCode',
    credentials,
    `<stockItems>${stockItemsXml}</stockItems>`
  );
  
  const result = parseSoapResponse(response, 'UpdateStockByStockSellerCodeResponse');
  
  return {
    success: result?.status === 'success',
    error: result?.errorMessage,
  };
}

// Fetch orders
async function fetchOrders(credentials: N11Credentials, status?: string, page = 0): Promise<any[]> {
  const statusParam = status ? `<status>${status}</status>` : '';
  
  const response = await soapRequest(
    'OrderService.wsdl',
    'OrderList',
    credentials,
    `${statusParam}
    <pagingData>
      <currentPage>${page}</currentPage>
      <pageSize>50</pageSize>
    </pagingData>`
  );
  
  const orders: any[] = [];
  const orderMatches = response.matchAll(/<order>([\s\S]*?)<\/order>/g);
  
  for (const match of orderMatches) {
    const orderXml = match[1];
    const idMatch = orderXml.match(/<id>(\d+)<\/id>/);
    const statusMatch = orderXml.match(/<status>([^<]*)<\/status>/);
    const totalMatch = orderXml.match(/<totalAmount>([^<]*)<\/totalAmount>/);
    const dateMatch = orderXml.match(/<createDate>([^<]*)<\/createDate>/);
    
    orders.push({
      id: idMatch ? idMatch[1] : null,
      status: statusMatch ? statusMatch[1] : 'unknown',
      totalAmount: totalMatch ? parseFloat(totalMatch[1]) : 0,
      createDate: dateMatch ? dateMatch[1] : null,
    });
  }
  
  return orders;
}

// Helper to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
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

    console.log(`N11 sync initiated by user: ${user.id}`);

    const { action, connectionId, credentials: directCredentials, ...params } = await req.json();

    console.log('N11 sync action:', action);

    let credentials: N11Credentials;

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

      credentials = connection.credentials as N11Credentials;
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

      case 'fetchSubCategories':
        result = { categories: await fetchSubCategories(credentials, params.categoryId) };
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
        result = { orders: await fetchOrders(credentials, params.status, params.page) };
        break;

      default:
        throw new Error(`Bilinmeyen işlem: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('N11 sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'İşlem sırasında bir hata oluştu, lütfen daha sonra tekrar deneyin' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
