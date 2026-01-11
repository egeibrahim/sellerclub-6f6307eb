import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronRight,
  AlertCircle,
  Loader2,
  Trash2,
  Upload,
  Save,
  Send,
  Package,
  DollarSign,
  Tag,
  FileText,
  Layers,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmazonCategoryTree } from "@/components/amazon/AmazonCategoryTree";
import { AmazonAttributePanel } from "@/components/amazon/AmazonAttributePanel";
import { useAmazonCategories } from "@/hooks/useAmazonCategories";
import { useAmazonProducts } from "@/hooks/useAmazonProducts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Main section tabs
const mainSections = [
  { id: "basic", label: "Temel Bilgiler", icon: FileText },
  { id: "category", label: "Kategori", icon: Layers },
  { id: "details", label: "Ürün Detayları", icon: Package },
  { id: "pricing", label: "Fiyat & Stok", icon: DollarSign },
  { id: "images", label: "Görseller", icon: Image },
  { id: "variations", label: "Varyantlar", icon: Tag },
];

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  asin?: string;
}

interface AmazonCategory {
  id: string;
  name: string;
  path: string[];
  requiredAttributes?: string[];
}

export default function AmazonListingNew() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  // UI State
  const [activeSection, setActiveSection] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Form state - Basic Info
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [partNumber, setPartNumber] = useState("");
  
  // Description with bullet points
  const [bulletPoints, setBulletPoints] = useState<string[]>(["", "", "", "", ""]);
  const [description, setDescription] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  
  // Category
  const [selectedCategory, setSelectedCategory] = useState<AmazonCategory | null>(null);
  const [productType, setProductType] = useState("");
  
  // Pricing & Inventory
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [condition, setCondition] = useState("new");
  const [fulfillmentChannel, setFulfillmentChannel] = useState("merchant");
  
  // Images
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  // Variations
  const [variants, setVariants] = useState<Variant[]>([]);
  const [hasVariations, setHasVariations] = useState(false);
  
  // Dynamic attributes based on category
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  
  // Amazon connection
  const [amazonConnection, setAmazonConnection] = useState<any>(null);
  
  const { categories, isLoading: categoriesLoading } = useAmazonCategories();
  const { createProduct, updateProduct, isCreating } = useAmazonProducts();

  // Load Amazon connection from shop_connections
  useEffect(() => {
    const loadConnection = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('shop_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'amazon')
        .eq('is_connected', true)
        .maybeSingle();
      
      setAmazonConnection(data);
    };
    
    loadConnection();
  }, [user]);

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs.current[sectionId];
    if (ref && contentRef.current) {
      const offsetTop = ref.offsetTop - 120;
      contentRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
    setActiveSection(sectionId);
  };

  // Handle bullet point change
  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index] = value;
    setBulletPoints(newBulletPoints);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        toast.error('Görsel yüklenemedi');
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImages(prev => [...prev, publicUrl]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (mainImageIndex >= index && mainImageIndex > 0) {
      setMainImageIndex(prev => prev - 1);
    }
  };

  // Handle save as draft - saves to marketplace_listings
  const handleSaveAsDraft = async () => {
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        title,
        description,
        price: parseFloat(price) || 0,
        status: "draft",
        platform: "amazon",
        user_id: user.id,
        marketplace_data: {
          images,
          brand,
          sku,
          bulletPoints,
          manufacturer,
          modelNumber,
          partNumber,
          quantity: parseInt(quantity) || 0,
          condition,
          fulfillmentChannel,
          attributes,
          selectedCategory,
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

      toast.success("Taslak kaydedildi");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Kaydetme hatası");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle publish to Amazon
  const handlePublish = async () => {
    if (!title) {
      toast.error("Lütfen ürün başlığı girin");
      return;
    }
    if (!selectedCategory) {
      toast.error("Lütfen kategori seçin");
      return;
    }
    if (!amazonConnection) {
      toast.error("Amazon bağlantısı bulunamadı. Lütfen önce bağlantı kurun.");
      navigate("/connections");
      return;
    }

    setIsPublishing(true);
    try {
      await createProduct({
        sku: sku || `AMZ-${Date.now()}`,
        title,
        description,
        price: parseFloat(price) || 0,
        quantity: parseInt(quantity) || 0,
        condition: condition === "new" ? "new_new" : condition,
      });

      // Save to marketplace_listings
      const listingData = {
        title,
        description,
        price: parseFloat(price) || 0,
        status: "active",
        platform: "amazon",
        user_id: user!.id,
        shop_connection_id: amazonConnection.id,
        marketplace_data: {
          images,
          brand,
          sku,
          quantity: parseInt(quantity) || 0,
        },
      };

      await supabase.from("marketplace_listings").insert(listingData);

      toast.success("Ürün Amazon'a yayınlandı!");
      navigate("/inventory");
    } catch (error: any) {
      console.error("Error publishing to Amazon:", error);
      toast.error(error.message || "Yayınlama hatası");
    } finally {
      setIsPublishing(false);
    }
  };

  // Add variant
  const addVariant = () => {
    setVariants(prev => [...prev, {
      id: `var-${Date.now()}`,
      name: "",
      sku: "",
      price: parseFloat(price) || 0,
      stock: 0,
    }]);
  };

  // Update variant
  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  // Remove variant
  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
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
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/inventory">Envanter</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Amazon Ürün Ekle</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              {!amazonConnection && (
                <Badge variant="destructive" className="mr-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Amazon bağlantısı yok
                </Badge>
              )}
              
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Taslak Kaydet
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !amazonConnection}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Amazon'a Yayınla
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b bg-card px-6">
          <Tabs value={activeSection} onValueChange={scrollToSection}>
            <TabsList className="h-12 bg-transparent gap-1 p-0">
              {mainSections.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="h-12 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <ScrollArea ref={contentRef} className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Basic Info Section */}
              <section
                ref={(el) => (sectionRefs.current["basic"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Temel Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Ürün Başlığı *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ürün başlığını girin"
                        className="mt-1"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {title.length}/200 karakter
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="brand">Marka</Label>
                        <Input
                          id="brand"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="Marka adı"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="manufacturer">Üretici</Label>
                        <Input
                          id="manufacturer"
                          value={manufacturer}
                          onChange={(e) => setManufacturer(e.target.value)}
                          placeholder="Üretici adı"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="modelNumber">Model Numarası</Label>
                        <Input
                          id="modelNumber"
                          value={modelNumber}
                          onChange={(e) => setModelNumber(e.target.value)}
                          placeholder="Model numarası"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="partNumber">Parça Numarası</Label>
                        <Input
                          id="partNumber"
                          value={partNumber}
                          onChange={(e) => setPartNumber(e.target.value)}
                          placeholder="Parça numarası"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <Label>Öne Çıkan Özellikler (Bullet Points)</Label>
                      <div className="space-y-2 mt-2">
                        {bulletPoints.map((point, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                            <Input
                              value={point}
                              onChange={(e) => handleBulletPointChange(index, e.target.value)}
                              placeholder={`Özellik ${index + 1}`}
                              maxLength={500}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ürün açıklamasını girin"
                        className="mt-1"
                        rows={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="searchTerms">Arama Terimleri</Label>
                      <Input
                        id="searchTerms"
                        value={searchTerms}
                        onChange={(e) => setSearchTerms(e.target.value)}
                        placeholder="Arama terimleri (virgülle ayırın)"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Category Section */}
              <section
                ref={(el) => (sectionRefs.current["category"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Kategori
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AmazonCategoryTree
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelect={setSelectedCategory}
                      isLoading={categoriesLoading}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Details Section */}
              <section
                ref={(el) => (sectionRefs.current["details"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Ürün Detayları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCategory ? (
                      <AmazonAttributePanel
                        category={selectedCategory}
                        attributes={attributes}
                        onChange={setAttributes}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Ürün detaylarını görmek için önce kategori seçin.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Pricing Section */}
              <section
                ref={(el) => (sectionRefs.current["pricing"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Fiyat & Stok
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Fiyat</Label>
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salePrice">İndirimli Fiyat</Label>
                        <Input
                          id="salePrice"
                          type="number"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="Stok kodu"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Stok Miktarı</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="condition">Durum</Label>
                        <Select value={condition} onValueChange={setCondition}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Yeni</SelectItem>
                            <SelectItem value="refurbished">Yenilenmiş</SelectItem>
                            <SelectItem value="used_like_new">Kullanılmış - Yeni Gibi</SelectItem>
                            <SelectItem value="used_very_good">Kullanılmış - Çok İyi</SelectItem>
                            <SelectItem value="used_good">Kullanılmış - İyi</SelectItem>
                            <SelectItem value="used_acceptable">Kullanılmış - Kabul Edilebilir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fulfillment">Teslimat Yöntemi</Label>
                        <Select value={fulfillmentChannel} onValueChange={setFulfillmentChannel}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="merchant">Satıcı Tarafından</SelectItem>
                            <SelectItem value="amazon">Amazon FBA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Images Section */}
              <section
                ref={(el) => (sectionRefs.current["images"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Görseller
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                          <img
                            src={img}
                            alt={`Ürün ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === mainImageIndex && (
                            <Badge className="absolute top-1 left-1 bg-primary">Ana</Badge>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => setMainImageIndex(index)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground mt-2">Görsel Ekle</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Variations Section */}
              <section
                ref={(el) => (sectionRefs.current["variations"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Varyantlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {variants.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Henüz varyant eklenmedi</p>
                        <Button onClick={addVariant}>
                          <Plus className="h-4 w-4 mr-2" />
                          Varyant Ekle
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant) => (
                          <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <Input
                              value={variant.name}
                              onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                              placeholder="Varyant adı"
                              className="flex-1"
                            />
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="w-32"
                            />
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                              placeholder="Fiyat"
                              className="w-24"
                            />
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value))}
                              placeholder="Stok"
                              className="w-20"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" onClick={addVariant}>
                          <Plus className="h-4 w-4 mr-2" />
                          Varyant Ekle
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
