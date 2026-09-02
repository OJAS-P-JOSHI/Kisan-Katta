import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LocationDistrict } from '@/features/location/location.types';
import { spacing } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';
import type { ListingSortOption, ListingType } from '../marketplace.types';

export type DistrictFilterValue =
  | { mode: 'my' }
  | { mode: 'all' }
  | { mode: 'named'; district: string };

export type BrowseFilterValue = {
  district: DistrictFilterValue;
  sort: ListingSortOption;
};

type BrowseFilterSheetProps = {
  visible: boolean;
  value: BrowseFilterValue;
  profileDistrict?: string;
  districts: LocationDistrict[];
  listingType?: ListingType;
  onDismiss: () => void;
  onApply: (value: BrowseFilterValue) => void;
};

const districtDisplayName = (district: LocationDistrict): string =>
  district.nameMr?.trim() || district.name;

const sameDistrict = (left?: string, right?: string): boolean =>
  !!left && !!right && left.trim().toLowerCase() === right.trim().toLowerCase();

/** Compact district + sort sheet. Apply commits both to avoid duplicate fetches. */
export function BrowseFilterSheet({
  visible,
  value,
  profileDistrict,
  districts,
  listingType,
  onDismiss,
  onApply,
}: BrowseFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const copy = marketplaceStrings.filters;
  const [draft, setDraft] = useState<BrowseFilterValue>(value);

  const labourSort = listingType === 'labour';
  const maxBody = Math.round(Math.min(height * 0.7, 560));

  const sortOptions: { id: ListingSortOption; label: string }[] = [
    { id: 'newest', label: copy.sortNewest },
    {
      id: 'price_low_to_high',
      label: labourSort ? copy.sortRateLow : copy.sortPriceLow,
    },
    {
      id: 'price_high_to_low',
      label: labourSort ? copy.sortRateHigh : copy.sortPriceHigh,
    },
  ];

  const selectedNamed =
    draft.district.mode === 'named' ? draft.district.district : undefined;

  const districtOptions = useMemo(
    () =>
      districts.filter(
        (district) => !sameDistrict(district.name, profileDistrict),
      ),
    [districts, profileDistrict],
  );

  const isMySelected = draft.district.mode === 'my';
  const isAllSelected = draft.district.mode === 'all';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={copy.close}
      />

      <View
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
            paddingLeft: spacing.md + Math.max(insets.left, 0),
            paddingRight: spacing.md + Math.max(insets.right, 0),
          },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title} maxFontSizeMultiplier={1.4}>
          {copy.title}
        </Text>

        <ScrollView
          style={{ maxHeight: maxBody }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.section} maxFontSizeMultiplier={1.4}>
            📍 {copy.location}
          </Text>

          {profileDistrict ? (
            <FilterOption
              label={`${copy.myDistrict} · ${profileDistrict}`}
              selected={isMySelected}
              onPress={() => setDraft((prev) => ({ ...prev, district: { mode: 'my' } }))}
            />
          ) : null}

          <FilterOption
            label={copy.allDistricts}
            selected={isAllSelected}
            onPress={() => setDraft((prev) => ({ ...prev, district: { mode: 'all' } }))}
          />

          {districtOptions.length > 0 ? (
            <>
              <Text style={styles.subSection} maxFontSizeMultiplier={1.4}>
                {copy.otherDistricts}
              </Text>
              {districtOptions.map((district) => {
                const selected = sameDistrict(selectedNamed, district.name);
                return (
                  <FilterOption
                    key={district.code}
                    label={districtDisplayName(district)}
                    selected={selected}
                    onPress={() =>
                      setDraft((prev) => ({
                        ...prev,
                        district: { mode: 'named', district: district.name },
                      }))
                    }
                  />
                );
              })}
            </>
          ) : null}

          <Text style={[styles.section, styles.sortSection]} maxFontSizeMultiplier={1.4}>
            ↕ {copy.sort}
          </Text>
          {sortOptions.map((option) => (
            <FilterOption
              key={option.id}
              label={option.label}
              selected={draft.sort === option.id}
              onPress={() => setDraft((prev) => ({ ...prev, sort: option.id }))}
            />
          ))}
        </ScrollView>

        <Button
          mode="contained"
          onPress={() => onApply(draft)}
          buttonColor={mp.primaryGreen}
          textColor={mp.white}
          style={styles.apply}
          contentStyle={styles.applyContent}
        >
          {copy.apply}
        </Button>
      </View>
    </Modal>
  );
}

function FilterOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : null,
        pressed && styles.pressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={selected ? mp.primaryGreen : mp.muted}
      />
      <Text
        style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}
        numberOfLines={2}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 28, 25, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: mp.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: mp.searchBorder,
    marginBottom: 10,
  },
  title: {
    color: mp.headingGreen,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    gap: 6,
    paddingBottom: 12,
  },
  section: {
    color: mp.headingGreen,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  sortSection: {
    marginTop: 12,
  },
  subSection: {
    color: mp.tagline,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: mp.white,
    borderWidth: 1,
    borderColor: mp.searchBorder,
  },
  optionSelected: {
    backgroundColor: mp.produceBg,
    borderColor: 'rgba(0, 106, 44, 0.22)',
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    color: mp.tagline,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: mp.primaryGreen,
  },
  pressed: {
    opacity: 0.88,
  },
  apply: {
    marginTop: 8,
    borderRadius: 14,
  },
  applyContent: {
    minHeight: 48,
  },
});
