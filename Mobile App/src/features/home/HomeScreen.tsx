import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { GramSahakariCard } from '@/features/gram-sahakari/components/GramSahakariCard';
import { useGramSahakariRepresentative } from '@/features/gram-sahakari/hooks/useGramSahakariRepresentative';
import { useFavouriteMarketCards } from '@/features/market/hooks/useFavouriteMarketCards';
import { useMyMarketplaceSummary } from '@/features/marketplace/hooks/useMyMarketplaceSummary';
import { iconSize, spacing, typography, useAppTheme } from '@/theme';

import { DashboardHeader } from './components/DashboardHeader';
import { FavouriteCropsCard } from './components/FavouriteCropsCard';
import { ForecastList } from './components/ForecastList';
import { HomeBackground } from './components/HomeBackground';
import { HomeHeroShell } from './components/HomeHeroShell';
import { MarketSummaryCard } from './components/MarketSummaryCard';
import { MyMarketplaceCard } from './components/MyMarketplaceCard';
import { WeatherAlertCard } from './components/WeatherAlertCard';
import { WeatherCard } from './components/WeatherCard';
import { WeatherSection } from './components/WeatherSection';
import { WeatherCardSkeleton } from './components/WeatherSkeleton';
import { homeRhythm } from './home.theme';
import { useCurrentWeather } from './hooks/useCurrentWeather';
import { useForecast } from './hooks/useForecast';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';
import { getFarmingAdvice } from './weather.localization';

function WeatherErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.weatherError}>
      <MaterialCommunityIcons name="cloud-off-outline" size={iconSize.md} color={theme.colors.error} />
      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, flex: 1 }]}>
        {message}
      </Text>
      <Button compact mode="text" onPress={onRetry}>
        {strings.home.retry}
      </Button>
    </View>
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

  const {
    data: gramSahakari,
    loading: gramSahakariLoading,
    error: gramSahakariError,
    silentRefresh: refreshGramSahakari,
  } = useGramSahakariRepresentative();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshMarket(),
        refreshWeather(),
        refreshForecast(),
        refreshAlerts(),
        refreshMarketplaceSummary(),
        refreshGramSahakari(),
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
    refreshGramSahakari,
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

  const village =
    profile?.location?.village?.nameMr?.trim() ||
    profile?.location?.village?.name ||
    profile?.village;
  const taluka =
    profile?.location?.taluka?.nameMr?.trim() ||
    profile?.talukaNameMr?.trim() ||
    profile?.location?.taluka?.name ||
    profile?.taluka;
  const districtLabel =
    profile?.location?.district?.nameMr?.trim() ||
    profile?.districtNameMr?.trim() ||
    profile?.location?.district?.name ||
    profile?.district;

  const weatherLocationLabel = [village, taluka, districtLabel].filter(Boolean).join(' · ');

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <HomeBackground />
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
        <HomeHeroShell>
          <DashboardHeader
            name={profile?.name ?? strings.home.farmerFallback}
            village={village}
            taluka={taluka}
            district={districtLabel}
          />

          <WeatherSection>
            {weatherLoading && !weather ? (
              <WeatherCardSkeleton />
            ) : weatherError && !weather ? (
              <WeatherErrorCard message={weatherError} onRetry={refreshWeather} />
            ) : weather ? (
              <WeatherCard
                weather={weather}
                todayRainChance={todayRainChance}
                farmingAdvice={farmingAdvice}
                locationLabel={weatherLocationLabel || undefined}
              />
            ) : null}

            <WeatherAlertCard
              alerts={alerts}
              loading={alertsLoading}
              error={alertsError}
              onRetry={refreshAlerts}
              farmingAdvice={farmingAdvice}
            />
          </WeatherSection>
        </HomeHeroShell>

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

        <GramSahakariCard
          data={gramSahakari}
          loading={gramSahakariLoading}
          error={gramSahakariError}
          onRetry={() => {
            void refreshGramSahakari();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingBottom: spacing.xl + spacing.md,
    gap: homeRhythm.block,
  },
  weatherError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
});
