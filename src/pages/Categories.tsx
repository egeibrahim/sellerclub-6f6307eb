import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { RefreshCw, FolderTree } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncCategories = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("trendyol-sync", {
        body: { action: "get_categories" },
      });

      if (error) throw error;

      toast({
        title: "Categories synced",
        description: `Successfully fetched ${data?.categories?.length || 0} categories from Trendyol.`,
      });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout showHeader={false}>
      <Header title="Category Mapping">
        <Button
          onClick={syncCategories}
          disabled={syncing}
          className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync Categories
        </Button>
      </Header>

      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted flex items-center justify-center mb-4">
            <FolderTree className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Category Mapping</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Map your product categories to Trendyol categories for seamless synchronization.
          </p>
          <Button
            variant="outline"
            onClick={syncCategories}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Fetch Trendyol Categories
          </Button>
        </div>
      </div>
    </Layout>
  );
}
