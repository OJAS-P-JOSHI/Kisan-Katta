import { useFocusEffect, router } from 'expo-router';
import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { cardSurface, radius, spacing, typography, useAppTheme } from '@/theme';

import { ProfileAvatar } from '../components/ProfileAvatar';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';
import { useMyProfile } from '../hooks/useMyProfile';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { profileStrings } from '../profile.strings';

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const { data, loading, error: loadError, refresh } = useMyProfile();
  const { updating, error: updateError, updateProfile } = useUpdateProfile();
  const { displayUri, isBusy, showPhotoActions } = useProfilePhoto({
    profileImage: data?.profileImage,
    refreshProfile: refresh,
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleSubmit = async (values: ProfileFormValues): Promise<void> => {
    const result = await updateProfile(values);
    if (result && router.canGoBack()) {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (loadError || !data) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.md }}>
          {loadError ?? 'Unable to load profile.'}
        </Text>
        <Button mode="contained" onPress={refresh}>
          {strings.market.retry}
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[typography.mediumHeading, { color: theme.colors.onBackground }]}>
              {strings.profile.editProfile}
            </Text>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
              {strings.profile.editSubtitle}
            </Text>
          </View>

          <View style={[styles.photoCard, { backgroundColor: theme.colors.surface }, cardSurface]}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, marginBottom: spacing.md }]}>
              {profileStrings.sections.photo}
            </Text>
            <View style={styles.avatarBlock}>
              <ProfileAvatar
                name={data.name}
                imageUri={displayUri}
                uploading={isBusy}
                size={128}
                onPress={showPhotoActions}
              />
              <Text
                style={[
                  typography.caption,
                  { color: theme.colors.primary, marginTop: spacing.sm, fontWeight: '600' },
                ]}
                onPress={isBusy ? undefined : showPhotoActions}
              >
                {profileStrings.photo.changePhoto}
              </Text>
            </View>
          </View>

          <ProfileForm
            initialValues={data}
            submitting={updating || isBusy}
            submitLabel={strings.completeProfile.updateProfile}
            submittingLabel={strings.completeProfile.updating}
            serverError={updateError}
            onSubmit={handleSubmit}
            sectioned
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  photoCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
});
