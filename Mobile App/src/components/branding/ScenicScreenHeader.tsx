import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderActionCluster } from '@/components/navigation/AccountButton';
import { mp } from '@/features/marketplace/marketplace.ui';

import { HeaderLandscapeStrip, headerBandHeight } from './HeaderLandscapeStrip';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function scenicPadX(width: number): number {
  const scale = Math.min(Math.max(width / 390, 0.82), 1.06);
  return Math.max(14, Math.min(20, Math.round(18 * scale)));
}

type ScenicScreenHeaderProps = {
  title: string;
  subtitle: string;
  /** Extra header actions before the account button. */
  trailing?: ReactNode;
  titleNumberOfLines?: number;
};

/**
 * Marketplace-home header rhythm: scenic strip, cream fade, title + subtitle,
 * and the shared account control. Presentation only.
 */
export function ScenicScreenHeader({
  title,
  subtitle,
  trailing,
  titleNumberOfLines = 2,
}: ScenicScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const headerH = headerBandHeight(insets.top);
  const narrow = width < 360;
  const largeType = fontScale > 1.2;
  const padX = scenicPadX(width);
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
          numberOfLines={titleNumberOfLines}
          maxFontSizeMultiplier={1.5}
        >
          {title}
        </Text>
        <HeaderActionCluster>{trailing}</HeaderActionCluster>
      </View>
      <Text
        style={[
          styles.screenSubtitle,
          { fontSize: subSize, lineHeight: Math.round(subSize * 1.4) },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {subtitle}
      </Text>
    </View>
  );
}

type ScenicSectionHeadingProps = {
  icon: IconName;
  label: string;
};

export function ScenicSectionHeading({ icon, label }: ScenicSectionHeadingProps) {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 15 : 16;

  return (
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={17} color={mp.primaryGreen} />
      <Text
        style={[styles.sectionTitle, { fontSize: size, lineHeight: Math.round(size * 1.3) }]}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </View>
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
  screenSubtitle: {
    marginTop: 3,
    color: mp.tagline,
    fontWeight: '500',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: mp.headingGreen,
    fontWeight: '700',
    letterSpacing: -0.15,
    flex: 1,
    minWidth: 0,
  },
});
