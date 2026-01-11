import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Upload, 
  ChevronDown,
  Layers,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPlatformConfig, type PlatformConfig } from "@/config/platformConfigs";
import { ListingEditorHeader } from "./ListingEditorHeader";
import { ListingEditorFooter } from "./ListingEditorFooter";
import { PhotosSection } from "./sections/PhotosSection";
import { TitleSection } from "./sections/TitleSection";
import { DescriptionSection } from "./sections/DescriptionSection";
import { TagsSection } from "./sections/TagsSection";
import { DetailsSection } from "./sections/DetailsSection";
import { PriceSection } from "./sections/PriceSection";
import { InventorySection } from "./sections/InventorySection";
import { VariationsSection } from "./sections/VariationsSection";
import { ShippingSection } from "./sections/ShippingSection";
import { CategorySection } from "./sections/CategorySection";

// Tab definitions based on platform
const getTabsForPlatform = (platform: string) => {
  const baseTabs = [
    { id: "photos", label: "Photos" },
    { id: "video", label: "Video" },
    { id: "title", label: "Title" },
    { id: "description", label: "Description" },
    { id: "tags", label: "Tags" },
    { id: "details", label: "Details" },
    { id: "price", label: "Price" },
    { id: "inventory", label: "Inventory" },
    { id: "variations", label: "Variations" },
    { id: "shipping", label: "Shipping" },
  ];

  // Add platform-specific tabs
  if (platform === "etsy") {
    baseTabs.splice(9, 0, { id: "personalization", label: "Personalization" });
  }

  if (platform === "amazon") {
    baseTabs.splice(5, 0, { id: "bulletpoints", label: "Bullet Points" });
  }

  return baseTabs;
};

export interface ListingFormData {
  title: string;
  description: string;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  quantity: number;
  sku: string;
  category: string;
  categoryPath: string[];
  brand: string;
  images: string[];
  videoUrl?: string;
  weight?: number;
  weightUnit?: string;
  variations: Array<{
    name: string;
    options: string[];
    prices?: number[];
    quantities?: number[];
  }>;
  customFields: Record<string, string | number>;
  shippingProfile?: string;
  personalizationEnabled?: boolean;
  personalizationInstructions?: string;
}

interface VelaListingEditorProps {
  platform: string;
  shopId?: string;
  shopName?: string;
  shopColor?: string;
  shopIcon?: string;
  initialData?: Partial<ListingFormData>;
  listingId?: string;
  mode?: 'create' | 'edit';
}

