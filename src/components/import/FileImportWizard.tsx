import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download,
  X,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FileImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetShopId?: string | null;
  targetPlatform?: string;
}

interface ParsedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  brand: string;
  images: string[];
  selected: boolean;
  hasError: boolean;
  errorMessage?: string;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

// CSV template columns
const TEMPLATE_COLUMNS = [
  'title',
  'description', 
  'price',
  'stock',
  'sku',
  'category',
  'brand',
  'image_url_1',
  'image_url_2',
  'image_url_3',
];

export function FileImportWizard({ 
  open, 
  onOpenChange, 
  targetShopId,
  targetPlatform 
}: FileImportWizardProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetWizard = () => {
    setStep('upload');
    setFile(null);
    setParsedProducts([]);
    setImportProgress({ current: 0, total: 0 });
    setImportedCount(0);
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csvContent = TEMPLATE_COLUMNS.join(',') + '\n' +
      'Örnek Ürün Başlığı,Ürün açıklaması burada,99.99,100,SKU-001,Elektronik,Marka Adı,https://example.com/image1.jpg,https://example.com/image2.jpg,';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Şablon indirildi');
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      const product: ParsedProduct = {
        id: `import-${index}`,
        title: getColumnValue(headers, values, ['title', 'başlık', 'ürün adı', 'name']) || '',
        description: getColumnValue(headers, values, ['description', 'açıklama', 'desc']) || '',
        price: parseFloat(getColumnValue(headers, values, ['price', 'fiyat', 'satiş fiyatı']) || '0') || 0,
        stock: parseInt(getColumnValue(headers, values, ['stock', 'stok', 'quantity', 'miktar']) || '0') || 0,
        sku: getColumnValue(headers, values, ['sku', 'stok kodu', 'barkod']) || '',
        category: getColumnValue(headers, values, ['category', 'kategori']) || '',
        brand: getColumnValue(headers, values, ['brand', 'marka']) || '',
        images: [
          getColumnValue(headers, values, ['image_url_1', 'image1', 'görsel1', 'resim1']),
          getColumnValue(headers, values, ['image_url_2', 'image2', 'görsel2', 'resim2']),
          getColumnValue(headers, values, ['image_url_3', 'image3', 'görsel3', 'resim3']),
        ].filter(Boolean) as string[],
        selected: true,
        hasError: false,
      };

      // Validate
      if (!product.title) {
        product.hasError = true;
        product.errorMessage = 'Başlık gerekli';
      }

      return product;
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const getColumnValue = (headers: string[], values: string[], possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const index = headers.indexOf(name.toLowerCase());
      if (index !== -1 && values[index]) {
        return values[index];
      }
    }
    return '';
  };

  const parseExcel = async (file: File): Promise<ParsedProduct[]> => {
    // For Excel files, we'll read as text and try to parse
    // In production, you'd want to use a library like xlsx
    toast.info('Excel desteği için CSV formatını kullanın');
    return [];
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    try {
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        const products = parseCSV(text);
        
        if (products.length === 0) {
          setError('Dosyada ürün bulunamadı. Lütfen şablonu kontrol edin.');
          return;
        }

        setParsedProducts(products);
        setStep('preview');
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const products = await parseExcel(selectedFile);
        if (products.length > 0) {
          setParsedProducts(products);
          setStep('preview');
        } else {
          setError('Lütfen CSV formatını kullanın.');
        }
      } else {
        setError('Desteklenmeyen dosya formatı. CSV veya Excel dosyası yükleyin.');
      }
    } catch (err) {
      console.error('File parse error:', err);
      setError('Dosya okunamadı. Lütfen formatı kontrol edin.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const toggleProduct = (productId: string) => {
    setParsedProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, selected: !p.selected } : p)
    );
  };

  const toggleAll = (selected: boolean) => {
    setParsedProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    const selectedProducts = parsedProducts.filter(p => p.selected && !p.hasError);
    if (selectedProducts.length === 0) {
      toast.error('En az bir geçerli ürün seçin');
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: selectedProducts.length });

    let imported = 0;

    for (const product of selectedProducts) {
      try {
        if (targetShopId) {
          // Import to marketplace_listings
          await supabase.from('marketplace_listings').insert({
            user_id: user.id,
            shop_connection_id: targetShopId,
            platform: targetPlatform || 'imported',
            title: product.title,
            description: product.description,
            price: product.price,
            status: 'imported',
            marketplace_data: {
              sku: product.sku,
              stock: product.stock,
              category: product.category,
              brand: product.brand,
              images: product.images,
            },
          });
        } else {
          // Import to master_products
          await supabase.from('master_products').insert({
            user_id: user.id,
            title: product.title,
            description: product.description,
            price: product.price,
            sku: product.sku || `IMP-${Date.now()}-${imported}`,
            category: product.category,
            brand: product.brand,
            status: 'draft',
            images: product.images.length > 0 ? product.images : null,
          });
        }

        imported++;
      } catch (err) {
        console.error('Failed to import product:', product.title, err);
      }

      setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    setImportedCount(imported);
    setStep('complete');
  };

  const selectedCount = parsedProducts.filter(p => p.selected && !p.hasError).length;
  const errorCount = parsedProducts.filter(p => p.hasError).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Dosyadan Ürün İthal Et'}
            {step === 'preview' && 'Ürünleri Önizle'}
            {step === 'importing' && 'Ürünler İthal Ediliyor...'}
            {step === 'complete' && 'İthalat Tamamlandı'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'CSV veya Excel dosyası yükleyerek toplu ürün ekleyin'}
            {step === 'preview' && 'İthal edilecek ürünleri gözden geçirin'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Drop Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Dosya yüklemek için tıklayın veya sürükleyin</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV veya Excel dosyası (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CSV Şablonu</p>
                  <p className="text-xs text-muted-foreground">
                    Doğru formatta dosya hazırlamak için şablonu indirin
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            </div>

            {/* Supported Columns */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Desteklenen sütunlar:</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_COLUMNS.map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {parsedProducts.length} ürün bulundu
                </p>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} hatalı
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Tümünü Seç
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Seçimi Kaldır
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {parsedProducts.map((product) => (
                  <label
                    key={product.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded hover:bg-muted/50 cursor-pointer",
                      product.hasError && "bg-destructive/5 border border-destructive/20"
                    )}
                  >
                    <Checkbox
                      checked={product.selected}
                      onCheckedChange={() => toggleProduct(product.id)}
                      disabled={product.hasError}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {product.title || '(Başlık yok)'}
                        </p>
                        {product.hasError && (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {product.errorMessage}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>₺{product.price.toLocaleString('tr-TR')}</span>
                        <span>•</span>
                        <span>{product.stock} stok</span>
                        {product.sku && (
                          <>
                            <span>•</span>
                            <span>SKU: {product.sku}</span>
                          </>
                        )}
                        {product.category && (
                          <>
                            <span>•</span>
                            <span>{product.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {product.images.length > 0 && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {product.images.length} görsel
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </ScrollArea>

            {file && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => {
                    setFile(null);
                    setParsedProducts([]);
                    setStep('upload');
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Geri
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <ArrowRight className="h-4 w-4 mr-2" />
                {selectedCount} Ürünü İthal Et
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground mb-2">
              Ürünler ithal ediliyor...
            </p>
            <p className="text-sm text-muted-foreground">
              {importProgress.current} / {importProgress.total}
            </p>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-lg font-medium mb-1">İthalat Tamamlandı!</p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {importedCount} ürün başarıyla {targetShopId ? 'mağazaya' : 'master ürünlere'} eklendi.
              <br />
              <span className="text-xs">Ürünler "Imported" veya "Draft" statüsünde.</span>
            </p>
            <Button onClick={handleClose}>Kapat</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
