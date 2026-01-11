const platforms = [
  { name: "Amazon", logo: "🛒", color: "#FF9900" },
  { name: "Etsy", logo: "🎨", color: "#F56400" },
  { name: "Trendyol", logo: "🛍️", color: "#F27A1A" },
  { name: "Hepsiburada", logo: "📦", color: "#FF6000" },
  { name: "Shopify", logo: "🏪", color: "#96BF48" },
  { name: "N11", logo: "🔮", color: "#7B2CBF" },
  { name: "Çiçeksepeti", logo: "🌸", color: "#E31E52" },
  { name: "ikas", logo: "💎", color: "#6366F1" },
  { name: "eBay", logo: "🏷️", color: "#E53238" },
  { name: "WooCommerce", logo: "🔧", color: "#96588A" },
  { name: "GittiGidiyor", logo: "🚀", color: "#FF6000" },
  { name: "Morhipo", logo: "👗", color: "#00B5AD" },
];

export function PlatformsSection() {
  return (
    <section id="platforms" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Tüm Pazaryerleriniz
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Tek Çatı Altında
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            En popüler e-ticaret platformlarıyla entegre çalışın
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className="group relative p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all duration-300 hover:shadow-lg text-center animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Platform Logo/Icon */}
              <div 
                className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300"
              >
                {platform.logo}
              </div>

              {/* Platform Name */}
              <div className="font-medium text-foreground text-sm">
                {platform.name}
              </div>

              {/* Hover Glow Effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{ backgroundColor: platform.color }}
              />
            </div>
          ))}
        </div>

        {/* More Platforms Coming */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Ve daha fazlası... Sürekli yeni entegrasyonlar ekleniyor!
          </p>
        </div>
      </div>
    </section>
  );
}
