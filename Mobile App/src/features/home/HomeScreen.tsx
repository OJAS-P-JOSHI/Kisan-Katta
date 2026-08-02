import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import type { ComponentProps } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganicBackground } from '@/components/OrganicBackground';
import { strings } from '@/constants';
import { useFavouriteMarketCards } from '@/features/market/hooks/useFavouriteMarketCards';
import { useMyMarketplaceSummary } from '@/features/marketplace/hooks/useMyMarketplaceSummary';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { useCurrentWeather } from './hooks/useCurrentWeather';
import { useForecast } from './hooks/useForecast';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';

import { DashboardHeader } from './components/DashboardHeader';
import { FavouriteCropsCard } from './components/FavouriteCropsCard';
import { ForecastList } from './components/ForecastList';
import { MarketSummaryCard } from './components/MarketSummaryCard';
import { MyMarketplaceCard } from './components/MyMarketplaceCard';
import { PlaceholderCard } from './components/PlaceholderCard';
import { WeatherAlertCard } from './components/WeatherAlertCard';
import { WeatherCard } from './components/WeatherCard';
import { WeatherCardSkeleton } from './components/WeatherSkeleton';
import { getFarmingAdvice } from './weather.localization';

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

  const {
    profile,
    pricedCards,
    favoriteCrops,
    loading: marketLoading,
    settled: marketSettled,
    profileLoading,
    profileError,
    refresh: refreshMarket,
  } = useFavouriteMarketCards();

  const district = profile?.district;

  const { data: weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } =
    useCurrentWeather(district);
  const { data: forecast, loading: forecastLoading, error: forecastError, refresh: refreshForecast } =
    useForecast(district);
  const { data: alerts, loading: alertsLoading, error: alertsError, refresh: refreshAlerts } =
    useWeatherAlerts(district);

  const {
    data: marketplaceSummary,
    loading: marketplaceSummaryLoading,
    error: marketplaceSummaryError,
    refresh: refreshMarketplaceSummary,
  } = useMyMarketplaceSummary();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshMarket(),
        refreshWeather(),
        refreshForecast(),
        refreshAlerts(),
        refreshMarketplaceSummary(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshMarket,
    refreshWeather,
    refreshForecast,
    refreshAlerts,
    refreshMarketplaceSummary,
  ]);

  const todayRainChance =
    forecast.length > 0 ? forecast[0].dailyChanceOfRain : undefined;

  const hasAlerts = (alerts?.length ?? 0) > 0;
  const farmingAdvice = weather
    ? getFarmingAdvice({
        condition: weather.condition,
        temperatureC: weather.temperatureC,
        rainChance: todayRainChance,
        windKph: weather.windKph,
        hasAlerts,
      })
    : undefined;

  const marketError =
    profileError && pricedCards.length === 0
      ? profileError
      : null;

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
          name={profile?.name ?? strings.home.farmerFallback}
          village={
            profile?.location?.village?.nameMr?.trim() ||
            profile?.location?.village?.name ||
            profile?.village
          }
          taluka={
            profile?.location?.taluka?.nameMr?.trim() ||
            profile?.talukaNameMr?.trim() ||
            profile?.location?.taluka?.name ||
            profile?.taluka
          }
          district={
            profile?.location?.district?.nameMr?.trim() ||
            profile?.districtNameMr?.trim() ||
            profile?.location?.district?.name ||
            profile?.district
          }
        />

        <SectionHeader icon="weather-partly-cloudy" title={strings.home.weatherTitle} />

        {weatherLoading && !weather ? (
          <WeatherCardSkeleton />
        ) : weatherError && !weather ? (
          <WeatherErrorCard message={weatherError} onRetry={refreshWeather} />
        ) : weather ? (
          <WeatherCard
            weather={weather}
            todayRainChance={todayRainChance}
            farmingAdvice={farmingAdvice}
          />
        ) : null}

        <WeatherAlertCard
          alerts={alerts}
          loading={alertsLoading}
          error={alertsError}
          onRetry={refreshAlerts}
          farmingAdvice={farmingAdvice}
        />

        <ForecastList
          days={forecast}
          loading={forecastLoading}
          error={forecastError}
          onRetry={refreshForecast}
        />

        <FavouriteCropsCard
          crops={favoriteCrops}
          loading={profileLoading && !profile}
        />

        <MarketSummaryCard
          pricedCards={pricedCards}
          favoriteCropsCount={favoriteCrops.length}
          loading={marketLoading}
          settled={marketSettled}
          error={marketError}
          onRetry={() => {
            void refreshMarket();
          }}
        />

        <MyMarketplaceCard
          summary={marketplaceSummary}
          loading={marketplaceSummaryLoading}
          error={marketplaceSummaryError}
          onRetry={() => {
            void refreshMarketplaceSummary();
          }}
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
  content: { paddingBottom: spacing.xxl + spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
});
