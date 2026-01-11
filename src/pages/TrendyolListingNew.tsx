import { useState, useEffect } from "react";
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
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ListingFooter } from "@/components/listing/ListingFooter";

// Trendyol'a özel tab'lar
const tabs = [
  "Fotoğraflar",
  "Temel Bilgiler",
  "Kategori",
  "Özellikler",
  "Fiyat & Stok",
  "Kargo",
];

// Static categories for Trendyol (since marketplace_categories table doesn't exist)
const staticCategories = [
  { id: "1", name: "Elektronik", parent_id: null },
  { id: "2", name: "Moda", parent_id: null },
  { id: "3", name: "Ev & Yaşam", parent_id: null },
  { id: "4", name: "Spor & Outdoor", parent_id: null },
  { id: "1-1", name: "Telefon", parent_id: "1" },
  { id: "1-2", name: "Bilgisayar", parent_id: "1" },
  { id: "2-1", name: "Kadın Giyim", parent_id: "2" },
  { id: "2-2", name: "Erkek Giyim", parent_id: "2" },
];

interface TrendyolCategory {
  id: string;
  name: string;
  parent_id: string | null;
  full_path?: string;
}

interface CategoryAttribute {
  attribute: {
    id: number;
    name: string;
  };
  required: boolean;
  allowCustom: boolean;
  attributeValues?: Array<{
    id: number;
    name: string;
  }>;
}

