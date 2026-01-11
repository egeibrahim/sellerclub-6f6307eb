import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ListingCounts {
  all: number;
  active: number;
  draft: number;
  inactive: number;
  copy: number;
  imported: number;
  staging: number;
  archived: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export const useListingCounts = (shopConnectionId?: string | null) => {
  const { user } = useAuth();

  const { data: counts, isLoading, refetch } = useQuery({
    queryKey: ['listing-counts', user?.id, shopConnectionId],
    queryFn: async (): Promise<ListingCounts> => {
      if (!user?.id) {
        return { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 };
      }

      let query = supabase
        .from('marketplace_listings')
        .select('status', { count: 'exact' })
        .eq('user_id', user.id);

      if (shopConnectionId) {
        query = query.eq('shop_connection_id', shopConnectionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listing counts:', error);
        return { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 };
      }

      const statusCounts: ListingCounts = {
        all: data?.length || 0,
        active: 0,
        draft: 0,
        inactive: 0,
        copy: 0,
        imported: 0,
        staging: 0,
        archived: 0,
      };

      data?.forEach((item: { status: string | null }) => {
        const status = item.status?.toLowerCase() || 'draft';
        if (status in statusCounts) {
          statusCounts[status as keyof ListingCounts]++;
        }
      });

      return statusCounts;
    },
    enabled: !!user?.id,
  });

  const { data: categoryCounts } = useQuery({
    queryKey: ['category-counts', user?.id, shopConnectionId],
    queryFn: async (): Promise<CategoryCount[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('marketplace_listings')
        .select('marketplace_data')
        .eq('user_id', user.id);

      if (shopConnectionId) {
        query = query.eq('shop_connection_id', shopConnectionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching category counts:', error);
        return [];
      }

      const categoryMap: Record<string, number> = {};
      data?.forEach((item: { marketplace_data: any }) => {
        const category = (item.marketplace_data as any)?.category || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      });

      return Object.entries(categoryMap).map(([category, count]) => ({
        category,
        count,
      }));
    },
    enabled: !!user?.id,
  });

  return {
    counts: counts || { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 },
    categoryCounts: categoryCounts || [],
    isLoading,
    refetch,
  };
};

export const useMasterListingCounts = () => {
  const { user } = useAuth();

  const { data: counts, isLoading, refetch } = useQuery({
    queryKey: ['master-listing-counts', user?.id],
    queryFn: async (): Promise<ListingCounts> => {
      if (!user?.id) {
        return { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 };
      }

      const { data, error } = await supabase
        .from('master_products')
        .select('status')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching master listing counts:', error);
        return { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 };
      }

      const statusCounts: ListingCounts = {
        all: data?.length || 0,
        active: 0,
        draft: 0,
        inactive: 0,
        copy: 0,
        imported: 0,
        staging: 0,
        archived: 0,
      };

      data?.forEach((item: { status: string | null }) => {
        const status = item.status?.toLowerCase() || 'draft';
        if (status in statusCounts) {
          statusCounts[status as keyof ListingCounts]++;
        }
      });

      return statusCounts;
    },
    enabled: !!user?.id,
  });

  return {
    counts: counts || { all: 0, active: 0, draft: 0, inactive: 0, copy: 0, imported: 0, staging: 0, archived: 0 },
    isLoading,
    refetch,
  };
};
