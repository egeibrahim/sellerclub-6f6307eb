const platforms = [
  { 
    name: "Trendyol", 
    color: "#F27A1A", 
    bgColor: "#FFF5EE",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#F27A1A"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">T</text>
      </svg>
    )
  },
  { 
    name: "Hepsiburada", 
    color: "#FF6000", 
    bgColor: "#FFF3E8",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#FF6000"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">hb</text>
      </svg>
    )
  },
  { 
    name: "Amazon", 
    color: "#FF9900", 
    bgColor: "#FFF8E7",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#232F3E"/>
        <text x="20" y="26" textAnchor="middle" fill="#FF9900" fontSize="16" fontWeight="bold">a</text>
      </svg>
    )
  },
  { 
    name: "N11", 
    color: "#7B2CBF", 
    bgColor: "#F5EEFF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#7B2CBF"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">n11</text>
      </svg>
    )
  },
  { 
    name: "Çiçeksepeti", 
    color: "#E31E52", 
    bgColor: "#FFEBEF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#E31E52"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Ç</text>
      </svg>
    )
  },
  { 
    name: "ikas", 
    color: "#6366F1", 
    bgColor: "#EEEEFF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#6366F1"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ikas</text>
      </svg>
    )
  },
  { 
    name: "Shopify", 
    color: "#96BF48", 
    bgColor: "#F3F9E8",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#96BF48"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">S</text>
      </svg>
    )
  },
  { 
    name: "Etsy", 
    color: "#F56400", 
    bgColor: "#FFF4EB",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#F56400"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">e</text>
      </svg>
    )
  },
  { 
    name: "WooCommerce", 
    color: "#96588A", 
    bgColor: "#F8EEF6",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#96588A"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">W</text>
      </svg>
    )
  },
  { 
    name: "Pazarama", 
    color: "#00A4EF", 
    bgColor: "#E8F7FF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="20" fill="#00A4EF"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">P</text>
      </svg>
    )
  },
];

export function PlatformsSection() {
  return (
    <section id="platforms" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Platforms Grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 hover:shadow-md cursor-default"
              style={{ backgroundColor: platform.bgColor }}
            >
              {platform.icon}
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
