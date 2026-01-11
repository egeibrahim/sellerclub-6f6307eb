import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type MarketplaceId = 
  | "trendyol" 
  | "hepsiburada" 
  | "ikas" 
  | "ciceksepeti" 
  | "ticimax" 
  | "amazon" 
  | "etsy" 
  | "n11";

export interface MarketplaceConnection {
  id: string;
  user_id: string;
  marketplace: MarketplaceId;
  store_name: string | null;
  credentials: Record<string, string>;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceConfig {
  id: MarketplaceId;
  name: string;
  logo: string;
  color: string;
  credentialFields: {
    key: string;
    label: string;
    type: "text" | "password";
    placeholder?: string;
  }[];
}

export const MARKETPLACE_CONFIGS: MarketplaceConfig[] = [
  {
    id: "trendyol",
    name: "Trendyol",
    logo: "T",
    color: "#FF6000",
    credentialFields: [
      { key: "api_key", label: "API Key", type: "text", placeholder: "Seller Center'dan alın" },
      { key: "api_secret", label: "API Secret", type: "password", placeholder: "Seller Center'dan alın" },
      { key: "seller_id", label: "Satıcı ID", type: "text", placeholder: "Mağaza ID'niz" },
    ],
  },
  {
    id: "hepsiburada",
    name: "Hepsiburada",
    logo: "H",
    color: "#FF6600",
    credentialFields: [
      { key: "merchant_id", label: "Merchant ID", type: "text" },
      { key: "username", label: "Kullanıcı Adı", type: "text" },
      { key: "password", label: "Şifre", type: "password" },
    ],
  },
  {
    id: "ikas",
    name: "ikas",
    logo: "i",
    color: "#6366F1",
    credentialFields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Uygulama Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Uygulama Client Secret" },
      { key: "store_name", label: "Mağaza Adı", type: "text", placeholder: "dev-listele veya dev-listele.myikas.com" },
    ],
  },
  {
    id: "ciceksepeti",
    name: "Çiçeksepeti",
    logo: "Ç",
    color: "#E91E63",
    credentialFields: [
      { key: "api_key", label: "API Key", type: "text" },
      { key: "api_secret", label: "API Secret", type: "password" },
    ],
  },
  {
    id: "amazon",
    name: "Amazon TR",
    logo: "A",
    color: "#FF9900",
    credentialFields: [
      { key: "sellerId", label: "Seller ID", type: "text", placeholder: "Seller Central'dan alın" },
      { key: "clientId", label: "LWA Client ID", type: "text", placeholder: "Developer Central'dan alın" },
      { key: "clientSecret", label: "LWA Client Secret", type: "password" },
      { key: "refreshToken", label: "Refresh Token", type: "password", placeholder: "SP-API Refresh Token" },
    ],
  },
  {
    id: "n11",
    name: "N11",
    logo: "N",
    color: "#7B2D8E",
    credentialFields: [
      { key: "api_key", label: "API Key", type: "text" },
      { key: "api_secret", label: "API Secret", type: "password" },
    ],
  },
  {
    id: "etsy",
    name: "Etsy",
    logo: "E",
    color: "#F56400",
    credentialFields: [
      { key: "api_key", label: "API Key (Keystring)", type: "text" },
      { key: "shared_secret", label: "Shared Secret", type: "password" },
    ],
  },
  {
    id: "ticimax",
    name: "Ticimax",
    logo: "Ti",
    color: "#00BCD4",
    credentialFields: [
      { key: "api_url", label: "API URL", type: "text" },
      { key: "api_key", label: "API Key", type: "text" },
    ],
  },
];

export function useMarketplaceConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ["marketplace-connections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("marketplace_connections")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Type assertion since DB returns generic types
      return data as unknown as MarketplaceConnection[];
    },
    enabled: !!user,
  });

  const saveConnection = useMutation({
    mutationFn: async ({
      marketplace,
      credentials,
      storeName,
    }: {
      marketplace: MarketplaceId;
      credentials: Record<string, string>;
      storeName?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if connection exists
      const existing = connections.find((c) => c.marketplace === marketplace);

      if (existing) {
        const { error } = await supabase
          .from("marketplace_connections")
          .update({
            credentials,
            store_name: storeName || null,
            is_active: true,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketplace_connections")
          .insert({
            user_id: user.id,
            marketplace,
            credentials,
            store_name: storeName || null,
            is_active: true,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-connections"] });
      toast({
        title: "Bağlantı kaydedildi",
        description: "Pazaryeri bilgileri başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnection = useMutation({
    mutationFn: async (marketplace: MarketplaceId) => {
      const connection = connections.find((c) => c.marketplace === marketplace);
      
      if (!connection) {
        throw new Error("Bu pazaryeri için henüz bağlantı bilgisi girilmedi");
      }

      // Call the appropriate sync function
      let functionName = "";
      switch (marketplace) {
        case "trendyol":
          functionName = "trendyol-sync";
          break;
        case "ikas":
          functionName = "ikas-sync";
          break;
        case "hepsiburada":
          functionName = "hepsiburada-sync";
          break;
        case "ciceksepeti":
          functionName = "ciceksepeti-sync";
          break;
        case "n11":
          functionName = "n11-sync";
          break;
        case "amazon":
          functionName = "amazon-sync";
          break;
        default:
          throw new Error(`${marketplace} entegrasyonu henüz hazır değil`);
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: "check_connection",
          credentials: connection.credentials,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        const statusCode = data?.statusCode ? ` (HTTP ${data.statusCode})` : "";
        const details = data?.details ? `\n${data.details}` : "";
        throw new Error(`${data?.message || data?.error || "Bağlantı başarısız"}${statusCode}${details}`);
      }

      // Update last_sync_at
      await supabase
        .from("marketplace_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);

      return data;
    },
    onSuccess: (_, marketplace) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-connections"] });
      toast({
        title: "Bağlantı başarılı",
        description: `${marketplace} API bağlantısı çalışıyor.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bağlantı hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (marketplace: MarketplaceId) => {
      const connection = connections.find((c) => c.marketplace === marketplace);
      if (!connection) return;

      const { error } = await supabase
        .from("marketplace_connections")
        .delete()
        .eq("id", connection.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-connections"] });
      toast({
        title: "Bağlantı silindi",
        description: "Pazaryeri bağlantısı kaldırıldı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to get connection status
  const getConnectionStatus = (marketplace: MarketplaceId) => {
    const connection = connections.find((c) => c.marketplace === marketplace);
    if (!connection) return "disconnected";
    if (!connection.is_active) return "inactive";
    return "connected";
  };

  const getConnection = (marketplace: MarketplaceId) => {
    return connections.find((c) => c.marketplace === marketplace);
  };

  return {
    connections,
    isLoading,
    error,
    saveConnection,
    testConnection,
    deleteConnection,
    getConnectionStatus,
    getConnection,
    MARKETPLACE_CONFIGS,
  };
}
