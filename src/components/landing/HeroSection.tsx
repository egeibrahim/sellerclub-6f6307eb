import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/common/PlatformLogos";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

// All platforms for bidirectional flow
const allPlatforms = [
  { id: "trendyol", name: "Trendyol" },
  { id: "hepsiburada", name: "Hepsiburada" },
  { id: "amazon", name: "Amazon" },
  { id: "n11", name: "N11" },
  { id: "ciceksepeti", name: "Çiçeksepeti" },
  { id: "etsy", name: "Etsy" },
  { id: "shopify", name: "Shopify" },
  { id: "ikas", name: "ikas" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "pazarama", name: "Pazarama" },
];

interface FlowingParticle {
  id: number;
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

export function HeroSection() {
  const [particles, setParticles] = useState<FlowingParticle[]>([]);
  const [particleId, setParticleId] = useState(0);

  // Create particles
  useEffect(() => {
    const createParticle = () => {
      const fromIndex = Math.floor(Math.random() * allPlatforms.length);
      let toIndex = Math.floor(Math.random() * allPlatforms.length);
      while (toIndex === fromIndex) {
        toIndex = Math.floor(Math.random() * allPlatforms.length);
      }

      setParticleId(prev => {
        const newId = prev + 1;
        setParticles(p => [...p, {
          id: newId,
          fromIndex,
          toIndex,
          progress: 0,
          speed: 0.008 + Math.random() * 0.006
        }]);
        return newId;
      });
    };

    const interval = setInterval(createParticle, 200);
    return () => clearInterval(interval);
  }, []);

  // Animate particles
  useEffect(() => {
    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1)
      );
    };

    const frame = setInterval(animate, 16);
    return () => clearInterval(frame);
  }, []);

  const getPlatformPosition = (index: number) => {
    const angle = (index / allPlatforms.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 200;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle
    };
  };

  const getParticlePosition = (particle: FlowingParticle) => {
    const from = getPlatformPosition(particle.fromIndex);
    const to = getPlatformPosition(particle.toIndex);
    const t = particle.progress;
    
    // Bezier curve through center (0,0)
    const mt = 1 - t;
    const x = mt * mt * from.x + 2 * mt * t * 0 + t * t * to.x;
    const y = mt * mt * from.y + 2 * mt * t * 0 + t * t * to.y;
    
    return { x, y };
  };

  return (
    <section id="home" className="relative pt-24 pb-8 overflow-hidden min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Text Content */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Tüm pazaryerlerini
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              tek merkezden yönet
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Ürünlerini bir platformdan al, AI ile optimize et ve saniyeler içinde 
            tüm pazaryerlerine listele. Tek tıkla çoklu kanal satışı.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="rounded-full px-10 py-6 text-base font-medium bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/30 border-0"
              >
                Ücretsiz Dene
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-10 py-6 text-base font-medium border-slate-600 text-white hover:bg-slate-800"
            >
              Demo İzle
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            7 gün ücretsiz · Kredi kartı gerekmez
          </p>
        </div>

        {/* 3D Orbit Container */}
        <div 
          className="relative mx-auto w-full max-w-2xl h-[450px] sm:h-[500px] flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          {/* Orbital rings with 3D effect */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div 
              className="absolute w-[420px] h-[420px] border border-purple-500/20 rounded-full"
              style={{ transform: 'rotateX(70deg)' }}
            />
            <div 
              className="absolute w-[380px] h-[380px] border border-violet-500/15 rounded-full animate-spin"
              style={{ transform: 'rotateX(70deg)', animationDuration: '30s' }}
            />
            <div 
              className="absolute w-[340px] h-[340px] border border-purple-400/10 rounded-full animate-spin"
              style={{ transform: 'rotateX(70deg)', animationDuration: '25s', animationDirection: 'reverse' }}
            />
          </div>

          {/* Connection lines SVG */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            viewBox="-250 -250 500 500"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Glow at center */}
            <circle cx="0" cy="0" r="80" fill="url(#centerGlow)" />
            
            {/* Connection lines from each platform to center */}
            {allPlatforms.map((_, index) => {
              const pos = getPlatformPosition(index);
              return (
                <line
                  key={`line-${index}`}
                  x1={pos.x * 0.85}
                  y1={pos.y * 0.85}
                  x2="0"
                  y2="0"
                  stroke="url(#lineGrad)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
              );
            })}
            
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Flowing particles */}
          {particles.map(particle => {
            const pos = getParticlePosition(particle);
            const opacity = particle.progress < 0.5 
              ? particle.progress * 2 
              : 2 - particle.progress * 2;
            
            return (
              <div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  opacity: Math.max(0.2, opacity),
                }}
              />
            );
          })}

          {/* Platform icons */}
          {allPlatforms.map((platform, index) => {
            const pos = getPlatformPosition(index);
            return (
              <div
                key={platform.id}
                className="absolute transition-all duration-300 hover:scale-125 hover:z-20 group"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                }}
              >
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-2.5 shadow-xl hover:bg-slate-700/80 hover:border-purple-500/50 transition-all cursor-default">
                  <PlatformLogo platform={platform.id} size={36} />
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  <span className="text-xs text-white bg-slate-900 px-2 py-1 rounded shadow-lg">
                    {platform.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Center Star Hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {/* Pulsing glow rings */}
            <div className="absolute inset-0 -m-8 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 -m-6 rounded-full bg-violet-500/30 animate-pulse" />
            <div className="absolute inset-0 -m-4 rounded-full bg-purple-600/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Main star container */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-spin" style={{ animationDuration: '20s' }}>
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white" />
            </div>
            
            {/* Label */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-white font-bold text-lg sm:text-xl bg-slate-900/90 px-4 py-2 rounded-full border border-purple-500/30 shadow-lg backdrop-blur-sm">
                Seller Club
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">10+</div>
            <div className="text-sm text-slate-400">Pazaryeri</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">%90</div>
            <div className="text-sm text-slate-400">Zaman Tasarrufu</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">AI</div>
            <div className="text-sm text-slate-400">Akıllı Optimizasyon</div>
          </div>
        </div>
      </div>
    </section>
  );
}
