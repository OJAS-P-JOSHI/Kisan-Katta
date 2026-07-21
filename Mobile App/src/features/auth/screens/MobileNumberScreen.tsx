import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';

import { useSendOtp } from '../hooks/useSendOtp';

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
const HERO_SOURCE = require('../../../../assets/branding/login-hero.png');

// Background leaf images — same asset reused at different sizes/opacities
// to simulate the realistic leaf corners seen in the design.
// If you have a dedicated leaf asset, swap it in here.
const LEAF_SOURCE = require('../../../../assets/branding/login-hero.png');

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  primaryGreen:   '#2E7D32',
  secondaryGreen: '#43A047',
  lightGreen:     '#F0F7EE',
  bgTop:          '#EEF5EB',   // creamy light green for top half
  bgBottom:       '#F7FAF6',
  white:          '#FFFFFF',
  text:           '#1B1B1B',
  textSecondary:  '#6B7280',
  inputBorder:    '#B8DDB9',
  inputBg:        '#F4FAF4',
  cardShadow:     '#00000014',
  disabledBg:     '#E0E0E0',
  disabledText:   '#9E9E9E',
  subtitleGreen:  '#388E3C',
  divider:        '#C8E6C9',
} as const;

const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
const { width: SCREEN_W } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Validation — UNTOUCHED
// ---------------------------------------------------------------------------
const MOBILE_REGEX = /^\d{10}$/;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
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

  // Animations
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 460, useNativeDriver: true }),
    ]).start();
  }, []);

  const heroStyle = {
    opacity: heroAnim,
    transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };
  const cardStyle = {
    opacity: cardAnim,
    transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };

  const onPressIn  = () => { if (!canSubmit) return; Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start(); };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Full-screen background ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>

        {/* Top creamy-green zone */}
        <View style={styles.bgTop} />

        {/* Bottom white zone */}
        <View style={styles.bgBottom} />

        {/* Landscape hill wave — pure View curves */}
        <View style={styles.hillWrap}>
          <View style={[styles.hillBack,  { backgroundColor: '#A5D6A7' }]} />
          <View style={[styles.hillMid,   { backgroundColor: '#81C784' }]} />
          <View style={[styles.hillFront, { backgroundColor: '#66BB6A' }]} />
        </View>

        {/* Top-left leaf cluster */}
        <View style={styles.leafTL}>
          <View style={[styles.leafStem, { backgroundColor: '#4CAF50', opacity: 0.55 }]} />
          <View style={[styles.leafBlade1, { backgroundColor: '#66BB6A', opacity: 0.6 }]} />
          <View style={[styles.leafBlade2, { backgroundColor: '#81C784', opacity: 0.5 }]} />
          <View style={[styles.leafBlade3, { backgroundColor: '#A5D6A7', opacity: 0.45 }]} />
        </View>

        {/* Top-right small leaf */}
        <View style={styles.leafTR}>
          <View style={[styles.leafBladeR1, { backgroundColor: '#4CAF50', opacity: 0.45 }]} />
          <View style={[styles.leafBladeR2, { backgroundColor: '#66BB6A', opacity: 0.38 }]} />
        </View>

        {/* Bottom-right leaf cluster (mid, near hills) */}
        <View style={styles.leafBR}>
          <View style={[styles.leafBRBlade1, { backgroundColor: '#4CAF50', opacity: 0.4 }]} />
          <View style={[styles.leafBRBlade2, { backgroundColor: '#66BB6A', opacity: 0.35 }]} />
        </View>

        {/* Bottom-left leaf cluster (mid, mirrors bottom-right) */}
        <View style={styles.leafBL}>
          <View style={[styles.leafBLBlade1, { backgroundColor: '#4CAF50', opacity: 0.4 }]} />
          <View style={[styles.leafBLBlade2, { backgroundColor: '#66BB6A', opacity: 0.35 }]} />
        </View>

        {/* Very bottom-left corner cluster */}
        <View style={styles.leafCornerBL}>
          <View style={[styles.leafCornerBLBlade1, { backgroundColor: '#388E3C', opacity: 0.3 }]} />
          <View style={[styles.leafCornerBLBlade2, { backgroundColor: '#66BB6A', opacity: 0.28 }]} />
          <View style={[styles.leafCornerBLBlade3, { backgroundColor: '#A5D6A7', opacity: 0.25 }]} />
        </View>

        {/* Very bottom-right corner cluster */}
        <View style={styles.leafCornerBR}>
          <View style={[styles.leafCornerBRBlade1, { backgroundColor: '#388E3C', opacity: 0.3 }]} />
          <View style={[styles.leafCornerBRBlade2, { backgroundColor: '#66BB6A', opacity: 0.28 }]} />
          <View style={[styles.leafCornerBRBlade3, { backgroundColor: '#A5D6A7', opacity: 0.25 }]} />
        </View>

        {/* Small floating leaf accents along the lower edges */}
        <View style={[styles.leafFloatSmall1, { backgroundColor: '#66BB6A', opacity: 0.3 }]} />
        <View style={[styles.leafFloatSmall2, { backgroundColor: '#81C784', opacity: 0.28 }]} />

        {/* Dot pattern accent (right side) */}
        {[0,1,2,3,4].map(row =>
          [0,1,2].map(col => (
            <View
              key={`${row}-${col}`}
              style={[styles.dot, {
                top:  '28%' as any + row * 12,
                right: 16 + col * 12,
                opacity: 0.18,
              }]}
            />
          ))
        )}
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
          {/* ── Hero ── */}
          <Animated.View style={[styles.heroSection, heroStyle]}>
            <Image source={HERO_SOURCE} style={styles.heroImage} resizeMode="contain" />
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[styles.card, cardStyle]}>

            {/* Title row */}
            <Text style={styles.cardTitle}>मोबाईल क्रमांक प्रविष्ट करा</Text>

            {/* Subtitle with shield */}
            <View style={styles.subtitleRow}>
              <MaterialCommunityIcons name="shield-check" size={16} color={C.primaryGreen} />
              <Text style={styles.cardSubtitle}> OTP द्वारे सुरक्षित लॉगिन करा</Text>
            </View>

            {/* Spacer */}
            <View style={styles.inputGap} />

            {/* Phone input */}
            <View style={[styles.inputWrapper, !!displayedError && styles.inputWrapperError]}>

              {/* Country code pill */}
              <View style={styles.countryPill}>
                <MaterialCommunityIcons name="phone" size={14} color={C.primaryGreen} />
                <Text style={styles.countryText}> +91</Text>
                <MaterialCommunityIcons name="chevron-down" size={14} color={C.primaryGreen} style={{ marginLeft: 2 }} />
              </View>

              {/* Vertical divider */}
              <View style={styles.divider} />

              {/* Number field */}
              <TextInput
                mode="flat"
                style={styles.input}
                underlineStyle={styles.inputUnderline}
                value={mobile}
                onChangeText={handleChangeMobile}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="मोबाईल क्रमांक"
                placeholderTextColor={C.textSecondary}
                error={!!displayedError}
                autoFocus
                dense
              />

              {/* Trailing phone icon */}
              <MaterialCommunityIcons
                name="phone-outline"
                size={18}
                color={C.primaryGreen}
                style={styles.trailingIcon}
              />
            </View>

            {!!displayedError && (
              <HelperText type="error" visible style={styles.helperText}>
                {displayedError}
              </HelperText>
            )}

            {/* Button */}
            <Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
              <Pressable
                onPress={handleContinue}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={!canSubmit}
                style={[styles.btn, canSubmit ? styles.btnOn : styles.btnOff]}
              >
                {canSubmit && (
                  <MaterialCommunityIcons
                    name="lock"
                    size={18}
                    color={C.white}
                    style={{ marginRight: S.sm }}
                  />
                )}
                <Text style={[styles.btnLabel, !canSubmit && styles.btnLabelOff]}>
                  {loading ? 'OTP पाठवत आहे...' : 'पुढे जा'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <View style={styles.footerLine} />
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={C.textSecondary} />
              <Text style={styles.footerText}>  OTP द्वारे सुरक्षित लॉगिन</Text>
              <View style={styles.footerLine} />
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
  scroll:   { flexGrow: 1, paddingBottom: S.xl },

  // ── Background ────────────────────────────────────────────────────────────
  bgTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: '55%', backgroundColor: C.bgTop },
  bgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: '#F7FAF6' },

  // Landscape hills
  hillWrap:  { position: 'absolute', bottom: '36%', left: 0, right: 0, height: HILL_H, overflow: 'visible' },
  hillBack:  { position: 'absolute', bottom: 0, left: -40,  right: -40, height: HILL_H * 0.75, borderTopLeftRadius: SCREEN_W, borderTopRightRadius: SCREEN_W, opacity: 0.35 },
  hillMid:   { position: 'absolute', bottom: 0, left: -60,  right: -20, height: HILL_H * 0.55, borderTopLeftRadius: SCREEN_W, borderTopRightRadius: SCREEN_W * 0.7, opacity: 0.45 },
  hillFront: { position: 'absolute', bottom: 0, left: -20,  right: -60, height: HILL_H * 0.4,  borderTopLeftRadius: SCREEN_W * 0.7, borderTopRightRadius: SCREEN_W, opacity: 0.55 },

  // Top-left leaf cluster (stem + 3 blades)
  leafTL: { position: 'absolute', top: -10, left: -10 },
  leafStem: {
    position: 'absolute', top: 0, left: 30, width: 8, height: 90,
    borderRadius: 4, transform: [{ rotate: '20deg' }],
  },
  leafBlade1: {
    position: 'absolute', top: 5, left: -5, width: 90, height: 55,
    borderTopRightRadius: 50, borderBottomLeftRadius: 50,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '35deg' }],
  },
  leafBlade2: {
    position: 'absolute', top: 40, left: 20, width: 75, height: 48,
    borderTopRightRadius: 42, borderBottomLeftRadius: 42,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '10deg' }],
  },
  leafBlade3: {
    position: 'absolute', top: 70, left: -20, width: 65, height: 42,
    borderTopRightRadius: 36, borderBottomLeftRadius: 36,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '55deg' }],
  },

  // Top-right small leaf
  leafTR: { position: 'absolute', top: -10, right: -10 },
  leafBladeR1: {
    position: 'absolute', top: 10, right: 5, width: 70, height: 44,
    borderTopLeftRadius: 38, borderBottomRightRadius: 38,
    borderTopRightRadius: 6, borderBottomLeftRadius: 6,
    transform: [{ rotate: '-35deg' }],
  },
  leafBladeR2: {
    position: 'absolute', top: 40, right: 20, width: 56, height: 36,
    borderTopLeftRadius: 30, borderBottomRightRadius: 30,
    borderTopRightRadius: 6, borderBottomLeftRadius: 6,
    transform: [{ rotate: '-60deg' }],
  },

  // Bottom-right leaf
  leafBR: { position: 'absolute', bottom: 80, right: -10 },
  leafBRBlade1: {
    position: 'absolute', bottom: 0, right: 0, width: 80, height: 50,
    borderTopLeftRadius: 44, borderBottomRightRadius: 44,
    borderTopRightRadius: 6, borderBottomLeftRadius: 6,
    transform: [{ rotate: '-20deg' }],
  },
  leafBRBlade2: {
    position: 'absolute', bottom: 30, right: 15, width: 64, height: 40,
    borderTopLeftRadius: 34, borderBottomRightRadius: 34,
    borderTopRightRadius: 6, borderBottomLeftRadius: 6,
    transform: [{ rotate: '-45deg' }],
  },

  // Bottom-left leaf (mirrors bottom-right, mid-height)
  leafBL: { position: 'absolute', bottom: 60, left: -10 },
  leafBLBlade1: {
    position: 'absolute', bottom: 0, left: 0, width: 78, height: 48,
    borderTopRightRadius: 42, borderBottomLeftRadius: 42,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '25deg' }],
  },
  leafBLBlade2: {
    position: 'absolute', bottom: 26, left: 18, width: 60, height: 38,
    borderTopRightRadius: 32, borderBottomLeftRadius: 32,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '50deg' }],
  },

  // Very bottom-left corner cluster (largest, screen-edge)
  leafCornerBL: { position: 'absolute', bottom: -30, left: -30 },
  leafCornerBLBlade1: {
    position: 'absolute', bottom: 0, left: 0, width: 130, height: 80,
    borderTopRightRadius: 70, borderBottomLeftRadius: 70,
    borderTopLeftRadius: 10, borderBottomRightRadius: 10,
    transform: [{ rotate: '15deg' }],
  },
  leafCornerBLBlade2: {
    position: 'absolute', bottom: 20, left: 40, width: 100, height: 62,
    borderTopRightRadius: 54, borderBottomLeftRadius: 54,
    borderTopLeftRadius: 8, borderBottomRightRadius: 8,
    transform: [{ rotate: '40deg' }],
  },
  leafCornerBLBlade3: {
    position: 'absolute', bottom: 55, left: -10, width: 76, height: 48,
    borderTopRightRadius: 42, borderBottomLeftRadius: 42,
    borderTopLeftRadius: 6, borderBottomRightRadius: 6,
    transform: [{ rotate: '-10deg' }],
  },

  // Very bottom-right corner cluster (largest, screen-edge)
  leafCornerBR: { position: 'absolute', bottom: -30, right: -30 },
  leafCornerBRBlade1: {
    position: 'absolute', bottom: 0, right: 0, width: 130, height: 80,
    borderTopLeftRadius: 70, borderBottomRightRadius: 70,
    borderTopRightRadius: 10, borderBottomLeftRadius: 10,
    transform: [{ rotate: '-15deg' }],
  },
  leafCornerBRBlade2: {
    position: 'absolute', bottom: 20, right: 40, width: 100, height: 62,
    borderTopLeftRadius: 54, borderBottomRightRadius: 54,
    borderTopRightRadius: 8, borderBottomLeftRadius: 8,
    transform: [{ rotate: '-40deg' }],
  },
  leafCornerBRBlade3: {
    position: 'absolute', bottom: 55, right: -10, width: 76, height: 48,
    borderTopLeftRadius: 42, borderBottomRightRadius: 42,
    borderTopRightRadius: 6, borderBottomLeftRadius: 6,
    transform: [{ rotate: '10deg' }],
  },

  // Small floating leaf accents near lower edges (subtle fill-in detail)
  leafFloatSmall1: {
    position: 'absolute', bottom: 200, left: 6, width: 34, height: 20,
    borderTopRightRadius: 18, borderBottomLeftRadius: 18,
    borderTopLeftRadius: 4, borderBottomRightRadius: 4,
    transform: [{ rotate: '30deg' }],
  },
  leafFloatSmall2: {
    position: 'absolute', bottom: 240, right: 10, width: 30, height: 18,
    borderTopLeftRadius: 16, borderBottomRightRadius: 16,
    borderTopRightRadius: 4, borderBottomLeftRadius: 4,
    transform: [{ rotate: '-30deg' }],
  },

  // Dot pattern
  dot: {
    position: 'absolute',
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.primaryGreen,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    paddingTop: S.xl + S.md,
    paddingBottom: S.lg,
  },
  heroImage: {
    width: 450,
    height: 450,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: S.md,
    marginTop: S.sm,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: S.xs + 2,
    marginBottom: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    color: C.subtitleGreen,
    fontWeight: '500',
  },
  inputGap: { height: S.lg },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    paddingHorizontal: S.sm,
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: '#E53935',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: S.xs,
    shadowColor: C.primaryGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primaryGreen,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: C.divider,
    marginHorizontal: S.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    color: C.text,
    paddingLeft: 0,
  },
  inputUnderline: { display: 'none' },
  trailingIcon: { marginLeft: S.xs, marginRight: S.xs },
  helperText:   { paddingLeft: 0, fontSize: 12 },

  // ── Button ────────────────────────────────────────────────────────────────
  btnWrapper: { marginTop: S.lg },
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

  // ── Footer ────────────────────────────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S.md + S.xs,
    gap: 6,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: C.textSecondary,
  },
});