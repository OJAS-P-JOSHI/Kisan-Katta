import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants';

import { useSendOtp } from '../hooks/useSendOtp';

// ---------------------------------------------------------------------------
// Assets — presentation only
// ---------------------------------------------------------------------------
const HERO_PHOTO = require('../../../../assets/branding/login-hero-banner.webp');
const LOGO = require('../../../../assets/branding/logo-circle.png');
const WAVE = require('../../../../assets/branding/login-wave.png');
const BADGE = require('../../../../assets/branding/login-badge.png');
const LANDSCAPE = require('../../../../assets/branding/login-landscape.webp');

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  cream: '#FDF9F3',
  primaryGreen: '#006A2C',
  welcomeGreen: '#1B6B32',
  headingBrown: '#4A3728',
  brandGreen: '#0D5C2E',
  tagline: '#5C5348',
  bodyGrey: '#7A746C',
  inputBorder: '#2F6A3A',
  inputBg: '#FFFFFF',
  paleGreen: '#E8F5EC',
  trustOrange: '#E09112',
  divider: '#E4E0D6',
  white: '#FFFFFF',
  error: '#C62828',
} as const;

const MOBILE_REGEX = /^\d{10}$/;

type Layout = {
  compact: boolean;
  cozy: boolean;
  heroH: number;
  waveH: number;
  badge: number;
  logo: number;
  padX: number;
  inputH: number;
  ctaH: number;
  gap: number;
  landscapeMin: number;
  welcomeSize: number;
  headingSize: number;
  subSize: number;
  brandSize: number;
  tagSize: number;
};

function layoutFor(width: number, height: number): Layout {
  const compact = height < 700;
  const cozy = height < 800;
  const v = Math.min(Math.max(height / 844, 0.72), 1.06);
  const h = Math.min(Math.max(width / 390, 0.82), 1.1);
  const vs = (n: number) => Math.round(n * v);
  const hs = (n: number) => Math.round(n * h);

  const heroRatio = compact ? 0.30 : cozy ? 0.335 : 0.355;
  const heroH = Math.round(height * heroRatio);
  const waveH = Math.round(Math.max(compact ? 70 : 82, Math.min(heroH * 0.40, width * 0.28)));

  return {
    compact,
    cozy,
    heroH,
    waveH,
    badge: hs(compact ? 46 : 54),
    logo: hs(compact ? 44 : 52),
    padX: hs(20),
    inputH: compact ? 48 : 54,
    ctaH: compact ? 48 : 54,
    gap: compact ? vs(8) : cozy ? vs(10) : vs(12),
    landscapeMin: compact ? vs(96) : vs(140),
    welcomeSize: compact ? 15 : 17,
    headingSize: compact ? 18 : 22,
    subSize: compact ? 12 : 13,
    brandSize: compact ? 14 : 16,
    tagSize: compact ? 9 : 11,
  };
}

function IndianFlag({ width, height }: { width: number; height: number }) {
  const chakra = Math.max(3, Math.round(height * 0.28));
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#CFCFCF',
      }}
    >
      <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: chakra,
            height: chakra,
            borderRadius: chakra,
            borderWidth: 1,
            borderColor: '#000080',
          }}
        />
      </View>
      <View style={{ flex: 1, backgroundColor: '#138808' }} />
    </View>
  );
}

function TrustColumn({
  icon,
  iconColor,
  title,
  titleColor,
  subtitle,
  compact,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  title: string;
  titleColor: string;
  subtitle: string;
  compact: boolean;
}) {
  return (
    <View style={styles.trustCol}>
      <MaterialCommunityIcons name={icon} size={compact ? 18 : 22} color={iconColor} />
      <Text style={[styles.trustTitle, { color: titleColor, fontSize: compact ? 11 : 13 }]}>{title}</Text>
      <Text style={[styles.trustSub, { fontSize: compact ? 9 : 10 }]} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  );
}

