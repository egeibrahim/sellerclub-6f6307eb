import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 100, displayValue: "100K", suffix: "+", label: "E-ticaret satıcısı" },
  { value: 100, displayValue: "100M", suffix: "+", label: "Yönetilen ürün" },
  { value: 25, displayValue: "25%", suffix: "+", label: "Ort. gelir artışı" },
  { value: 20, displayValue: "20", suffix: "+", label: "Haftalık tasarruf edilen saat" },
];

function AnimatedCounter({ 
  target, 
  displayValue,
  suffix, 
  isVisible 
}: { 
  target: number;
  displayValue: string;
  suffix: string; 
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        setShowFinal(true);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight font-mono">
      {showFinal ? displayValue : count}{suffix}
    </span>
  );
}

export function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <AnimatedCounter 
                target={stat.value}
                displayValue={stat.displayValue}
                suffix={stat.suffix}
                isVisible={isVisible} 
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
