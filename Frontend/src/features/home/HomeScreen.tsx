import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import type { ComponentProps } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { radius, spacing, useAppTheme } from '@/theme';

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
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
      <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
        {title}
      </Text>
    </View>
  );
}

function WeatherErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <Card mode="elevated" style={styles.errorCard}>
      <Card.Content style={styles.errorContent}>
        <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.error} />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
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
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
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
        location={profile ? `${profile.village}, ${profile.district}` : undefined}
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
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  errorCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.lg },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
