import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';

const HERO_PHOTO = require('../../../../assets/branding/otp-hero.webp');
const LOGO = require('../../../../assets/branding/logo-circle.png');
const WAVE = require('../../../../assets/branding/login-wave.png');
const LANDSCAPE = require('../../../../assets/branding/login-landscape.webp');

const C = {
  cream: '#FDF9F3',
  primaryGreen: '#006A2C',
  welcomeGreen: '#1B6B32',
  headingBrown: '#4A3728',
  brandGreen: '#0D5C2E',
  tagline: '#5C5348',
  bodyGrey: '#7A746C',
  paleGreen: '#E8F5EC',
  trustOrange: '#E09112',
  divider: '#E4E0D6',
  white: '#FFFFFF',
  card: '#FFFCF7',
} as const;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

type Layout = {
  compact: boolean;
  heroH: number;
  waveH: number;
  badge: number;
  logo: number;
  padX: number;
  ctaH: number;
  gap: number;
  landscapeMin: number;
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

  const heroRatio = compact ? 0.24 : cozy ? 0.28 : 0.30;
  const heroH = Math.round(height * heroRatio);
  const waveH = Math.round(Math.max(compact ? 64 : 76, Math.min(heroH * 0.42, width * 0.26)));

  return {
    compact,
    heroH,
    waveH,
    badge: hs(compact ? 44 : 50),
    logo: hs(compact ? 42 : 50),
    padX: hs(20),
    ctaH: compact ? 48 : 54,
    gap: compact ? vs(8) : cozy ? vs(10) : vs(12),
    landscapeMin: compact ? vs(80) : vs(120),
    headingSize: compact ? 18 : 22,
    subSize: compact ? 12 : 14,
    brandSize: compact ? 14 : 16,
    tagSize: compact ? 9 : 11,
  };
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

export default function OtpScreen() {
  // ── Business logic — UNTOUCHED ──────────────────────────────────────────
  const params = useLocalSearchParams<{ mobile: string; devOtp?: string }>();
  const mobile = params.mobile ?? '';

  const { login } = useAuth();
  const { loading: verifying, error: verifyError, verifyOtp, clearError: clearVerifyError } = useVerifyOtp();
  const { loading: resending, error: resendError, sendOtp, clearError: clearResendError } = useSendOtp();

  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(params.devOtp);
  const { seconds, restart } = useCountdown(RESEND_COOLDOWN_SECONDS);

  const handleChangeCode = (value: string): void => {
    setCode(value);
    if (verifyError) clearVerifyError();
  };

  const handleVerify = async (): Promise<void> => {
    if (code.length !== OTP_LENGTH) return;

    const result = await verifyOtp(mobile, code);
    if (!result) return;

    await login(result.token);

    if (!result.isProfileCompleted) {
      router.replace('/complete-profile');
      return;
    }

    if (result.subscription?.isActive !== true) {
      router.replace('/(auth)/subscription' as Href);
      return;
    }
    // Active subscription → root Stack.Protected swaps to App Stack (Home).
  };

  const handleResend = async (): Promise<void> => {
    if (seconds > 0 || resending) return;
    setCode('');
    clearResendError();
    const result = await sendOtp(mobile);
    if (result) {
      setDevOtp(result.otp);
      restart();
    }
  };

  const canVerify = code.length === OTP_LENGTH && !verifying;
  // ────────────────────────────────────────────────────────────────────────

  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardH, setKeyboardH] = useState(0);
  const keyboardOpen = keyboardH > 0;
  const L = useMemo(() => layoutFor(W, H), [W, H]);
  const digitsReady = code.length === OTP_LENGTH;

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
  const cardAnim = useMemo(() => new Animated.Value(0), []);
  const btnScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(heroAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [cardAnim, heroAnim]);

  const heroStyle = {
    opacity: heroAnim,
    transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
  const cardStyle = {
    opacity: cardAnim,
    transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  const onPressIn = () => {
    if (!canVerify) return;
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const heroH = L.heroH;
  const waveH = L.waveH;
  const badgeBottom = Math.round(waveH * 0.26 - L.badge / 2);

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
          <Animated.View style={[{ height: heroH }, heroStyle]}>
            <View style={styles.heroClip}>
              <Image source={HERO_PHOTO} style={styles.heroPhoto} resizeMode="cover" />

              <View
                style={[
                  styles.logoRow,
                  { paddingTop: insets.top + (L.compact ? 4 : 8), paddingHorizontal: L.padX },
                ]}
              >
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

              <View pointerEvents="none" style={[styles.wave, { height: waveH }]}>
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
                    borderRadius: L.badge / 2,
                  },
                ]}
              >
                <MaterialCommunityIcons name="shield-check" size={L.compact ? 22 : 26} color={C.white} />
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              cardStyle,
              {
                paddingHorizontal: L.padX,
                paddingTop: Math.round(L.badge * 0.38) + (L.compact ? 2 : 4),
                gap: L.gap,
              },
            ]}
          >
            <View style={styles.card}>
              <Text style={[styles.heading, { fontSize: L.headingSize, lineHeight: L.headingSize + 6 }]}>
                OTP प्रविष्ट करा
              </Text>

              <Text style={[styles.subtext, { fontSize: L.subSize }]}>
                आम्ही तुमच्या मोबाईल क्रमांकावर OTP पाठवला आहे
              </Text>

              <Text style={styles.phoneText}>+91 {mobile}</Text>

              {!!devOtp && (
                <View style={styles.devPill}>
                  <MaterialCommunityIcons name="flask-outline" size={15} color={C.welcomeGreen} />
                  <Text style={styles.devPillText}>
                    डेव्हलपर OTP: <Text style={styles.devOtpValue}>{devOtp}</Text>
                  </Text>
                </View>
              )}

              <View style={styles.otpBox}>
                <OtpInput
                  value={code}
                  onChange={handleChangeCode}
                  error={!!verifyError}
                  disabled={verifying}
                  contentInset={L.padX * 2 + 32}
                />
              </View>

              {(!!verifyError || !!resendError) && (
                <View style={styles.helperArea}>
                  {!!verifyError && (
                    <HelperText type="error" visible style={styles.helperText}>
                      {verifyError}
                    </HelperText>
                  )}
                  {!!resendError && (
                    <HelperText type="error" visible style={styles.helperText}>
                      {resendError}
                    </HelperText>
                  )}
                </View>
              )}

              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <Pressable
                  onPress={handleVerify}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={!canVerify}
                  style={[
                    styles.cta,
                    { height: L.ctaH, borderRadius: L.ctaH / 2 },
                    digitsReady ? styles.ctaOn : styles.ctaOff,
                  ]}
                >
                  {verifying ? <ActivityIndicator color={C.white} size="small" /> : null}
                  <Text style={styles.ctaLabel}>
                    {verifying ? 'पडताळणी करत आहे...' : 'पडताळणी करा'}
                  </Text>
                  {!verifying && (
                    <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
                  )}
                </Pressable>
              </Animated.View>

              <View style={styles.footerRow}>
                {seconds > 0 ? (
                  <View style={styles.timerRow}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={C.bodyGrey} />
                    <Text style={styles.timerText}>पुन्हा पाठवण्यासाठी {seconds} सेकंद</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleResend}
                    disabled={resending}
                    style={styles.linkBtn}
                    hitSlop={8}
                  >
                    <Text style={[styles.resendActive, resending && styles.linkTextDisabled]}>
                      OTP पुन्हा पाठवा
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => router.back()}
                  disabled={verifying || resending}
                  style={styles.linkBtn}
                  hitSlop={8}
                >
                  <Text style={[styles.changeLink, (verifying || resending) && styles.linkTextDisabled]}>
                    क्रमांक बदला
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.trustRow, { marginTop: L.compact ? 2 : 6 }]}>
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
                title="खासगी"
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
    backgroundColor: C.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    backgroundColor: C.cream,
    zIndex: 2,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 10,
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
    lineHeight: 20,
    marginTop: -4,
  },
  phoneText: {
    color: C.brandGreen,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    marginTop: -4,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: C.paleGreen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  devPillText: {
    fontSize: 13,
    color: C.welcomeGreen,
    fontWeight: '500',
  },
  devOtpValue: {
    fontWeight: '800',
    color: C.primaryGreen,
  },
  otpBox: { marginTop: 2 },
  helperArea: { alignItems: 'center', marginTop: -6 },
  helperText: { textAlign: 'center', paddingHorizontal: 0 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaOn: { backgroundColor: C.primaryGreen },
  ctaOff: { backgroundColor: C.primaryGreen, opacity: 0.42 },
  ctaLabel: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    paddingRight: 8,
  },
  timerText: {
    fontSize: 12,
    color: C.bodyGrey,
    flexShrink: 1,
  },
  linkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  resendActive: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primaryGreen,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primaryGreen,
  },
  linkTextDisabled: {
    color: '#A8A49C',
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
    minHeight: 80,
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
