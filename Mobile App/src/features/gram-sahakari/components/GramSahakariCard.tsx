import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { memo, useCallback } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import {
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { homeColors, homeSpacing, homeSurfaces, homeText } from '@/features/home/home.theme';

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
      <Text style={[typography.sectionTitle, { color: theme.colors.primary }]}>{initial}</Text>
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
        <MaterialCommunityIcons name="phone" size={18} color={theme.colors.onPrimary} />
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
        <MaterialCommunityIcons name="whatsapp" size={18} color={palette.green900} />
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
        <View style={styles.avatarRing}>
          <RepresentativeAvatar name={rep.name} photoUrl={rep.photoUrl} />
        </View>
        <View style={styles.repBody}>
          <Text style={[styles.repName, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {rep.name}
          </Text>
          <Text
            style={[styles.repLocation, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {formatLocationLine(rep.village, rep.taluka, rep.district)}
          </Text>
        </View>
      </View>

      <ContactActions phone={rep.phone} />

      {matchLevel ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer }]}>
          <MaterialCommunityIcons
            name="shield-check"
            size={13}
            color={theme.colors.secondary}
          />
          <Text style={[typography.caption, { color: theme.colors.onSecondaryContainer, fontWeight: '600', fontSize: 10 }]}>
            {matchLevelBadge(matchLevel)}
          </Text>
        </View>
      ) : null}

      {fallback ? (
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs, fontSize: 11 }]}>
          {fallback.body}
        </Text>
      ) : null}
    </View>
  );
}

function GramSahakariSkeleton() {
  const theme = useAppTheme();
  return (
    <Card mode="elevated" style={[styles.card, homeSurfaces.support]}>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceVariant, width: '55%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceVariant, width: '80%', marginTop: spacing.sm }]} />
        <View style={[styles.skeletonBlock, { backgroundColor: theme.colors.surfaceVariant }]} />
      </Card.Content>
    </Card>
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
        <SectionHeading />
        <GramSahakariSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <SectionHeading />
        <Card mode="elevated" style={[styles.card, homeSurfaces.support]}>
          <Card.Content style={styles.cardContent}>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {error ?? gramSahakariStrings.loadError}
            </Text>
            <Button compact mode="text" onPress={onRetry}>
              {gramSahakariStrings.retry}
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!data.profileComplete) {
    return (
      <View style={styles.wrap}>
        <SectionHeading />
        <Card mode="elevated" style={[styles.card, homeSurfaces.support]}>
          <Card.Content style={styles.cardContent}>
            <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
              {gramSahakariStrings.profileIncompleteTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
              {gramSahakariStrings.profileIncompleteBody}
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: spacing.md }}
              onPress={() => router.push('/edit-profile' as Href)}
            >
              {gramSahakariStrings.completeProfile}
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!data.available || data.representatives.length === 0) {
    return (
      <View style={styles.wrap}>
        <SectionHeading />
        <Card mode="elevated" style={[styles.card, homeSurfaces.support]}>
          <Card.Content style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="account-group-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600', marginTop: spacing.sm }]}>
              {gramSahakariStrings.emptyTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
              {gramSahakariStrings.emptyBody}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const fallback = data.matchLevel ? matchLevelFallback(data.matchLevel) : null;
  const reps = data.representatives;

  return (
    <View style={styles.wrap}>
      <SectionHeading />
      <Card mode="elevated" style={[styles.card, homeSurfaces.support]}>
        <View style={[styles.supportBanner, homeSurfaces.supportHeader]}>
          <MaterialCommunityIcons name="account-supervisor-outline" size={18} color={homeColors.supportAccent} />
          <Text style={[styles.supportTagline, { color: homeColors.inkSoft }]}>
            {gramSahakariStrings.subtitle}
          </Text>
        </View>
        <Card.Content style={styles.cardContent}>
          {fallback ? (
            <View style={[styles.fallbackBanner, { backgroundColor: homeColors.supportWarm }]}>
              <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontWeight: '600', fontSize: 11 }]}>
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

          <Text style={[typography.caption, { color: theme.colors.outline, marginTop: spacing.sm, textAlign: 'center', fontSize: 10 }]}>
            {gramSahakariStrings.brand}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
});

function SectionHeading() {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: palette.amber100 }]}>
        <MaterialCommunityIcons name="account-supervisor" size={iconSize.sm} color={homeColors.supportAccent} />
      </View>
      <View style={styles.sectionTitleBlock}>
        <Text style={[homeText.sectionUtility, { color: theme.colors.onBackground }]}>
          {gramSahakariStrings.title}
        </Text>
        <Text style={[homeText.marathiCaption, { color: homeColors.inkMuted, fontSize: 11 }]} numberOfLines={1}>
          {gramSahakariStrings.subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: homeSpacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: homeSpacing.horizontal,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  card: {
    borderColor: homeColors.supportBorder,
    overflow: 'hidden',
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  supportTagline: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  cardContent: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBanner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  repTile: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.supportBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: palette.white,
  },
  repHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  repBody: {
    flex: 1,
    minWidth: 0,
  },
  repName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  repLocation: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: homeColors.supportBorder,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  whatsappBtn: {
    backgroundColor: palette.green100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.green500,
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  horizontalList: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  horizontalItem: {
    width: 280,
  },
  skeletonLine: {
    height: 14,
    borderRadius: radius.sm,
  },
  skeletonBlock: {
    height: 120,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
});
