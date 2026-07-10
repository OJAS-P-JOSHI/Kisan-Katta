import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { spacing, useAppTheme } from '@/theme';

import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';
import { useMyProfile } from '../hooks/useMyProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const { data, loading, error: loadError, refresh } = useMyProfile();
  const { updating, error: updateError, updateProfile } = useUpdateProfile();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            {strings.profile.editProfile}
          </Text>
        </View>

        <ProfileForm
          initialValues={data}
          submitting={updating}
          submitLabel={strings.completeProfile.updateProfile}
          submittingLabel={strings.completeProfile.updating}
          serverError={updateError}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.sm },
});
