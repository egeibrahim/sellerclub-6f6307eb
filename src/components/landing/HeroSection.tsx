import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "@/components/common/PlatformLogos";
import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

// All platforms for bidirectional flow
const allPlatforms = [
  { id: "trendyol", name: "Trendyol", angle: 0 },
  { id: "hepsiburada", name: "Hepsiburada", angle: 36 },
  { id: "amazon", name: "Amazon", angle: 72 },
  { id: "n11", name: "N11", angle: 108 },
  { id: "ciceksepeti", name: "Çiçeksepeti", angle: 144 },
  { id: "etsy", name: "Etsy", angle: 180 },
  { id: "shopify", name: "Shopify", angle: 216 },
  { id: "ikas", name: "ikas", angle: 252 },
  { id: "woocommerce", name: "WooCommerce", angle: 288 },
  { id: "pazarama", name: "Pazarama", angle: 324 },
];

// 3D Star component
function CentralStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  // Create star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1;
    const innerRadius = 0.4;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelSegments: 3,
  }), []);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group>
        {/* Glow effect */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.8, 32, 32]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.15} />
        </mesh>
        
        {/* Main star */}
        <mesh ref={meshRef}>
          <extrudeGeometry args={[starShape, extrudeSettings]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#7c3aed"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Flowing particles between platforms
function FlowingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;
  
  const { positions, velocities, targets, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    const targets: { from: number; to: number; progress: number }[] = [];
    
    const radius = 4;
    
    for (let i = 0; i < particleCount; i++) {
      const fromPlatform = Math.floor(Math.random() * allPlatforms.length);
      let toPlatform = Math.floor(Math.random() * allPlatforms.length);
      while (toPlatform === fromPlatform) {
        toPlatform = Math.floor(Math.random() * allPlatforms.length);
      }
      
      const fromAngle = (allPlatforms[fromPlatform].angle * Math.PI) / 180;
      const progress = Math.random();
      
      positions[i * 3] = Math.cos(fromAngle) * radius * (1 - progress);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = Math.sin(fromAngle) * radius * (1 - progress);
      
      velocities.push(new THREE.Vector3());
      targets.push({ from: fromPlatform, to: toPlatform, progress });
      
      // Purple/violet colors
      colors[i * 3] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    }
    
    return { positions, velocities, targets, colors };
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const positionArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const radius = 4;
    
    for (let i = 0; i < particleCount; i++) {
      const target = targets[i];
      target.progress += 0.003 + Math.random() * 0.002;
      
      if (target.progress >= 1) {
        // Reset particle - go to center first, then to new target
        target.from = target.to;
        target.to = Math.floor(Math.random() * allPlatforms.length);
        while (target.to === target.from) {
          target.to = Math.floor(Math.random() * allPlatforms.length);
        }
        target.progress = 0;
      }
      
      const fromAngle = (allPlatforms[target.from].angle * Math.PI) / 180;
      const toAngle = (allPlatforms[target.to].angle * Math.PI) / 180;
      
      // Bezier curve through center
      const t = target.progress;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      // Control points: start -> center -> end
      const startX = Math.cos(fromAngle) * radius;
      const startZ = Math.sin(fromAngle) * radius;
      const endX = Math.cos(toAngle) * radius;
      const endZ = Math.sin(toAngle) * radius;
      
      // Cubic bezier
      positionArray[i * 3] = mt3 * startX + 3 * mt2 * t * 0 + 3 * mt * t2 * 0 + t3 * endX;
      positionArray[i * 3 + 1] = Math.sin(t * Math.PI) * 0.5;
      positionArray[i * 3 + 2] = mt3 * startZ + 3 * mt2 * t * 0 + 3 * mt * t2 * 0 + t3 * endZ;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Connection rings
function ConnectionRings() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[4, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.5, 0.015, 16, 100]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// 3D Scene
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      
      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      
      <CentralStar />
      <FlowingParticles />
      <ConnectionRings />
    </>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPlatformPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle: (angle * 180) / Math.PI };
  };

  return (
    <section id="home" className="relative pt-24 pb-8 bg-gradient-to-b from-slate-950 via-slate-900 to-background overflow-hidden min-h-screen">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Canvas
            camera={{ position: [0, 5, 8], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <Scene3D />
          </Canvas>
        )}
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

        {/* Platform Icons Circle */}
        <div className="relative mx-auto w-full max-w-3xl h-[400px] sm:h-[500px] flex items-center justify-center">
          {/* Platform icons in a circle */}
          {allPlatforms.map((platform, index) => {
            const pos = getPlatformPosition(index, allPlatforms.length, 42);
            return (
              <div
                key={platform.id}
                className="absolute transition-all duration-300 hover:scale-125 hover:z-20"
                style={{
                  left: `calc(50% + ${pos.x}%)`,
                  top: `calc(50% + ${pos.y}%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 shadow-xl hover:bg-white/20 transition-all cursor-default group">
                  <PlatformLogo platform={platform.id} size={40} />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <span className="text-xs text-white bg-slate-800 px-2 py-1 rounded">
                      {platform.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Center Star Label */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="text-center mt-32">
              <span className="text-white/80 font-bold text-xl sm:text-2xl bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm border border-purple-500/30">
                Seller Club
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-4 flex flex-wrap justify-center gap-8 sm:gap-16">
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
