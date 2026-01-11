import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AmazonCategory {
  id: string;
  name: string;
  path: string[];
  parentId?: string;
  requiredAttributes?: string[];
}

export function useAmazonCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<AmazonCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For now, we use static categories defined in the component
  // This hook is prepared for future API integration

  const fetchCategories = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if Amazon connection exists
      const { data: connection } = await supabase
        .from("marketplace_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("marketplace", "amazon")
        .eq("is_active", true)
        .maybeSingle();

      if (!connection) {
        // No connection, use static categories
        return;
      }

      // Future: Fetch categories from Amazon API
      // const { data, error } = await supabase.functions.invoke("amazon-sync", {
      //   body: {
      //     action: "fetch_categories",
      //     connectionId: connection.id,
      //   },
      // });

      // if (error) throw error;
      // setCategories(data.categories || []);
    } catch (err: any) {
      console.error("Error fetching Amazon categories:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
