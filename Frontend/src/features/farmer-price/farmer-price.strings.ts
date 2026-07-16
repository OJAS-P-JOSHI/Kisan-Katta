import type { ConfidenceLevel, ReasonType } from './farmer-price.types';

export const farmerPriceStrings = {
  tab: 'अपेक्षित भाव',
  screen: {
    title: 'शेतकऱ्यांचा अपेक्षित भाव',
    subtitle: 'तुमच्या जिल्ह्यातील शेतकऱ्यांचे अपेक्षित विक्री दर',
  },
  poll: {
    governmentPriceLabel: 'Government Price',
    governmentPriceUnavailableChip: '⚠ Market price unavailable',
    communityPriceLabel: 'Community Expected',
    waitingVotesProgress: (current: number, required: number) => `${current} / ${required} Votes`,
    waitingVotesNeed: (remaining: number) => `Need ${remaining} more votes`,
    perQuintal: 'per Quintal',
    votesChip: (count: number) => `👨‍🌾 ${count} Votes`,
    votesProgressChip: (current: number, required: number) =>
      `👨‍🌾 ${current} / ${required} Votes`,
    compactRemaining: (days: number, hours: number) => `${days}d ${hours}h`,
    compactHoursOnly: (hours: number) => `${hours}h`,
    timeChip: (label: string) => `⏱ ${label}`,
    viewComments: (count: number) =>
      count === 1 ? '💬 View 1 Comment →' : `💬 View ${count} Comments →`,
    viewCommentsEmpty: '💬 View Comments →',
    a11yPollCard: (crop: string, district: string) => `${crop}, ${district} price poll`,
    a11yViewComments: 'View comments',
  },
  confidence: {
    NOT_AVAILABLE: 'N/A',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  } satisfies Record<ConfidenceLevel, string>,
  vote: {
    heading: 'Your Expected Price',
    placeholder: 'e.g. 7000',
    prefix: '₹',
    suffix: 'per Quintal',
    reasonTypeLabel: 'Reason',
    reasonTypePlaceholder: 'Select reason',
    reasonTextPlaceholder: 'Write your reason…',
    reasonCounter: (current: number, max: number) => `${current} / ${max}`,
    submit: 'Submit Vote',
    submitting: 'Submitting…',
    priceRequired: 'कृपया अपेक्षित दर भरा.',
    priceInvalid: 'कृपया वैध पूर्णांक किंमत भरा.',
    reasonTypeRequired: 'कृपया कारणाचा प्रकार निवडा.',
    reasonTextRequired: 'कृपया कारण लिहा.',
    a11yPriceField: 'अपेक्षित विक्री दर',
    a11ySubmit: 'मत नोंदवा',
  },
  reasonTypes: {
    HIGH_DEMAND: 'High Demand',
    LOW_SUPPLY: 'Low Supply',
    GOOD_QUALITY: 'Good Quality',
    EXPORT_DEMAND: 'Export Demand',
    STORAGE_AVAILABLE: 'Storage Available',
    HIGH_TRANSPORT_COST: 'High Transport Cost',
    LOW_QUALITY: 'Low Quality',
    OTHER: 'Other',
  } satisfies Record<ReasonType, string>,
  thankYou: {
    heading: 'Your Vote',
    priceLine: (amount: string) => `${amount} / Quintal`,
    a11y: 'Your vote submitted',
  },
  comments: {
    title: 'Comments',
    subtitle: 'What farmers are saying',
    emptyEmoji: '💬',
    emptyTitle: 'No comments yet.',
    emptyBody: 'Be the first farmer to explain your expected price.',
    filters: {
      all: 'All',
      goodQuality: 'Good Quality',
      lowQuality: 'Low Quality',
      storage: 'Storage',
      export: 'Export',
      transport: 'Transport',
      other: 'Other',
    },
  },
  disclaimer: {
    line1: 'हा दर अधिकृत बाजारभाव नाही.',
    line2: 'हा शेतकऱ्यांच्या अज्ञात प्रतिसादांवर आधारित आहे.',
  },
  empty: {
    noPollTitle: 'सध्या कोणतेही मतदान उपलब्ध नाही.',
    noPollEmoji: '🌾',
    refresh: 'Refresh',
    noFavoritesTitle: 'आधी तुमची आवडती पिके निवडा.',
    noFavoritesEmoji: '🌱',
    openProfile: 'प्रोफाइल उघडा',
  },
  network: {
    title: 'नेटवर्क त्रुटी',
    message: 'डेटा लोड करता आला नाही. कृपया कनेक्शन तपासा.',
    retry: 'पुन्हा प्रयत्न करा',
  },
  snackbar: {
    voteSuccess: 'मत यशस्वीरित्या नोंदवले.',
    dismiss: 'OK',
  },
  relative: {
    justNow: 'just now',
    minutesAgo: (n: number) => (n === 1 ? '1 minute ago' : `${n} minutes ago`),
    hoursAgo: (n: number) => (n === 1 ? '1 hour ago' : `${n} hours ago`),
    daysAgo: (n: number) => (n === 1 ? '1 day ago' : `${n} days ago`),
  },
} as const;

export function getReasonTypeLabel(reasonType: ReasonType): string {
  return farmerPriceStrings.reasonTypes[reasonType];
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  return farmerPriceStrings.confidence[confidence];
}
