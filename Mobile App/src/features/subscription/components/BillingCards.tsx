import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { billingStrings } from '../billing.strings';
import {
  chipColors,
  formatBillingDate,
  formatPaymentMethod,
  formatRupees,
  statusLabel,
  statusTone,
  type StatusTone,
} from '../billing.utils';
import type { BillingPaymentDTO, SubscriptionDTO } from '../subscription.types';

function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  const colors = chipColors(tone);
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const dot =
    tone === 'success'
      ? '●'
      : tone === 'warning'
        ? '●'
        : tone === 'danger'
          ? '●'
          : '●';

  return (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: colors.bg, transform: [{ scale }] },
      ]}
    >
      <Text style={[typography.caption, { color: colors.fg, fontWeight: '700' }]}>
        {dot}  {label}
      </Text>
    </Animated.View>
  );
}

/** Single premium hero — plan, amount, status, next payment, period (no duplicates elsewhere). */
export function SubscriptionHeroCard({ subscription }: { subscription: SubscriptionDTO }) {
  const theme = useAppTheme();
  const tone = statusTone(subscription.status, subscription.isActive);
  const nextPay = formatBillingDate(subscription.nextChargeAt ?? subscription.currentPeriodEnd);
  const method = subscription.paymentMethod
    ? formatPaymentMethod(subscription.paymentMethod)
    : null;

  return (
    <FadeIn>
      <View
        style={[
          styles.hero,
          cardSurface,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, letterSpacing: 0.3 }]}>
          {billingStrings.heroTitle}
        </Text>

        <StatusChip
          label={statusLabel(subscription.status, subscription.isActive)}
          tone={tone}
        />

        <Text style={[styles.price, { color: theme.colors.onSurface }]}>
          {billingStrings.amountPerMonth(subscription.amountRupees)}
        </Text>

        <View style={styles.nextBlock}>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
            {billingStrings.nextPayment}
          </Text>
          <Text style={[typography.mediumHeading, { color: theme.colors.onSurface }]}>
            {nextPay}
          </Text>
        </View>

        <View
          style={[
            styles.periodPill,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-range"
            size={iconSize.sm}
            color={theme.colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: theme.colors.onPrimaryContainer }]}>
              {billingStrings.periodLabel}
            </Text>
            <Text
              style={[
                typography.body,
                { color: theme.colors.onPrimaryContainer, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {formatBillingDate(subscription.currentPeriodStart)}
              {'  →  '}
              {formatBillingDate(subscription.currentPeriodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {method ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={iconSize.sm}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {method}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={subscription.autoRenewalEnabled ? 'autorenew' : 'cancel'}
              size={iconSize.sm}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {subscription.autoRenewalEnabled
                ? billingStrings.autoRenewOn
                : billingStrings.autoRenewOff}
            </Text>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

function paymentStatusLabel(status: string): string {
  if (status === 'PAID') return billingStrings.paid;
  if (status === 'FAILED') return billingStrings.failed;
  if (status === 'PENDING') return billingStrings.pending;
  if (status === 'REFUNDED') return billingStrings.refunded;
  return status;
}

function paymentTone(status: string): StatusTone {
  if (status === 'PAID') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'REFUNDED') return 'neutral';
  return 'warning';
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
    <FadeIn delay={60}>
      <View style={[styles.section, cardSurface, { backgroundColor: theme.colors.surface }]}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
          {billingStrings.historySection}
        </Text>

        {items.length === 0 ? (
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }]}>
            {billingStrings.historyEmpty}
          </Text>
        ) : (
          items.map((item, index) => {
            const tone = paymentTone(item.status);
            const colors = chipColors(tone);
            return (
              <Pressable
                key={item.paymentId}
                onPress={() => onPressItem(item.paymentId)}
                android_ripple={{ color: theme.colors.outlineVariant }}
                style={({ pressed }) => [
                  styles.historyRow,
                  {
                    borderBottomColor: theme.colors.outlineVariant,
                    borderBottomWidth: index === items.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.checkCircle, { backgroundColor: colors.bg }]}>
                  <MaterialCommunityIcons
                    name={
                      item.status === 'PAID'
                        ? 'check'
                        : item.status === 'FAILED'
                          ? 'close'
                          : 'clock-outline'
                    }
                    size={18}
                    color={colors.fg}
                  />
                </View>

                <View style={styles.historyBody}>
                  <View style={styles.historyTop}>
                    <Text style={[typography.body, { color: colors.fg, fontWeight: '700' }]}>
                      {paymentStatusLabel(item.status)}
                    </Text>
                    <Text
                      style={[
                        typography.body,
                        { color: theme.colors.onSurface, fontWeight: '700' },
                      ]}
                    >
                      {formatRupees(item.amountRupees)}
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                    {formatBillingDate(item.paidAt)}
                    {'  ·  '}
                    {formatPaymentMethod(item.paymentMethod)}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={iconSize.md}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            );
          })
        )}
      </View>
    </FadeIn>
  );
}

export function RefundPolicyCard() {
  const theme = useAppTheme();
  return (
    <FadeIn delay={100}>
      <View style={[styles.section, cardSurface, { backgroundColor: theme.colors.surface }]}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
          {billingStrings.refundSection}
        </Text>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {billingStrings.refundItems.map((item) => (
            <View key={item.text} style={styles.refundRow}>
              <View
                style={[
                  styles.refundIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={iconSize.sm}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  typography.body,
                  { color: theme.colors.onSurfaceVariant, flex: 1, lineHeight: 22 },
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </FadeIn>
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
    <FadeIn delay={140}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, marginLeft: spacing.xs }]}>
          {billingStrings.supportSection}
        </Text>
        <View style={styles.supportGrid}>
          <SupportTile
            icon="help-circle-outline"
            title={billingStrings.billingFaq}
            onPress={onFaq}
          />
          <SupportTile
            icon="phone-outline"
            title={billingStrings.contactSupport}
            onPress={onContact}
          />
        </View>
      </View>
    </FadeIn>
  );
}

function SupportTile({
  icon,
  title,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.supportTile,
        cardSurface,
        {
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.supportIconWrap, { backgroundColor: theme.colors.secondaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.md} color={theme.colors.secondary} />
      </View>
      <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
        {title}
      </Text>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {billingStrings.comingSoon}
      </Text>
    </Pressable>
  );
}

export function BillingActionBar({
  showRenew,
  showCancel,
  cancelling,
  onRenew,
  onCancel,
}: {
  showRenew: boolean;
  showCancel: boolean;
  cancelling: boolean;
  onRenew: () => void;
  onCancel: () => void;
}) {
  const theme = useAppTheme();
  if (!showRenew && !showCancel) return null;

  return (
    <View
      style={[
        styles.actionBar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {showRenew ? (
        <Pressable
          onPress={onRenew}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.onPrimary} />
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '700', fontSize: 16 }}>
            {billingStrings.renewNow}
          </Text>
        </Pressable>
      ) : null}

      {showCancel ? (
        <Pressable
          disabled={cancelling}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderColor: theme.colors.error,
              opacity: cancelling || pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.colors.error} />
          <Text style={{ color: theme.colors.error, fontWeight: '700', fontSize: 15 }}>
            {cancelling ? billingStrings.cancelling : billingStrings.cancel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: spacing.xs,
  },
  nextBlock: {
    marginTop: spacing.sm,
    gap: 2,
  },
  periodPill: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 64,
    gap: spacing.sm,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  refundIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  supportTile: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 112,
  },
  supportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
  },
});
