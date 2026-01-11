import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShop } from "@/contexts/ShopContext";

type PublishStatus = "staging" | "draft" | "active";

interface ShopConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const shopConfigs: Record<string, ShopConfig> = {
  trendyol: {
    id: "trendyol",
    name: "Trendyol",
    icon: "T",
    color: "#FF6000",
  },
  ikas: {
    id: "ikas",
    name: "ikas",
    icon: "i",
    color: "#6366F1",
  },
  hepsiburada: {
    id: "hepsiburada",
    name: "Hepsiburada",
    icon: "H",
    color: "#FF6600",
  },
  etsy: {
    id: "etsy",
    name: "Etsy",
    icon: "E",
    color: "#F56400",
  },
};

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: PublishStatus) => void;
  onSchedule?: () => void;
  isLoading?: boolean;
  shopName?: string;
}

export function PublishDialog({
  open,
  onOpenChange,
  onConfirm,
  onSchedule,
  isLoading,
  shopName,
}: PublishDialogProps) {
  const { selectedShop } = useShop();
  const [selectedStatus, setSelectedStatus] = useState<PublishStatus>("active");

  const shopKey = shopName || selectedShop?.platform?.toLowerCase() || "etsy";
  const currentShop = shopConfigs[shopKey] || {
    id: selectedShop?.id || "shop",
    name: selectedShop?.name || "Shop",
    icon: selectedShop?.icon || "S",
    color: selectedShop?.color || "#10B981",
  };

  const handleConfirm = () => {
    onConfirm(selectedStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Yayınla</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {/* Shop info with status selection */}
          <div className="flex items-center justify-between mb-8">
            {/* Shop Info */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentShop.color }}
              >
                <span className="text-white font-bold text-sm">
                  {currentShop.icon}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{currentShop.name}</p>
                <p className="font-semibold text-foreground">Mağazam</p>
              </div>
            </div>

            {/* Status Selection - Getvela style */}
            <div className="flex items-center gap-6">
              {[
                { value: "staging", label: "Staging" },
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value as PublishStatus)}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {status.label}
                  </span>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedStatus === status.value
                        ? "border-[#10B981] bg-[#10B981]"
                        : "border-border"
                    )}
                  >
                    {selectedStatus === status.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={onSchedule}
              disabled={isLoading || !onSchedule}
            >
              Schedule
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-[#10B981] hover:bg-[#10B981]/90 text-white"
            >
              {isLoading ? "Kaydediliyor..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
