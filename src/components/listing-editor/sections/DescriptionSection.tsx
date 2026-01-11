import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PlatformConfig } from "@/config/platformConfigs";

interface DescriptionSectionProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  config: PlatformConfig;
  error?: string;
}

export function DescriptionSection({
  description,
  onDescriptionChange,
  config,
  error,
}: DescriptionSectionProps) {
  const remaining = config.descriptionMaxLength - description.length;
  const isOverLimit = remaining < 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Description</h2>
        <span className={cn(
          "text-sm",
          isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {description.length.toLocaleString()} / {config.descriptionMaxLength.toLocaleString()}
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      
      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe your product in detail..."
        rows={10}
        className={cn(
          "resize-none",
          isOverLimit && "border-destructive focus-visible:ring-destructive"
        )}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {config.name} allows up to {config.descriptionMaxLength.toLocaleString()} characters
      </p>
    </div>
  );
}
