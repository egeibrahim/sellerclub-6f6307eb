import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListingCounts, ListingCounts } from "@/hooks/useListingCounts";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPlatformConfig } from "@/config/platformConfigs";

interface ShopConnection {
  id: string;
  shop_name: string;
  platform: string;
  shop_icon: string;
  shop_color: string;
  is_connected: boolean;
}

interface ShopFilterSidebarProps {
  shops: ShopConnection[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string | null) => void;
  onConnectShop: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  className?: string;
}

const statusItems: { key: keyof ListingCounts; label: string; color?: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Active", color: "bg-green-500" },
  { key: "draft", label: "Draft", color: "bg-yellow-500" },
  { key: "inactive", label: "Inactive", color: "bg-gray-400" },
  { key: "copy", label: "Copy", color: "bg-blue-500" },
  { key: "imported", label: "Imported", color: "bg-purple-500" },
  { key: "staging", label: "Staging", color: "bg-orange-500" },
];

export const ShopFilterSidebar = ({
  shops,
  selectedShopId,
  onSelectShop,
  onConnectShop,
  statusFilter,
  onStatusFilterChange,
  className,
}: ShopFilterSidebarProps) => {
  const [shopsOpen, setShopsOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const { counts, isLoading } = useListingCounts(selectedShopId);

  const selectedShop = shops.find(s => s.id === selectedShopId);

  return (
    <div className={cn(
      "w-56 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden",
      className
    )}>
      {/* Shop Selector Header */}
      <div className="p-3 border-b border-sidebar-border">
        <Collapsible open={shopsOpen} onOpenChange={setShopsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <div className="flex items-center gap-2">
              {selectedShop ? (
                <>
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: selectedShop.shop_color }}
                  >
                    {selectedShop.shop_icon}
                  </div>
                  <span className="truncate">{selectedShop.shop_name}</span>
                </>
              ) : (
                <>
                  <Store className="h-4 w-4" />
                  <span>Tüm Mağazalar</span>
                </>
              )}
            </div>
            {shopsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2 space-y-1">
            {/* All Shops Option */}
            <button
              onClick={() => onSelectShop(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                selectedShopId === null 
                  ? "bg-sidebar-primary/20 text-sidebar-primary" 
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Store className="h-4 w-4" />
              <span>Tüm Mağazalar</span>
            </button>

            {/* Shop List */}
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => onSelectShop(shop.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  selectedShopId === shop.id 
                    ? "bg-sidebar-primary/20 text-sidebar-primary" 
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: shop.shop_color }}
                >
                  {shop.shop_icon}
                </div>
                <span className="truncate">{shop.shop_name}</span>
                {!shop.is_connected && (
                  <span className="ml-auto text-xs text-yellow-500">●</span>
                )}
              </button>
            ))}

            {/* Connect Shop Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onConnectShop}
            >
              <Plus className="h-4 w-4" />
              <span>Connect shop</span>
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Status Filters */}
      <div className="flex-1 overflow-auto p-3">
        <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-sidebar-muted uppercase tracking-wide mb-2">
            <span>Status</span>
            {statusOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-0.5">
            {statusItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onStatusFilterChange(item.key)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
                  statusFilter === item.key 
                    ? "bg-sidebar-primary/20 text-sidebar-primary font-medium" 
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.color && (
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  )}
                  <span>{item.label}</span>
                </div>
                <span className="text-xs tabular-nums">
                  {isLoading ? "..." : counts[item.key]}
                </span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
