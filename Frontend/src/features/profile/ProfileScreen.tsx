import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Dialog, Portal, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { radius, spacing, useAppTheme } from '@/theme';

import { useMyProfile } from './hooks/useMyProfile';

function InfoRow({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
      <View style={styles.infoText}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const { data: profile, loading, error, refresh } = useMyProfile();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      // Stack.Protected reactively swaps to the Auth Stack once signed out;
      // Splash then redirects straight to the Mobile Number screen.
    } finally {
      setLoggingOut(false);
      setLogoutDialogVisible(false);
    }
  }, [logout]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.primary} />
        </View>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
          {profile?.name ?? '—'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.mobile ?? ''}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator animating size="small" style={styles.loader} color={theme.colors.primary} />
      ) : error ? (
        <Card mode="elevated" style={styles.card}>
          <Card.Content style={styles.errorContent}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
              {error}
            </Text>
            <Button compact mode="text" onPress={refresh}>
              {strings.market.retry}
            </Button>
          </Card.Content>
        </Card>
      ) : profile ? (
        <Card mode="elevated" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <InfoRow icon="map-marker-outline" label="District" value={profile.district} />
            <InfoRow icon="home-outline" label="Village" value={`${profile.village}, ${profile.taluka}`} />
            <InfoRow icon="sprout-outline" label="Favourite Crops" value={profile.favoriteCrops.join(', ')} />
          </Card.Content>
        </Card>
      ) : null}

      <Button
        mode="outlined"
        icon="account-edit-outline"
        style={styles.actionButton}
        onPress={() => router.push('/edit-profile')}
      >
        {strings.profile.editProfile}
      </Button>

      <Button
        mode="contained"
        icon="logout"
        buttonColor={theme.colors.errorContainer}
        textColor={theme.colors.onErrorContainer}
        style={styles.actionButton}
        onPress={() => setLogoutDialogVisible(true)}
      >
        {strings.profile.logout}
      </Button>

      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>{strings.profile.logoutConfirmTitle}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{strings.profile.logoutConfirmMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)} disabled={loggingOut}>
              {strings.profile.cancel}
            </Button>
            <Button onPress={handleLogout} loading={loggingOut} disabled={loggingOut}>
              {strings.profile.logout}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  loader: { marginTop: spacing.lg },
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardContent: { gap: spacing.md },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flex: 1 },
  actionButton: { marginTop: spacing.sm, borderRadius: radius.md },
});