export default function MobileNumberScreen() {
  // ── Business logic — UNTOUCHED ──────────────────────────────────────────
  const [mobile, setMobile] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { loading, error, sendOtp, clearError } = useSendOtp();

  const handleChangeMobile = (text: string): void => {
    setMobile(text.replace(/[^0-9]/g, '').slice(0, 10));
    if (validationError) setValidationError(null);
    if (error) clearError();
  };

  const handleContinue = async (): Promise<void> => {
    if (!MOBILE_REGEX.test(mobile)) {
      setValidationError(strings.auth.mobileInvalid);
      return;
    }
    const result = await sendOtp(mobile);
    if (result) {
      router.push({ pathname: '/otp', params: { mobile, devOtp: result.otp ?? '' } });
    }
  };

  const displayedError = validationError ?? error;
  const canSubmit = mobile.length === 10 && !loading;
  // ────────────────────────────────────────────────────────────────────────

  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardH, setKeyboardH] = useState(0);
  const keyboardOpen = keyboardH > 0;
  const L = useMemo(() => layoutFor(W, H), [W, H]);
  const heroH = keyboardOpen ? Math.round(Math.min(L.heroH, H * 0.22)) : L.heroH;
  const digitsReady = mobile.length === 10;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardH(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardH(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const heroAnim = useMemo(() => new Animated.Value(0), []);
  const formAnim = useMemo(() => new Animated.Value(0), []);
  const btnScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(heroAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [formAnim, heroAnim]);

  const heroStyle = {
    opacity: heroAnim,
    transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
  const formStyle = {
    opacity: formAnim,
    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  const onPressIn = () => {
    if (!canSubmit) return;
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const badgeBottom = Math.round(L.waveH * 0.26 - L.badge / 2);

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { minHeight: H }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Hero: photo + logo + organic wave ── */}
          <Animated.View style={[{ height: heroH }, heroStyle]}>
            <View style={styles.heroClip}>
              <Image source={HERO_PHOTO} style={styles.heroPhoto} resizeMode="cover" />

              <View style={[styles.logoRow, { paddingTop: insets.top + (L.compact ? 4 : 8), paddingHorizontal: L.padX }]}>
                <Image source={LOGO} style={{ width: L.logo, height: L.logo }} resizeMode="contain" />
                <View style={styles.brandCol}>
                  <Text style={[styles.brandName, { fontSize: L.brandSize }]} numberOfLines={1}>
                    Kissan Agrisathi
                  </Text>
                  <Text style={[styles.brandTag, { fontSize: L.tagSize }]} numberOfLines={1}>
                    शेतकऱ्यांचे डिजिटल व्यासपीठ
                  </Text>
                </View>
              </View>

              <View pointerEvents="none" style={[styles.wave, { height: keyboardOpen ? Math.round(L.waveH * 0.72) : L.waveH }]}>
                <Image source={WAVE} style={styles.fill} resizeMode="stretch" />
              </View>

              <View
                pointerEvents="none"
                style={[
                  styles.badge,
                  {
                    width: L.badge,
                    height: L.badge,
                    left: (W - L.badge) / 2,
                    bottom: badgeBottom,
                  },
                ]}
              >
                <Image source={BADGE} style={styles.fill} resizeMode="contain" />
              </View>
            </View>
          </Animated.View>

          {/* ── Form ── */}
          <Animated.View
            style={[
              styles.form,
              formStyle,
              {
                paddingHorizontal: L.padX,
                paddingTop: Math.round(L.badge * 0.42) + (L.compact ? 2 : 6),
                gap: L.gap,
              },
            ]}
          >
            <View style={styles.welcomeRow}>
              <MaterialCommunityIcons name="leaf" size={L.compact ? 14 : 16} color={C.welcomeGreen} />
              <Text style={[styles.welcome, { fontSize: L.welcomeSize }]}>स्वागत आहे!</Text>
              <MaterialCommunityIcons name="leaf" size={L.compact ? 14 : 16} color={C.welcomeGreen} />
            </View>

            <Text style={[styles.heading, { fontSize: L.headingSize, lineHeight: L.headingSize + 6 }]}>
              मोबाईल क्रमांक प्रविष्ट करा
            </Text>

            <Text style={[styles.subtext, { fontSize: L.subSize }]}>
              तुमच्या नंबरवर एक वेळेचा OTP पाठवला जाईल.
            </Text>

            <View
              style={[
                styles.inputWrapper,
                { height: L.inputH },
                !!displayedError && styles.inputWrapperError,
              ]}
            >
              <View style={styles.countryBlock}>
                <IndianFlag width={L.compact ? 18 : 20} height={L.compact ? 12 : 14} />
                <Text style={styles.countryText}>+91</Text>
                <MaterialCommunityIcons name="chevron-down" size={14} color={C.headingBrown} />
              </View>

              <View style={styles.vDivider} />

              <MaterialCommunityIcons
                name="phone-outline"
                size={18}
                color={C.primaryGreen}
                style={styles.phoneIcon}
              />

              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={handleChangeMobile}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="मोबाईल क्रमांक"
                placeholderTextColor={C.bodyGrey}
                autoFocus
                selectionColor={C.primaryGreen}
                underlineColorAndroid="transparent"
                textAlignVertical="center"
              />
            </View>

            {!!displayedError && (
              <HelperText type="error" visible style={styles.helperText}>
                {displayedError}
              </HelperText>
            )}

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                onPress={handleContinue}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={!canSubmit}
                style={[
                  styles.cta,
                  { height: L.ctaH, borderRadius: L.ctaH / 2 },
                  digitsReady ? styles.ctaOn : styles.ctaOff,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : null}
                <Text style={styles.ctaLabel}>
                  {loading ? 'OTP पाठवत आहे...' : 'पुढे'}
                </Text>
                {!loading && (
                  <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
                )}
              </Pressable>
            </Animated.View>

            <View style={styles.securityStrip}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color={C.primaryGreen} />
              <Text style={styles.securityText}>OTP द्वारे सुरक्षित लॉगिन</Text>
            </View>

            <View style={[styles.trustRow, { marginTop: L.compact ? 4 : 8 }]}>
              <TrustColumn
                icon="shield-check"
                iconColor={C.primaryGreen}
                title="सुरक्षित"
                titleColor={C.primaryGreen}
                subtitle="तुमची माहिती सुरक्षित"
                compact={L.compact}
              />
              <View style={styles.trustDivider} />
              <TrustColumn
                icon="lock-outline"
                iconColor={C.trustOrange}
                title="खाजगी"
                titleColor={C.trustOrange}
                subtitle="तुमची माहिती गोपनीय"
                compact={L.compact}
              />
              <View style={styles.trustDivider} />
              <TrustColumn
                icon="account-group-outline"
                iconColor={C.primaryGreen}
                title="विश्वसनीय"
                titleColor={C.primaryGreen}
                subtitle="लाखो शेतकऱ्यांचा विश्वास"
                compact={L.compact}
              />
            </View>
          </Animated.View>

          {/* ── Bottom agricultural landscape fills remaining space ── */}
          <View
            style={[
              styles.landscapeWrap,
              keyboardOpen ? styles.landscapeHidden : { minHeight: L.landscapeMin },
            ]}
          >
            <Image source={LANDSCAPE} style={styles.landscape} resizeMode="cover" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: C.cream },

  heroClip: { flex: 1, overflow: 'hidden', backgroundColor: '#E8D5A3' },
  heroPhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '108%',
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
  brandCol: { flex: 1, justifyContent: 'center' },
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
  badge: {
    position: 'absolute',
    zIndex: 4,
  },

  form: {
    backgroundColor: C.cream,
    zIndex: 2,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  welcome: {
    color: C.welcomeGreen,
    fontWeight: '700',
    textAlign: 'center',
  },
  heading: {
    color: C.headingBrown,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtext: {
    color: C.bodyGrey,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -4,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    paddingHorizontal: 10,
  },
  inputWrapperError: { borderColor: C.error },
  countryBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  countryText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.headingBrown,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: '#C8C4BA',
    marginHorizontal: 8,
  },
  phoneIcon: { marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 16,
    color: C.headingBrown,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  helperText: { paddingLeft: 0, marginTop: -6, fontSize: 12 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaOn: { backgroundColor: C.primaryGreen },
  ctaOff: { backgroundColor: C.primaryGreen, opacity: 0.42 },
  ctaLabel: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  securityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.paleGreen,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  securityText: {
    color: C.primaryGreen,
    fontSize: 13,
    fontWeight: '600',
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  trustCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  trustDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: C.divider,
    marginVertical: 4,
  },
  trustTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  trustSub: {
    color: C.bodyGrey,
    textAlign: 'center',
    lineHeight: 13,
  },

  landscapeWrap: {
    flexGrow: 1,
    flex: 1,
    minHeight: 96,
    overflow: 'hidden',
    backgroundColor: C.cream,
    position: 'relative',
  },
  landscapeHidden: {
    flex: 0,
    flexGrow: 0,
    minHeight: 0,
    height: 0,
  },
  landscape: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});
