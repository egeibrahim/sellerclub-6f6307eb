import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConnectBannerProps {
  platform: string;
  platformColor: string;
  onConnect: () => void;
  className?: string;
}

export const ConnectBanner = ({
  platform,
  platformColor,
  onConnect,
  className,
}: ConnectBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        className
      )}
      style={{ 
        backgroundColor: `${platformColor}10`,
        borderColor: `${platformColor}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" style={{ color: platformColor }} />
        <div>
          <p className="text-sm font-medium">
            Start selling on {platform}!
          </p>
          <p className="text-xs text-muted-foreground">
            Connect your {platform} account to sync products and manage orders.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground"
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={onConnect}
          style={{ backgroundColor: platformColor }}
          className="text-white hover:opacity-90"
        >
          Connect {platform}
        </Button>
      </div>
    </div>
  );
};
