import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, spacing, useAppTheme } from '@/theme';

import { COMMENTS_PAGE_SIZE } from '../farmer-price.constants';
import { farmerPriceStrings, getReasonTypeLabel } from '../farmer-price.strings';
import type { RecentInsightDTO, ReasonType } from '../farmer-price.types';
import { formatRelativeTime } from '../farmer-price.utils';

type CommentFilter =
  | 'ALL'
  | 'GOOD_QUALITY'
  | 'LOW_QUALITY'
  | 'STORAGE'
  | 'EXPORT'
  | 'TRANSPORT'
  | 'OTHER';

const FILTERS: { id: CommentFilter; label: string }[] = [
  { id: 'ALL', label: farmerPriceStrings.comments.filters.all },
  { id: 'GOOD_QUALITY', label: farmerPriceStrings.comments.filters.goodQuality },
  { id: 'LOW_QUALITY', label: farmerPriceStrings.comments.filters.lowQuality },
  { id: 'STORAGE', label: farmerPriceStrings.comments.filters.storage },
  { id: 'EXPORT', label: farmerPriceStrings.comments.filters.export },
  { id: 'TRANSPORT', label: farmerPriceStrings.comments.filters.transport },
  { id: 'OTHER', label: farmerPriceStrings.comments.filters.other },
];

function matchesFilter(reasonType: ReasonType, filter: CommentFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'GOOD_QUALITY':
      return reasonType === 'GOOD_QUALITY';
    case 'LOW_QUALITY':
      return reasonType === 'LOW_QUALITY';
    case 'STORAGE':
      return reasonType === 'STORAGE_AVAILABLE';
    case 'EXPORT':
      return reasonType === 'EXPORT_DEMAND';
    case 'TRANSPORT':
      return reasonType === 'HIGH_TRANSPORT_COST';
    case 'OTHER':
      return (
        reasonType === 'OTHER' ||
        reasonType === 'HIGH_DEMAND' ||
        reasonType === 'LOW_SUPPLY'
      );
    default:
      return true;
  }
}

function commentDotColor(reasonType: ReasonType): string {
  switch (reasonType) {
    case 'GOOD_QUALITY':
    case 'HIGH_DEMAND':
    case 'EXPORT_DEMAND':
      return palette.green700;
    case 'STORAGE_AVAILABLE':
    case 'LOW_SUPPLY':
      return palette.amber700;
    case 'LOW_QUALITY':
    case 'HIGH_TRANSPORT_COST':
      return palette.red700;
    default:
      return palette.steel;
  }
}

type CommentsBottomSheetProps = {
  visible: boolean;
  comments: RecentInsightDTO[];
  onDismiss: () => void;
};

/**
 * Custom modal bottom sheet for poll comments.
 * Filtering + pagination are local UI only — data comes from poll.recentInsights.
 */
export function CommentsBottomSheet({ visible, comments, onDismiss }: CommentsBottomSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(Dimensions.get('window').height * 0.72, 560);

  const [filter, setFilter] = useState<CommentFilter>('ALL');
  const [visibleCount, setVisibleCount] = useState(COMMENTS_PAGE_SIZE);

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(
    () => comments.filter((c) => matchesFilter(c.reasonType, filter)),
    [comments, filter],
  );

  const page = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (visible) {
      setFilter('ALL');
      setVisibleCount(COMMENTS_PAGE_SIZE);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(sheetHeight);
      backdrop.setValue(0);
    }
  }, [visible, backdrop, sheetHeight, translateY]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: sheetHeight, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [backdrop, onDismiss, sheetHeight, translateY]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((n) => n + COMMENTS_PAGE_SIZE);
  }, [hasMore]);

  const chipOpacity = useRef(new Animated.Value(1)).current;
  const onSelectFilter = useCallback(
    (id: CommentFilter) => {
      Animated.sequence([
        Animated.timing(chipOpacity, { toValue: 0.35, duration: 80, useNativeDriver: true }),
        Animated.timing(chipOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
      setFilter(id);
      setVisibleCount(COMMENTS_PAGE_SIZE);
    },
    [chipOpacity],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.45],
        }) }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} accessibilityRole="button" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {farmerPriceStrings.comments.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.comments.subtitle}
            </Text>
          </View>

          <Animated.View style={{ opacity: chipOpacity }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {FILTERS.map((item) => {
                const selected = item.id === filter;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectFilter(item.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: selected
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{farmerPriceStrings.comments.emptyEmoji}</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                {farmerPriceStrings.comments.emptyTitle}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.comments.emptyBody}
              </Text>
            </View>
          ) : (
            <FlatList
              data={page}
              keyExtractor={(item, index) => `${item.createdAt}-${item.reasonType}-${index}`}
              contentContainerStyle={styles.list}
              onEndReached={loadMore}
              onEndReachedThreshold={0.35}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.item,
                    index < page.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.badgeRow}>
                    <View
                      style={[styles.dot, { backgroundColor: commentDotColor(item.reasonType) }]}
                    />
                    <Text style={[styles.badge, { color: theme.colors.onSurface }]} numberOfLines={1}>
                      {getReasonTypeLabel(item.reasonType)}
                    </Text>
                    <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.body, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={3}
                  >
                    {item.reasonText}
                  </Text>
                </View>
              )}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.ink,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.md,
    gap: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  item: {
    paddingVertical: 12,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  badge: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
