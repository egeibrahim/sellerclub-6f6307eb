import { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts, Product } from "@/hooks/useProducts";
import { useShop } from "@/contexts/ShopContext";
import { useShopSync } from "@/hooks/useShopSync";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Search,
  RefreshCw,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  GitMerge,
  ExternalLink,
  Send,
} from "lucide-react";
import { BulkActionBar } from "./BulkActionBar";
import { ProductSidePanel } from "./ProductSidePanel";
import { ShopRefreshDialog } from "./ShopRefreshDialog";
import { CopyListingDialog } from "./CopyListingDialog";
import { PublishDropdown } from "./PublishDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Score badge component
function ScoreBadge({ score }: { score: string }) {
  const colors: Record<string, string> = {
    "A": "bg-success/10 text-success border-success",
    "A-": "bg-success/10 text-success border-success",
    "B+": "bg-primary/10 text-primary border-primary",
    "B": "bg-primary/10 text-primary border-primary",
    "B-": "bg-warning/10 text-warning border-warning",
    "C": "bg-warning/10 text-warning border-warning",
    "D": "bg-destructive/10 text-destructive border-destructive",
    "F": "bg-destructive/10 text-destructive border-destructive",
  };

  return (
    <div className={cn(
      "w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold",
      colors[score] || "bg-muted text-muted-foreground border-border"
    )}>
      {score}
    </div>
  );
}

// Shop status indicator
function ShopIndicator({ synced }: { synced: boolean }) {
  return (
    <div className={cn(
      "w-3 h-3 rounded-full",
      synced ? "bg-success" : "bg-warning"
    )} />
  );
}

// Map platform name to source filter
function getPlatformSource(platform: string): string {
  const map: Record<string, string> = {
    "Etsy": "etsy",
    "Trendyol": "trendyol",
    "Hepsiburada": "hepsiburada",
    "ikas": "ikas",
  };
  return map[platform] || platform.toLowerCase();
}

// Get edit route based on source
function getEditRoute(source: string, productId: string): string {
  const routes: Record<string, string> = {
    "etsy": `/listing/${productId}/edit`,
    "trendyol": `/trendyol-listing/${productId}/edit`,
    "hepsiburada": `/hepsiburada-listing/${productId}/edit`,
    "ikas": `/ikas-listing/${productId}/edit`,
  };
  return routes[source] || `/listing/${productId}/edit`;
}

