import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Turkish marketplace platforms with their brand colors
const platforms = [
  { name: "Trendyol", color: "#F27A1A", textColor: "#fff", icon: "T" },
  { name: "Hepsiburada", color: "#FF6000", textColor: "#fff", icon: "hb" },
  { name: "Amazon", color: "#232F3E", textColor: "#FF9900", icon: "a" },
  { name: "N11", color: "#7B2CBF", textColor: "#fff", icon: "n11" },
  { name: "Çiçeksepeti", color: "#E31E52", textColor: "#fff", icon: "Ç" },
  { name: "ikas", color: "#6366F1", textColor: "#fff", icon: "ikas" },
  { name: "Shopify", color: "#96BF48", textColor: "#fff", icon: "S" },
  { name: "Etsy", color: "#F56400", textColor: "#fff", icon: "e" },
  { name: "WooCommerce", color: "#96588A", textColor: "#fff", icon: "W" },
  { name: "Pazarama", color: "#00A4EF", textColor: "#fff", icon: "P" },
  { name: "PTTAvm", color: "#FFD100", textColor: "#1a1a1a", icon: "P" },
];

export function HeroSection() {
  return (
    <section id="home" className="pt-24 pb-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center relative">
          {/* Orbit Container */}
          <div className="relative mx-auto w-full max-w-4xl h-[420px] sm:h-[500px] flex items-center justify-center">
            {/* Orbit Path - Elliptical */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-[500px] h-[280px] sm:w-[700px] sm:h-[350px] border border-dashed border-gray-300 rounded-[50%]"
                style={{ transform: 'rotateX(65deg) rotateZ(-5deg)' }}
              />
            </div>

            {/* Orbiting Platforms */}
            <div className="absolute inset-0 pointer-events-none">
              {platforms.map((platform, index) => {
                const totalPlatforms = platforms.length;
                const angle = (index / totalPlatforms) * 360 - 90;
                const radiusX = 320;
                const radiusY = 160;
                const x = Math.cos((angle * Math.PI) / 180) * radiusX;
                const y = Math.sin((angle * Math.PI) / 180) * radiusY;
                
                return (
                  <div
                    key={platform.name}
                    className="absolute left-1/2 top-1/2 transition-transform duration-300"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg hover:scale-110 transition-transform cursor-default"
                      style={{ 
                        backgroundColor: platform.color,
                        color: platform.textColor,
                      }}
                      title={platform.name}
                    >
                      {platform.icon}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Content */}
            <div className="relative z-10 text-center px-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
                E-Ticaret satıcıları için
                <br />
                <span className="text-foreground">AI destekli güç</span>
              </h1>

              <div className="mt-8">
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="rounded-full px-10 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-white"
                  >
                    Başla
                  </Button>
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                  1 hafta ücretsiz deneme · Kredi kartı gerekmez
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
