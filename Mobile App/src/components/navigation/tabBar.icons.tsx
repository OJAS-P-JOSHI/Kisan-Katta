import { type ColorValue } from 'react-native';

import { tabBarLabels } from './tabBar.labels';
import { tabBarColors } from './tabBar.theme';
import { TabBarIcon, type TabIconPair } from './TabBarIcon';

type TabIconProps = { color: ColorValue; size: number; focused: boolean };

const TAB_ICONS = {
  home: { outline: 'home-outline', filled: 'home' },
  market: { outline: 'chart-line', filled: 'chart-areaspline' },
  farmerPrice: { outline: 'hand-coin-outline', filled: 'hand-coin' },
  marketplace: { outline: 'storefront-outline', filled: 'storefront' },
  assistance: { outline: 'hand-heart-outline', filled: 'hand-heart' },
} satisfies Record<string, TabIconPair>;

function makeTabIcon(pair: TabIconPair, label: string) {
  const Icon = ({ focused }: TabIconProps) => (
    <TabBarIcon pair={pair} label={label} color={tabBarColors.inactive} focused={focused} />
  );
  Icon.displayName = `TabIcon(${pair.filled})`;
  return Icon;
}

export const tabIcons = {
  home: makeTabIcon(TAB_ICONS.home, tabBarLabels.home),
  market: makeTabIcon(TAB_ICONS.market, tabBarLabels.market),
  farmerPrice: makeTabIcon(TAB_ICONS.farmerPrice, tabBarLabels.farmerPrice),
  marketplace: makeTabIcon(TAB_ICONS.marketplace, tabBarLabels.marketplace),
  assistance: makeTabIcon(TAB_ICONS.assistance, tabBarLabels.assistance),
} as const;
