const toolsRow1 = [
  "Listeleme Oluştur",
  "CSV İçe Aktar",
  "Toplu Düzenleme",
  "Listeleme Puanlama",
  "SEO Optimizasyonu",
  "Fiyat Karşılaştırma",
  "Stok Takibi",
  "Kategori Eşleme",
];

const toolsRow2 = [
  "Ürün Kopyalama",
  "Toplu Yayınlama",
  "Varyasyon Yönetimi",
  "Tag Optimizasyonu",
  "Açıklama Yazıcı",
  "Başlık Optimizasyonu",
  "Rakip Analizi",
  "Performans Raporu",
];

const toolsRow3 = [
  "Fotoğraf Stüdyosu",
  "Arka Plan Kaldırma",
  "AI Görsel Üretimi",
  "Video Oluşturma",
  "Logo Ekleme",
  "Boyut Ayarlama",
  "Watermark Ekleme",
  "Format Dönüştürme",
];

function MarqueeRow({ tools, direction = "left", speed = 30 }: { tools: string[]; direction?: "left" | "right"; speed?: number }) {
  const duplicatedTools = [...tools, ...tools];
  
  return (
    <div className="flex overflow-hidden py-2">
      <div
        className={`flex gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{ 
          animationDuration: `${speed}s`,
        }}
      >
        {duplicatedTools.map((tool, index) => (
          <div
            key={`${tool}-${index}`}
            className="flex-shrink-0 px-6 py-3 rounded-full bg-card border text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/50 transition-colors whitespace-nowrap"
          >
            {tool}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolsMarquee() {
  return (
    <section className="py-20 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Güçlü Araçlar Koleksiyonu
          </h2>
          <p className="text-lg text-muted-foreground">
            İşinizi kolaylaştıran 50'den fazla araç
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-[100vw]">
        <MarqueeRow tools={toolsRow1} direction="left" speed={35} />
        <MarqueeRow tools={toolsRow2} direction="right" speed={40} />
        <MarqueeRow tools={toolsRow3} direction="left" speed={30} />
      </div>
    </section>
  );
}
