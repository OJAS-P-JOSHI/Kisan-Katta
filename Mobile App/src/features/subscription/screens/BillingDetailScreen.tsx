import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
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
  chipColors,
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
  const [snack, setSnack] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!paymentId) {
      setError(billingStrings.loadError);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBillingPaymentDetail(paymentId);
      setItem(data);
      fade.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError(getErrorMessage(err, billingStrings.loadError));
    } finally {
      setLoading(false);
    }
  }, [fade, paymentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyValue = async (value: string, label: string) => {
    if (!value || value === '—') return;
    await Clipboard.setStringAsync(value);
    setSnack(`${label} · ${billingStrings.copied}`);
  };

  const statusColors =
    item?.status === 'PAID'
      ? chipColors('success')
      : item?.status === 'FAILED'
        ? chipColors('danger')
        : chipColors('warning');

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator animating color={theme.colors.primary} style={{ marginTop: spacing.xl }} />
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
          <Animated.View style={{ opacity: fade, gap: spacing.md }}>
            <View
              style={[
                styles.hero,
                cardSurface,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={[styles.statusChip, { backgroundColor: statusColors.bg }]}>
                <MaterialCommunityIcons
                  name={item.status === 'PAID' ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={statusColors.fg}
                />
                <Text style={{ color: statusColors.fg, fontWeight: '700' }}>
                  {item.status === 'PAID' ? billingStrings.paid : item.status}
                </Text>
              </View>
              <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
                {formatRupees(item.amountRupees)}
              </Text>
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
                {formatBillingDate(item.paidAt)}
                {'  ·  '}
                {formatPaymentMethod(item.paymentMethod)}
              </Text>
            </View>

            <View
              style={[
                styles.card,
                cardSurface,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <CopyRow
                label={billingStrings.paymentId}
                value={item.paymentId}
                onCopy={() => void copyValue(item.paymentId, billingStrings.paymentId)}
              />
              <CopyRow
                label={billingStrings.subscriptionId}
                value={item.subscriptionId ?? '—'}
                onCopy={() =>
                  void copyValue(item.subscriptionId ?? '', billingStrings.subscriptionId)
                }
              />
              <CopyRow
                label={billingStrings.invoiceId}
                value={item.invoiceId ?? '—'}
                onCopy={() => void copyValue(item.invoiceId ?? '', billingStrings.invoiceId)}
              />
              <DetailRow
                label={billingStrings.paymentMethod}
                value={formatPaymentMethod(item.paymentMethod)}
              />
              <DetailRow
                label={billingStrings.amount}
                value={formatRupees(item.amountRupees)}
              />
              <DetailRow
                label={billingStrings.paymentDate}
                value={formatBillingDate(item.paidAt)}
              />
              <DetailRow
                label={billingStrings.billingPeriod}
                value={`${formatBillingDate(item.periodStart)} – ${formatBillingDate(item.periodEnd)}`}
              />
              <DetailRow label={billingStrings.gateway} value={item.gateway} />
            </View>

            <View
              style={[
                styles.receiptBox,
                cardSurface,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={iconSize.md}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {billingStrings.receipt}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {billingStrings.receiptPlaceholder}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack(null)} duration={2000}>
        {snack}
      </Snackbar>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
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

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  const theme = useAppTheme();
  const canCopy = Boolean(value && value !== '—');
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
        <Text
          style={[typography.body, { color: theme.colors.onSurface, fontWeight: '500' }]}
          selectable
        >
          {value}
        </Text>
      </View>
      {canCopy ? (
        <Pressable
          onPress={onCopy}
          hitSlop={10}
          style={({ pressed }) => [
            styles.copyBtn,
            {
              backgroundColor: theme.colors.primaryContainer,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="content-copy"
            size={iconSize.sm}
            color={theme.colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md },
  hero: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detail: { gap: 2 },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
