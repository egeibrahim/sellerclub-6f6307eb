import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ImageIcon, 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Trash2, 
  Download,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StorageImage {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size?: number;
}

export default function Studio() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Fetch images from storage bucket
  const { data: images, isLoading, refetch } = useQuery({
    queryKey: ['studio-images', user?.id],
    queryFn: async (): Promise<StorageImage[]> => {
      if (!user?.id) return [];

      const { data: files, error } = await supabase.storage
        .from('product-images')
        .list(user.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching images:', error);
        return [];
      }

      return files
        .filter(f => !f.name.startsWith('.'))
        .map(file => ({
          id: file.id || file.name,
          name: file.name,
          url: supabase.storage.from('product-images').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl,
          created_at: file.created_at || new Date().toISOString(),
          size: file.metadata?.size,
        }));
    },
    enabled: !!user?.id,
  });

  const filteredImages = images?.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name}`;
      await supabase.storage
        .from('product-images')
        .upload(`${user.id}/${fileName}`, file);
    }
    
    refetch();
  };

  const handleDelete = async () => {
    if (!user?.id || selectedImages.size === 0) return;

    const filesToDelete = Array.from(selectedImages).map(id => {
      const img = images?.find(i => i.id === id);
      return img ? `${user.id}/${img.name}` : null;
    }).filter(Boolean) as string[];

    await supabase.storage.from('product-images').remove(filesToDelete);
    setSelectedImages(new Set());
    refetch();
  };

  return (
    <Layout showHeader={false}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Studio</h1>
              <p className="text-xs text-muted-foreground">Tüm ürün görselleri</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Görsel ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 rounded-none rounded-l-md", viewMode === 'grid' && "bg-muted")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 rounded-none rounded-r-md", viewMode === 'list' && "bg-muted")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload button */}
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Upload
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedImages.size > 0 && (
          <div className="flex items-center justify-between px-6 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm text-muted-foreground">
              {selectedImages.size} görsel seçildi
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                İndir
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "space-y-2"
            )}>
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "aspect-square" : "h-16 w-full"} />
              ))}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Henüz görsel yok</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ürün görselleri sync edildiğinde veya yüklendiğinde burada görünecek.
              </p>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button className="gap-2 cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Görsel Yükle
                  </span>
                </Button>
              </label>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative aspect-square rounded-lg border overflow-hidden cursor-pointer group",
                    selectedImages.has(image.id) 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={cn(
                    "absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                    selectedImages.has(image.id) && "opacity-100"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      selectedImages.has(image.id) 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-foreground"
                    )}>
                      {selectedImages.has(image.id) && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border cursor-pointer",
                    selectedImages.has(image.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <div className="w-12 h-12 rounded border border-border overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  {image.size && (
                    <span className="text-xs text-muted-foreground">
                      {(image.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
