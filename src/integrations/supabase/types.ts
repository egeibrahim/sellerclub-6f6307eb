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
      marketplace_listings: {
        Row: {
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          last_sync_at: string | null
          marketplace_data: Json | null
          master_product_id: string | null
          platform: string
          price: number | null
          shop_connection_id: string | null
          status: string | null
          sync_status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          marketplace_data?: Json | null
          master_product_id?: string | null
          platform: string
          price?: number | null
          shop_connection_id?: string | null
          status?: string | null
          sync_status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          marketplace_data?: Json | null
          master_product_id?: string | null
          platform?: string
          price?: number | null
          shop_connection_id?: string | null
          status?: string | null
          sync_status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "master_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_shop_connection_id_fkey"
            columns: ["shop_connection_id"]
            isOneToOne: false
            referencedRelation: "shop_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_templates: {
        Row: {
          attributes_schema: Json
          category_tree: Json
          created_at: string
          description_max_length: number | null
          id: string
          platform: string
          title_max_length: number | null
          updated_at: string
          variation_types: Json
        }
        Insert: {
          attributes_schema?: Json
          category_tree?: Json
          created_at?: string
          description_max_length?: number | null
          id?: string
          platform: string
          title_max_length?: number | null
          updated_at?: string
          variation_types?: Json
        }
        Update: {
          attributes_schema?: Json
          category_tree?: Json
          created_at?: string
          description_max_length?: number | null
          id?: string
          platform?: string
          title_max_length?: number | null
          updated_at?: string
          variation_types?: Json
        }
        Relationships: []
      }
      master_products: {
        Row: {
          attributes: Json | null
          brand: string | null
          category: string | null
          compare_at_price: number | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          price: number | null
          sku: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          variations: Json | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          price?: number | null
          sku: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          variations?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          price?: number | null
          sku?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          variations?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_connections: {
        Row: {
          api_credentials: Json | null
          created_at: string
          id: string
          is_connected: boolean
          last_sync_at: string | null
          platform: string
          shop_color: string | null
          shop_icon: string | null
          shop_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_credentials?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform: string
          shop_color?: string | null
          shop_icon?: string | null
          shop_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_credentials?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform?: string
          shop_color?: string | null
          shop_icon?: string | null
          shop_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
