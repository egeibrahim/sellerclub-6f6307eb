import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformConfig } from "@/config/platformConfigs";

interface TagsSectionProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  config: PlatformConfig;
  error?: string;
}

export function TagsSection({
  tags,
  onTagsChange,
  config,
  error,
}: TagsSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const maxTags = config.maxTags || 50;
  const isAtLimit = tags.length >= maxTags;

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Tags</h2>
        <span className={cn(
          "text-sm",
          isAtLimit ? "text-warning font-medium" : "text-muted-foreground"
        )}>
          {tags.length} / {maxTags}
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      
      <div className="border border-border rounded-lg p-3 min-h-[100px]">
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="gap-1 px-3 py-1 text-sm"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={isAtLimit ? "Maximum tags reached" : "Type a tag and press Enter"}
          disabled={isAtLimit}
          className="border-0 shadow-none focus-visible:ring-0 p-0 h-8"
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter or comma to add tags. {config.name} allows up to {maxTags} tags.
      </p>
    </div>
  );
}
