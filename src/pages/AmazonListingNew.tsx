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

  // Load Amazon connection
  useEffect(() => {
    const loadConnection = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('marketplace', 'amazon')
        .eq('is_active', true)
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
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) {
        toast.error('Görsel yüklenemedi');
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
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

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        title,
        description,
        price: parseFloat(price) || 0,
        stock: parseInt(quantity) || 0,
        status: "draft",
        source: "amazon",
        user_id: user.id,
        images,
        brand,
        sku,
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

      // Save to local database
      const productData = {
        title,
        description,
        price: parseFloat(price) || 0,
        stock: parseInt(quantity) || 0,
        status: "active",
        source: "amazon",
        user_id: user!.id,
        images,
        brand,
        sku,
      };

      await supabase.from("products").insert(productData);

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
                            <span className="text-muted-foreground text-sm w-6">
                              {index + 1}.
                            </span>
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
                      <Label htmlFor="description">Ürün Açıklaması</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detaylı ürün açıklaması..."
                        className="mt-1 min-h-[150px]"
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {description.length}/2000 karakter
                      </p>
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
                      Kategori Seçimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AmazonCategoryTree
                      onCategorySelect={(category) => {
                        setSelectedCategory(category);
                        setAttributes({});
                      }}
                      selectedCategory={selectedCategory}
                    />
                    
                    {selectedCategory && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Seçilen Kategori:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCategory.path.join(" > ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Product Details Section */}
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
                    <AmazonAttributePanel
                      category={selectedCategory}
                      attributes={attributes}
                      onAttributeChange={(key, value) => {
                        setAttributes(prev => ({ ...prev, [key]: value }));
                      }}
                    />
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
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="price">Fiyat (TL) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salePrice">İndirimli Fiyat (TL)</Label>
                        <Input
                          id="salePrice"
                          type="number"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Stok Miktarı *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0"
                          className="mt-1"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU (Stok Kodu)</Label>
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="Benzersiz ürün kodu"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="condition">Ürün Durumu</Label>
                        <Select value={condition} onValueChange={setCondition}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Durumu seçin" />
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
                    </div>

                    <div>
                      <Label htmlFor="fulfillment">Karşılama Yöntemi</Label>
                      <Select value={fulfillmentChannel} onValueChange={setFulfillmentChannel}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Yöntemi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merchant">Satıcı Tarafından Gönderim (MFN)</SelectItem>
                          <SelectItem value="amazon">Amazon Tarafından Gönderim (FBA)</SelectItem>
                        </SelectContent>
                      </Select>
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
                      Ürün Görselleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className={cn(
                            "relative aspect-square border rounded-lg overflow-hidden group cursor-pointer",
                            index === mainImageIndex && "ring-2 ring-primary"
                          )}
                          onClick={() => setMainImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`Ürün görseli ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === mainImageIndex && (
                            <Badge className="absolute top-2 left-2">Ana Görsel</Badge>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Görsel Ekle</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      * İlk görsel ana görsel olarak kullanılır. Tıklayarak ana görseli değiştirebilirsiniz.
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Variations Section */}
              <section
                ref={(el) => (sectionRefs.current["variations"] = el)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Varyantlar
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addVariant}>
                      <Plus className="h-4 w-4 mr-2" />
                      Varyant Ekle
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {variants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Henüz varyant eklenmedi</p>
                        <p className="text-sm">Farklı renk, boyut veya özellikleri olan ürünler için varyant ekleyin</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="flex items-center gap-4 p-4 border rounded-lg"
                          >
                            <div className="flex-1 grid grid-cols-4 gap-4">
                              <Input
                                placeholder="Varyant adı"
                                value={variant.name}
                                onChange={(e) => updateVariant(variant.id, "name", e.target.value)}
                              />
                              <Input
                                placeholder="SKU"
                                value={variant.sku}
                                onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Fiyat"
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, "price", parseFloat(e.target.value) || 0)}
                              />
                              <Input
                                type="number"
                                placeholder="Stok"
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, "stock", parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </ScrollArea>

          {/* Right Sidebar - Summary */}
          <div className="w-80 border-l bg-card p-4 hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <h3 className="font-semibold">Ürün Özeti</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {title ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={title ? "text-foreground" : "text-muted-foreground"}>
                    Ürün başlığı
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedCategory ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={selectedCategory ? "text-foreground" : "text-muted-foreground"}>
                    Kategori seçimi
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {price ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={price ? "text-foreground" : "text-muted-foreground"}>
                    Fiyat bilgisi
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {images.length > 0 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={images.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                    Ürün görselleri ({images.length})
                  </span>
                </div>
              </div>

              {title && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Önizleme</p>
                  <div className="border rounded-lg p-3">
                    {images.length > 0 && (
                      <img
                        src={images[mainImageIndex]}
                        alt="Önizleme"
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                    )}
                    <p className="text-sm font-medium line-clamp-2">{title}</p>
                    {price && (
                      <p className="text-lg font-bold text-primary mt-1">
                        ₺{parseFloat(price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
