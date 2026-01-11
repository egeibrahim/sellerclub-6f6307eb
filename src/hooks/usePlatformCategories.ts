import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PlatformCategory {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  path?: string[];
  children?: PlatformCategory[];
  requiredAttributes?: string[];
}

interface UsePlatformCategoriesOptions {
  platform: string;
  connectionId?: string;
}

// Static fallback categories for platforms without API connection
const FALLBACK_CATEGORIES: PlatformCategory[] = [
  {
    id: "1",
    name: "Giyim & Aksesuar",
    children: [
      { id: "1-1", name: "Kadın Giyim", children: [
        { id: "1-1-1", name: "Elbiseler" },
        { id: "1-1-2", name: "Üstler" },
        { id: "1-1-3", name: "Pantolonlar" },
      ]},
      { id: "1-2", name: "Erkek Giyim", children: [
        { id: "1-2-1", name: "Gömlekler" },
        { id: "1-2-2", name: "Pantolonlar" },
      ]},
    ]
  },
  {
    id: "2", 
    name: "Ev & Yaşam",
    children: [
      { id: "2-1", name: "Mobilya", children: [] },
      { id: "2-2", name: "Dekorasyon", children: [] },
      { id: "2-3", name: "Mutfak", children: [] },
    ]
  },
  {
    id: "3",
    name: "Elektronik",
    children: [
      { id: "3-1", name: "Telefon & Aksesuar", children: [] },
      { id: "3-2", name: "Bilgisayar", children: [] },
      { id: "3-3", name: "Ses Sistemleri", children: [] },
    ]
  },
];

