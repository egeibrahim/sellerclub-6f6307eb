import { useState } from "react";
import { X, Copy, Sparkles, MoreHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shop } from "@/contexts/ShopContext";
import { useListingCounts } from "@/hooks/useListingCounts";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CopyToShopPopupProps {
  targetPlatform: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  sourceShops: Shop[];
  onClose: () => void;
}

type CopyStep = 'select-source' | 'select-method' | 'copying';

export function CopyToShopPopup({ targetPlatform, sourceShops, onClose }: CopyToShopPopupProps) {
  const [step, setStep] = useState<CopyStep>('select-source');
  const [selectedSource, setSelectedSource] = useState<Shop | null>(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [copiedCount, setCopiedCount] = useState(0);

  const handleSelectSource = (shop: Shop) => {
    setSelectedSource(shop);
    setStep('select-method');
  };

  const handleCopyMethod = (method: 'standard' | 'ai') => {
    if (!selectedSource) return;
    
    // Simulate copying process
    setStep('copying');
    setTotalListings(248); // Mock number
    setCopiedCount(0);
    
    const interval = setInterval(() => {
      setCopiedCount(prev => {
        const next = prev + Math.floor(Math.random() * 5) + 1;
        if (next >= 248) {
          clearInterval(interval);
          toast.success(`Ürünler başarıyla ${targetPlatform.name}'a kopyalandı!`);
          setTimeout(onClose, 1000);
          return 248;
        }
        setCopyProgress((next / 248) * 100);
        return next;
      });
    }, 100);
  };

  const handleSwitchSource = (shop: Shop) => {
    setSelectedSource(shop);
  };

  // No source shops available
  if (sourceShops.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-[420px] p-8 text-center" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
            style={{ backgroundColor: targetPlatform.color }}
          >
            {targetPlatform.icon}
          </div>
          <p className="text-gray-600 mb-2">{targetPlatform.name}</p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Copy listings</h2>
          <p className="text-gray-500 mb-6">
            Henüz bağlı mağaza yok. Önce bir mağaza bağlayın.
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Select source shop
  if (step === 'select-source') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-[420px] relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="p-8 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
              style={{ backgroundColor: targetPlatform.color }}
            >
              {targetPlatform.icon}
            </div>
            <p className="text-gray-600 mb-2">{targetPlatform.name}</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Copy listings</h2>
            <p className="text-gray-500 mb-6">
              Kaynak mağaza seçin
            </p>

            {/* Source shops list */}
            <div className="space-y-2">
              {sourceShops.map((shop) => (
                <SourceShopRow key={shop.id} shop={shop} onSelect={handleSelectSource} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Select copy method
  if (step === 'select-method' && selectedSource) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-[420px] relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="p-8 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3"
              style={{ backgroundColor: selectedSource.color }}
            >
              {selectedSource.icon}
            </div>
            <p className="text-gray-600 mb-6">{selectedSource.name}</p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Copy listings</h2>
            <p className="text-gray-500 mb-8">
              Select "Standard" to copy listings as they exist, or "AI copy"<br />
              to copy and optimize listings for the selected shop
            </p>

            {/* Copy method buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleCopyMethod('standard')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Copy className="h-5 w-5 text-gray-700" />
                <span className="font-medium text-gray-700">Standard</span>
              </button>
              
              <button
                onClick={() => handleCopyMethod('ai')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
              >
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">AI copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Copying progress
  if (step === 'copying' && selectedSource) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-xl w-[480px] relative" onClick={e => e.stopPropagation()}>
          <div className="p-8">
            {/* Shop icons with arrow */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                  style={{ backgroundColor: selectedSource.color }}
                >
                  {selectedSource.icon}
                </div>
                <p className="text-sm text-gray-600">{selectedSource.name}</p>
              </div>
              
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
              
              <div className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2"
                  style={{ backgroundColor: targetPlatform.color }}
                >
                  {targetPlatform.icon}
                </div>
                <p className="text-sm text-gray-600">New shop</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Copying listings</h2>
            <p className="text-gray-500 text-center mb-6">
              The time this takes will depend on the<br />
              number of listings copied
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <Progress value={copyProgress} className="h-1.5" />
            </div>
            
            <p className="text-center text-gray-600">
              <span className="font-semibold text-teal-600">{copiedCount}</span>
              {' '}of{' '}
              <span className="font-semibold">{totalListings}</span>
              {' '}listings copied
            </p>

            {/* Switch shop dropdown */}
            <div className="flex justify-center mt-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-teal-600 font-medium">Switch shop</span>
                    <ChevronDown className="h-4 w-4 text-teal-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 bg-white border border-gray-200">
                  {sourceShops.filter(s => s.id !== selectedSource.id).map((shop) => (
                    <DropdownMenuItem 
                      key={shop.id}
                      onClick={() => handleSwitchSource(shop)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: shop.color }}
                      >
                        {shop.icon}
                      </div>
                      <span className="text-sm">{shop.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SourceShopRow({ shop, onSelect }: { shop: Shop; onSelect: (shop: Shop) => void }) {
  const { counts } = useListingCounts(shop.id);
  
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
      onClick={() => onSelect(shop)}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: shop.color }}
      >
        {shop.icon}
      </div>
      <span className="text-sm font-medium text-gray-900 flex-1 text-left">{shop.name}</span>
      <span className="text-sm text-gray-500">{counts?.active || 0} active</span>
    </div>
  );
}