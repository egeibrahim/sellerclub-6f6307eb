export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attribute_mappings: {
        Row: {
          created_at: string
          id: string
          source_attribute: string
          source_marketplace: Database["public"]["Enums"]["marketplace_id"]
          source_value: string | null
          target_attribute_id: string
          target_attribute_name: string
          target_marketplace: Database["public"]["Enums"]["marketplace_id"]
          target_value_id: string | null
          target_value_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          source_attribute: string
          source_marketplace: Database["public"]["Enums"]["marketplace_id"]
          source_value?: string | null
          target_attribute_id: string
          target_attribute_name: string
          target_marketplace: Database["public"]["Enums"]["marketplace_id"]
          target_value_id?: string | null
          target_value_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          source_attribute?: string
          source_marketplace?: Database["public"]["Enums"]["marketplace_id"]
          source_value?: string | null
          target_attribute_id?: string
          target_attribute_name?: string
          target_marketplace?: Database["public"]["Enums"]["marketplace_id"]
          target_value_id?: string | null
          target_value_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      category_mappings: {
        Row: {
          confidence_score: number | null
          created_at: string
          created_by: string
          id: string
          is_verified: boolean
          source_category_id: string
          source_category_name: string
          source_marketplace: Database["public"]["Enums"]["marketplace_id"]
          target_category_id: string
          target_category_name: string
          target_marketplace: Database["public"]["Enums"]["marketplace_id"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          id?: string
          is_verified?: boolean
          source_category_id: string
          source_category_name: string
          source_marketplace: Database["public"]["Enums"]["marketplace_id"]
          target_category_id: string
          target_category_name: string
          target_marketplace: Database["public"]["Enums"]["marketplace_id"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          id?: string
          is_verified?: boolean
          source_category_id?: string
          source_category_name?: string
          source_marketplace?: Database["public"]["Enums"]["marketplace_id"]
          target_category_id?: string
          target_category_name?: string
          target_marketplace?: Database["public"]["Enums"]["marketplace_id"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_reason: string | null
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number
          user_id: string
          variant_id: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          id?: string
          new_quantity: number
          previous_quantity: number
          user_id: string
          variant_id: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "listing_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          listing_id: string
          sort_order: number
          storage_path: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          listing_id: string
          sort_order?: number
          storage_path: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          listing_id?: string
          sort_order?: number
          storage_path?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_variants: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          low_stock_threshold: number
          name: string
          option_value: string
          price_adjustment: number
          sku: string | null
          stock_quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          low_stock_threshold?: number
          name: string
          option_value: string
          price_adjustment?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          low_stock_threshold?: number
          name?: string
          option_value?: string
          price_adjustment?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_variants_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          price: number
          sku: string | null
          status: Database["public"]["Enums"]["listing_status"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          sku?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      low_stock_alerts: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          is_read: boolean
          master_listing_id: string | null
          product_title: string
          threshold: number
          user_id: string
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          is_read?: boolean
          master_listing_id?: string | null
          product_title: string
          threshold?: number
          user_id: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          is_read?: boolean
          master_listing_id?: string | null
          product_title?: string
          threshold?: number
          user_id?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_alerts_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_alerts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "master_listing_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string
          full_path: string | null
          id: string
          marketplace_id: string | null
          name: string
          parent_id: string | null
          remote_id: string | null
          required_fields: string[]
        }
        Insert: {
          created_at?: string
          full_path?: string | null
          id?: string
          marketplace_id?: string | null
          name: string
          parent_id?: string | null
          remote_id?: string | null
          required_fields?: string[]
        }
        Update: {
          created_at?: string
          full_path?: string | null
          id?: string
          marketplace_id?: string | null
          name?: string
          parent_id?: string | null
          remote_id?: string | null
          required_fields?: string[]
        }
        Relationships: []
      }
      marketplace_connections: {
        Row: {
          created_at: string
          credentials: Json | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          marketplace: Database["public"]["Enums"]["marketplace_id"]
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          marketplace: Database["public"]["Enums"]["marketplace_id"]
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          marketplace?: Database["public"]["Enums"]["marketplace_id"]
          store_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          marketplace_connection_id: string
          marketplace_specific_data: Json | null
          master_listing_id: string
          price_markup: number
          remote_category_id: string | null
          remote_category_name: string | null
          remote_product_id: string | null
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          marketplace_connection_id: string
          marketplace_specific_data?: Json | null
          master_listing_id: string
          price_markup?: number
          remote_category_id?: string | null
          remote_category_name?: string | null
          remote_product_id?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          marketplace_connection_id?: string
          marketplace_specific_data?: Json | null
          master_listing_id?: string
          price_markup?: number
          remote_category_id?: string | null
          remote_category_name?: string | null
          remote_product_id?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_marketplace_connection_id_fkey"
            columns: ["marketplace_connection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_products_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      master_listing_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          master_listing_id: string
          sort_order: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          master_listing_id: string
          sort_order?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          master_listing_id?: string
          sort_order?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_listing_images_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      master_listing_variants: {
        Row: {
          attributes: Json | null
          color_code: string | null
          created_at: string
          id: string
          images: string[] | null
          is_visible: boolean | null
          master_listing_id: string
          name: string
          option_values: Json | null
          price_adjustment: number
          processing_time: string | null
          sku: string | null
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          color_code?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          master_listing_id: string
          name: string
          option_values?: Json | null
          price_adjustment?: number
          processing_time?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attributes?: Json | null
          color_code?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          master_listing_id?: string
          name?: string
          option_values?: Json | null
          price_adjustment?: number
          processing_time?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_listing_variants_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      master_listings: {
        Row: {
          base_price: number
          brand: string | null
          created_at: string
          description: string | null
          id: string
          internal_sku: string | null
          low_stock_threshold: number
          materials: string | null
          normalized_attributes: Json | null
          personalization_enabled: boolean | null
          personalization_instructions: string | null
          shipping_profile_id: string | null
          source_category_id: string | null
          source_category_path: string | null
          source_marketplace: string | null
          tags: string[] | null
          title: string
          total_stock: number
          updated_at: string
          user_id: string
          variant_options: Json | null
          what_is_it: string | null
          when_made: string | null
          who_made_it: string | null
        }
        Insert: {
          base_price?: number
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_sku?: string | null
          low_stock_threshold?: number
          materials?: string | null
          normalized_attributes?: Json | null
          personalization_enabled?: boolean | null
          personalization_instructions?: string | null
          shipping_profile_id?: string | null
          source_category_id?: string | null
          source_category_path?: string | null
          source_marketplace?: string | null
          tags?: string[] | null
          title: string
          total_stock?: number
          updated_at?: string
          user_id: string
          variant_options?: Json | null
          what_is_it?: string | null
          when_made?: string | null
          who_made_it?: string | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_sku?: string | null
          low_stock_threshold?: number
          materials?: string | null
          normalized_attributes?: Json | null
          personalization_enabled?: boolean | null
          personalization_instructions?: string | null
          shipping_profile_id?: string | null
          source_category_id?: string | null
          source_category_path?: string | null
          source_marketplace?: string | null
          tags?: string[] | null
          title?: string
          total_stock?: number
          updated_at?: string
          user_id?: string
          variant_options?: Json | null
          what_is_it?: string | null
          when_made?: string | null
          who_made_it?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          billing_address: Json | null
          cancelled_date: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_date: string | null
          id: string
          items: Json
          marketplace: string
          marketplace_connection_id: string | null
          marketplace_data: Json | null
          notes: string | null
          order_date: string
          order_number: string | null
          payment_method: string | null
          payment_status: string | null
          remote_order_id: string
          shipped_date: string | null
          shipping_address: Json | null
          shipping_cost: number
          status: string
          status_synced_at: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_company: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          cancelled_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_date?: string | null
          id?: string
          items?: Json
          marketplace: string
          marketplace_connection_id?: string | null
          marketplace_data?: Json | null
          notes?: string | null
          order_date?: string
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          remote_order_id: string
          shipped_date?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          status?: string
          status_synced_at?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_company?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          cancelled_date?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_date?: string | null
          id?: string
          items?: Json
          marketplace?: string
          marketplace_connection_id?: string | null
          marketplace_data?: Json | null
          notes?: string | null
          order_date?: string
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          remote_order_id?: string
          shipped_date?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          status?: string
          status_synced_at?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_company?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_marketplace_connection_id_fkey"
            columns: ["marketplace_connection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          apply_to_category: string | null
          created_at: string
          id: string
          is_active: boolean
          marketplace: string | null
          max_price: number | null
          min_price: number | null
          name: string
          priority: number
          rule_type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          apply_to_category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          priority?: number
          rule_type?: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          apply_to_category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          priority?: number
          rule_type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          last_synced_at: string | null
          listing_id: string | null
          marketplace_category_id: string | null
          master_listing_id: string | null
          material: string | null
          price: number
          size: string | null
          sku: string | null
          source: string
          status: string
          stock: number
          title: string
          trendyol_synced: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          last_synced_at?: string | null
          listing_id?: string | null
          marketplace_category_id?: string | null
          master_listing_id?: string | null
          material?: string | null
          price?: number
          size?: string | null
          sku?: string | null
          source?: string
          status?: string
          stock?: number
          title: string
          trendyol_synced?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          last_synced_at?: string | null
          listing_id?: string | null
          marketplace_category_id?: string | null
          master_listing_id?: string | null
          material?: string | null
          price?: number
          size?: string | null
          sku?: string | null
          source?: string
          status?: string
          stock?: number
          title?: string
          trendyol_synced?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_marketplace_category_id_fkey"
            columns: ["marketplace_category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_analytics: {
        Row: {
          average_order_value: number
          created_at: string
          date: string
          id: string
          marketplace: string
          orders_count: number
          total_items_sold: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_order_value?: number
          created_at?: string
          date: string
          id?: string
          marketplace: string
          orders_count?: number
          total_items_sold?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_order_value?: number
          created_at?: string
          date?: string
          id?: string
          marketplace?: string
          orders_count?: number
          total_items_sold?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          master_listing_id: string | null
          new_stock: number
          previous_stock: number
          source_marketplace: string
          sync_status: string
          target_marketplace: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          master_listing_id?: string | null
          new_stock: number
          previous_stock: number
          source_marketplace: string
          sync_status?: string
          target_marketplace: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          master_listing_id?: string | null
          new_stock?: number
          previous_stock?: number
          source_marketplace?: string
          sync_status?: string
          target_marketplace?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_sync_logs_master_listing_id_fkey"
            columns: ["master_listing_id"]
            isOneToOne: false
            referencedRelation: "master_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      listing_status: "draft" | "active" | "archived"
      marketplace_id:
        | "trendyol"
        | "hepsiburada"
        | "ikas"
        | "ciceksepeti"
        | "ticimax"
        | "amazon"
        | "etsy"
        | "n11"
      sync_status: "pending" | "syncing" | "synced" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      listing_status: ["draft", "active", "archived"],
      marketplace_id: [
        "trendyol",
        "hepsiburada",
        "ikas",
        "ciceksepeti",
        "ticimax",
        "amazon",
        "etsy",
        "n11",
      ],
      sync_status: ["pending", "syncing", "synced", "error"],
    },
  },
} as const
