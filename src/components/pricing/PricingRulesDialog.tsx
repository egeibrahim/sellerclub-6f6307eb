import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { PricingRule } from "@/hooks/usePricingRules";

interface PricingRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: PricingRule;
  onSave: (rule: Omit<PricingRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

export function PricingRulesDialog({ open, onOpenChange, rule, onSave }: PricingRulesDialogProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    marketplace: rule?.marketplace || '',
    rule_type: rule?.rule_type || 'percentage',
    value: rule?.value || 0,
    min_price: rule?.min_price || null,
    max_price: rule?.max_price || null,
    apply_to_category: rule?.apply_to_category || '',
    is_active: rule?.is_active ?? true,
    priority: rule?.priority || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      marketplace: formData.marketplace || null,
      apply_to_category: formData.apply_to_category || null,
    } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? 'Kuralı Düzenle' : 'Yeni Fiyat Kuralı'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Kural Adı</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Trendyol %10 artış"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketplace">Pazaryeri (Opsiyonel)</Label>
            <Select
              value={formData.marketplace}
              onValueChange={(value) => setFormData({ ...formData, marketplace: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm pazaryerleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Pazaryerleri</SelectItem>
                <SelectItem value="trendyol">Trendyol</SelectItem>
                <SelectItem value="hepsiburada">Hepsiburada</SelectItem>
                <SelectItem value="n11">N11</SelectItem>
                <SelectItem value="ciceksepeti">Çiçeksepeti</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule_type">Kural Tipi</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(value: any) => setFormData({ ...formData, rule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                  <SelectItem value="multiply">Çarpan (x)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Değer</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                placeholder={formData.rule_type === 'percentage' ? '10' : '50'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_price">Min Fiyat (Opsiyonel)</Label>
              <Input
                id="min_price"
                type="number"
                step="0.01"
                value={formData.min_price || ''}
                onChange={(e) => setFormData({ ...formData, min_price: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="₺0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_price">Max Fiyat (Opsiyonel)</Label>
              <Input
                id="max_price"
                type="number"
                step="0.01"
                value={formData.max_price || ''}
                onChange={(e) => setFormData({ ...formData, max_price: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="₺9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Yüksek öncelikli kurallar önce uygulanır</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Aktif</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
