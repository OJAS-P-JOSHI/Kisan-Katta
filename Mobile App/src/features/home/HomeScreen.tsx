import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import type { ComponentProps } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganicBackground } from '@/components/OrganicBackground';
import { strings } from '@/constants';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { useCurrentWeather } from './hooks/useCurrentWeather';
import { useForecast } from './hooks/useForecast';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';

import { DashboardHeader } from './components/DashboardHeader';
import { ForecastList } from './components/ForecastList';
import { PlaceholderCard } from './components/PlaceholderCard';
import { WeatherAlertCard } from './components/WeatherAlertCard';
import { WeatherCard } from './components/WeatherCard';
import { WeatherCardSkeleton } from './components/WeatherSkeleton';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function SectionHeader({ icon, title }: { icon: IconName; title: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.sm} color={theme.colors.primary} />
      </View>
      <Text style={[typography.sectionTitle, { color: theme.colors.onBackground }]}>
        {title}
      </Text>
    </View>
  );
}

function WeatherErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <Card mode="elevated" style={[styles.errorCard, cardSurface]}>
      <Card.Content style={styles.errorContent}>
        <MaterialCommunityIcons name="cloud-off-outline" size={iconSize.md} color={theme.colors.error} />
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, flex: 1 }]}>
          {message}
        </Text>
        <Button compact mode="text" onPress={onRetry}>
          {strings.home.retry}
        </Button>
      </Card.Content>
    </Card>
  );
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, refresh: refreshProfile } = useMyProfile();
  const district = profile?.district;

  const { data: weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } =
    useCurrentWeather(district);
  const { data: forecast, loading: forecastLoading, error: forecastError, refresh: refreshForecast } =
    useForecast(district);
  const { data: alerts, loading: alertsLoading, error: alertsError, refresh: refreshAlerts } =
    useWeatherAlerts(district);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refreshWeather(), refreshForecast(), refreshAlerts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile, refreshWeather, refreshForecast, refreshAlerts]);

  const todayRainChance =
    forecast.length > 0 ? forecast[0].dailyChanceOfRain : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xs }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <DashboardHeader
          name={profile?.name ?? 'Farmer'}
          village={profile?.village}
          taluka={profile?.taluka}
          district={profile?.district}
        />

        <SectionHeader icon="weather-partly-cloudy" title={strings.home.weatherTitle} />

        {weatherLoading && !weather ? (
          <WeatherCardSkeleton />
        ) : weatherError && !weather ? (
          <WeatherErrorCard message={weatherError} onRetry={refreshWeather} />
        ) : weather ? (
          <WeatherCard weather={weather} todayRainChance={todayRainChance} />
        ) : null}

        <WeatherAlertCard
          alerts={alerts}
          loading={alertsLoading}
          error={alertsError}
          onRetry={refreshAlerts}
        />

        <ForecastList
          days={forecast}
          loading={forecastLoading}
          error={forecastError}
          onRetry={refreshForecast}
        />

        <PlaceholderCard
          icon="leaf"
          title={strings.home.cropsTitle}
          subtitle={strings.home.cropsSubtitle}
          message={strings.home.cropsComing}
        />
        <PlaceholderCard
          icon="chart-line"
          title={strings.home.marketTitle}
          subtitle={strings.home.marketSubtitle}
          message={strings.home.marketComing}
        />
        <PlaceholderCard
          icon="file-document-outline"
          title={strings.home.govTitle}
          subtitle={strings.home.govSubtitle}
          message={strings.home.govComing}
        />
        <PlaceholderCard
          icon="newspaper-variant-outline"
          title={strings.home.newsTitle}
          subtitle={strings.home.newsSubtitle}
          message={strings.home.newsComing}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
