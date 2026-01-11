import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Image as ImageIcon } from "lucide-react";
import type { EditCategory } from "@/pages/BulkEdit";
import type { Product } from "@/hooks/useProducts";

interface BulkEditProductListProps {
  products: Product[];
  checkedIds: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleProduct: (id: string) => void;
  onToggleAll: () => void;
  activeCategory: EditCategory;
}

export function BulkEditProductList({
  products,
  checkedIds,
  searchQuery,
  onSearchChange,
  onToggleProduct,
  onToggleAll,
  activeCategory,
}: BulkEditProductListProps) {
  const allChecked = products.length > 0 && checkedIds.length === products.length;
  const someChecked = checkedIds.length > 0 && checkedIds.length < products.length;

  const getCategoryValue = (product: Product): string => {
    switch (activeCategory) {
      case "photos":
        return `${product.images?.length || 0} photos`;
      case "title":
        return product.title;
      case "description":
        return product.description || "—";
      case "price":
        return `₺${product.price.toFixed(2)}`;
      case "quantity":
        return `${product.stock} adet`;
      case "sku":
        return product.sku || "—";
      default:
        return "—";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search & Select All */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allChecked}
            onCheckedChange={onToggleAll}
            className={someChecked ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <span className="text-sm text-muted-foreground">
            {checkedIds.length} / {products.length} selected
          </span>
        </div>
        <div className="flex-1" />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Product List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
            >
              <Checkbox
                checked={checkedIds.includes(product.id)}
                onCheckedChange={() => onToggleProduct(product.id)}
              />

              {/* Product Image */}
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{product.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {product.sku || "No SKU"}
                </p>
              </div>

              {/* Category Value */}
              <div className="text-sm text-muted-foreground w-32 text-right truncate">
                {getCategoryValue(product)}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
