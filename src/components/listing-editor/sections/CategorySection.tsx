import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
  platform: string;
  category: string;
  categoryPath: string[];
  onCategoryChange: (category: string, categoryPath: string[]) => void;
  error?: string;
}

// Mock category data - in production, fetch from platform API
const getCategoriesForPlatform = (platform: string) => {
  const commonCategories = [
    {
      id: "1",
      name: "Clothing & Accessories",
      children: [
        { id: "1-1", name: "Women's Clothing", children: [
          { id: "1-1-1", name: "Dresses" },
          { id: "1-1-2", name: "Tops" },
          { id: "1-1-3", name: "Pants" },
        ]},
        { id: "1-2", name: "Men's Clothing", children: [
          { id: "1-2-1", name: "Shirts" },
          { id: "1-2-2", name: "Pants" },
        ]},
        { id: "1-3", name: "Accessories", children: [
          { id: "1-3-1", name: "Bags" },
          { id: "1-3-2", name: "Jewelry" },
        ]},
      ]
    },
    {
      id: "2", 
      name: "Home & Living",
      children: [
        { id: "2-1", name: "Furniture", children: [] },
        { id: "2-2", name: "Home Decor", children: [] },
        { id: "2-3", name: "Kitchen", children: [] },
      ]
    },
    {
      id: "3",
      name: "Electronics",
      children: [
        { id: "3-1", name: "Phones & Accessories", children: [] },
        { id: "3-2", name: "Computers", children: [] },
        { id: "3-3", name: "Audio", children: [] },
      ]
    },
    {
      id: "4",
      name: "Beauty & Personal Care",
      children: [
        { id: "4-1", name: "Skincare", children: [] },
        { id: "4-2", name: "Makeup", children: [] },
        { id: "4-3", name: "Hair Care", children: [] },
      ]
    },
  ];

  return commonCategories;
};

interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
}

export function CategorySection({
  platform,
  category,
  categoryPath,
  onCategoryChange,
  error,
}: CategorySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const categories = getCategoriesForPlatform(platform);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const selectCategory = (cat: CategoryNode, path: string[]) => {
    if (!cat.children || cat.children.length === 0) {
      onCategoryChange(cat.id, [...path, cat.name]);
    }
  };

  const renderCategory = (cat: CategoryNode, level: number = 0, path: string[] = []) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedCategories.has(cat.id);
    const isSelected = category === cat.id;
    const currentPath = [...path, cat.name];

    return (
      <div key={cat.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleCategory(cat.id);
            } else {
              selectCategory(cat, path);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-md",
            isSelected && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <ChevronRight 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                isExpanded && "rotate-90"
              )} 
            />
          )}
          {!hasChildren && <div className="w-4" />}
          <span className="flex-1 text-sm">{cat.name}</span>
          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>
        
        {hasChildren && isExpanded && (
          <div>
            {cat.children!.map(child => renderCategory(child, level + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Category <span className="text-destructive">*</span>
        </h2>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}
      
      {/* Selected Category Path */}
      {categoryPath.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm">
          {categoryPath.map((part, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className={cn(
                index === categoryPath.length - 1 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}>
                {part}
              </span>
            </span>
          ))}
        </div>
      )}
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="pl-10 h-10"
        />
      </div>
      
      {/* Category Tree */}
      <ScrollArea className="h-[300px] border border-border rounded-lg">
        <div className="p-2">
          {categories.map(cat => renderCategory(cat))}
        </div>
      </ScrollArea>
    </div>
  );
}
