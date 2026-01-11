import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import type { MasterListing } from "@/hooks/useMasterListings";

interface MasterListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MasterListing | null;
  onSave: (data: Partial<MasterListing>) => void;
  onAddImage?: (url: string) => void;
  onDeleteImage?: (imageId: string) => void;
  isLoading?: boolean;
}

export function MasterListingDialog({
  open,
  onOpenChange,
  listing,
  onSave,
  onAddImage,
  onDeleteImage,
  isLoading,
}: MasterListingDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    base_price: 0,
    total_stock: 0,
    internal_sku: '',
    brand: '',
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title,
        description: listing.description || '',
        base_price: listing.base_price,
        total_stock: listing.total_stock,
        internal_sku: listing.internal_sku || '',
        brand: listing.brand || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        base_price: 0,
        total_stock: 0,
        internal_sku: '',
        brand: '',
      });
    }
  }, [listing]);

  const handleSubmit = () => {
    onSave({
      ...formData,
      id: listing?.id,
    });
  };

  const handleAddImage = () => {
    if (newImageUrl && onAddImage) {
      onAddImage(newImageUrl);
      setNewImageUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Genel</TabsTrigger>
            <TabsTrigger value="images" disabled={!listing}>Görseller</TabsTrigger>
            <TabsTrigger value="attributes" disabled={!listing}>Özellikler</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Ürün Başlığı</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ürün başlığını girin"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ürün açıklaması"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="base_price">Fiyat (₺)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_stock">Stok</Label>
                  <Input
                    id="total_stock"
                    type="number"
                    value={formData.total_stock}
                    onChange={(e) => setFormData({ ...formData, total_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="internal_sku">SKU</Label>
                  <Input
                    id="internal_sku"
                    value={formData.internal_sku}
                    onChange={(e) => setFormData({ ...formData, internal_sku: e.target.value })}
                    placeholder="Dahili stok kodu"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marka</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Marka adı"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <div className="space-y-4">
              {/* Add image input */}
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Görsel URL'si yapıştırın"
                  className="flex-1"
                />
                <Button onClick={handleAddImage} disabled={!newImageUrl}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ekle
                </Button>
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-3 gap-3">
                {listing?.images?.map((image) => (
                  <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {image.is_primary && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                        Ana
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteImage?.(image.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(!listing?.images || listing.images.length === 0) && (
                  <div className="col-span-3 flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">Henüz görsel yok</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ürün özellikleri pazaryerlerine göre otomatik olarak eşleştirilecektir.
              </p>
              {listing?.normalized_attributes && Object.keys(listing.normalized_attributes).length > 0 ? (
                <div className="grid gap-2">
                  {Object.entries(listing.normalized_attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henüz özellik tanımlanmamış
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.title}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {listing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
