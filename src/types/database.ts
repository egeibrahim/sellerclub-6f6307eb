export type ListingStatus = 'draft' | 'active' | 'archived';
export type ProductStatus = 'draft' | 'active' | 'synced' | 'error';

export interface Profile {
  id: string;
  user_id: string;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  sku: string | null;
  category: string | null;
  tags: string[] | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  user_id: string;
  url: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ListingVariant {
  id: string;
  listing_id: string;
  user_id: string;
  name: string;
  option_value: string;
  sku: string | null;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  variant_id: string;
  user_id: string;
  previous_quantity: number;
  new_quantity: number;
  change_reason: string | null;
  created_at: string;
}

export interface ListingWithDetails extends Listing {
  images?: ListingImage[];
  variants?: ListingVariant[];
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  required_fields: string[];
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  listing_id: string | null;
  marketplace_category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  brand: string | null;
  status: ProductStatus;
  trendyol_synced: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  marketplace_category?: MarketplaceCategory;
}
