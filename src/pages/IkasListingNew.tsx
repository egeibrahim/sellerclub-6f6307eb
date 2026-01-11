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

// Static categories for ikas
const staticCategories = [
  { id: "1", name: "Giyim", parent_id: null },
  { id: "2", name: "Aksesuar", parent_id: null },
  { id: "3", name: "Ev & Dekorasyon", parent_id: null },
  { id: "1-1", name: "Kadın Giyim", parent_id: "1" },
  { id: "1-2", name: "Erkek Giyim", parent_id: "1" },
  { id: "2-1", name: "Çanta", parent_id: "2" },
  { id: "2-2", name: "Takı", parent_id: "2" },
];

interface IkasCategory {
  id: string;
  name: string;
  parent_id: string | null;
  full_path?: string;
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
  const [categories, setCategories] = useState<IkasCategory[]>(
    staticCategories.filter(c => c.parent_id === null)
  );
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
        // Load from marketplace_listings
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
          
          const marketplaceData = listing.marketplace_data as Record<string, any> || {};
          setSku(marketplaceData.sku || '');
          setBrand(marketplaceData.brand || '');
          setQuantity(marketplaceData.quantity?.toString() || '0');
          setImages(marketplaceData.images || []);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProductData();
  }, [productId, user]);

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
  const handleCategorySelect = (category: IkasCategory) => {
    const subCategories = staticCategories.filter(c => c.parent_id === category.id);
    
    if (subCategories.length > 0) {
      setCategoryPath([...categoryPath, category]);
      setCategories(subCategories);
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
        const parentId = newPath[newPath.length - 1].id;
        setCategories(staticCategories.filter(c => c.parent_id === parentId));
      } else {
        setCategories(staticCategories.filter(c => c.parent_id === null));
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
      const listingData = {
        title,
        description,
        price: parseFloat(price) || 0,
        status: dbStatus,
        platform: "ikas",
        user_id: user.id,
        marketplace_data: {
          sku: sku || barcode,
          brand,
          color,
          size,
          images,
          quantity: parseInt(quantity) || 0,
          categoryId: selectedCategory?.id || null,
          discountPrice: parseFloat(discountPrice) || null,
          buyPrice: parseFloat(buyPrice) || null,
          weight: parseFloat(weight) || null,
          seo: {
            title: seoTitle,
            description: seoDescription,
            slug,
          },
        },
      };

      if (productId) {
        // Update existing
        const { error } = await supabase
          .from("marketplace_listings")
          .update(listingData)
          .eq('id', productId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("marketplace_listings")
          .insert(listingData);

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
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-[#6366F1]/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#6366F1]/5 transition-colors">
                  <Plus className="h-8 w-8 text-[#6366F1]" />
                  <span className="text-xs text-[#6366F1] mt-1">Görsel Ekle</span>
                  <input type="file" accept="image/*" className="hidden" multiple />
                </label>
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
                  <Label>Ürün Adı *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                    placeholder="Ürün adını girin"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {maxTitleLength - title.length} karakter kaldı
                  </p>
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ürün açıklaması"
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Stok kodu"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Barkod</Label>
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Barkod"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Marka</Label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Marka adı"
                    className="mt-1"
                  />
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
              
              {selectedCategory && (
                <div className="p-4 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-[#6366F1]">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Seçilen Kategori:</span>
                  </div>
                  <p className="mt-1 text-foreground">
                    {categoryPath.map(c => c.name).join(' > ')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryPath([]);
                      setCategories(staticCategories.filter(c => c.parent_id === null));
                    }}
                  >
                    Değiştir
                  </Button>
                </div>
              )}

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

              {!selectedCategory && (
                <div className="border border-border rounded-lg divide-y divide-border">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#6366F1]/5 transition-colors text-left"
                    >
                      <span className="text-foreground">{category.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fiyat *</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>İndirimli Fiyat</Label>
                  <Input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Alış Fiyatı</Label>
                  <Input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Stock Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['stock'] = el; }}
              id="stock"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Stok</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Stok Takibi</Label>
                  <Switch
                    checked={trackInventory}
                    onCheckedChange={setTrackInventory}
                  />
                </div>
                <div>
                  <Label>Stok Miktarı</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Variants Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['variants'] = el; }}
              id="variants"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Varyantlar</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Renk</Label>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Renk"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Beden</Label>
                  <Input
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="Beden"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* SEO Section */}
            <section 
              ref={(el) => { if (el) sectionRefs.current['seo'] = el; }}
              id="seo"
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">SEO</h2>
              <div className="space-y-4">
                <div>
                  <Label>SEO Başlığı</Label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="SEO için başlık"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>SEO Açıklaması</Label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="SEO için açıklama"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="urun-url-adresi"
                    className="mt-1"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <ListingFooter
          onPublish={handlePublish}
          onSaveAsProfile={handleSaveAsProfile}
          isPublishing={isSaving}
        />
      </div>
    </Layout>
  );
}
