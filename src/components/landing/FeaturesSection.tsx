import { Zap, Brain, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Daha Hızlı Çalış",
    description: "Seller Club, sayısız görevi gerçekleştirmek için harcanan zamanı kısaltır ve satıcıların yaratmaya odaklanmasını sağlar",
  },
  {
    icon: Brain,
    title: "Daha Akıllı Sat",
    description: "Seller Club, en son AI araçlarını özel verilerle entegre ederek platform genelinde eyleme dönüştürülebilir içgörüler sunar",
  },
  {
    icon: TrendingUp,
    title: "Daha Fazla Büyü",
    description: "Seller Club, çoklu e-ticaret platformlarını destekler, satıcıların mağazalarını merkezileştirmesini ve yeni kanallar açmasını sağlar",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center px-6"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-6">
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
