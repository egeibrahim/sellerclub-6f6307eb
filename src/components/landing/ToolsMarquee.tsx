const toolsRow1 = [
  "Ürün oluştur",
  "CSV içe aktar",
  "Toplu düzenleme",
  "Ürün puanlama",
  "Yayın planlama",
  "POD desteği",
  "Aktif kanallar",
  "Medya kütüphanesi",
  "Kırp & genişlet",
];

const toolsRow2 = [
  "Ürün optimize et",
  "Ürün düzenle",
  "Ürün kopyala",
  "Ürün birleştir",
  "Özellik puanlama",
  "Güncelleme planlama",
  "Ürün profilleri",
  "Fotoğraf birleştirme",
  "Mockup oluşturma",
];

const toolsRow3 = [
  "Ürün izole et",
  "Çapraz kanal kopyala",
  "Video oluşturma",
  "Fotoğraf arka planları",
  "Ürün yayınla",
  "Çoklu kanal",
  "CSV dışa aktar",
  "Alt metin oluşturma",
  "Fotoğraf iyileştirme",
];

function MarqueeRow({ tools, direction = "left", speed = 30 }: { tools: string[]; direction?: "left" | "right"; speed?: number }) {
  const duplicatedTools = [...tools, ...tools, ...tools];
  
  return (
    <div className="flex overflow-hidden py-2">
      <div 
        className={`flex gap-3 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicatedTools.map((tool, index) => (
          <span
            key={index}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-foreground whitespace-nowrap"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ToolsMarquee() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground">
          <span className="italic text-primary">100+ AI aracı</span>{" "}
          tek platformda
          <br />
          <span className="italic text-primary">e-ticaret</span> için tasarlandı
        </h2>
      </div>
      
      <div className="space-y-3">
        <MarqueeRow tools={toolsRow1} direction="left" speed={40} />
        <MarqueeRow tools={toolsRow2} direction="right" speed={35} />
        <MarqueeRow tools={toolsRow3} direction="left" speed={45} />
      </div>
    </section>
  );
}
