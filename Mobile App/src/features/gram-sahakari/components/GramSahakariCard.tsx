import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { memo, useCallback, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';

import {
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { homeColors, homeSurfaces, homeText } from '@/features/home/home.theme';

import {
  gramSahakariStrings,
  matchLevelBadge,
  matchLevelFallback,
} from '../gram-sahakari.strings';
import type { RepresentativeContact, RepresentativeDiscovery } from '../gram-sahakari.types';
import { formatLocationLine, toTelUrl, toWhatsAppUrl } from '../gram-sahakari.utils';

type GramSahakariCardProps = {
  data: RepresentativeDiscovery;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function RepresentativeAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const theme = useAppTheme();
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (photoUrl) {
    return (
      <Image source={{ uri: photoUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
    );
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.colors.primaryContainer }]}>
      <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>{initial}</Text>
    </View>
  );
}

function ContactActions({ phone }: { phone: string }) {
  const theme = useAppTheme();

  const onCall = useCallback(async () => {
    const url = toTelUrl(phone);
    if (!url) return;
    await Linking.openURL(url);
  }, [phone]);

  const onWhatsApp = useCallback(async () => {
    const url = toWhatsAppUrl(phone);
    if (!url) return;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
    await Linking.openURL(url);
  }, [phone]);

  const canContact = Boolean(toTelUrl(phone));

  if (!canContact) return null;

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={() => void onCall()}
        accessibilityRole="button"
        accessibilityLabel={gramSahakariStrings.call}
        style={({ pressed }) => [
          styles.actionBtn,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="phone" size={16} color={theme.colors.onPrimary} />
        <Text style={[styles.actionLabel, { color: theme.colors.onPrimary }]}>
          {gramSahakariStrings.call}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => void onWhatsApp()}
        accessibilityRole="button"
        accessibilityLabel={gramSahakariStrings.whatsapp}
        style={({ pressed }) => [
          styles.actionBtn,
          styles.whatsappBtn,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="whatsapp" size={16} color={palette.green900} />
        <Text style={[styles.actionLabel, { color: palette.green900 }]}>
          {gramSahakariStrings.whatsapp}
        </Text>
      </Pressable>
    </View>
  );
}

function RepresentativeTile({
  rep,
  matchLevel,
}: {
  rep: RepresentativeContact;
  matchLevel: RepresentativeDiscovery['matchLevel'];
}) {
  const theme = useAppTheme();
  const fallback = matchLevel ? matchLevelFallback(matchLevel) : null;

  return (
    <View style={styles.repTile}>
      <View style={styles.repHeader}>
        <RepresentativeAvatar name={rep.name} photoUrl={rep.photoUrl} />
        <View style={styles.repBody}>
          <Text style={[styles.repName, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {rep.name}
          </Text>
          <Text
            style={[styles.repLocation, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {formatLocationLine(rep.village, rep.taluka, rep.district)}
          </Text>
          {matchLevel ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <MaterialCommunityIcons name="shield-check" size={11} color={theme.colors.secondary} />
              <Text style={[styles.badgeText, { color: theme.colors.onSecondaryContainer }]}>
                {matchLevelBadge(matchLevel)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ContactActions phone={rep.phone} />

      {fallback ? (
        <Text style={[styles.fallbackNote, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {fallback.body}
        </Text>
      ) : null}
    </View>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return <View style={[styles.shell, homeSurfaces.support]}>{children}</View>;
}

function CardHeader() {
  const theme = useAppTheme();
  return (
    <View style={styles.cardHeader}>
      <View style={[styles.headerIcon, { backgroundColor: palette.amber100 }]}>
        <MaterialCommunityIcons name="account-supervisor" size={iconSize.sm} color={homeColors.supportAccent} />
      </View>
      <View style={styles.headerText}>
        <Text style={[homeText.sectionUtility, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {gramSahakariStrings.title}
        </Text>
        <Text style={[styles.headerSubtitle, { color: homeColors.inkMuted }]} numberOfLines={1}>
          {gramSahakariStrings.subtitle}
        </Text>
      </View>
    </View>
  );
}

function GramSahakariSkeleton() {
  const theme = useAppTheme();
  return (
    <CardShell>
      <CardHeader />
      <View style={styles.body}>
        <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceVariant, width: '70%' }]} />
        <View style={[styles.skeletonBlock, { backgroundColor: theme.colors.surfaceVariant }]} />
      </View>
    </CardShell>
  );
}

export const GramSahakariCard = memo(function GramSahakariCard({
  data,
  loading,
  error,
  onRetry,
}: GramSahakariCardProps) {
  const theme = useAppTheme();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.wrap}>
        <GramSahakariSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <CardShell>
          <CardHeader />
          <View style={styles.body}>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {error ?? gramSahakariStrings.loadError}
            </Text>
            <Button compact mode="text" onPress={onRetry} style={styles.retryBtn}>
              {gramSahakariStrings.retry}
            </Button>
          </View>
        </CardShell>
      </View>
    );
  }

  if (!data.profileComplete) {
    return (
      <View style={styles.wrap}>
        <CardShell>
          <CardHeader />
          <View style={styles.body}>
            <Text style={[typography.body, styles.compactTitle, { color: theme.colors.onSurface }]}>
              {gramSahakariStrings.profileIncompleteTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {gramSahakariStrings.profileIncompleteBody}
            </Text>
            <Button
              mode="contained"
              compact
              onPress={() => router.push('/edit-profile' as Href)}
              style={styles.profileBtn}
            >
              {gramSahakariStrings.completeProfile}
            </Button>
          </View>
        </CardShell>
      </View>
    );
  }

  if (!data.available || data.representatives.length === 0) {
    return (
      <View style={styles.wrap}>
        <CardShell>
          <CardHeader />
          <View style={styles.body}>
            <Text style={[typography.body, styles.compactTitle, { color: theme.colors.onSurface }]}>
              {gramSahakariStrings.emptyTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {gramSahakariStrings.emptyBody}
            </Text>
          </View>
        </CardShell>
      </View>
    );
  }

  const fallback = data.matchLevel ? matchLevelFallback(data.matchLevel) : null;
  const reps = data.representatives;

  return (
    <View style={styles.wrap}>
      <CardShell>
        <CardHeader />
        <View style={styles.body}>
          {fallback ? (
            <View style={[styles.fallbackBanner, { backgroundColor: homeColors.supportWarm }]}>
              <Text style={[styles.fallbackTitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                {fallback.title}
              </Text>
            </View>
          ) : null}

          {reps.length === 1 ? (
            <RepresentativeTile rep={reps[0]} matchLevel={data.matchLevel} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {reps.map((rep) => (
                <View key={`${rep.phone}-${rep.name}`} style={styles.horizontalItem}>
                  <RepresentativeTile rep={rep} matchLevel={data.matchLevel} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </CardShell>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  shell: {
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: homeColors.divider,
    backgroundColor: homeColors.supportWarm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  headerSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  compactTitle: {
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
  },
  profileBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  retryBtn: {
    alignSelf: 'flex-start',
  },
  fallbackBanner: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  fallbackTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  repTile: {
    gap: spacing.sm,
  },
  repHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  repBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  repName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  repLocation: {
    fontSize: 11,
    lineHeight: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  whatsappBtn: {
    backgroundColor: palette.green100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.green500,
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  fallbackNote: {
    fontSize: 10,
    lineHeight: 14,
  },
  horizontalList: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  horizontalItem: {
    width: 260,
  },
  skeletonLine: {
    height: 12,
    borderRadius: radius.sm,
  },
  skeletonBlock: {
    height: 72,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
