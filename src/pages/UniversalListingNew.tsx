import { useParams } from "react-router-dom";
import { useShop } from "@/contexts/ShopContext";
import { VelaListingEditor } from "@/components/listing-editor/VelaListingEditor";

export default function UniversalListingNew() {
  const { platform } = useParams<{ platform?: string }>();
  const { selectedShop } = useShop();
  
  // Determine platform from URL param or selected shop
  const activePlatform = platform || selectedShop?.platform?.toLowerCase() || 'etsy';
  
  return (
    <VelaListingEditor
      platform={activePlatform}
      shopId={selectedShop?.id !== 'master' ? selectedShop?.id : undefined}
      shopName={selectedShop?.name}
      shopColor={selectedShop?.color}
      shopIcon={selectedShop?.icon}
      mode="create"
    />
  );
}
