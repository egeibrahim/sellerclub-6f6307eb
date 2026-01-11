import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformConfig } from "@/config/platformConfigs";

interface PriceSectionProps {
  price: number;
  compareAtPrice?: number;
  onPriceChange: (price: number) => void;
  onCompareAtPriceChange: (price: number | undefined) => void;
  config: PlatformConfig;
}

export function PriceSection({
  price,
  compareAtPrice,
  onPriceChange,
  onCompareAtPriceChange,
  config,
}: PriceSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Price</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-foreground mb-2 block">
            Price <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₺
            </span>
            <Input
              type="number"
              value={price || ""}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="h-11 pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-foreground mb-2 block">
            Compare at price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₺
            </span>
            <Input
              type="number"
              value={compareAtPrice || ""}
              onChange={(e) => onCompareAtPriceChange(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="h-11 pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Original price to show discount
          </p>
        </div>
      </div>
    </div>
  );
}
