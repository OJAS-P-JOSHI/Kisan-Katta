import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

// ---------------------------------------------------------------------------
// Design tokens — matches brief palette exactly
// ---------------------------------------------------------------------------
const C = {
  primaryGreen: '#2E7D32',
  secondaryGreen: '#43A047',
  lightGreen: '#F3F8F2',
  accent: '#8BC34A',
  text: '#1E1E1E',
  textSecondary: '#666666',
  border: '#E5E7EB',
  background: '#FAFBF8',
  white: '#FFFFFF',
  disabledBg: '#E8E8E8',
  disabledText: '#AAAAAA',
  inputBorder: '#C8E6C9',
} as const;

// 8dp spacing grid
const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const MOBILE_REGEX = /^\d{10}$/;

// ---------------------------------------------------------------------------
// Organic leaf shape component (SVG-free, pure View)
// ---------------------------------------------------------------------------
function LeafShape({
  style,
  color = C.primaryGreen,
  opacity = 0.06,
}: {
  style: object;
  color?: string;
  opacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.leaf,
        style,
        { backgroundColor: color, opacity },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function MobileNumberScreen() {
  // Business logic — UNTOUCHED
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

  // -------------------------------------------------------------------------
  // Animations — built-in Animated API, no new dependencies
  // -------------------------------------------------------------------------
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(24)).current;
  const cardTranslate = useRef(new Animated.Value(48)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.spring(heroTranslate, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslate, {
          toValue: 0,
          tension: 55,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const onPressIn = () => {
    if (!canSubmit) return;
    Animated.spring(buttonScale, {
      toValue: 0.97,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Background — organic leaf shapes, 5–8% opacity */}
      <View pointerEvents="none" style={styles.bgLayer}>
        {/* Top-left large leaf */}
        <LeafShape
          style={styles.leafTopLeft}
          color={C.primaryGreen}
          opacity={0.06}
        />
        {/* Top-right accent leaf */}
        <LeafShape
          style={styles.leafTopRight}
          color={C.accent}
          opacity={0.07}
        />
        {/* Bottom-left curve */}
        <LeafShape
          style={styles.leafBottomLeft}
          color={C.secondaryGreen}
          opacity={0.05}
        />
        {/* Bottom-right large */}
        <LeafShape
          style={styles.leafBottomRight}
          color={C.primaryGreen}
          opacity={0.06}
        />
        {/* Midfield ambient blob */}
        <View
          style={[styles.midBlob, { backgroundColor: C.accent, opacity: 0.04 }]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ================================================================
              HERO SECTION
          ================================================================ */}
          <Animated.View
            style={[
              styles.heroSection,
              { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] },
            ]}
          >
            <Image
              source={HERO_SOURCE}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* ================================================================
              LOGIN CARD
          ================================================================ */}
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
            ]}
          >
            {/* Card title */}
            <Text style={styles.cardTitle}>मोबाईल क्रमांक प्रविष्ट करा</Text>
            <Text style={styles.cardSubtitle}>OTP द्वारे सुरक्षित लॉगिन करा</Text>

            {/* Phone input */}
            <View style={styles.inputWrapper}>
              {/* +91 capsule */}
              <View style={styles.countryCode}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={15}
                  color={C.primaryGreen}
                  style={styles.phoneIcon}
                />
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              {/* Divider */}
              <View style={styles.inputDivider} />

              {/* Raw TextInput — keeps all existing validation/logic */}
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
            </View>

            {!!displayedError && (
              <HelperText type="error" visible style={styles.helperText}>
                {displayedError}
              </HelperText>
            )}

            {/* Button */}
            <Animated.View style={[styles.btnWrapper, { transform: [{ scale: buttonScale }] }]}>
              <Pressable
                onPress={handleContinue}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={!canSubmit}
                style={[
                  styles.btn,
                  canSubmit ? styles.btnEnabled : styles.btnDisabled,
                ]}
              >
                {loading ? (
                  <Text style={styles.btnLabel}>OTP पाठवत आहे...</Text>
                ) : (
                  <Text style={[styles.btnLabel, !canSubmit && styles.btnLabelDisabled]}>
                    पुढे जा
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <MaterialCommunityIcons name="lock-outline" size={13} color={C.textSecondary} />
              <Text style={styles.footerText}>  OTP द्वारे सुरक्षित लॉगिन</Text>
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
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: S.xl,
  },

  // Background leaf shapes
  bgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  leaf: {
    position: 'absolute',
  },
  leafTopLeft: {
    width: 240,
    height: 240,
    top: -80,
    left: -80,
    borderTopLeftRadius: 120,
    borderBottomRightRadius: 120,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    transform: [{ rotate: '-15deg' }],
  },
  leafTopRight: {
    width: 180,
    height: 180,
    top: -60,
    right: -60,
    borderTopLeftRadius: 90,
    borderBottomRightRadius: 90,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    transform: [{ rotate: '30deg' }],
  },
  leafBottomLeft: {
    width: 260,
    height: 260,
    bottom: -100,
    left: -100,
    borderTopLeftRadius: 130,
    borderBottomRightRadius: 130,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    transform: [{ rotate: '20deg' }],
  },
  leafBottomRight: {
    width: 320,
    height: 320,
    bottom: -140,
    right: -120,
    borderTopLeftRadius: 160,
    borderBottomRightRadius: 160,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    transform: [{ rotate: '-25deg' }],
  },
  midBlob: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: '38%',
    right: -60,
    borderRadius: 100,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: S.xl,
    paddingBottom: S.xl,      // more space below logo before the card
    paddingHorizontal: S.lg,
  },
  heroImage: {
    width: 260,               // ← LINE 403: change width here
    height: 260,              // ← LINE 404: change height here
  },
  // Card
  card: {
    marginHorizontal: S.md,
    marginTop: S.md,          // positive gap instead of overlap
    backgroundColor: C.white,
    borderRadius: 28,
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: S.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: S.xs,
    marginBottom: S.lg,
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '400',
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.lightGreen,
    paddingLeft: S.md,
    paddingRight: S.sm,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: S.sm + S.xs,
    paddingVertical: S.xs + 2,
    marginRight: S.sm,
    shadowColor: C.primaryGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  phoneIcon: { marginRight: S.xs },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primaryGreen,
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.inputBorder,
    marginRight: S.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    color: C.text,
    paddingLeft: 0,
  },
  inputUnderline: { display: 'none' },
  helperText: { marginLeft: 0, paddingLeft: 0, fontSize: 13 },

  // Button
  btnWrapper: {
    marginTop: S.lg,
  },
  btn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  btnEnabled: {
    backgroundColor: C.primaryGreen,
    shadowColor: C.primaryGreen,
    shadowOpacity: 0.35,
  },
  btnDisabled: {
    backgroundColor: C.disabledBg,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  btnLabelDisabled: {
    color: C.disabledText,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S.md,
  },
  footerText: {
    fontSize: 13,
    color: C.textSecondary,
  },
});