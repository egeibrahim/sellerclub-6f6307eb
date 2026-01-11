import { PlatformLogo, platformBgColors, getPlatformBgColor } from "@/components/common/PlatformLogos";

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
];

export function PlatformsSection() {
  return (
    <section id="platforms" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Platforms Grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 hover:shadow-md cursor-default"
              style={{ backgroundColor: getPlatformBgColor(platform.id) }}
            >
              <PlatformLogo platform={platform.id} size={32} />
              <span className="font-medium text-foreground text-sm">
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
