import { Button } from "@/components/ui/button";
import { Layers, ChevronUp, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListingEditorFooterProps {
  onCancel: () => void;
  onSaveAsProfile: () => void;
  onPublish: (status: 'active' | 'draft' | 'staging') => void;
  isLoading: boolean;
  shopColor: string;
}

export function ListingEditorFooter({
  onCancel,
  onSaveAsProfile,
  onPublish,
  isLoading,
  shopColor,
}: ListingEditorFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex items-center justify-between z-50">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={onSaveAsProfile}
          disabled={isLoading}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          Save as Profile
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              disabled={isLoading}
              className="gap-2 text-white"
              style={{ backgroundColor: shopColor }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              Publish
              <ChevronUp className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPublish('active')}>
              Publish now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPublish('draft')}>
              Save as draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPublish('staging')}>
              Save to staging
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
