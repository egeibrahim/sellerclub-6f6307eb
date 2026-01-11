import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface PricingRule {
  id: string;
  user_id: string;
  name: string;
  marketplace: string | null;
  rule_type: 'percentage' | 'fixed' | 'multiply';
  value: number;
  min_price: number | null;
  max_price: number | null;
  apply_to_category: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export function usePricingRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pricingRules, isLoading, error } = useQuery({
    queryKey: ['pricing-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!user,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert({ ...rule, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({ title: "Fiyat kuralı oluşturuldu" });
    },
    onError: (error) => {
      toast({ title: "Kural oluşturulamadı", description: error.message, variant: "destructive" });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({ title: "Fiyat kuralı güncellendi" });
    },
    onError: (error) => {
      toast({ title: "Güncelleme başarısız", description: error.message, variant: "destructive" });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({ title: "Fiyat kuralı silindi" });
    },
    onError: (error) => {
      toast({ title: "Silme başarısız", description: error.message, variant: "destructive" });
    },
  });

  const calculatePrice = (basePrice: number, marketplace?: string, category?: string): number => {
    if (!pricingRules) return basePrice;

    const applicableRules = pricingRules
      .filter(rule => rule.is_active)
      .filter(rule => !rule.marketplace || rule.marketplace === marketplace)
      .filter(rule => !rule.apply_to_category || rule.apply_to_category === category)
      .sort((a, b) => b.priority - a.priority);

    let price = basePrice;

    for (const rule of applicableRules) {
      switch (rule.rule_type) {
        case 'percentage':
          price = price * (1 + rule.value / 100);
          break;
        case 'fixed':
          price = price + rule.value;
          break;
        case 'multiply':
          price = price * rule.value;
          break;
      }

      if (rule.min_price !== null) price = Math.max(price, rule.min_price);
      if (rule.max_price !== null) price = Math.min(price, rule.max_price);
    }

    return Math.round(price * 100) / 100;
  };

  return {
    pricingRules: pricingRules || [],
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    calculatePrice,
  };
}
