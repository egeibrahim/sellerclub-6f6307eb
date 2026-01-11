import { useState, useRef } from "react";
import { Image, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformConfig } from "@/config/platformConfigs";

interface PhotosSectionProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  config: PlatformConfig;
  error?: string;
}

export function PhotosSection({
  images,
  onImagesChange,
  config,
  error,
}: PhotosSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    // For now, just create object URLs - in production, upload to storage
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    const totalImages = [...images, ...newImages].slice(0, config.maxImages);
    onImagesChange(totalImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Photos</h2>
        <span className="text-sm text-muted-foreground">
          {images.length} / {config.maxImages} (min: {config.minImages})
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}
      
      <div className="flex flex-wrap gap-3">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div 
            key={index}
            className="relative w-36 h-36 border border-border rounded-lg overflow-hidden group"
          >
            <img 
              src={image} 
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-xs text-white">
                Main
              </div>
            )}
          </div>
        ))}
        
        {/* Upload Button */}
        {images.length < config.maxImages && (
          <div
            className={cn(
              "w-36 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary hover:bg-primary/5"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Image className="h-8 w-8 text-primary" />
            <span className="text-sm text-primary font-medium">Upload</span>
          </div>
        )}
      </div>
    </div>
  );
}
