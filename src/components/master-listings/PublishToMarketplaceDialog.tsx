import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ChevronRight, AlertCircle } from "lucide-react";
import { useMarketplaceConnections, MARKETPLACE_CONFIGS } from "@/hooks/useMarketplaceConnections";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { MasterListing } from "@/hooks/useMasterListings";
import { CategoryMappingPanel, type CategorySuggestion } from "@/components/category-mapping/CategoryMappingPanel";

interface PublishToMarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MasterListing | null;
}

export function PublishToMarketplaceDialog({ 
  open, 
  onOpenChange, 
  listing 
}: PublishToMarketplaceDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { connections } = useMarketplaceConnections();
  
  const [step, setStep] = useState<'select-channel' | 'category-mapping' | 'confirm'>('select-channel');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategorySuggestion | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [priceMarkup, setPriceMarkup] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('select-channel');
      setSelectedConnection(null);
      setSelectedCategory(null);
      setPriceMarkup(0);
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

  // Handle channel selection
  const handleSelectChannel = (connectionId: string) => {
    setSelectedConnection(connectionId);
  };

  // Proceed to category mapping
  const handleProceedToCategory = () => {
    if (!selectedConnection) return;
    setStep('category-mapping');
  };

  // Proceed to confirm
  const handleProceedToConfirm = () => {
    if (!selectedCategory) {
      toast.error("Lütfen bir kategori seçin");
      return;
    }
    setStep('confirm');
  };

  // Publish to marketplace
  const handlePublish = async () => {
    if (!listing || !selectedConnection || !selectedCategory || !user) return;

    setIsPublishing(true);
    try {
      // Create marketplace_listings record instead of marketplace_products
      const connection = connections.find(c => c.id === selectedConnection);
      const { error: insertError } = await supabase
        .from('marketplace_listings')
        .insert({
          user_id: user.id,
          master_product_id: listing.id,
          shop_connection_id: selectedConnection,
          platform: connection?.marketplace || 'unknown',
          title: listing.title,
          description: listing.description,
          price: (listing.price || 0) + priceMarkup,
          status: 'pending',
          sync_status: 'pending',
          marketplace_data: {
            category_id: selectedCategory.category_id,
            category_name: selectedCategory.full_path,
            price_markup: priceMarkup,
          },
        });

      if (insertError) throw insertError;

      // Call sync function to push product
      if (connection) {
        let functionName = '';
        switch (connection.marketplace) {
          case 'trendyol':
            functionName = 'trendyol-sync';
            break;
          case 'hepsiburada':
            functionName = 'hepsiburada-sync';
            break;
          case 'ikas':
            functionName = 'ikas-sync';
            break;
          default:
            // Just create the record, don't sync yet
            break;
        }

        if (functionName) {
          const images = listing.images as any[] || [];
          const primaryImage = images.find((img: any) => img.is_primary) || images[0];
          
          await supabase.functions.invoke(functionName, {
            body: {
              action: 'createProduct',
              connectionId: selectedConnection,
              product: {
                title: listing.title,
                description: listing.description,
                price: (listing.price || 0) + priceMarkup,
                stock: 0,
                sku: listing.sku,
                brand: listing.brand,
                categoryId: selectedCategory.category_id,
                images: images.map((img: any) => img.url) || [],
                primaryImage: primaryImage?.url,
              }
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Ürün pazaryerine gönderildi");
      onOpenChange(false);
    } catch (err) {
      console.error('Publish error:', err);
      toast.error("Ürün gönderilemedi: " + (err as Error).message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-channel' && 'Pazaryeri Seçin'}
            {step === 'category-mapping' && 'Kategori Eşleştirme'}
            {step === 'confirm' && 'Yayın Onayı'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Channel */}
        {step === 'select-channel' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{listing.title}</span> ürününü hangi pazaryerine yayınlamak istiyorsunuz?
            </p>

            {activeConnections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Aktif pazaryeri bağlantınız yok.</p>
                <p className="text-sm">Önce Bağlantılar sayfasından bir pazaryeri ekleyin.</p>
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
        {step === 'category-mapping' && selectedMarketplace && (
          <div className="space-y-4">
            <CategoryMappingPanel
              productTitle={listing.title}
              productDescription={listing.description || undefined}
              sourceCategoryPath={listing.category || undefined}
              targetMarketplace={selectedMarketplace.marketplace}
              onCategorySelect={setSelectedCategory}
              selectedCategory={selectedCategory}
              compact
            />

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('select-channel')}>
                Geri
              </Button>
              <Button 
                onClick={handleProceedToConfirm} 
                disabled={!selectedCategory}
              >
                Devam
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ürün</span>
                <span className="font-medium">{listing.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pazaryeri</span>
                <span className="font-medium">{marketplaceConfig?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kategori</span>
                <span className="font-medium text-right max-w-[200px] truncate">
                  {selectedCategory?.category_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Baz Fiyat</span>
                <span className="font-medium">₺{(listing.price || 0).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fiyat Farkı (opsiyonel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceMarkup}
                  onChange={(e) => setPriceMarkup(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  = ₺{((listing.price || 0) + priceMarkup).toLocaleString('tr-TR')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu pazaryerine özel fiyat farkı ekleyebilirsiniz.
              </p>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('category-mapping')}>
                Geri
              </Button>
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yayınlanıyor...
                  </>
                ) : (
                  'Yayınla'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
