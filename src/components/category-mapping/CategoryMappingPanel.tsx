import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Sparkles, 
  Search, 
  ChevronRight, 
  Check, 
  RefreshCw,
  ArrowRight,
  FolderTree,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategorySuggestion {
  category_id: string;
  category_name: string;
  full_path: string;
  confidence_score: number;
}

interface CategoryMappingPanelProps {
  productTitle: string;
  productDescription?: string;
  sourceCategoryPath?: string;
  targetMarketplace: string;
  onCategorySelect: (category: CategorySuggestion) => void;
  selectedCategory?: CategorySuggestion | null;
  compact?: boolean;
}

export function CategoryMappingPanel({
  productTitle,
  productDescription,
  sourceCategoryPath,
  targetMarketplace,
  onCategorySelect,
  selectedCategory,
  compact = false,
}: CategoryMappingPanelProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "search" | "browse">("ai");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CategorySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [browseCategories, setBrowseCategories] = useState<CategorySuggestion[]>([]);
  const [browsePath, setBrowsePath] = useState<string[]>([]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);

  // Fetch AI suggestions
  const fetchAISuggestions = useCallback(async () => {
    if (!productTitle || !targetMarketplace) return;

    setIsLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-category-mapping', {
        body: {
          productTitle,
          productDescription,
          targetMarketplace,
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        const mappedSuggestions: CategorySuggestion[] = data.suggestions.map((s: any) => ({
          category_id: s.category_id,
          category_name: s.category_name,
          full_path: s.full_path,
          confidence_score: s.confidence_score,
        }));
        setSuggestions(mappedSuggestions);
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      toast.error("Kategori önerileri alınamadı");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [productTitle, productDescription, targetMarketplace]);

  // Auto-fetch on mount
  useEffect(() => {
    if (productTitle && targetMarketplace) {
      fetchAISuggestions();
    }
  }, []);

  // Search categories
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('marketplace_id', targetMarketplace)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      setSearchResults(data?.map(cat => ({
        category_id: cat.remote_id || cat.id,
        category_name: cat.name,
        full_path: cat.full_path || cat.name,
        confidence_score: 0,
      })) || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [targetMarketplace]);

  // Browse categories
  const loadBrowseCategories = useCallback(async (parentId?: string) => {
    setIsLoadingBrowse(true);
    try {
      let query = supabase
        .from('marketplace_categories')
        .select('*')
        .eq('marketplace_id', targetMarketplace)
        .limit(50);

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      setBrowseCategories(data?.map(cat => ({
        category_id: cat.remote_id || cat.id,
        category_name: cat.name,
        full_path: cat.full_path || cat.name,
        confidence_score: 0,
      })) || []);
    } catch (err) {
      console.error('Browse error:', err);
    } finally {
      setIsLoadingBrowse(false);
    }
  }, [targetMarketplace]);

  // Load root categories on browse tab
  useEffect(() => {
    if (activeTab === 'browse' && browseCategories.length === 0) {
      loadBrowseCategories();
    }
  }, [activeTab, loadBrowseCategories]);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.5) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  const renderCategoryItem = (category: CategorySuggestion, showConfidence = false) => {
    const isSelected = selectedCategory?.category_id === category.category_id;
    
    return (
      <button
        key={category.category_id}
        onClick={() => onCategorySelect(category)}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
            : 'hover:bg-muted/50 hover:border-muted-foreground/20'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{category.category_name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {category.full_path}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showConfidence && category.confidence_score > 0 && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getConfidenceColor(category.confidence_score)}`}
              >
                %{Math.round(category.confidence_score * 100)}
              </Badge>
            )}
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>
      </button>
    );
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Source Category Display */}
        {sourceCategoryPath && (
          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
            <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">{sourceCategoryPath}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">
              {selectedCategory?.category_name || "Seçilmedi"}
            </span>
          </div>
        )}

        {/* AI Suggestions */}
        {isLoadingSuggestions ? (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kategoriler analiz ediliyor...
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI Önerileri
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchAISuggestions}
                disabled={isLoadingSuggestions}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
            </div>
            <div className="space-y-1.5">
              {suggestions.slice(0, 3).map(cat => renderCategoryItem(cat, true))}
            </div>
          </div>
        )}

        {/* Quick Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Manuel kategori ara..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchResults.length > 0 && (
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {searchResults.map(cat => (
                  <button
                    key={cat.category_id}
                    onClick={() => {
                      onCategorySelect(cat);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-muted/50 text-sm"
                  >
                    <span className="truncate block">{cat.full_path}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          Kategori Eşleştirme
        </CardTitle>
        {sourceCategoryPath && (
          <div className="flex items-center gap-2 text-sm mt-2 p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Kaynak:</span>
            <span className="font-medium truncate">{sourceCategoryPath}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="gap-1.5">
              <Zap className="h-4 w-4" />
              AI Önerileri
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5">
              <Search className="h-4 w-4" />
              Arama
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5">
              <FolderTree className="h-4 w-4" />
              Gezin
            </TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="ai" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ürün başlığına göre önerilen kategoriler
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAISuggestions}
                  disabled={isLoadingSuggestions}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </div>

              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Kategoriler analiz ediliyor...</p>
                  <p className="text-xs mt-1">"{productTitle.substring(0, 50)}..."</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Öneri bulunamadı</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={fetchAISuggestions}
                    className="mt-1"
                  >
                    Tekrar dene
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map(cat => renderCategoryItem(cat, true))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="mt-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kategori adı veya anahtar kelime..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Aranıyor...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {searchResults.map(cat => renderCategoryItem(cat, false))}
                  </div>
                </ScrollArea>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sonuç bulunamadı</p>
                  <p className="text-xs mt-1">Farklı anahtar kelimeler deneyin</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kategori aramak için en az 2 karakter girin</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-4">
            <div className="space-y-3">
              {/* Breadcrumb */}
              {browsePath.length > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => {
                      setBrowsePath([]);
                      loadBrowseCategories();
                    }}
                  >
                    Ana Kategoriler
                  </Button>
                  {browsePath.map((path, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-muted-foreground">{path}</span>
                    </span>
                  ))}
                </div>
              )}

              {isLoadingBrowse ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Yükleniyor...</span>
                </div>
              ) : browseCategories.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-1 pr-4">
                    {browseCategories.map(cat => (
                      <button
                        key={cat.category_id}
                        onClick={() => onCategorySelect(cat)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                          selectedCategory?.category_id === cat.category_id
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-sm truncate">{cat.category_name}</span>
                        <div className="flex items-center gap-1">
                          {selectedCategory?.category_id === cat.category_id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kategori bulunamadı</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Category Display */}
        {selectedCategory && (
          <div className="mt-4 p-3 rounded-lg border border-primary bg-primary/5">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">Seçilen Kategori</p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedCategory.full_path}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
