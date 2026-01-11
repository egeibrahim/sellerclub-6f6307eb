import { useState, useRef, useCallback } from "react";
import { Image, X, Loader2, Upload, GripVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PlatformConfig } from "@/config/platformConfigs";

interface PhotosSectionProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  config: PlatformConfig;
  error?: string;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function PhotosSection({
  images,
  onImagesChange,
  config,
  error,
}: PhotosSectionProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Desteklenmeyen format. JPG, PNG, WEBP veya GIF kullanın.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Dosya boyutu 10MB'dan büyük olamaz.`;
    }
    return null;
  };

  const uploadToStorage = async (file: File, uploadId: string): Promise<string | null> => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return null;
    }

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      // Update progress
      setUploadingImages(prev => 
        prev.map(img => img.id === uploadId ? { ...img, progress: 30 } : img)
      );

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update progress
      setUploadingImages(prev => 
        prev.map(img => img.id === uploadId ? { ...img, progress: 80 } : img)
      );

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      // Update progress to complete
      setUploadingImages(prev => 
        prev.map(img => img.id === uploadId ? { ...img, progress: 100 } : img)
      );

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadingImages(prev => 
        prev.map(img => img.id === uploadId 
          ? { ...img, error: err.message || 'Yükleme başarısız' } 
          : img
        )
      );
      return null;
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = config.maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimum ${config.maxImages} görsel ekleyebilirsiniz`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    filesToUpload.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }

    if (validFiles.length === 0) return;

    // Create uploading previews
    const newUploading: UploadingImage[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploadingImages(prev => [...prev, ...newUploading]);

    // Upload all files
    const uploadPromises = newUploading.map(async (upload) => {
      const url = await uploadToStorage(upload.file, upload.id);
      return { id: upload.id, url };
    });

    const results = await Promise.all(uploadPromises);
    
    // Get successful uploads
    const successfulUrls = results
      .filter(r => r.url !== null)
      .map(r => r.url as string);

    // Update images with new URLs
    if (successfulUrls.length > 0) {
      onImagesChange([...images, ...successfulUrls]);
      toast.success(`${successfulUrls.length} görsel yüklendi`);
    }

    // Clean up uploading state and previews
    setTimeout(() => {
      newUploading.forEach(upload => URL.revokeObjectURL(upload.preview));
      setUploadingImages(prev => 
        prev.filter(img => !newUploading.find(u => u.id === img.id))
      );
    }, 500);
  }, [images, config.maxImages, onImagesChange, user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle file drop
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Try to delete from storage if it's a Supabase URL
    if (imageUrl.includes(BUCKET_NAME)) {
      try {
        const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
        if (urlParts[1]) {
          await supabase.storage.from(BUCKET_NAME).remove([urlParts[1]]);
        }
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    onImagesChange(images.filter((_, i) => i !== index));
  };

  // Drag and drop reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Görseller <span className="text-destructive">*</span>
        </h2>
        <span className="text-sm text-muted-foreground">
          {images.length} / {config.maxImages} (min: {config.minImages})
        </span>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Main Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 mb-4 transition-all",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-muted-foreground/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={cn(
            "h-10 w-10 mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm font-medium mb-1">
            {isDragging ? "Görselleri bırakın" : "Görselleri sürükleyip bırakın"}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            veya
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Dosya Seç
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            JPG, PNG, WEBP veya GIF • Maksimum 10MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div 
            key={`${image}-${index}`}
            draggable
            onDragStart={(e) => handleImageDragStart(e, index)}
            onDragOver={(e) => handleImageDragOver(e, index)}
            onDragEnd={handleImageDragEnd}
            className={cn(
              "relative aspect-square border rounded-lg overflow-hidden group cursor-move",
              draggedIndex === index ? "opacity-50 border-primary" : "border-border"
            )}
          >
            <img 
              src={image} 
              alt={`Ürün ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Drag Handle */}
            <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-3 w-3 text-white" />
            </div>
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="h-3 w-3 text-white" />
            </button>
            
            {/* Main Badge */}
            {index === 0 && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-[10px] font-medium">
                Ana
              </div>
            )}
          </div>
        ))}
        
        {/* Uploading Images */}
        {uploadingImages.map((upload) => (
          <div 
            key={upload.id}
            className="relative aspect-square border border-border rounded-lg overflow-hidden bg-muted"
          >
            <img 
              src={upload.preview} 
              alt="Yükleniyor"
              className="w-full h-full object-cover opacity-50"
            />
            
            {/* Progress Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              {upload.error ? (
                <div className="text-center p-2">
                  <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                  <p className="text-[10px] text-white">{upload.error}</p>
                </div>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                  <span className="text-[10px] text-white mt-1">{upload.progress}%</span>
                </>
              )}
            </div>
            
            {/* Progress Bar */}
            {!upload.error && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
        
        {/* Add More Button */}
        {images.length < config.maxImages && uploadingImages.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-colors",
              "border-border hover:border-primary hover:bg-primary/5"
            )}
          >
            <Image className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Ekle</span>
          </button>
        )}
      </div>
      
      {/* Help Text */}
      <p className="text-xs text-muted-foreground mt-3">
        İlk görsel ana görsel olarak kullanılır. Sıralamayı değiştirmek için görselleri sürükleyip bırakın.
      </p>
    </div>
  );
}
