import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { OrganicBackground } from '@/components/OrganicBackground';
import { getErrorMessage } from '@/utils';
import {
  cardSurface,
  iconSize,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { billingStrings } from '../billing.strings';
import {
  formatBillingDate,
  formatPaymentMethod,
  formatRupees,
} from '../billing.utils';
import { getBillingPaymentDetail } from '../subscription.service';
import type { BillingPaymentDTO } from '../subscription.types';

export default function BillingDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { paymentId: rawId } = useLocalSearchParams<{ paymentId: string }>();
  const paymentId = decodeURIComponent(rawId ?? '');

  const [item, setItem] = useState<BillingPaymentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!paymentId) {
      setError('Missing payment id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBillingPaymentDetail(paymentId);
      setItem(data);
    } catch (err) {
      setError(getErrorMessage(err, billingStrings.loadError));
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyPaymentId = async () => {
    if (!item?.paymentId) return;
    await Clipboard.setStringAsync(item.paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        {loading ? (
          <ActivityIndicator animating color={theme.colors.primary} />
        ) : error || !item ? (
          <View style={{ gap: spacing.md }}>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {error ?? billingStrings.loadError}
            </Text>
            <Button mode="text" onPress={() => void load()}>
              {billingStrings.retry}
            </Button>
          </View>
        ) : (
          <View style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}>
            <Text style={[typography.largeHeading, { color: theme.colors.primary, fontWeight: '700' }]}>
              {formatRupees(item.amountRupees)}
            </Text>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {item.status === 'PAID' ? billingStrings.paid : item.status}
            </Text>

            <Detail label={billingStrings.paymentId} value={item.paymentId} />
            <Detail
              label={billingStrings.subscriptionId}
              value={item.subscriptionId ?? '—'}
            />
            <Detail
              label={billingStrings.invoiceId}
              value={item.invoiceId ?? '—'}
            />
            <Detail
              label={billingStrings.paymentMethod}
              value={formatPaymentMethod(item.paymentMethod)}
            />
            <Detail label={billingStrings.paymentDate} value={formatBillingDate(item.paidAt)} />
            <Detail
              label={billingStrings.billingPeriod}
              value={`${formatBillingDate(item.periodStart)} – ${formatBillingDate(item.periodEnd)}`}
            />
            <Detail label={billingStrings.gateway} value={item.gateway} />
            <Detail label={billingStrings.transactionRef} value={item.paymentId} />

            <Pressable
              onPress={() => void copyPaymentId()}
              style={[styles.copyBtn, { borderColor: theme.colors.primary }]}
            >
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={iconSize.sm}
                color={theme.colors.primary}
              />
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {copied ? billingStrings.copied : `${billingStrings.copy} ${billingStrings.paymentId}`}
              </Text>
            </Pressable>

            <View style={[styles.receiptBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {billingStrings.receipt}
              </Text>
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
                {billingStrings.receiptPlaceholder}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.detail}>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '500' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  detail: { gap: 2, marginTop: spacing.sm },
  copyBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  receiptBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
});
