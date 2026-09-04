import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';

import { PolicyLinkCard, PolicyLinkDivider, PolicyLinkRow, openPolicyUrl } from '../components/PolicyLinkRow';
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment';
import {
  SUBSCRIPTION_FEE_RUPEES,
  SUBSCRIPTION_POLICY_URLS,
} from '../subscription.constants';
import { subscriptionStrings } from '../subscription.strings';

const LOGO = require('../../../../assets/branding/logo-circle.png');
const WAVE = require('../../../../assets/branding/login-wave.png');
const LANDSCAPE = require('../../../../assets/branding/login-landscape.webp');

const C = {
  cream: '#FDF9F3',
  primaryGreen: '#006A2C',
  brandGreen: '#0D5C2E',
  headingGreen: '#1B5E20',
  tagline: '#5C5348',
  bodyGrey: '#6B6560',
  paleGreen: '#E8F5EC',
  priceWash: '#EEF6F0',
  white: '#FFFFFF',
  error: '#C62828',
  rowBorder: '#E6E2D8',
} as const;

const FEATURES: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}[] = [
  { icon: 'weather-partly-cloudy', label: subscriptionStrings.features.weather },
  { icon: 'storefront-outline', label: subscriptionStrings.features.mandi },
  { icon: 'sprout-outline', label: subscriptionStrings.features.crops },
  { icon: 'hand-coin-outline', label: subscriptionStrings.features.farmerPrice },
  { icon: 'cart-outline', label: subscriptionStrings.features.marketplace },
];

type Layout = {
  compact: boolean;
  short: boolean;
  headerBand: number;
  waveH: number;
  logo: number;
  padX: number;
  brandSize: number;
  tagSize: number;
  titleSize: number;
  priceSize: number;
};

function layoutFor(width: number, height: number, fontScale: number): Layout {
  const compact = height < 700;
  const short = height < 640;
  const narrow = width < 360;
  const h = Math.min(Math.max(width / 390, 0.82), 1.08);
  const hs = (n: number) => Math.round(n * h);
  const fs = Math.min(Math.max(fontScale, 1), 1.5);
  const fontExtra = Math.round(Math.max(0, fs - 1) * 24);

  return {
    compact,
    short,
    headerBand: (short ? 70 : compact ? 78 : 88) + fontExtra,
    waveH: short ? 24 : compact ? 28 : 34,
    logo: hs(narrow ? 38 : compact ? 42 : 46),
    padX: Math.max(16, Math.min(22, hs(20))),
    brandSize: narrow ? 14 : compact ? 15 : 16,
    tagSize: narrow ? 10 : 11,
    titleSize: compact ? 18 : 20,
    priceSize: compact ? 36 : 40,
  };
}

/**
 * Paywall screen — shown after profile completion until subscription.isActive.
 * Root layout Stack.Protected keeps Home unreachable until refreshUser flips access.
 */