export default function TrendyolListingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [vatRate, setVatRate] = useState("18");

  // Category state
  const [categories, setCategories] = useState<TrendyolCategory[]>(
    staticCategories.filter(c => c.parent_id === null)
  );
  const [categoryPath, setCategoryPath] = useState<TrendyolCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TrendyolCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Attributes state
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, string | number>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Load static attributes when category is selected
  const fetchAttributes = (categoryId: string) => {
    setLoadingAttributes(true);
    
    // Static common attributes
    const commonAttributes: CategoryAttribute[] = [
      {
        attribute: { id: 348, name: 'Renk' },
        required: true,
        allowCustom: false,
        attributeValues: [
          { id: 52, name: 'Siyah' },
          { id: 53, name: 'Beyaz' },
          { id: 54, name: 'Kırmızı' },
          { id: 55, name: 'Mavi' },
          { id: 56, name: 'Yeşil' },
          { id: 57, name: 'Sarı' },
          { id: 61, name: 'Gri' },
          { id: 62, name: 'Kahverengi' },
        ]
      },
      {
        attribute: { id: 338, name: 'Beden' },
        required: true,
        allowCustom: true,
        attributeValues: [
          { id: 1, name: 'XS' },
          { id: 2, name: 'S' },
          { id: 3, name: 'M' },
          { id: 4, name: 'L' },
          { id: 5, name: 'XL' },
          { id: 6, name: 'XXL' },
        ]
      },
      {
        attribute: { id: 47, name: 'Materyal' },
        required: false,
        allowCustom: true,
        attributeValues: []
      }
    ];
    
    setAttributes(commonAttributes);
    setLoadingAttributes(false);
  };

  // Handle category selection
  const handleCategorySelect = (category: TrendyolCategory) => {
    const subCategories = staticCategories.filter(c => c.parent_id === category.id);
    
    if (subCategories.length > 0) {
      // Has subcategories, navigate into them
      setCategoryPath([...categoryPath, category]);
      setCategories(subCategories);
    } else {
      // No subcategories, this is a leaf category - select it
      setSelectedCategory(category);
      setCategoryPath([...categoryPath, category]);
      fetchAttributes(category.id);
      setActiveTab("Özellikler");
    }
  };

  // Handle category back navigation
  const handleCategoryBack = () => {
    if (categoryPath.length > 0) {
      const newPath = [...categoryPath];
      newPath.pop();
      setCategoryPath(newPath);
      
      if (newPath.length === 0) {
        setCategories(staticCategories.filter(c => c.parent_id === null));
      } else {
        const parentCategory = newPath[newPath.length - 1];
        setCategories(staticCategories.filter(c => c.parent_id === parentCategory.id));
      }
    }
  };

  const handlePublish = async (status: 'staging' | 'draft' | 'active') => {
    if (!user) {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Hata",
        description: "Ürün başlığı zorunludur",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(salePrice) || parseFloat(listPrice) || 0,
        status: status === 'active' ? 'active' : 'draft',
        platform: 'trendyol',
        user_id: user.id,
        marketplace_data: {
          sku: stockCode.trim() || null,
          brand: brand.trim() || null,
          barcode: barcode.trim() || null,
          listPrice: parseFloat(listPrice) || 0,
          quantity: parseInt(quantity) || 0,
          vatRate: parseInt(vatRate) || 18,
          categoryId: selectedCategory?.id || null,
          attributes: attributeValues,
        },
      };

      const { error } = await supabase
        .from('marketplace_listings')
        .insert(listingData);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Ürün ${status === 'active' ? 'yayınlandı' : 'taslak olarak kaydedildi'}`,
      });
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Hata",
        description: "Ürün kaydedilirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsProfile = () => {
    toast({
      title: "Bilgi",
      description: "Profile kaydetme özelliği yakında eklenecek",
    });
  };

  const maxTitleLength = 100;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Fotoğraflar":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Ürün Fotoğrafları</h2>
              <p className="text-sm text-muted-foreground mb-4">
                En az 1, en fazla 8 fotoğraf yükleyebilirsiniz. İlk fotoğraf vitrin görseli olacaktır.
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div className="aspect-square border-2 border-dashed border-primary rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors">
                  <Image className="h-8 w-8 text-primary" />
                  <span className="text-sm text-primary font-medium">Vitrin</span>
                </div>
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i}
                    className="aspect-square border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Min. 500x500 piksel, JPEG veya PNG formatında
              </p>
            </div>
          </div>
        );

      case "Temel Bilgiler":
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Ürün Başlığı <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
                placeholder="Ürün başlığını girin"
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
                  Barkod <span className="text-destructive">*</span>
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
                  Stok Kodu <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={stockCode}
                  onChange={(e) => setStockCode(e.target.value)}
                  placeholder="Stok kodu (SKU)"
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
              <p className="text-xs text-muted-foreground mt-1">
                Trendyol'da kayıtlı marka adını girin
              </p>
            </div>
          </div>
        );

      case "Kategori":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Trendyol Kategori Seçimi</h2>
                <p className="text-sm text-muted-foreground">
                  Ürününüz için uygun kategoriyi seçin
                </p>
              </div>
            </div>

            {/* Selected category path */}
            {categoryPath.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setCategoryPath([]);
                    setSelectedCategory(null);
                    setCategories(staticCategories.filter(c => c.parent_id === null));
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Ana Kategoriler
                </Button>
                {categoryPath.map((cat, index) => (
                  <div key={cat.id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span 
                      className={cn(
                        "text-sm px-2 py-1 rounded-sm",
                        index === categoryPath.length - 1 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "text-foreground"
                      )}
                    >
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected category indicator */}
            {selectedCategory && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-sm">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  Seçili Kategori: {selectedCategory.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryPath([]);
                    setAttributes([]);
                    setCategories(staticCategories.filter(c => c.parent_id === null));
                  }}
                  className="ml-auto h-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Error state */}
            {categoryError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-sm">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">{categoryError}</span>
              </div>
            )}

            {/* Category list */}
            {!selectedCategory && (
              <div className="border border-border rounded-sm">
                {/* Back button */}
                {categoryPath.length > 0 && (
                  <button
                    onClick={handleCategoryBack}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-muted/50 border-b border-border transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Geri
                  </button>
                )}

                {loadingCategories ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : categories.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-sm">Kategori bulunamadı</p>
                  </div>
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
                  ? `"${selectedCategory.name}" kategorisi için gerekli özellikleri doldurun`
                  : "Önce bir kategori seçmelisiniz"}
              </p>
            </div>

            {!selectedCategory ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-sm">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm mb-4">Kategori seçilmedi</p>
                <Button variant="outline" onClick={() => setActiveTab("Kategori")}>
                  Kategori Seç
                </Button>
              </div>
            ) : loadingAttributes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : attributes.length > 0 ? (
              <div className="space-y-4">
                {attributes.map((attr) => (
                  <div key={attr.attribute.id}>
                    <Label className="text-sm font-medium mb-2 block">
                      {attr.attribute.name}
                      {attr.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {attr.attributeValues && attr.attributeValues.length > 0 ? (
                      <Select
                        value={attributeValues[attr.attribute.id]?.toString() || ""}
                        onValueChange={(value) => 
                          setAttributeValues(prev => ({ ...prev, [attr.attribute.id]: value }))
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={`${attr.attribute.name} seçin`} />
                        </SelectTrigger>
                        <SelectContent>
                          {attr.attributeValues.map((val) => (
                            <SelectItem key={val.id} value={val.id.toString()}>
                              {val.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={attributeValues[attr.attribute.id]?.toString() || ""}
                        onChange={(e) => 
                          setAttributeValues(prev => ({ ...prev, [attr.attribute.id]: e.target.value }))
                        }
                        placeholder={`${attr.attribute.name} girin`}
                        className="h-11"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bu kategori için özellik tanımlanmamış.</p>
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  KDV Oranı (%)
                </Label>
                <Select value={vatRate} onValueChange={setVatRate}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">%0</SelectItem>
                    <SelectItem value="1">%1</SelectItem>
                    <SelectItem value="8">%8</SelectItem>
                    <SelectItem value="18">%18</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "Kargo":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Kargo Bilgileri</h2>
            <p className="text-sm text-muted-foreground">
              Trendyol kargo ayarları mağaza hesabınızdan yönetilir.
            </p>
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
                <div className="w-8 h-8 bg-[#F27A1A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <h1 className="text-lg font-semibold">Trendyol Ürün Ekle</h1>
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
                    ? "border-[#F27A1A] text-[#F27A1A]"
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
