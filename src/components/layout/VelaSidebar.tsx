import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop, Shop } from "@/contexts/ShopContext";
import { useListingCounts, useMasterListingCounts } from "@/hooks/useListingCounts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CopyToShopPopup } from "@/components/inventory/CopyToShopPopup";
import { ConnectShopDialog } from "@/components/connections/ConnectShopDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
  { key: "active", label: "Active", color: "bg-green-500" },
  { key: "draft", label: "Draft", color: "bg-amber-500" },
  { key: "inactive", label: "Inactive", color: "bg-gray-400" },
  { key: "copy", label: "Copy", color: "bg-green-500" },
  { key: "imported", label: "Imported", color: "bg-purple-500" },
  { key: "staging", label: "Staging", color: "bg-blue-500" },
];

export function VelaSidebar({ className }: VelaSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { shops, selectedShop, setSelectedShop, isMasterView } = useShop();
  
  const [statusOpen, setStatusOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [copyPopupTarget, setCopyPopupTarget] = useState<typeof allPlatforms[0] | null>(null);

  // Get listing counts for selected shop
  const selectedShopId = isMasterView ? null : (selectedShop.id !== 'master' ? selectedShop.id : null);
  const { counts, categoryCounts } = useListingCounts(selectedShopId);
  const { counts: masterCounts } = useMasterListingCounts();

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

  const handleSelectInactiveShop = (platform: typeof allPlatforms[0]) => {
    // Create a temporary shop object for the inactive platform
    const inactiveShop: Shop = {
      id: `inactive-${platform.id}`,
      name: platform.name,
      platform: platform.name,
      icon: platform.icon,
      color: platform.color,
      listingRoute: `/inventory/new/${platform.id}`,
      isConnected: false,
      lastSyncAt: null,
    };
    setSelectedShop(inactiveShop);
    navigate('/inventory');
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

  const currentCounts = isMasterView ? masterCounts : counts;

  return (
    <>
      <div className={cn(
        "w-56 bg-white border-r border-gray-200 flex flex-col h-full",
        className
      )}>
        {/* Shop Dropdown Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-200">
              {!isMasterView && selectedShop.id !== 'master' ? (
                <>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: selectedShop.color }}
                  >
                    {selectedShop.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">{selectedShop.platform}</span>
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedShop.name}</p>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: '#8B5CF6' }}
                  >
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">Hub</span>
                    <p className="text-sm font-medium text-gray-900">Master Listings</p>
                  </div>
                </>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            align="start" 
            className="w-56 bg-white border border-gray-200 shadow-lg z-50 max-h-[70vh] overflow-y-auto"
            sideOffset={4}
          >
            {/* Master Listings */}
            <DropdownMenuItem 
              onClick={handleSelectMaster}
              className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                M
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Master Listings</p>
              </div>
              <span className="text-xs text-gray-500">{masterCounts.all}</span>
            </DropdownMenuItem>

            {/* Connected Shops */}
            {connectedShops.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1.5">
                  Connected shops
                </DropdownMenuLabel>
                {connectedShops.map((shop) => (
                  <DropdownMenuItem
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: shop.color }}
                    >
                      {shop.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">{shop.platform}</span>
                      <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Inactive Shops */}
            {inactivePlatforms.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuLabel className="text-xs font-normal text-gray-500 px-2 py-1.5">
                  Inactive shops
                </DropdownMenuLabel>
                {inactivePlatforms.map((platform) => (
                  <DropdownMenuItem
                    key={platform.id}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50"
                    onSelect={() => handleSelectInactiveShop(platform)}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs opacity-60"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.icon}
                    </div>
                    <span 
                      className="text-sm text-gray-500 flex-1"
                      onClick={() => handleSelectInactiveShop(platform)}
                    >
                      {platform.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleConnectClick(platform.id);
                        }}
                        title="Connect"
                      >
                        <Plus className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        className="w-6 h-6 rounded flex items-center justify-center bg-green-100 hover:bg-green-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleCopyClick(platform);
                        }}
                        title="Copy listings"
                      >
                        <ChevronRight className="h-3 w-3 text-green-600" />
                      </button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Waitlist */}
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="flex items-center justify-center gap-2 p-2 cursor-pointer hover:bg-gray-50">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Waitlist</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Status Filters */}
          <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Listing Status</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform",
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
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handleStatusChange(item.key)}
                >
                  {item.color && (
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  )}
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <span className="text-xs text-gray-500">
                    {item.key === 'all' ? currentCounts?.all || 0 :
                     item.key === 'active' ? currentCounts?.active || 0 :
                     item.key === 'draft' ? currentCounts?.draft || 0 :
                     item.key === 'inactive' ? currentCounts?.inactive || 0 :
                     item.key === 'copy' ? currentCounts?.copy || 0 :
                     item.key === 'imported' ? currentCounts?.imported || 0 :
                     item.key === 'staging' ? currentCounts?.staging || 0 : 0}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Category Filters */}
          <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform",
                categoryOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>

            <CollapsibleContent>
              {categoryCounts.length > 0 ? (
                categoryCounts.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-4 h-4 rounded border border-gray-300" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{cat.category}</span>
                    <span className="text-xs text-gray-500">{cat.count}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-gray-500">
                  Henüz kategori yok
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
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
