import { useState } from "react";
import { Product, useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Save, Package, Send } from "lucide-react";

interface ProductSidePanelProps {
  product: Product;
  onClose: () => void;
}

export function ProductSidePanel({ product, onClose }: ProductSidePanelProps) {
  const { updateProduct } = useProducts();
  const [formData, setFormData] = useState({
    title: product.title,
    sku: product.sku || "",
    description: product.description || "",
    price: product.price,
    stock: product.stock,
    brand: product.brand || "",
    color: product.color || "",
    size: product.size || "",
  });

  const handleSave = async () => {
    await updateProduct.mutateAsync({
      id: product.id,
      ...formData,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-background border-l border-border shadow-lg z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted flex items-center justify-center border border-border">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground truncate max-w-[250px]">
              {product.title}
            </h2>
            <p className="text-xs text-muted-foreground">{product.sku || "No SKU"}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="general"
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 py-3"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="trendyol"
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 py-3"
            >
              Trendyol
            </TabsTrigger>
            <TabsTrigger
              value="hepsiburada"
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4 py-3"
            >
              Hepsiburada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => handleChange("size", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₺)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleChange("stock", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="trendyol" className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted border border-border">
              <div>
                <p className="font-medium text-sm">Sync Status</p>
                <Badge variant="outline" className={product.trendyol_synced ? "text-success border-success mt-1" : "text-muted-foreground mt-1"}>
                  {product.trendyol_synced ? "Synced" : "Not synced"}
                </Badge>
              </div>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Push to Trendyol
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Trendyol Category</Label>
              <Button variant="outline" className="w-full justify-start text-muted-foreground">
                Select category...
              </Button>
              <p className="text-xs text-muted-foreground">
                Category selection will show required attributes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Price Markup</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="20" className="flex-1" />
                <Button variant="outline">%</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Final price: ₺{(Number(formData.price) * 1.2).toFixed(2)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="hepsiburada" className="p-4">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Hepsiburada integration is under development.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button
          onClick={handleSave}
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
