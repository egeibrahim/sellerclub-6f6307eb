import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BulkEditSidebar } from "@/components/bulk-edit/BulkEditSidebar";
import { BulkEditHeader } from "@/components/bulk-edit/BulkEditHeader";
import { BulkEditProductList } from "@/components/bulk-edit/BulkEditProductList";
import { BulkEditActions } from "@/components/bulk-edit/BulkEditActions";
import { useProducts } from "@/hooks/useProducts";
import { useShop } from "@/contexts/ShopContext";

export type EditCategory = 
  | "photos" 
  | "videos" 
  | "title" 
  | "description" 
  | "tags" 
  | "price" 
  | "quantity" 
  | "sku";

export type EditMode = "add" | "replace" | "delete";

export default function BulkEdit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedShop } = useShop();
  const { products, isLoading } = useProducts();

  // Get selected product IDs from URL
  const selectedIds = useMemo(() => {
    const ids = searchParams.get("ids");
    return ids ? ids.split(",") : [];
  }, [searchParams]);

  // Filter products by selected IDs
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  // State
  const [activeCategory, setActiveCategory] = useState<EditCategory>("photos");
  const [editMode, setEditMode] = useState<EditMode>("add");
  const [checkedIds, setCheckedIds] = useState<string[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return selectedProducts;
    const query = searchQuery.toLowerCase();
    return selectedProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
    );
  }, [selectedProducts, searchQuery]);

  const handleCancel = () => {
    navigate("/inventory");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // TODO: Implement sync logic based on activeCategory and editMode
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    navigate("/inventory");
  };

  const toggleProduct = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (checkedIds.length === filteredProducts.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(filteredProducts.map((p) => p.id));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar - Categories */}
        <BulkEditSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <BulkEditHeader
            shopName={selectedShop.name}
            platform={selectedShop.platform}
            shopColor={selectedShop.color}
            shopIcon={selectedShop.icon}
            listingCount={selectedProducts.length}
            activeCategory={activeCategory}
            editMode={editMode}
            onEditModeChange={setEditMode}
          />

          {/* Product List */}
          <BulkEditProductList
            products={filteredProducts}
            checkedIds={checkedIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleProduct={toggleProduct}
            onToggleAll={toggleAll}
            activeCategory={activeCategory}
          />
        </div>

        {/* Right Actions */}
        <BulkEditActions
          onCancel={handleCancel}
          onSync={handleSync}
          isSyncing={isSyncing}
          checkedCount={checkedIds.length}
        />
      </div>
    </Layout>
  );
}