export function usePlatformCategories({ platform, connectionId }: UsePlatformCategoriesOptions) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string> | null>(null);

  // Fetch connection credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) return null;

    try {
      let query = supabase
        .from("shop_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_connected", true);

      if (connectionId) {
        query = query.eq("id", connectionId);
      } else {
        query = query.eq("platform", platform);
      }

      const { data: connection } = await query.maybeSingle();

      if (connection?.api_credentials) {
        const creds = connection.api_credentials as Record<string, string>;
        setCredentials(creds);
        return creds;
      }
      return null;
    } catch (err) {
      console.error("Error fetching credentials:", err);
      return null;
    }
  }, [user, platform, connectionId]);

  // Transform flat category list to tree
  const buildCategoryTree = (flatCategories: any[]): PlatformCategory[] => {
    const categoryMap = new Map<string | number, PlatformCategory>();
    const roots: PlatformCategory[] = [];

    // First pass: create all category nodes
    flatCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        path: [],
        children: [],
      });
    });

    // Second pass: build tree structure
    flatCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Build paths
    const buildPaths = (categories: PlatformCategory[], parentPath: string[] = []) => {
      categories.forEach((cat) => {
        cat.path = [...parentPath, cat.name];
        if (cat.children && cat.children.length > 0) {
          buildPaths(cat.children, cat.path);
        }
      });
    };
    buildPaths(roots);

    return roots;
  };

  // Fetch categories for Trendyol
  const fetchTrendyolCategories = async (creds: Record<string, string>) => {
    const { data, error } = await supabase.functions.invoke("trendyol-sync", {
      body: {
        action: "get_categories",
        credentials: creds,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Kategoriler alınamadı");

    // Trendyol returns nested categories
    const transformCategories = (cats: any[], parentPath: string[] = []): PlatformCategory[] => {
      return cats.map((cat) => {
        const path = [...parentPath, cat.name];
        return {
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
          path,
          children: cat.subCategories ? transformCategories(cat.subCategories, path) : [],
        };
      });
    };

    return transformCategories(data.categories || []);
  };

  // Fetch categories for Hepsiburada
  const fetchHepsiburadaCategories = async (creds: Record<string, string>) => {
    const { data, error } = await supabase.functions.invoke("hepsiburada-sync", {
      body: {
        action: "fetch_categories",
        credentials: creds,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Kategoriler alınamadı");

    return buildCategoryTree(data.categories || []);
  };

  // Fetch categories for Amazon
  const fetchAmazonCategories = async (creds: Record<string, string>) => {
    // Amazon SP-API doesn't have a public category endpoint, use static categories
    // In production, you'd need to use Browse Tree Guide (BTG) data
    const { data, error } = await supabase.functions.invoke("amazon-sync", {
      body: {
        action: "fetch_categories",
        credentials: creds,
      },
    });

    // If API fails, fall back to static Amazon categories
    if (error || !data?.success) {
      console.log("Using static Amazon categories");
      return getStaticAmazonCategories();
    }

    return buildCategoryTree(data.categories || []);
  };

  // Fetch categories for Çiçeksepeti
  const fetchCiceksepetiCategories = async (creds: Record<string, string>) => {
    const { data, error } = await supabase.functions.invoke("ciceksepeti-sync", {
      body: {
        action: "fetch_categories",
        credentials: creds,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Kategoriler alınamadı");

    return buildCategoryTree(data.categories || []);
  };

  // Fetch categories for N11
  const fetchN11Categories = async (creds: Record<string, string>) => {
    const { data, error } = await supabase.functions.invoke("n11-sync", {
      body: {
        action: "fetch_categories",
        credentials: creds,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Kategoriler alınamadı");

    return buildCategoryTree(data.categories || []);
  };

  // Main fetch function
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const creds = credentials || (await fetchCredentials());

      // If no credentials, use fallback categories
      if (!creds) {
        console.log(`No credentials for ${platform}, using fallback categories`);
        setCategories(FALLBACK_CATEGORIES);
        return;
      }

      let fetchedCategories: PlatformCategory[] = [];

      switch (platform.toLowerCase()) {
        case "trendyol":
          fetchedCategories = await fetchTrendyolCategories(creds);
          break;
        case "hepsiburada":
          fetchedCategories = await fetchHepsiburadaCategories(creds);
          break;
        case "amazon":
          fetchedCategories = await fetchAmazonCategories(creds);
          break;
        case "ciceksepeti":
          fetchedCategories = await fetchCiceksepetiCategories(creds);
          break;
        case "n11":
          fetchedCategories = await fetchN11Categories(creds);
          break;
        default:
          // For platforms without specific API, use fallback
          fetchedCategories = FALLBACK_CATEGORIES;
      }

      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error(`Error fetching ${platform} categories:`, err);
      setError(err.message || "Kategoriler yüklenirken hata oluştu");
      // Use fallback on error
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  }, [user, platform, credentials, fetchCredentials]);

  // Fetch category attributes
  const fetchCategoryAttributes = useCallback(async (categoryId: string | number) => {
    if (!credentials) return null;

    try {
      let endpoint = "";
      switch (platform.toLowerCase()) {
        case "trendyol":
          endpoint = "trendyol-sync";
          break;
        case "hepsiburada":
          endpoint = "hepsiburada-sync";
          break;
        case "amazon":
          endpoint = "amazon-sync";
          break;
        case "ciceksepeti":
          endpoint = "ciceksepeti-sync";
          break;
        default:
          return null;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          action: platform === "trendyol" ? "get_attributes" : "fetch_category_attributes",
          categoryId,
          credentials,
        },
      });

      if (error) throw error;
      return data?.categoryAttributes || data?.attributes || null;
    } catch (err) {
      console.error(`Error fetching category attributes:`, err);
      return null;
    }
  }, [platform, credentials]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    fetchCategoryAttributes,
  };
}

// Static Amazon Turkey categories
function getStaticAmazonCategories(): PlatformCategory[] {
  return [
    {
      id: "electronics",
      name: "Elektronik",
      path: ["Elektronik"],
      children: [
        {
          id: "computers",
          name: "Bilgisayar ve Aksesuarlar",
          path: ["Elektronik", "Bilgisayar ve Aksesuarlar"],
          children: [
            { id: "laptops", name: "Dizüstü Bilgisayarlar", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Dizüstü Bilgisayarlar"] },
            { id: "desktops", name: "Masaüstü Bilgisayarlar", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Masaüstü Bilgisayarlar"] },
            { id: "monitors", name: "Monitörler", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Monitörler"] },
          ],
        },
        {
          id: "phones",
          name: "Cep Telefonları",
          path: ["Elektronik", "Cep Telefonları"],
          children: [
            { id: "smartphones", name: "Akıllı Telefonlar", path: ["Elektronik", "Cep Telefonları", "Akıllı Telefonlar"] },
            { id: "cases", name: "Kılıflar", path: ["Elektronik", "Cep Telefonları", "Kılıflar"] },
          ],
        },
      ],
    },
    {
      id: "fashion",
      name: "Moda",
      path: ["Moda"],
      children: [
        {
          id: "mens",
          name: "Erkek Giyim",
          path: ["Moda", "Erkek Giyim"],
          children: [
            { id: "mens-shirts", name: "Gömlekler", path: ["Moda", "Erkek Giyim", "Gömlekler"] },
            { id: "mens-pants", name: "Pantolonlar", path: ["Moda", "Erkek Giyim", "Pantolonlar"] },
          ],
        },
        {
          id: "womens",
          name: "Kadın Giyim",
          path: ["Moda", "Kadın Giyim"],
          children: [
            { id: "womens-dresses", name: "Elbiseler", path: ["Moda", "Kadın Giyim", "Elbiseler"] },
            { id: "womens-tops", name: "Üstler", path: ["Moda", "Kadın Giyim", "Üstler"] },
          ],
        },
      ],
    },
    {
      id: "home",
      name: "Ev ve Yaşam",
      path: ["Ev ve Yaşam"],
      children: [
        {
          id: "kitchen",
          name: "Mutfak",
          path: ["Ev ve Yaşam", "Mutfak"],
          children: [
            { id: "cookware", name: "Pişirme Gereçleri", path: ["Ev ve Yaşam", "Mutfak", "Pişirme Gereçleri"] },
            { id: "appliances", name: "Küçük Ev Aletleri", path: ["Ev ve Yaşam", "Mutfak", "Küçük Ev Aletleri"] },
          ],
        },
        {
          id: "furniture",
          name: "Mobilya",
          path: ["Ev ve Yaşam", "Mobilya"],
          children: [
            { id: "chairs", name: "Sandalyeler", path: ["Ev ve Yaşam", "Mobilya", "Sandalyeler"] },
            { id: "tables", name: "Masalar", path: ["Ev ve Yaşam", "Mobilya", "Masalar"] },
          ],
        },
      ],
    },
    {
      id: "beauty",
      name: "Güzellik ve Kişisel Bakım",
      path: ["Güzellik ve Kişisel Bakım"],
      children: [
        { id: "skincare", name: "Cilt Bakımı", path: ["Güzellik ve Kişisel Bakım", "Cilt Bakımı"], children: [] },
        { id: "makeup", name: "Makyaj", path: ["Güzellik ve Kişisel Bakım", "Makyaj"], children: [] },
        { id: "haircare", name: "Saç Bakımı", path: ["Güzellik ve Kişisel Bakım", "Saç Bakımı"], children: [] },
      ],
    },
  ];
}
