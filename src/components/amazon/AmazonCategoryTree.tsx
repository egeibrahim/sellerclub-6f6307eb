import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, Loader2, FolderOpen, Folder } from "lucide-react";

interface Category {
  id: string;
  name: string;
  path: string[];
  children?: Category[];
  requiredAttributes?: string[];
}

interface AmazonCategoryTreeProps {
  onCategorySelect: (category: Category | null) => void;
  selectedCategory: Category | null;
}

// Static Amazon Turkey category tree (simplified version)
const AMAZON_CATEGORIES: Category[] = [
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
          { id: "laptops", name: "Dizüstü Bilgisayarlar", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Dizüstü Bilgisayarlar"], requiredAttributes: ["brand", "screenSize", "processor", "ram", "storage"] },
          { id: "desktops", name: "Masaüstü Bilgisayarlar", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Masaüstü Bilgisayarlar"], requiredAttributes: ["brand", "processor", "ram", "storage"] },
          { id: "monitors", name: "Monitörler", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Monitörler"], requiredAttributes: ["brand", "screenSize", "resolution", "panelType"] },
          { id: "keyboards", name: "Klavyeler", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Klavyeler"], requiredAttributes: ["brand", "connectionType", "layout"] },
          { id: "mice", name: "Fareler", path: ["Elektronik", "Bilgisayar ve Aksesuarlar", "Fareler"], requiredAttributes: ["brand", "connectionType", "dpi"] },
        ],
      },
      {
        id: "phones",
        name: "Cep Telefonları ve Aksesuarlar",
        path: ["Elektronik", "Cep Telefonları ve Aksesuarlar"],
        children: [
          { id: "smartphones", name: "Akıllı Telefonlar", path: ["Elektronik", "Cep Telefonları ve Aksesuarlar", "Akıllı Telefonlar"], requiredAttributes: ["brand", "operatingSystem", "screenSize", "storage", "ram"] },
          { id: "cases", name: "Kılıflar", path: ["Elektronik", "Cep Telefonları ve Aksesuarlar", "Kılıflar"], requiredAttributes: ["brand", "compatibleModel", "material"] },
          { id: "chargers", name: "Şarj Cihazları", path: ["Elektronik", "Cep Telefonları ve Aksesuarlar", "Şarj Cihazları"], requiredAttributes: ["brand", "outputPower", "connectionType"] },
        ],
      },
      {
        id: "audio",
        name: "Kulaklıklar ve Hoparlörler",
        path: ["Elektronik", "Kulaklıklar ve Hoparlörler"],
        children: [
          { id: "headphones", name: "Kulaklıklar", path: ["Elektronik", "Kulaklıklar ve Hoparlörler", "Kulaklıklar"], requiredAttributes: ["brand", "connectionType", "noiseCancelling"] },
          { id: "speakers", name: "Hoparlörler", path: ["Elektronik", "Kulaklıklar ve Hoparlörler", "Hoparlörler"], requiredAttributes: ["brand", "connectionType", "power"] },
          { id: "earbuds", name: "Kablosuz Kulaklıklar", path: ["Elektronik", "Kulaklıklar ve Hoparlörler", "Kablosuz Kulaklıklar"], requiredAttributes: ["brand", "batteryLife", "noiseCancelling"] },
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
          { id: "mens-shirts", name: "Gömlekler", path: ["Moda", "Erkek Giyim", "Gömlekler"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "mens-pants", name: "Pantolonlar", path: ["Moda", "Erkek Giyim", "Pantolonlar"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "mens-tshirts", name: "Tişörtler", path: ["Moda", "Erkek Giyim", "Tişörtler"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "mens-jackets", name: "Ceketler", path: ["Moda", "Erkek Giyim", "Ceketler"], requiredAttributes: ["brand", "size", "color", "material"] },
        ],
      },
      {
        id: "womens",
        name: "Kadın Giyim",
        path: ["Moda", "Kadın Giyim"],
        children: [
          { id: "womens-dresses", name: "Elbiseler", path: ["Moda", "Kadın Giyim", "Elbiseler"], requiredAttributes: ["brand", "size", "color", "material", "style"] },
          { id: "womens-tops", name: "Üstler", path: ["Moda", "Kadın Giyim", "Üstler"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "womens-pants", name: "Pantolonlar", path: ["Moda", "Kadın Giyim", "Pantolonlar"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "womens-skirts", name: "Etekler", path: ["Moda", "Kadın Giyim", "Etekler"], requiredAttributes: ["brand", "size", "color", "material"] },
        ],
      },
      {
        id: "shoes",
        name: "Ayakkabılar",
        path: ["Moda", "Ayakkabılar"],
        children: [
          { id: "mens-shoes", name: "Erkek Ayakkabıları", path: ["Moda", "Ayakkabılar", "Erkek Ayakkabıları"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "womens-shoes", name: "Kadın Ayakkabıları", path: ["Moda", "Ayakkabılar", "Kadın Ayakkabıları"], requiredAttributes: ["brand", "size", "color", "heelHeight"] },
          { id: "sports-shoes", name: "Spor Ayakkabılar", path: ["Moda", "Ayakkabılar", "Spor Ayakkabılar"], requiredAttributes: ["brand", "size", "color", "sportType"] },
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
          { id: "cookware", name: "Pişirme Gereçleri", path: ["Ev ve Yaşam", "Mutfak", "Pişirme Gereçleri"], requiredAttributes: ["brand", "material", "size"] },
          { id: "appliances", name: "Küçük Ev Aletleri", path: ["Ev ve Yaşam", "Mutfak", "Küçük Ev Aletleri"], requiredAttributes: ["brand", "power", "capacity"] },
          { id: "storage", name: "Saklama Kapları", path: ["Ev ve Yaşam", "Mutfak", "Saklama Kapları"], requiredAttributes: ["brand", "material", "capacity"] },
        ],
      },
      {
        id: "furniture",
        name: "Mobilya",
        path: ["Ev ve Yaşam", "Mobilya"],
        children: [
          { id: "chairs", name: "Sandalyeler", path: ["Ev ve Yaşam", "Mobilya", "Sandalyeler"], requiredAttributes: ["brand", "material", "color", "dimensions"] },
          { id: "tables", name: "Masalar", path: ["Ev ve Yaşam", "Mobilya", "Masalar"], requiredAttributes: ["brand", "material", "color", "dimensions"] },
          { id: "storage-furniture", name: "Dolap ve Raflar", path: ["Ev ve Yaşam", "Mobilya", "Dolap ve Raflar"], requiredAttributes: ["brand", "material", "color", "dimensions"] },
        ],
      },
      {
        id: "decor",
        name: "Dekorasyon",
        path: ["Ev ve Yaşam", "Dekorasyon"],
        children: [
          { id: "lighting", name: "Aydınlatma", path: ["Ev ve Yaşam", "Dekorasyon", "Aydınlatma"], requiredAttributes: ["brand", "style", "bulbType"] },
          { id: "rugs", name: "Halı ve Kilim", path: ["Ev ve Yaşam", "Dekorasyon", "Halı ve Kilim"], requiredAttributes: ["brand", "material", "dimensions", "color"] },
          { id: "wall-art", name: "Duvar Dekorasyonu", path: ["Ev ve Yaşam", "Dekorasyon", "Duvar Dekorasyonu"], requiredAttributes: ["brand", "dimensions", "style"] },
        ],
      },
    ],
  },
  {
    id: "beauty",
    name: "Güzellik ve Kişisel Bakım",
    path: ["Güzellik ve Kişisel Bakım"],
    children: [
      {
        id: "skincare",
        name: "Cilt Bakımı",
        path: ["Güzellik ve Kişisel Bakım", "Cilt Bakımı"],
        children: [
          { id: "moisturizers", name: "Nemlendiriciler", path: ["Güzellik ve Kişisel Bakım", "Cilt Bakımı", "Nemlendiriciler"], requiredAttributes: ["brand", "skinType", "volume"] },
          { id: "cleansers", name: "Temizleyiciler", path: ["Güzellik ve Kişisel Bakım", "Cilt Bakımı", "Temizleyiciler"], requiredAttributes: ["brand", "skinType", "volume"] },
          { id: "serums", name: "Serumlar", path: ["Güzellik ve Kişisel Bakım", "Cilt Bakımı", "Serumlar"], requiredAttributes: ["brand", "skinType", "volume", "activeIngredient"] },
        ],
      },
      {
        id: "makeup",
        name: "Makyaj",
        path: ["Güzellik ve Kişisel Bakım", "Makyaj"],
        children: [
          { id: "lipstick", name: "Rujlar", path: ["Güzellik ve Kişisel Bakım", "Makyaj", "Rujlar"], requiredAttributes: ["brand", "color", "finish"] },
          { id: "foundation", name: "Fondötenler", path: ["Güzellik ve Kişisel Bakım", "Makyaj", "Fondötenler"], requiredAttributes: ["brand", "shade", "coverage", "skinType"] },
          { id: "mascara", name: "Rimel", path: ["Güzellik ve Kişisel Bakım", "Makyaj", "Rimel"], requiredAttributes: ["brand", "color", "effect"] },
        ],
      },
      {
        id: "haircare",
        name: "Saç Bakımı",
        path: ["Güzellik ve Kişisel Bakım", "Saç Bakımı"],
        children: [
          { id: "shampoo", name: "Şampuanlar", path: ["Güzellik ve Kişisel Bakım", "Saç Bakımı", "Şampuanlar"], requiredAttributes: ["brand", "hairType", "volume"] },
          { id: "conditioner", name: "Saç Kremleri", path: ["Güzellik ve Kişisel Bakım", "Saç Bakımı", "Saç Kremleri"], requiredAttributes: ["brand", "hairType", "volume"] },
          { id: "styling", name: "Şekillendirici Ürünler", path: ["Güzellik ve Kişisel Bakım", "Saç Bakımı", "Şekillendirici Ürünler"], requiredAttributes: ["brand", "holdLevel", "volume"] },
        ],
      },
    ],
  },
  {
    id: "sports",
    name: "Spor ve Outdoor",
    path: ["Spor ve Outdoor"],
    children: [
      {
        id: "fitness",
        name: "Fitness",
        path: ["Spor ve Outdoor", "Fitness"],
        children: [
          { id: "equipment", name: "Ekipmanlar", path: ["Spor ve Outdoor", "Fitness", "Ekipmanlar"], requiredAttributes: ["brand", "type", "weight"] },
          { id: "apparel", name: "Spor Giyim", path: ["Spor ve Outdoor", "Fitness", "Spor Giyim"], requiredAttributes: ["brand", "size", "color", "material"] },
          { id: "accessories", name: "Aksesuarlar", path: ["Spor ve Outdoor", "Fitness", "Aksesuarlar"], requiredAttributes: ["brand", "type"] },
        ],
      },
      {
        id: "outdoor",
        name: "Outdoor",
        path: ["Spor ve Outdoor", "Outdoor"],
        children: [
          { id: "camping", name: "Kamp Malzemeleri", path: ["Spor ve Outdoor", "Outdoor", "Kamp Malzemeleri"], requiredAttributes: ["brand", "type", "capacity"] },
          { id: "hiking", name: "Yürüyüş Ekipmanları", path: ["Spor ve Outdoor", "Outdoor", "Yürüyüş Ekipmanları"], requiredAttributes: ["brand", "type"] },
          { id: "cycling", name: "Bisiklet", path: ["Spor ve Outdoor", "Outdoor", "Bisiklet"], requiredAttributes: ["brand", "type", "size"] },
        ],
      },
    ],
  },
  {
    id: "toys",
    name: "Oyuncak ve Bebek",
    path: ["Oyuncak ve Bebek"],
    children: [
      {
        id: "toys-games",
        name: "Oyuncaklar",
        path: ["Oyuncak ve Bebek", "Oyuncaklar"],
        children: [
          { id: "action-figures", name: "Aksiyon Figürleri", path: ["Oyuncak ve Bebek", "Oyuncaklar", "Aksiyon Figürleri"], requiredAttributes: ["brand", "ageRange", "material"] },
          { id: "board-games", name: "Kutu Oyunları", path: ["Oyuncak ve Bebek", "Oyuncaklar", "Kutu Oyunları"], requiredAttributes: ["brand", "ageRange", "playerCount"] },
          { id: "dolls", name: "Bebekler", path: ["Oyuncak ve Bebek", "Oyuncaklar", "Bebekler"], requiredAttributes: ["brand", "ageRange", "material"] },
        ],
      },
      {
        id: "baby",
        name: "Bebek Ürünleri",
        path: ["Oyuncak ve Bebek", "Bebek Ürünleri"],
        children: [
          { id: "diapers", name: "Bebek Bezi", path: ["Oyuncak ve Bebek", "Bebek Ürünleri", "Bebek Bezi"], requiredAttributes: ["brand", "size", "count"] },
          { id: "feeding", name: "Beslenme", path: ["Oyuncak ve Bebek", "Bebek Ürünleri", "Beslenme"], requiredAttributes: ["brand", "type", "ageRange"] },
          { id: "strollers", name: "Bebek Arabaları", path: ["Oyuncak ve Bebek", "Bebek Ürünleri", "Bebek Arabaları"], requiredAttributes: ["brand", "type", "maxWeight"] },
        ],
      },
    ],
  },
];

export function AmazonCategoryTree({
  onCategorySelect,
  selectedCategory,
}: AmazonCategoryTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Flatten categories for search
  const flattenCategories = (categories: Category[], parent?: Category): Category[] => {
    return categories.reduce<Category[]>((acc, cat) => {
      acc.push(cat);
      if (cat.children) {
        acc.push(...flattenCategories(cat.children, cat));
      }
      return acc;
    }, []);
  };

  const allCategories = flattenCategories(AMAZON_CATEGORIES);

  // Filter categories by search
  const filteredCategories = searchQuery
    ? allCategories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.path.join(" ").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle category selection
  const handleSelect = (category: Category) => {
    if (category.children && category.children.length > 0) {
      toggleCategory(category.id);
    } else {
      onCategorySelect(category);
      setSelectedPath(category.path);
    }
  };

  // Render category item
  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory?.id === category.id;
    const isLeaf = !hasChildren;

    return (
      <div key={category.id}>
        <button
          onClick={() => handleSelect(category)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
            isSelected && "bg-primary/10 text-primary font-medium",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <div className="w-4" />
          )}
          
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4 rounded border flex items-center justify-center">
              {isSelected && <div className="w-2 h-2 rounded-sm bg-primary" />}
            </div>
          )}
          
          <span className="flex-1">{category.name}</span>
          
          {isLeaf && category.requiredAttributes && (
            <Badge variant="outline" className="text-xs">
              {category.requiredAttributes.length} özellik
            </Badge>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kategori ara..."
          className="pl-9"
        />
      </div>

      {/* Category Tree */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="py-2">
          {searchQuery && filteredCategories ? (
            filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategorySelect(cat);
                    setSelectedPath(cat.path);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex flex-col items-start gap-1 px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-0",
                    selectedCategory?.id === cat.id && "bg-primary/10"
                  )}
                >
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat.path.join(" > ")}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sonuç bulunamadı</p>
              </div>
            )
          ) : (
            AMAZON_CATEGORIES.map((cat) => renderCategory(cat))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
