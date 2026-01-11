import { createContext, useContext, useState, ReactNode } from "react";

export interface Shop {
  id: string;
  name: string;
  platform: string;
  icon: string;
  color: string;
  listingRoute: string;
}

const shops: Shop[] = [
  { id: "1", name: "BoxBoxGarage", platform: "Etsy", icon: "E", color: "#F56400", listingRoute: "/inventory/new" },
  { id: "2", name: "TrendyolStore", platform: "Trendyol", icon: "T", color: "#FF6000", listingRoute: "/inventory/new/trendyol" },
  { id: "3", name: "HepsiburadaStore", platform: "Hepsiburada", icon: "H", color: "#FF6600", listingRoute: "/inventory/new/hepsiburada" },
  { id: "4", name: "ikasStore", platform: "ikas", icon: "i", color: "#6366F1", listingRoute: "/inventory/new/ikas" },
];

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
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [selectedShop, setSelectedShop] = useState<Shop>(shops[0]);
  const [pendingShop, setPendingShop] = useState<Shop | null>(null);
  const [showShopChangeDialog, setShowShopChangeDialog] = useState(false);

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
      cancelShopChange
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
