import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlatformConfig } from "@/config/platformConfigs";

interface TitleSectionProps {
  title: string;
  onTitleChange: (title: string) => void;
  config: PlatformConfig;
  error?: string;
}

export function TitleSection({
  title,
  onTitleChange,
  config,
  error,
}: TitleSectionProps) {
  const remaining = config.titleMaxLength - title.length;
  const isOverLimit = remaining < 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Title</h2>
        <span className={cn(
          "text-sm",
          isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {remaining} characters remaining
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Enter product title"
        className={cn(
          "h-12 text-base",
          isOverLimit && "border-destructive focus-visible:ring-destructive"
        )}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {config.name} allows up to {config.titleMaxLength} characters
      </p>
    </div>
  );
}
