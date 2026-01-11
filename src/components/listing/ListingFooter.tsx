import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp, Layers } from "lucide-react";
import { PublishDialog } from "./PublishDialog";

type PublishStatus = "staging" | "draft" | "active";

interface ListingFooterProps {
  onSaveAsProfile?: () => void;
  onPublish: (status: PublishStatus) => void;
  onSchedule?: () => void;
  isLoading?: boolean;
  shopName?: string;
  primaryColor?: string;
}

export function ListingFooter({
  onSaveAsProfile,
  onPublish,
  onSchedule,
  isLoading,
  shopName,
  primaryColor = "#10B981",
}: ListingFooterProps) {
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const handlePublishClick = () => {
    setShowPublishDialog(true);
  };

  const handleConfirmPublish = (status: PublishStatus) => {
    onPublish(status);
    setShowPublishDialog(false);
  };

  return (
    <>
      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-end gap-3 px-6 py-4 max-w-screen-2xl mx-auto">
          {/* Save as Profile Button */}
          <Button
            variant="outline"
            onClick={onSaveAsProfile}
            disabled={isLoading}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Save as Profile
          </Button>

          {/* Publish Button with Dropdown */}
          <div className="flex">
            <Button
              onClick={handlePublishClick}
              disabled={isLoading}
              className="rounded-r-none gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <ChevronUp className="h-4 w-4" />
              {isLoading ? "Kaydediliyor..." : "Publish"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isLoading}
                  className="rounded-l-none border-l border-white/20 px-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPublish("draft")}>
                  Taslak Olarak Kaydet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPublish("staging")}>
                  Staging'e Gönder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPublish("active")}>
                  Aktif Olarak Yayınla
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onConfirm={handleConfirmPublish}
        onSchedule={onSchedule}
        isLoading={isLoading}
        shopName={shopName}
      />
    </>
  );
}
