import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { MarketHeaderAccountButton } from '@/components/navigation/AccountButton';
import { PremiumTabBar } from '@/components/navigation/PremiumTabBar';
import { TabBarButton } from '@/components/navigation/TabBarButton';
import { tabIcons } from '@/components/navigation/tabBar.icons';
import { tabBarColors, tabBarLayout, tabBarTokens } from '@/components/navigation/tabBar.theme';
import { strings } from '@/constants';
import { useAppTheme } from '@/theme';

function renderPremiumTabBar(props: BottomTabBarProps) {
  return <PremiumTabBar {...props} />;
}

function TabBarBackground() {
  return <View />;
}

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      tabBar={renderPremiumTabBar}
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
        tabBarIconStyle: tabBarLayout.icon,
        tabBarButton: TabBarButton,
        tabBarHideOnKeyboard: true,
        tabBarBackground: TabBarBackground,
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
          tabBarIcon: tabIcons.home,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: strings.tabs.marketplace,
          headerShown: false,
          tabBarIcon: tabIcons.marketplace,
        }}
      />
      <Tabs.Screen
        name="assistance"
        options={{
          title: strings.tabs.assistance,
          headerShown: false,
          tabBarIcon: tabIcons.assistance,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: strings.tabs.market,
          tabBarIcon: tabIcons.market,
          headerRight: MarketHeaderAccountButton,
        }}
      />
      <Tabs.Screen
        name="farmer-price"
        options={{
          title: strings.tabs.farmerPrice,
          headerShown: false,
          tabBarIcon: tabIcons.farmerPrice,
        }}
      />
    </Tabs>
  );
}
