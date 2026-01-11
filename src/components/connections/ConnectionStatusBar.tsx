import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatus {
  name: string;
  status: "connected" | "inactive" | "disconnected";
  lastSync?: string | null;
  color: string;
}

interface ConnectionStatusBarProps {
  connections: ConnectionStatus[];
  isLoading?: boolean;
}

export function ConnectionStatusBar({ connections, isLoading }: ConnectionStatusBarProps) {
  if (isLoading) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Bağlantı durumları yükleniyor...</span>
      </div>
    );
  }

  const getStatusIcon = (status: ConnectionStatus["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: ConnectionStatus["status"]) => {
    switch (status) {
      case "connected":
        return "Bağlı";
      case "inactive":
        return "Pasif";
      default:
        return "Bağlı Değil";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-6 flex-wrap">
        {connections.map((connection) => (
          <div key={connection.name} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: connection.color }}
            >
              {connection.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{connection.name}</span>
                {getStatusIcon(connection.status)}
              </div>
              <span className={cn(
                "text-xs",
                connection.status === "connected" ? "text-success" :
                connection.status === "inactive" ? "text-warning" : "text-muted-foreground"
              )}>
                {getStatusText(connection.status)}
                {connection.lastSync && connection.status === "connected" && (
                  <span className="text-muted-foreground ml-1">
                    • Son sync: {new Date(connection.lastSync).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
