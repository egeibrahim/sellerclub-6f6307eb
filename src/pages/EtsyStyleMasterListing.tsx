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
import { cn } from "@/lib/utils";
import { 
  Image, 
  Plus, 
  ChevronDown,
  Loader2,
  Trash2,
  Upload,
  Video,
  Settings2,
  RefreshCcw,
  GripVertical,
  Store,
  Package,
  ArrowRight,
  Check,
  X,
  Search,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMasterListings, MasterListing } from "@/hooks/useMasterListings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Main section tabs - Etsy style
const mainSections = [
  { id: "photos", label: "Photos" },
  { id: "video", label: "Video" },
  { id: "listing-details", label: "Listing details" },
  { id: "inventory", label: "Inventory & pricing" },
  { id: "variations", label: "Variations" },
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns & exchanges" },
];

// Variation sub-tabs
const variationSubTabs = [
  { id: "variations", label: "Variations" },
  { id: "price", label: "Price" },
  { id: "quantity", label: "Quantity" },
  { id: "sku", label: "SKU" },
  { id: "visibility", label: "Visibility" },
  { id: "photos", label: "Photos" },
  { id: "processing", label: "Processing" },
];

interface ShopConnection {
  id: string;
  platform: string;
  shop_name: string;
  is_connected: boolean;
}

interface ImportableProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  sku: string | null;
  brand: string | null;
  description: string | null;
  category_path?: string;
}

interface VariantOption {
  id: string;
  name: string;
  colorCode?: string;
}

interface VariantType {
  id: string;
  name: string;
  values: VariantOption[];
}

// Variant combination for matrix
interface VariantCombination {
  id: string;
  colorId: string;
  colorName: string;
  sizeId: string;
  sizeName: string;
  price: string;
  quantity: string;
  sku: string;
  isVisible: boolean;
  photos: string[];
}

