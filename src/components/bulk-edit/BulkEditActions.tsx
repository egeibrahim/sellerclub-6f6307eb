import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Upload } from "lucide-react";

interface BulkEditActionsProps {
  onCancel: () => void;
  onSync: () => void;
  isSyncing: boolean;
  checkedCount: number;
}

export function BulkEditActions({
  onCancel,
  onSync,
  isSyncing,
  checkedCount,
}: BulkEditActionsProps) {
  return (
    <aside className="w-56 border-l border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Actions</h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Info */}
        <div className="text-sm text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{checkedCount}</span>{" "}
          listing(s) will be updated
        </div>

        {/* Sync Button */}
        <Button
          onClick={onSync}
          disabled={isSyncing || checkedCount === 0}
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Sync updates
            </>
          )}
        </Button>

        {/* Schedule Button */}
        <Button variant="outline" className="w-full gap-2" disabled={isSyncing}>
          <Calendar className="h-4 w-4" />
          Schedule
        </Button>

        <div className="flex-1" />

        {/* Cancel Button */}
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSyncing}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </aside>
  );
}
