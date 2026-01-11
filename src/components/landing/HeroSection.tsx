import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlatformLogo, platformBgColors } from "@/components/common/PlatformLogos";

// Turkish marketplace platforms
const platforms = [
  { id: "trendyol", name: "Trendyol" },
  { id: "hepsiburada", name: "Hepsiburada" },
  { id: "amazon", name: "Amazon" },
  { id: "n11", name: "N11" },
  { id: "ciceksepeti", name: "Çiçeksepeti" },
  { id: "ikas", name: "ikas" },
  { id: "shopify", name: "Shopify" },
  { id: "etsy", name: "Etsy" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "pazarama", name: "Pazarama" },
  { id: "pttavm", name: "PTT AVM" },
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
                    key={platform.id}
                    className="absolute left-1/2 top-1/2 transition-transform duration-300"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div className="hover:scale-110 transition-transform cursor-default">
                      <PlatformLogo platform={platform.id} size={44} />
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
