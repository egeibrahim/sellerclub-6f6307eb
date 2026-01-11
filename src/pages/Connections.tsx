import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings2, 
  Loader2,
  AlertCircle 
} from "lucide-react";
import { ConnectionConfigDialog } from "@/components/connections/ConnectionConfigDialog";
import { ConnectionStatusBar } from "@/components/connections/ConnectionStatusBar";
import {
  useMarketplaceConnections,
  MarketplaceConfig,
  MarketplaceId,
} from "@/hooks/useMarketplaceConnections";

export default function Connections() {
  const {
    connections,
    isLoading,
    saveConnection,
    testConnection,
    deleteConnection,
    getConnectionStatus,
    getConnection,
    MARKETPLACE_CONFIGS,
  } = useMarketplaceConnections();

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceConfig | null>(null);
  const [testingId, setTestingId] = useState<MarketplaceId | null>(null);

  const handleConfigure = (marketplace: MarketplaceConfig) => {
    setSelectedMarketplace(marketplace);
    setConfigDialogOpen(true);
  };

  const handleSave = (credentials: Record<string, string>, storeName?: string) => {
    if (!selectedMarketplace) return;
    
    saveConnection.mutate(
      {
        marketplace: selectedMarketplace.id,
        credentials,
        storeName,
      },
      {
        onSuccess: () => {
          setConfigDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedMarketplace) return;
    
    deleteConnection.mutate(selectedMarketplace.id, {
      onSuccess: () => {
        setConfigDialogOpen(false);
      },
    });
  };

  const handleTest = async (marketplace: MarketplaceId) => {
    setTestingId(marketplace);
    try {
      await testConnection.mutateAsync(marketplace);
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (marketplace: MarketplaceId) => {
    const status = getConnectionStatus(marketplace);
    const connection = getConnection(marketplace);

    switch (status) {
      case "connected":
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="outline" className="text-success border-success gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Bağlı
            </Badge>
            {connection?.last_sync_at && (
              <span className="text-xs text-muted-foreground">
                Son sync: {new Date(connection.last_sync_at).toLocaleString("tr-TR")}
              </span>
            )}
          </div>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="text-warning border-warning gap-1">
            <AlertCircle className="h-3 w-3" />
            Pasif
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" />
            Bağlı Değil
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Layout showHeader={false}>
        <Header title="Pazaryeri Bağlantıları" />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <Header title="Pazaryeri Bağlantıları" />

      <div className="p-6">
        <div className="max-w-3xl space-y-4">
          {/* Connection Status Bar for Trendyol and ikas */}
          <ConnectionStatusBar
            connections={[
              {
                name: "Trendyol",
                status: getConnectionStatus("trendyol"),
                lastSync: getConnection("trendyol")?.last_sync_at,
                color: "#FF6000",
              },
              {
                name: "ikas",
                status: getConnectionStatus("ikas"),
                lastSync: getConnection("ikas")?.last_sync_at,
                color: "#6366F1",
              },
            ]}
            isLoading={isLoading}
          />

          <p className="text-muted-foreground mb-6">
            Ürünlerinizi senkronize etmek için pazaryeri API bilgilerinizi girin.
          </p>

          {MARKETPLACE_CONFIGS.map((marketplace) => {
            const status = getConnectionStatus(marketplace.id);
            const isConnected = status === "connected";
            const isTesting = testingId === marketplace.id;

            return (
              <div
                key={marketplace.id}
                className="border border-border bg-card p-4 rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 flex items-center justify-center font-bold text-white rounded-lg text-lg"
                    style={{ backgroundColor: marketplace.color }}
                  >
                    {marketplace.logo}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {marketplace.name}
                    </h3>
                    <div className="mt-1">
                      {getStatusBadge(marketplace.id)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(marketplace.id)}
                      disabled={isTesting}
                      className="gap-2"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isTesting ? "animate-spin" : ""}`}
                      />
                      Test
                    </Button>
                  )}
                  <Button
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleConfigure(marketplace)}
                    className="gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    {isConnected ? "Düzenle" : "Bağlan"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConnectionConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        marketplace={selectedMarketplace}
        existingConnection={
          selectedMarketplace
            ? getConnection(selectedMarketplace.id) || null
            : null
        }
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={saveConnection.isPending}
      />
    </Layout>
  );
}
