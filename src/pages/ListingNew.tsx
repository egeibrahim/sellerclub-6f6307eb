import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Image, Plus, Upload, ChevronUp, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ListingFooter } from "@/components/listing/ListingFooter";

const tabs = [
  "Photos",
  "Video", 
  "Title",
  "Description",
  "Tags",
  "Details",
  "Price",
  "Inventory",
  "Variations",
  "Personalization",
  "Shipping",
];

const variationTabs = ["Variations", "Price", "Quantity", "SKU", "Visibility", "Photos", "Processing"];

export default function ListingNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Photos");
  const [activeVariationTab, setActiveVariationTab] = useState("Variations");
  const [productType, setProductType] = useState<"physical" | "digital">("physical");
  const [renewalOption, setRenewalOption] = useState<"automatic" | "manual">("automatic");
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [sku, setSku] = useState("");
  const [materials, setMaterials] = useState("");

  const maxTitleLength = 140;
  const maxTagCount = 13;

  const handlePublish = async (status: 'staging' | 'draft' | 'active') => {
    if (!user) {
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    if (!title.trim()) {
      toast.error('Ürün adı zorunludur');
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        status: status === 'active' ? 'active' : 'draft',
        platform: 'etsy',
        user_id: user.id,
        marketplace_data: {
          sku: sku.trim() || null,
          material: materials.trim() || null,
          quantity: parseInt(quantity) || 0,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          productType,
          renewalOption,
          personalizationEnabled,
        },
      };

      const { error } = await supabase
        .from('marketplace_listings')
        .insert(listingData);

      if (error) throw error;

      toast.success(`Ürün ${status === 'active' ? 'yayınlandı' : status === 'staging' ? 'staging olarak kaydedildi' : 'taslak olarak kaydedildi'}`);
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Ürün kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsProfile = () => {
    toast.info('Profile kaydetme özelliği yakında eklenecek');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Photos":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Photos</h2>
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Image className="h-8 w-8 text-primary" />
                <span className="text-sm text-primary font-medium">Upload</span>
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Video</h2>
              <div className="w-56 h-40 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
                <span className="text-sm text-primary font-medium">ADD</span>
                <span className="text-xs text-muted-foreground">Max file size: 100 MB</span>
              </div>
            </div>
          </div>
        );

      case "Video":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Video</h2>
            <div className="w-56 h-40 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
              <span className="text-sm text-primary font-medium">ADD</span>
              <span className="text-xs text-muted-foreground">Max file size: 100 MB</span>
            </div>
          </div>
        );

      case "Title":
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">Title</h2>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                placeholder="Title"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {maxTitleLength - title.length} characters remaining
              </p>
            </div>
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Tags</h2>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {maxTagCount} max tags
              </p>
            </div>
          </div>
        );

      case "Description":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={12}
              className="resize-none"
            />
          </div>
        );

      case "Tags":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Tags</h2>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {maxTagCount} max tags
            </p>
          </div>
        );

      case "Details":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
            
            {/* Type Selection */}
            <div className="mb-6">
              <Label className="text-sm text-foreground mb-3 block">Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType("physical")}
                  className={cn(
                    "p-4 rounded-sm border-2 text-left transition-colors",
                    productType === "physical"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      productType === "physical" ? "border-primary" : "border-border"
                    )}>
                      {productType === "physical" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Physical</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-8">
                    A tangible item that you will ship to buyers.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType("digital")}
                  className={cn(
                    "p-4 rounded-sm border-2 text-left transition-colors",
                    productType === "digital"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      productType === "digital" ? "border-primary" : "border-border"
                    )}>
                      {productType === "digital" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Digital</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-8">
                    A digital file that buyers will download.
                  </p>
                </button>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="text-sm text-foreground mb-2 block">Who made it?</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Who made it?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="i-did">I did</SelectItem>
                    <SelectItem value="member">A member of my shop</SelectItem>
                    <SelectItem value="another">Another company or person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">What is it?</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="What is it?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finished">A finished product</SelectItem>
                    <SelectItem value="supply">A supply or tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">When was it made?</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="When was it made?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="made-to-order">Made to order</SelectItem>
                    <SelectItem value="2020s">2020-2025</SelectItem>
                    <SelectItem value="2010s">2010-2019</SelectItem>
                    <SelectItem value="before-2010">Before 2010</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Materials */}
            <div className="mb-6">
              <Label className="text-sm text-foreground mb-2 block">Materials</Label>
              <Input 
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Materials used" 
                className="h-11" 
              />
            </div>
          </div>
        );

      case "Price":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>
            <div>
              <Label className="text-sm text-foreground mb-2 block">Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="h-11"
              />
            </div>
          </div>
        );

      case "Inventory":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-foreground mb-2 block">Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">SKU</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Stock code"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        );

      case "Variations":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Variations</h2>
            <p className="text-sm text-muted-foreground">
              Add variations like color, size, etc.
            </p>
          </div>
        );

      case "Personalization":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Personalization</h2>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Enable personalization</Label>
              <Switch
                checked={personalizationEnabled}
                onCheckedChange={setPersonalizationEnabled}
              />
            </div>
          </div>
        );

      case "Shipping":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Shipping</h2>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select shipping profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Shipping</SelectItem>
                <SelectItem value="express">Express Shipping</SelectItem>
                <SelectItem value="free">Free Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col bg-background pb-20">
        {/* Tab navigation */}
        <div className="border-b border-border bg-card px-6 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <ListingFooter
          onPublish={handlePublish}
          onSaveAsProfile={handleSaveAsProfile}
          isLoading={isSaving}
        />
      </div>
    </Layout>
  );
}
