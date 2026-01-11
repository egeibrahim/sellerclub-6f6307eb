// Platform SVG Logos - Real brand icons for Turkish marketplaces
import React from "react";

interface PlatformLogoProps {
  platform: string;
  size?: number;
  className?: string;
}

// SVG Logo components for each platform
export const TrendyolLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#F27A1A"/>
    <path d="M12 12H28V16H22V28H18V16H12V12Z" fill="white"/>
  </svg>
);

export const HepsiburadaLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FF6000"/>
    <path d="M10 11H14V18H17V11H21V18H24V11H28V28H24V22H21V28H17V22H14V28H10V11Z" fill="white"/>
  </svg>
);

export const AmazonLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#232F3E"/>
    <path d="M10 20C10 24 14 27 20 27C23 27 25.5 26 27 25" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
    <path d="M28 24L30 26L28 28" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 18C15 16 17 14 20 14C23 14 25 16 25 18C25 20 23 21 20 22" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EtsyLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#F56400"/>
    <path d="M14 12H26V16H18V18H25V22H18V24H26V28H14V12Z" fill="white"/>
  </svg>
);

export const N11Logo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#7B2CBF"/>
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">n11</text>
  </svg>
);

export const CiceksepetiLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#E31E52"/>
    <circle cx="20" cy="16" r="4" fill="#FFD700"/>
    <ellipse cx="14" cy="20" rx="3" ry="4" fill="#FF69B4"/>
    <ellipse cx="26" cy="20" rx="3" ry="4" fill="#FF69B4"/>
    <ellipse cx="16" cy="26" rx="3" ry="4" fill="#FF69B4"/>
    <ellipse cx="24" cy="26" rx="3" ry="4" fill="#FF69B4"/>
    <path d="M20 28L20 34" stroke="#228B22" strokeWidth="2"/>
  </svg>
);

export const IkasLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#6366F1"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">ikas</text>
  </svg>
);

export const ShopifyLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#96BF48"/>
    <path d="M24 12L26 14L24 28H18L14 14L16 12H24Z" fill="white"/>
    <path d="M20 8V12" stroke="white" strokeWidth="2"/>
    <circle cx="20" cy="18" r="2" fill="#96BF48"/>
  </svg>
);

export const WooCommerceLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#96588A"/>
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">W</text>
  </svg>
);

export const PazaramaLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#00A4EF"/>
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">P</text>
  </svg>
);

export const PTTAvmLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FFD100"/>
    <text x="20" y="26" textAnchor="middle" fill="#1a1a1a" fontSize="10" fontWeight="bold" fontFamily="Arial">PTT</text>
  </svg>
);

export const TicimaxLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#00A9E0"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">Ticimax</text>
  </svg>
);

export const TSoftLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#1E3A5F"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">T-Soft</text>
  </svg>
);

export const IdeaSoftLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FF4E00"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">IdeaSoft</text>
  </svg>
);

export const GittiGidiyorLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#0066CC"/>
    <text x="20" y="25" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">GG</text>
  </svg>
);

export const MasterLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#8B5CF6"/>
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">M</text>
  </svg>
);

// Map platform IDs to their logo components
const platformLogos: Record<string, React.FC<{ size?: number }>> = {
  trendyol: TrendyolLogo,
  hepsiburada: HepsiburadaLogo,
  amazon: AmazonLogo,
  etsy: EtsyLogo,
  n11: N11Logo,
  ciceksepeti: CiceksepetiLogo,
  ikas: IkasLogo,
  shopify: ShopifyLogo,
  woocommerce: WooCommerceLogo,
  pazarama: PazaramaLogo,
  pttavm: PTTAvmLogo,
  ticimax: TicimaxLogo,
  tsoft: TSoftLogo,
  ideasoft: IdeaSoftLogo,
  gittigidiyor: GittiGidiyorLogo,
  master: MasterLogo,
};

// Platform colors
export const platformColors: Record<string, string> = {
  trendyol: "#F27A1A",
  hepsiburada: "#FF6000",
  amazon: "#232F3E",
  etsy: "#F56400",
  n11: "#7B2CBF",
  ciceksepeti: "#E31E52",
  ikas: "#6366F1",
  shopify: "#96BF48",
  woocommerce: "#96588A",
  pazarama: "#00A4EF",
  pttavm: "#FFD100",
  ticimax: "#00A9E0",
  tsoft: "#1E3A5F",
  ideasoft: "#FF4E00",
  gittigidiyor: "#0066CC",
  master: "#8B5CF6",
};

// Platform background colors (lighter versions)
export const platformBgColors: Record<string, string> = {
  trendyol: "#FFF5EE",
  hepsiburada: "#FFF3E8",
  amazon: "#F5F5F5",
  etsy: "#FFF4EB",
  n11: "#F5EEFF",
  ciceksepeti: "#FFEBEF",
  ikas: "#EEEEFF",
  shopify: "#F3F9E8",
  woocommerce: "#F8EEF6",
  pazarama: "#E8F7FF",
  pttavm: "#FFFCE8",
  ticimax: "#E8F9FF",
  tsoft: "#EBF0F5",
  ideasoft: "#FFF0EB",
  gittigidiyor: "#E8F2FF",
  master: "#F3EEFF",
};

export function PlatformLogo({ platform, size = 24, className }: PlatformLogoProps) {
  const normalizedPlatform = platform.toLowerCase().replace(/[\s-]/g, '');
  const LogoComponent = platformLogos[normalizedPlatform];
  
  if (LogoComponent) {
    return (
      <div className={className}>
        <LogoComponent size={size} />
      </div>
    );
  }
  
  // Fallback: colored circle with first letter
  const color = platformColors[normalizedPlatform] || "#6B7280";
  const initial = platform.charAt(0).toUpperCase();
  
  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill={color}/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">
          {initial}
        </text>
      </svg>
    </div>
  );
}

export function getPlatformColor(platform: string): string {
  const normalizedPlatform = platform.toLowerCase().replace(/[\s-]/g, '');
  return platformColors[normalizedPlatform] || "#6B7280";
}

export function getPlatformBgColor(platform: string): string {
  const normalizedPlatform = platform.toLowerCase().replace(/[\s-]/g, '');
  return platformBgColors[normalizedPlatform] || "#F3F4F6";
}
