import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2 } from "lucide-react";
import type { PlatformConfig } from "@/config/platformConfigs";

interface Variation {
  name: string;
  options: string[];
  prices?: number[];
  quantities?: number[];
}

interface VariationsSectionProps {
  variations: Variation[];
  onVariationsChange: (variations: Variation[]) => void;
  config: PlatformConfig;
}

export function VariationsSection({
  variations,
  onVariationsChange,
  config,
}: VariationsSectionProps) {
  const [newVariationName, setNewVariationName] = useState("");
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({});

  const addVariation = () => {
    if (!newVariationName.trim()) return;
    onVariationsChange([
      ...variations,
      { name: newVariationName.trim(), options: [] }
    ]);
    setNewVariationName("");
  };

  const removeVariation = (index: number) => {
    onVariationsChange(variations.filter((_, i) => i !== index));
  };

  const addOption = (variationIndex: number, option: string) => {
    if (!option.trim()) return;
    const updated = [...variations];
    if (!updated[variationIndex].options.includes(option.trim())) {
      updated[variationIndex].options.push(option.trim());
      onVariationsChange(updated);
    }
    setNewOptionInputs(prev => ({ ...prev, [variationIndex]: "" }));
  };

  const removeOption = (variationIndex: number, optionIndex: number) => {
    const updated = [...variations];
    updated[variationIndex].options.splice(optionIndex, 1);
    onVariationsChange(updated);
  };

  if (!config.hasVariations) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Variations</h2>
        <p className="text-muted-foreground">
          {config.name} does not support variations.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Variations</h2>
      
      {/* Existing Variations */}
      <div className="space-y-4 mb-6">
        {variations.map((variation, variationIndex) => (
          <div 
            key={variationIndex}
            className="border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">{variation.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVariation(variationIndex)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Options */}
            <div className="flex flex-wrap gap-2 mb-3">
              {variation.options.map((option, optionIndex) => (
                <Badge 
                  key={optionIndex}
                  variant="secondary"
                  className="gap-1 px-3 py-1"
                >
                  {option}
                  <button
                    onClick={() => removeOption(variationIndex, optionIndex)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {/* Add Option */}
            <div className="flex gap-2">
              <Input
                value={newOptionInputs[variationIndex] || ""}
                onChange={(e) => setNewOptionInputs(prev => ({ 
                  ...prev, 
                  [variationIndex]: e.target.value 
                }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption(variationIndex, newOptionInputs[variationIndex] || "");
                  }
                }}
                placeholder="Add option (e.g., Red, Large)"
                className="h-9"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addOption(variationIndex, newOptionInputs[variationIndex] || "")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add New Variation */}
      <div className="border-2 border-dashed border-border rounded-lg p-4">
        <Label className="text-sm text-muted-foreground mb-2 block">
          Add variation type
        </Label>
        <div className="flex gap-2">
          <Input
            value={newVariationName}
            onChange={(e) => setNewVariationName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addVariation();
              }
            }}
            placeholder="e.g., Color, Size, Material"
            className="h-10"
          />
          <Button onClick={addVariation}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
