import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Plus, 
  Search, 
  ChevronRight,
  Edit2,
  Trash2,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock profile data - in real app, this would come from database
interface Profile {
  id: string;
  name: string;
  type: 'pricing' | 'variation' | 'shipping';
  itemCount: number;
  description?: string;
}

const mockProfiles: Profile[] = [
  { id: '1', name: 'Front view prices', type: 'pricing', itemCount: 156, description: 'Standard front-facing product images' },
  { id: '2', name: 'Front-Back View Prices', type: 'pricing', itemCount: 89, description: 'Products with both front and back views' },
  { id: '3', name: 'Size Variations', type: 'variation', itemCount: 234, description: 'S, M, L, XL size options' },
  { id: '4', name: 'Color Variations', type: 'variation', itemCount: 178, description: 'Multiple color options' },
  { id: '5', name: 'Standard Shipping', type: 'shipping', itemCount: 312, description: '3-5 business days' },
  { id: '6', name: 'Express Shipping', type: 'shipping', itemCount: 45, description: '1-2 business days' },
];

const profileTypes = [
  { key: 'all', label: 'Tümü' },
  { key: 'pricing', label: 'Fiyatlandırma' },
  { key: 'variation', label: 'Varyasyonlar' },
  { key: 'shipping', label: 'Kargo' },
];

export default function Profiles() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading] = useState(false);

  const filteredProfiles = mockProfiles.filter(profile => {
    const matchesType = selectedType === 'all' || profile.type === selectedType;
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pricing': return 'bg-primary/10 text-primary';
      case 'variation': return 'bg-warning/10 text-warning';
      case 'shipping': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="flex h-full">
        {/* Sidebar - Profile Types */}
        <div className="w-56 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Profil Türleri</h2>
          </div>
          <div className="flex-1 py-2">
            {profileTypes.map((type) => (
              <div
                key={type.key}
                className={cn(
                  "flex items-center justify-between px-4 py-2 cursor-pointer transition-colors",
                  selectedType === type.key
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedType(type.key)}
              >
                <span className="text-sm">{type.label}</span>
                <span className="text-xs text-muted-foreground">
                  {type.key === 'all' 
                    ? mockProfiles.length 
                    : mockProfiles.filter(p => p.type === type.key).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Profiller</h1>
                <p className="text-xs text-muted-foreground">Ürün profil ve varyasyon yönetimi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Profil ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Profil
              </Button>
            </div>
          </div>

          {/* Profile List */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Profil bulunamadı</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Henüz bu kategoride profil yok.
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yeni Profil Oluştur
                </Button>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors group",
                      selectedProfile?.id === profile.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{profile.name}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          getTypeColor(profile.type)
                        )}>
                          {profile.type === 'pricing' ? 'Fiyat' : 
                           profile.type === 'variation' ? 'Varyasyon' : 'Kargo'}
                        </span>
                      </div>
                      {profile.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {profile.itemCount} ürün
                      </span>

                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Detail Panel */}
        {selectedProfile && (
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Profil Detayları</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedProfile(null)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Profil Adı</label>
                <p className="font-medium">{selectedProfile.name}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tür</label>
                <p className="font-medium capitalize">{selectedProfile.type}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Açıklama</label>
                <p className="text-sm text-muted-foreground">
                  {selectedProfile.description || 'Açıklama yok'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ürün Sayısı</label>
                <p className="font-medium">{selectedProfile.itemCount}</p>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button className="w-full gap-2">
                  <Edit2 className="h-4 w-4" />
                  Profili Düzenle
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  Ürünleri Görüntüle
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
