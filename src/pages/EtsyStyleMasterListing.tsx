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

interface MarketplaceConnection {
  id: string;
  marketplace: string;
  store_name: string | null;
  is_active: boolean;
}

interface ImportableProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
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
  
  // Marketplace connections
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<MarketplaceConnection | null>(null);
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

  // Load marketplace connections
  useEffect(() => {
    const loadConnections = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('marketplace_connections')
        .select('id, marketplace, store_name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
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
        // Load products from our products table that came from this marketplace
        const { data } = await supabase
          .from('products')
          .select('id, title, price, stock, images, sku, brand, description')
          .eq('user_id', user.id)
          .eq('source', selectedConnection.marketplace)
          .order('title', { ascending: true });
        
        if (data) {
          setConnectionProducts(data.map(p => ({
            ...p,
            images: p.images || [],
          })));
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
    setQuantity(selectedImportProduct.stock?.toString() || '0');
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
        source_marketplace: selectedConnection?.marketplace,
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

  const filteredProducts = connectionProducts.filter(p => 
    p.title.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const getMarketplaceLogo = (marketplace: string) => {
    const logos: Record<string, string> = {
      'ikas': 'I',
      'trendyol': 'T',
      'hepsiburada': 'H',
      'amazon': 'A',
      'n11': 'N',
      'ciceksepeti': 'C',
    };
    return logos[marketplace] || marketplace[0].toUpperCase();
  };

  const getMarketplaceColor = (marketplace: string) => {
    const colors: Record<string, string> = {
      'ikas': 'bg-blue-500',
      'trendyol': 'bg-orange-500',
      'hepsiburada': 'bg-orange-600',
      'amazon': 'bg-amber-500',
      'n11': 'bg-purple-500',
      'ciceksepeti': 'bg-pink-500',
    };
    return colors[marketplace] || 'bg-primary';
  };

  return (
    <Layout>
      <div className="h-full flex">
        {/* Left Sidebar - Marketplace Sources */}
        <div className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Source Marketplace</h3>
            <p className="text-xs text-muted-foreground">Import products from connected stores</p>
          </div>
          
          <div className="p-3 space-y-1">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => setSelectedConnection(conn)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                  selectedConnection?.id === conn.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                  getMarketplaceColor(conn.marketplace)
                )}>
                  {getMarketplaceLogo(conn.marketplace)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conn.store_name || conn.marketplace}</p>
                  <p className="text-xs text-muted-foreground capitalize">{conn.marketplace}</p>
                </div>
              </button>
            ))}
            
            {connections.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No connected stores</p>
                <Button variant="link" size="sm" onClick={() => navigate('/connections')}>
                  Connect a store
                </Button>
              </div>
            )}
          </div>
          
          {/* Products from selected marketplace */}
          {selectedConnection && (
            <div className="flex-1 flex flex-col border-t border-border">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleImportProduct(product)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left group"
                      >
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt="" 
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            ₺{product.price} • Stok: {product.stock}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Tab Bar */}
          <div className="border-b border-border bg-background sticky top-0 z-20">
            <div className="flex items-center overflow-x-auto">
              {mainSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                    activeSection === section.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <ScrollArea className="flex-1" ref={contentRef}>
            <div className="max-w-4xl mx-auto p-6 space-y-8">
              
              {/* Photos Section */}
              <section ref={(el) => { if (el) sectionRefs.current['photos'] = el; }} id="photos">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Photos</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add up to 10 photos. Tips: Use natural light and no flash.
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg border-2 border-border overflow-hidden relative group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>
                        )}
                      </div>
                    ))}
                    {[...Array(Math.max(0, 10 - images.length))].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                        <Plus className="h-6 w-6" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Video Section */}
              <section ref={(el) => { if (el) sectionRefs.current['video'] = el; }} id="video">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Video</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                      <Video className="h-8 w-8 mb-2" />
                      <span className="text-xs">Add video</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Or paste a video URL..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Listing Details Section */}
              <section ref={(el) => { if (el) sectionRefs.current['listing-details'] = el; }} id="listing-details">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold">Listing details</h2>
                  
                  {/* Title */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                      placeholder="What are you selling?"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {maxTitleLength - title.length} characters remaining
                    </p>
                  </div>
                  
                  {/* Source Category Display */}
                  {sourceCategoryPath && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Source Category</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{sourceCategoryPath}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* About this listing */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Who made it?</Label>
                      <Select value={whoMadeIt} onValueChange={setWhoMadeIt}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="i_did">I did</SelectItem>
                          <SelectItem value="collective">A member of my shop</SelectItem>
                          <SelectItem value="another_company">Another company or person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">What is it?</Label>
                      <Select value={whatIsIt} onValueChange={setWhatIsIt}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="finished_product">A finished product</SelectItem>
                          <SelectItem value="supply_tool">A supply or tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">When was it made?</Label>
                      <Select value={whenMade} onValueChange={setWhenMade}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="made_to_order">Made to order</SelectItem>
                          <SelectItem value="2020_2024">2020-2024</SelectItem>
                          <SelectItem value="2010_2019">2010-2019</SelectItem>
                          <SelectItem value="before_2010">Before 2010</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell the story of this item..."
                      className="mt-1 min-h-32"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Tags</Label>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add a tag and press Enter"
                      className="mt-1"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(i)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {maxTagCount - tags.length} tags remaining
                    </p>
                  </div>

                  {/* Materials */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Materials</Label>
                    <Input
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="e.g. Cotton, polyester, metal"
                      className="mt-1"
                    />
                  </div>
                </div>
              </section>

              {/* Inventory & Pricing Section */}
              <section ref={(el) => { if (el) sectionRefs.current['inventory'] = el; }} id="inventory">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold">Inventory & pricing</h2>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Price (₺)</Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Quantity</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">SKU</Label>
                      <Input
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Internal SKU"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Variations Section */}
              <section ref={(el) => { if (el) sectionRefs.current['variations'] = el; }} id="variations">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Variations</h2>
                  
                  {/* Sub-tabs */}
                  <div className="border-b border-border mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        {variationSubTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveVariationTab(tab.id)}
                            className={cn(
                              "px-4 py-2 text-sm font-medium border-b-2 transition-all",
                              activeVariationTab === tab.id
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowAllVariations(!showAllVariations)}
                        className="text-primary"
                      >
                        {showAllVariations ? "Show less" : "Show all"}
                        <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", showAllVariations && "rotate-180")} />
                      </Button>
                    </div>
                  </div>

                  {/* Variations Content */}
                  {activeVariationTab === "variations" && (
                    <div className="grid grid-cols-2 gap-8">
                      {/* Primary Color Column */}
                      <div className="space-y-0">
                        <div className="py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                          Primary color
                        </div>
                        {variantTypes.find(vt => vt.id === 'color')?.values.map((option) => (
                          <div key={option.id} className="flex items-center gap-3 py-3 border-b border-border group">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-move flex-shrink-0" />
                            <span className="text-sm flex-1">{option.name}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeVariantOption('color', option.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                        <div className="py-3 space-y-2">
                          <div className="flex gap-2">
                            <Input 
                              value={newColorOption}
                              onChange={(e) => { setNewColorOption(e.target.value); setColorError(""); }}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddColorOption()}
                              placeholder="Add option"
                              className={cn("flex-1", colorError && "border-destructive")}
                            />
                            <Button onClick={handleAddColorOption} size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          {colorError && <p className="text-destructive text-sm">{colorError}</p>}
                        </div>
                      </div>
                      
                      {/* Size Column */}
                      <div className="space-y-0">
                        <div className="py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                          Size
                        </div>
                        {variantTypes.find(vt => vt.id === 'size')?.values.map((option) => (
                          <div key={option.id} className="flex items-center gap-3 py-3 border-b border-border group">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-move flex-shrink-0" />
                            <span className="text-sm flex-1">{option.name}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeVariantOption('size', option.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                        <div className="py-3 space-y-2">
                          <div className="flex gap-2">
                            <Input 
                              value={newSizeOption}
                              onChange={(e) => { setNewSizeOption(e.target.value); setSizeError(""); }}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddSizeOption()}
                              placeholder="Add option"
                              className={cn("flex-1", sizeError && "border-destructive")}
                            />
                            <Button onClick={handleAddSizeOption} size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          {sizeError && <p className="text-destructive text-sm">{sizeError}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Tab */}
                  {activeVariationTab === "price" && (
                    <div className="space-y-4">
                      {variantCombinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Add color or size options first to set prices
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-sm text-muted-foreground">Apply to all:</span>
                            <Input
                              type="number"
                              placeholder="Enter price"
                              className="w-32"
                              onBlur={(e) => e.target.value && bulkUpdateField('price', e.target.value)}
                            />
                            <Button variant="outline" size="sm" onClick={() => bulkUpdateField('price', price)}>
                              Use base price (₺{price || '0'})
                            </Button>
                          </div>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  {variantTypes.find(vt => vt.id === 'color')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Color</th>
                                  )}
                                  {variantTypes.find(vt => vt.id === 'size')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price (₺)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(showAllVariations ? variantCombinations : variantCombinations.slice(0, 5)).map((combo) => (
                                  <tr key={combo.id} className="border-t border-border">
                                    {combo.colorName && (
                                      <td className="px-4 py-3 text-sm">{combo.colorName}</td>
                                    )}
                                    {combo.sizeName && (
                                      <td className="px-4 py-3 text-sm">{combo.sizeName}</td>
                                    )}
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        value={combo.price}
                                        onChange={(e) => updateVariantCombination(combo.id, 'price', e.target.value)}
                                        className="w-28 h-8"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Quantity Tab */}
                  {activeVariationTab === "quantity" && (
                    <div className="space-y-4">
                      {variantCombinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Add color or size options first to set quantities
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-sm text-muted-foreground">Apply to all:</span>
                            <Input
                              type="number"
                              placeholder="Enter quantity"
                              className="w-32"
                              onBlur={(e) => e.target.value && bulkUpdateField('quantity', e.target.value)}
                            />
                          </div>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  {variantTypes.find(vt => vt.id === 'color')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Color</th>
                                  )}
                                  {variantTypes.find(vt => vt.id === 'size')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(showAllVariations ? variantCombinations : variantCombinations.slice(0, 5)).map((combo) => (
                                  <tr key={combo.id} className="border-t border-border">
                                    {combo.colorName && (
                                      <td className="px-4 py-3 text-sm">{combo.colorName}</td>
                                    )}
                                    {combo.sizeName && (
                                      <td className="px-4 py-3 text-sm">{combo.sizeName}</td>
                                    )}
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        value={combo.quantity}
                                        onChange={(e) => updateVariantCombination(combo.id, 'quantity', e.target.value)}
                                        className="w-28 h-8"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* SKU Tab */}
                  {activeVariationTab === "sku" && (
                    <div className="space-y-4">
                      {variantCombinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Add color or size options first to set SKUs
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-sm text-muted-foreground">SKU prefix:</span>
                            <Input
                              placeholder="e.g. PROD-001"
                              className="w-40"
                              defaultValue={sku}
                              onBlur={(e) => {
                                const prefix = e.target.value;
                                if (prefix) {
                                  setVariantCombinations(prev => prev.map((vc, i) => ({
                                    ...vc,
                                    sku: `${prefix}-${String(i + 1).padStart(3, '0')}`
                                  })));
                                }
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setVariantCombinations(prev => prev.map((vc, i) => ({
                                  ...vc,
                                  sku: `${sku || 'SKU'}-${vc.colorName ? vc.colorName.substring(0, 3).toUpperCase() : ''}${vc.sizeName ? '-' + vc.sizeName.toUpperCase() : ''}`
                                })));
                              }}
                            >
                              Auto-generate
                            </Button>
                          </div>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  {variantTypes.find(vt => vt.id === 'color')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Color</th>
                                  )}
                                  {variantTypes.find(vt => vt.id === 'size')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(showAllVariations ? variantCombinations : variantCombinations.slice(0, 5)).map((combo) => (
                                  <tr key={combo.id} className="border-t border-border">
                                    {combo.colorName && (
                                      <td className="px-4 py-3 text-sm">{combo.colorName}</td>
                                    )}
                                    {combo.sizeName && (
                                      <td className="px-4 py-3 text-sm">{combo.sizeName}</td>
                                    )}
                                    <td className="px-4 py-3">
                                      <Input
                                        value={combo.sku}
                                        onChange={(e) => updateVariantCombination(combo.id, 'sku', e.target.value)}
                                        className="w-40 h-8"
                                        placeholder="Enter SKU"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Visibility Tab */}
                  {activeVariationTab === "visibility" && (
                    <div className="space-y-4">
                      {variantCombinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Add color or size options first to set visibility
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <Button variant="outline" size="sm" onClick={() => bulkUpdateField('isVisible', true)}>
                              <Check className="h-4 w-4 mr-1" />
                              Show all
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => bulkUpdateField('isVisible', false)}>
                              <X className="h-4 w-4 mr-1" />
                              Hide all
                            </Button>
                          </div>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  {variantTypes.find(vt => vt.id === 'color')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Color</th>
                                  )}
                                  {variantTypes.find(vt => vt.id === 'size')?.values.length > 0 && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Visible</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(showAllVariations ? variantCombinations : variantCombinations.slice(0, 5)).map((combo) => (
                                  <tr key={combo.id} className="border-t border-border">
                                    {combo.colorName && (
                                      <td className="px-4 py-3 text-sm">{combo.colorName}</td>
                                    )}
                                    {combo.sizeName && (
                                      <td className="px-4 py-3 text-sm">{combo.sizeName}</td>
                                    )}
                                    <td className="px-4 py-3">
                                      <Switch
                                        checked={combo.isVisible}
                                        onCheckedChange={(checked) => updateVariantCombination(combo.id, 'isVisible', checked)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Photos Tab */}
                  {activeVariationTab === "photos" && (
                    <div className="space-y-4">
                      {variantCombinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Add color or size options first to assign photos
                        </p>
                      ) : (
                        <div className="grid gap-4">
                          {(showAllVariations ? variantCombinations : variantCombinations.slice(0, 5)).map((combo) => (
                            <div key={combo.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                              <div className="min-w-32">
                                <p className="text-sm font-medium">
                                  {[combo.colorName, combo.sizeName].filter(Boolean).join(' / ')}
                                </p>
                              </div>
                              <div className="flex-1 flex items-center gap-2 flex-wrap">
                                {combo.photos.map((photo, i) => (
                                  <div key={i} className="w-16 h-16 rounded border border-border overflow-hidden relative group">
                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => {
                                        const newPhotos = combo.photos.filter((_, idx) => idx !== i);
                                        updateVariantCombination(combo.id, 'photos', newPhotos);
                                      }}
                                      className="absolute inset-0 bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-4 w-4 text-destructive-foreground" />
                                    </button>
                                  </div>
                                ))}
                                {images.length > 0 ? (
                                  <div className="relative">
                                    <Select
                                      onValueChange={(url) => {
                                        if (!combo.photos.includes(url)) {
                                          updateVariantCombination(combo.id, 'photos', [...combo.photos, url]);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-16 h-16 border-dashed">
                                        <Plus className="h-4 w-4" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {images.map((img, i) => (
                                          <SelectItem key={i} value={img}>
                                            <div className="flex items-center gap-2">
                                              <img src={img} alt="" className="w-8 h-8 object-cover rounded" />
                                              <span>Photo {i + 1}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                                    <Image className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing Tab */}
                  {activeVariationTab === "processing" && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Processing time settings coming soon</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Shipping Section */}
              <section ref={(el) => { if (el) sectionRefs.current['shipping'] = el; }} id="shipping">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Shipping</h2>
                  <Select value={shippingProfile} onValueChange={setShippingProfile}>
                    <SelectTrigger><SelectValue placeholder="Choose shipping profile" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Shipping</SelectItem>
                      <SelectItem value="express">Express Shipping</SelectItem>
                      <SelectItem value="free">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* Returns Section */}
              <section ref={(el) => { if (el) sectionRefs.current['returns'] = el; }} id="returns">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Returns & exchanges</h2>
                  <label className="flex items-center gap-3">
                    <Switch
                      checked={personalizationEnabled}
                      onCheckedChange={setPersonalizationEnabled}
                    />
                    <span className="text-sm">Accept returns and exchanges</span>
                  </label>
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate("/master-listings")}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Master Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Product</DialogTitle>
            <DialogDescription>
              This will replace current form data with the selected product.
            </DialogDescription>
          </DialogHeader>
          {selectedImportProduct && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {selectedImportProduct.images[0] ? (
                <img src={selectedImportProduct.images[0]} alt="" className="w-16 h-16 rounded object-cover" />
              ) : (
                <div className="w-16 h-16 rounded bg-muted-foreground/20 flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{selectedImportProduct.title}</p>
                <p className="text-sm text-muted-foreground">
                  ₺{selectedImportProduct.price} • Stock: {selectedImportProduct.stock}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
