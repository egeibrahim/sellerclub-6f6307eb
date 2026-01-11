import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Image, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Check,
  X,
  Upload,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ListingFooter } from "@/components/listing/ListingFooter";

// Section IDs for scrolling
const sections = [
  { id: "images", label: "Görseller" },
  { id: "general", label: "Genel Bilgiler" },
  { id: "category", label: "Kategori" },
  { id: "pricing", label: "Fiyatlandırma" },
  { id: "stock", label: "Stok" },
  { id: "variants", label: "Varyantlar" },
  { id: "seo", label: "SEO" },
];

interface IkasCategory {
  id: string;
  remote_id: string | null;
  name: string;
  full_path: string | null;
  parent_id: string | null;
}

interface IkasProduct {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  price: number;
  discountPrice?: number;
  buyPrice?: number;
  currency?: string;
  stock: number;
  totalStock?: number;
  weight?: number;
  brand?: string;
  brandId?: string;
  category?: string;
  categoryId?: string;
  categoryIds?: string[];
  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
  images: string[];
  mainImage?: string;
  type?: string;
  variantTypes?: {
    id: string;
    name: string;
    selectionType: string;
    values: { id: string; name: string; colorCode?: string }[];
  }[];
  variants?: {
    id: string;
    sku?: string;
    barcode?: string;
    price: number;
    discountPrice?: number;
    stock: number;
    isActive?: boolean;
    images?: { url: string; isMain?: boolean }[];
    mainImage?: string;
    values?: { variantTypeId: string; variantValueId: string }[];
  }[];
}

