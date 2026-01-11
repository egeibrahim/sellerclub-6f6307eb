import { Bell, Package, AlertTriangle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLowStockAlerts } from "@/hooks/useLowStockAlerts";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function NotificationDropdown() {
  const { alerts, unreadCount, markAsRead, markAllAsRead, deleteAlert } = useLowStockAlerts();
  const navigate = useNavigate();

  const handleAlertClick = (alert: typeof alerts[0]) => {
    markAsRead.mutate(alert.id);
    navigate(`/master-listings`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <Check className="h-3 w-3 mr-1" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Bildirim yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {alerts.slice(0, 20).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !alert.is_read ? 'bg-muted/50' : ''
                }`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className={`p-2 rounded-full ${
                  alert.current_stock === 0 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {alert.current_stock === 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {alert.product_title}
                  </p>
                  {alert.variant_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.variant_name}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${
                    alert.current_stock === 0 ? 'text-destructive' : 'text-warning'
                  }`}>
                    {alert.current_stock === 0 
                      ? 'Stok tükendi!' 
                      : `Düşük stok: ${alert.current_stock} adet kaldı`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: tr })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAlert.mutate(alert.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
