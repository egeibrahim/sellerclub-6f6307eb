import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlatformConfig } from "@/config/platformConfigs";

interface DetailsSectionProps {
  brand: string;
  onBrandChange: (brand: string) => void;
  customFields: Record<string, string | number>;
  onCustomFieldsChange: (fields: Record<string, string | number>) => void;
  config: PlatformConfig;
  error?: string;
}

export function DetailsSection({
  brand,
  onBrandChange,
  customFields,
  onCustomFieldsChange,
  config,
  error,
}: DetailsSectionProps) {
  const updateField = (name: string, value: string | number) => {
    onCustomFieldsChange({ ...customFields, [name]: value });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
      
      <div className="space-y-4">
        {/* Brand (if required) */}
        {config.requiresBrand && (
          <div>
            <Label className="text-sm text-foreground mb-2 block">
              Brand <span className="text-destructive">*</span>
            </Label>
            <Input
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
              placeholder="Enter brand name"
              className="h-11"
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
        )}
        
        {/* Custom Fields */}
        {config.customFields?.map((field) => (
          <div key={field.name}>
            <Label className="text-sm text-foreground mb-2 block">
              {field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1')}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            
            {field.type === 'select' && field.options ? (
              <Select
                value={String(customFields[field.name] || "")}
                onValueChange={(value) => updateField(field.name, value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={`Select ${field.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'number' ? (
              <Input
                type="number"
                value={customFields[field.name] || ""}
                onChange={(e) => updateField(field.name, Number(e.target.value))}
                placeholder={`Enter ${field.name}`}
                className="h-11"
              />
            ) : (
              <Input
                value={String(customFields[field.name] || "")}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={`Enter ${field.name}`}
                maxLength={field.maxLength}
                className="h-11"
              />
            )}
            
            {field.maxLength && (
              <p className="text-xs text-muted-foreground mt-1">
                {field.maxLength - String(customFields[field.name] || "").length} characters remaining
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
