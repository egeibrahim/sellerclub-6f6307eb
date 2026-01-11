import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ListingFooter } from "@/components/listing/ListingFooter";

// Hepsiburada'ya özel tab'lar
const tabs = [
  "Fotoğraflar",
  "Temel Bilgiler",
  "Kategori",
  "Özellikler",
  "Fiyat & Stok",
  "Kargo",
];

// Static categories for Hepsiburada (since marketplace_categories table doesn't exist)
const staticCategories = [
  { id: "1", name: "Elektronik", parent_id: null },
  { id: "2", name: "Moda", parent_id: null },
  { id: "3", name: "Ev & Yaşam", parent_id: null },
  { id: "4", name: "Anne & Bebek", parent_id: null },
  { id: "5", name: "Kozmetik", parent_id: null },
  { id: "1-1", name: "Telefon", parent_id: "1" },
  { id: "1-2", name: "Bilgisayar", parent_id: "1" },
  { id: "2-1", name: "Kadın Giyim", parent_id: "2" },
  { id: "2-2", name: "Erkek Giyim", parent_id: "2" },
];

interface HepsiburadaCategory {
  id: string;
  name: string;
  parent_id: string | null;
  full_path?: string;
}

export default function HepsiburadaListingNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Fotoğraflar");
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [brand, setBrand] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [deliveryTime, setDeliveryTime] = useState("3");
  const [shippingCost, setShippingCost] = useState("0");

  // Category state
  const [categories, setCategories] = useState<HepsiburadaCategory[]>(
    staticCategories.filter(c => c.parent_id === null)
  );
  const [categoryPath, setCategoryPath] = useState<HepsiburadaCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HepsiburadaCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Attributes state
  const [attributes, setAttributes] = useState<Array<{ name: string; required: boolean; value: string }>>([]);

  const maxTitleLength = 150;

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
        price: parseFloat(salePrice) || parseFloat(listPrice) || 0,
        status: status === 'active' ? 'active' : 'draft',
        platform: 'hepsiburada',
        user_id: user.id,
        marketplace_data: {
          sku: stockCode.trim() || null,
          brand: brand.trim() || null,
          barcode: barcode.trim() || null,
          listPrice: parseFloat(listPrice) || 0,
          quantity: parseInt(quantity) || 0,
          categoryId: selectedCategory?.id || null,
          attributes: attributes.reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),
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

  // Handle category selection using static data
  const handleCategorySelect = (category: HepsiburadaCategory) => {
    const subCategories = staticCategories.filter(c => c.parent_id === category.id);
    
    if (subCategories.length > 0) {
      // Has subcategories, navigate deeper
      setCategoryPath([...categoryPath, category]);
      setCategories(subCategories);
    } else {
      // This is a leaf category, select it
      setSelectedCategory(category);
      setCategoryPath([...categoryPath, category]);
      
      // Load static attributes
      setAttributes([
        { name: 'Renk', required: true, value: '' },
        { name: 'Beden', required: true, value: '' },
        { name: 'Materyal', required: false, value: '' },
        { name: 'Sezon', required: false, value: '' },
      ]);
      
      toast.success(`Kategori seçildi: ${category.name}`);
    }
  };

  // Handle going back in category tree
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "Fotoğraflar":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Ürün Görselleri</h2>
              <p className="text-sm text-muted-foreground mb-4">
                En az 1, en fazla 6 görsel yükleyebilirsiniz. İlk görsel ana görsel olacaktır.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square border-2 border-dashed border-[#FF6600] rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#FF6600]/5 transition-colors">
                  <Image className="h-8 w-8 text-[#FF6600]" />
                  <span className="text-sm text-[#FF6600] font-medium">Ana Görsel</span>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="aspect-square border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FF6600] hover:bg-[#FF6600]/5 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Min. 800x800 piksel, JPEG veya PNG formatında
              </p>
            </div>
          </div>
        );

      case "Temel Bilgiler":
        return (
          <div className="space-y-6">
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
                Ürün Açıklaması <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürün açıklamasını girin"
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Barkod (GTIN) <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="EAN/UPC barkod"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Stok Kodu <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={stockCode}
                  onChange={(e) => setStockCode(e.target.value)}
                  placeholder="Merchant SKU"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Marka <span className="text-destructive">*</span>
              </Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Marka adı"
                className="h-11"
              />
            </div>
          </div>
        );

      case "Kategori":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Hepsiburada Kategori Seçimi</h2>
              <p className="text-sm text-muted-foreground">
                Ürününüz için uygun kategoriyi seçin
              </p>
            </div>

            {/* Selected category display */}
            {selectedCategory && (
              <div className="p-4 bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-sm">
                <div className="flex items-center gap-2 text-[#FF6600]">
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

            {/* Category breadcrumb */}
            {!selectedCategory && categoryPath.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCategoryBack}
                  className="text-[#FF6600]"
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
              <div className="border border-border rounded-sm divide-y divide-border">
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FF6600]" />
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
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FF6600]/5 transition-colors text-left"
                    >
                      <span className="text-foreground">{category.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );

      case "Özellikler":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Ürün Özellikleri</h2>
              <p className="text-sm text-muted-foreground">
                {selectedCategory 
                  ? `${selectedCategory.name} kategorisi için özellikler`
                  : 'Kategori seçildikten sonra zorunlu özellikler burada görüntülenecek'}
              </p>
            </div>

            {attributes.length > 0 ? (
              <div className="space-y-4">
                {attributes.map((attr, index) => (
                  <div key={attr.name}>
                    <Label className="text-sm font-medium mb-2 block">
                      {attr.name} {attr.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[index].value = e.target.value;
                        setAttributes(newAttrs);
                      }}
                      placeholder={`${attr.name} girin`}
                      className="h-11"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-sm">
                <p className="text-sm">Önce bir kategori seçmelisiniz</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setActiveTab("Kategori")}
                >
                  Kategori Seç
                </Button>
              </div>
            )}
          </div>
        );

      case "Fiyat & Stok":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Fiyat ve Stok Bilgileri</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Liste Fiyatı (₺) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Satış Fiyatı (₺) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Stok Adedi <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="0"
                className="h-11"
              />
            </div>
          </div>
        );

      case "Kargo":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Kargo Bilgileri</h2>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Teslimat Süresi <span className="text-destructive">*</span>
              </Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 İş Günü</SelectItem>
                  <SelectItem value="2">2 İş Günü</SelectItem>
                  <SelectItem value="3">3 İş Günü</SelectItem>
                  <SelectItem value="5">5 İş Günü</SelectItem>
                  <SelectItem value="7">7 İş Günü</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Kargo Ücreti (₺)
              </Label>
              <Input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ücretsiz kargo için 0 girin
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col bg-background pb-20">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HB</span>
                </div>
                <h1 className="text-lg font-semibold">Hepsiburada Ürün Ekle</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-border bg-card px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                  activeTab === tab
                    ? "border-[#FF6600] text-[#FF6600]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
