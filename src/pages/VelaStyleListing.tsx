import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Image, 
  Plus, 
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Loader2,
  Trash2,
  Upload,
  Video,
  Settings2,
  RefreshCcw,
  Copy,
  GripVertical,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

// Main section tabs like Vela
const mainSections = [
  { id: "photos", label: "Photos" },
  { id: "video", label: "Video" },
  { id: "title", label: "Title" },
  { id: "description", label: "Description" },
  { id: "tags", label: "Tags" },
  { id: "details", label: "Details" },
  { id: "price", label: "Price" },
  { id: "inventory", label: "Inventory" },
  { id: "variations", label: "Variations" },
  { id: "personalization", label: "Personalization" },
  { id: "shipping", label: "Shipping" },
];

interface Variant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  isActive: boolean;
  images: string[];
  colorCode?: string;
  size?: string;
}

interface VariantType {
  id: string;
  name: string;
  values: { id: string; name: string; colorCode?: string }[];
}

interface ShopConnection {
  id: string;
  shop_name: string;
  platform: string;
}

interface MarketplaceListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  marketplace_data: Record<string, any> | null;
}

export default function VelaStyleListing() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  // UI State
  const [activeSection, setActiveSection] = useState("photos");
  const [activeVariationTab, setActiveVariationTab] = useState("variations");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllVariations, setShowAllVariations] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState("");
  
  // Connected shops
  const [connectedShops, setConnectedShops] = useState<ShopConnection[]>([]);
  const [selectedShop, setSelectedShop] = useState<ShopConnection | null>(null);
  
  // Listings from marketplace_listings
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  
  // Details
  const [productType, setProductType] = useState<"physical" | "digital">("physical");
  const [whoMadeIt, setWhoMadeIt] = useState("");
  const [whatIsIt, setWhatIsIt] = useState("");
  const [whenMade, setWhenMade] = useState("");
  const [productionPartner, setProductionPartner] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [materials, setMaterials] = useState("");
  
  // Variations
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([
    { id: "color", name: "Primary color", values: [] },
    { id: "size", name: "size", values: [] },
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newColorOption, setNewColorOption] = useState("");
  const [newSizeOption, setNewSizeOption] = useState("");
  const [colorError, setColorError] = useState("");
  const [sizeError, setSizeError] = useState("");
  
  // Personalization
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationInstructions, setPersonalizationInstructions] = useState("");
  
  // Shipping
  const [shippingProfile, setShippingProfile] = useState("");
  
  const maxTitleLength = 140;
  const maxTagCount = 13;

  // Load connected shops and listings
  useEffect(() => {
    const loadShopsAndListings = async () => {
      if (!user) return;
      
      // Load connected shops
      const { data: shopsData } = await supabase
        .from('shop_connections')
        .select('id, platform, shop_name, is_connected')
        .eq('user_id', user.id)
        .eq('is_connected', true);
      
      if (shopsData) {
        const shops = shopsData.map(conn => ({
          id: conn.id,
          shop_name: conn.shop_name || conn.platform,
          platform: conn.platform,
        }));
        setConnectedShops(shops);
        if (shops.length > 0) {
          setSelectedShop(shops[0]);
        }
      }
      
      // Load listings
      setIsLoadingListings(true);
      const { data: listingsData } = await supabase
        .from('marketplace_listings')
        .select('id, title, description, price, marketplace_data')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      
      if (listingsData) {
        setListings(listingsData.map(l => ({
          ...l,
          marketplace_data: l.marketplace_data as Record<string, any> || null,
        })));
      }
      setIsLoadingListings(false);
    };
    
    loadShopsAndListings();
  }, [user]);

  // Load selected listing data into form
  const loadListingToForm = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    
    setSelectedListing(listingId);
    setTitle(listing.title || '');
    setDescription(listing.description || '');
    setPrice(listing.price?.toString() || '');
    
    const data = listing.marketplace_data || {};
    setImages(data.images || []);
    setPrimaryColor(data.color || '');
    setQuantity(data.quantity?.toString() || '0');
    
    toast.success(`"${listing.title}" yüklendi`);
  };

  // Load product data if editing via URL param
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId || !user) return;
      
      setIsLoading(true);
      try {
        const { data: listing } = await supabase
          .from('marketplace_listings')
          .select('*')
          .eq('id', productId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (listing) {
          setTitle(listing.title || '');
          setDescription(listing.description || '');
          setPrice(listing.price?.toString() || '');
          
          const data = listing.marketplace_data as Record<string, any> || {};
          setImages(data.images || []);
          setPrimaryColor(data.color || '');
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProductData();
  }, [productId, user]);

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs.current[sectionId];
    if (ref && contentRef.current) {
      const offsetTop = ref.offsetTop - 120;
      contentRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
    setActiveSection(sectionId);
  };

  // Handle tag add
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < maxTagCount) {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Add color option
  const handleAddColorOption = () => {
    const trimmed = newColorOption.trim();
    if (!trimmed) return;
    
    const colorType = variantTypes.find(vt => vt.id === 'color');
    if (colorType?.values.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setColorError("You may not have two options with same name");
      return;
    }
    
    setVariantTypes(prev => prev.map(vt => 
      vt.id === 'color' 
        ? { ...vt, values: [...vt.values, { id: `color-${Date.now()}`, name: trimmed }] }
        : vt
    ));
    setNewColorOption("");
    setColorError("");
  };

  // Add size option
  const handleAddSizeOption = () => {
    const trimmed = newSizeOption.trim();
    if (!trimmed) return;
    
    const sizeType = variantTypes.find(vt => vt.id === 'size');
    if (sizeType?.values.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setSizeError("You may not have two options with same name");
      return;
    }
    
    setVariantTypes(prev => prev.map(vt => 
      vt.id === 'size' 
        ? { ...vt, values: [...vt.values, { id: `size-${Date.now()}`, name: trimmed }] }
        : vt
    ));
    setNewSizeOption("");
    setSizeError("");
  };

  // Remove variant option
  const removeVariantOption = (typeId: string, valueId: string) => {
    setVariantTypes(prev => prev.map(vt => 
      vt.id === typeId 
        ? { ...vt, values: vt.values.filter(v => v.id !== valueId) }
        : vt
    ));
  };

  // Handle publish
  const handlePublish = async () => {
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    if (!user) {
      toast.error("Please log in");
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        title,
        description,
        price: parseFloat(price) || 0,
        status: "active",
        platform: selectedShop?.platform || "manual",
        user_id: user.id,
        shop_connection_id: selectedShop?.id || null,
        marketplace_data: {
          images,
          color: primaryColor,
          quantity: parseInt(quantity) || 0,
          tags,
          materials,
        },
      };

      if (productId) {
        await supabase
          .from("marketplace_listings")
          .update(listingData)
          .eq('id', productId)
          .eq('user_id', user.id);
      } else {
        await supabase.from("marketplace_listings").insert(listingData);
      }

      toast.success("Product published!");
      navigate("/inventory");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!user) {
      toast.error("Please log in");
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        title: title || "Untitled Draft",
        description,
        price: parseFloat(price) || 0,
        status: "draft",
        platform: selectedShop?.platform || "manual",
        user_id: user.id,
        shop_connection_id: selectedShop?.id || null,
        marketplace_data: {
          images,
          color: primaryColor,
          quantity: parseInt(quantity) || 0,
          tags,
          materials,
        },
      };

      if (productId) {
        await supabase
          .from("marketplace_listings")
          .update(listingData)
          .eq('id', productId)
          .eq('user_id', user.id);
      } else {
        await supabase.from("marketplace_listings").insert(listingData);
      }

      toast.success("Saved as draft");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Error saving draft");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">
                {productId ? "Edit Listing" : "Create Listing"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveAsDraft} disabled={isSaving}>
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="border-b bg-card px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {mainSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea ref={contentRef} className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Photos Section */}
            <section ref={(el) => (sectionRefs.current["photos"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" multiple />
                </label>
              </div>
            </section>

            {/* Video Section */}
            <section ref={(el) => (sectionRefs.current["video"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Video</h2>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Add a video</p>
              </div>
            </section>

            {/* Title Section */}
            <section ref={(el) => (sectionRefs.current["title"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Title</h2>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                placeholder="Enter title"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {maxTitleLength - title.length} characters remaining
              </p>
            </section>

            {/* Description Section */}
            <section ref={(el) => (sectionRefs.current["description"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item"
                rows={6}
              />
            </section>

            {/* Tags Section */}
            <section ref={(el) => (sectionRefs.current["tags"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {maxTagCount - tags.length} tags remaining
              </p>
            </section>

            {/* Details Section */}
            <section ref={(el) => (sectionRefs.current["details"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Primary color</Label>
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="Color"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Materials</Label>
                  <Input
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="Materials used"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Price Section */}
            <section ref={(el) => (sectionRefs.current["price"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Price</h2>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </section>

            {/* Inventory Section */}
            <section ref={(el) => (sectionRefs.current["inventory"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Inventory</h2>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </section>

            {/* Variations Section */}
            <section ref={(el) => (sectionRefs.current["variations"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Variations</h2>
              <div className="space-y-4">
                <div>
                  <Label>Colors</Label>
                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    {variantTypes.find(vt => vt.id === 'color')?.values.map((v) => (
                      <Badge key={v.id} variant="outline" className="gap-1">
                        {v.name}
                        <button onClick={() => removeVariantOption('color', v.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newColorOption}
                      onChange={(e) => setNewColorOption(e.target.value)}
                      placeholder="Add color"
                    />
                    <Button onClick={handleAddColorOption}>Add</Button>
                  </div>
                  {colorError && <p className="text-xs text-destructive mt-1">{colorError}</p>}
                </div>
                <div>
                  <Label>Sizes</Label>
                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    {variantTypes.find(vt => vt.id === 'size')?.values.map((v) => (
                      <Badge key={v.id} variant="outline" className="gap-1">
                        {v.name}
                        <button onClick={() => removeVariantOption('size', v.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSizeOption}
                      onChange={(e) => setNewSizeOption(e.target.value)}
                      placeholder="Add size"
                    />
                    <Button onClick={handleAddSizeOption}>Add</Button>
                  </div>
                  {sizeError && <p className="text-xs text-destructive mt-1">{sizeError}</p>}
                </div>
              </div>
            </section>

            {/* Personalization Section */}
            <section ref={(el) => (sectionRefs.current["personalization"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Personalization</h2>
              <div className="flex items-center justify-between mb-4">
                <Label>Enable personalization</Label>
                <Switch
                  checked={personalizationEnabled}
                  onCheckedChange={setPersonalizationEnabled}
                />
              </div>
              {personalizationEnabled && (
                <Textarea
                  value={personalizationInstructions}
                  onChange={(e) => setPersonalizationInstructions(e.target.value)}
                  placeholder="Instructions for buyers"
                  rows={4}
                />
              )}
            </section>

            {/* Shipping Section */}
            <section ref={(el) => (sectionRefs.current["shipping"] = el)}>
              <h2 className="text-lg font-semibold mb-4">Shipping</h2>
              <Select value={shippingProfile} onValueChange={setShippingProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Shipping</SelectItem>
                  <SelectItem value="express">Express Shipping</SelectItem>
                  <SelectItem value="free">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </section>
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}
