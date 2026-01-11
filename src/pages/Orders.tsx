import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, Download } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useMarketplaceConnections } from "@/hooks/useMarketplaceConnections";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";

export default function Orders() {
  const { orders, isLoading, syncOrders, updateOrderStatus } = useOrders();
  const { connections } = useMarketplaceConnections();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.remote_order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesMarketplace = marketplaceFilter === "all" || order.marketplace === marketplaceFilter;

      return matchesSearch && matchesStatus && matchesMarketplace;
    });
  }, [orders, searchQuery, statusFilter, marketplaceFilter]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const activeConnections = connections.filter((c) => c.is_active);
      for (const connection of activeConnections) {
        await syncOrders.mutateAsync({
          marketplace: connection.marketplace,
          connectionId: connection.id,
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMarketplaceFilter("all");
  };

  return (
    <Layout>
      <Header title="Siparişler" />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Tüm Siparişler</h2>
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} sipariş bulundu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncing || connections.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Tümünü Senkronize Et
            </Button>
          </div>
        </div>

        {/* Filters */}
        <OrderFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          marketplaceFilter={marketplaceFilter}
          onMarketplaceChange={setMarketplaceFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Orders Table or Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {orders.length === 0 ? "Henüz sipariş yok" : "Sonuç bulunamadı"}
            </h2>
            <p className="text-muted-foreground max-w-sm mb-4">
              {orders.length === 0
                ? "Bağlı pazaryerlerinden siparişleri senkronize edin."
                : "Farklı filtreler deneyin."}
            </p>
            {orders.length === 0 && connections.length > 0 && (
              <Button onClick={handleSyncAll} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                Siparişleri Çek
              </Button>
            )}
          </div>
        ) : (
          <OrdersTable orders={filteredOrders} onStatusChange={handleStatusChange} />
        )}
      </div>
    </Layout>
  );
}
