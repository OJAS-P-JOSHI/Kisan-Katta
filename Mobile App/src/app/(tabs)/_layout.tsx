import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { PremiumTabBar } from '@/components/navigation/PremiumTabBar';
import { TabBarIcon, type TabIconPair } from '@/components/navigation/TabBarIcon';
import { tabBarColors, tabBarLayout, tabBarTokens } from '@/components/navigation/tabBar.theme';
import { strings } from '@/constants';
import { useAppTheme } from '@/theme';

type TabIconProps = { color: ColorValue; size: number; focused: boolean };

/** Outline/filled pairs — visual only; routes and titles unchanged. */
const TAB_ICONS = {
  home: { outline: 'home-outline', filled: 'home' },
  market: { outline: 'chart-box-outline', filled: 'chart-box' },
  farmerPrice: { outline: 'hand-coin-outline', filled: 'hand-coin' },
  marketplace: { outline: 'store-outline', filled: 'store' },
  assistance: { outline: 'hand-heart-outline', filled: 'hand-heart' },
  profile: { outline: 'account-circle-outline', filled: 'account-circle' },
} satisfies Record<string, TabIconPair>;

function makeTabIcon(pair: TabIconPair, label: string) {
  const Icon = ({ color, focused }: TabIconProps) => (
    <TabBarIcon pair={pair} label={label} color={color} focused={focused} />
  );
  Icon.displayName = `TabIcon(${pair.filled})`;
  return Icon;
}

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: tabBarColors.active,
        tabBarInactiveTintColor: tabBarColors.inactive,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: tabBarTokens.height,
          paddingTop: 0,
          paddingBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: tabBarLayout.item,
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.home,
          headerShown: false,
          tabBarIcon: makeTabIcon(TAB_ICONS.home, strings.tabs.home),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: strings.tabs.market,
          tabBarIcon: makeTabIcon(TAB_ICONS.market, strings.tabs.market),
        }}
      />
      <Tabs.Screen
        name="farmer-price"
        options={{
          title: strings.tabs.farmerPrice,
          headerShown: false,
          tabBarIcon: makeTabIcon(TAB_ICONS.farmerPrice, strings.tabs.farmerPrice),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: strings.tabs.marketplace,
          headerShown: false,
          tabBarIcon: makeTabIcon(TAB_ICONS.marketplace, strings.tabs.marketplace),
        }}
      />
      <Tabs.Screen
        name="assistance"
        options={{
          title: strings.tabs.assistance,
          headerShown: false,
          tabBarIcon: makeTabIcon(TAB_ICONS.assistance, strings.tabs.assistance),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: makeTabIcon(TAB_ICONS.profile, strings.tabs.profile),
        }}
      />
    </Tabs>
  );
}
