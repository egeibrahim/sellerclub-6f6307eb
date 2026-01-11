import { 
  Zap, 
  Brain, 
  Layers, 
  BarChart3, 
  Wand2, 
  RefreshCw,
  Image,
  Tags,
  ShoppingCart
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Çoklu Kanal Yönetimi",
    description: "Tüm pazaryerlerinizi tek bir panelden yönetin. Amazon, Etsy, Trendyol ve daha fazlası.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Brain,
    title: "AI Destekli Optimizasyon",
    description: "Yapay zeka ile ürün başlıklarınızı, açıklamalarınızı ve fiyatlarınızı optimize edin.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Zap,
    title: "Toplu Düzenleme",
    description: "Binlerce ürünü saniyeler içinde güncelleyin. CSV import/export desteği.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Gelişmiş Analitik",
    description: "Satış performansınızı takip edin, trendleri analiz edin ve büyüme fırsatlarını keşfedin.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Wand2,
    title: "Akıllı Fiyatlandırma",
    description: "Dinamik fiyatlandırma kuralları oluşturun ve rakiplerinizi takip edin.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: RefreshCw,
    title: "Otomatik Senkronizasyon",
    description: "Stok ve sipariş bilgileriniz tüm platformlarda gerçek zamanlı senkronize olsun.",
    color: "from-cyan-500 to-teal-500",
  },
  {
    icon: Image,
    title: "Fotoğraf Stüdyosu",
    description: "AI ile arka plan kaldırma, düzenleme ve profesyonel ürün fotoğrafları oluşturun.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Tags,
    title: "SEO Optimizasyonu",
    description: "Arama motorları için optimize edilmiş listelemeleri otomatik oluşturun.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: ShoppingCart,
    title: "Sipariş Yönetimi",
    description: "Tüm siparişlerinizi tek yerden takip edin ve yönetin.",
    color: "from-slate-500 to-gray-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            E-Ticaret Yönetiminde
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Yeni Nesil Araçlar
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            İşinizi büyütmek için ihtiyacınız olan tüm araçlar tek bir platformda
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 lg:p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
