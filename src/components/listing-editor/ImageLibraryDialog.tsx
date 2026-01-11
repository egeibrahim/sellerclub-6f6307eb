import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ImageIcon, Check, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StorageImage {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

interface ImageLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  maxSelectable?: number;
  currentCount?: number;
}

export function ImageLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  maxSelectable = 10,
  currentCount = 0,
}: ImageLibraryDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const remainingSlots = maxSelectable - currentCount;

  // Fetch images from storage bucket
  const { data: images, isLoading } = useQuery({
    queryKey: ['library-images', user?.id],
    queryFn: async (): Promise<StorageImage[]> => {
      if (!user?.id) return [];

      const { data: files, error } = await supabase.storage
        .from('product-images')
        .list(user.id, {
          limit: 200,
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
        }));
    },
    enabled: !!user?.id && open,
  });

  const filteredImages = images?.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleImageSelection = (url: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        if (next.size < remainingSlots) {
          next.add(url);
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedImages));
    setSelectedImages(new Set());
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedImages(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle>Görsel Kütüphanesi</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Studio'dan görsel seçin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedImages.size} / {remainingSlots} seçilebilir
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Görsel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Images Grid */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {isLoading ? (
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {[...Array(18)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "Sonuç bulunamadı" : "Henüz görsel yok"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? "Farklı bir arama terimi deneyin" 
                    : "Studio'ya görsel yükleyerek başlayın"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredImages.map((image) => {
                  const isSelected = selectedImages.has(image.url);
                  const isDisabled = !isSelected && selectedImages.size >= remainingSlots;
                  
                  return (
                    <button
                      key={image.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleImageSelection(image.url)}
                      className={cn(
                        "relative aspect-square rounded-lg border overflow-hidden group transition-all",
                        isSelected 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Selection Overlay */}
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-opacity",
                        isSelected 
                          ? "bg-primary/20 opacity-100" 
                          : "bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100"
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground scale-110" 
                            : "border-white bg-black/20"
                        )}>
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                      
                      {/* Image Name on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{image.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {filteredImages.length} görsel mevcut
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedImages.size === 0}
            >
              {selectedImages.size > 0 
                ? `${selectedImages.size} Görsel Ekle` 
                : "Görsel Seç"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
