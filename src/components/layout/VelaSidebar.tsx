import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop, Shop } from "@/contexts/ShopContext";
import { getPlatformConfig } from "@/config/platformConfigs";
import { useListingCounts } from "@/hooks/useListingCounts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CopyToShopPopup } from "@/components/inventory/CopyToShopPopup";
import { ConnectShopDialog } from "@/components/connections/ConnectShopDialog";

interface VelaSidebarProps {
  className?: string;
}

// All available platforms for inactive shops
const allPlatforms = [
  { id: 'etsy', name: 'Etsy', icon: 'E', color: '#F56400' },
  { id: 'amazon', name: 'Amazon', icon: 'A', color: '#FF9900' },
  { id: 'shopify', name: 'Shopify', icon: 'S', color: '#95BF47' },
  { id: 'trendyol', name: 'Trendyol', icon: 'T', color: '#FF6000' },
  { id: 'hepsiburada', name: 'Hepsiburada', icon: 'H', color: '#FF6600' },
  { id: 'ikas', name: 'ikas', icon: 'i', color: '#6366F1' },
  { id: 'n11', name: 'N11', icon: 'N', color: '#7B68EE' },
  { id: 'ciceksepeti', name: 'Çiçeksepeti', icon: 'Ç', color: '#E91E63' },
];

// Status filter items
const statusItems = [
  { key: "all", label: "Tüm Ürünler" },
  { key: "active", label: "Active", color: "bg-success" },
  { key: "draft", label: "Draft", color: "bg-warning" },
  { key: "inactive", label: "Inactive", color: "bg-muted-foreground" },
  { key: "copy", label: "Copy", color: "bg-primary" },
  { key: "imported", label: "Imported", color: "bg-purple-500" },
  { key: "staging", label: "Staging", color: "bg-blue-500" },
];

