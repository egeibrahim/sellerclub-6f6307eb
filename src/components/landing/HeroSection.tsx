import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/common/PlatformLogos";
import { useEffect, useState } from "react";

// Source platforms (left side)
const sourcePlatforms = [
  { id: "trendyol", name: "Trendyol" },
  { id: "etsy", name: "Etsy" },
  { id: "shopify", name: "Shopify" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "ikas", name: "ikas" },
];

// Destination platforms (right side)
const destPlatforms = [
  { id: "amazon", name: "Amazon" },
  { id: "hepsiburada", name: "Hepsiburada" },
  { id: "n11", name: "N11" },
  { id: "ciceksepeti", name: "Çiçeksepeti" },
  { id: "pazarama", name: "Pazarama" },
];

interface FlowingDot {
  id: number;
  sourceIndex: number;
  destIndex: number;
  phase: 'toCenter' | 'toDestination';
  progress: number;
}

export function HeroSection() {
  const [dots, setDots] = useState<FlowingDot[]>([]);
  const [dotId, setDotId] = useState(0);

  useEffect(() => {
    // Create new dots periodically
    const createDot = () => {
      const sourceIndex = Math.floor(Math.random() * sourcePlatforms.length);
      const destIndex = Math.floor(Math.random() * destPlatforms.length);
      
      setDotId(prev => prev + 1);
      setDots(prev => [...prev, {
        id: dotId,
        sourceIndex,
        destIndex,
        phase: 'toCenter',
        progress: 0
      }]);
    };

    const interval = setInterval(createDot, 400);
    return () => clearInterval(interval);
  }, [dotId]);

  useEffect(() => {
    // Animate dots
    const animationFrame = setInterval(() => {
      setDots(prev => {
        return prev
          .map(dot => {
            const newProgress = dot.progress + 0.02;
            
            if (dot.phase === 'toCenter' && newProgress >= 1) {
              return { ...dot, phase: 'toDestination' as const, progress: 0 };
            }
            
            if (dot.phase === 'toDestination' && newProgress >= 1) {
              return null;
            }
            
            return { ...dot, progress: newProgress };
          })
          .filter((dot): dot is FlowingDot => dot !== null);
      });
    }, 16);

    return () => clearInterval(animationFrame);
  }, []);

  const getSourcePosition = (index: number) => {
    const totalItems = sourcePlatforms.length;
    const spacing = 80;
    const startY = -(totalItems - 1) * spacing / 2;
    return { x: -320, y: startY + index * spacing };
  };

  const getDestPosition = (index: number) => {
    const totalItems = destPlatforms.length;
    const spacing = 80;
    const startY = -(totalItems - 1) * spacing / 2;
    return { x: 320, y: startY + index * spacing };
  };

  const getDotPosition = (dot: FlowingDot) => {
    const sourcePos = getSourcePosition(dot.sourceIndex);
    const destPos = getDestPosition(dot.destIndex);
    const centerX = 0;
    const centerY = 0;

    if (dot.phase === 'toCenter') {
      // Eased progress for smooth animation
      const eased = 1 - Math.pow(1 - dot.progress, 3);
      return {
        x: sourcePos.x + (centerX - sourcePos.x) * eased,
        y: sourcePos.y + (centerY - sourcePos.y) * eased,
        opacity: 1,
        scale: 0.8 + dot.progress * 0.4
      };
    } else {
      const eased = 1 - Math.pow(1 - dot.progress, 3);
      return {
        x: centerX + (destPos.x - centerX) * eased,
        y: centerY + (destPos.y - centerY) * eased,
        opacity: 1 - dot.progress * 0.5,
        scale: 1.2 - dot.progress * 0.4
      };
    }
  };

  return (
    <section id="home" className="pt-28 pb-16 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Text Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Tüm pazaryerlerini
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              tek merkezden yönet
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Ürünlerini bir platformdan al, AI ile optimize et ve saniyeler içinde 
            tüm pazaryerlerine listele. Tek tıkla çoklu kanal satışı.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="rounded-full px-10 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                Ücretsiz Dene
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-10 py-6 text-base font-medium"
            >
              Demo İzle
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            7 gün ücretsiz · Kredi kartı gerekmez
          </p>
        </div>

        {/* Animated Flow Diagram */}
        <div className="relative mx-auto w-full max-w-5xl h-[450px] flex items-center justify-center">
          {/* Connection Lines - Source to Center */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="lineGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {sourcePlatforms.map((_, index) => {
              const pos = getSourcePosition(index);
              return (
                <path
                  key={`source-line-${index}`}
                  d={`M ${pos.x + 380} ${pos.y + 225} Q ${pos.x + 480} ${pos.y + 225} 400 225`}
                  fill="none"
                  stroke="url(#lineGradientLeft)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })}
            {destPlatforms.map((_, index) => {
              const pos = getDestPosition(index);
              return (
                <path
                  key={`dest-line-${index}`}
                  d={`M 400 225 Q ${pos.x + 320} ${pos.y + 225} ${pos.x + 420} ${pos.y + 225}`}
                  fill="none"
                  stroke="url(#lineGradientRight)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Source Platforms (Left) */}
          <div className="absolute left-0 sm:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
            {sourcePlatforms.map((platform, index) => (
              <div
                key={platform.id}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <PlatformLogo platform={platform.id} size={36} />
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>

          {/* Center Hub - Seller Club */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              {/* Pulsing rings */}
              <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 -m-2 rounded-full bg-primary/20 animate-pulse" />
              
              {/* Main hub */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30">
                <div className="text-center">
                  <span className="text-primary-foreground font-bold text-lg sm:text-xl">Seller</span>
                  <br />
                  <span className="text-primary-foreground font-bold text-lg sm:text-xl">Club</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-2 bg-card border border-border rounded-full shadow-sm">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                AI ile optimize et
              </span>
            </div>
          </div>

          {/* Destination Platforms (Right) */}
          <div className="absolute right-0 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
            {destPlatforms.map((platform, index) => (
              <div
                key={platform.id}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {platform.name}
                </span>
                <PlatformLogo platform={platform.id} size={36} />
              </div>
            ))}
          </div>

          {/* Flowing Dots */}
          {dots.map(dot => {
            const pos = getDotPosition(dot);
            const sourceColor = dot.phase === 'toCenter' ? 'bg-primary' : 'bg-primary';
            
            return (
              <div
                key={dot.id}
                className={`absolute w-3 h-3 rounded-full ${sourceColor} shadow-lg shadow-primary/50`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  transition: 'none',
                }}
              />
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">11+</div>
            <div className="text-sm text-muted-foreground">Pazaryeri</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">%90</div>
            <div className="text-sm text-muted-foreground">Zaman Tasarrufu</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">AI</div>
            <div className="text-sm text-muted-foreground">Akıllı Optimizasyon</div>
          </div>
        </div>
      </div>
    </section>
  );
}
