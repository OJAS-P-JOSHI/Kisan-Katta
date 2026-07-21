import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { spacing, useAppTheme } from '@/theme';

import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';
import { useSaveProfile } from '../hooks/useSaveProfile';

export default function CompleteProfileScreen() {
  const theme = useAppTheme();
  const { refreshUser } = useAuth();
  const { saving, error, saveProfile } = useSaveProfile();

  const handleSubmit = async (values: ProfileFormValues): Promise<void> => {
    const result = await saveProfile(values);
    if (result) {
      // Marks `user.isProfileCompleted = true` in AuthContext; the root
      // layout's Stack.Protected guard reactively swaps to the App Stack
      // (Home) once this resolves — no manual navigation needed.
      await refreshUser();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          {strings.completeProfile.title}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {strings.completeProfile.subtitle}
        </Text>

        <ProfileForm
          submitting={saving}
          submitLabel={strings.completeProfile.saveProfile}
          submittingLabel={strings.completeProfile.saving}
          serverError={error}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontWeight: '700' },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.md },
});
