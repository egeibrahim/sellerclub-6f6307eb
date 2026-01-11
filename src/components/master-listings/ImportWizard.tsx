import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package, ArrowRight, Check, AlertCircle } from "lucide-react";
import { useMarketplaceConnections } from "@/hooks/useMarketplaceConnections";
import { useMasterListings } from "@/hooks/useMasterListings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportableProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  sku: string | null;
  images: string[];
  selected: boolean;
}

type WizardStep = 'select-source' | 'fetching' | 'select-products' | 'importing' | 'complete';

const MARKETPLACE_LABELS: Record<string, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  ikas: 'ikas',
  ciceksepeti: 'Çiçeksepeti',
  amazon_tr: 'Amazon',
  n11: 'N11',
  etsy: 'Etsy',
  ticimax: 'Ticimax',
};

export function ImportWizard({ open, onOpenChange }: ImportWizardProps) {
  const { connections } = useMarketplaceConnections();
  const { createMasterListing, addImage } = useMasterListings();
  
  const [step, setStep] = useState<WizardStep>('select-source');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [products, setProducts] = useState<ImportableProduct[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const activeConnections = connections.filter(c => c.is_active);

  const resetWizard = () => {
    setStep('select-source');
    setSelectedConnection(null);
    setProducts([]);
    setImportProgress({ current: 0, total: 0 });
    setImportedCount(0);
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const fetchProductsFromMarketplace = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setStep('fetching');
    setError(null);

    try {
      // Fetch products based on marketplace type
      const functionName = `${connection.marketplace}-sync`;
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'fetch-products',
          connectionId 
        },
      });

      if (error) throw error;

      const fetchedProducts: ImportableProduct[] = (data.products || []).map((p: any) => ({
        id: p.id || p.sku || Math.random().toString(),
        title: p.title || p.name || 'Ürün',
        price: p.price || 0,
        stock: p.stock || p.quantity || 0,
        sku: p.sku || null,
        images: p.images || [],
        selected: true,
      }));

      setProducts(fetchedProducts);
      setStep('select-products');
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Ürünler çekilemedi');
      setStep('select-source');
    }
  };

  const handleSourceSelect = (connectionId: string) => {
    setSelectedConnection(connectionId);
    fetchProductsFromMarketplace(connectionId);
  };

  const toggleProduct = (productId: string) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, selected: !p.selected } : p)
    );
  };

  const toggleAll = (selected: boolean) => {
    setProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleImport = async () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      toast.error('En az bir ürün seçin');
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: selectedProducts.length });

    let imported = 0;

    for (const product of selectedProducts) {
      try {
        // Create master listing
        const result = await createMasterListing.mutateAsync({
          title: product.title,
          base_price: product.price,
          total_stock: product.stock,
          internal_sku: product.sku,
        });

        // Add images if any
        if (product.images.length > 0 && result?.id) {
          for (let i = 0; i < product.images.length; i++) {
            await addImage.mutateAsync({
              masterListingId: result.id,
              url: product.images[i],
              isPrimary: i === 0,
            });
          }
        }

        imported++;
      } catch (err) {
        console.error('Failed to import product:', product.title, err);
      }

      setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    setImportedCount(imported);
    setStep('complete');
  };

  const selectedCount = products.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-source' && 'Kaynak Seçin'}
            {step === 'fetching' && 'Ürünler Çekiliyor...'}
            {step === 'select-products' && 'İthal Edilecek Ürünleri Seçin'}
            {step === 'importing' && 'Ürünler İthal Ediliyor...'}
            {step === 'complete' && 'İthalat Tamamlandı'}
          </DialogTitle>
        </DialogHeader>

        {/* Select Source */}
        {step === 'select-source' && (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {activeConnections.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aktif pazaryeri bağlantısı bulunamadı.
                </p>
                <Button variant="outline" className="mt-4" onClick={handleClose}>
                  Bağlantılar Sayfasına Git
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {activeConnections.map((connection) => (
                  <button
                    key={connection.id}
                    onClick={() => handleSourceSelect(connection.id)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium">
                        {MARKETPLACE_LABELS[connection.marketplace] || connection.marketplace}
                      </p>
                      {connection.store_name && (
                        <p className="text-sm text-muted-foreground">{connection.store_name}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fetching */}
        {step === 'fetching' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Pazaryerinden ürünler çekiliyor...</p>
          </div>
        )}

        {/* Select Products */}
        {step === 'select-products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {products.length} ürün bulundu
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Tümünü Seç
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Seçimi Kaldır
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={product.selected}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>₺{product.price.toLocaleString('tr-TR')}</span>
                        <span>•</span>
                        <span>{product.stock} stok</span>
                        {product.sku && (
                          <>
                            <span>•</span>
                            <span>SKU: {product.sku}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {product.images.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {product.images.length} görsel
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select-source')}>
                Geri
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                {selectedCount} Ürünü İthal Et
              </Button>
            </div>
          </div>
        )}

        {/* Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground mb-2">
              Ürünler ithal ediliyor...
            </p>
            <p className="text-sm text-muted-foreground">
              {importProgress.current} / {importProgress.total}
            </p>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium mb-1">İthalat Tamamlandı</p>
            <p className="text-sm text-muted-foreground mb-6">
              {importedCount} ürün başarıyla master ürünlere eklendi.
            </p>
            <Button onClick={handleClose}>Kapat</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
