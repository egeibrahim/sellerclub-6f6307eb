import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImageUpload } from "@/components/product/ProductImageUpload";
import { Json } from "@/integrations/supabase/types";

interface MarketplaceData {
  sku?: string;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  stock?: number;
  images?: string[];
  [key: string]: unknown;
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Error loading product");
        navigate("/inventory");
        return;
      }

      if (!data) {
        toast.error("Product not found");
        navigate("/inventory");
        return;
      }

      // Parse marketplace_data for additional fields
      const marketplaceData = (data.marketplace_data as MarketplaceData) || {};
      
      setTitle(data.title || "");
      setDescription(data.description || "");
      setSku(marketplaceData.sku || "");
      setPrice(String(data.price || ""));
      setStock(String(marketplaceData.stock || "0"));
      setBrand(marketplaceData.brand || "");
      setColor(marketplaceData.color || "");
      setSize(marketplaceData.size || "");
      setMaterial(marketplaceData.material || "");
      setImages((marketplaceData.images as string[]) || []);
      setPlatform(data.platform || "");
      setStatus(data.status || "draft");
      setIsLoading(false);
    };

    fetchProduct();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!id || !user) return;

    setIsSaving(true);
    
    const updatedMarketplaceData: MarketplaceData = {
      sku: sku || undefined,
      brand: brand || undefined,
      color: color || undefined,
      size: size || undefined,
      material: material || undefined,
      stock: parseInt(stock) || 0,
      images,
    };

    const { error } = await supabase
      .from("marketplace_listings")
      .update({
        title,
        description,
        price: parseFloat(price) || 0,
        marketplace_data: updatedMarketplaceData as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      toast.error("Error saving product");
      return;
    }

    toast.success("Product saved successfully");
  };

  const handleDelete = async () => {
    if (!id || !user) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Error deleting product");
      return;
    }

    toast.success("Product deleted");
    navigate("/inventory");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Edit Product</h1>
              <p className="text-sm text-muted-foreground">
                Platform: {platform} • Status: {status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              className="gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Images */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Product Images</h2>
              {id && user && (
                <ProductImageUpload
                  productId={id}
                  userId={user.id}
                  images={images}
                  onImagesChange={setImages}
                />
              )}
            </div>

            {/* Basic Info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Product title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU code"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Pricing & Stock</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Attributes</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Brand name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Color"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="Size"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Material"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
