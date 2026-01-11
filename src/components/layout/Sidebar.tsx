import { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronUp,
  Plus,
  Clock,
  Image,
  List,
  Layers,
  HelpCircle,
  MessageSquare,
  Package,
  ShoppingCart,
  BarChart3,
  DollarSign,
  Link2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShop, Shop } from "@/contexts/ShopContext";
import { useProducts } from "@/hooks/useProducts";
import { useShopSync } from "@/hooks/useShopSync";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShopRefreshDialog } from "@/components/inventory/ShopRefreshDialog";

// Map platform name to source filter
function getPlatformSource(platform: string): string {
  const map: Record<string, string> = {
    "Etsy": "etsy",
    "Trendyol": "trendyol",
    "Hepsiburada": "hepsiburada",
    "ikas": "ikas",
  };
  return map[platform] || platform.toLowerCase();
}

const categories = [
  { label: "Clothing", count: 141 },
  { label: "Art & Collectibles", count: 129 },
];

const sections = [
  { label: "Digital", count: 129 },
  { label: "Formula 1", count: 37 },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut } = useAuth();
  const { shops, selectedShop, setSelectedShop, setPendingShop, setShowShopChangeDialog } = useShop();
  const { syncTrendyol, syncIkas, progress, resetProgress, isLoading: isSyncing } = useShopSync();
  
  // Get products for current shop to calculate counts
  const sourceFilter = getPlatformSource(selectedShop.platform);
  const { products } = useProducts(sourceFilter);
  
  // Shop refresh dialog state
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  
  // Calculate status counts
  const statusCounts = useMemo(() => {
    return {
      active: products.filter(p => p.status === "active").length,
      draft: products.filter(p => p.status === "draft").length,
      staging: products.filter(p => p.status === "staging").length,
      copy: products.filter(p => p.status === "copy").length,
      imported: products.filter(p => p.source !== "manual").length,
    };
  }, [products]);

  const currentStatus = searchParams.get("status") || "active";
  
  const [platformOpen, setPlatformOpen] = useState(true);
  const [velaOpen, setVelaOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [listingScore, setListingScore] = useState([20, 80]);

  const isInventoryPage = location.pathname === "/inventory" || location.pathname.startsWith("/inventory/");
  
  const handleShopRefresh = () => {
    if (selectedShop.platform === "Trendyol") {
      setShowRefreshDialog(true);
      syncTrendyol.mutate();
    } else if (selectedShop.platform === "ikas") {
      setShowRefreshDialog(true);
      syncIkas.mutate();
    }
  };
  
  const handleRetrySync = () => {
    resetProgress();
    if (selectedShop.platform === "Trendyol") {
      syncTrendyol.mutate();
    } else if (selectedShop.platform === "ikas") {
      syncIkas.mutate();
    }
  };
  
  // Check if currently on a listing creation page
  const isListingPage = location.pathname.includes("/inventory/new");

  const handleShopSelect = (shop: Shop) => {
    if (shop.id === selectedShop.id) return;
    
    if (isListingPage) {
      // If on listing page, show confirmation dialog
      setPendingShop(shop);
      setShowShopChangeDialog(true);
    } else {
      // Not on listing page, switch shop and navigate to inventory
      setSelectedShop(shop);
      navigate("/inventory");
    }
  };

  const handleStatusFilter = (status: string) => {
    navigate(`/inventory?status=${status}`);
  };

  const statusFilters = [
    { label: "Active", value: "active", count: statusCounts.active },
    { label: "Draft", value: "draft", count: statusCounts.draft },
  ];

  const velaFilters = [
    { label: "Copy", value: "copy", count: statusCounts.copy },
    { label: "Imported", value: "imported", count: statusCounts.imported },
    { label: "Staging", value: "staging", count: statusCounts.staging },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-background flex flex-col border-r border-border z-50">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-sm">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
        </div>
      </div>

      {/* Shop Selector */}
      <div className="p-3 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-auto py-2 px-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: selectedShop.color }}
                >
                  {selectedShop.icon}
                </div>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">{selectedShop.platform}</div>
                  <div className="text-sm font-medium truncate max-w-[120px]">{selectedShop.name}</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover" align="start">
            {shops.map((shop) => (
              <DropdownMenuItem 
                key={shop.id}
                onClick={() => handleShopSelect(shop)}
                className="flex items-center gap-2 py-2"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: shop.color }}
                >
                  {shop.icon}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{shop.platform}</div>
                  <div className="text-sm font-medium">{shop.name}</div>
                </div>
                {selectedShop.id === shop.id && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              Inactive shops
              <ChevronDown className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Plus className="h-4 w-4" />
              Add shop
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation + (optional) inventory filters */}
      <div className="flex-1 overflow-y-auto">
        {/* Default Navigation (always visible) */}
        <nav className="py-2">
          <ul className="space-y-0.5 px-2">
            <li>
              <NavLink
                to="/master-listings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Package className="h-4 w-4" />
                Master Ürünler
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/inventory"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <List className="h-4 w-4" />
                Listings
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <ShoppingCart className="h-4 w-4" />
                Siparişler
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <BarChart3 className="h-4 w-4" />
                Raporlar
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <DollarSign className="h-4 w-4" />
                Fiyatlandırma
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/connections"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Link2 className="h-4 w-4" />
                Bağlantılar
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Layers className="h-4 w-4" />
                Kategoriler
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Inventory Filters (only on inventory routes) */}
        {isInventoryPage && (
          <div className="py-2 border-t border-border">
            {/* Platform Status Filters */}
            <Collapsible open={platformOpen} onOpenChange={setPlatformOpen}>
              <div className="flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 group">
                <CollapsibleTrigger className="flex-1 flex items-center justify-between">
                  <span>{selectedShop.platform}</span>
                  {platformOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <button
                  onClick={handleShopRefresh}
                  disabled={isSyncing}
                  className="ml-2 p-1 rounded hover:bg-muted transition-opacity disabled:opacity-50"
                  title="Mağazayı yenile"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                </button>
              </div>
              <CollapsibleContent>
                <div className="space-y-0.5 px-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleStatusFilter(filter.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm transition-colors",
                        currentStatus === filter.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{filter.label}</span>
                      <span className="text-muted-foreground">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Vela Filters */}
            <Collapsible open={velaOpen} onOpenChange={setVelaOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
                <span>Vela</span>
                {velaOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-0.5 px-2">
                  {velaFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleStatusFilter(filter.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm transition-colors",
                        currentStatus === filter.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{filter.label}</span>
                      <span className="text-muted-foreground">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Listing Score */}
            <div className="px-4 py-3 border-t border-border mt-2">
              <div className="text-sm font-medium text-foreground mb-3">
                Listing score
              </div>
              <div className="px-1">
                <Slider
                  value={listingScore}
                  onValueChange={setListingScore}
                  max={100}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>F</span>
                  <span>D</span>
                  <span>C</span>
                  <span>B</span>
                  <span>A</span>
                </div>
              </div>
            </div>

            {/* Profile / Variations Tabs */}
            <div className="px-4 py-2 border-t border-border">
              <div className="flex gap-4 text-sm">
                <button className="text-muted-foreground hover:text-foreground">
                  Profile
                </button>
                <button className="text-primary font-medium">Variations</button>
              </div>
            </div>

            {/* Variation Checkboxes */}
            <div className="px-4 py-2 space-y-2">
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <Checkbox />
                  <span>front view prices</span>
                </div>
                <span className="text-muted-foreground">77</span>
              </label>
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <Checkbox />
                  <span>Front-Back View Prices</span>
                </div>
                <span className="text-muted-foreground">61</span>
              </label>
              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <Checkbox />
                  <span>No Profile</span>
                </div>
                <span className="text-muted-foreground">132</span>
              </label>
            </div>

            {/* Category */}
            <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-t border-border">
                <span>Category</span>
                {categoryOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-2 space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.label}
                      className="flex items-center justify-between text-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section */}
            <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-t border-border">
                <span>Section</span>
                {sectionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-2 space-y-2">
                  {sections.map((sec) => (
                    <label
                      key={sec.label}
                      className="flex items-center justify-between text-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox />
                        <span>{sec.label}</span>
                      </div>
                      <span className="text-muted-foreground">{sec.count}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>


      {/* Footer */}
      <div className="border-t border-border p-2 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )
          }
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </NavLink>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-sm transition-colors">
          <MessageSquare className="h-4 w-4" />
          Feedback
        </button>
      </div>

      {/* Add Shop Button */}
      <div className="p-3 border-t border-border">
        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add shop
        </Button>
      </div>
      
      {/* Shop Refresh Dialog */}
      <ShopRefreshDialog
        open={showRefreshDialog}
        onOpenChange={(open) => {
          setShowRefreshDialog(open);
          if (!open) resetProgress();
        }}
        progress={progress}
        onRetry={handleRetrySync}
      />
    </aside>
  );
}
