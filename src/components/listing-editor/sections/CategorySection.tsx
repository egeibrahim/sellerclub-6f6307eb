import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Search, Loader2, FolderOpen, Folder, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformCategories, PlatformCategory } from "@/hooks/usePlatformCategories";
import { Button } from "@/components/ui/button";

interface CategorySectionProps {
  platform: string;
  category: string;
  categoryPath: string[];
  onCategoryChange: (category: string, categoryPath: string[]) => void;
  error?: string;
  connectionId?: string;
}

export function CategorySection({
  platform,
  category,
  categoryPath,
  onCategoryChange,
  error,
  connectionId,
}: CategorySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const { 
    categories, 
    isLoading, 
    error: fetchError, 
    refetch,
    fetchCategoryAttributes 
  } = usePlatformCategories({ 
    platform, 
    connectionId 
  });

  // Flatten categories for search
  const flattenCategories = (cats: PlatformCategory[], parentPath: string[] = []): PlatformCategory[] => {
    return cats.reduce<PlatformCategory[]>((acc, cat) => {
      const path = cat.path || [...parentPath, cat.name];
      acc.push({ ...cat, path });
      if (cat.children && cat.children.length > 0) {
        acc.push(...flattenCategories(cat.children, path));
      }
      return acc;
    }, []);
  };

  const allCategories = flattenCategories(categories);

  // Filter categories by search
  const filteredCategories = searchQuery
    ? allCategories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.path?.join(" ").toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelect = async (cat: PlatformCategory) => {
    const hasChildren = cat.children && cat.children.length > 0;
    
    if (hasChildren) {
      toggleCategory(String(cat.id));
    } else {
      // Leaf category - select it
      const path = cat.path || [cat.name];
      onCategoryChange(String(cat.id), path);
      
      // Optionally fetch attributes for the selected category
      const attributes = await fetchCategoryAttributes(cat.id);
      if (attributes) {
        console.log(`Attributes for category ${cat.id}:`, attributes);
      }
    }
  };

  const renderCategory = (cat: PlatformCategory, level: number = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedCategories.has(String(cat.id));
    const isSelected = category === String(cat.id);
    const isLeaf = !hasChildren;

    return (
      <div key={cat.id}>
        <button
          onClick={() => handleSelect(cat)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors rounded-md",
            isSelected && "bg-primary/10 text-primary font-medium"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <div className="w-4" />
          )}
          
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            )
          ) : (
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center shrink-0",
              isSelected && "border-primary"
            )}>
              {isSelected && <div className="w-2 h-2 rounded-sm bg-primary" />}
            </div>
          )}
          
          <span className="flex-1 truncate">{cat.name}</span>
          
          {isLeaf && cat.requiredAttributes && cat.requiredAttributes.length > 0 && (
            <Badge variant="outline" className="text-xs shrink-0">
              {cat.requiredAttributes.length} özellik
            </Badge>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div>
            {cat.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Kategori <span className="text-destructive">*</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
          Yenile
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}
      
      {fetchError && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}
      
      {/* Selected Category Path */}
      {categoryPath.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
          {categoryPath.map((part, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              <span className={cn(
                index === categoryPath.length - 1 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}>
                {part}
              </span>
            </span>
          ))}
        </div>
      )}
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kategori ara..."
          className="pl-10 h-10"
        />
      </div>
      
      {/* Category Tree */}
      <ScrollArea className="h-[300px] border border-border rounded-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Kategoriler yükleniyor...</p>
          </div>
        ) : (
          <div className="p-2">
            {searchQuery && filteredCategories ? (
              filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onCategoryChange(String(cat.id), cat.path || [cat.name]);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex flex-col items-start gap-1 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0 rounded-md",
                      category === String(cat.id) && "bg-primary/10"
                    )}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {cat.path?.join(" > ") || cat.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sonuç bulunamadı</p>
                </div>
              )
            ) : categories.length > 0 ? (
              categories.map(cat => renderCategory(cat))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Kategori bulunamadı</p>
                <Button variant="link" size="sm" onClick={refetch} className="mt-2">
                  Tekrar dene
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Platform info */}
      <p className="text-xs text-muted-foreground mt-2">
        {getPlatformCategoryInfo(platform)}
      </p>
    </div>
  );
}

function getPlatformCategoryInfo(platform: string): string {
  switch (platform.toLowerCase()) {
    case "trendyol":
      return "Trendyol kategori ağacından seçim yapın. Alt kategorilere tıklayarak açabilirsiniz.";
    case "hepsiburada":
      return "Hepsiburada kategori yapısı. Ürününüze uygun kategoriyi seçin.";
    case "amazon":
      return "Amazon Türkiye kategorileri. Browse node seçimi yapın.";
    case "n11":
      return "N11 kategori ağacı. Doğru kategori SEO için önemlidir.";
    case "ciceksepeti":
      return "Çiçeksepeti kategorileri. Ürün tipine göre kategori seçin.";
    case "etsy":
      return "Etsy kategorileri. El yapımı ve vintage ürünler için optimize edilmiştir.";
    default:
      return "Ürününüz için en uygun kategoriyi seçin.";
  }
}
