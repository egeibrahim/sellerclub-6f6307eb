import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformConfig } from "@/config/platformConfigs";

interface InventorySectionProps {
  quantity: number;
  sku: string;
  onQuantityChange: (quantity: number) => void;
  onSkuChange: (sku: string) => void;
  config: PlatformConfig;
}

export function InventorySection({
  quantity,
  sku,
  onQuantityChange,
  onSkuChange,
  config,
}: InventorySectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Inventory</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-foreground mb-2 block">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value) || 0)}
            placeholder="1"
            min="0"
            className="h-11"
          />
        </div>
        
        <div>
          <Label className="text-sm text-foreground mb-2 block">
            SKU {config.requiresSku && <span className="text-destructive">*</span>}
          </Label>
          <Input
            value={sku}
            onChange={(e) => onSkuChange(e.target.value)}
            placeholder="Stock code"
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
