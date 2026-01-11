import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Percent, DollarSign, X as Multiply } from "lucide-react";
import { PricingRule, usePricingRules } from "@/hooks/usePricingRules";
import { PricingRulesDialog } from "./PricingRulesDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PricingRulesList() {
  const { pricingRules, createRule, updateRule, deleteRule, isLoading } = usePricingRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = (rule: Omit<PricingRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...rule });
    } else {
      createRule.mutate(rule);
    }
    setEditingRule(undefined);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleToggleActive = (rule: PricingRule) => {
    updateRule.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      case 'multiply':
        return <Multiply className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatRuleValue = (rule: PricingRule) => {
    switch (rule.rule_type) {
      case 'percentage':
        return `${rule.value > 0 ? '+' : ''}${rule.value}%`;
      case 'fixed':
        return `${rule.value > 0 ? '+' : ''}₺${rule.value}`;
      case 'multiply':
        return `×${rule.value}`;
      default:
        return rule.value;
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fiyat Kuralları</h2>
        <Button onClick={() => { setEditingRule(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Kural
        </Button>
      </div>

      {pricingRules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Henüz fiyat kuralı oluşturulmamış.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pricingRules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRuleTypeIcon(rule.rule_type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{formatRuleValue(rule)}</Badge>
                        {rule.marketplace && (
                          <Badge variant="outline">{rule.marketplace}</Badge>
                        )}
                        {rule.apply_to_category && (
                          <Badge variant="outline">{rule.apply_to_category}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Öncelik: {rule.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PricingRulesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kuralı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteRule.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
