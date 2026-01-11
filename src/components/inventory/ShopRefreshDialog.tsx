import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";

interface ShopRefreshDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: {
    status: "idle" | "fetching" | "syncing" | "success" | "error";
    message: string;
    current: number;
    total: number;
  };
  onRetry?: () => void;
}

export function ShopRefreshDialog({
  open,
  onOpenChange,
  progress,
  onRetry,
}: ShopRefreshDialogProps) {
  const { selectedShop } = useShop();

  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: selectedShop.color }}
            >
              {selectedShop.icon}
            </div>
            <div>
              <div className="text-lg font-semibold">{selectedShop.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {selectedShop.platform}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {progress.status === "fetching" || progress.status === "syncing" ? (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : progress.status === "success" ? (
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            ) : progress.status === "error" ? (
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center mb-4">
            <h3 className="font-medium text-lg mb-1">
              {progress.status === "fetching" && "Mağaza yenileniyor..."}
              {progress.status === "syncing" && "Ürünler senkronize ediliyor..."}
              {progress.status === "success" && "Mağaza yenilendi!"}
              {progress.status === "error" && "Senkronizasyon hatası"}
              {progress.status === "idle" && "Hazır"}
            </h3>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>

          {/* Progress Bar */}
          {(progress.status === "syncing" || progress.status === "success") &&
            progress.total > 0 && (
              <div className="space-y-2">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress.current} / {progress.total} ürün
                </p>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {progress.status === "error" && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          )}
          {(progress.status === "success" || progress.status === "error") && (
            <Button onClick={() => onOpenChange(false)}>Kapat</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
