import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Başlangıç",
    price: "Ücretsiz",
    period: "",
    description: "Küçük satıcılar için temel özellikler",
    features: [
      "50 ürüne kadar",
      "1 mağaza bağlantısı",
      "Temel AI araçları",
      "E-posta desteği",
    ],
    cta: "Ücretsiz Başla",
    popular: false,
  },
  {
    name: "Profesyonel",
    price: "₺499",
    period: "/ay",
    description: "Büyüyen işletmeler için gelişmiş özellikler",
    features: [
      "Sınırsız ürün",
      "5 mağaza bağlantısı",
      "Gelişmiş AI araçları",
      "Öncelikli destek",
      "Toplu düzenleme",
      "Analitik raporlar",
    ],
    cta: "Pro'ya Geç",
    popular: true,
  },
  {
    name: "İşletme",
    price: "₺999",
    period: "/ay",
    description: "Büyük ekipler için kurumsal çözümler",
    features: [
      "Sınırsız her şey",
      "Sınırsız mağaza",
      "Tüm AI araçları",
      "7/24 telefon desteği",
      "API erişimi",
      "Özel entegrasyonlar",
      "Özel eğitim",
    ],
    cta: "İletişime Geç",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Basit ve Şeffaf Fiyatlandırma
          </h2>
          <p className="mt-4 text-muted-foreground">
            İşinize uygun planı seçin, istediğiniz zaman yükseltin
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-foreground text-white ring-2 ring-foreground"
                  : "bg-white border border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                    En Popüler
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-xl font-semibold ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? "text-gray-300" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.popular ? "text-gray-300" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-primary" : "text-primary"}`} />
                    <span className={`text-sm ${plan.popular ? "text-gray-200" : "text-muted-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/auth">
                <Button
                  className={`w-full rounded-full ${
                    plan.popular
                      ? "bg-white text-foreground hover:bg-gray-100"
                      : "bg-foreground text-white hover:bg-foreground/90"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
