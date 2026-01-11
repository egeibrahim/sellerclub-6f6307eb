import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Package, Image as ImageIcon, Send } from "lucide-react";
import type { MasterListing } from "@/hooks/useMasterListings";

interface MasterListingCardProps {
  listing: MasterListing;
  onEdit: (listing: MasterListing) => void;
  onDelete: (id: string) => void;
  onPublish: (listing: MasterListing) => void;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  ikas: 'ikas',
  ciceksepeti: 'Çiçeksepeti',
  amazon_tr: 'Amazon',
  n11: 'N11',
  etsy: 'Etsy',
  ticimax: 'Ticimax',
};

const STATUS_COLORS: Record<string, string> = {
  synced: 'bg-green-500/10 text-green-600 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  syncing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  error: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function MasterListingCard({ listing, onEdit, onDelete, onPublish }: MasterListingCardProps) {
  const primaryImage = listing.images?.find(img => img.is_primary) || listing.images?.[0];
  const variantCount = listing.variants?.length || 0;
  const channelCount = listing.marketplace_products?.length || 0;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {primaryImage ? (
              <img 
                src={primaryImage.url} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">{listing.title}</h3>
                {listing.internal_sku && (
                  <p className="text-sm text-muted-foreground">SKU: {listing.internal_sku}</p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => onPublish(listing)} title="Pazaryerine Yayınla">
                  <Send className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(listing)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(listing.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="font-medium">₺{listing.base_price.toLocaleString('tr-TR')}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                {listing.total_stock} stok
              </span>
              {variantCount > 0 && (
                <span className="text-muted-foreground">{variantCount} varyant</span>
              )}
            </div>

            {/* Channel Status */}
            {channelCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {listing.marketplace_products?.map((mp) => (
                  <Badge 
                    key={mp.id} 
                    variant="outline" 
                    className={`text-xs ${STATUS_COLORS[mp.sync_status]}`}
                  >
                    {MARKETPLACE_LABELS[mp.marketplace_connection?.marketplace || ''] || 'Unknown'}
                    {mp.sync_status === 'error' && ' ⚠'}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
