import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/contexts/ShopContext";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Trash2, Loader2, Edit, Copy, Download, ChevronDown, Search
} from "lucide-react";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onSearch?: () => void;
}

export function BulkActionBar({ 
  selectedCount, 
  selectedIds, 
  onClear,
  onSearch,
}: BulkActionBarProps) {
  const navigate = useNavigate();
  const { bulkDelete, copyProduct } = useProducts();
  const { shops, selectedShop } = useShop();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Get connected shops for copy dropdown
  const connectedShops = shops.filter(s => s.id !== 'master' && s.isConnected);

  const handleBulkEdit = () => {
    navigate(`/inventory/bulk-edit?ids=${selectedIds.join(",")}`);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} products?`)) {
      bulkDelete.mutate(selectedIds);
      onClear();
    }
  };

  const handleExport = async () => {
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

  const handleCopyToShop = async (targetShopId: string) => {
    setIsCopying(true);
    try {
      // Copy each selected product
      for (const id of selectedIds) {
        await copyProduct.mutateAsync(id);
      }
      
      queryClient.invalidateQueries({ queryKey: ["listing-counts"] });
      toast.success(`${selectedCount} ürün Copy bölümüne kopyalandı`);
    } catch (error: any) {
      toast.error(error.message || 'Kopyalama hatası');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-background">
      {/* Left: Status indicator */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border border-muted-foreground/30 flex items-center justify-center">
          <div className="w-3 h-1 bg-muted-foreground/50" />
        </div>
        <span className="text-sm font-medium">Active</span>
        <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
      </div>

      <div className="flex-1" />

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={onSearch}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>

        {/* Copy Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              disabled={isCopying}
            >
              {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Copy
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {connectedShops.map((shop) => (
              <DropdownMenuItem 
                key={shop.id}
                onClick={() => handleCopyToShop(shop.id)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: shop.color }}
                >
                  {shop.icon}
                </div>
                <span>{shop.name}</span>
              </DropdownMenuItem>
            ))}
            {connectedShops.length === 0 && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">No shops connected</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Button */}
        <Button
          size="sm"
          className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleBulkEdit}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
