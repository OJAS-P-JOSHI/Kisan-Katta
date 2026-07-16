import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { strings } from '@/constants';
import { palette, spacing, useAppTheme } from '@/theme';

type TabIconProps = { color: ColorValue; size: number; focused: boolean };

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <MaterialCommunityIcons
      name={name}
      color={color}
      size={focused ? 26 : 24}
      style={{ marginBottom: 1 }}
    />
  );
}

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: palette.steel,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          minHeight: 48,
        },
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
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <TabIcon name="home-variant" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: strings.tabs.market,
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <TabIcon name="chart-line" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="farmer-price"
        options={{
          title: strings.tabs.farmerPrice,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <TabIcon name="currency-inr" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: strings.tabs.marketplace,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <TabIcon name="storefront" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <TabIcon name="account-circle" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
