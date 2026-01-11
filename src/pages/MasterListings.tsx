import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Package, Loader2, Download, Send, X } from "lucide-react";
import { useMasterListings, type MasterListing } from "@/hooks/useMasterListings";
import { MasterListingCard } from "@/components/master-listings/MasterListingCard";
import { MasterListingDialog } from "@/components/master-listings/MasterListingDialog";
import { ImportWizard } from "@/components/master-listings/ImportWizard";
import { PublishToMarketplaceDialog } from "@/components/master-listings/PublishToMarketplaceDialog";
import { BulkPublishDialog } from "@/components/master-listings/BulkPublishDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function MasterListings() {
  const navigate = useNavigate();
  const { 
    masterListings, 
    isLoading, 
    createMasterListing, 
    updateMasterListing, 
    deleteMasterListing,
    addImage,
    deleteImage,
  } = useMasterListings();

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MasterListing | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [listingToPublish, setListingToPublish] = useState<MasterListing | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPublishDialogOpen, setBulkPublishDialogOpen] = useState(false);

  const filteredListings = masterListings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.internal_sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (listing: MasterListing) => {
    // Navigate to Etsy-style edit page
    navigate(`/master-listings/${listing.id}`);
  };

  const handleDelete = (id: string) => {
    setListingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handlePublish = (listing: MasterListing) => {
    setListingToPublish(listing);
    setPublishDialogOpen(true);
  };

  const confirmDelete = () => {
    if (listingToDelete) {
      deleteMasterListing.mutate(listingToDelete);
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  const handleSave = (data: Partial<MasterListing>) => {
    if (data.id) {
      updateMasterListing.mutate(data as MasterListing & { id: string }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createMasterListing.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleAddImage = (url: string) => {
    if (selectedListing) {
      addImage.mutate({ masterListingId: selectedListing.id, url });
    }
  };

  const handleDeleteImage = (imageId: string) => {
    deleteImage.mutate(imageId);
  };

  const handleCreate = () => {
    // Navigate to Etsy-style create page
    navigate('/master-listings/new');
  };

  // Bulk selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredListings.map(l => l.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkPublish = () => {
    if (selectedIds.size === 0) return;
    setBulkPublishDialogOpen(true);
  };

  const selectedListings = masterListings.filter(l => selectedIds.has(l.id));

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Master Ürünler</h1>
            <p className="text-muted-foreground">
              Tüm pazaryerlerindeki ürünlerinizi merkezi olarak yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportWizardOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              İthal Et
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün
            </Button>
          </div>
        </div>

        {/* Search & Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
          
          {filteredListings.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedIds.size === filteredListings.length && filteredListings.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Tümünü seç</span>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{selectedIds.size} ürün seçildi</span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            </div>
            <Button size="sm" onClick={handleBulkPublish}>
              <Send className="h-4 w-4 mr-2" />
              Toplu Yayınla
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Farklı bir arama terimi deneyin'
                : 'İlk master ürününüzü ekleyerek başlayın'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedIds.has(listing.id)}
                  onCheckedChange={() => toggleSelection(listing.id)}
                />
                <div className="flex-1">
                  <MasterListingCard
                    listing={listing}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <MasterListingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        listing={selectedListing}
        onSave={handleSave}
        onAddImage={handleAddImage}
        onDeleteImage={handleDeleteImage}
        isLoading={createMasterListing.isPending || updateMasterListing.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm pazaryeri bağlantıları da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Wizard */}
      <ImportWizard open={importWizardOpen} onOpenChange={setImportWizardOpen} />

      {/* Publish Dialog */}
      <PublishToMarketplaceDialog 
        open={publishDialogOpen} 
        onOpenChange={setPublishDialogOpen}
        listing={listingToPublish}
      />

      {/* Bulk Publish Dialog */}
      <BulkPublishDialog
        open={bulkPublishDialogOpen}
        onOpenChange={(open) => {
          setBulkPublishDialogOpen(open);
          if (!open) clearSelection();
        }}
        listings={selectedListings}
      />
    </Layout>
  );
}
