import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Truck } from "lucide-react";

interface TrackingNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onSubmit: (trackingNumber: string, trackingCompany: string) => void;
  isLoading?: boolean;
}

const CARGO_COMPANIES = [
  { id: 'yurtici', name: 'Yurtiçi Kargo' },
  { id: 'aras', name: 'Aras Kargo' },
  { id: 'mng', name: 'MNG Kargo' },
  { id: 'ptt', name: 'PTT Kargo' },
  { id: 'ups', name: 'UPS' },
  { id: 'dhl', name: 'DHL' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'tnt', name: 'TNT' },
  { id: 'surat', name: 'Sürat Kargo' },
  { id: 'hepsijet', name: 'HepsiJet' },
  { id: 'sendeo', name: 'Sendeo' },
  { id: 'other', name: 'Diğer' },
];

export function TrackingNumberDialog({
  open,
  onOpenChange,
  orderNumber,
  onSubmit,
  isLoading = false,
}: TrackingNumberDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCompany, setTrackingCompany] = useState("");

  const handleSubmit = () => {
    if (!trackingNumber.trim()) return;
    onSubmit(trackingNumber.trim(), trackingCompany);
    setTrackingNumber("");
    setTrackingCompany("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Kargo Bilgisi Gir
          </DialogTitle>
          <DialogDescription>
            Sipariş <strong>{orderNumber}</strong> için kargo takip numarasını girin.
            Bu bilgi pazaryerine otomatik olarak gönderilecektir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tracking-company">Kargo Firması</Label>
            <Select value={trackingCompany} onValueChange={setTrackingCompany}>
              <SelectTrigger id="tracking-company">
                <SelectValue placeholder="Kargo firması seçin" />
              </SelectTrigger>
              <SelectContent>
                {CARGO_COMPANIES.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-number">Takip Numarası</Label>
            <Input
              id="tracking-number"
              placeholder="Kargo takip numarası"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!trackingNumber.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              'Kaydet ve Pazaryerine Gönder'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