export function ProductGrid() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedShop } = useShop();

  const { syncTrendyol, progress, resetProgress, isLoading: isSyncing } =
    useShopSync();
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);

  const handleShopRefresh = () => {
    if (selectedShop.platform !== "Trendyol") {
      toast.info("Bu mağaza için yenileme henüz desteklenmiyor.");
      return;
    }

    setShowRefreshDialog(true);
    syncTrendyol.mutate();
  };

  const handleRetrySync = () => {
    resetProgress();
    syncTrendyol.mutate();
  };
  
  // Get source filter from selected shop
  const sourceFilter = getPlatformSource(selectedShop.platform);
  const statusFilter = searchParams.get("status") || "active";
  
  const { products, isLoading, updateProduct, deleteProduct, copyProduct } = useProducts(sourceFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Get shop connections for copy dialog
  const { shops } = useShop();
  const shopConnections = shops.filter(s => s.id !== 'master').map(shop => ({
    id: shop.id,
    shop_name: shop.name,
    platform: shop.platform,
    shop_icon: shop.icon,
    shop_color: shop.color,
    is_connected: shop.isConnected,
  }));
  const itemsPerPage = 25;

  // Filter products by status and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.title.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [products, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const startEditing = (id: string, field: string, currentValue: string | number | null) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue ?? ""));
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let value: string | number = editValue;

    if (field === "price" || field === "stock") {
      value = Number(editValue) || 0;
    }

    await updateProduct.mutateAsync({ id, [field]: value });
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Handle product actions
  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct.mutateAsync(productId);
    }
  };

  const handleCopy = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    await copyProduct.mutateAsync(productId);
    toast.success("Product copied to Copy section");
  };

  const handleMerge = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    // For now, just show a toast - merge functionality can be expanded later
    toast.info("Merge feature: Select multiple products to merge their data");
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    navigate(getEditRoute(product.source, product.id));
  };

  const handleRowClick = (product: Product) => {
    navigate(getEditRoute(product.source, product.id));
  };

  // Mock scores for products
  const getScore = (index: number): string => {
    const scores = ["A", "A-", "B+", "B", "B-", "C"];
    return scores[index % scores.length];
  };

  // Mock section for products
  const getSection = (index: number): string => {
    const sections = ["Tate", "Freya Skye", "Formula 1", "Digital", "Marvel"];
    return sections[index % sections.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Get status label for header
  const getStatusLabel = () => {
    switch (statusFilter) {
      case "active": return "Active";
      case "draft": return "Draft";
      case "staging": return "Staging";
      case "copy": return "Copy";
      case "all": return "All Products";
      default: return "Products";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-border flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{getStatusLabel()}</h1>
            <span className="text-muted-foreground">({filteredProducts.length})</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShopRefresh}
            disabled={selectedShop.platform !== "Trendyol" || isSyncing}
            title={
              selectedShop.platform === "Trendyol"
                ? "Mağazayı yenile"
                : "Bu mağaza için yenileme yok"
            }
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-muted-foreground",
                isSyncing && "animate-spin"
              )}
            />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Import
          </Button>
          <Button 
            className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(selectedShop.listingRoute)}
          >
            <Plus className="h-4 w-4" />
            Create listing
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="w-16 px-2 py-3 text-left"></th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="w-24 px-4 py-3 text-right">Stock</th>
              <th className="w-28 px-4 py-3 text-right">Price</th>
              <th className="w-28 px-4 py-3 text-left">Expires on</th>
              <th className="w-28 px-4 py-3 text-left">Section</th>
              <th className="w-20 px-4 py-3 text-center">Score</th>
              <th className="w-20 px-4 py-3 text-center">Shops</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-muted flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No products</h3>
                    <p className="text-muted-foreground">Add your first product to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group relative"
                  onClick={() => handleRowClick(product)}
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleSelection(product.id)}
                    />
                  </td>

                  <td className="px-2 py-3">
                    <div className="w-12 h-14 bg-muted flex items-center justify-center border border-border rounded-sm overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </td>

                  <td
                    className="px-4 py-3 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(product.id, "title", product.title);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {editingCell?.id === product.id && editingCell?.field === "title" ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <>
                          <span className="text-sm text-foreground line-clamp-2 flex-1">{product.title}</span>
                          
                          {/* Hover Action Buttons */}
                          {hoveredProductId === product.id && (
                            <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDelete(e, product.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={(e) => handleCopy(e, product.id)}
                                title="Copy to Copy section"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={(e) => handleMerge(e, product.id)}
                                title="Merge products"
                              >
                                <GitMerge className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={(e) => handleEdit(e, product)}
                                title="Edit product"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(product.id, "stock", product.stock);
                    }}
                  >
                    {editingCell?.id === product.id && editingCell?.field === "stock" ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="h-8 w-20 text-right ml-auto"
                      />
                    ) : (
                      <span className="text-sm text-foreground">{product.stock.toLocaleString()}</span>
                    )}
                  </td>

                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(product.id, "price", product.price);
                    }}
                  >
                    {editingCell?.id === product.id && editingCell?.field === "price" ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="h-8 w-24 text-right ml-auto"
                      />
                    ) : (
                      <div className="text-sm">
                        <span className="text-foreground">${Number(product.price).toFixed(2)}</span>
                        <span className="text-success text-xs ml-1">+371</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">02.05.26</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground">{getSection(index)}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ScoreBadge score={getScore(index)} />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ShopIndicator synced={product.trendyol_synced || false} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            Viewing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </span>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          selectedIds={Array.from(selectedIds)}
          onClear={clearSelection}
          onCopy={() => setShowCopyDialog(true)}
          currentStatus={statusFilter}
        />
      )}

      {/* Copy Dialog */}
      <CopyListingDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        selectedListings={Array.from(selectedIds)}
        shops={shopConnections}
        currentShopId={selectedShop.id !== 'master' ? selectedShop.id : null}
      />

      {/* Side Panel */}
      {selectedProduct && (
        <ProductSidePanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <ShopRefreshDialog
        open={showRefreshDialog}
        onOpenChange={(open) => {
          setShowRefreshDialog(open);
          if (!open) resetProgress();
        }}
        progress={progress}
        onRetry={handleRetrySync}
      />
    </div>
  );
}
