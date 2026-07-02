/**
 * Centralized, user-facing copy. Never hardcode display strings in screens or
 * components; reference these tokens so the app stays translation-ready.
 */
export const strings = {
  app: {
    name: 'Kisan Katta',
  },
  tabs: {
    home: 'Home',
    market: 'Market',
    community: 'Community',
    marketplace: 'Marketplace',
    profile: 'Profile',
  },
  home: {
    title: 'Home',
    subtitle: 'Your daily farming snapshot',
    placeholder: 'Home content coming soon.',
    weatherTitle: "Today's Weather",
    weatherError: 'Unable to load weather data',
    retry: 'Retry',
    cropsTitle: 'My Favourite Crops',
    cropsSubtitle: 'Kanda · Soyabean · Kapus',
    cropsComing: 'Add favourite crops from your profile',
    marketTitle: "Today's Market Prices",
    marketSubtitle: 'Live mandi rates',
    marketComing: 'Market prices will appear here soon',
    govTitle: 'Government Schemes',
    govSubtitle: 'PM-KISAN, MSP & Maharashtra yojanas',
    govComing: 'Latest government schemes coming soon',
    newsTitle: 'Agriculture News',
    newsSubtitle: 'Farm tips & daily updates',
    newsComing: 'Agriculture news coming soon',
  },
  market: {
    title: 'Market',
    subtitle: 'Live mandi prices and trends',
    searchPlaceholder: 'Search commodity or market',
    loadingMessage: 'Fetching latest mandi prices…',
    errorTitle: 'Something went wrong',
    errorMessage: 'Unable to load market prices. Please check your connection and try again.',
    retry: 'Retry',
    emptyTitle: 'No prices found',
    emptyMessage: 'Try a different search term or filter.',
    modalPriceLabel: 'Modal Price',
    minPriceLabel: 'Min Price',
    maxPriceLabel: 'Max Price',
    perQuintal: 'per quintal',
  },
  community: {
    title: 'Community',
    subtitle: 'Connect with fellow farmers',
    placeholder: 'Community content coming soon.',
  },
  marketplace: {
    title: 'Marketplace',
    subtitle: 'Buy and sell produce and supplies',
    placeholder: 'Marketplace content coming soon.',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage your account',
    placeholder: 'Profile content coming soon.',
  },
} as const;
