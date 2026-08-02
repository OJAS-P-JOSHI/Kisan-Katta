import * as Linking from 'expo-linking';

import { assistanceStrings } from './assistance.strings';
import type { HelpRequestAuthor, HelpRequestImage, HelpRequestStatus } from './assistance.types';

/** Formats an ISO date string for display. */
export const formatHelpRequestDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RELATIVE_CUTOFF_DAYS = 7;

/** "Time posted" for feed cards: relative for the first week, then a date. */
export const formatTimeAgo = (isoDate: string, now: number = Date.now()): string => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return isoDate;

  const elapsed = Math.max(now - timestamp, 0);

  if (elapsed < MINUTE_MS) return assistanceStrings.time.justNow;
  if (elapsed < HOUR_MS) {
    return assistanceStrings.time.minutesAgo(Math.floor(elapsed / MINUTE_MS));
  }
  if (elapsed < DAY_MS) {
    return assistanceStrings.time.hoursAgo(Math.floor(elapsed / HOUR_MS));
  }

  const days = Math.floor(elapsed / DAY_MS);
  if (days <= RELATIVE_CUTOFF_DAYS) {
    return assistanceStrings.time.daysAgo(days);
  }

  return formatHelpRequestDate(isoDate);
};

/** Normalizes API image values (object or legacy URL string). */
export const normalizeHelpRequestImage = (value: unknown): HelpRequestImage | null => {
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

export const normalizeHelpRequestImages = (images: unknown): HelpRequestImage[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((item) => normalizeHelpRequestImage(item))
    .filter((item): item is HelpRequestImage => item !== null);
};

export const getProofPhotoUrls = (images: HelpRequestImage[]): string[] =>
  images.map((image) => image.url).filter((url) => url.length > 0);

/** First proof photo shown on the feed card. */
export const getPrimaryProofPhotoUrl = (
  images: HelpRequestImage[],
): string | undefined => getProofPhotoUrls(images)[0];

/** "गाव, जिल्हा" line used on cards. */
export const formatAuthorPlace = (author: HelpRequestAuthor): string =>
  [author.village, author.district].filter((part) => part.length > 0).join(', ');

/** Full location line used on the detail screen. */
export const formatAuthorFullPlace = (author: HelpRequestAuthor): string =>
  [author.village, author.taluka, author.district, author.state]
    .filter((part) => part.length > 0)
    .join(' · ');

export const isHelpRequestOwner = (
  authorUserId: string,
  userId: string | null | undefined,
): boolean => !!userId && authorUserId === userId;

export type StatusChipColors = {
  background: string;
  text: string;
};

/** Semantic colors for help request status chips. */
export const getStatusChipColors = (
  status: HelpRequestStatus,
  theme: {
    colors: {
      primaryContainer: string;
      onPrimaryContainer: string;
      secondaryContainer: string;
      onSecondaryContainer: string;
      surfaceVariant: string;
      onSurfaceVariant: string;
      errorContainer: string;
      onErrorContainer: string;
    };
  },
): StatusChipColors => {
  switch (status) {
    case 'OPEN':
      return {
        background: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
      };
    case 'PENDING_REVIEW':
      return {
        background: theme.colors.secondaryContainer,
        text: theme.colors.onSecondaryContainer,
      };
    case 'REJECTED':
      return {
        background: theme.colors.errorContainer,
        text: theme.colors.onErrorContainer,
      };
    case 'RESOLVED':
    case 'ARCHIVED':
    default:
      return {
        background: theme.colors.surfaceVariant,
        text: theme.colors.onSurfaceVariant,
      };
  }
};

/**
 * Deep link for a single help request. `Linking.createURL` resolves to the
 * `kisankatta://` scheme on device and to the origin on web, so the same helper
 * works once universal links are configured.
 */
export const buildHelpRequestLink = (requestId: string): string =>
  Linking.createURL(`/assistance-request/${requestId}`);

export const buildHelpRequestShareMessage = (request: {
  id: string;
  title: string;
  author: HelpRequestAuthor;
}): string =>
  assistanceStrings.share.message(
    request.title,
    request.author.name,
    formatAuthorPlace(request.author),
    buildHelpRequestLink(request.id),
  );
