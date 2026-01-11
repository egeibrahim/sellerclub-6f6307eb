import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shop } from "@/contexts/ShopContext";
import { useListingCounts } from "@/hooks/useListingCounts";
import { toast } from "sonner";

interface CopyToShopPopupProps {
  targetPlatform: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  sourceShops: Shop[];
  onClose: () => void;
}

function ShopRow({ shop, onSelect }: { shop: Shop; onSelect: (shop: Shop) => void }) {
  const { counts } = useListingCounts(shop.id);
  
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(shop)}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: shop.color }}
      >
        {shop.icon}
      </div>
      <span className="text-sm font-medium text-foreground flex-1">{shop.name}</span>
      <span className="text-sm text-muted-foreground">{counts?.active || 0}</span>
    </div>
  );
}

export function CopyToShopPopup({ targetPlatform, sourceShops, onClose }: CopyToShopPopupProps) {
  const handleSelectSource = (shop: Shop) => {
    toast.success(`"Active" ürünler ${shop.name}'dan ${targetPlatform.name}'a kopyalanıyor...`);
    // Here you would implement the actual copy logic
    onClose();
  };

  if (sourceShops.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg shadow-lg w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Copy "Active" listings from</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz bağlı mağaza yok. Önce bir mağaza bağlayın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">Copy "Active" listings from</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Source Shops List */}
        <div className="py-1">
          {sourceShops.map((shop) => (
            <ShopRow key={shop.id} shop={shop} onSelect={handleSelectSource} />
          ))}
        </div>

        {/* Target indicator */}
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Hedef:</span>
            <div 
              className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: targetPlatform.color }}
            >
              {targetPlatform.icon}
            </div>
            <span className="text-xs font-medium">{targetPlatform.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
