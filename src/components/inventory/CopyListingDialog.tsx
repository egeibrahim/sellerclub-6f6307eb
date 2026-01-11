import { useState } from "react";
import { Copy, Sparkles, ChevronRight, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getPlatformConfig } from "@/config/platformConfigs";

interface ShopConnection {
  id: string;
  shop_name: string;
  platform: string;
  shop_icon: string;
  shop_color: string;
  is_connected: boolean;
}

interface CopyListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedListings: string[];
  shops: ShopConnection[];
  currentShopId: string | null;
}

export const CopyListingDialog = ({
  open,
  onOpenChange,
  selectedListings,
  shops,
  currentShopId,
}: CopyListingDialogProps) => {
  const [selectedTargetShop, setSelectedTargetShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyType, setCopyType] = useState<'standard' | 'ai' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentShop = shops.find(s => s.id === currentShopId);
  const targetShops = currentShopId 
    ? [{ id: currentShopId, name: 'Same Shop', isCurrent: true }, ...shops.filter(s => s.id !== currentShopId).map(s => ({ ...s, isCurrent: false }))]
    : shops.map(s => ({ ...s, isCurrent: false }));

  const handleCopy = async (type: 'standard' | 'ai') => {
    if (!selectedTargetShop || !user) return;

    setIsLoading(true);
    setCopyType(type);

    try {
      // Fetch selected listings
      const { data: listings, error: fetchError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('id', selectedListings);

      if (fetchError) throw fetchError;

      const targetShop = shops.find(s => s.id === selectedTargetShop);
      const targetConfig = targetShop ? getPlatformConfig(targetShop.platform) : null;

      // Process and copy each listing
      const copyPromises = listings?.map(async (listing) => {
        let newTitle = listing.title;
        let newDescription = listing.description;

        // If AI Copy, optimize title and description
        if (type === 'ai' && targetConfig) {
          try {
            const { data: aiResult } = await supabase.functions.invoke('ai-mapping', {
              body: {
                action: 'optimize',
                title: listing.title,
                description: listing.description,
                platform: targetShop?.platform,
                maxTitleLength: targetConfig.titleMaxLength,
                maxDescriptionLength: targetConfig.descriptionMaxLength,
              },
            });

            if (aiResult?.title) newTitle = aiResult.title;
            if (aiResult?.description) newDescription = aiResult.description;
          } catch (aiError) {
            console.error('AI optimization failed, using standard copy:', aiError);
          }
        }

        // Truncate if needed for standard copy
        if (type === 'standard' && targetConfig) {
          if (newTitle.length > targetConfig.titleMaxLength) {
            newTitle = newTitle.substring(0, targetConfig.titleMaxLength - 3) + '...';
          }
          if (newDescription && newDescription.length > targetConfig.descriptionMaxLength) {
            newDescription = newDescription.substring(0, targetConfig.descriptionMaxLength - 3) + '...';
          }
        }

        // Create new listing with 'copy' status
        return supabase
          .from('marketplace_listings')
          .insert({
            user_id: user.id,
            shop_connection_id: selectedTargetShop === currentShopId ? listing.shop_connection_id : selectedTargetShop,
            platform: targetShop?.platform || listing.platform,
            title: newTitle,
            description: newDescription,
            price: listing.price,
            marketplace_data: listing.marketplace_data,
            status: 'copy',
            sync_status: 'pending',
          });
      });

      if (copyPromises) {
        await Promise.all(copyPromises);
      }

      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-counts'] });

      toast({
        title: "Listings Copied",
        description: `${selectedListings.length} listing(s) copied to ${targetShop?.shop_name || 'target shop'} with ${type === 'ai' ? 'AI optimization' : 'standard copy'}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Failed to copy listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCopyType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Listings
          </DialogTitle>
          <DialogDescription>
            Copy {selectedListings.length} listing(s) to another shop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Shop Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Copy to:</label>
            <div className="grid gap-2">
              {/* Same Shop Option */}
              {currentShop && (
                <button
                  onClick={() => setSelectedTargetShop(currentShopId)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    selectedTargetShop === currentShopId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: currentShop.shop_color }}
                  >
                    {currentShop.shop_icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{currentShop.shop_name}</p>
                    <p className="text-xs text-muted-foreground">Same shop (duplicate)</p>
                  </div>
                  {selectedTargetShop === currentShopId && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </button>
              )}

              {/* Other Shops */}
              {shops.filter(s => s.id !== currentShopId).map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedTargetShop(shop.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    selectedTargetShop === shop.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    !shop.is_connected && "opacity-60"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: shop.shop_color }}
                  >
                    {shop.shop_icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{shop.shop_name}</p>
                    <p className="text-xs text-muted-foreground">{shop.platform}</p>
                  </div>
                  {!shop.is_connected && (
                    <span className="text-xs text-yellow-600">Not connected</span>
                  )}
                  {selectedTargetShop === shop.id && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Copy Type Buttons */}
          {selectedTargetShop && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCopy('standard')}
                disabled={isLoading}
              >
                <Copy className="h-4 w-4 mr-2" />
                {isLoading && copyType === 'standard' ? 'Copying...' : 'Standard'}
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                onClick={() => handleCopy('ai')}
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoading && copyType === 'ai' ? 'Optimizing...' : 'AI Copy'}
              </Button>
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Standard:</strong> Copies as-is, truncates if exceeds limits</p>
            <p><strong>AI Copy:</strong> Optimizes title & description for target platform</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
