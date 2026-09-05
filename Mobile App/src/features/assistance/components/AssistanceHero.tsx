import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderLandscapeStrip, headerBandHeight } from '@/components/branding/HeaderLandscapeStrip';
import { HeaderActionCluster } from '@/components/navigation/AccountButton';
import { mp } from '@/features/marketplace/marketplace.ui';

import { assistanceStrings } from '../assistance.strings';

type AssistanceHeroProps = {
  onInfo: () => void;
};

/**
 * Marketplace-home header structure with साथ copy. Scenic strip, height,
 * padding, typography, and icon chrome match MarketplaceScreen.
 * My-requests lives with the create FAB — header only keeps the info action.
 */
export function AssistanceHero({ onInfo }: AssistanceHeroProps) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const headerH = headerBandHeight(insets.top);
  const narrow = width < 360;
  const largeType = fontScale > 1.2;
  const scale = Math.min(Math.max(width / 390, 0.82), 1.06);
  const padX = Math.max(14, Math.min(20, Math.round(18 * scale)));
  const titleSize = largeType ? (narrow ? 20 : 22) : narrow ? 22 : 24;
  const subSize = narrow ? 13 : 14;

  return (
    <View
      style={[
        styles.header,
        {
          minHeight: headerH,
          paddingTop: insets.top + 8,
          paddingLeft: padX + Math.max(insets.left, 0),
          paddingRight: padX + Math.max(insets.right, 0),
          paddingBottom: Math.round(headerH * 0.22),
        },
      ]}
    >
      <HeaderLandscapeStrip width={width} height={headerH} />
      <View style={styles.titleRow}>
        <Text
          style={[
            styles.screenTitle,
            { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.25) },
          ]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}
        >
          {assistanceStrings.feed.title}
        </Text>
        <HeaderActionCluster>
          <HeaderIconButton
            icon="information-outline"
            label={assistanceStrings.feed.infoA11y}
            onPress={onInfo}
          />
        </HeaderActionCluster>
      </View>
      <Text
        style={[
          styles.screenSubtitle,
          { fontSize: subSize, lineHeight: Math.round(subSize * 1.4) },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {assistanceStrings.feed.subtitle}
      </Text>
    </View>
  );
}

function HeaderIconButton({
  icon,
  label,
  onPress,
}: {
  icon: 'information-outline';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.infoBtn, pressed && styles.infoBtnPressed]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={mp.primaryGreen} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: mp.cream,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    color: mp.headingGreen,
    fontWeight: '800',
    letterSpacing: -0.35,
    flex: 1,
    minWidth: 0,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mp.white,
    borderWidth: 1,
    borderColor: mp.infoBorder,
    flexShrink: 0,
  },
  infoBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  screenSubtitle: {
    marginTop: 3,
    color: mp.tagline,
    fontWeight: '500',
  },
});
