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

interface ConnectedShop {
  id: string;
  name: string;
  marketplace: string;
  logo?: string;
}

interface IkasProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[] | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  sku: string | null;
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
  const [connectedShops, setConnectedShops] = useState<ConnectedShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<ConnectedShop | null>(null);
  
  // iKas Products
  const [ikasProducts, setIkasProducts] = useState<IkasProduct[]>([]);
  const [selectedIkasProduct, setSelectedIkasProduct] = useState<string>("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
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
  
  // Category cascade
  const [categoryLevel1, setCategoryLevel1] = useState("");
  const [categoryLevel2, setCategoryLevel2] = useState("");
  const [categoryLevel3, setCategoryLevel3] = useState("");
  const [categoryLevel4, setCategoryLevel4] = useState("");
  
  // Variations
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([
    { id: "color", name: "Primary color", values: [] },
    { id: "size", name: "size", values: [] },
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [individualPrice, setIndividualPrice] = useState(false);
  const [individualQuantity, setIndividualQuantity] = useState(false);
  
  // New option inputs for variations
  const [newColorOption, setNewColorOption] = useState("");
  const [newSizeOption, setNewSizeOption] = useState("");
  const [colorError, setColorError] = useState("");
  const [sizeError, setSizeError] = useState("");
  
  // Renewal options
  const [renewalOption, setRenewalOption] = useState<"automatic" | "manual">("automatic");
  
  // Personalization
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationInstructions, setPersonalizationInstructions] = useState("");
  
  // Shipping
  const [shippingProfile, setShippingProfile] = useState("");
  
  const maxTitleLength = 140;
  const maxTagCount = 13;

  // Load connected shops and iKas products
  useEffect(() => {
    const loadShopsAndProducts = async () => {
      if (!user) return;
      
      // Load connected shops
      const { data: shopsData } = await supabase
        .from('marketplace_connections')
        .select('id, marketplace, store_name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (shopsData) {
        const shops = shopsData.map(conn => ({
          id: conn.id,
          name: conn.store_name || conn.marketplace,
          marketplace: conn.marketplace,
        }));
        setConnectedShops(shops);
        if (shops.length > 0) {
          setSelectedShop(shops[0]);
        }
      }
      
      // Load iKas synced products
      setIsLoadingProducts(true);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, title, description, price, stock, images, brand, color, size, sku')
        .eq('user_id', user.id)
        .eq('source', 'ikas')
        .order('title', { ascending: true });
      
      if (productsData) {
        setIkasProducts(productsData as IkasProduct[]);
      }
      setIsLoadingProducts(false);
    };
    
    loadShopsAndProducts();
  }, [user]);

  // Load selected iKas product data into form
  const loadIkasProductToForm = (productId: string) => {
    const product = ikasProducts.find(p => p.id === productId);
    if (!product) return;
    
    setSelectedIkasProduct(productId);
    setTitle(product.title || '');
    setDescription(product.description || '');
    setPrice(product.price?.toString() || '');
    setQuantity(product.stock?.toString() || '0');
    setImages(product.images || []);
    setPrimaryColor(product.color || '');
    
    // Generate variants from product data
    const productVariants: Variant[] = [];
    if (product.size) {
      const sizes = product.size.split(',').map(s => s.trim());
      sizes.forEach((size, idx) => {
        productVariants.push({
          id: `var-${idx}`,
          name: `${product.title} - ${size}`,
          price: product.price || 0,
          stock: Math.floor((product.stock || 0) / sizes.length),
          isActive: true,
          images: product.images || [],
          size: size,
          sku: product.sku || undefined,
        });
      });
    }
    
    if (productVariants.length > 0) {
      setVariants(productVariants);
    }
    
    toast.success(`"${product.title}" yüklendi`);
  };

  // Load product data if editing via URL param
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId || !user) return;
      
      setIsLoading(true);
      try {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (product) {
          setTitle(product.title || '');
          setDescription(product.description || '');
          setPrice(product.price?.toString() || '');
          setQuantity(product.stock?.toString() || '0');
          setImages(product.images || []);
          setPrimaryColor(product.color || '');
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

  // Handle variant visibility toggle
  const toggleVariantVisibility = (variantId: string) => {
    setVariants(variants.map(v => 
      v.id === variantId ? { ...v, isActive: !v.isActive } : v
    ));
  };

  // Handle variant price change
  const updateVariantPrice = (variantId: string, newPrice: string) => {
    setVariants(variants.map(v => 
      v.id === variantId ? { ...v, price: parseFloat(newPrice) || 0 } : v
    ));
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
    
    // Generate variants when we have values in both types
    generateVariants();
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
    
    // Generate variants when we have values in both types
    generateVariants();
  };

  // Remove variant option
  const removeVariantOption = (typeId: string, valueId: string) => {
    setVariantTypes(prev => prev.map(vt => 
      vt.id === typeId 
        ? { ...vt, values: vt.values.filter(v => v.id !== valueId) }
        : vt
    ));
    // Regenerate variants after removal
    setTimeout(generateVariants, 0);
  };

  // Generate variant combinations from variantTypes
  const generateVariants = () => {
    const colorType = variantTypes.find(vt => vt.id === 'color');
    const sizeType = variantTypes.find(vt => vt.id === 'size');
    
    const colors = colorType?.values || [];
    const sizes = sizeType?.values || [];
    
    const newVariants: Variant[] = [];
    
    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(color => {
        sizes.forEach(size => {
          newVariants.push({
            id: `${color.id}-${size.id}`,
            name: color.name,
            size: size.name,
            price: parseFloat(price) || 0,
            stock: parseInt(quantity) || 0,
            isActive: true,
            images: [],
            colorCode: color.colorCode,
          });
        });
      });
    } else if (colors.length > 0) {
      colors.forEach(color => {
        newVariants.push({
          id: color.id,
          name: color.name,
          price: parseFloat(price) || 0,
          stock: parseInt(quantity) || 0,
          isActive: true,
          images: [],
          colorCode: color.colorCode,
        });
      });
    } else if (sizes.length > 0) {
      sizes.forEach(size => {
        newVariants.push({
          id: size.id,
          name: title || 'Product',
          size: size.name,
          price: parseFloat(price) || 0,
          stock: parseInt(quantity) || 0,
          isActive: true,
          images: [],
        });
      });
    }
    
    setVariants(newVariants);
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
      const productData = {
        title,
        description,
        price: parseFloat(price) || 0,
        stock: parseInt(quantity) || 0,
        status: "active",
        source: selectedShop?.marketplace || "manual",
        user_id: user.id,
        images,
      };

      if (productId) {
        await supabase
          .from("products")
          .update(productData)
          .eq('id', productId)
          .eq('user_id', user.id);
      } else {
        await supabase.from("products").insert(productData);
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
    toast.success("Saved as draft");
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
      <div className="h-full flex">
        {/* Left Sidebar - Connected Shops */}
        <div className="w-56 border-r border-border bg-card flex-shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Connected shops
            </h3>
            <div className="space-y-2">
              {connectedShops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShop(shop)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    selectedShop?.id === shop.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {shop.marketplace === 'etsy' ? 'E' : shop.marketplace[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium truncate">{shop.name}</span>
                </button>
              ))}
              {connectedShops.length === 0 && (
                <p className="text-sm text-muted-foreground">No connected shops</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Tab Bar */}
          <div className="border-b border-border bg-background sticky top-0 z-20">
            {/* Section Tabs */}
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
                  {section.id === "variations" && variants.some(v => !v.isActive) && (
                    <span className="w-2 h-2 bg-primary rounded-full inline-block mr-1.5"></span>
                  )}
                  {section.label}
                  {section.id === "shipping" && (
                    <span className="w-2 h-2 bg-destructive rounded-full inline-block ml-1.5"></span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Profile Bar - Green Banner with iKas Product Selector */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* iKas Product Selector */}
                <Select 
                  value={selectedIkasProduct} 
                  onValueChange={loadIkasProductToForm}
                >
                  <SelectTrigger className="w-72 bg-background">
                    {isLoadingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Image className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <SelectValue placeholder="iKas ürün seçin..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {ikasProducts.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        {isLoadingProducts ? 'Yükleniyor...' : 'Senkronize edilmiş ürün yok'}
                      </div>
                    ) : (
                      ikasProducts.map((product) => (
                        <SelectItem 
                          key={product.id} 
                          value={product.id}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {product.images?.[0] && (
                              <img 
                                src={product.images[0]} 
                                alt="" 
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="truncate max-w-[200px]">{product.title}</span>
                              <span className="text-xs text-muted-foreground">
                                Stok: {product.stock} | {product.price > 0 ? `₺${product.price}` : 'Fiyat yok'}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="w-48 bg-background">
                    <Settings2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Choose Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front-back">Front-Back View Pri...</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Revert
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{ikasProducts.length} iKas ürün</span>
                <Button variant="link" size="sm" className="text-primary">
                  Show <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea ref={contentRef} className="flex-1">
            <div className="max-w-4xl mx-auto p-6 space-y-8 pb-24">
              
              {/* Photos Section */}
              <section ref={(el) => { if (el) sectionRefs.current['photos'] = el; }} id="photos">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Photos</h2>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <button className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Add photo</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Video Section */}
              <section ref={(el) => { if (el) sectionRefs.current['video'] = el; }} id="video">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Video</h2>
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <Video className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Add a video URL</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Title Section */}
              <section ref={(el) => { if (el) sectionRefs.current['title'] = el; }} id="title">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Title</h2>
                    <Badge variant="outline" className="text-xs">NA</Badge>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                    placeholder="Title"
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {maxTitleLength - title.length} characters remaining
                  </p>
                </div>
              </section>

              {/* Description Section */}
              <section ref={(el) => { if (el) sectionRefs.current['description'] = el; }} id="description">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Description</h2>
                    <Badge variant="outline" className="text-xs">NA</Badge>
                  </div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="min-h-[150px]"
                  />
                </div>
              </section>

              {/* Tags Section */}
              <section ref={(el) => { if (el) sectionRefs.current['tags'] = el; }} id="tags">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Tags</h2>
                    <Badge variant="outline" className="text-xs">NA</Badge>
                  </div>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Tags"
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground mb-3">
                    {maxTagCount - tags.length} remaining
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(i)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Details Section */}
              <section ref={(el) => { if (el) sectionRefs.current['details'] = el; }} id="details">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold">Details</h2>
                  
                  {/* Type */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setProductType("physical")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          productType === "physical"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            productType === "physical" ? "border-primary" : "border-muted-foreground"
                          )}>
                            {productType === "physical" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Physical</p>
                            <p className="text-sm text-muted-foreground">A tangible item that you will ship to buyers.</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setProductType("digital")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          productType === "digital"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            productType === "digital" ? "border-primary" : "border-muted-foreground"
                          )}>
                            {productType === "digital" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Digital</p>
                            <p className="text-sm text-muted-foreground">A digital file that buyers will download.</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Who/What/When */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Who made it?</Label>
                      <Select value={whoMadeIt} onValueChange={setWhoMadeIt}>
                        <SelectTrigger><SelectValue placeholder="Who made it?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="i-did">I did</SelectItem>
                          <SelectItem value="collective">A member of my shop</SelectItem>
                          <SelectItem value="other">Another company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">What is it?</Label>
                      <Select value={whatIsIt} onValueChange={setWhatIsIt}>
                        <SelectTrigger><SelectValue placeholder="What is it?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="finished">A finished product</SelectItem>
                          <SelectItem value="supply">A supply or tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">When was it made?</Label>
                      <Select value={whenMade} onValueChange={setWhenMade}>
                        <SelectTrigger><SelectValue placeholder="When was it made?" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="made-to-order">Made to order</SelectItem>
                          <SelectItem value="2020s">2020-2029</SelectItem>
                          <SelectItem value="2010s">2010-2019</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Production partner */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Production partner <span className="text-muted-foreground">Optional</span></Label>
                    <Input
                      value={productionPartner}
                      onChange={(e) => setProductionPartner(e.target.value)}
                      placeholder="Choose Production partner"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Choose Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="home">Home & Living</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primary/Secondary color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Primary color <span className="text-muted-foreground">Optional</span></Label>
                      <Select value={primaryColor} onValueChange={setPrimaryColor}>
                        <SelectTrigger><SelectValue placeholder="Choose Primary color" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Secondary color <span className="text-muted-foreground">Optional</span></Label>
                      <Select value={secondaryColor} onValueChange={setSecondaryColor}>
                        <SelectTrigger><SelectValue placeholder="Choose Secondary color" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Renewal options */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Renewal options</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setRenewalOption("automatic")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          renewalOption === "automatic"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            renewalOption === "automatic" ? "border-primary" : "border-muted-foreground"
                          )}>
                            {renewalOption === "automatic" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Automatic</p>
                            <p className="text-sm text-muted-foreground">This listing will renew as it expires for $0.20 USD each time (recommended).</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setRenewalOption("manual")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          renewalOption === "manual"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            renewalOption === "manual" ? "border-primary" : "border-muted-foreground"
                          )}>
                            {renewalOption === "manual" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Manual</p>
                            <p className="text-sm text-muted-foreground">I'll renew expired listings myself.</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Materials</Label>
                    <Input
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="Materials"
                    />
                    <p className="text-xs text-muted-foreground mt-1">13 remaining</p>
                  </div>
                </div>
              </section>

              {/* Price Section */}
              <section ref={(el) => { if (el) sectionRefs.current['price'] = el; }} id="price">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Price</h2>
                  <div>
                    <Label className="text-sm text-muted-foreground">Price</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </section>

              {/* Inventory Section */}
              <section ref={(el) => { if (el) sectionRefs.current['inventory'] = el; }} id="inventory">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Inventory</h2>
                  <div>
                    <Label className="text-sm text-muted-foreground">Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              {/* Variations Section */}
              <section ref={(el) => { if (el) sectionRefs.current['variations'] = el; }} id="variations">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Variations</h2>
                  
                  {/* Category Cascade Dropdowns */}
                  <div className="flex items-center gap-3 mb-6">
                    <Select value={categoryLevel1} onValueChange={setCategoryLevel1}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Clothing" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryLevel2} onValueChange={setCategoryLevel2}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Gender-Neutral Adult C..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gender-neutral">Gender-Neutral Adult C...</SelectItem>
                        <SelectItem value="men">Men's</SelectItem>
                        <SelectItem value="women">Women's</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryLevel3} onValueChange={setCategoryLevel3}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Hoodies & Sweatshirts" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="blazers">Blazers</SelectItem>
                        <SelectItem value="costumes">Costumes</SelectItem>
                        <SelectItem value="hoodies">Hoodies & Sweatshirts</SelectItem>
                        <SelectItem value="jackets">Jackets & Coats</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryLevel4} onValueChange={setCategoryLevel4}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t-shirts">T-shirts</SelectItem>
                        <SelectItem value="tops">Tops & Tees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                  {/* Variation Type Selectors */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Primary color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary-color">Primary color</SelectItem>
                          <SelectItem value="sizes">Sizes</SelectItem>
                          <SelectItem value="secondary-color">Secondary color</SelectItem>
                          <SelectItem value="diameter">Diameter</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="size">size</SelectItem>
                          <SelectItem value="length">length</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* Variations Content based on active tab */}
                  {activeVariationTab === "variations" && (
                    <div className="grid grid-cols-2 gap-8">
                      {/* Primary Color Column */}
                      <div className="space-y-0">
                        <div className="py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                          Primary color
                        </div>
                        {/* Color Options */}
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
                        {/* Add Color Input */}
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
                          size
                        </div>
                        {/* Size Options */}
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
                        {/* Add Size Input */}
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

                  {activeVariationTab === "price" && (
                    <div className="space-y-0">
                      {/* Price Header with Controls */}
                      <div className="grid grid-cols-2 gap-8 mb-4">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <Checkbox checked={individualPrice} onCheckedChange={(v) => setIndividualPrice(!!v)} />
                            <span className="text-sm">Individual price</span>
                          </label>
                          <Select defaultValue="increase">
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="increase">Increase by</SelectItem>
                              <SelectItem value="decrease">Decrease by</SelectItem>
                              <SelectItem value="set">Set to</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <Input type="number" defaultValue="0.00" className="w-16 h-8" />
                            <span className="text-sm text-muted-foreground">$</span>
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2">
                            <Checkbox />
                            <span className="text-sm">Individual price</span>
                          </label>
                        </div>
                      </div>
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_120px_1fr] gap-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <div>Primary color</div>
                        <div className="text-center">Price</div>
                        <div>size</div>
                      </div>
                      {/* Price Rows */}
                      {(showAllVariations ? variants : variants.slice(0, 8)).map((variant, i) => (
                        <div key={variant.id} className="grid grid-cols-[1fr_120px_1fr] gap-4 py-3 border-b border-border items-center">
                          <span className="text-sm">{variant.name}</span>
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariantPrice(variant.id, e.target.value)}
                            className="text-center h-9"
                          />
                          <span className="text-sm">{variant.size || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'][i % 7]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVariationTab === "quantity" && (
                    <div className="space-y-0">
                      {/* Quantity Header with Controls */}
                      <div className="grid grid-cols-2 gap-8 mb-4">
                        <div>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={individualQuantity} onCheckedChange={(v) => setIndividualQuantity(!!v)} />
                            <span className="text-sm">Individual quantity</span>
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2">
                            <Checkbox />
                            <span className="text-sm">Individual quantity</span>
                          </label>
                        </div>
                      </div>
                      {/* Header */}
                      <div className="grid grid-cols-2 gap-8 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <div>Primary color</div>
                        <div>size</div>
                      </div>
                      {(showAllVariations ? variants : variants.slice(0, 8)).map((variant, i) => (
                        <div key={variant.id} className="grid grid-cols-2 gap-8 py-3 border-b border-border items-center">
                          <span className="text-sm">{variant.name}</span>
                          <span className="text-sm">{variant.size || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'][i % 7]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVariationTab === "sku" && (
                    <div className="space-y-0">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_150px_1fr] gap-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <div>Primary color</div>
                        <div className="text-center">SKU</div>
                        <div>size</div>
                      </div>
                      {(showAllVariations ? variants : variants.slice(0, 8)).map((variant, i) => (
                        <div key={variant.id} className="grid grid-cols-[1fr_150px_1fr] gap-4 py-3 border-b border-border items-center">
                          <span className="text-sm">{variant.name}</span>
                          <Input
                            value={variant.sku || ''}
                            placeholder="SKU"
                            className="text-center h-9"
                          />
                          <span className="text-sm">{variant.size || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'][i % 7]}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVariationTab === "visibility" && (
                    <div className="space-y-0">
                      {/* Header */}
                      <div className="grid grid-cols-2 gap-8 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <div>Primary color</div>
                        <div>size</div>
                      </div>
                      {(showAllVariations ? variants : variants.slice(0, 8)).map((variant, i) => (
                        <div key={variant.id} className="grid grid-cols-2 gap-8 py-3 border-b border-border items-center">
                          <div className="flex items-center justify-between pr-4">
                            <span className="text-sm">{variant.name}</span>
                            <Switch
                              checked={variant.isActive}
                              onCheckedChange={() => toggleVariantVisibility(variant.id)}
                            />
                          </div>
                          <div className="flex items-center justify-between pr-4">
                            <span className="text-sm">{variant.size || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'][i % 7]}</span>
                            <Switch checked={true} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVariationTab === "photos" && (
                    <div className="space-y-0">
                      {/* Variant type selector */}
                      <div className="py-3 border-b border-border">
                        <Select defaultValue="primary-color">
                          <SelectTrigger className="w-40"><SelectValue placeholder="Primary color" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary-color">Primary color</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Header */}
                      <div className="py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        Primary color
                      </div>
                      {/* Photo Rows with real images if available */}
                      {(showAllVariations ? variants : variants.slice(0, 5)).map((variant) => (
                        <div key={variant.id} className="flex items-center gap-4 py-3 border-b border-border">
                          <span className="text-sm w-48 flex-shrink-0">{variant.name}</span>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {/* Show variant images or product images */}
                            {(variant.images && variant.images.length > 0 ? variant.images : images).slice(0, 15).map((img, i) => (
                              <div key={i} className={cn(
                                "w-10 h-10 rounded border flex-shrink-0 overflow-hidden",
                                i === 0 ? "border-primary border-2" : "border-border"
                              )}>
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {/* Placeholder slots if not enough images */}
                            {[...Array(Math.max(0, 12 - Math.min(15, (variant.images?.length || images.length))))].map((_, i) => (
                              <div key={`empty-${i}`} className="w-10 h-10 rounded border border-dashed border-border bg-muted/30 flex-shrink-0" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVariationTab === "processing" && (
                    <div className="space-y-0">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_150px_1fr] gap-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <div>Primary color</div>
                        <div className="text-center">Processing time</div>
                        <div>size</div>
                      </div>
                      {(showAllVariations ? variants : variants.slice(0, 8)).map((variant, i) => (
                        <div key={variant.id} className="grid grid-cols-[1fr_150px_1fr] gap-4 py-3 border-b border-border items-center">
                          <span className="text-sm">{variant.name}</span>
                          <Select defaultValue="1-3">
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-3">1-3 days</SelectItem>
                              <SelectItem value="3-5">3-5 days</SelectItem>
                              <SelectItem value="1-2w">1-2 weeks</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm">{variant.size || ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'][i % 7]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Personalization Section */}
              <section ref={(el) => { if (el) sectionRefs.current['personalization'] = el; }} id="personalization">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Personalization</h2>
                  <label className="flex items-center gap-3">
                    <Switch
                      checked={personalizationEnabled}
                      onCheckedChange={setPersonalizationEnabled}
                    />
                    <span className="text-sm">Enable personalization</span>
                  </label>
                  {personalizationEnabled && (
                    <Textarea
                      value={personalizationInstructions}
                      onChange={(e) => setPersonalizationInstructions(e.target.value)}
                      placeholder="Add personalization instructions..."
                      className="mt-4"
                    />
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
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border bg-background px-6 py-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSaveAsDraft} className="gap-2">
                <Settings2 className="h-4 w-4" />
                Save as Profile
              </Button>
              <Button variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button onClick={handlePublish} disabled={isSaving} className="gap-2 bg-primary">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Publish
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
