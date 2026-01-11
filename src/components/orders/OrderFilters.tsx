import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  marketplaceFilter: string;
  onMarketplaceChange: (marketplace: string) => void;
  onClearFilters: () => void;
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  marketplaceFilter,
  onMarketplaceChange,
  onClearFilters,
}: OrderFiltersProps) {
  const hasFilters = searchQuery || statusFilter !== 'all' || marketplaceFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sipariş ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="pending">Beklemede</SelectItem>
          <SelectItem value="processing">İşleniyor</SelectItem>
          <SelectItem value="shipped">Kargoda</SelectItem>
          <SelectItem value="delivered">Teslim Edildi</SelectItem>
          <SelectItem value="cancelled">İptal</SelectItem>
        </SelectContent>
      </Select>

      <Select value={marketplaceFilter} onValueChange={onMarketplaceChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Pazaryeri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Pazaryerleri</SelectItem>
          <SelectItem value="trendyol">Trendyol</SelectItem>
          <SelectItem value="hepsiburada">Hepsiburada</SelectItem>
          <SelectItem value="n11">N11</SelectItem>
          <SelectItem value="ciceksepeti">Çiçeksepeti</SelectItem>
          <SelectItem value="amazon">Amazon</SelectItem>
          <SelectItem value="ikas">ikas</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" /> Temizle
        </Button>
      )}
    </div>
  );
}
