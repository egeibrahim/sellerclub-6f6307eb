import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, ChevronRight, Sparkles, AlertCircle, Package, CheckCircle, XCircle } from "lucide-react";
import { useMarketplaceConnections, MARKETPLACE_CONFIGS } from "@/hooks/useMarketplaceConnections";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { MasterListing } from "@/hooks/useMasterListings";

interface CategoryMapping {
  listingId: string;
  listingTitle: string;
  categoryId: string | null;
  categoryName: string | null;
  isLoading: boolean;
  error: string | null;
}

interface PublishResult {
  listingId: string;
  listingTitle: string;
  success: boolean;
  error?: string;
}

interface BulkPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: MasterListing[];
}

// Helper to get base price from listing
const getBasePrice = (listing: MasterListing): number => {
  return listing.price ?? listing.base_price ?? 0;
};

// Helper to get SKU from listing
const getSku = (listing: MasterListing): string | null => {
  return listing.sku ?? listing.internal_sku ?? null;
};

export function BulkPublishDialog({ 
  open, 
  onOpenChange, 
  listings 
}: BulkPublishDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { connections } = useMarketplaceConnections();
  
  const [step, setStep] = useState<'select-channel' | 'category-mapping' | 'publishing' | 'results'>('select-channel');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([]);
  const [priceMarkup, setPriceMarkup] = useState(0);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('select-channel');
      setSelectedConnection(null);
      setCategoryMappings([]);
      setPriceMarkup(0);
      setPublishProgress(0);
      setPublishResults([]);
    }
  }, [open]);

  // Active connections only
  const activeConnections = connections.filter(c => c.is_active);

  // Get selected marketplace info
  const selectedMarketplace = selectedConnection 
    ? connections.find(c => c.id === selectedConnection)
    : null;
  
  const marketplaceConfig = selectedMarketplace 
    ? MARKETPLACE_CONFIGS.find(m => m.id === selectedMarketplace.marketplace)
    : null;

  // Filter out already published listings (check marketplace_listings table)
  const getEligibleListings = () => {
    return listings;
  };

  const eligibleListings = getEligibleListings();

  // Fetch AI category suggestions for all listings
  const fetchAllCategorySuggestions = async () => {
    if (!selectedMarketplace) return;

    const initialMappings: CategoryMapping[] = eligibleListings.map(listing => ({
      listingId: listing.id,
      listingTitle: listing.title,
      categoryId: null,
      categoryName: null,
      isLoading: true,
      error: null,
    }));
    setCategoryMappings(initialMappings);

    // Fetch categories in parallel (with concurrency limit)
    const batchSize = 3;
    for (let i = 0; i < eligibleListings.length; i += batchSize) {
      const batch = eligibleListings.slice(i, i + batchSize);
      await Promise.all(batch.map(async (listing) => {
        try {
          const { data, error } = await supabase.functions.invoke('ai-category-mapping', {
            body: {
              productTitle: listing.title,
              productDescription: listing.description,
              targetMarketplace: selectedMarketplace.marketplace,
            }
          });

          if (error) throw error;
          
          const bestSuggestion = data?.suggestions?.[0];
          
          setCategoryMappings(prev => prev.map(m => 
            m.listingId === listing.id 
              ? {
                  ...m,
                  categoryId: bestSuggestion?.category_id || null,
                  categoryName: bestSuggestion?.full_path || null,
                  isLoading: false,
                  error: bestSuggestion ? null : 'Kategori bulunamadı',
                }
              : m
          ));
        } catch (err) {
          console.error('Category mapping error:', err);
          setCategoryMappings(prev => prev.map(m => 
            m.listingId === listing.id 
              ? { ...m, isLoading: false, error: 'Kategori alınamadı' }
              : m
          ));
        }
      }));
    }
  };

  // Handle channel selection
  const handleSelectChannel = (connectionId: string) => {
    setSelectedConnection(connectionId);
  };

  // Proceed to category mapping
  const handleProceedToCategory = async () => {
    if (!selectedConnection) return;
    setStep('category-mapping');
    await fetchAllCategorySuggestions();
  };

  // Proceed to publishing
  const handleStartPublishing = async () => {
    const validMappings = categoryMappings.filter(m => m.categoryId && !m.error);
    if (validMappings.length === 0) {
      toast.error("Yayınlanacak geçerli ürün yok");
      return;
    }

    setStep('publishing');
    setPublishProgress(0);
    setPublishResults([]);

    const connection = connections.find(c => c.id === selectedConnection);
    let functionName = '';
    if (connection) {
      switch (connection.marketplace) {
        case 'trendyol': functionName = 'trendyol-sync'; break;
        case 'hepsiburada': functionName = 'hepsiburada-sync'; break;
        case 'ikas': functionName = 'ikas-sync'; break;
        case 'ciceksepeti': functionName = 'ciceksepeti-sync'; break;
        case 'n11': functionName = 'n11-sync'; break;
      }
    }

    const results: PublishResult[] = [];

    for (let i = 0; i < validMappings.length; i++) {
      const mapping = validMappings[i];
      const listing = listings.find(l => l.id === mapping.listingId);
      
      if (!listing || !user) {
        results.push({
          listingId: mapping.listingId,
          listingTitle: mapping.listingTitle,
          success: false,
          error: 'Ürün bulunamadı',
        });
        continue;
      }

      try {
        const basePrice = getBasePrice(listing);
        
        // Create marketplace_listings record instead of marketplace_products
        const { error: insertError } = await supabase
          .from('marketplace_listings')
          .insert({
            user_id: user.id,
            master_product_id: listing.id,
            shop_connection_id: selectedConnection,
            platform: connection?.marketplace || 'unknown',
            title: listing.title,
            description: listing.description,
            price: basePrice + priceMarkup,
            status: 'pending',
            sync_status: 'pending',
            marketplace_data: {
              category_id: mapping.categoryId,
              category_name: mapping.categoryName,
              price_markup: priceMarkup,
            },
          });

        if (insertError) throw insertError;

        // Call sync function if available
        if (functionName) {
          const images = listing.images || [];
          const primaryImage = images.find((img) => img.is_primary) || images[0];
          
          await supabase.functions.invoke(functionName, {
            body: {
              action: 'createProduct',
              connectionId: selectedConnection,
              product: {
                title: listing.title,
                description: listing.description,
                price: basePrice + priceMarkup,
                stock: listing.total_stock || 0,
                sku: getSku(listing),
                brand: listing.brand,
                categoryId: mapping.categoryId,
                images: images.map((img) => img.url) || [],
                primaryImage: primaryImage?.url,
              }
            }
          });
        }

        results.push({
          listingId: listing.id,
          listingTitle: listing.title,
          success: true,
        });
      } catch (err) {
        console.error('Publish error:', err);
        results.push({
          listingId: listing.id,
          listingTitle: listing.title,
          success: false,
          error: (err as Error).message,
        });
      }

      setPublishProgress(((i + 1) / validMappings.length) * 100);
      setPublishResults([...results]);
    }

    setStep('results');
    queryClient.invalidateQueries({ queryKey: ['master-listings'] });
  };

  const successCount = publishResults.filter(r => r.success).length;
  const failCount = publishResults.filter(r => !r.success).length;
  const isAllLoading = categoryMappings.some(m => m.isLoading);
  const validCategoryCount = categoryMappings.filter(m => m.categoryId && !m.error).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {step === 'select-channel' && `Toplu Yayınla (${listings.length} ürün)`}
            {step === 'category-mapping' && 'Kategori Eşleştirme'}
            {step === 'publishing' && 'Yayınlanıyor...'}
            {step === 'results' && 'Yayın Sonuçları'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Channel */}
        {step === 'select-channel' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{listings.length} ürünü</span> hangi pazaryerine yayınlamak istiyorsunuz?
            </p>

            {activeConnections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Aktif pazaryeri bağlantınız yok.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {activeConnections.map((connection) => {
                  const config = MARKETPLACE_CONFIGS.find(m => m.id === connection.marketplace);
                  
                  return (
                    <button
                      key={connection.id}
                      onClick={() => handleSelectChannel(connection.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedConnection === connection.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: config?.color || '#666' }}
                      >
                        {config?.logo || connection.marketplace[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{config?.name || connection.marketplace}</p>
                        {connection.store_name && (
                          <p className="text-sm text-muted-foreground">{connection.store_name}</p>
                        )}
                      </div>
                      <Badge variant="outline">{eligibleListings.length} ürün</Badge>
                      {selectedConnection === connection.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleProceedToCategory} 
                disabled={!selectedConnection}
              >
                Devam
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Category Mapping */}
        {step === 'category-mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI kategori eşleştirmesi
              </div>
              {isAllLoading ? (
                <Badge variant="outline">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Analiz ediliyor...
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600">
                  {validCategoryCount}/{categoryMappings.length} eşleşti
                </Badge>
              )}
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {categoryMappings.map((mapping) => (
                  <div 
                    key={mapping.listingId}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <p className="font-medium text-sm truncate">{mapping.listingTitle}</p>
                    {mapping.isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Kategori aranıyor...
                      </div>
                    ) : mapping.error ? (
                      <p className="text-sm text-destructive mt-1">{mapping.error}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        → {mapping.categoryName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <Label>Fiyat Farkı (tüm ürünlere uygulanır)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceMarkup}
                  onChange={(e) => setPriceMarkup(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">₺</span>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('select-channel')}>
                Geri
              </Button>
              <Button 
                onClick={handleStartPublishing} 
                disabled={isAllLoading || validCategoryCount === 0}
              >
                {validCategoryCount} Ürünü Yayınla
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Publishing */}
        {step === 'publishing' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Ürünler yayınlanıyor...</p>
              <p className="text-sm text-muted-foreground mt-1">
                {publishResults.length} / {categoryMappings.filter(m => m.categoryId).length} tamamlandı
              </p>
            </div>
            <Progress value={publishProgress} className="h-2" />
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-center py-2">
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-2xl font-bold">{successCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Başarılı</p>
              </div>
              {failCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{failCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Başarısız</p>
                </div>
              )}
            </div>

            <ScrollArea className="h-48">
              <div className="space-y-2 pr-4">
                {publishResults.map((result) => (
                  <div 
                    key={result.listingId}
                    className={`p-3 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">{result.listingTitle}</p>
                    </div>
                    {result.error && (
                      <p className="text-xs text-destructive mt-1 ml-6">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}