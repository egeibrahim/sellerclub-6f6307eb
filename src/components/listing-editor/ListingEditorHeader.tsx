import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlatformConfig } from "@/config/platformConfigs";

interface ListingEditorHeaderProps {
  platform: string;
  shopName?: string;
  shopColor?: string;
  shopIcon?: string;
  mode: 'create' | 'edit';
  config: PlatformConfig;
}

export function ListingEditorHeader({
  platform,
  shopName,
  shopColor,
  shopIcon,
  mode,
  config,
}: ListingEditorHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{config.name}</span>
            <span>·</span>
            <span>{shopName || 'My Store'}</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground mt-0.5">
            {mode === 'create' ? 'New listing' : 'Edit listing'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Shop Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: shopColor || config.color }}
            >
              {shopIcon || config.icon}
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">{config.name}</p>
              <p className="text-sm font-medium">{shopName || 'My Store'}</p>
            </div>
          </div>
          
          {/* Add Shop Button */}
          <Button variant="outline" size="sm" className="gap-1 text-primary border-primary hover:bg-primary/5">
            <Plus className="h-4 w-4" />
            Add shop
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
