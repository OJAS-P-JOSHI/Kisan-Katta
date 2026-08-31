import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { iconSize, useAppTheme } from '@/theme';

import { ProfilePhotoSection } from '../components/ProfilePhotoSection';
import { useMyProfile } from '../hooks/useMyProfile';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';
import { useSaveProfile } from '../hooks/useSaveProfile';

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
  welcomeGrey: '#4A4540',
  paleGreen: '#E8F5EC',
  stepGreen: '#1B5E20',
  white: '#FFFFFF',
} as const;

type Layout = {
  compact: boolean;
  short: boolean;
  headerBand: number;
  waveH: number;
  logo: number;
  padX: number;
  avatar: number;
  brandSize: number;
  tagSize: number;
  welcomeSize: number;
  headingSize: number;
  subSize: number;
  landscapeMin: number;
  landscapeMax: number;
  cardPadTop: number;
  cardOverlap: number;
};

function clampFont(fontScale: number): number {
  return Math.min(Math.max(fontScale, 1), 1.5);
}

function layoutFor(width: number, height: number, fontScale: number): Layout {
  const compact = height < 700;
  const short = height < 640;
  const narrow = width < 360;
  const h = Math.min(Math.max(width / 390, 0.82), 1.08);
  const hs = (n: number) => Math.round(n * h);
  const fs = clampFont(fontScale);
  const fontExtra = Math.round(Math.max(0, fs - 1) * 32);
  const waveH = short ? 24 : compact ? 28 : 34;

  return {
    compact,
    short,
    headerBand: (short ? 72 : compact ? 78 : 92) + fontExtra,
    waveH,
    logo: hs(narrow ? 38 : compact ? 42 : 46),
    padX: Math.max(16, Math.min(22, hs(20))),
    avatar: short ? 80 : compact ? 86 : 96,
    brandSize: narrow ? 14 : compact ? 15 : 16,
    tagSize: narrow ? 10 : 11,
    welcomeSize: compact ? 14 : 15,
    headingSize: compact ? 20 : 22,
    subSize: compact ? 12 : 13,
    landscapeMin: short ? 52 : compact ? 64 : 80,
    landscapeMax: Math.max(
      short ? 52 : compact ? 64 : 80,
      Math.round(Math.min(short ? 72 : compact ? 96 : 128, height * 0.12)),
    ),
    cardPadTop: short ? 14 : compact ? 18 : 22,
    cardOverlap: 18,
  };
}

type OnboardingStage = 'idle' | 'creating' | 'uploading' | 'refreshing' | 'done';

