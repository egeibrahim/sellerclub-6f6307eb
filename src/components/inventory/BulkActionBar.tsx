import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { X, DollarSign, Package, Trash2, Send, ImagePlus, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, selectedIds, onClear }: BulkActionBarProps) {
  const navigate = useNavigate();
  const { bulkDelete, bulkUpdatePrice, bulkUpdateStock, bulkAddImages } = useProducts();
  const { user } = useAuth();
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [isPercentage, setIsPercentage] = useState(true);
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkEdit = () => {
    navigate(`/inventory/bulk-edit?ids=${selectedIds.join(",")}`);
  };

  const handlePriceUpdate = () => {
    const adjustment = Number(priceAdjustment);
    if (isNaN(adjustment)) return;
    
    bulkUpdatePrice.mutate({
      ids: selectedIds,
      adjustment,
      isPercentage,
    });
    setPriceAdjustment("");
  };

  const handleStockUpdate = () => {
    const adjustment = Number(stockAdjustment);
    if (isNaN(adjustment)) return;
    
    bulkUpdateStock.mutate({
      ids: selectedIds,
      adjustment,
    });
    setStockAdjustment("");
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} products?`)) {
      bulkDelete.mutate(selectedIds);
      onClear();
    }
  };

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB.`);
          continue;
        }

        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/bulk-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        bulkAddImages.mutate({
          ids: selectedIds,
          imageUrls: uploadedUrls,
        });
        toast.success(`${uploadedUrls.length} images added to ${selectedIds.length} products`);
      }
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-30 z-50">
      <div className="bg-foreground text-background px-4 py-3 flex items-center gap-4 shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-background/20" />

        {/* Price Update */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/10 gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Update Price
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="center">
            <div className="space-y-3">
              <Label>Price Adjustment</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(e.target.value)}
                  placeholder={isPercentage ? "10" : "50"}
                  className="flex-1"
                />
                <Button
                  variant={isPercentage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPercentage(true)}
                >
                  %
                </Button>
                <Button
                  variant={!isPercentage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPercentage(false)}
                >
                  ₺
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter positive to increase, negative to decrease
              </p>
              <Button onClick={handlePriceUpdate} className="w-full" size="sm">
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Stock Update */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/10 gap-2"
            >
              <Package className="h-4 w-4" />
              Update Stock
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="center">
            <div className="space-y-3">
              <Label>Stock Adjustment</Label>
              <Input
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                placeholder="+10 or -5"
              />
              <p className="text-xs text-muted-foreground">
                Enter positive to add, negative to subtract
              </p>
              <Button onClick={handleStockUpdate} className="w-full" size="sm">
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Bulk Edit */}
        <Button
          variant="ghost"
          size="sm"
          className="text-background hover:bg-background/10 gap-2"
          onClick={handleBulkEdit}
        >
          <Edit className="h-4 w-4" />
          Bulk Edit
        </Button>

        {/* Push to Trendyol */}
        <Button
          variant="ghost"
          size="sm"
          className="text-background hover:bg-background/10 gap-2"
        >
          <Send className="h-4 w-4" />
          Push to Trendyol
        </Button>

        {/* Bulk Image Upload */}
        <Button
          variant="ghost"
          size="sm"
          className="text-background hover:bg-background/10 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Add Images
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleBulkImageUpload}
          className="hidden"
        />

        <div className="h-4 w-px bg-background/20" />

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-background/10"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
