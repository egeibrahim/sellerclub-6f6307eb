import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const platforms = [
  { name: "Amazon", color: "#FF9900", icon: "🛒" },
  { name: "Etsy", color: "#F56400", icon: "🎨" },
  { name: "Trendyol", color: "#F27A1A", icon: "🛍️" },
  { name: "Hepsiburada", color: "#FF6000", icon: "📦" },
  { name: "Shopify", color: "#96BF48", icon: "🏪" },
  { name: "N11", color: "#7B2CBF", icon: "🔮" },
  { name: "Çiçeksepeti", color: "#E31E52", icon: "🌸" },
  { name: "ikas", color: "#6366F1", icon: "💎" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI Destekli E-Ticaret Yönetimi</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in">
              Tüm Pazaryerlerini
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Tek Yerden Yönetin
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-fade-in">
              Amazon, Etsy, Trendyol, Hepsiburada ve daha fazlası. Ürünlerinizi 
              tek panelden yönetin, AI ile optimize edin, satışlarınızı katlayın.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-8 py-6 shadow-lg shadow-primary/25"
                >
                  Ücretsiz Başla
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Özellikleri Keşfet
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>14 gün ücretsiz deneme</span>
              </div>
            </div>
          </div>

          {/* Right Content - Animated Platform Orbit */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96">
              {/* Center Hub */}
              <div className="absolute inset-1/3 bg-gradient-to-br from-primary to-primary/70 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center z-10">
                <span className="text-primary-foreground font-bold text-3xl">M</span>
              </div>

              {/* Orbiting Platforms */}
              {platforms.map((platform, index) => {
                const angle = (index * 360) / platforms.length;
                const delay = index * 0.5;
                return (
                  <div
                    key={platform.name}
                    className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card shadow-lg border flex items-center justify-center text-2xl animate-orbit"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${angle}deg) translateX(140px) rotate(-${angle}deg)`,
                      animationDelay: `${delay}s`,
                    }}
                    title={platform.name}
                  >
                    {platform.icon}
                  </div>
                );
              })}

              {/* Orbit Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/20 animate-spin-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
