import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getPlatformConfig } from "@/config/platformConfigs";

export interface Shop {
  id: string;
  name: string;
  platform: string;
  icon: string;
  color: string;
  listingRoute: string;
  isConnected: boolean;
  lastSyncAt: string | null;
}

// Master Listings için özel shop
const masterShop: Shop = {
  id: "master",
  name: "Master Ürünler",
  platform: "master",
  icon: "M",
  color: "#8B5CF6",
  listingRoute: "/master-listings/new",
  isConnected: true,
  lastSyncAt: null,
};

interface ShopContextType {
  shops: Shop[];
  selectedShop: Shop;
  setSelectedShop: (shop: Shop) => void;
  pendingShop: Shop | null;
  setPendingShop: (shop: Shop | null) => void;
  showShopChangeDialog: boolean;
  setShowShopChangeDialog: (show: boolean) => void;
  confirmShopChange: () => void;
  cancelShopChange: () => void;
  isLoading: boolean;
  refetch: () => void;
  isMasterView: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedShop, setSelectedShop] = useState<Shop>(masterShop);
  const [pendingShop, setPendingShop] = useState<Shop | null>(null);
  const [showShopChangeDialog, setShowShopChangeDialog] = useState(false);

  // Fetch shop connections from database
  const { data: dbShops, isLoading, refetch } = useQuery({
    queryKey: ['shop-connections', user?.id],
    queryFn: async (): Promise<Shop[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('shop_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching shop connections:', error);
        return [];
      }

      return data.map((conn) => {
        const config = getPlatformConfig(conn.platform);
        return {
          id: conn.id,
          name: conn.shop_name,
          platform: conn.platform,
          icon: conn.shop_icon || config.icon,
          color: conn.shop_color || config.color,
          listingRoute: `/inventory/new/${conn.platform.toLowerCase()}`,
          isConnected: conn.is_connected,
          lastSyncAt: conn.last_sync_at,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Combine master shop with database shops
  const shops: Shop[] = [masterShop, ...(dbShops || [])];

  // Check if current selection is master view
  const isMasterView = selectedShop.id === 'master';

  const confirmShopChange = () => {
    if (pendingShop) {
      setSelectedShop(pendingShop);
      setPendingShop(null);
    }
    setShowShopChangeDialog(false);
  };

  const cancelShopChange = () => {
    setPendingShop(null);
    setShowShopChangeDialog(false);
  };

  return (
    <ShopContext.Provider value={{ 
      shops, 
      selectedShop, 
      setSelectedShop,
      pendingShop,
      setPendingShop,
      showShopChangeDialog,
      setShowShopChangeDialog,
      confirmShopChange,
      cancelShopChange,
      isLoading,
      refetch,
      isMasterView,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
