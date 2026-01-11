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
      const productData = {
        title: title.trim(),
        description: description.trim() || null,
        sku: sku.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(quantity) || 0,
        material: materials.trim() || null,
        status: status === 'active' ? 'active' : 'draft',
        source: 'etsy',
        user_id: user.id,
        trendyol_synced: false,
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">NA</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-primary text-primary-foreground">
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
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
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">Description</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">NA</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-primary text-primary-foreground">
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">Tags</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">NA</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-primary text-primary-foreground">
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {maxTagCount} remaining
              </p>
            </div>
          </div>
        );

      case "Description":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Description</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">NA</span>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-primary text-primary-foreground">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Tags</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">NA</span>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-primary text-primary-foreground">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {maxTagCount} remaining
            </p>
          </div>
        );

      case "Details":
        return (
          <div className="space-y-6">
            <div>
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

              {/* Production Partner */}
              <div className="mb-6">
                <Label className="text-sm text-foreground mb-2 block">
                  Production partner <span className="text-muted-foreground">Optional</span>
                </Label>
                <Input placeholder="Choose Production partner" className="h-11" />
              </div>

              {/* Category */}
              <div className="mb-6">
                <Label className="text-sm text-foreground mb-2 block">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="art">Art & Collectibles</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="home">Home & Living</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Fields Toggle */}
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="flex items-center gap-2 text-sm text-primary font-medium mb-4"
              >
                {showOptionalFields ? "Hide" : "Show"} optional fields
                <ChevronUp className={cn("h-4 w-4 transition-transform", !showOptionalFields && "rotate-180")} />
              </button>

              {showOptionalFields && (
                <div className="space-y-4 border-t border-dashed border-primary/30 pt-4">
                  <div>
                    <Label className="text-sm text-foreground mb-2 block">
                      Primary color <span className="text-muted-foreground">Optional</span>
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Primary color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-foreground mb-2 block">
                      Secondary color <span className="text-muted-foreground">Optional</span>
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Secondary color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "Price":
        return (
          <div className="space-y-6">
            {/* Renewal Options */}
            <div>
              <Label className="text-sm text-foreground mb-3 block">Renewal options</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRenewalOption("automatic")}
                  className={cn(
                    "p-4 rounded-sm border-2 text-left transition-colors",
                    renewalOption === "automatic"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      renewalOption === "automatic" ? "border-primary" : "border-border"
                    )}>
                      {renewalOption === "automatic" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Automatic</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-8">
                    This listing will renew as it expires for $0.20 USD each time (recommended).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewalOption("manual")}
                  className={cn(
                    "p-4 rounded-sm border-2 text-left transition-colors",
                    renewalOption === "manual"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      renewalOption === "manual" ? "border-primary" : "border-border"
                    )}>
                      {renewalOption === "manual" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-foreground">Manual</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-8">
                    I'll renew expired listings myself.
                  </p>
                </button>
              </div>
            </div>

            {/* Section */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">
                Section <span className="text-muted-foreground">Optional</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Materials */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">Materials</Label>
              <Input
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Materials"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">13 remaining</p>
            </div>

            {/* Price */}
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Price</h2>
              <div>
                <Label className="text-sm text-foreground mb-2 block">Price</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="h-11 w-48"
                />
              </div>
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
                <Label className="text-sm text-foreground mb-2 block">
                  SKU <span className="text-muted-foreground">Optional</span>
                </Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU"
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
            
            {/* Category Dropdowns */}
            <div className="flex gap-3">
              <Select>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Art & Collectibles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="art">Art & Collectibles</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Collectibles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                  <SelectItem value="prints">Prints</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choose Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="figurines">Figurines</SelectItem>
                  <SelectItem value="trading-cards">Trading Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Variation Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-6">
                {variationTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveVariationTab(tab)}
                    className={cn(
                      "py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeVariationTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Variation Content */}
            <div className="flex gap-8">
              <div className="flex-1">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Variation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No second variation
              </div>
            </div>
          </div>
        );

      case "Personalization":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Personalization</h2>
            <div className="flex items-center gap-3">
              <Switch
                checked={personalizationEnabled}
                onCheckedChange={setPersonalizationEnabled}
              />
              <span className="text-sm text-foreground">
                {personalizationEnabled ? "On" : "Off"}
              </span>
            </div>
          </div>
        );

      case "Shipping":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Shipping</h2>
            
            {/* Processing Profile */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">Processing profile</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Processing profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 business days</SelectItem>
                  <SelectItem value="3-5">3-5 business days</SelectItem>
                  <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Profile */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">Shipping profile</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Shipping profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free shipping</SelectItem>
                  <SelectItem value="calculated">Calculated shipping</SelectItem>
                  <SelectItem value="flat">Flat rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight & Dimensions */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-foreground mb-2 block">
                  Item weight <span className="text-muted-foreground">Optional</span>
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Weight" className="h-11" />
                  <div className="flex items-center justify-center w-12 h-11 bg-muted text-sm text-muted-foreground rounded-sm">
                    lb
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">
                  Length <span className="text-muted-foreground">Optional</span>
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Length" className="h-11" />
                  <div className="flex items-center justify-center w-12 h-11 bg-muted text-sm text-muted-foreground rounded-sm">
                    in
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">
                  Width <span className="text-muted-foreground">Optional</span>
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Width" className="h-11" />
                  <div className="flex items-center justify-center w-12 h-11 bg-muted text-sm text-muted-foreground rounded-sm">
                    in
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-2 block">
                  Height <span className="text-muted-foreground">Optional</span>
                </Label>
                <div className="flex gap-2">
                  <Input placeholder="Height" className="h-11" />
                  <div className="flex items-center justify-center w-12 h-11 bg-muted text-sm text-muted-foreground rounded-sm">
                    in
                  </div>
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">
                Return policy <span className="text-muted-foreground">Optional</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Return policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-days">30 day returns</SelectItem>
                  <SelectItem value="14-days">14 day returns</SelectItem>
                  <SelectItem value="no-returns">No returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col bg-background">
        {/* Header with Tabs */}
        <div className="border-b border-border bg-background">
          <div className="px-6 py-4">
            <div className="text-xs text-muted-foreground mb-1">Etsy · BoxBoxGarage</div>
            <h1 className="text-xl font-semibold text-foreground">New listing</h1>
          </div>
          <div className="px-6 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Selector */}
        <div className="px-6 py-4 bg-primary/10 border-b border-border">
          <Select>
            <SelectTrigger className="w-48 bg-background">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>Choose Profile</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No profile</SelectItem>
              <SelectItem value="front-view">front view prices</SelectItem>
              <SelectItem value="front-back">Front-Back View Prices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="max-w-4xl px-6 py-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <ListingFooter
          onSaveAsProfile={handleSaveAsProfile}
          onPublish={handlePublish}
          isLoading={isSaving}
          primaryColor="#F56400"
        />
      </div>
    </Layout>
  );
}
