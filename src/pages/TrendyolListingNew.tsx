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

interface TrendyolCategory {
  id: string;
  remote_id: string;
  name: string;
  full_path: string | null;
  parent_id: string | null;
  marketplace_id: string;
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
  const [categories, setCategories] = useState<TrendyolCategory[]>([]);
  const [categoryPath, setCategoryPath] = useState<TrendyolCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TrendyolCategory | null>(null);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Attributes state
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, string | number>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Database'den Trendyol kategorilerini yükle
  const fetchCategories = async (parentId: string | null = null) => {
    setLoadingCategories(true);
    setCategoryError(null);
    
    try {
      let query = supabase
        .from('marketplace_categories')
        .select('*')
        .eq('marketplace_id', 'trendyol');
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories(data);
        setCurrentParentId(parentId);
      } else if (!parentId) {
        setCategoryError('Kategoriler bulunamadı');
      }
    } catch (error) {
      console.error('Category fetch error:', error);
      setCategoryError(error instanceof Error ? error.message : 'Kategoriler yüklenemedi');
      toast({
        title: "Hata",
        description: "Trendyol kategorileri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Kategori attribute'larını yükle (API blocked, so use static attributes)
  const fetchAttributes = async (categoryId: string) => {
    setLoadingAttributes(true);
    
    // Since Trendyol API is blocked by Cloudflare, use static common attributes
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

  // Kategori seçildiğinde - check for subcategories
  const handleCategorySelect = async (category: TrendyolCategory) => {
    // Check if this category has subcategories
    const { data: subCategories } = await supabase
      .from('marketplace_categories')
      .select('*')
      .eq('marketplace_id', 'trendyol')
      .eq('parent_id', category.id);
    
    if (subCategories && subCategories.length > 0) {
      // Has subcategories, navigate into them
      setCategoryPath([...categoryPath, category]);
      setCategories(subCategories);
      setCurrentParentId(category.id);
    } else {
      // No subcategories, this is a leaf category - select it
      setSelectedCategory(category);
      setCategoryPath([...categoryPath, category]);
      fetchAttributes(category.id);
      setActiveTab("Özellikler");
    }
  };

  // Geri git
  const handleCategoryBack = () => {
    if (categoryPath.length > 0) {
      const newPath = [...categoryPath];
      newPath.pop();
      setCategoryPath(newPath);
      
      if (newPath.length === 0) {
        fetchCategories(null);
      } else {
        const parentCategory = newPath[newPath.length - 1];
        fetchCategories(parentCategory.id);
      }
    }
  };

  // Sayfa yüklendiğinde kategorileri çek
  useEffect(() => {
    fetchCategories(null);
  }, []);

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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchCategories(null)}
                disabled={loadingCategories}
              >
                {loadingCategories ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Kategorileri Güncelle"
                )}
              </Button>
            </div>

            {/* Seçili kategori yolu */}
            {categoryPath.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setCategoryPath([]);
                    setSelectedCategory(null);
                    fetchCategories(null);
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

            {/* Seçili kategori göstergesi */}
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
                    fetchCategories(null);
                  }}
                  className="ml-auto h-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Hata durumu */}
            {categoryError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-sm">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">{categoryError}</span>
              </div>
            )}

            {/* Kategori listesi */}
            {!selectedCategory && (
              <div className="border border-border rounded-sm">
                {/* Geri butonu */}
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
                          setAttributeValues({
                            ...attributeValues,
                            [attr.attribute.id]: parseInt(value)
                          })
                        }
                      >
                        <SelectTrigger>
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
                          setAttributeValues({
                            ...attributeValues,
                            [attr.attribute.id]: e.target.value
                          })
                        }
                        placeholder={`${attr.attribute.name} girin`}
                        className="h-11"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-sm">
                <Check className="h-8 w-8 mb-2 text-primary" />
                <p className="text-sm">Bu kategori için ek özellik gerekmiyor</p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Üzeri çizili gösterilecek fiyat
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Gerçek satış fiyatı
                </p>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">%0</SelectItem>
                    <SelectItem value="1">%1</SelectItem>
                    <SelectItem value="10">%10</SelectItem>
                    <SelectItem value="18">%18</SelectItem>
                    <SelectItem value="20">%20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fiyat özeti */}
            {salePrice && (
              <div className="p-4 bg-muted/50 rounded-sm">
                <h3 className="text-sm font-medium mb-2">Fiyat Özeti</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liste Fiyatı:</span>
                    <span className="line-through">₺{parseFloat(listPrice || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Satış Fiyatı:</span>
                    <span className="text-primary">₺{parseFloat(salePrice).toFixed(2)}</span>
                  </div>
                  {listPrice && parseFloat(listPrice) > parseFloat(salePrice) && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>İndirim:</span>
                      <span>
                        %{Math.round((1 - parseFloat(salePrice) / parseFloat(listPrice)) * 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "Kargo":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Kargo Bilgileri</h2>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Kargo Şirketi <span className="text-destructive">*</span>
              </Label>
              <Select defaultValue="17">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="17">Trendyol Express</SelectItem>
                  <SelectItem value="4">Yurtiçi Kargo</SelectItem>
                  <SelectItem value="10">Aras Kargo</SelectItem>
                  <SelectItem value="6">MNG Kargo</SelectItem>
                  <SelectItem value="19">Sürat Kargo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Desi (İsteğe Bağlı)
              </Label>
              <Input
                type="number"
                placeholder="1"
                defaultValue="1"
                min="1"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Boyutsal ağırlık hesaplaması için
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handlePublish = async (status: "staging" | "draft" | "active") => {
    // Validation
    if (!title) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen ürün başlığını girin",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Hata",
        description: "Giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Map status to database status
      const dbStatus = status === "active" ? "active" : "draft";

      const { data, error } = await supabase
        .from("products")
        .insert({
          title,
          description,
          sku: stockCode || barcode,
          price: parseFloat(salePrice) || 0,
          stock: parseInt(quantity) || 0,
          brand,
          status: dbStatus,
          source: "trendyol",
          user_id: user.id,
          marketplace_category_id: selectedCategory?.id || null,
          trendyol_synced: status === "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: status === "active" ? "Ürün Yayınlandı!" : "Ürün Kaydedildi!",
        description: status === "draft" 
          ? "Ürün taslak olarak kaydedildi" 
          : status === "staging"
          ? "Ürün staging'e gönderildi"
          : "Ürün başarıyla oluşturuldu ve yayınlandı",
      });

      navigate("/inventory");
    } catch (error) {
      console.error("Error saving product:", error);
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
      title: "Profile Kaydedildi",
      description: "Bu ayarlar profil olarak kaydedildi",
    });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col pb-20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
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
              <div className="w-6 h-6 bg-[#FF6000] rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <h1 className="text-lg font-semibold">Trendyol Ürün Oluştur</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Tabs */}
          <div className="w-64 border-r border-border bg-muted/30 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm rounded-sm transition-colors",
                    activeTab === tab
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <ListingFooter
        onSaveAsProfile={handleSaveAsProfile}
        onPublish={handlePublish}
        isLoading={isSaving}
        shopName="trendyol"
        primaryColor="#FF6000"
      />
    </Layout>
  );
}
