import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MarketplaceInfoSheet } from './components/MarketplaceInfoSheet';
import { SEARCH_DEBOUNCE_MS } from './marketplace.constants';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { marketplaceStrings } from './marketplace.strings';

const LANDSCAPE = require('../../../assets/branding/login-landscape.webp');

const BOTTOM_FADE_STEPS = 14;
const LEFT_FADE_STEPS = 8;

function headerBandHeight(insetTop: number): number {
  return Math.round(Math.max(170, Math.min(190, insetTop + 138)));
}

/** Compact landscape strip — cover-crop only, fades into cream. No overlays that darken the art. */
function HeaderLandscapeStrip({ width, height }: { width: number; height: number }) {
  const imgW = Math.round(width * 1.36);
  const imgH = Math.round(height * 1.5);
  const fadeH = Math.round(height * 0.5);

  return (
    <View pointerEvents="none" style={styles.headerArtClip}>
      <Image
        source={LANDSCAPE}
        resizeMode="cover"
        style={{
          position: 'absolute',
          width: imgW,
          height: imgH,
          left: Math.round(-(width * 0.3)),
          top: Math.round(-(height * 0.08)),
        }}
      />
      <View style={styles.headerLeftFade}>
        {Array.from({ length: LEFT_FADE_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.headerFadeSlice,
              { opacity: ((LEFT_FADE_STEPS - i) / LEFT_FADE_STEPS) * 0.32 },
            ]}
          />
        ))}
      </View>
      <View style={[styles.headerBottomFade, { height: fadeH }]}>
        {Array.from({ length: BOTTOM_FADE_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.headerFadeSlice,
              { opacity: ((i + 1) / BOTTOM_FADE_STEPS) ** 1.7 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const C = {
  cream: '#FDF9F3',
  headingGreen: '#1B5E20',
  primaryGreen: '#006A2C',
  tagline: '#5C5348',
  bodyGrey: '#6B6560',
  muted: '#8A847C',
  white: '#FFFFFF',
  searchBorder: '#E4DFD4',
  searchBorderFocus: '#8FBF98',
  searchWashFocus: '#F7FBF7',
  produceBg: '#E8F5EC',
  produceWash: '#D7EEDD',
  productBg: '#F6EEDC',
  productWash: '#EFE3C8',
  productCta: '#C9A227',
  productTitle: '#3E3428',
  labourBg: '#E4EEF5',
  labourWash: '#D3E2EE',
  labourTitle: '#2F5F7A',
  cardLine: 'rgba(27, 94, 32, 0.09)',
  infoBorder: 'rgba(0, 106, 44, 0.16)',
} as const;

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Layout = {
  short: boolean;
  narrow: boolean;
  padX: number;
  titleSize: number;
  subSize: number;
  sectionSize: number;
  searchSize: number;
  artSize: number;
  artIcon: number;
  chevron: number;
  cardPad: number;
  quickStacked: boolean;
};

function layoutFor(width: number, height: number, fontScale: number): Layout {
  const short = height < 640;
  const narrow = width < 360;
  const h = Math.min(Math.max(width / 390, 0.82), 1.06);
  const hs = (n: number) => Math.round(n * h);
  const largeType = fontScale > 1.2;

  return {
    short,
    narrow,
    padX: Math.max(14, Math.min(20, hs(18))),
    titleSize: largeType ? (narrow ? 20 : 22) : narrow ? 22 : 24,
    subSize: narrow ? 13 : 14,
    sectionSize: narrow ? 15 : 16,
    searchSize: narrow || largeType ? 13 : 14,
    artSize: short ? 48 : narrow ? 52 : 56,
    artIcon: short ? 26 : narrow ? 28 : 30,
    chevron: 28,
    cardPad: short ? 12 : 14,
    quickStacked: width < 360,
  };
}

type CategoryTone = 'produce' | 'product' | 'labour';

const CATEGORY_TONES: Record<
  CategoryTone,
  {
    background: string;
    wash: string;
    title: string;
    body: string;
    ctaBg: string;
    ctaText: string;
    ctaBorder: string;
    artIcon: string;
    chevronBg: string;
    chevron: string;
    silhouette: string;
  }
> = {
  produce: {
    background: C.produceBg,
    wash: C.produceWash,
    title: C.headingGreen,
    body: C.bodyGrey,
    ctaBg: C.white,
    ctaText: C.primaryGreen,
    ctaBorder: 'rgba(0, 106, 44, 0.18)',
    artIcon: C.primaryGreen,
    chevronBg: C.white,
    chevron: C.primaryGreen,
    silhouette: 'rgba(0, 106, 44, 0.07)',
  },
  product: {
    background: C.productBg,
    wash: C.productWash,
    title: C.productTitle,
    body: C.bodyGrey,
    ctaBg: C.productCta,
    ctaText: C.white,
    ctaBorder: 'transparent',
    artIcon: '#8A6A1A',
    chevronBg: C.white,
    chevron: C.productCta,
    silhouette: 'rgba(201, 162, 39, 0.11)',
  },
  labour: {
    background: C.labourBg,
    wash: C.labourWash,
    title: C.labourTitle,
    body: C.bodyGrey,
    ctaBg: C.labourTitle,
    ctaText: C.white,
    ctaBorder: 'transparent',
    artIcon: C.labourTitle,
    chevronBg: C.white,
    chevron: C.labourTitle,
    silhouette: 'rgba(47, 95, 122, 0.09)',
  },
};

type CategoryCardProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  tone: CategoryTone;
  art: IconName;
  ghost: IconName;
  artSize: number;
  artIcon: number;
  chevron: number;
  cardPad: number;
  onPress: () => void;
};

function CategoryCard({
  title,
  subtitle,
  actionLabel,
  tone,
  art,
  ghost,
  artSize,
  artIcon,
  chevron,
  cardPad,
  onPress,
}: CategoryCardProps) {
  const colors = CATEGORY_TONES[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${actionLabel}`}
    >
      <View
        style={[
          styles.categoryCard,
          {
            backgroundColor: colors.background,
            padding: cardPad,
          },
        ]}
      >
        <View pointerEvents="none" style={styles.categoryGhostClip}>
          <MaterialCommunityIcons
            name={ghost}
            size={72}
            color={colors.silhouette}
            style={styles.categoryGhost}
          />
        </View>
        <View style={styles.categoryRow}>
          <View
            style={[
              styles.artWrap,
              {
                width: artSize,
                height: artSize,
                borderRadius: Math.round(artSize * 0.34),
                backgroundColor: colors.wash,
              },
            ]}
          >
            <MaterialCommunityIcons name={art} size={artIcon} color={colors.artIcon} />
          </View>
          <View style={styles.categoryText}>
            <Text
              style={[styles.categoryTitle, { color: colors.title }]}
              maxFontSizeMultiplier={1.5}
            >
              {title}
            </Text>
            <Text
              style={[styles.categorySubtitle, { color: colors.body }]}
              maxFontSizeMultiplier={1.5}
            >
              {subtitle}
            </Text>
            <View
              style={[
                styles.categoryCta,
                {
                  backgroundColor: colors.ctaBg,
                  borderColor: colors.ctaBorder,
                },
              ]}
            >
              <Text
                style={[styles.categoryCtaLabel, { color: colors.ctaText }]}
                numberOfLines={2}
                maxFontSizeMultiplier={1.5}
              >
                {actionLabel}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={15} color={colors.ctaText} />
            </View>
          </View>
          <View
            style={[
              styles.chevronWrap,
              { width: chevron, height: chevron, backgroundColor: colors.chevronBg },
            ]}
          >
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.chevron} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function QuickActionCard({
  icon,
  label,
  hint,
  stacked,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  stacked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        stacked ? styles.quickRow : styles.quickTile,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
    >
      <View style={styles.quickIconWrap}>
        <MaterialCommunityIcons name={icon} size={stacked ? 20 : 18} color={C.primaryGreen} />
      </View>
      <View style={stacked ? styles.quickRowText : styles.quickTileText}>
        <Text
          style={[styles.quickLabel, stacked ? styles.quickLabelRow : styles.quickLabelTile]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </Text>
        <Text
          style={[styles.quickHint, stacked ? styles.quickHintRow : styles.quickHintTile]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.5}
        >
          {hint}
        </Text>
      </View>
      {stacked ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={C.primaryGreen} />
      ) : null}
    </Pressable>
  );
}

function SectionHeading({ icon, label, size }: { icon: IconName; label: string; size: number }) {
  return (
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={17} color={C.primaryGreen} />
      <Text
        style={[styles.sectionTitle, { fontSize: size, lineHeight: Math.round(size * 1.3) }]}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </View>
  );
}

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: W, height: H, fontScale } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const L = useMemo(() => layoutFor(W, H, fontScale), [W, H, fontScale]);
  const hPad = L.padX + Math.max(insets.left, 0);
  const hPadRight = L.padX + Math.max(insets.right, 0);
  const headerH = headerBandHeight(insets.top);

  const navigateToSearch = useCallback(
    (search?: string) => {
      const href = search
        ? (`/marketplace-search?search=${encodeURIComponent(search)}` as Href)
        : ('/marketplace-search' as Href);
      router.push(href);
    },
    [router],
  );

  const navigateToProduce = useCallback(() => {
    router.push('/marketplace-produce' as Href);
  }, [router]);

  const handleSearchSubmit = useCallback(() => {
    navigateToSearch(debouncedSearch.trim() || undefined);
  }, [debouncedSearch, navigateToSearch]);

  const handleFilterPress = useCallback(() => {
    navigateToSearch();
  }, [navigateToSearch]);

  const openInfo = useCallback(() => {
    Keyboard.dismiss();
    setInfoVisible(true);
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            {
              minHeight: headerH,
              paddingTop: insets.top + 8,
              paddingLeft: hPad,
              paddingRight: hPadRight,
              paddingBottom: Math.round(headerH * 0.28),
            },
          ]}
        >
          <HeaderLandscapeStrip width={W} height={headerH} />
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.screenTitle,
                { fontSize: L.titleSize, lineHeight: Math.round(L.titleSize * 1.25) },
              ]}
              maxFontSizeMultiplier={1.5}
            >
              {marketplaceStrings.home.title}
            </Text>
            <Pressable
              onPress={openInfo}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={marketplaceStrings.home.infoA11y}
              style={({ pressed }) => [styles.infoBtn, pressed && styles.infoBtnPressed]}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={C.primaryGreen} />
            </Pressable>
          </View>
          <Text
            style={[
              styles.screenSubtitle,
              { fontSize: L.subSize, lineHeight: Math.round(L.subSize * 1.4) },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {marketplaceStrings.home.subtitle}
          </Text>
        </View>

        <View style={[styles.body, { paddingLeft: hPad, paddingRight: hPadRight }]}>
          <View style={[styles.searchWrap, searchFocused ? styles.searchWrapFocus : null]}>
            <Pressable
              onPress={handleSearchSubmit}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={marketplaceStrings.home.searchA11y}
              style={({ pressed }) => [styles.searchSide, pressed && styles.searchSidePressed]}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={C.primaryGreen} />
            </Pressable>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={marketplaceStrings.home.searchPlaceholder}
              placeholderTextColor={C.muted}
              returnKeyType="search"
              accessibilityLabel={marketplaceStrings.home.searchA11y}
              maxFontSizeMultiplier={1.5}
              style={[styles.searchInput, { fontSize: L.searchSize, lineHeight: Math.round(L.searchSize * 1.4) }]}
              underlineColorAndroid="transparent"
            />
            <Pressable
              onPress={handleFilterPress}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={marketplaceStrings.home.filterA11y}
              style={({ pressed }) => [styles.searchSide, pressed && styles.searchSidePressed]}
            >
              <MaterialCommunityIcons name="tune-variant" size={20} color={C.primaryGreen} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="leaf"
              label={marketplaceStrings.home.lookingForTitle}
              size={L.sectionSize}
            />
            <View style={styles.categoryStack}>
              <CategoryCard
                title={marketplaceStrings.home.produceCardTitle}
                subtitle={marketplaceStrings.home.produceCardSubtitle}
                actionLabel={marketplaceStrings.home.produceCardAction}
                tone="produce"
                art="basket"
                ghost="barley"
                artSize={L.artSize}
                artIcon={L.artIcon}
                chevron={L.chevron}
                cardPad={L.cardPad}
                onPress={() => navigateToProduce()}
              />
              <CategoryCard
                title={marketplaceStrings.home.productCardTitle}
                subtitle={marketplaceStrings.home.productCardSubtitle}
                actionLabel={marketplaceStrings.home.productCardAction}
                tone="product"
                art="sack"
                ghost="tractor-variant"
                artSize={L.artSize}
                artIcon={L.artIcon}
                chevron={L.chevron}
                cardPad={L.cardPad}
                onPress={() => router.push('/marketplace-products' as Href)}
              />
              <CategoryCard
                title={marketplaceStrings.home.labourCardTitle}
                subtitle={marketplaceStrings.home.labourCardSubtitle}
                actionLabel={marketplaceStrings.home.labourCardAction}
                tone="labour"
                art="account-hard-hat"
                ghost="account-group-outline"
                artSize={L.artSize}
                artIcon={L.artIcon}
                chevron={L.chevron}
                cardPad={L.cardPad}
                onPress={() => router.push('/marketplace-labour' as Href)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeading
              icon="flash"
              label={marketplaceStrings.home.quickActionsTitle}
              size={L.sectionSize}
            />
            <View style={L.quickStacked ? styles.quickStack : styles.quickRowSet}>
              <QuickActionCard
                icon="heart-outline"
                label={marketplaceStrings.home.savedListings}
                hint={marketplaceStrings.home.savedListingsHint}
                stacked={L.quickStacked}
                onPress={() => router.push('/marketplace-saved' as Href)}
              />
              <QuickActionCard
                icon="clipboard-list-outline"
                label={marketplaceStrings.home.myListings}
                hint={marketplaceStrings.home.myListingsHint}
                stacked={L.quickStacked}
                onPress={() => router.push('/marketplace-my-listings' as Href)}
              />
              <QuickActionCard
                icon="plus"
                label={marketplaceStrings.home.sellSomething}
                hint={marketplaceStrings.home.sellSomethingHint}
                stacked={L.quickStacked}
                onPress={() => router.push('/marketplace-create' as Href)}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <MarketplaceInfoSheet visible={infoVisible} onDismiss={() => setInfoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 0,
    paddingBottom: 8,
  },
  header: {
    backgroundColor: C.cream,
  },
  headerArtClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  headerLeftFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '40%',
    flexDirection: 'row',
  },
  headerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerFadeSlice: {
    flex: 1,
    backgroundColor: C.cream,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    color: C.headingGreen,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.infoBorder,
    flexShrink: 0,
  },
  infoBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  screenSubtitle: {
    marginTop: 3,
    color: C.tagline,
    fontWeight: '500',
  },
  body: {
    paddingTop: 2,
    paddingBottom: 4,
    gap: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.searchBorder,
    paddingHorizontal: 4,
    shadowColor: '#1A1C19',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchWrapFocus: {
    borderColor: C.searchBorderFocus,
    backgroundColor: C.searchWashFocus,
  },
  searchSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSidePressed: {
    opacity: 0.65,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: Platform.OS === 'android' ? 0 : 8,
    color: C.headingGreen,
    fontWeight: '500',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  section: {
    gap: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    color: C.headingGreen,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  categoryStack: {
    gap: 10,
  },
  categoryCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.cardLine,
    shadowColor: '#1A1C19',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryGhostClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderRadius: 18,
  },
  categoryGhost: {
    position: 'absolute',
    right: 28,
    bottom: -8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    zIndex: 1,
  },
  artWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  categoryTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  categorySubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  categoryCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryCtaLabel: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  chevronWrap: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#1A1C19',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickStack: {
    gap: 8,
  },
  quickRowSet: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.cardLine,
  },
  quickTile: {
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.cardLine,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickRowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  quickTileText: {
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    gap: 1,
  },
  quickLabel: {
    color: C.headingGreen,
    fontWeight: '700',
  },
  quickLabelRow: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'left',
  },
  quickLabelTile: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  quickHint: {
    color: C.bodyGrey,
    fontWeight: '400',
  },
  quickHintRow: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  quickHintTile: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.987 }],
  },
});