export function VelaListingEditor({
  platform,
  shopId,
  shopName,
  shopColor,
  shopIcon,
  initialData,
  listingId,
  mode = 'create',
}: VelaListingEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const config = getPlatformConfig(platform);
  const tabs = getTabsForPlatform(platform);

  const [activeTab, setActiveTab] = useState("photos");
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState<ListingFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    tags: initialData?.tags || [],
    price: initialData?.price || 0,
    compareAtPrice: initialData?.compareAtPrice,
    quantity: initialData?.quantity || 1,
    sku: initialData?.sku || "",
    category: initialData?.category || "",
    categoryPath: initialData?.categoryPath || [],
    brand: initialData?.brand || "",
    images: initialData?.images || [],
    videoUrl: initialData?.videoUrl,
    weight: initialData?.weight,
    weightUnit: initialData?.weightUnit || "kg",
    variations: initialData?.variations || [],
    customFields: initialData?.customFields || {},
    shippingProfile: initialData?.shippingProfile,
    personalizationEnabled: initialData?.personalizationEnabled || false,
    personalizationInstructions: initialData?.personalizationInstructions,
  });

  // Section refs for scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const ref = sectionRefs.current[sectionId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Başlık zorunludur";
    } else if (formData.title.length > config.titleMaxLength) {
      errors.title = `Başlık ${config.titleMaxLength} karakteri aşmamalı`;
    }

    if (formData.description.length > config.descriptionMaxLength) {
      errors.description = `Açıklama ${config.descriptionMaxLength} karakteri aşmamalı`;
    }

    if (config.requiresCategory && !formData.category) {
      errors.category = "Kategori seçimi zorunludur";
    }

    if (config.requiresBrand && !formData.brand.trim()) {
      errors.brand = "Marka zorunludur";
    }

    if (formData.images.length < config.minImages) {
      errors.images = `En az ${config.minImages} görsel gereklidir`;
    }

    if (config.maxTags && formData.tags.length > config.maxTags) {
      errors.tags = `En fazla ${config.maxTags} etiket eklenebilir`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = async (status: 'active' | 'draft' | 'staging') => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    if (status === 'active' && !validateForm()) {
      toast.error("Lütfen eksik alanları doldurun");
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        user_id: user.id,
        shop_connection_id: shopId || null,
        platform: platform,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price || null,
        status: status,
        marketplace_data: {
          sku: formData.sku.trim() || null,
          category: formData.category,
          categoryPath: formData.categoryPath,
          brand: formData.brand.trim() || null,
          quantity: formData.quantity,
          tags: formData.tags,
          images: formData.images,
          videoUrl: formData.videoUrl || null,
          weight: formData.weight,
          weightUnit: formData.weightUnit,
          variations: formData.variations,
          customFields: formData.customFields,
          shippingProfile: formData.shippingProfile,
          personalizationEnabled: formData.personalizationEnabled,
          personalizationInstructions: formData.personalizationInstructions,
        },
      };

      if (mode === 'edit' && listingId) {
        const { error } = await supabase
          .from('marketplace_listings')
          .update(listingData)
          .eq('id', listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('marketplace_listings')
          .insert(listingData);
        if (error) throw error;
      }

      const statusMessages: Record<string, string> = {
        active: 'yayınlandı',
        draft: 'taslak olarak kaydedildi',
        staging: 'staging olarak kaydedildi',
      };

      toast.success(`Ürün ${statusMessages[status]}`);
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving listing:', error);
      toast.error("Ürün kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsProfile = () => {
    toast.info("Profile kaydetme özelliği yakında eklenecek");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <ListingEditorHeader
        platform={platform}
        shopName={shopName}
        shopColor={shopColor}
        shopIcon={shopIcon}
        mode={mode}
        config={config}
      />

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex gap-1 px-6 py-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {validationErrors[tab.id] && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: shopColor || config.color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Selector Banner */}
      <div 
        className="px-6 py-3 border-b border-border"
        style={{ backgroundColor: `${shopColor || config.color}15` }}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Select>
            <SelectTrigger className="w-[200px] bg-transparent border-none shadow-none hover:bg-white/50">
              <SelectValue placeholder="Choose Profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Profile</SelectItem>
              <SelectItem value="premium">Premium Products</SelectItem>
              <SelectItem value="sale">Sale Items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Sections */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 pb-24 space-y-8">
          {/* Photos Section */}
          <div ref={(el) => { sectionRefs.current["photos"] = el; }}>
            <PhotosSection
              images={formData.images}
              onImagesChange={(images) => updateFormData({ images })}
              config={config}
              error={validationErrors.images}
            />
          </div>

          {/* Video Section */}
          <div ref={(el) => { sectionRefs.current["video"] = el; }} className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Video</h2>
            <div className="w-64 h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
              <span className="text-sm text-primary font-medium">ADD</span>
              <span className="text-xs text-muted-foreground">Max file size: 100 MB</span>
            </div>
          </div>

          {/* Title Section */}
          <div ref={(el) => { sectionRefs.current["title"] = el; }} className="border-t border-border pt-8">
            <TitleSection
              title={formData.title}
              onTitleChange={(title) => updateFormData({ title })}
              config={config}
              error={validationErrors.title}
            />
          </div>

          {/* Description Section */}
          <div ref={(el) => { sectionRefs.current["description"] = el; }} className="border-t border-border pt-8">
            <DescriptionSection
              description={formData.description}
              onDescriptionChange={(description) => updateFormData({ description })}
              config={config}
              error={validationErrors.description}
            />
          </div>

          {/* Tags Section */}
          <div ref={(el) => { sectionRefs.current["tags"] = el; }} className="border-t border-border pt-8">
            <TagsSection
              tags={formData.tags}
              onTagsChange={(tags) => updateFormData({ tags })}
              config={config}
              error={validationErrors.tags}
            />
          </div>

          {/* Category Section (if required) */}
          {config.requiresCategory && (
            <div ref={(el) => { sectionRefs.current["category"] = el; }} className="border-t border-border pt-8">
              <CategorySection
                platform={platform}
                category={formData.category}
                categoryPath={formData.categoryPath}
                onCategoryChange={(category, categoryPath) => updateFormData({ category, categoryPath })}
                error={validationErrors.category}
              />
            </div>
          )}

          {/* Details Section */}
          <div ref={(el) => { sectionRefs.current["details"] = el; }} className="border-t border-border pt-8">
            <DetailsSection
              brand={formData.brand}
              onBrandChange={(brand) => updateFormData({ brand })}
              customFields={formData.customFields}
              onCustomFieldsChange={(customFields) => updateFormData({ customFields })}
              config={config}
              error={validationErrors.brand}
            />
          </div>

          {/* Bullet Points (Amazon only) */}
          {platform === "amazon" && (
            <div ref={(el) => { sectionRefs.current["bulletpoints"] = el; }} className="border-t border-border pt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Bullet Points</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <Label className="text-sm text-muted-foreground mb-1 block">
                      Bullet Point {num}
                    </Label>
                    <Input
                      value={formData.customFields[`bulletPoint${num}`] || ""}
                      onChange={(e) => updateFormData({
                        customFields: {
                          ...formData.customFields,
                          [`bulletPoint${num}`]: e.target.value,
                        }
                      })}
                      placeholder={`Feature ${num}`}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {500 - (String(formData.customFields[`bulletPoint${num}`] || "").length)} karakter kaldı
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Section */}
          <div ref={(el) => { sectionRefs.current["price"] = el; }} className="border-t border-border pt-8">
            <PriceSection
              price={formData.price}
              compareAtPrice={formData.compareAtPrice}
              onPriceChange={(price) => updateFormData({ price })}
              onCompareAtPriceChange={(compareAtPrice) => updateFormData({ compareAtPrice })}
              config={config}
            />
          </div>

          {/* Inventory Section */}
          <div ref={(el) => { sectionRefs.current["inventory"] = el; }} className="border-t border-border pt-8">
            <InventorySection
              quantity={formData.quantity}
              sku={formData.sku}
              onQuantityChange={(quantity) => updateFormData({ quantity })}
              onSkuChange={(sku) => updateFormData({ sku })}
              config={config}
            />
          </div>

          {/* Variations Section */}
          <div ref={(el) => { sectionRefs.current["variations"] = el; }} className="border-t border-border pt-8">
            <VariationsSection
              variations={formData.variations}
              onVariationsChange={(variations) => updateFormData({ variations })}
              config={config}
            />
          </div>

          {/* Personalization Section (Etsy only) */}
          {platform === "etsy" && (
            <div ref={(el) => { sectionRefs.current["personalization"] = el; }} className="border-t border-border pt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Personalization</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Enable personalization</Label>
                  <input
                    type="checkbox"
                    checked={formData.personalizationEnabled}
                    onChange={(e) => updateFormData({ personalizationEnabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                {formData.personalizationEnabled && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">
                      Instructions for buyers
                    </Label>
                    <Textarea
                      value={formData.personalizationInstructions || ""}
                      onChange={(e) => updateFormData({ personalizationInstructions: e.target.value })}
                      placeholder="Tell buyers what info you need for personalization..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Section */}
          <div ref={(el) => { sectionRefs.current["shipping"] = el; }} className="border-t border-border pt-8">
            <ShippingSection
              shippingProfile={formData.shippingProfile}
              weight={formData.weight}
              weightUnit={formData.weightUnit}
              onShippingProfileChange={(shippingProfile) => updateFormData({ shippingProfile })}
              onWeightChange={(weight) => updateFormData({ weight })}
              onWeightUnitChange={(weightUnit) => updateFormData({ weightUnit })}
              config={config}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <ListingEditorFooter
        onCancel={handleCancel}
        onSaveAsProfile={handleSaveAsProfile}
        onPublish={handlePublish}
        isLoading={isSaving}
        shopColor={shopColor || config.color}
      />
    </div>
  );
}
