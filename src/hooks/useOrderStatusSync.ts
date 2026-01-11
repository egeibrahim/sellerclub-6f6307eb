import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncStatusParams {
  orderId: string;
  status: string;
  trackingNumber?: string;
  trackingCompany?: string;
}

export function useOrderStatusSync() {
  const queryClient = useQueryClient();

  const syncStatus = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber, trackingCompany }: SyncStatusParams) => {
      const { data, error } = await supabase.functions.invoke('order-status-sync', {
        body: { orderId, status, trackingNumber, trackingCompany },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Durum pazaryerine senkronize edildi');
      } else {
        toast.warning(data.message || 'Senkronizasyon tamamlanamadı');
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('Status sync error:', error);
      toast.error('Durum senkronizasyonu başarısız');
    },
  });

  const updateWithTracking = useMutation({
    mutationFn: async ({ orderId, trackingNumber, trackingCompany }: { orderId: string; trackingNumber: string; trackingCompany?: string }) => {
      // First update locally
      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          status: 'shipped',
          shipped_date: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // Then sync to marketplace
      const { data, error: syncError } = await supabase.functions.invoke('order-status-sync', {
        body: { 
          orderId, 
          status: 'shipped', 
          trackingNumber, 
          trackingCompany 
        },
      });

      if (syncError) {
        console.error('Sync error:', syncError);
        // Don't throw - local update succeeded
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Kargo bilgisi güncellendi ve pazaryerine gönderildi');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('Update with tracking error:', error);
      toast.error('Kargo bilgisi güncellenemedi');
    },
  });

  return {
    syncStatus,
    updateWithTracking,
    isSyncing: syncStatus.isPending,
  };
}
