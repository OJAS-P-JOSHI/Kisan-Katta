import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { billingStrings } from '../billing.strings';
import {
  formatBillingDate,
  formatPaymentMethod,
  formatRupees,
  statusLabel,
  statusTone,
} from '../billing.utils';
import type { BillingPaymentDTO, SubscriptionDTO } from '../subscription.types';

const toneColors = (theme: ReturnType<typeof useAppTheme>, tone: ReturnType<typeof statusTone>) => {
  if (tone === 'success') {
    return { bg: theme.colors.primaryContainer, fg: theme.colors.primary };
  }
  if (tone === 'warning') {
    return { bg: '#FFF3E0', fg: '#E65100' };
  }
  if (tone === 'danger') {
    return { bg: theme.colors.errorContainer, fg: theme.colors.error };
  }
  return { bg: theme.colors.surfaceVariant, fg: theme.colors.onSurfaceVariant };
};

export function SubscriptionStatusCard({
  subscription,
  onRenew,
}: {
  subscription: SubscriptionDTO;
  onRenew?: () => void;
}) {
  const theme = useAppTheme();
  const tone = statusTone(subscription.status, subscription.isActive);
  const colors = toneColors(theme, tone);
  const showRenew = !subscription.isActive;

  return (
    <View style={[styles.hero, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.chip, { backgroundColor: colors.bg }]}>
        <Text style={[typography.caption, { color: colors.fg, fontWeight: '700' }]}>
          {statusLabel(subscription.status, subscription.isActive).toUpperCase()}
        </Text>
      </View>

      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {billingStrings.currentPlan}
      </Text>
      <Text style={[typography.largeHeading, { color: theme.colors.onSurface }]}>
        {subscription.planName}
      </Text>
      <Text style={[typography.mediumHeading, { color: theme.colors.primary }]}>
        {billingStrings.amountPerMonth(subscription.amountRupees)}
      </Text>

      <View style={styles.heroRows}>
        <HeroRow
          label="Status"
          value={statusLabel(subscription.status, subscription.isActive)}
        />
        <HeroRow
          label={billingStrings.nextBilling}
          value={formatBillingDate(subscription.nextChargeAt ?? subscription.currentPeriodEnd)}
        />
        <HeroRow
          label={billingStrings.autoRenewal}
          value={
            subscription.autoRenewalEnabled
              ? billingStrings.autoRenewalOn
              : billingStrings.autoRenewalOff
          }
        />
        <HeroRow
          label={billingStrings.billingPeriod}
          value={`${formatBillingDate(subscription.currentPeriodStart)} → ${formatBillingDate(subscription.currentPeriodEnd)}`}
        />
      </View>

      {showRenew && onRenew ? (
        <Pressable
          onPress={onRenew}
          style={[styles.renewBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
            {billingStrings.renewNow}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HeroRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.heroRow}>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600', flex: 1, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

export function PlanDetailsCard({ subscription }: { subscription: SubscriptionDTO }) {
  const theme = useAppTheme();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!subscription.subscriptionId) return;
    await Clipboard.setStringAsync(subscription.subscriptionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SectionCard title={billingStrings.planSection}>
      <DetailRow label={billingStrings.planName} value={subscription.planName} />
      <DetailRow
        label={billingStrings.monthlyAmount}
        value={formatRupees(subscription.amountRupees)}
      />
      <DetailRow label={billingStrings.billingFrequency} value={subscription.billingFrequency} />
      <DetailRow label={billingStrings.startedOn} value={formatBillingDate(subscription.createdAt)} />
      <DetailRow
        label={billingStrings.currentPeriod}
        value={`${formatBillingDate(subscription.currentPeriodStart)} – ${formatBillingDate(subscription.currentPeriodEnd)}`}
      />
      <DetailRow
        label={billingStrings.nextRenewal}
        value={formatBillingDate(subscription.nextChargeAt)}
      />
      <View style={styles.copyRow}>
        <View style={{ flex: 1 }}>
          <DetailRow
            label={billingStrings.subscriptionId}
            value={subscription.subscriptionId ?? '—'}
          />
        </View>
        {subscription.subscriptionId ? (
          <Pressable onPress={() => void copyId()} hitSlop={8}>
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={iconSize.sm}
              color={theme.colors.primary}
            />
          </Pressable>
        ) : null}
      </View>
    </SectionCard>
  );
}

export function PaymentMethodCard({ subscription }: { subscription: SubscriptionDTO }) {
  return (
    <SectionCard title={billingStrings.paymentMethodSection}>
      <DetailRow
        label={billingStrings.paymentMethod}
        value={
          subscription.paymentMethod
            ? formatPaymentMethod(subscription.paymentMethod)
            : billingStrings.methodUnknown
        }
      />
      <DetailRow
        label={billingStrings.lastUpdated}
        value={formatBillingDate(subscription.updatedAt)}
      />
    </SectionCard>
  );
}

export function BillingHistoryCard({
  items,
  onPressItem,
}: {
  items: BillingPaymentDTO[];
  onPressItem: (paymentId: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <SectionCard title={billingStrings.historySection}>
      {items.length === 0 ? (
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
          {billingStrings.historyEmpty}
        </Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.paymentId}
            onPress={() => onPressItem(item.paymentId)}
            style={[styles.historyRow, { borderBottomColor: theme.colors.outlineVariant }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                {item.status === 'PAID' ? billingStrings.paid : item.status}
                {' · '}
                {formatRupees(item.amountRupees)}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {formatBillingDate(item.paidAt)} · {formatPaymentMethod(item.paymentMethod)}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.paymentId}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={iconSize.md}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        ))
      )}
    </SectionCard>
  );
}

export function SubscriptionControlsCard({
  subscription,
  cancelling,
  onCancelPress,
}: {
  subscription: SubscriptionDTO;
  cancelling: boolean;
  onCancelPress: () => void;
}) {
  const theme = useAppTheme();
  const canCancel =
    subscription.isActive &&
    subscription.autoRenewalEnabled &&
    subscription.status !== 'CANCELLED';

  return (
    <SectionCard title={billingStrings.controlsSection}>
      <DetailRow
        label={billingStrings.autoRenewal}
        value={
          subscription.autoRenewalEnabled
            ? billingStrings.autoRenewalOn
            : billingStrings.autoRenewalOff
        }
      />
      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
        {billingStrings.autoRenewExplain}
      </Text>
      {canCancel ? (
        <Pressable
          disabled={cancelling}
          onPress={onCancelPress}
          style={[styles.cancelBtn, { borderColor: theme.colors.error }]}
        >
          <Text style={{ color: theme.colors.error, fontWeight: '700' }}>
            {cancelling ? 'Cancelling…' : billingStrings.cancel}
          </Text>
        </Pressable>
      ) : null}
    </SectionCard>
  );
}

export function RefundPolicyCard() {
  const theme = useAppTheme();
  return (
    <SectionCard title={billingStrings.refundSection}>
      {billingStrings.refundBullets.map((line) => (
        <Text
          key={line}
          style={[typography.body, { color: theme.colors.onSurfaceVariant, marginBottom: spacing.xs }]}
        >
          • {line}
        </Text>
      ))}
    </SectionCard>
  );
}

export function SupportCard({
  onFaq,
  onContact,
}: {
  onFaq: () => void;
  onContact: () => void;
}) {
  const theme = useAppTheme();
  return (
    <SectionCard title={billingStrings.supportSection}>
      <Pressable onPress={onFaq} style={styles.supportRow}>
        <MaterialCommunityIcons name="help-circle-outline" size={iconSize.md} color={theme.colors.primary} />
        <Text style={[typography.body, { color: theme.colors.onSurface, flex: 1 }]}>
          {billingStrings.billingFaq}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {billingStrings.comingSoon}
        </Text>
      </Pressable>
      <Pressable onPress={onContact} style={styles.supportRow}>
        <MaterialCommunityIcons name="headset" size={iconSize.md} color={theme.colors.primary} />
        <Text style={[typography.body, { color: theme.colors.onSurface, flex: 1 }]}>
          {billingStrings.contactSupport}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {billingStrings.comingSoon}
        </Text>
      </Pressable>
    </SectionCard>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.section, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '500' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.lg, gap: spacing.xs },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  heroRows: { marginTop: spacing.md, gap: spacing.sm },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  renewBtn: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  section: { padding: spacing.lg, gap: spacing.xs },
  detailRow: { gap: 2, marginBottom: spacing.sm },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  cancelBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
