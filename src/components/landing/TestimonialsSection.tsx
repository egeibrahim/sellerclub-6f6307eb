import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    role: "E-Ticaret Girişimcisi",
    company: "AY Store",
    avatar: "AY",
    rating: 5,
    text: "MarketHub ile işlerimiz inanılmaz hızlandı. Eskiden her platforma ayrı ayrı giriş yapıyordum, şimdi tek panelden her şeyi yönetiyorum. Haftalık 15 saat tasarruf ediyorum!",
  },
  {
    id: 2,
    name: "Zeynep Kaya",
    role: "El Yapımı Ürünler Satıcısı",
    company: "Zeynep's Crafts",
    avatar: "ZK",
    rating: 5,
    text: "Etsy ve Trendyol'da satış yapıyorum. AI önerileri sayesinde ürün başlıklarımı optimize ettim ve satışlarım %40 arttı. Kesinlikle tavsiye ediyorum!",
  },
  {
    id: 3,
    name: "Mehmet Demir",
    role: "Toptan Satıcı",
    company: "Demir Ticaret",
    avatar: "MD",
    rating: 5,
    text: "10.000'den fazla ürünü yönetiyorum. Toplu düzenleme özelliği hayat kurtarıcı. Fiyat güncellemelerini dakikalar içinde tüm platformlara yansıtabiliyorum.",
  },
  {
    id: 4,
    name: "Ayşe Özkan",
    role: "Moda Perakendecisi",
    company: "Trend Moda",
    avatar: "AÖ",
    rating: 5,
    text: "Stok senkronizasyonu mükemmel çalışıyor. Artık bir platformda satılan ürün için diğerinde 'stokta yok' yazmak zorunda kalmıyorum.",
  },
  {
    id: 5,
    name: "Can Arslan",
    role: "Elektronik Satıcısı",
    company: "TechZone",
    avatar: "CA",
    rating: 5,
    text: "Analitik paneli sayesinde hangi ürünlerin trend olduğunu, hangi platformda daha iyi sattığımı görüyorum. Veri odaklı kararlar almak artık çok kolay.",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Satıcılarımız
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Ne Diyor?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Binlerce e-ticaret satıcısı MarketHub'a güveniyor
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card rounded-3xl p-8 lg:p-12 border shadow-xl">
            {/* Quote Icon */}
            <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
              <Quote className="w-12 h-12 text-primary/20" />
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Rating */}
              <div className="flex gap-1">
                {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg lg:text-xl text-foreground leading-relaxed">
                "{currentTestimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                  {currentTestimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentTestimonial.role} • {currentTestimonial.company}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  className="rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