export function VelaSidebar({ className }: VelaSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { shops, selectedShop, setSelectedShop, isMasterView } = useShop();
  
  const [shopDropdownOpen, setShopDropdownOpen] = useState(true);
  const [inactiveShopsOpen, setInactiveShopsOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [copyPopupTarget, setCopyPopupTarget] = useState<typeof allPlatforms[0] | null>(null);

  // Get listing counts for selected shop
  const selectedShopId = isMasterView ? null : selectedShop.id;
  const { counts } = useListingCounts(selectedShopId);

  // Get status from URL
  const searchParams = new URLSearchParams(location.search);
  const currentStatus = searchParams.get("status") || "active";

  // Connected shops (excluding master)
  const connectedShops = shops.filter(s => s.id !== 'master' && s.isConnected);
  
  // Get inactive platforms (not connected)
  const connectedPlatformIds = connectedShops.map(s => s.platform.toLowerCase());
  const inactivePlatforms = allPlatforms.filter(p => !connectedPlatformIds.includes(p.id));

  // Master shop
  const masterShop = shops.find(s => s.id === 'master');

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    navigate('/inventory');
  };

  const handleSelectMaster = () => {
    if (masterShop) {
      setSelectedShop(masterShop);
      navigate('/master-listings');
    }
  };

  const handleConnectClick = (platformId: string) => {
    setConnectPlatform(platformId);
    setShowConnectDialog(true);
  };

  const handleCopyClick = (platform: typeof allPlatforms[0]) => {
    setCopyPopupTarget(platform);
  };

  const handleStatusChange = (status: string) => {
    const basePath = isMasterView ? '/master-listings' : '/inventory';
    if (status === 'all') {
      navigate(basePath);
    } else {
      navigate(`${basePath}?status=${status}`);
    }
  };

  return (
    <>
      <div className={cn(
        "w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full",
        className
      )}>
        {/* Master Listings - Fixed at top */}
        <div 
          className={cn(
            "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-sidebar-border",
            isMasterView 
              ? "bg-sidebar-accent" 
              : "hover:bg-sidebar-accent/50"
          )}
          onClick={handleSelectMaster}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            M
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground">Master Listings</span>
          </div>
          <span className="text-xs text-sidebar-muted">{counts?.all || 0}</span>
        </div>

        {/* Active Shop Dropdown */}
        <Collapsible open={shopDropdownOpen} onOpenChange={setShopDropdownOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              {!isMasterView && selectedShop.id !== 'master' ? (
                <>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: selectedShop.color }}
                  >
                    {selectedShop.icon}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-sidebar-foreground">{selectedShop.name}</span>
                    <span className="text-xs text-sidebar-muted">{selectedShop.platform}</span>
                  </div>
                </>
              ) : (
                <span className="text-sm font-medium text-sidebar-foreground">Mağazalar</span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-sidebar-muted transition-transform",
              shopDropdownOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>

          <CollapsibleContent className="border-b border-sidebar-border">
            {/* Connected Shops */}
            {connectedShops.map((shop) => (
              <div
                key={shop.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                  selectedShop.id === shop.id && !isMasterView
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50"
                )}
                onClick={() => handleSelectShop(shop)}
              >
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: shop.color }}
                >
                  {shop.icon}
                </div>
                <span className="text-sm text-sidebar-foreground flex-1">{shop.name}</span>
                <div className="w-2 h-2 rounded-full bg-success" title="Connected" />
              </div>
            ))}

            {connectedShops.length === 0 && (
              <div className="px-4 py-2 text-xs text-sidebar-muted">
                Henüz bağlı mağaza yok
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Inactive Shops */}
        <Collapsible open={inactiveShopsOpen} onOpenChange={setInactiveShopsOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-sidebar-accent/50 transition-colors">
            <span className="text-xs font-medium text-sidebar-muted uppercase tracking-wider">Inactive shops</span>
            <ChevronDown className={cn(
              "h-3 w-3 text-sidebar-muted transition-transform",
              inactiveShopsOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>

          <CollapsibleContent>
            {inactivePlatforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center gap-2 px-4 py-2 hover:bg-sidebar-accent/50 transition-colors group"
              >
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs opacity-50"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <span className="text-sm text-sidebar-muted flex-1">{platform.name}</span>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center bg-sidebar-accent hover:bg-primary/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectClick(platform.id);
                    }}
                    title="Connect"
                  >
                    <Plus className="h-3.5 w-3.5 text-sidebar-foreground" />
                  </button>
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center bg-success/20 hover:bg-success/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyClick(platform);
                    }}
                    title="Copy listings"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-success" />
                  </button>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Divider */}
        <div className="border-t border-sidebar-border my-2" />

        {/* Status Filters */}
        <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-sidebar-accent/50 transition-colors">
            <span className="text-xs font-medium text-sidebar-muted uppercase tracking-wider">Listing Status</span>
            <ChevronDown className={cn(
              "h-3 w-3 text-sidebar-muted transition-transform",
              statusOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>

          <CollapsibleContent>
            {statusItems.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                  currentStatus === item.key
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50"
                )}
                onClick={() => handleStatusChange(item.key)}
              >
                {item.color && (
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                )}
                <span className="text-sm text-sidebar-foreground flex-1">{item.label}</span>
                <span className="text-xs text-sidebar-muted">
                  {item.key === 'all' ? counts?.all || 0 :
                   item.key === 'active' ? counts?.active || 0 :
                   item.key === 'draft' ? counts?.draft || 0 :
                   item.key === 'inactive' ? counts?.inactive || 0 :
                   item.key === 'copy' ? counts?.copy || 0 :
                   item.key === 'imported' ? counts?.imported || 0 :
                   item.key === 'staging' ? counts?.staging || 0 : 0}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Waitlist section */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-muted">
            <span className="text-xs">⌛</span>
            <span className="text-xs">Waitlist</span>
          </div>
        </div>
      </div>

      {/* Connect Shop Dialog */}
      <ConnectShopDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        initialPlatform={connectPlatform}
      />

      {/* Copy to Shop Popup */}
      {copyPopupTarget && (
        <CopyToShopPopup
          targetPlatform={copyPopupTarget}
          sourceShops={connectedShops}
          onClose={() => setCopyPopupTarget(null)}
        />
      )}
    </>
  );
}