export default function SubscriptionScreen() {
  const { user, refreshUser } = useAuth();
  const { phase, error, busy, loadingLabel, payNow, confirmActive } =
    useSubscriptionPayment({
      contact: user?.mobile,
    });

  const { width: W, height: H, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const L = useMemo(() => layoutFor(W, H, fontScale), [W, H, fontScale]);
  const fs = Math.min(Math.max(fontScale, 1), 1.5);
  const logoPad = L.compact ? 4 : 8;
  const tagLines = fs > 1.2 ? 2 : 1;
  const textBlockH =
    Math.ceil(L.brandSize * fs * 1.3) + 2 + Math.ceil(L.tagSize * fs * 1.4) * tagLines;
  const logoRowH = Math.max(L.logo, textBlockH) + logoPad + 6;
  const headerH = insets.top + Math.max(L.headerBand, logoRowH + Math.round(L.waveH * 0.4));
  const hPad = L.padX + Math.max(insets.left, 0);
  const hPadRight = L.padX + Math.max(insets.right, 0);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // On mount / resume: if webhook already activated, refresh and let the guard enter Home.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await confirmActive();
      if (cancelled) return;
      if (active) {
        await refreshUser();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [confirmActive, refreshUser]);

  const handlePay = useCallback(async () => {
    console.log('PAYMENT STEP 1 Button onPress → handlePay');
    await payNow();
    // Success → refreshUser inside hook → canEnterApp becomes true → tabs.
  }, [payNow]);

  const isSuccess = phase === 'success';
  const ctaDisabled = busy || isSuccess;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: headerH }}>
          <View style={styles.headerClip}>
            <Image source={LANDSCAPE} style={styles.headerLandscape} resizeMode="cover" />
            <View
              style={[
                styles.logoRow,
                {
                  paddingTop: insets.top + logoPad,
                  paddingLeft: hPad,
                  paddingRight: hPadRight,
                },
              ]}
            >
              <View style={{ width: L.logo, height: L.logo, flexShrink: 0 }}>
                <Image source={LOGO} style={{ width: L.logo, height: L.logo }} resizeMode="contain" />
              </View>
              <View style={styles.brandCol}>
                <Text
                  style={[styles.brandName, { fontSize: L.brandSize }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.5}
                >
                  {strings.app.name}
                </Text>
                <Text
                  style={[styles.brandTag, { fontSize: L.tagSize }]}
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.5}
                >
                  शेतकऱ्यांचे डिजिटल व्यासपीठ
                </Text>
              </View>
            </View>
            <View pointerEvents="none" style={[styles.wave, { height: L.waveH }]}>
              <Image source={WAVE} style={styles.fill} resizeMode="cover" />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sheet,
            {
              marginTop: -18,
              paddingLeft: hPad,
              paddingRight: hPadRight,
              paddingTop: L.short ? 16 : 20,
            },
          ]}
        >
          <View style={styles.shieldWrap}>
            <MaterialCommunityIcons name="shield-check" size={28} color={C.primaryGreen} />
          </View>

          <Text
            style={[styles.title, { fontSize: L.titleSize, lineHeight: Math.round(L.titleSize * 1.25) }]}
            maxFontSizeMultiplier={1.5}
          >
            {subscriptionStrings.title}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.5}>
            {subscriptionStrings.subtitle}
          </Text>

          <View style={styles.priceBox}>
            <View style={styles.planBadgeSlot}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText} maxFontSizeMultiplier={1.4}>
                  {subscriptionStrings.monthlyPlan}
                </Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { fontSize: L.priceSize }]} maxFontSizeMultiplier={1.4}>
                ₹{SUBSCRIPTION_FEE_RUPEES}
              </Text>
              <Text style={styles.perMonth} maxFontSizeMultiplier={1.4}>
                {subscriptionStrings.perMonth}
              </Text>
            </View>
            <View style={styles.planTagRow}>
              <MaterialCommunityIcons name="leaf" size={14} color={C.primaryGreen} />
              <Text style={styles.planTag} maxFontSizeMultiplier={1.5}>
                {subscriptionStrings.planTag}
              </Text>
            </View>
          </View>

          <View style={styles.featuresHead}>
            <View style={styles.hairline} />
            <Text style={styles.featuresHeading} maxFontSizeMultiplier={1.5}>
              {subscriptionStrings.featuresHeading}
            </Text>
            <View style={styles.hairline} />
          </View>

          <View style={styles.featureGrid}>
            {FEATURES.map((item) => (
              <View key={item.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={C.primaryGreen} />
                </View>
                <Text style={styles.featureLabel} numberOfLines={2} maxFontSizeMultiplier={1.5}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="autorenew" size={18} color={C.primaryGreen} />
              <Text style={styles.infoText} maxFontSizeMultiplier={1.5}>
                {subscriptionStrings.renews}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color={C.primaryGreen} />
              <Text style={styles.infoText} maxFontSizeMultiplier={1.5}>
                {subscriptionStrings.cancelAnytime}
              </Text>
            </View>
          </View>

          {error ? (
            <Text style={styles.error} maxFontSizeMultiplier={1.5}>
              {error}
            </Text>
          ) : null}

          {busy || isSuccess ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={C.white} />
              <Text style={styles.busyLabel} maxFontSizeMultiplier={1.5}>
                {isSuccess ? subscriptionStrings.successBody : loadingLabel}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                void handlePay();
              }}
              disabled={ctaDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: ctaDisabled, busy }}
              style={({ pressed }) => [
                styles.cta,
                pressed && !ctaDisabled ? styles.ctaPressed : null,
                ctaDisabled ? styles.ctaDisabled : null,
              ]}
            >
              <Text style={styles.ctaLabel} maxFontSizeMultiplier={1.5}>
                {phase === 'failed' ? subscriptionStrings.retry : subscriptionStrings.payNow}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={C.white} />
            </Pressable>
          )}

          <View style={styles.razorpayRow}>
            <MaterialCommunityIcons name="shield-lock-outline" size={14} color={C.primaryGreen} />
            <Text style={styles.razorpay} maxFontSizeMultiplier={1.5}>
              {subscriptionStrings.razorpay}
            </Text>
          </View>

          <Text style={styles.requiredHint} maxFontSizeMultiplier={1.5}>
            {subscriptionStrings.requiredHint}
          </Text>

          <View style={styles.legalHead}>
            <MaterialCommunityIcons name="information-outline" size={16} color={C.primaryGreen} />
            <Text style={styles.legalHeadText} maxFontSizeMultiplier={1.5}>
              {subscriptionStrings.beforeSubscribe}
            </Text>
          </View>

          <PolicyLinkCard>
            <PolicyLinkRow
              icon="shield-outline"
              title={subscriptionStrings.privacyTitle}
              hint={subscriptionStrings.privacyHint}
              onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.privacy)}
            />
            <PolicyLinkDivider />
            <PolicyLinkRow
              icon="file-document-outline"
              title={subscriptionStrings.termsTitle}
              hint={subscriptionStrings.termsHint}
              onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.terms)}
            />
            <PolicyLinkDivider />
            <PolicyLinkRow
              icon="cash-refund"
              title={subscriptionStrings.refundTitle}
              hint={subscriptionStrings.refundHint}
              onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.refund)}
            />
          </PolicyLinkCard>

          <PolicyLinkCard style={styles.contactCard}>
            <PolicyLinkRow
              icon="headset"
              title={subscriptionStrings.contactTitle}
              hint={subscriptionStrings.contactHint}
              onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.contact)}
            />
          </PolicyLinkCard>

          <View style={styles.footerBrand}>
            <MaterialCommunityIcons name="leaf" size={14} color={C.primaryGreen} />
            <Text style={styles.footerName} maxFontSizeMultiplier={1.4}>
              {strings.app.name}
            </Text>
            <MaterialCommunityIcons name="leaf" size={14} color={C.primaryGreen} />
          </View>
          <Text style={styles.footerVersion} maxFontSizeMultiplier={1.3}>
            Version {appVersion}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: C.cream },

  headerClip: { flex: 1, overflow: 'hidden', backgroundColor: '#E8D5A3' },
  headerLandscape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  logoRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandCol: { flex: 1, justifyContent: 'center', minWidth: 0, paddingRight: 4 },
  brandName: {
    color: C.brandGreen,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandTag: {
    color: C.tagline,
    fontWeight: '500',
    marginTop: 1,
  },
  fill: { width: '100%', height: '100%' },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 2,
  },

  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    width: '100%',
    maxWidth: '100%',
    overflow: 'visible',
    shadowColor: '#1A1C19',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  shieldWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: C.headingGreen,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    alignSelf: 'stretch',
  },
  subtitle: {
    marginTop: 6,
    color: C.bodyGrey,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    alignSelf: 'stretch',
  },

  priceBox: {
    marginTop: 16,
    backgroundColor: C.priceWash,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
    overflow: 'visible',
    width: '100%',
    maxWidth: '100%',
  },
  planBadgeSlot: {
    alignItems: 'center',
    marginBottom: 6,
  },
  planBadge: {
    backgroundColor: C.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  planBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  price: {
    color: C.primaryGreen,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  perMonth: {
    color: '#2A2A2A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  planTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    maxWidth: '100%',
  },
  planTag: {
    color: C.brandGreen,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },

  featuresHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 12,
  },
  hairline: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.rowBorder },
  featuresHeading: {
    color: C.primaryGreen,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 12,
  },
  featureItem: {
    flexGrow: 1,
    flexBasis: '18%',
    minWidth: 64,
    maxWidth: 96,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  featureLabel: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: C.bodyGrey,
    fontWeight: '600',
  },

  infoCard: {
    marginTop: 16,
    backgroundColor: C.priceWash,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    width: '100%',
    maxWidth: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    color: C.bodyGrey,
    fontSize: 13,
    lineHeight: 18,
  },

  error: {
    marginTop: 12,
    color: C.error,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  busyRow: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: C.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  busyLabel: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cta: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: C.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaPressed: { opacity: 0.9 },
  ctaDisabled: { opacity: 0.55 },
  ctaLabel: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  razorpayRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 4,
  },
  razorpay: {
    color: C.bodyGrey,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'center',
  },
  requiredHint: {
    marginTop: 8,
    color: C.bodyGrey,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    alignSelf: 'stretch',
  },

  legalHead: {
    marginTop: 22,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  legalHeadText: {
    color: C.headingGreen,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  contactCard: { marginTop: 10 },

  footerBrand: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerName: {
    color: C.brandGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  footerVersion: {
    marginTop: 4,
    textAlign: 'center',
    color: '#9A958C',
    fontSize: 11,
  },
});
