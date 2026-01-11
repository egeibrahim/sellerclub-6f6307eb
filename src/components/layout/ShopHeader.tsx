import { useState } from "react";
import { Plus, RefreshCw, Settings, MoreVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ShopConnection {
  id: string;
  shop_name: string;
  platform: string;
  shop_icon: string;
  shop_color: string;
  is_connected: boolean;
  last_sync_at: string | null;
}

interface ShopHeaderProps {
  shop: ShopConnection | null;
  onSync?: () => void;
  onManageConnection?: () => void;
  isSyncing?: boolean;
  listingRoute?: string;
  className?: string;
}

export const ShopHeader = ({
  shop,
  onSync,
  onManageConnection,
  isSyncing = false,
  listingRoute = "/inventory/new",
  className,
}: ShopHeaderProps) => {
  const navigate = useNavigate();

  if (!shop) {
    return (
      <div className={cn("flex items-center justify-between p-4 border-b border-border bg-background", className)}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Tüm Mağazalar</h1>
        </div>
      </div>
    );
  }

  const lastSyncText = shop.last_sync_at 
    ? formatDistanceToNow(new Date(shop.last_sync_at), { addSuffix: true, locale: tr })
    : "Henüz senkronize edilmedi";

  return (
    <div className={cn("flex items-center justify-between p-4 border-b border-border bg-background", className)}>
      {/* Left: Shop Info */}
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: shop.shop_color }}
        >
          {shop.shop_icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{shop.shop_name}</h1>
            <Badge 
              variant={shop.is_connected ? "default" : "secondary"}
              className={cn(
                "text-xs",
                shop.is_connected ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""
              )}
            >
              {shop.is_connected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {shop.platform} • {lastSyncText}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Create Listing Button */}
        <Button
          onClick={() => navigate(listingRoute)}
          style={{ backgroundColor: shop.shop_color }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create listing
        </Button>

        {/* Sync Button */}
        {shop.is_connected && (
          <Button
            variant="outline"
            onClick={onSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        )}

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onManageConnection}>
              <Settings className="h-4 w-4 mr-2" />
              {shop.is_connected ? "Manage Connection" : "Connect"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open {shop.platform} Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
