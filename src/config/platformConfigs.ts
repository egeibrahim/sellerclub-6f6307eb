// Platform-specific configurations for each marketplace
export interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
  minImages: number;
  maxImages: number;
  maxTags?: number;
  bulletPoints?: number;
  requiresCategory: boolean;
  requiresBrand: boolean;
  requiresSku: boolean;
  hasVariations: boolean;
  customFields?: {
    name: string;
    type: 'text' | 'number' | 'select' | 'multiselect';
    required: boolean;
    maxLength?: number;
    options?: string[];
  }[];
}

export const platformConfigs: Record<string, PlatformConfig> = {
  etsy: {
    id: 'etsy',
    name: 'Etsy',
    icon: 'E',
    color: '#F56400',
    titleMaxLength: 140,
    descriptionMaxLength: 10000,
    minImages: 1,
    maxImages: 10,
    maxTags: 13,
    requiresCategory: true,
    requiresBrand: false,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'materials', type: 'text', required: false, maxLength: 500 },
      { name: 'occasion', type: 'select', required: false, options: ['Birthday', 'Wedding', 'Anniversary', 'Christmas', 'Valentine\'s Day', 'Mother\'s Day', 'Father\'s Day', 'Graduation', 'Other'] },
      { name: 'style', type: 'select', required: false, options: ['Minimalist', 'Bohemian', 'Vintage', 'Modern', 'Rustic', 'Romantic', 'Classic', 'Industrial', 'Scandinavian'] },
    ],
  },
  trendyol: {
    id: 'trendyol',
    name: 'Trendyol',
    icon: 'T',
    color: '#FF6000',
    titleMaxLength: 100,
    descriptionMaxLength: 20000,
    minImages: 1,
    maxImages: 8,
    requiresCategory: true,
    requiresBrand: true,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'cargoCompanyId', type: 'number', required: true },
      { name: 'shipmentAddressId', type: 'number', required: true },
      { name: 'returningAddressId', type: 'number', required: true },
      { name: 'vatRate', type: 'select', required: true, options: ['0', '1', '10', '20'] },
    ],
  },
  hepsiburada: {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    icon: 'H',
    color: '#FF6600',
    titleMaxLength: 150,
    descriptionMaxLength: 4000,
    minImages: 1,
    maxImages: 8,
    requiresCategory: true,
    requiresBrand: true,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'merchantSku', type: 'text', required: true, maxLength: 100 },
      { name: 'tax', type: 'select', required: true, options: ['0', '1', '10', '20'] },
    ],
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    icon: 'A',
    color: '#FF9900',
    titleMaxLength: 200,
    descriptionMaxLength: 2000,
    minImages: 1,
    maxImages: 9,
    bulletPoints: 5,
    requiresCategory: true,
    requiresBrand: true,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'bulletPoint1', type: 'text', required: false, maxLength: 500 },
      { name: 'bulletPoint2', type: 'text', required: false, maxLength: 500 },
      { name: 'bulletPoint3', type: 'text', required: false, maxLength: 500 },
      { name: 'bulletPoint4', type: 'text', required: false, maxLength: 500 },
      { name: 'bulletPoint5', type: 'text', required: false, maxLength: 500 },
      { name: 'searchTerms', type: 'text', required: false, maxLength: 250 },
    ],
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    icon: 'S',
    color: '#95BF47',
    titleMaxLength: 255,
    descriptionMaxLength: 65535,
    minImages: 1,
    maxImages: 250,
    requiresCategory: false,
    requiresBrand: false,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'productType', type: 'text', required: false, maxLength: 255 },
      { name: 'vendor', type: 'text', required: false, maxLength: 255 },
    ],
  },
  ikas: {
    id: 'ikas',
    name: 'ikas',
    icon: 'i',
    color: '#6366F1',
    titleMaxLength: 255,
    descriptionMaxLength: 100000,
    minImages: 1,
    maxImages: 50,
    requiresCategory: true,
    requiresBrand: false,
    requiresSku: true,
    hasVariations: true,
  },
  n11: {
    id: 'n11',
    name: 'N11',
    icon: 'N',
    color: '#7B68EE',
    titleMaxLength: 100,
    descriptionMaxLength: 10000,
    minImages: 1,
    maxImages: 8,
    requiresCategory: true,
    requiresBrand: true,
    requiresSku: true,
    hasVariations: true,
    customFields: [
      { name: 'preparingDay', type: 'number', required: true },
      { name: 'shipmentTemplate', type: 'text', required: true },
    ],
  },
  ciceksepeti: {
    id: 'ciceksepeti',
    name: 'Çiçeksepeti',
    icon: 'Ç',
    color: '#E91E63',
    titleMaxLength: 150,
    descriptionMaxLength: 5000,
    minImages: 1,
    maxImages: 10,
    requiresCategory: true,
    requiresBrand: true,
    requiresSku: true,
    hasVariations: true,
  },
  master: {
    id: 'master',
    name: 'Master Listings',
    icon: 'M',
    color: '#8B5CF6',
    titleMaxLength: 500,
    descriptionMaxLength: 100000,
    minImages: 1,
    maxImages: 50,
    maxTags: 50,
    requiresCategory: false,
    requiresBrand: false,
    requiresSku: true,
    hasVariations: true,
  },
};

export const getPlatformConfig = (platform: string): PlatformConfig => {
  return platformConfigs[platform.toLowerCase()] || platformConfigs.master;
};

export const getPlatformColor = (platform: string): string => {
  return getPlatformConfig(platform).color;
};

export const getPlatformIcon = (platform: string): string => {
  return getPlatformConfig(platform).icon;
};

export const validateTitle = (title: string, platform: string): { valid: boolean; message?: string } => {
  const config = getPlatformConfig(platform);
  if (title.length > config.titleMaxLength) {
    return { valid: false, message: `Title exceeds ${config.titleMaxLength} characters (${title.length})` };
  }
  return { valid: true };
};

export const validateDescription = (description: string, platform: string): { valid: boolean; message?: string } => {
  const config = getPlatformConfig(platform);
  if (description.length > config.descriptionMaxLength) {
    return { valid: false, message: `Description exceeds ${config.descriptionMaxLength} characters (${description.length})` };
  }
  return { valid: true };
};

export const validateImages = (imageCount: number, platform: string): { valid: boolean; message?: string } => {
  const config = getPlatformConfig(platform);
  if (imageCount < config.minImages) {
    return { valid: false, message: `Minimum ${config.minImages} image(s) required` };
  }
  if (imageCount > config.maxImages) {
    return { valid: false, message: `Maximum ${config.maxImages} images allowed` };
  }
  return { valid: true };
};

export const validateTags = (tagCount: number, platform: string): { valid: boolean; message?: string } => {
  const config = getPlatformConfig(platform);
  if (config.maxTags && tagCount > config.maxTags) {
    return { valid: false, message: `Maximum ${config.maxTags} tags allowed` };
  }
  return { valid: true };
};
