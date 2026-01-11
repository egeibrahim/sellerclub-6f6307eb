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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  X, DollarSign, Package, Trash2, Send, ImagePlus, Loader2, Edit, 
  Copy, Archive, Download, ChevronDown, MinusCircle 
} from "lucide-react";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onCopy?: () => void;
  currentStatus?: string;
}

export function BulkActionBar({ 
  selectedCount, 
  selectedIds, 
  onClear,
  onCopy,
  currentStatus = 'active'
}: BulkActionBarProps) {
  const navigate = useNavigate();
  const { bulkDelete, bulkUpdatePrice, bulkUpdateStock, bulkAddImages } = useProducts();
  const { user } = useAuth();
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [isPercentage, setIsPercentage] = useState(true);
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleInactive = async () => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'inactive' })
        .in('id', selectedIds);

      if (error) throw error;

      toast.success(`${selectedCount} ürün pasif yapıldı`);
      onClear();
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu');
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'archived' })
        .in('id', selectedIds);

      if (error) throw error;

      toast.success(`${selectedCount} ürün arşivlendi`);
      onClear();
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('id', selectedIds);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Dışa aktarılacak ürün bulunamadı');
        return;
      }

      // Convert to CSV
      const headers = ['ID', 'Title', 'Description', 'Price', 'Status', 'Platform', 'Created At'];
      const rows = data.map(item => [
        item.id,
        item.title,
        item.description || '',
        item.price || '',
        item.status || '',
        item.platform,
        item.created_at,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `listings_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      toast.success(`${selectedCount} ürün dışa aktarıldı`);
    } catch (error: any) {
      toast.error(error.message || 'Dışa aktarma hatası');
    } finally {
      setIsExporting(false);
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
      <div className="bg-foreground text-background px-4 py-3 flex items-center gap-3 shadow-lg rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-background/20" />

        {/* Copy Dropdown */}
        <Button
          variant="ghost"
          size="sm"
          className="text-background hover:bg-background/10 gap-2"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>

        {/* Price Update */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/10 gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Price
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
              Stock
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
          Edit
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-background hover:bg-background/10 gap-1"
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
          Images
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

        {/* Archive */}
        <Button
          variant="ghost"
          size="sm"
          className="text-background hover:bg-background/10 gap-2"
          onClick={handleArchive}
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>

        {/* Inactive */}
        <Button
          variant="ghost"
          size="sm"
          className="text-yellow-400 hover:bg-yellow-400/10 gap-2"
          onClick={handleInactive}
        >
          <MinusCircle className="h-4 w-4" />
          Inactive
        </Button>

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
