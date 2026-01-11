import { useState, useEffect } from "react";
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
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  MarketplaceConfig,
  MarketplaceConnection,
} from "@/hooks/useMarketplaceConnections";

interface ConnectionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplace: MarketplaceConfig | null;
  existingConnection: MarketplaceConnection | null;
  onSave: (credentials: Record<string, string>, storeName?: string) => void;
  onDelete: () => void;
  isSaving: boolean;
}

export function ConnectionConfigDialog({
  open,
  onOpenChange,
  marketplace,
  existingConnection,
  onSave,
  onDelete,
  isSaving,
}: ConnectionConfigDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    if (marketplace && existingConnection) {
      setCredentials(existingConnection.credentials || {});
      setStoreName(existingConnection.store_name || "");
    } else if (marketplace) {
      // Initialize with empty values
      const initial: Record<string, string> = {};
      marketplace.credentialFields.forEach((field) => {
        initial[field.key] = "";
      });
      setCredentials(initial);
      setStoreName("");
    }
  }, [marketplace, existingConnection]);

  if (!marketplace) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(credentials, storeName || undefined);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isValid = marketplace.credentialFields.every(
    (field) => credentials[field.key]?.trim()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center font-bold text-white rounded"
              style={{ backgroundColor: marketplace.color }}
            >
              {marketplace.logo}
            </div>
            <div>
              <DialogTitle>{marketplace.name} Bağlantısı</DialogTitle>
              <DialogDescription>
                API bilgilerinizi girin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="store_name">Mağaza Adı (Opsiyonel)</Label>
              <Input
                id="store_name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Mağazanızın adı"
              />
            </div>

            {marketplace.credentialFields.map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={
                      field.type === "password" && !showSecrets[field.key]
                        ? "password"
                        : "text"
                    }
                    value={credentials[field.key] || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="pr-10"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => toggleSecret(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {existingConnection && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Bağlantıyı Sil
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
