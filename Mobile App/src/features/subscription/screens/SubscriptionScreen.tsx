import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/context/AuthContext';
import { radius, spacing, useAppTheme } from '@/theme';

import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment';
import { SUBSCRIPTION_FEE_RUPEES } from '../subscription.constants';
import { subscriptionStrings } from '../subscription.strings';

/**
 * Paywall screen — shown after profile completion until subscription.isActive.
 * Root layout Stack.Protected keeps Home unreachable until refreshUser flips access.
 */
export default function SubscriptionScreen() {
  const theme = useAppTheme();
  const { user, refreshUser } = useAuth();
  const { phase, error, busy, loadingLabel, payNow, confirmActive } =
    useSubscriptionPayment({
      contact: user?.mobile,
    });

  // On mount / resume: if webhook already activated, refresh and let the guard enter Home.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await confirmActive();
      if (cancelled) return;
      if (active) {
        await refreshUser();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [confirmActive, refreshUser]);

  const handlePay = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log('PAYMENT STEP 1 Button onPress → handlePay');
    await payNow();
    // Success → refreshUser inside hook → canEnterApp becomes true → tabs.
  }, [payNow]);

  const isSuccess = phase === 'success';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="shield-check"
              size={40}
              color={theme.colors.primary}
            />
          </View>

          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            {subscriptionStrings.title}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {subscriptionStrings.subtitle}
          </Text>

          <Text variant="displaySmall" style={[styles.amount, { color: theme.colors.primary }]}>
            ₹{SUBSCRIPTION_FEE_RUPEES}
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {' '}/ month
            </Text>
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {subscriptionStrings.description}
          </Text>

          {error ? (
            <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          {busy || isSuccess ? (
            <View style={styles.busyRow}>
              <ActivityIndicator animating color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {isSuccess ? subscriptionStrings.successBody : loadingLabel}
              </Text>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => {
                void handlePay();
              }}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {phase === 'failed' ? subscriptionStrings.retry : subscriptionStrings.payNow}
            </Button>
          )}

          <Text
            variant="labelSmall"
            style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
          >
            {subscriptionStrings.requiredHint}
          </Text>
        </Surface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { textAlign: 'center', fontWeight: '700' },
  subtitle: { textAlign: 'center' },
  amount: { textAlign: 'center', fontWeight: '700', marginVertical: spacing.sm },
  description: { textAlign: 'center', lineHeight: 22 },
  error: { textAlign: 'center' },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  button: { marginTop: spacing.sm },
  buttonContent: { paddingVertical: spacing.xs },
  hint: { textAlign: 'center', marginTop: spacing.sm },
});
