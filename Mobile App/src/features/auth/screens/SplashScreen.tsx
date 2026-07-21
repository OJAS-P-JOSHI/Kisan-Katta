import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { spacing, useAppTheme } from '@/theme';

import { useAuth } from '../context/AuthContext';

/**
 * No buttons, no user interaction. Purely reacts to `AuthContext`'s
 * session-restore bootstrap:
 * - loading            -> show logo + spinner
 * - not authenticated  -> Mobile Number screen
 * - authenticated, profile incomplete -> Complete Profile screen
 * - authenticated, profile complete   -> the root layout's `Stack.Protected`
 *   guard reactively swaps to the App Stack (Home) — no navigation needed here.
 */
export default function SplashScreen() {
  const theme = useAppTheme();
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/mobile');
      return;
    }

    if (user && !user.isProfileCompleted) {
      router.replace('/complete-profile');
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text
        variant="headlineSmall"
        style={[styles.appName, { color: theme.colors.primary }]}
      >
        {strings.app.name}
      </Text>
      <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
        {strings.auth.appTagline}
      </Text>
      <ActivityIndicator animating size="large" color={theme.colors.primary} style={styles.spinner} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  logo: { width: 120, height: 120, borderRadius: 24 },
  appName: { marginTop: spacing.md, fontWeight: '700' },
  tagline: { marginTop: spacing.xs, marginBottom: spacing.xl },
  spinner: { marginTop: spacing.md },
});
