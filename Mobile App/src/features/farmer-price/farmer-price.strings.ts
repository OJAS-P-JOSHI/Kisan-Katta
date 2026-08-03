import type { ConfidenceLevel, ReasonType } from './farmer-price.types';

/**
 * Copy for the community intelligence experience.
 * Empty states always invite participation — never "come back later".
 */
export const farmerPriceStrings = {
  tab: 'अपेक्षित भाव',
  screen: {
    title: 'शेतकऱ्यांचा अपेक्षित भाव',
    subtitle: 'District farmers’ fair-price view for today',
    listHeading: 'Your crops',
  },
  card: {
    governmentPriceLabel: 'Government',
    governmentPriceCaption: 'Reference only',
    governmentPriceUnavailable: 'Not published today',
    communityPriceLabel: 'Community',
    communityPriceHiddenTitle: 'Not revealed yet',
    communityPriceHiddenBody: (required: number) =>
      `Appears after ${required} opinions`,
    communityPriceHiddenProgress: (current: number, required: number) =>
      `${current}/${required}`,
    communityProgressShort: (current: number, required: number) =>
      `${current}/${required}`,
    perQuintal: 'per Quintal',
    perUnit: (unit: string) => `per ${unit}`,
    allowedRangeLabel: (min: string, max: string, unit: string) =>
      `Allowed Range  ${min} – ${max} / ${unit}`,
    confidenceLabel: 'Confidence',
    participantsNone: (district: string) =>
      `No opinions yet. Be the first farmer from ${district}.`,
    participantsSome: (count: number) =>
      count === 1 ? '1 opinion' : `${count} opinions`,
    signalsHeading: 'Signals',
    signalsEmptyTitle: 'No market notes yet.',
    signalsEmptyBody: 'Your vote can add the first one.',
    /** Compact status (one message per card) */
    statusEmpty: (district: string) =>
      `🌱  No opinions yet · Be the first in ${district}`,
    statusPartial: (current: number, required: number) =>
      `🌱  ${current} of ${required} opinions · Your vote helps`,
    statusVoted: '✓  Opinion recorded · Waiting for consensus',
    statusConsensus: '🟢  Community consensus available',
    /** Status banners (kept for compatibility; card no longer renders them) */
    bannerFirst: 'Be the first farmer to share today’s fair price.',
    bannerInvite: (crop: string, district: string) =>
      `You can become the first voice for ${crop} in ${district}.`,
    bannerHelp: 'Help other farmers understand today’s market.',
    bannerVoted: 'Your opinion is included.',
    bannerConsensus: 'Community consensus available.',
    /** CTAs */
    shareOpinion: 'Share My Opinion',
    continueVoting: 'Continue Voting',
    viewCommunity: 'View Community',
    viewDetails: 'View Details',
    a11yCard: (crop: string, district: string) => `${crop} in ${district}, community price card`,
    a11yShare: (crop: string) => `Share your opinion for ${crop}`,
    a11yViewCommunity: (crop: string) => `View community for ${crop}`,
    closingIn: (label: string) => `closes in ${label}`,
    inviteTitle: 'No opinions yet.',
    inviteBody: (crop: string, district: string) =>
      `Be the first voice for ${crop} in ${district}.`,
    invitePartialTitle: (count: number) =>
      count === 1 ? '1 opinion so far' : `${count} opinions so far`,
    invitePartialBody: (required: number) =>
      `Community price after ${required} farmers.`,
  },
  detail: {
    title: 'Community Price',
    governmentPriceLabel: 'Government Price',
    governmentPriceHint: 'Latest official mandi rate — a reference point, not a target.',
    communityPriceLabel: 'Community Expected Price',
    communityPriceHint: 'Median of every farmer opinion in your district.',
    communityWaitingTitle: 'Community price will appear once enough farmers participate.',
    communityWaitingBody: (current: number, required: number) =>
      current === 0
        ? `You can help build today’s consensus. ${required} opinions needed.`
        : `${current} of ${required} opinions collected. You can still strengthen today’s consensus.`,
    differenceHeading: 'Difference',
    differenceHigher: 'Community values this crop higher than the government rate.',
    differenceLower: 'Community values this crop lower than the government rate.',
    differenceEqual: 'Community agrees with the government rate.',
    differenceUnavailable:
      'Difference appears after the community price is revealed. Share your opinion to help get there.',
    signalsHeading: 'Top Market Signals',
    signalsSubtitle: 'Why farmers believe today’s price is what it is',
    signalsEmptyTitle: 'No farmer has explained today’s market yet.',
    signalsEmptyBody: 'Share why you believe this is today’s fair price.',
    signalFarmers: (count: number) => (count === 1 ? '1 Farmer' : `${count} Farmers`),
    insightsHeading: 'Community Insights',
    insightsSubtitle: 'Recent notes from farmers near you',
    insightsEmptyTitle: 'No insights yet.',
    insightsEmptyBody: 'Your note can be the first one other farmers read.',
    statsVotes: 'Opinions',
    statsConfidence: 'Confidence',
    statsWindow: 'Window',
    windowClosed: 'Closed',
    retry: 'पुन्हा प्रयत्न करा',
    notFound: 'हे पीक सध्या उपलब्ध नाही.',
    yourVoteHeading: 'Your Vote',
  },
  vote: {
    heading: 'Share Your Opinion',
    question: 'What price do you believe farmers should receive today?',
    helper: 'Slide, or type the amount you think is fair.',
    firstVoiceHint: (crop: string, district: string) =>
      `Start the conversation for ${crop} in ${district}.`,
    prefix: '₹',
    suffix: '/ Quintal',
    suffixPerUnit: (unit: string) => `/ ${unit}`,
    matchGovernment: 'Match government price',
    reasonHeading: 'What makes you think this price is fair?',
    reasonNoteLabel: 'Add a short note',
    reasonNotePlaceholder: 'Explain in one line — other farmers will read this.',
    reasonCounter: (current: number, max: number) => `${current} / ${max}`,
    submit: 'Submit Opinion',
    submitting: 'Submitting…',
    priceRequired: 'कृपया अपेक्षित दर भरा.',
    priceInvalid: 'कृपया वैध पूर्णांक किंमत भरा.',
    priceOutOfRange: (min: string, max: string) => `दर ${min} ते ${max} दरम्यान असावा.`,
    reasonTypeRequired: 'कृपया एक कारण निवडा.',
    reasonTextRequired: 'कृपया किमान १० अक्षरांची टीप लिहा.',
    a11yPriceField: 'अपेक्षित विक्री दर',
    a11yPriceSlider: 'अपेक्षित विक्री दर स्लायडर',
    a11ySubmit: 'तुमचे मत नोंदवा',
    closedTitle: 'हे मतदान बंद झाले आहे.',
    closedBody: 'पुढील फेरी लवकरच सुरू होईल.',
  },
  reasonTypes: {
    HIGH_DEMAND: 'Strong local demand',
    LOW_SUPPLY: 'Low arrivals',
    GOOD_QUALITY: 'Better crop quality',
    EXPORT_DEMAND: 'Export demand',
    HIGH_TRANSPORT_COST: 'High transport cost',
    LOW_QUALITY: 'Weaker crop quality',
    STORAGE_AVAILABLE: 'Storage available',
    OTHER: 'Other',
  } satisfies Record<ReasonType, string>,
  reasonEmoji: {
    HIGH_DEMAND: '🏪',
    LOW_SUPPLY: '🌧',
    GOOD_QUALITY: '🌾',
    EXPORT_DEMAND: '📦',
    HIGH_TRANSPORT_COST: '🚚',
    LOW_QUALITY: '📉',
    STORAGE_AVAILABLE: '💰',
    OTHER: '✍️',
  } satisfies Record<ReasonType, string>,
  confidence: {
    NOT_AVAILABLE: 'N/A',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  } satisfies Record<ConfidenceLevel, string>,
  submitted: {
    heading: '✓ Opinion submitted',
    thanks: (district: string) => `Thank you for helping farmers in ${district}.`,
    included: 'Your vote has been included in today’s community price.',
    waitingConsensus: (required: number) =>
      `Community price will appear after ${required} farmers participate — your opinion is already counted.`,
    yourSubmittedPrice: 'Your submitted price',
    a11y: 'Your opinion was submitted',
  },
  disclaimer: {
    line1: 'हा दर अधिकृत बाजारभाव नाही.',
    line2: 'हा शेतकऱ्यांच्या अज्ञात मतांवर आधारित आहे.',
  },
  empty: {
    noPollTitle: 'सध्या कोणतेही पीक उपलब्ध नाही.',
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
    voteSuccess: 'तुमचे मत नोंदवले गेले.',
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

export function getReasonEmoji(reasonType: ReasonType): string {
  return farmerPriceStrings.reasonEmoji[reasonType];
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  return farmerPriceStrings.confidence[confidence];
}
