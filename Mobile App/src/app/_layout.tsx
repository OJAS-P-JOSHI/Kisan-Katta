import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { marketplaceStrings } from '@/features/marketplace/marketplace.strings';
import { navigationTheme, paperTheme } from '@/theme';

/**
 * Protected Navigation: the App Stack (`(tabs)`) is only reachable once a
 * JWT exists AND the authenticated user's profile is complete. Everyone
 * else — signed out, or signed in but mid-onboarding — is confined to the
 * Auth Stack (`(auth)`), which itself starts at the Splash screen.
 */
function RootNavigator() {
  const { isAuthenticated, user } = useAuth();
  const canEnterApp = isAuthenticated && user?.isProfileCompleted === true;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={canEnterApp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: true, title: 'Edit Profile', presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-produce"
          options={{ headerShown: true, title: marketplaceStrings.listings.produceTitle, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-products"
          options={{ headerShown: true, title: marketplaceStrings.listings.productsTitle, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-listing/[id]"
          options={{ headerShown: true, title: marketplaceStrings.detail.title, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-create"
          options={{ headerShown: true, title: marketplaceStrings.create.title, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-edit/[id]"
          options={{ headerShown: true, title: marketplaceStrings.create.editTitle, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-my-listings"
          options={{ headerShown: true, title: marketplaceStrings.myListings.title, presentation: 'card' }}
        />
        <Stack.Screen
          name="marketplace-saved"
          options={{ headerShown: true, title: marketplaceStrings.saved.title, presentation: 'card' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!canEnterApp}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="dark" />
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
