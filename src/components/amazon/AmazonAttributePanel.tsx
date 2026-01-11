import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";

interface Category {
  id: string;
  name: string;
  path: string[];
  requiredAttributes?: string[];
}

interface AmazonAttributePanelProps {
  category: Category | null;
  attributes: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
}

// Attribute definitions with labels and options
const ATTRIBUTE_DEFINITIONS: Record<string, {
  label: string;
  type: "text" | "select" | "number";
  options?: string[];
  placeholder?: string;
  description?: string;
}> = {
  brand: {
    label: "Marka",
    type: "text",
    placeholder: "Marka adını girin",
    description: "Ürünün resmi marka adı",
  },
  size: {
    label: "Beden",
    type: "select",
    options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  },
  color: {
    label: "Renk",
    type: "select",
    options: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu", "Mor", "Pembe", "Gri", "Kahverengi", "Lacivert", "Bej"],
  },
  material: {
    label: "Malzeme",
    type: "select",
    options: ["Pamuk", "Polyester", "Yün", "Keten", "İpek", "Deri", "Sentetik", "Karışım", "Plastik", "Metal", "Ahşap", "Cam"],
  },
  screenSize: {
    label: "Ekran Boyutu",
    type: "select",
    options: ["13 inç", "14 inç", "15.6 inç", "17 inç", "21 inç", "24 inç", "27 inç", "32 inç", "34 inç"],
  },
  processor: {
    label: "İşlemci",
    type: "select",
    options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3"],
  },
  ram: {
    label: "RAM",
    type: "select",
    options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
  },
  storage: {
    label: "Depolama",
    type: "select",
    options: ["128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "2 TB SSD", "500 GB HDD", "1 TB HDD", "2 TB HDD"],
  },
  resolution: {
    label: "Çözünürlük",
    type: "select",
    options: ["HD (1280x720)", "Full HD (1920x1080)", "QHD (2560x1440)", "4K UHD (3840x2160)", "5K (5120x2880)"],
  },
  panelType: {
    label: "Panel Tipi",
    type: "select",
    options: ["IPS", "VA", "TN", "OLED", "Mini LED"],
  },
  connectionType: {
    label: "Bağlantı Tipi",
    type: "select",
    options: ["Kablolu", "Kablosuz", "Bluetooth", "USB", "USB-C", "Wi-Fi"],
  },
  layout: {
    label: "Klavye Düzeni",
    type: "select",
    options: ["Türkçe Q", "Türkçe F", "İngilizce US", "İngilizce UK"],
  },
  dpi: {
    label: "DPI",
    type: "select",
    options: ["800", "1600", "3200", "6400", "12800", "25600"],
  },
  operatingSystem: {
    label: "İşletim Sistemi",
    type: "select",
    options: ["Android", "iOS", "Windows", "macOS", "Linux"],
  },
  compatibleModel: {
    label: "Uyumlu Model",
    type: "text",
    placeholder: "Uyumlu telefon modelini girin",
  },
  outputPower: {
    label: "Çıkış Gücü",
    type: "select",
    options: ["5W", "10W", "15W", "18W", "20W", "25W", "30W", "45W", "65W", "100W"],
  },
  noiseCancelling: {
    label: "Gürültü Engelleme",
    type: "select",
    options: ["Var", "Yok", "Hibrit ANC", "Pasif"],
  },
  batteryLife: {
    label: "Pil Ömrü",
    type: "select",
    options: ["4 saat", "6 saat", "8 saat", "10 saat", "12 saat", "24 saat", "30 saat", "40 saat"],
  },
  power: {
    label: "Güç",
    type: "select",
    options: ["5W", "10W", "20W", "40W", "60W", "100W", "200W"],
  },
  style: {
    label: "Stil",
    type: "select",
    options: ["Günlük", "Resmi", "Spor", "Klasik", "Modern", "Vintage", "Minimalist"],
  },
  heelHeight: {
    label: "Topuk Yüksekliği",
    type: "select",
    options: ["Düz", "Alçak (1-4 cm)", "Orta (5-7 cm)", "Yüksek (8-10 cm)", "Çok Yüksek (11+ cm)"],
  },
  sportType: {
    label: "Spor Türü",
    type: "select",
    options: ["Koşu", "Yürüyüş", "Basketbol", "Futbol", "Tenis", "Fitness", "Yoga"],
  },
  capacity: {
    label: "Kapasite",
    type: "text",
    placeholder: "Kapasite değerini girin",
  },
  dimensions: {
    label: "Boyutlar",
    type: "text",
    placeholder: "Genişlik x Derinlik x Yükseklik (cm)",
  },
  bulbType: {
    label: "Ampul Tipi",
    type: "select",
    options: ["LED", "Halojen", "Floresan", "Akkor"],
  },
  skinType: {
    label: "Cilt Tipi",
    type: "select",
    options: ["Normal", "Kuru", "Yağlı", "Karma", "Hassas", "Tüm Cilt Tipleri"],
  },
  volume: {
    label: "Hacim",
    type: "text",
    placeholder: "ml veya L cinsinden",
  },
  activeIngredient: {
    label: "Aktif Bileşen",
    type: "text",
    placeholder: "Ana aktif bileşen",
  },
  shade: {
    label: "Ton",
    type: "text",
    placeholder: "Renk tonu",
  },
  coverage: {
    label: "Kapatıcılık",
    type: "select",
    options: ["Hafif", "Orta", "Tam"],
  },
  finish: {
    label: "Bitiş",
    type: "select",
    options: ["Mat", "Parlak", "Saten", "Metalik", "Glitter"],
  },
  effect: {
    label: "Efekt",
    type: "select",
    options: ["Hacim", "Uzatma", "Kıvırma", "Kalınlaştırma"],
  },
  hairType: {
    label: "Saç Tipi",
    type: "select",
    options: ["Normal", "Kuru", "Yağlı", "Boyalı", "Kıvırcık", "Düz", "İnce", "Kalın"],
  },
  holdLevel: {
    label: "Tutuş Seviyesi",
    type: "select",
    options: ["Hafif", "Orta", "Güçlü", "Ekstra Güçlü"],
  },
  type: {
    label: "Tip",
    type: "text",
    placeholder: "Ürün tipini girin",
  },
  weight: {
    label: "Ağırlık",
    type: "text",
    placeholder: "kg veya g cinsinden",
  },
  ageRange: {
    label: "Yaş Aralığı",
    type: "select",
    options: ["0-6 ay", "6-12 ay", "1-2 yaş", "3-5 yaş", "6-8 yaş", "9-11 yaş", "12+ yaş", "Yetişkin"],
  },
  playerCount: {
    label: "Oyuncu Sayısı",
    type: "select",
    options: ["1 oyuncu", "2 oyuncu", "2-4 oyuncu", "2-6 oyuncu", "4+ oyuncu"],
  },
  count: {
    label: "Adet",
    type: "number",
    placeholder: "Adet sayısını girin",
  },
  maxWeight: {
    label: "Maksimum Ağırlık",
    type: "text",
    placeholder: "kg cinsinden",
  },
};

export function AmazonAttributePanel({
  category,
  attributes,
  onAttributeChange,
}: AmazonAttributePanelProps) {
  if (!category) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Ürün detaylarını görmek için önce kategori seçin</p>
      </div>
    );
  }

  const requiredAttributes = category.requiredAttributes || [];

  if (requiredAttributes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Bu kategori için zorunlu özellik bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Badge variant="outline">{category.name}</Badge>
        <span className="text-sm text-muted-foreground">
          {requiredAttributes.length} zorunlu özellik
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {requiredAttributes.map((attrKey) => {
          const definition = ATTRIBUTE_DEFINITIONS[attrKey];
          
          if (!definition) {
            return (
              <div key={attrKey}>
                <Label htmlFor={attrKey} className="capitalize">
                  {attrKey.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <Input
                  id={attrKey}
                  value={attributes[attrKey] || ""}
                  onChange={(e) => onAttributeChange(attrKey, e.target.value)}
                  className="mt-1"
                />
              </div>
            );
          }

          return (
            <div key={attrKey}>
              <Label htmlFor={attrKey}>
                {definition.label}
                <span className="text-destructive ml-1">*</span>
              </Label>
              
              {definition.type === "select" && definition.options ? (
                <Select
                  value={attributes[attrKey] || ""}
                  onValueChange={(value) => onAttributeChange(attrKey, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`${definition.label} seçin`} />
                  </SelectTrigger>
                  <SelectContent>
                    {definition.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : definition.type === "number" ? (
                <Input
                  id={attrKey}
                  type="number"
                  value={attributes[attrKey] || ""}
                  onChange={(e) => onAttributeChange(attrKey, e.target.value)}
                  placeholder={definition.placeholder}
                  className="mt-1"
                />
              ) : (
                <Input
                  id={attrKey}
                  value={attributes[attrKey] || ""}
                  onChange={(e) => onAttributeChange(attrKey, e.target.value)}
                  placeholder={definition.placeholder}
                  className="mt-1"
                />
              )}
              
              {definition.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {definition.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
