import * as Linking from 'expo-linking';

import { LISTING_RENEW_MAX_REMAINING_DAYS } from './marketplace.constants';
import { getCategoryLabel, marketplaceStrings } from './marketplace.strings';
import type { LabourRateType, ListingImage, ListingStatus, ListingType } from './marketplace.types';

/** Formats a price in Indian Rupees. */
export const formatPrice = (value: number): string => `\u20B9${value.toLocaleString('en-IN')}`;

/** Formats labour rate with /day or /hour suffix. */
export const formatLabourRate = (price: number, rateType?: LabourRateType): string => {
  const amount = formatPrice(price);
  if (rateType === 'per_hour') return `${amount}/तास`;
  if (rateType === 'per_day') return `${amount}/दिवस`;
  return amount;
};

/** Formats an ISO date string for display. */
export const formatListingDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Normalizes API image values (object or legacy URL string). */
export const normalizeListingImage = (value: unknown): ListingImage | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return { url: value.trim(), publicId: '' };
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const url = record.url;
    if (typeof url !== 'string' || url.trim().length === 0) return null;
    const publicId = record.publicId;
    return {
      url: url.trim(),
      publicId: typeof publicId === 'string' ? publicId.trim() : '',
    };
  }
  return null;
};

/** Normalizes an array of listing images from the API. */
export const normalizeListingImages = (images: unknown): ListingImage[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((item) => normalizeListingImage(item))
    .filter((item): item is ListingImage => item !== null);
};

/** Returns image URLs in listing order. */
export const getListingImageUrls = (images: ListingImage[]): string[] =>
  images.map((image) => image.url).filter((url) => url.length > 0);

/** Returns the primary image URL or undefined. */
export const getListingImageUrl = (images: ListingImage[]): string | undefined =>
  getListingImageUrls(images)[0];

/** Builds a display title for produce / labour / product listings. */
export const getListingDisplayTitle = (listing: {
  listingType: string;
  title: string;
  crop?: string;
}): string => {
  if (listing.listingType === 'produce' && listing.crop) {
    return listing.crop;
  }
  return listing.title;
};

/** Auto-generates a labour listing title (mirrors backend). */
export const buildLabourTitle = (category: string, availableWorkers: number): string => {
  if (availableWorkers <= 1) return category;
  if (category === 'Tractor Driver' || category === 'Farm Supervisor') {
    return `${category} Team`;
  }
  if (category.endsWith('Labour') || category.endsWith('Helper')) {
    return `${category} Group`;
  }
  return `${category} Workers`;
};

/** Individual vs Group label from worker count. */
export const getLabourGroupLabel = (availableWorkers: number): 'Individual' | 'Group' =>
  availableWorkers <= 1 ? 'Individual' : 'Group';

/** Formats YYYY-MM-DD for farmer-friendly DD/MM/YYYY display. */
export const formatHarvestDateDisplay = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

