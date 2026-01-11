import { useState } from "react";
import { Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { platformConfigs, getPlatformConfig } from "@/config/platformConfigs";

interface ConnectShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'select-platform' | 'credentials' | 'success';

const platforms = [
  { id: 'etsy', name: 'Etsy', icon: 'E', color: '#F56400', authType: 'oauth' },
  { id: 'trendyol', name: 'Trendyol', icon: 'T', color: '#FF6000', authType: 'api_key' },
  { id: 'hepsiburada', name: 'Hepsiburada', icon: 'H', color: '#FF6600', authType: 'api_key' },
  { id: 'amazon', name: 'Amazon', icon: 'A', color: '#FF9900', authType: 'oauth' },
  { id: 'shopify', name: 'Shopify', icon: 'S', color: '#95BF47', authType: 'oauth' },
  { id: 'ikas', name: 'ikas', icon: 'i', color: '#6366F1', authType: 'api_key' },
  { id: 'n11', name: 'N11', icon: 'N', color: '#7B68EE', authType: 'api_key' },
  { id: 'ciceksepeti', name: 'Çiçeksepeti', icon: 'Ç', color: '#E91E63', authType: 'api_key' },
];

const credentialFields: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
  trendyol: [
    { key: 'sellerId', label: 'Satıcı ID', placeholder: 'Satıcı ID\nizi girin' },
    { key: 'apiKey', label: 'API Key', placeholder: 'API anahtarınızı girin' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'API secret\ınızı girin', type: 'password' },
  ],
  hepsiburada: [
    { key: 'merchantId', label: 'Merchant ID', placeholder: 'Merchant ID\nizi girin' },
    { key: 'username', label: 'Username', placeholder: 'Kullanıcı adınızı girin' },
    { key: 'password', label: 'Password', placeholder: 'Şifrenizi girin', type: 'password' },
  ],
  ikas: [
    { key: 'storeId', label: 'Store ID', placeholder: 'Store ID\nizi girin' },
    { key: 'apiKey', label: 'API Key', placeholder: 'API anahtarınızı girin' },
  ],
  n11: [
    { key: 'apiKey', label: 'API Key', placeholder: 'API anahtarınızı girin' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'API secret\ınızı girin', type: 'password' },
  ],
  ciceksepeti: [
    { key: 'apiKey', label: 'API Key', placeholder: 'API anahtarınızı girin' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'API secret\ınızı girin', type: 'password' },
  ],
};

export const ConnectShopDialog = ({ open, onOpenChange }: ConnectShopDialogProps) => {
  const [step, setStep] = useState<Step>('select-platform');
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platforms[0] | null>(null);
  const [shopName, setShopName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetDialog = () => {
    setStep('select-platform');
    setSelectedPlatform(null);
    setShopName('');
    setCredentials({});
    setIsLoading(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handlePlatformSelect = (platform: typeof platforms[0]) => {
    setSelectedPlatform(platform);
    
    if (platform.authType === 'oauth') {
      // Redirect to OAuth flow
      handleOAuthConnect(platform);
    } else {
      setStep('credentials');
    }
  };

  const handleOAuthConnect = async (platform: typeof platforms[0]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('oauth-init', {
        body: { platform: platform.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate OAuth connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialSubmit = async () => {
    if (!selectedPlatform || !user || !shopName.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_connections')
        .insert({
          user_id: user.id,
          platform: selectedPlatform.id,
          shop_name: shopName.trim(),
          shop_icon: selectedPlatform.icon,
          shop_color: selectedPlatform.color,
          api_credentials: credentials,
          is_connected: false, // Will be set to true after successful test
        })
        .select()
        .single();

      if (error) throw error;

      // Test connection
      const testResult = await supabase.functions.invoke(`${selectedPlatform.id}-sync`, {
        body: {
          action: 'test',
          connectionId: data.id,
        },
      });

      if (testResult.error) {
        // Update connection as failed but keep it
        await supabase
          .from('shop_connections')
          .update({ is_connected: false })
          .eq('id', data.id);
        
        toast({
          title: "Connection Test Failed",
          description: "Store added but connection test failed. Please verify credentials.",
          variant: "destructive",
        });
      } else {
        // Update connection as successful
        await supabase
          .from('shop_connections')
          .update({ is_connected: true })
          .eq('id', data.id);

        toast({
          title: "Store Connected!",
          description: `${shopName} has been successfully connected.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['shop-connections'] });
      setStep('success');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add store",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-platform' && 'Connect a Marketplace'}
            {step === 'credentials' && `Connect to ${selectedPlatform?.name}`}
            {step === 'success' && 'Connection Successful'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-platform' && 'Select a marketplace to connect your store'}
            {step === 'credentials' && 'Enter your API credentials to connect'}
            {step === 'success' && 'Your store has been connected successfully'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Platform Selection */}
        {step === 'select-platform' && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformSelect(platform)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 border-border",
                  "hover:border-primary/50 hover:bg-accent transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {platform.authType === 'oauth' ? 'OAuth' : 'API Key'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 'credentials' && selectedPlatform && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Mağaza Adı</Label>
              <Input
                id="shop-name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Mağazanızın adını girin"
              />
            </div>

            {credentialFields[selectedPlatform.id]?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('select-platform')}>
                Back
              </Button>
              <Button 
                onClick={handleCredentialSubmit}
                disabled={isLoading || !shopName.trim()}
                style={{ backgroundColor: selectedPlatform.color }}
                className="text-white"
              >
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Store Connected!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your {selectedPlatform?.name} store has been connected successfully.
              You can now sync your products and manage orders.
            </p>
            <Button onClick={handleClose}>
              Start Selling
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
