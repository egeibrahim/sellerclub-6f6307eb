import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Başlangıç",
    description: "Küçük işletmeler için ideal başlangıç",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      { text: "1 Pazaryeri Entegrasyonu", included: true },
      { text: "100 Ürün Limiti", included: true },
      { text: "Temel Analitik", included: true },
      { text: "E-posta Desteği", included: true },
      { text: "AI Optimizasyonu", included: false },
      { text: "Toplu Düzenleme", included: false },
      { text: "Fotoğraf Stüdyosu", included: false },
      { text: "Öncelikli Destek", included: false },
    ],
    cta: "Ücretsiz Başla",
    ctaVariant: "outline" as const,
  },
  {
    name: "Profesyonel",
    description: "Büyüyen işletmeler için",
    monthlyPrice: 299,
    yearlyPrice: 249,
    popular: true,
    features: [
      { text: "5 Pazaryeri Entegrasyonu", included: true },
      { text: "5.000 Ürün Limiti", included: true },
      { text: "Gelişmiş Analitik", included: true },
      { text: "Öncelikli E-posta Desteği", included: true },
      { text: "AI Optimizasyonu", included: true },
      { text: "Toplu Düzenleme", included: true },
      { text: "Fotoğraf Stüdyosu", included: true },
      { text: "Öncelikli Destek", included: false },
    ],
    cta: "14 Gün Ücretsiz Dene",
    ctaVariant: "default" as const,
  },
  {
    name: "İşletme",
    description: "Büyük ölçekli operasyonlar için",
    monthlyPrice: 799,
    yearlyPrice: 649,
    popular: false,
    features: [
      { text: "Sınırsız Pazaryeri", included: true },
      { text: "Sınırsız Ürün", included: true },
      { text: "Özel Raporlama", included: true },
      { text: "7/24 Telefon Desteği", included: true },
      { text: "AI Optimizasyonu Pro", included: true },
      { text: "Toplu Düzenleme Pro", included: true },
      { text: "Fotoğraf Stüdyosu Pro", included: true },
      { text: "Özel Hesap Yöneticisi", included: true },
    ],
    cta: "İletişime Geç",
    ctaVariant: "outline" as const,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Basit ve Şeffaf
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Fiyatlandırma
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            İşletmenizin büyüklüğüne uygun planı seçin
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={cn("text-sm", !isYearly && "text-foreground font-medium")}>
            Aylık
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative w-14 h-7 rounded-full transition-colors",
              isYearly ? "bg-primary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                isYearly ? "left-8" : "left-1"
              )}
            />
          </button>
          <span className={cn("text-sm", isYearly && "text-foreground font-medium")}>
            Yıllık
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded-full">
              %17 Tasarruf
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-6 lg:p-8 rounded-2xl border transition-all duration-300 animate-fade-in",
                plan.popular
                  ? "bg-card border-primary shadow-xl shadow-primary/10 scale-105 z-10"
                  : "bg-card hover:border-primary/50 hover:shadow-lg"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    <Sparkles className="w-4 h-4" />
                    En Popüler
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ₺{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/ay</span>
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Yıllık faturalandırma
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Link to="/auth" className="block mb-6">
                <Button
                  variant={plan.ctaVariant}
                  className={cn(
                    "w-full",
                    plan.popular &&
                      "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  )}
                >
                  {plan.cta}
                </Button>
              </Link>

              {/* Features List */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            ✨ 14 gün ücretsiz deneme • 💳 Kredi kartı gerekmez • 🔒 İstediğiniz zaman iptal
          </p>
        </div>
      </div>
    </section>
  );
}
