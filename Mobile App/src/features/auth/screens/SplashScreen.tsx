import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
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
 * - authenticated, profile complete, no subscription -> Subscription paywall
 * - authenticated + profile + active subscription -> root `Stack.Protected`
 *   swaps to the App Stack (Home)
 */
export default function SplashScreen() {
  const theme = useAppTheme();
  const { isLoading, isAuthenticated, user, refreshUser } = useAuth();
  const profileRetryStarted = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/mobile');
      return;
    }

    // JWT restored but profile not loaded yet (offline / first hydrate).
    // Stay on splash — do not treat this as logged out.
    if (!user) {
      if (!profileRetryStarted.current) {
        profileRetryStarted.current = true;
        void refreshUser();
      }
      return;
    }

    if (!user.isProfileCompleted) {
      router.replace('/complete-profile');
      return;
    }

    if (user.subscription?.isActive !== true) {
      router.replace('/(auth)/subscription' as Href);
    }
  }, [isLoading, isAuthenticated, user, refreshUser]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image
        source={require('@/assets/branding/logo-circle.png')}
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