export default function CompleteProfileScreen() {
  const theme = useAppTheme();
  const { refreshUser } = useAuth();
  const { saving, error, saveProfile } = useSaveProfile();
  const { data, refresh } = useMyProfile();
  const { displayUri, isBusy, hasPendingPhoto, uploadPendingPhoto, showPhotoActions } = useProfilePhoto({
    profileImage: data?.profileImage,
    refreshProfile: refresh,
    canUploadNow: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPhotoRetry, setShowPhotoRetry] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [stage, setStage] = useState<OnboardingStage>('idle');
  const [submitting, setSubmitting] = useState(false);

  const { width: W, height: H, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardH, setKeyboardH] = useState(0);
  const keyboardOpen = keyboardH > 0;
  // Android adjustResize shrinks window height; keep layout tokens on the pre-keyboard size.
  const layoutH = keyboardOpen && Platform.OS === 'android' ? H + keyboardH : H;
  const L = useMemo(() => layoutFor(W, layoutH, fontScale), [W, layoutH, fontScale]);
  const fs = clampFont(fontScale);
  const logoPad = L.compact ? 4 : 8;
  const tagLines = fs > 1.2 ? 2 : 1;
  const textBlockH =
    Math.ceil(L.brandSize * fs * 1.3) + 2 + Math.ceil(L.tagSize * fs * 1.4) * tagLines;
  const logoRowH = Math.max(L.logo, textBlockH) + logoPad + 6;
  const headerH = keyboardOpen
    ? insets.top + logoRowH
    : insets.top + Math.max(L.headerBand, logoRowH + Math.round(L.waveH * 0.4));

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

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => {
      // Profile done → subscription paywall (Home is gated until isActive).
      router.replace('/(auth)/subscription' as Href);
    }, 900);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const getStageText = (value: OnboardingStage): string => {
    if (value === 'creating') return strings.completeProfile.creatingStep;
    if (value === 'uploading') return strings.completeProfile.uploadingStep;
    if (value === 'refreshing') return strings.completeProfile.refreshingStep;
    if (value === 'done') return strings.completeProfile.doneStep;
    return '';
  };

  const completeAndTransition = async (): Promise<void> => {
    setStage('refreshing');
    await refresh();
    await refreshUser();
    setStage('done');
    setShowSuccess(true);
    setSubmitting(false);
  };

  const tryUploadPendingPhoto = async (): Promise<boolean> => {
    if (!hasPendingPhoto) return true;
    setStage('uploading');
    return uploadPendingPhoto();
  };

  const handleSubmit = async (values: ProfileFormValues): Promise<void> => {
    if (submitting || isBusy) return;
    setSubmitting(true);
    setShowPhotoRetry(false);
    setShowSuccess(false);
    setStage('creating');

    const result = await saveProfile(values);
    if (!result) {
      setStage('idle');
      setSubmitting(false);
      return;
    }

    const uploaded = await tryUploadPendingPhoto();
    if (!uploaded) {
      setStage('idle');
      setShowPhotoRetry(true);
      setSubmitting(false);
      return;
    }

    await completeAndTransition();
  };

  const handleRetryPhoto = async (): Promise<void> => {
    setShowPhotoRetry(false);
    setSubmitting(true);
    const uploaded = await tryUploadPendingPhoto();
    if (!uploaded) {
      setShowPhotoRetry(true);
      setSubmitting(false);
      setStage('idle');
      return;
    }
    await completeAndTransition();
  };

  const handleSkipPhoto = async (): Promise<void> => {
    setShowPhotoRetry(false);
    setSubmitting(true);
    await completeAndTransition();
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 16) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: headerH }}>
            <View style={styles.headerClip}>
              {!keyboardOpen ? (
                <Image source={LANDSCAPE} style={styles.headerLandscape} resizeMode="cover" />
              ) : (
                <View style={styles.headerFallback} />
              )}

              <View
                style={[
                  styles.logoRow,
                  {
                    paddingTop: insets.top + (L.compact ? 4 : 8),
                    paddingHorizontal: L.padX,
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

              {!keyboardOpen ? (
                <View pointerEvents="none" style={[styles.wave, { height: L.waveH }]}>
                  <Image source={WAVE} style={styles.fill} resizeMode="cover" />
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                marginTop: keyboardOpen ? 0 : -L.cardOverlap,
                paddingHorizontal: L.padX,
                paddingTop: L.cardPadTop,
              },
            ]}
          >
            <View style={styles.stepPill}>
              <Text style={styles.stepText} maxFontSizeMultiplier={1.5}>
                {strings.completeProfile.progress}
              </Text>
            </View>

            <Text
              style={[styles.welcome, { fontSize: L.welcomeSize }]}
              maxFontSizeMultiplier={1.5}
            >
              {strings.completeProfile.welcome}
            </Text>
            <Text
              style={[
                styles.title,
                { fontSize: L.headingSize, lineHeight: Math.round(L.headingSize * 1.3) },
              ]}
              maxFontSizeMultiplier={1.5}
            >
              {strings.completeProfile.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: L.subSize, lineHeight: Math.round(L.subSize * 1.5) },
              ]}
              maxFontSizeMultiplier={1.5}
            >
              {strings.completeProfile.subtitle}
            </Text>

            <ProfilePhotoSection
              name={draftName || data?.name || ''}
              imageUri={displayUri}
              uploading={isBusy}
              disabled={saving || submitting}
              onPress={showPhotoActions}
              variant="onboarding"
              size={L.avatar}
            />

            <ProfileForm
              submitting={saving || isBusy || submitting}
              submitLabel={strings.completeProfile.saveProfile}
              submittingLabel={strings.completeProfile.saving}
              serverError={error}
              onNameChange={setDraftName}
              onSubmit={handleSubmit}
              variant="onboarding"
            />
          </View>

          <View
            style={[
              styles.landscapeWrap,
              keyboardOpen
                ? styles.landscapeHidden
                : { minHeight: L.landscapeMin, maxHeight: L.landscapeMax },
            ]}
          >
            <Image source={LANDSCAPE} style={styles.landscape} resizeMode="cover" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={stage !== 'idle' && !showSuccess} dismissable={false}>
          <Dialog.Content style={styles.progressContent}>
            <ActivityIndicator animating size="small" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurface }}>{getStageText(stage)}</Text>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={showPhotoRetry} dismissable={false}>
          <Dialog.Title>{strings.completeProfile.photoRetryTitle}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{strings.completeProfile.photoRetryMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSkipPhoto} disabled={submitting}>
              {strings.completeProfile.skipForNow}
            </Button>
            <Button onPress={handleRetryPhoto} loading={submitting} disabled={submitting}>
              {strings.completeProfile.retryUpload}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showSuccess} dismissable={false}>
          <Dialog.Content style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={iconSize.lg} color={theme.colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.onSurface }]}>
              {strings.completeProfile.successTitle}
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {strings.completeProfile.successSubtitle}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
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
  headerFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.cream,
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

  card: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    shadowColor: '#1A1C19',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  stepPill: {
    alignSelf: 'center',
    maxWidth: '100%',
    backgroundColor: C.paleGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  stepText: {
    color: C.stepGreen,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  welcome: {
    color: C.welcomeGrey,
    fontWeight: '500',
    textAlign: 'center',
  },
  title: {
    color: C.headingGreen,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.bodyGrey,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  landscapeWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: C.cream,
    flexGrow: 1,
  },
  landscape: {
    width: '100%',
    height: '100%',
    minHeight: 72,
  },
  landscapeHidden: {
    minHeight: 0,
    height: 0,
    overflow: 'hidden',
  },

  progressContent: { alignItems: 'center', gap: 8, paddingTop: 16 },
  successContent: { alignItems: 'center', gap: 8, paddingTop: 16 },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  successSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
