import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { EditCategory } from "@/pages/BulkEdit";

interface BulkEditSidebarProps {
  activeCategory: EditCategory;
  onCategoryChange: (category: EditCategory) => void;
}

interface CategoryItem {
  id: EditCategory;
  label: string;
}

interface CategoryGroup {
  name: string;
  items: CategoryItem[];
  defaultOpen?: boolean;
}

const categoryGroups: CategoryGroup[] = [
  {
    name: "Media",
    defaultOpen: true,
    items: [
      { id: "photos", label: "Photos" },
      { id: "videos", label: "Videos" },
    ],
  },
  {
    name: "Listings",
    defaultOpen: true,
    items: [
      { id: "title", label: "Title" },
      { id: "description", label: "Description" },
      { id: "tags", label: "Tags" },
    ],
  },
  {
    name: "Inventory",
    defaultOpen: true,
    items: [
      { id: "price", label: "Price" },
      { id: "quantity", label: "Quantity" },
      { id: "sku", label: "SKU" },
    ],
  },
];

export function BulkEditSidebar({
  activeCategory,
  onCategoryChange,
}: BulkEditSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    categoryGroups.reduce(
      (acc, group) => ({
        ...acc,
        [group.name]: group.defaultOpen ?? false,
      }),
      {}
    )
  );

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <aside className="w-56 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Düzenleme Alanı</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {categoryGroups.map((group) => (
          <Collapsible
            key={group.name}
            open={openGroups[group.name]}
            onOpenChange={() => toggleGroup(group.name)}
          >
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <span>{group.name}</span>
              {openGroups[group.name] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0.5 px-2 pb-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onCategoryChange(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-sm transition-colors",
                      activeCategory === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </aside>
  );
}
