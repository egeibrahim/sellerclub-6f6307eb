import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategorySuggestion {
  category_id: string;
  category_name: string;
  full_path: string;
  confidence_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Kimlik doğrulaması gerekli', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Authentication failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Geçersiz kimlik bilgileri', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { productTitle, targetMarketplace, productDescription } = await req.json();
    
    if (!productTitle || !targetMarketplace) {
      return new Response(
        JSON.stringify({ error: "productTitle and targetMarketplace are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get existing category mappings from database for context using service role
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: existingMappings } = await serviceSupabase
      .from('category_mappings')
      .select('source_category_name, target_category_name, target_category_id, confidence_score')
      .eq('target_marketplace', targetMarketplace)
      .eq('is_verified', true)
      .limit(50);

    const { data: marketplaceCategories } = await serviceSupabase
      .from('marketplace_categories')
      .select('remote_id, name, full_path')
      .eq('marketplace_id', targetMarketplace)
      .limit(100);

    console.log(`Processing category mapping for: "${productTitle}" -> ${targetMarketplace}`);
    console.log(`Found ${existingMappings?.length || 0} verified mappings, ${marketplaceCategories?.length || 0} marketplace categories`);

    // Build context for AI
    const mappingContext = existingMappings?.length 
      ? `Verified category mappings for reference:\n${existingMappings.map(m => `- "${m.source_category_name}" -> "${m.target_category_name}" (ID: ${m.target_category_id})`).join('\n')}`
      : '';

    const categoryContext = marketplaceCategories?.length
      ? `Available ${targetMarketplace} categories:\n${marketplaceCategories.map(c => `- ID: ${c.remote_id}, Name: ${c.name}, Path: ${c.full_path || c.name}`).join('\n')}`
      : '';

    const marketplaceNames: Record<string, string> = {
      trendyol: 'Trendyol',
      hepsiburada: 'Hepsiburada',
      ikas: 'ikas',
      ciceksepeti: 'Çiçeksepeti',
      amazon_tr: 'Amazon Türkiye',
      n11: 'N11',
      etsy: 'Etsy',
      ticimax: 'Ticimax'
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert e-commerce category mapping assistant specializing in Turkish marketplaces. 
Your task is to suggest the most appropriate category for a product on ${marketplaceNames[targetMarketplace] || targetMarketplace}.

Guidelines:
- Analyze the product title and description to understand the product type
- Consider Turkish marketplace category conventions
- Provide confidence scores (0.0 to 1.0) based on how certain you are
- If available categories are provided, prefer matching to those
- Return 1-3 category suggestions, ordered by confidence

Return ONLY valid JSON with no additional text.`
          },
          {
            role: "user",
            content: `Suggest categories for this product on ${marketplaceNames[targetMarketplace] || targetMarketplace}:

Product Title: "${productTitle}"
${productDescription ? `Product Description: "${productDescription}"` : ''}

${mappingContext}

${categoryContext}

Return JSON array: [{"category_id": "id or suggested name if no id available", "category_name": "category name", "full_path": "full category path like Giyim > Erkek > Tişört", "confidence_score": 0.0-1.0}]`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON from the response
    let suggestions: CategorySuggestion[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default suggestion based on product title
      suggestions = [{
        category_id: "unknown",
        category_name: "Genel Ürün",
        full_path: "Genel Ürün",
        confidence_score: 0.3
      }];
    }

    // Validate and normalize suggestions
    suggestions = suggestions.map(s => ({
      category_id: String(s.category_id || "unknown"),
      category_name: String(s.category_name || "Unknown"),
      full_path: String(s.full_path || s.category_name || "Unknown"),
      confidence_score: Math.min(1, Math.max(0, Number(s.confidence_score) || 0.5))
    })).slice(0, 3);

    return new Response(
      JSON.stringify({ 
        suggestions,
        productTitle,
        targetMarketplace 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI category mapping error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Kategori önerisi alınırken bir hata oluştu, lütfen daha sonra tekrar deneyin",
        suggestions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