export default function IkasListingNew() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("images");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  // Product data from ikas
  const [ikasProduct, setIkasProduct] = useState<IkasProduct | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [quantity, setQuantity] = useState("0");
  const [weight, setWeight] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  // Category state
  const [categories, setCategories] = useState<IkasCategory[]>([]);
  const [categoryPath, setCategoryPath] = useState<IkasCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IkasCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const maxTitleLength = 200;

  // Load product data if editing
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId || !user) return;
      
      setIsLoading(true);
      try {
        // First check if it's a local product
        const { data: localProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (localProduct) {
          setTitle(localProduct.title || '');
          setDescription(localProduct.description || '');
          setSku(localProduct.sku || '');
          setPrice(localProduct.price?.toString() || '');
          setQuantity(localProduct.stock?.toString() || '0');
          setBrand(localProduct.brand || '');
          setColor(localProduct.color || '');
          setSize(localProduct.size || '');
          setImages(localProduct.images || []);
        }
        
        // Try to fetch full product data from ikas
        const { data: connection } = await supabase
          .from('marketplace_connections')
          .select('credentials')
          .eq('marketplace', 'ikas')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (connection?.credentials) {
          const { data: syncResult } = await supabase.functions.invoke('ikas-sync', {
            body: { 
              action: 'fetch_products',
              credentials: connection.credentials,
              limit: 100
            }
          });
          
          if (syncResult?.success && syncResult.products) {
            const ikasProductData = syncResult.products.find((p: IkasProduct) => p.id === productId);
            if (ikasProductData) {
              setIkasProduct(ikasProductData);
              // Fill form with ikas data
              setTitle(ikasProductData.title || '');
              setDescription(ikasProductData.description || '');
              setShortDescription(ikasProductData.shortDescription || '');
              setSku(ikasProductData.sku || '');
              setBarcode(ikasProductData.barcode || '');
              setPrice(ikasProductData.price?.toString() || '');
              setDiscountPrice(ikasProductData.discountPrice?.toString() || '');
              setBuyPrice(ikasProductData.buyPrice?.toString() || '');
              setCurrency(ikasProductData.currency || 'TRY');
              setQuantity(ikasProductData.stock?.toString() || '0');
              setWeight(ikasProductData.weight?.toString() || '');
              setBrand(ikasProductData.brand || '');
              setImages(ikasProductData.images || []);
              
              // Extract color/size from variant types
              const colorVariant = ikasProductData.variantTypes?.find(v => 
                v.name.toLowerCase().includes('renk') || v.name.toLowerCase().includes('color')
              );
              const sizeVariant = ikasProductData.variantTypes?.find(v => 
                v.name.toLowerCase().includes('beden') || v.name.toLowerCase().includes('size')
              );
              
              if (colorVariant?.values?.[0]) {
                setColor(colorVariant.values[0].name);
              }
              if (sizeVariant?.values?.[0]) {
                setSize(sizeVariant.values[0].name);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProductData();
  }, [productId, user]);

  // Fetch categories
  const fetchCategories = async (parentId: string | null) => {
    setLoadingCategories(true);
    try {
      let query = supabase
        .from('marketplace_categories')
        .select('id, remote_id, name, full_path, parent_id')
        .eq('marketplace_id', 'ikas');
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load initial categories
  useEffect(() => {
    fetchCategories(null);
  }, []);

  // Handle scroll and section detection
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollTop = contentRef.current.scrollTop;
      let currentSection = sections[0].id;
      
      for (const section of sections) {
        const ref = sectionRefs.current[section.id];
        if (ref) {
          const offsetTop = ref.offsetTop - 100;
          if (scrollTop >= offsetTop) {
            currentSection = section.id;
          }
        }
      }
      
      setActiveSection(currentSection);
    };
    
    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs.current[sectionId];
    if (ref && contentRef.current) {
      const offsetTop = ref.offsetTop - 80;
      contentRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
    setActiveSection(sectionId);
  };

  // Handle category selection
  const handleCategorySelect = async (category: IkasCategory) => {
    const { data: subCategories } = await supabase
      .from('marketplace_categories')
      .select('id')
      .eq('marketplace_id', 'ikas')
      .eq('parent_id', category.id)
      .limit(1);
    
    if (subCategories && subCategories.length > 0) {
      setCategoryPath([...categoryPath, category]);
      fetchCategories(category.id);
    } else {
      setSelectedCategory(category);
      setCategoryPath([...categoryPath, category]);
      toast.success(`Kategori seçildi: ${category.name}`);
    }
  };

  const handleCategoryBack = () => {
    if (categoryPath.length > 0) {
      const newPath = [...categoryPath];
      newPath.pop();
      setCategoryPath(newPath);
      
      if (newPath.length > 0) {
        fetchCategories(newPath[newPath.length - 1].id);
      } else {
        fetchCategories(null);
      }
      
      setSelectedCategory(null);
    }
  };

  const handlePublish = async (status: "staging" | "draft" | "active") => {
    if (!title) {
      toast.error("Lütfen ürün adını girin");
      return;
    }

    if (!user) {
      toast.error("Giriş yapmanız gerekiyor");
      return;
    }

    setIsSaving(true);

    try {
      const dbStatus = status === "active" ? "active" : "draft";
      const productData = {
        title,
        description,
        sku: sku || barcode,
        price: parseFloat(price) || 0,
        stock: parseInt(quantity) || 0,
        brand,
        color,
        size,
        status: dbStatus,
        source: "ikas",
        user_id: user.id,
        images: images,
        marketplace_category_id: selectedCategory?.id || null,
      };

      if (productId) {
        // Update existing
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq('id', productId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
      }

      toast.success(
        status === "active" 
          ? "Ürün yayınlandı!" 
          : status === "draft"
          ? "Ürün taslak olarak kaydedildi"
          : "Ürün staging'e gönderildi"
      );

      navigate("/inventory");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Ürün kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsProfile = () => {
    toast.success("Bu ayarlar profil olarak kaydedildi");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
      <div className="h-full flex flex-col pb-20">
        {/* Header with section tabs */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/inventory")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#6366F1] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">i</span>
                </div>
                <h1 className="text-lg font-semibold">
                  {productId ? "ikas Ürün Düzenle" : "ikas Ürün Oluştur"}
                </h1>
              </div>
            </div>
          </div>
          
          {/* Section tabs - horizontal scrollable */}
          <div className="px-6 pb-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap",
                    activeSection === section.id
                      ? "bg-[#6366F1] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content - single page with all sections */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Images Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['images'] = el; }}
              id="images"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#6366F1]/10 rounded-lg flex items-center justify-center text-[#6366F1]">
                  <Image className="h-4 w-4" />
                </span>
                Ürün Görselleri
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ürün görsellerini ekleyin (İlk görsel ana görsel olarak kullanılır)
              </p>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img 
                      src={img} 
                      alt={`Ürün görseli ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {i === 0 && (
                      <Badge className="absolute top-1 left-1 bg-[#6366F1] text-white text-xs">
                        Ana
                      </Badge>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-[#6366F1] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#6366F1]/5 transition-colors">
                  <Upload className="h-6 w-6 text-[#6366F1]" />
                  <span className="text-xs text-[#6366F1] font-medium">Ekle</span>
                </div>
              </div>
            </section>

            {/* General Info Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['general'] = el; }}
              id="general"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Genel Bilgiler</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Ürün Adı <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                    placeholder="Ürün adını girin"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {maxTitleLength - title.length} karakter kaldı
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Kısa Açıklama
                  </Label>
                  <Textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Kısa açıklama girin"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Açıklama
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ürün açıklamasını girin (HTML desteklenir)"
                    rows={6}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Barkod
                    </Label>
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Ürün barkodu"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      SKU
                    </Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Stok kodu"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Marka
                    </Label>
                    <Input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Marka adı"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Ağırlık (kg)
                    </Label>
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Renk
                    </Label>
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ürün rengi"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Beden
                    </Label>
                    <Input
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="Ürün bedeni"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Category Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['category'] = el; }}
              id="category"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Kategori</h2>
              
              {/* Selected category display */}
              {selectedCategory && (
                <div className="p-4 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-[#6366F1]">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Seçilen Kategori:</span>
                  </div>
                  <p className="mt-1 text-foreground">{selectedCategory.full_path || selectedCategory.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryPath([]);
                      fetchCategories(null);
                    }}
                  >
                    Değiştir
                  </Button>
                </div>
              )}

              {/* Category breadcrumb */}
              {!selectedCategory && categoryPath.length > 0 && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCategoryBack}
                    className="text-[#6366F1]"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Geri
                  </Button>
                  <span className="text-muted-foreground">
                    {categoryPath.map(c => c.name).join(' > ')}
                  </span>
                </div>
              )}

              {/* Category list */}
              {!selectedCategory && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#6366F1]" />
                      <span className="ml-2 text-muted-foreground">Kategoriler yükleniyor...</span>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Kategori bulunamadı
                    </div>
                  ) : (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#6366F1]/5 transition-colors text-left"
                      >
                        <span className="text-foreground">{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* Pricing Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['pricing'] = el; }}
              id="pricing"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Fiyatlandırma</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Satış Fiyatı <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currency}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      İndirimli Fiyat
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currency}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Alış Fiyatı
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Para Birimi
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">₺ TRY</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Stock Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['stock'] = el; }}
              id="stock"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Stok Yönetimi</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Stok Takibi</Label>
                    <p className="text-xs text-muted-foreground">
                      Stok miktarını takip et ve stok bittiğinde satışı durdur
                    </p>
                  </div>
                  <Switch
                    checked={trackInventory}
                    onCheckedChange={setTrackInventory}
                  />
                </div>

                {trackInventory && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Stok Miktarı
                    </Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="h-11 w-40"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Depo
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Varsayılan Depo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Variants Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['variants'] = el; }}
              id="variants"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Ürün Varyantları</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Farklı renk, beden gibi seçenekler için varyant bilgileri
              </p>

              {ikasProduct?.variants && ikasProduct.variants.length > 1 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-muted text-sm font-medium">
                    <span>Görsel</span>
                    <span>SKU</span>
                    <span>Fiyat</span>
                    <span>Stok</span>
                    <span>Durum</span>
                  </div>
                  {ikasProduct.variants.map((variant, i) => (
                    <div key={variant.id} className="grid grid-cols-5 gap-4 px-4 py-3 border-t border-border items-center">
                      <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                        {variant.mainImage && (
                          <img 
                            src={variant.mainImage} 
                            alt={`Varyant ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-sm">{variant.sku || '-'}</span>
                      <span className="text-sm font-medium">{variant.price} {currency}</span>
                      <span className="text-sm">{variant.stock}</span>
                      <Badge variant={variant.isActive ? "default" : "secondary"}>
                        {variant.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm mb-4">Henüz varyant yok</p>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Varyant Ekle
                  </Button>
                </div>
              )}
            </section>

            {/* SEO Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['seo'] = el; }}
              id="seo"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">SEO Ayarları</h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    SEO Başlığı
                  </Label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "Ürün adı kullanılacak"}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {seoTitle.length}/60 karakter
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    SEO Açıklaması
                  </Label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Arama motorlarında görünecek açıklama"
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {seoDescription.length}/160 karakter
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    URL (Slug)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">yourdomain.com/</span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="urun-adi"
                      className="h-11 flex-1"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Google'da Görünüm:</p>
                  <div className="space-y-1">
                    <p className="text-[#1a0dab] text-lg">
                      {seoTitle || title || "Ürün Başlığı"}
                    </p>
                    <p className="text-[#006621] text-sm">
                      yourdomain.com/{slug || "urun-adi"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {seoDescription || description || "Ürün açıklaması burada görünecek..."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <ListingFooter
        onSaveAsProfile={handleSaveAsProfile}
        onPublish={handlePublish}
        isLoading={isSaving}
        shopName="ikas"
        primaryColor="#6366F1"
      />
    </Layout>
  );
}
