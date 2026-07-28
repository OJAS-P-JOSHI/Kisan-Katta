import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { ProfilePhotoSection } from '../components/ProfilePhotoSection';
import { useMyProfile } from '../hooks/useMyProfile';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';
import { useSaveProfile } from '../hooks/useSaveProfile';

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

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[typography.caption, { color: theme.colors.primary }]}>{strings.completeProfile.progress}</Text>
            <Text variant="headlineSmall" style={[styles.welcome, { color: theme.colors.onBackground }]}>
              {strings.completeProfile.welcome}
            </Text>
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
              {strings.completeProfile.title}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {strings.completeProfile.subtitle}
            </Text>
          </View>

          <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }, cardSurface]} elevation={1}>
            <ProfilePhotoSection
              name={draftName || data?.name || ''}
              imageUri={displayUri}
              uploading={isBusy}
              disabled={saving || submitting}
              onPress={showPhotoActions}
            />

            <ProfileForm
              submitting={saving || isBusy || submitting}
              submitLabel={strings.completeProfile.saveProfile}
              submittingLabel={strings.completeProfile.saving}
              serverError={error}
              onNameChange={setDraftName}
              onSubmit={handleSubmit}
            />
          </Surface>
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
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
              {strings.completeProfile.successTitle}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {strings.completeProfile.successSubtitle}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  welcome: { marginTop: spacing.xs },
  title: { fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' },
  subtitle: { marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  formCard: { borderRadius: radius.lg, padding: spacing.md },
  progressContent: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  successContent: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
