import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Dialog, Portal, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganicBackground } from '@/components/OrganicBackground';
import { spacing, typography, useAppTheme } from '@/theme';

import { billingStrings } from '../billing.strings';
import {
  BillingHistoryCard,
  PaymentMethodCard,
  PlanDetailsCard,
  RefundPolicyCard,
  SubscriptionControlsCard,
  SubscriptionStatusCard,
  SupportCard,
} from '../components/BillingCards';
import { useSubscriptionBilling } from '../hooks/useSubscriptionBilling';

export default function SubscriptionBillingScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    subscription,
    history,
    loading,
    refreshing,
    cancelling,
    error,
    reload,
    cancel,
  } = useSubscriptionBilling();

  const [cancelVisible, setCancelVisible] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const onRenew = useCallback(() => {
    router.push('/(auth)/subscription' as Href);
  }, []);

  const onConfirmCancel = useCallback(async () => {
    const ok = await cancel();
    setCancelVisible(false);
    if (ok) setSnack(billingStrings.cancelSuccess);
  }, [cancel]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload({ soft: true })}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.largeHeading, { color: theme.colors.onBackground }]}>
          {billingStrings.screenTitle}
        </Text>

        {loading ? (
          <ActivityIndicator
            animating
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing.xl }}
          />
        ) : error && !subscription ? (
          <View style={styles.errorBox}>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>{error}</Text>
            <Button mode="text" onPress={() => void reload()}>
              {billingStrings.retry}
            </Button>
          </View>
        ) : !subscription ? (
          <View style={styles.errorBox}>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {billingStrings.noSubscription}
            </Text>
            <Button mode="contained" onPress={onRenew}>
              {billingStrings.renewNow}
            </Button>
          </View>
        ) : (
          <View style={styles.stack}>
            <SubscriptionStatusCard
              subscription={subscription}
              onRenew={!subscription.isActive ? onRenew : undefined}
            />
            <PlanDetailsCard subscription={subscription} />
            <PaymentMethodCard subscription={subscription} />
            <BillingHistoryCard
              items={history}
              onPressItem={(paymentId) => {
                router.push(`/subscription-billing/${encodeURIComponent(paymentId)}` as Href);
              }}
            />
            <SubscriptionControlsCard
              subscription={subscription}
              cancelling={cancelling}
              onCancelPress={() => setCancelVisible(true)}
            />
            <RefundPolicyCard />
            <SupportCard
              onFaq={() => Alert.alert(billingStrings.billingFaq, billingStrings.comingSoon)}
              onContact={() =>
                Alert.alert(billingStrings.contactSupport, billingStrings.comingSoon)
              }
            />
            {error ? (
              <Text style={[typography.caption, { color: theme.colors.error }]}>{error}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={cancelVisible} onDismiss={() => setCancelVisible(false)}>
          <Dialog.Title>{billingStrings.cancelTitle}</Dialog.Title>
          <Dialog.Content>
            <Text style={typography.body}>{billingStrings.cancelBody}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelVisible(false)} disabled={cancelling}>
              {billingStrings.cancelKeep}
            </Button>
            <Button
              onPress={() => void onConfirmCancel()}
              loading={cancelling}
              disabled={cancelling}
              textColor={theme.colors.error}
            >
              {billingStrings.cancelConfirm}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack(null)} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  stack: { gap: spacing.md },
  errorBox: { marginTop: spacing.xl, gap: spacing.md, alignItems: 'flex-start' },
});
