import type { ConfidenceLevel, ReasonType } from './farmer-price.types';

export const farmerPriceStrings = {
  tab: 'अपेक्षित भाव',
  screen: {
    title: 'शेतकऱ्यांचा अपेक्षित भाव',
    subtitle: 'तुमच्या जिल्ह्यातील शेतकऱ्यांचे अपेक्षित विक्री दर',
  },
  poll: {
    governmentPriceLabel: 'शासकीय बाजारभाव',
    governmentPriceUnavailable: 'शासकीय बाजारभाव उपलब्ध नाही.',
    perQuintal: 'प्रति क्विंटल',
    updated: 'Updated',
    communityPriceLabel: 'शेतकऱ्यांचा अपेक्षित भाव',
    minimumVotesNotReached: 'अजून पुरेसे प्रतिसाद मिळाले नाहीत.',
    minimumVotesCaption: 'किमान १० शेतकऱ्यांच्या प्रतिसादानंतर अपेक्षित भाव दिसेल.',
    voteCount: (count: number) => `${count} शेतकरी`,
    votingEnds: 'Voting Ends',
    remainingTime: (days: number, hours: number) => `${days} दिवस ${hours} तास`,
    remainingHoursOnly: (hours: number) => `${hours} तास`,
    a11yPollCard: (crop: string, district: string) => `${crop}, ${district} मतदान कार्ड`,
  },
  confidence: {
    NOT_AVAILABLE: 'NOT_AVAILABLE',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  } satisfies Record<ConfidenceLevel, string>,
  vote: {
    heading: 'तुमचा अपेक्षित विक्री दर',
    placeholder: 'उदा. 7000',
    prefix: '₹',
    suffix: 'प्रति क्विंटल',
    reasonTypeLabel: 'कारणाचा प्रकार',
    reasonTypePlaceholder: 'कारण निवडा',
    reasonTextPlaceholder: 'तुमचे कारण लिहा...',
    reasonCounter: (current: number, max: number) => `${current} / ${max}`,
    submit: 'मत नोंदवा',
    submitting: 'नोंदवत आहे…',
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
    heading: 'धन्यवाद!',
    body: 'तुमचे मत यशस्वीरित्या नोंदवले आहे.',
    submittedPrice: 'नोंदवलेला दर',
    submittedReason: 'नोंदवलेले कारण',
    a11y: 'मत यशस्वीरित्या नोंदवले',
  },
  insights: {
    title: 'अलीकडील शेतकरी निरीक्षणे',
    anonymousAuthor: 'Anonymous Farmer',
    empty: 'अजून कोणतीही निरीक्षणे उपलब्ध नाहीत.',
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
    justNow: 'आत्ताच',
    minutesAgo: (n: number) => `${toMarathiDigits(n)} मिनिटांपूर्वी`,
    hoursAgo: (n: number) => `${toMarathiDigits(n)} तासांपूर्वी`,
    daysAgo: (n: number) => `${toMarathiDigits(n)} दिवसांपूर्वी`,
  },
} as const;

const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

function toMarathiDigits(value: number): string {
  return String(value)
    .split('')
    .map((ch) => (/\d/.test(ch) ? MARATHI_DIGITS[Number(ch)] : ch))
    .join('');
}

export function getReasonTypeLabel(reasonType: ReasonType): string {
  return farmerPriceStrings.reasonTypes[reasonType];
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  return farmerPriceStrings.confidence[confidence];
}