export default function EtsyStyleMasterListing() {
  const navigate = useNavigate();
  const { id: listingId } = useParams();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  const { masterListings, createMasterListing, updateMasterListing, addImage, isLoading: masterLoading } = useMasterListings();
  
  // UI State
  const [activeSection, setActiveSection] = useState("photos");
  const [activeVariationTab, setActiveVariationTab] = useState("variations");
  const [isSaving, setIsSaving] = useState(false);
  const [showAllVariations, setShowAllVariations] = useState(true);
  
  // Shop connections
  const [connections, setConnections] = useState<ShopConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ShopConnection | null>(null);
  const [connectionProducts, setConnectionProducts] = useState<ImportableProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  
  // Import dialog
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedImportProduct, setSelectedImportProduct] = useState<ImportableProduct | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  
  // Etsy-style details
  const [whoMadeIt, setWhoMadeIt] = useState("i_did");
  const [whatIsIt, setWhatIsIt] = useState("finished_product");
  const [whenMade, setWhenMade] = useState("made_to_order");
  const [materials, setMaterials] = useState("");
  
  // Category
  const [sourceCategory, setSourceCategory] = useState("");
  const [sourceCategoryPath, setSourceCategoryPath] = useState("");
  
  // Variations
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([
    { id: "color", name: "Primary color", values: [] },
    { id: "size", name: "Size", values: [] },
  ]);
  const [newColorOption, setNewColorOption] = useState("");
  const [newSizeOption, setNewSizeOption] = useState("");
  const [colorError, setColorError] = useState("");
  const [sizeError, setSizeError] = useState("");
  
  // Variant combinations (matrix)
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  
  // Personalization
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationInstructions, setPersonalizationInstructions] = useState("");
  
  // Shipping
  const [shippingProfile, setShippingProfile] = useState("");

  const maxTitleLength = 140;
  const maxTagCount = 13;

  // Load shop connections
  useEffect(() => {
    const loadConnections = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('shop_connections')
        .select('id, platform, shop_name, is_connected')
        .eq('user_id', user.id)
        .eq('is_connected', true);
      
      if (data) {
        setConnections(data);
        if (data.length > 0) {
          setSelectedConnection(data[0]);
        }
      }
    };
    
    loadConnections();
  }, [user]);

  // Load products when connection is selected
  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedConnection || !user) return;
      
      setIsLoadingProducts(true);
      try {
        // Load products from marketplace_listings that came from this platform
        const { data } = await supabase
          .from('marketplace_listings')
          .select('id, title, price, marketplace_data')
          .eq('user_id', user.id)
          .eq('platform', selectedConnection.platform)
          .order('title', { ascending: true });
        
        if (data) {
          setConnectionProducts(data.map(p => {
            const marketplaceData = p.marketplace_data as Record<string, any> || {};
            return {
              id: p.id,
              title: p.title,
              price: p.price || 0,
              images: marketplaceData.images || [],
              sku: marketplaceData.sku || null,
              brand: marketplaceData.brand || null,
              description: marketplaceData.description || null,
              category_path: marketplaceData.category_path,
            };
          }));
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, [selectedConnection, user]);

  // Load existing listing if editing
  useEffect(() => {
    if (listingId && masterListings) {
      const listing = masterListings.find(l => l.id === listingId);
      if (listing) {
        setTitle(listing.title);
        setDescription(listing.description || '');
        setPrice(listing.base_price?.toString() || '');
        setQuantity(listing.total_stock?.toString() || '0');
        setSku(listing.internal_sku || '');
        setBrand(listing.brand || '');
        setImages(listing.images?.map(img => img.url) || []);
        setTags(listing.tags || []);
        setMaterials(listing.materials || '');
        setWhoMadeIt(listing.who_made_it || 'i_did');
        setWhatIsIt(listing.what_is_it || 'finished_product');
        setWhenMade(listing.when_made || 'made_to_order');
        setSourceCategory(listing.source_category_id || '');
        setSourceCategoryPath(listing.source_category_path || '');
        setPersonalizationEnabled(listing.personalization_enabled || false);
        setPersonalizationInstructions(listing.personalization_instructions || '');
      }
    }
  }, [listingId, masterListings]);

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

  // Generate variant combinations when variant types change
  useEffect(() => {
    const colors = variantTypes.find(vt => vt.id === 'color')?.values || [];
    const sizes = variantTypes.find(vt => vt.id === 'size')?.values || [];
    
    if (colors.length === 0 && sizes.length === 0) {
      setVariantCombinations([]);
      return;
    }
    
    const newCombinations: VariantCombination[] = [];
    
    // If only colors
    if (colors.length > 0 && sizes.length === 0) {
      colors.forEach(color => {
        const existingCombo = variantCombinations.find(
          vc => vc.colorId === color.id && vc.sizeId === ''
        );
        newCombinations.push({
          id: `${color.id}`,
          colorId: color.id,
          colorName: color.name,
          sizeId: '',
          sizeName: '',
          price: existingCombo?.price || price,
          quantity: existingCombo?.quantity || '1',
          sku: existingCombo?.sku || '',
          isVisible: existingCombo?.isVisible ?? true,
          photos: existingCombo?.photos || [],
        });
      });
    }
    // If only sizes
    else if (sizes.length > 0 && colors.length === 0) {
      sizes.forEach(size => {
        const existingCombo = variantCombinations.find(
          vc => vc.sizeId === size.id && vc.colorId === ''
        );
        newCombinations.push({
          id: `${size.id}`,
          colorId: '',
          colorName: '',
          sizeId: size.id,
          sizeName: size.name,
          price: existingCombo?.price || price,
          quantity: existingCombo?.quantity || '1',
          sku: existingCombo?.sku || '',
          isVisible: existingCombo?.isVisible ?? true,
          photos: existingCombo?.photos || [],
        });
      });
    }
    // Both colors and sizes - create combinations
    else {
      colors.forEach(color => {
        sizes.forEach(size => {
          const existingCombo = variantCombinations.find(
            vc => vc.colorId === color.id && vc.sizeId === size.id
          );
          newCombinations.push({
            id: `${color.id}-${size.id}`,
            colorId: color.id,
            colorName: color.name,
            sizeId: size.id,
            sizeName: size.name,
            price: existingCombo?.price || price,
            quantity: existingCombo?.quantity || '1',
            sku: existingCombo?.sku || '',
            isVisible: existingCombo?.isVisible ?? true,
            photos: existingCombo?.photos || [],
          });
        });
      });
    }
    
    setVariantCombinations(newCombinations);
  }, [variantTypes]);

  // Update a specific variant combination field
  const updateVariantCombination = (id: string, field: keyof VariantCombination, value: string | boolean | string[]) => {
    setVariantCombinations(prev => prev.map(vc => 
      vc.id === id ? { ...vc, [field]: value } : vc
    ));
  };

  // Bulk update all combinations for a field
  const bulkUpdateField = (field: 'price' | 'quantity' | 'sku' | 'isVisible', value: string | boolean) => {
    setVariantCombinations(prev => prev.map(vc => ({ ...vc, [field]: value })));
  };

  // Import product to form
  const handleImportProduct = (product: ImportableProduct) => {
    setSelectedImportProduct(product);
    setShowImportDialog(true);
  };

  const confirmImport = () => {
    if (!selectedImportProduct) return;
    
    setTitle(selectedImportProduct.title);
    setDescription(selectedImportProduct.description || '');
    setPrice(selectedImportProduct.price?.toString() || '');
    setSku(selectedImportProduct.sku || '');
    setBrand(selectedImportProduct.brand || '');
    setImages(selectedImportProduct.images || []);
    setSourceCategoryPath(selectedImportProduct.category_path || '');
    
    setShowImportDialog(false);
    setSelectedImportProduct(null);
    toast.success(`"${selectedImportProduct.title}" imported`);
  };

  // Handle save
  const handleSave = async () => {
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
        base_price: parseFloat(price) || 0,
        total_stock: parseInt(quantity) || 0,
        internal_sku: sku,
        brand,
        tags,
        materials,
        who_made_it: whoMadeIt,
        what_is_it: whatIsIt,
        when_made: whenMade,
        source_marketplace: selectedConnection?.platform,
        source_category_path: sourceCategoryPath,
        personalization_enabled: personalizationEnabled,
        personalization_instructions: personalizationInstructions,
        variant_options: {
          color: variantTypes.find(vt => vt.id === 'color')?.values || [],
          size: variantTypes.find(vt => vt.id === 'size')?.values || [],
        },
      };

      if (listingId) {
        await updateMasterListing.mutateAsync({ id: listingId, ...listingData });
      } else {
        const result = await createMasterListing.mutateAsync(listingData);
        // Add images
        for (const imageUrl of images) {
          await addImage.mutateAsync({ masterListingId: result.id, url: imageUrl });
        }
      }

      toast.success("Master listing saved!");
      navigate("/master-listings");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error saving listing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {listingId ? "Edit Master Listing" : "Create Master Listing"}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar with sections */}
          <div className="w-48 border-r bg-card p-4">
            <div className="space-y-1">
              {mainSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
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
                  <p className="text-sm text-muted-foreground">Add a video to showcase your product</p>
                </div>
              </section>

              {/* Listing Details Section */}
              <section ref={(el) => (sectionRefs.current["listing-details"] = el)}>
                <h2 className="text-lg font-semibold mb-4">Listing details</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                      placeholder="Enter title"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {maxTitleLength - title.length} characters remaining
                    </p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your item"
                      className="mt-1"
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1 mb-2">
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
                  </div>
                </div>
              </section>

              {/* Inventory & Pricing Section */}
              <section ref={(el) => (sectionRefs.current["inventory"] = el)}>
                <h2 className="text-lg font-semibold mb-4">Inventory & pricing</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
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
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Stock code"
                      className="mt-1"
                    />
                  </div>
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

              {/* Returns Section */}
              <section ref={(el) => (sectionRefs.current["returns"] = el)}>
                <h2 className="text-lg font-semibold mb-4">Returns & exchanges</h2>
                <p className="text-sm text-muted-foreground">
                  Configure your return and exchange policy
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Product</DialogTitle>
            <DialogDescription>
              This will import the product data into your form.
            </DialogDescription>
          </DialogHeader>
          {selectedImportProduct && (
            <div className="py-4">
              <p className="font-medium">{selectedImportProduct.title}</p>
              <p className="text-sm text-muted-foreground">
                Price: ${selectedImportProduct.price}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
