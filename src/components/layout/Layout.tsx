import { useState } from "react";
import { IconSidebar } from "./IconSidebar";
import { VelaSidebar } from "./VelaSidebar";
import { ShopHeader } from "./ShopHeader";
import { ConnectBanner } from "./ConnectBanner";
import { ConnectShopDialog } from "@/components/connections/ConnectShopDialog";
import { useShop } from "@/contexts/ShopContext";
import { useMarketplaceSync } from "@/hooks/useMarketplaceSync";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  const location = useLocation();
  const { shops, selectedShop, setSelectedShop, isMasterView } = useShop();
  const { syncBidirectional, isLoading: isSyncing } = useMarketplaceSync();
  
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  // Convert Shop to ShopConnection format for components
  const selectedShopConnection = selectedShop.id !== 'master' ? {
    id: selectedShop.id,
    shop_name: selectedShop.name,
    platform: selectedShop.platform,
    shop_icon: selectedShop.icon,
    shop_color: selectedShop.color,
    is_connected: selectedShop.isConnected,
    last_sync_at: selectedShop.lastSyncAt,
    api_credentials: {},
  } : null;

  const handleSync = async () => {
    if (selectedShopConnection) {
      await syncBidirectional(selectedShopConnection);
    }
  };

  // Determine which pages show the VelaSidebar
  const showVelaSidebar = 
    location.pathname === "/inventory" || 
    location.pathname.startsWith("/inventory/") ||
    location.pathname === "/master-listings" ||
    location.pathname.startsWith("/master-listings/");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Icon Sidebar - Always visible */}
      <IconSidebar className="fixed left-0 top-0 h-screen z-50" />

      {/* Vela-style Sidebar - Only on inventory/master-listings pages */}
      {showVelaSidebar && (
        <VelaSidebar className="fixed left-14 top-0 h-screen z-40" />
      )}

      {/* Main Content */}
      <main 
        className="flex-1" 
        style={{ marginLeft: showVelaSidebar ? '17.5rem' : '3.5rem' }}
      >
        {/* Shop Header - Only for connected shops */}
        {showHeader && !isMasterView && selectedShopConnection && showVelaSidebar && (
          <>
            <ShopHeader
              shop={selectedShopConnection}
              onSync={handleSync}
              onManageConnection={() => setShowConnectDialog(true)}
              isSyncing={isSyncing}
              listingRoute={selectedShop.listingRoute}
            />
            {!selectedShopConnection.is_connected && (
              <ConnectBanner
                platform={selectedShop.platform}
                platformColor={selectedShop.color}
                onConnect={() => setShowConnectDialog(true)}
              />
            )}
          </>
        )}

        {/* Master View Header */}
        {showHeader && isMasterView && showVelaSidebar && (
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                M
              </div>
              <div>
                <h1 className="text-lg font-semibold">Master Ürünler</h1>
                <p className="text-xs text-muted-foreground">Merkezi ürün yönetimi</p>
              </div>
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Connect Shop Dialog */}
      <ConnectShopDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </div>
  );
}
