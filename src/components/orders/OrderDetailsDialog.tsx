import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/hooks/useOrders";
import { Package, User, MapPin, CreditCard } from "lucide-react";

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null;

  const shippingAddress = order.shipping_address as Record<string, any>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sipariş #{order.order_number || order.remote_order_id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{order.marketplace}</Badge>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(order.order_date), 'dd MMMM yyyy HH:mm', { locale: tr })}
            </span>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" /> Müşteri Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">İsim:</span>
                <p className="font-medium">{order.customer_name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">E-posta:</span>
                <p className="font-medium">{order.customer_email || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefon:</span>
                <p className="font-medium">{order.customer_phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && Object.keys(shippingAddress).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Teslimat Adresi
                </h3>
                <p className="text-sm">
                  {shippingAddress.address || shippingAddress.street}
                  {shippingAddress.city && `, ${shippingAddress.city}`}
                  {shippingAddress.district && ` / ${shippingAddress.district}`}
                  {shippingAddress.postalCode && ` ${shippingAddress.postalCode}`}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-medium">Ürünler</h3>
            <div className="space-y-2">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.title || item.name || `Ürün ${index + 1}`}</p>
                    {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                    {item.variant && <p className="text-xs text-muted-foreground">Varyant: {item.variant}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₺{Number(item.unit_price || item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">x{item.quantity || 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Ödeme Özeti
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span>₺{Number(order.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargo:</span>
                <span>₺{Number(order.shipping_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(order.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vergi:</span>
                  <span>₺{Number(order.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Toplam:</span>
                <span>₺{Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {order.payment_method && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ödeme Yöntemi:</span>
              <Badge variant="outline">{order.payment_method}</Badge>
              {order.payment_status && (
                <Badge variant="outline">{order.payment_status}</Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
