import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

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

// Mock pricing rules storage (in-memory for now since table doesn't exist)
const mockPricingRules: Map<string, PricingRule[]> = new Map();

export function usePricingRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localRules, setLocalRules] = useState<PricingRule[]>([]);

  const { data: pricingRules, isLoading, error } = useQuery({
    queryKey: ['pricing-rules', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Return mock data since pricing_rules table doesn't exist
      return mockPricingRules.get(user.id) || [];
    },
    enabled: !!user,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error("Not authenticated");
      
      const newRule: PricingRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const userRules = mockPricingRules.get(user.id) || [];
      userRules.push(newRule);
      mockPricingRules.set(user.id, userRules);
      
      return newRule;
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
      if (!user) throw new Error("Not authenticated");
      
      const userRules = mockPricingRules.get(user.id) || [];
      const index = userRules.findIndex(r => r.id === id);
      
      if (index === -1) throw new Error("Rule not found");
      
      userRules[index] = {
        ...userRules[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      mockPricingRules.set(user.id, userRules);
      
      return userRules[index];
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
      if (!user) throw new Error("Not authenticated");
      
      const userRules = mockPricingRules.get(user.id) || [];
      const filteredRules = userRules.filter(r => r.id !== id);
      mockPricingRules.set(user.id, filteredRules);
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
    const rules = pricingRules || [];
    if (rules.length === 0) return basePrice;

    const applicableRules = rules
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
    error: null,
    createRule,
    updateRule,
    deleteRule,
    calculatePrice,
  };
}