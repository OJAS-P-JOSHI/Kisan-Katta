import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type ColorValue } from 'react-native';

import { tabBarAdapt, tabBarColors, tabBarTokens } from './tabBar.theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type TabIconPair = {
  outline: IconName;
  filled: IconName;
};

type TabBarIconProps = {
  pair: TabIconPair;
  label: string;
  color: ColorValue;
  focused: boolean;
};

export const TabBarIcon = memo(function TabBarIcon({ pair, label, color, focused }: TabBarIconProps) {
  const { width } = useWindowDimensions();
  const adapt = tabBarAdapt(width);

  return (
    <View style={styles.slot}>
      <View
        style={[
          styles.chip,
          { marginHorizontal: adapt.chipGap },
          focused && styles.chipActive,
        ]}
      >
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={focused ? pair.filled : pair.outline}
            color={focused ? tabBarColors.onPill : color}
            size={tabBarTokens.iconSize}
          />
        </View>
        <Text
          style={[
            styles.label,
            focused ? styles.labelActive : styles.labelInactive,
            {
              marginTop: tabBarTokens.labelGap,
              fontSize: adapt.labelSize,
              lineHeight: adapt.labelLineHeight,
            },
          ]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    height: tabBarTokens.slotHeight,
    alignItems: 'stretch',
    justifyContent: 'center',
    overflow: 'visible',
  },
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tabBarTokens.chipRadius,
    paddingTop: 4,
    paddingBottom: 3,
    paddingHorizontal: 1,
  },
  chipActive: {
    backgroundColor: tabBarColors.pill,
  },
  iconBox: {
    width: tabBarTokens.iconBox,
    height: tabBarTokens.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  labelInactive: {
    fontWeight: '500',
    color: tabBarColors.inactiveLabel,
  },
  labelActive: {
    fontWeight: '600',
    color: tabBarColors.onPill,
  },
});