/** Converts a Date to YYYY-MM-DD for the backend API. */
export const formatHarvestDateApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Parses YYYY-MM-DD into a Date at local midnight. */
export const parseHarvestDateApi = (isoDate: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Returns true when the authenticated user owns the listing. */
export const isListingOwner = (
  sellerId: string,
  userId: string | null | undefined,
): boolean => !!userId && sellerId === userId;

/** Normalizes a phone number for `tel:` links. */
export const formatPhoneForDial = (phone: string): string => phone.replace(/\s+/g, '');

/** Normalizes a phone number for `https://wa.me/` links (India country code). */
export const formatPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

const presentText = (value: string | number | null | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const joinMessageLines = (lines: (string | null)[]): string => {
  const kept: string[] = [];
  for (const line of lines) {
    if (line === null) continue;
    if (line === '' && (kept.length === 0 || kept[kept.length - 1] === '')) continue;
    kept.push(line);
  }
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();
  return kept.join('\n');
};

/** Pre-filled WhatsApp body from public listing fields. Phone is never included. */
export const buildWhatsAppContactMessage = (listing: {
  listingType: ListingType;
  title: string;
  crop?: string;
  quantity?: number;
  unit?: string;
  village?: string;
  brand?: string;
  price: number;
  category: string;
  availableWorkers?: number;
  rateType?: LabourRateType;
}): string => {
  const village = presentText(listing.village);
  const villageLine = village ? `गाव: ${village}` : null;

  if (listing.listingType === 'produce') {
    const crop = presentText(listing.crop) ?? presentText(listing.title) ?? 'शेतमाल';
    const quantity =
      listing.quantity != null
        ? presentText(listing.unit)
          ? `${listing.quantity} ${listing.unit}`
          : String(listing.quantity)
        : null;
    return joinMessageLines([
      `नमस्कार, मला तुमच्या ${crop} च्या जाहिरातीबद्दल माहिती हवी आहे.`,
      '',
      quantity ? `प्रमाण: ${quantity}` : null,
      villageLine,
      '',
      'मी खरेदीदार आहे.',
    ]);
  }

  if (listing.listingType === 'labour') {
    const work = getCategoryLabel(listing.category);
    const workers =
      listing.availableWorkers != null ? String(listing.availableWorkers) : null;
    const rateSuffix = listing.rateType === 'per_hour' ? 'प्रति तास' : 'प्रति दिवस';
    const rate = `दर: ${formatPrice(listing.price)} ${rateSuffix}`;
    return joinMessageLines([
      'नमस्कार, मला तुमच्या मजूर कट्टा जाहिरातीबद्दल माहिती हवी आहे.',
      '',
      `काम: ${work}`,
      workers ? `मजूर: ${workers}` : null,
      rate,
      villageLine,
      '',
      'मला मजूर हवे आहेत.',
    ]);
  }

  const name = presentText(listing.title) ?? 'शेती साहित्य';
  const brand = presentText(listing.brand);
  return joinMessageLines([
    `नमस्कार, मला तुमच्या ${name} च्या जाहिरातीबद्दल माहिती हवी आहे.`,
    '',
    brand ? `ब्रँड: ${brand}` : null,
    `किंमत: ${formatPrice(listing.price)}`,
    villageLine,
    '',
    'मला या वस्तूबद्दल अधिक माहिती हवी आहे.',
  ]);
};

export const buildWhatsAppUrl = (phone: string, message: string): string => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}?text=${encoded}`;
};

/** Marketplace listing deep link using the existing `kisankatta` scheme / router path. */
export const buildListingLink = (listingId: string): string =>
  Linking.createURL(`/marketplace-listing/${listingId}`);

/** Native share body. Public listing fields only — never seller phone. */
export const buildListingShareMessage = (listing: {
  id: string;
  listingType: ListingType;
  title: string;
  crop?: string;
  price: number;
  rateType?: LabourRateType;
  village?: string;
  district: string;
}): string => {
  const title = getListingDisplayTitle(listing);
  const typeLabel =
    listing.listingType === 'labour'
      ? marketplaceStrings.create.labour
      : listing.listingType === 'product'
        ? marketplaceStrings.create.product
        : marketplaceStrings.create.produce;
  const price =
    listing.listingType === 'labour'
      ? formatLabourRate(listing.price, listing.rateType)
      : formatPrice(listing.price);
  const place = [presentText(listing.village), presentText(listing.district)]
    .filter((part): part is string => part !== null)
    .join(', ');

  return joinMessageLines([
    '🌾 Kissan Agrisathi',
    '',
    title,
    '',
    `प्रकार: ${typeLabel}`,
    `किंमत: ${price}`,
    place ? `स्थान: ${place}` : null,
    '',
    buildListingLink(listing.id),
    '',
    'Kissan Agrisathi वर जाहिरात पहा.',
  ]);
};

/** Remaining time until `expiresAt`, in fractional days. Negative if expired. */
export const remainingDaysUntilExpiry = (expiresAt: string, now: Date = new Date()): number => {
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return Number.NEGATIVE_INFINITY;
  return (end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
};

export type ExpiryTone = 'neutral' | 'warning' | 'strong' | 'critical' | 'expired';

export type ExpiryDisplay = {
  label: string;
  tone: ExpiryTone;
  isExpired: boolean;
};

/** Compact Marathi expiry label from backend `expiresAt` only. */
export const getListingExpiryDisplay = (
  expiresAt: string,
  now: Date = new Date(),
): ExpiryDisplay => {
  const remaining = remainingDaysUntilExpiry(expiresAt, now);
  if (remaining <= 0) {
    return { label: marketplaceStrings.expiry.expired, tone: 'expired', isExpired: true };
  }

  const wholeDays = Math.floor(remaining);
  if (wholeDays === 0) {
    return { label: marketplaceStrings.expiry.lastDay, tone: 'critical', isExpired: false };
  }
  if (wholeDays === 1) {
    return { label: marketplaceStrings.expiry.tomorrow, tone: 'strong', isExpired: false };
  }
  return {
    label: marketplaceStrings.expiry.daysLeft(wholeDays),
    tone: wholeDays <= 3 ? 'warning' : 'neutral',
    isExpired: false,
  };
};

/** Conservative client hint — backend remains authoritative. */
export const isListingRenewable = (
  listing: { status: ListingStatus; expiresAt: string },
  now: Date = new Date(),
): boolean => {
  if (listing.status !== 'ACTIVE') return false;
  return remainingDaysUntilExpiry(listing.expiresAt, now) <= LISTING_RENEW_MAX_REMAINING_DAYS;
};

export type StatusBadgeColors = {
  background: string;
  text: string;
};

/** Semantic colors for listing status badges. */
export const getStatusBadgeColors = (
  status: ListingStatus,
  theme: {
    colors: {
      primaryContainer: string;
      onPrimaryContainer: string;
      secondaryContainer: string;
      onSecondaryContainer: string;
      surfaceVariant: string;
      onSurfaceVariant: string;
    };
  },
): StatusBadgeColors => {
  switch (status) {
    case 'ACTIVE':
      return {
        background: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
      };
    case 'SOLD':
      return {
        background: theme.colors.secondaryContainer,
        text: theme.colors.onSecondaryContainer,
      };
    case 'ARCHIVED':
    default:
      return {
        background: theme.colors.surfaceVariant,
        text: theme.colors.onSurfaceVariant,
      };
  }
};

export type { ListingType };
