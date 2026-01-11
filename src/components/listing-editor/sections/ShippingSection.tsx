import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlatformConfig } from "@/config/platformConfigs";

interface ShippingSectionProps {
  shippingProfile?: string;
  weight?: number;
  weightUnit?: string;
  onShippingProfileChange: (profile: string | undefined) => void;
  onWeightChange: (weight: number | undefined) => void;
  onWeightUnitChange: (unit: string) => void;
  config: PlatformConfig;
}

export function ShippingSection({
  shippingProfile,
  weight,
  weightUnit,
  onShippingProfileChange,
  onWeightChange,
  onWeightUnitChange,
  config,
}: ShippingSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Shipping</h2>
      
      <div className="space-y-4">
        {/* Shipping Profile */}
        <div>
          <Label className="text-sm text-foreground mb-2 block">
            Shipping Profile
          </Label>
          <Select
            value={shippingProfile || ""}
            onValueChange={(value) => onShippingProfileChange(value || undefined)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select shipping profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Shipping</SelectItem>
              <SelectItem value="express">Express Shipping</SelectItem>
              <SelectItem value="free">Free Shipping</SelectItem>
              <SelectItem value="calculated">Calculated at checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-foreground mb-2 block">
              Weight
            </Label>
            <Input
              type="number"
              value={weight || ""}
              onChange={(e) => onWeightChange(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0"
              step="0.01"
              min="0"
              className="h-11"
            />
          </div>
          
          <div>
            <Label className="text-sm text-foreground mb-2 block">
              Unit
            </Label>
            <Select
              value={weightUnit || "kg"}
              onValueChange={onWeightUnitChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">Gram (g)</SelectItem>
                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="lb">Pound (lb)</SelectItem>
                <SelectItem value="oz">Ounce (oz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
