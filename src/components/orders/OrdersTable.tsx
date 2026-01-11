import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, Eye, Package, Truck, CheckCircle, XCircle, Send, Cloud } from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { TrackingNumberDialog } from "./TrackingNumberDialog";
import { useOrderStatusSync } from "@/hooks/useOrderStatusSync";

interface OrdersTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  processing: "İşleniyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const marketplaceColors: Record<string, string> = {
  trendyol: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  hepsiburada: "bg-red-500/10 text-red-600 border-red-500/20",
  n11: "bg-green-500/10 text-green-600 border-green-500/20",
  ciceksepeti: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  amazon: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ikas: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

export function OrdersTable({ orders, onStatusChange }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingDialogOrder, setTrackingDialogOrder] = useState<Order | null>(null);
  const { updateWithTracking, syncStatus, isSyncing } = useOrderStatusSync();

  const handleTrackingSubmit = (trackingNumber: string, trackingCompany: string) => {
    if (!trackingDialogOrder) return;
    updateWithTracking.mutate(
      { orderId: trackingDialogOrder.id, trackingNumber, trackingCompany },
      { onSuccess: () => setTrackingDialogOrder(null) }
    );
  };

  const handleSyncToMarketplace = (order: Order) => {
    syncStatus.mutate({
      orderId: order.id,
      status: order.status,
      trackingNumber: (order as Order & { tracking_number?: string }).tracking_number,
      trackingCompany: (order as Order & { tracking_company?: string }).tracking_company,
    });
  };

  return (
    <TooltipProvider>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Sipariş No</TableHead>
              <TableHead>Pazaryeri</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Ürünler</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const orderWithTracking = order as Order & { 
                tracking_number?: string; 
                tracking_company?: string;
                status_synced_at?: string;
              };
              
              return (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{order.order_number || order.remote_order_id.slice(0, 8)}</span>
                      {orderWithTracking.tracking_number && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {orderWithTracking.tracking_number}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={marketplaceColors[order.marketplace] || ""}>
                      {order.marketplace}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer_name || "—"}</span>
                      {order.customer_email && (
                        <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {order.items.length} ürün
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₺{Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.order_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={statusColors[order.status] || ""}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      {orderWithTracking.status_synced_at && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Cloud className="h-3 w-3 text-success" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Pazaryerine senkronize edildi
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Detaylar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTrackingDialogOrder(order)}
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Kargo Bilgisi Gir</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSyncToMarketplace(order)}
                            disabled={isSyncing}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pazaryerine Gönder</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Durum <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'processing')}>
                            <Package className="mr-2 h-4 w-4" /> İşleniyor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTrackingDialogOrder(order)}>
                            <Truck className="mr-2 h-4 w-4" /> Kargoya Ver (Takip No ile)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'delivered')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Teslim Edildi
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'cancelled')}>
                            <XCircle className="mr-2 h-4 w-4" /> İptal Et
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />

      <TrackingNumberDialog
        open={!!trackingDialogOrder}
        onOpenChange={(open) => !open && setTrackingDialogOrder(null)}
        orderNumber={trackingDialogOrder?.order_number || trackingDialogOrder?.remote_order_id || ''}
        onSubmit={handleTrackingSubmit}
        isLoading={updateWithTracking.isPending}
      />
    </TooltipProvider>
  );
}
