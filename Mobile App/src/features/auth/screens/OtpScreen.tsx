import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';

// ---------------------------------------------------------------------------
// Design tokens — matches MobileNumberScreen exactly
// ---------------------------------------------------------------------------
const C = {
  primaryGreen:   '#2E7D32',
  secondaryGreen: '#43A047',
  lightGreen:     '#F0F7EE',
  bgTop:          '#EEF5EB',
  bgBottom:       '#F7FAF6',
  white:          '#FFFFFF',
  text:           '#1B1B1B',
  textSecondary:  '#6B7280',
  inputBorder:    '#B8DDB9',
  inputBg:        '#F4FAF4',
  disabledBg:     '#E0E0E0',
  disabledText:   '#9E9E9E',
  subtitleGreen:  '#388E3C',
  divider:        '#C8E6C9',
} as const;

const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
const { width: SCREEN_W } = Dimensions.get('window');

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

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
    }
    // If the profile is already complete, the root layout's Stack.Protected
    // guard reactively swaps to the App Stack (Home) once `user` refreshes.
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

  // Animations — same pattern as MobileNumberScreen
  const cardAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, []);

  const cardStyle = {
    opacity: cardAnim,
    transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  };

  const onPressIn  = () => { if (!canVerify) return; Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start(); };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Full-screen background — same leaf/hill treatment as MobileNumberScreen ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.bgTop} />
        <View style={styles.bgBottom} />

        <View style={styles.hillWrap}>
          <View style={[styles.hillBack,  { backgroundColor: '#A5D6A7' }]} />
          <View style={[styles.hillMid,   { backgroundColor: '#81C784' }]} />
          <View style={[styles.hillFront, { backgroundColor: '#66BB6A' }]} />
        </View>

        <View style={styles.leafTL}>
          <View style={[styles.leafStem, { backgroundColor: '#4CAF50', opacity: 0.55 }]} />
          <View style={[styles.leafBlade1, { backgroundColor: '#66BB6A', opacity: 0.6 }]} />
          <View style={[styles.leafBlade2, { backgroundColor: '#81C784', opacity: 0.5 }]} />
          <View style={[styles.leafBlade3, { backgroundColor: '#A5D6A7', opacity: 0.45 }]} />
        </View>

        <View style={styles.leafTR}>
          <View style={[styles.leafBladeR1, { backgroundColor: '#4CAF50', opacity: 0.45 }]} />
          <View style={[styles.leafBladeR2, { backgroundColor: '#66BB6A', opacity: 0.38 }]} />
        </View>

        <View style={styles.leafBR}>
          <View style={[styles.leafBRBlade1, { backgroundColor: '#4CAF50', opacity: 0.4 }]} />
          <View style={[styles.leafBRBlade2, { backgroundColor: '#66BB6A', opacity: 0.35 }]} />
        </View>

        <View style={styles.leafBL}>
          <View style={[styles.leafBLBlade1, { backgroundColor: '#4CAF50', opacity: 0.4 }]} />
          <View style={[styles.leafBLBlade2, { backgroundColor: '#66BB6A', opacity: 0.35 }]} />
        </View>

        <View style={styles.leafCornerBL}>
          <View style={[styles.leafCornerBLBlade1, { backgroundColor: '#388E3C', opacity: 0.3 }]} />
          <View style={[styles.leafCornerBLBlade2, { backgroundColor: '#66BB6A', opacity: 0.28 }]} />
          <View style={[styles.leafCornerBLBlade3, { backgroundColor: '#A5D6A7', opacity: 0.25 }]} />
        </View>

        <View style={styles.leafCornerBR}>
          <View style={[styles.leafCornerBRBlade1, { backgroundColor: '#388E3C', opacity: 0.3 }]} />
          <View style={[styles.leafCornerBRBlade2, { backgroundColor: '#66BB6A', opacity: 0.28 }]} />
          <View style={[styles.leafCornerBRBlade3, { backgroundColor: '#A5D6A7', opacity: 0.25 }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card ── */}
          <Animated.View style={[styles.card, cardStyle]}>

            {/* Icon badge */}
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="shield-check-outline" size={28} color={C.primaryGreen} />
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>OTP प्रविष्ट करा</Text>

            {/* Subtitle */}
            <Text style={styles.cardSubtitle}>
              आम्ही तुमच्या मोबाईल क्रमांकावर OTP पाठवला आहे{' '}
              <Text style={styles.cardSubtitleBold}>+91 {mobile}</Text>
            </Text>

            {/* Dev OTP reveal */}
            {!!devOtp && (
              <View style={styles.devPill}>
                <MaterialCommunityIcons name="flask-outline" size={16} color={C.subtitleGreen} />
                <Text style={styles.devPillText}>
                  {'  '}डेव्हलपर OTP: <Text style={styles.devOtpValue}>{devOtp}</Text>
                </Text>
              </View>
            )}

            {/* OTP boxes */}
            <View style={styles.otpBox}>
              <OtpInput value={code} onChange={handleChangeCode} error={!!verifyError} disabled={verifying} />
            </View>

            {/* Errors */}
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

            {/* Verify button */}
            <Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
              <Pressable
                onPress={handleVerify}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={!canVerify}
                style={[styles.btn, canVerify ? styles.btnOn : styles.btnOff]}
              >
                {canVerify && !verifying && (
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={18}
                    color={C.white}
                    style={{ marginRight: S.sm }}
                  />
                )}
                <Text style={[styles.btnLabel, !canVerify && styles.btnLabelOff]}>
                  {verifying ? 'पडताळणी करत आहे...' : 'पडताळणी करा'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Footer row — resend / change number */}
            <View style={styles.footerRow}>
              {seconds > 0 ? (
                <Text style={styles.timerText}>
                  पुन्हा पाठवण्यासाठी {seconds} सेकंद
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  style={styles.linkBtn}
                  hitSlop={8}
                >
                  <Text style={[styles.linkText, resending && styles.linkTextDisabled]}>
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
                <Text style={[styles.linkText, (verifying || resending) && styles.linkTextDisabled]}>
                  क्रमांक बदला
                </Text>
              </Pressable>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const HILL_H = 140;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bgTop },
  flex:     { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', paddingBottom: S.xl },

  // ── Background ────────────────────────────────────────────────────────────
  bgTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: '55%', backgroundColor: C.bgTop },
  bgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: '#F7FAF6' },

  hillWrap:  { position: 'absolute', bottom: '36%', left: 0, right: 0, height: HILL_H, overflow: 'visible' },
  hillBack:  { position: 'absolute', bottom: 0, left: -40,  right: -40, height: HILL_H * 0.75, borderTopLeftRadius: SCREEN_W, borderTopRightRadius: SCREEN_W, opacity: 0.35 },
  hillMid:   { position: 'absolute', bottom: 0, left: -60,  right: -20, height: HILL_H * 0.55, borderTopLeftRadius: SCREEN_W, borderTopRightRadius: SCREEN_W * 0.7, opacity: 0.45 },
  hillFront: { position: 'absolute', bottom: 0, left: -20,  right: -60, height: HILL_H * 0.4,  borderTopLeftRadius: SCREEN_W * 0.7, borderTopRightRadius: SCREEN_W, opacity: 0.55 },

  leafTL: { position: 'absolute', top: -10, left: -10 },
  leafStem: { position: 'absolute', top: 0, left: 30, width: 8, height: 90, borderRadius: 4, transform: [{ rotate: '20deg' }] },
  leafBlade1: { position: 'absolute', top: 5, left: -5, width: 90, height: 55, borderTopRightRadius: 50, borderBottomLeftRadius: 50, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '35deg' }] },
  leafBlade2: { position: 'absolute', top: 40, left: 20, width: 75, height: 48, borderTopRightRadius: 42, borderBottomLeftRadius: 42, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '10deg' }] },
  leafBlade3: { position: 'absolute', top: 70, left: -20, width: 65, height: 42, borderTopRightRadius: 36, borderBottomLeftRadius: 36, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '55deg' }] },

  leafTR: { position: 'absolute', top: -10, right: -10 },
  leafBladeR1: { position: 'absolute', top: 10, right: 5, width: 70, height: 44, borderTopLeftRadius: 38, borderBottomRightRadius: 38, borderTopRightRadius: 6, borderBottomLeftRadius: 6, transform: [{ rotate: '-35deg' }] },
  leafBladeR2: { position: 'absolute', top: 40, right: 20, width: 56, height: 36, borderTopLeftRadius: 30, borderBottomRightRadius: 30, borderTopRightRadius: 6, borderBottomLeftRadius: 6, transform: [{ rotate: '-60deg' }] },

  leafBR: { position: 'absolute', bottom: 80, right: -10 },
  leafBRBlade1: { position: 'absolute', bottom: 0, right: 0, width: 80, height: 50, borderTopLeftRadius: 44, borderBottomRightRadius: 44, borderTopRightRadius: 6, borderBottomLeftRadius: 6, transform: [{ rotate: '-20deg' }] },
  leafBRBlade2: { position: 'absolute', bottom: 30, right: 15, width: 64, height: 40, borderTopLeftRadius: 34, borderBottomRightRadius: 34, borderTopRightRadius: 6, borderBottomLeftRadius: 6, transform: [{ rotate: '-45deg' }] },

  leafBL: { position: 'absolute', bottom: 60, left: -10 },
  leafBLBlade1: { position: 'absolute', bottom: 0, left: 0, width: 78, height: 48, borderTopRightRadius: 42, borderBottomLeftRadius: 42, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '25deg' }] },
  leafBLBlade2: { position: 'absolute', bottom: 26, left: 18, width: 60, height: 38, borderTopRightRadius: 32, borderBottomLeftRadius: 32, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '50deg' }] },

  leafCornerBL: { position: 'absolute', bottom: -30, left: -30 },
  leafCornerBLBlade1: { position: 'absolute', bottom: 0, left: 0, width: 130, height: 80, borderTopRightRadius: 70, borderBottomLeftRadius: 70, borderTopLeftRadius: 10, borderBottomRightRadius: 10, transform: [{ rotate: '15deg' }] },
  leafCornerBLBlade2: { position: 'absolute', bottom: 20, left: 40, width: 100, height: 62, borderTopRightRadius: 54, borderBottomLeftRadius: 54, borderTopLeftRadius: 8, borderBottomRightRadius: 8, transform: [{ rotate: '40deg' }] },
  leafCornerBLBlade3: { position: 'absolute', bottom: 55, left: -10, width: 76, height: 48, borderTopRightRadius: 42, borderBottomLeftRadius: 42, borderTopLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ rotate: '-10deg' }] },

  leafCornerBR: { position: 'absolute', bottom: -30, right: -30 },
  leafCornerBRBlade1: { position: 'absolute', bottom: 0, right: 0, width: 130, height: 80, borderTopLeftRadius: 70, borderBottomRightRadius: 70, borderTopRightRadius: 10, borderBottomLeftRadius: 10, transform: [{ rotate: '-15deg' }] },
  leafCornerBRBlade2: { position: 'absolute', bottom: 20, right: 40, width: 100, height: 62, borderTopLeftRadius: 54, borderBottomRightRadius: 54, borderTopRightRadius: 8, borderBottomLeftRadius: 8, transform: [{ rotate: '-40deg' }] },
  leafCornerBRBlade3: { position: 'absolute', bottom: 55, right: -10, width: 76, height: 48, borderTopLeftRadius: 42, borderBottomRightRadius: 42, borderTopRightRadius: 6, borderBottomLeftRadius: 6, transform: [{ rotate: '10deg' }] },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: S.md,
    backgroundColor: C.white,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: S.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    marginTop: S.xs + 2,
    marginBottom: S.lg,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardSubtitleBold: {
    color: C.text,
    fontWeight: '700',
    fontSize: 14,
  },

  // Dev OTP pill
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: C.lightGreen,
    borderRadius: 20,
    paddingHorizontal: S.md,
    paddingVertical: S.xs + 2,
    marginBottom: S.lg,
  },
  devPillText: {
    fontSize: 13,
    color: C.subtitleGreen,
    fontWeight: '500',
  },
  devOtpValue: {
    fontWeight: '800',
    color: C.primaryGreen,
  },

  otpBox: { marginBottom: S.xs },
  helperArea: { minHeight: S.lg + S.xs, alignItems: 'center' },
  helperText: { textAlign: 'center' },

  // ── Button ────────────────────────────────────────────────────────────────
  btnWrapper: { marginTop: S.sm },
  btn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  btnOn: {
    backgroundColor: C.primaryGreen,
    shadowColor: C.primaryGreen,
    shadowOpacity: 0.4,
    elevation: 5,
  },
  btnOff: {
    backgroundColor: C.disabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  btnLabelOff: { color: C.disabledText },

  // ── Footer links ──────────────────────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: S.lg,
  },
  timerText: {
    fontSize: 14,
    color: C.textSecondary,
  },
  linkBtn: {
    paddingVertical: S.xs,
    paddingHorizontal: S.xs,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primaryGreen,
  },
  linkTextDisabled: {
    color: C.disabledText,
  },
});