import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Replace, Trash2 } from "lucide-react";
import type { EditCategory, EditMode } from "@/pages/BulkEdit";

interface BulkEditHeaderProps {
  shopName: string;
  platform: string;
  shopColor: string;
  shopIcon: string;
  listingCount: number;
  activeCategory: EditCategory;
  editMode: EditMode;
  onEditModeChange: (mode: EditMode) => void;
}

const categoryLabels: Record<EditCategory, string> = {
  photos: "Photos",
  videos: "Videos",
  title: "Title",
  description: "Description",
  tags: "Tags",
  price: "Price",
  quantity: "Quantity",
  sku: "SKU",
};

const editModeIcons: Record<EditMode, React.ReactNode> = {
  add: <Plus className="h-4 w-4" />,
  replace: <Replace className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
};

const editModeLabels: Record<EditMode, string> = {
  add: "Add",
  replace: "Replace",
  delete: "Delete",
};

export function BulkEditHeader({
  shopName,
  platform,
  shopColor,
  shopIcon,
  listingCount,
  activeCategory,
  editMode,
  onEditModeChange,
}: BulkEditHeaderProps) {
  return (
    <div className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left - Shop Info */}
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: shopColor }}
          >
            {shopIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{platform}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{shopName}</span>
            </div>
            <h1 className="text-lg font-semibold">
              Editing {listingCount} listings
            </h1>
          </div>
        </div>

        {/* Right - Edit Mode Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {categoryLabels[activeCategory]}:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {editModeIcons[editMode]}
                {editModeLabels[editMode]}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEditModeChange("add")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEditModeChange("replace")}
                className="gap-2"
              >
                <Replace className="h-4 w-4" />
                Replace
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEditModeChange("delete")}
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
