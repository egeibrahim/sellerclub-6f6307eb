import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FooterSection() {
  return (
    <>
      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Seller Club'ı bugün deneyin
          </h2>
          <p className="text-muted-foreground mb-8">
            <span className="font-semibold">100.000+</span> e-ticaret satıcısı Seller Club kullanıyor
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="rounded-full px-10 py-6 text-base font-medium bg-foreground hover:bg-foreground/90 text-white"
            >
              Başla
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">
                Seller<span className="text-primary">Club</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </Link>

            {/* Links */}
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Gizlilik Politikası
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Kullanım Koşulları
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                İletişim
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © 2025 Seller Club. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
