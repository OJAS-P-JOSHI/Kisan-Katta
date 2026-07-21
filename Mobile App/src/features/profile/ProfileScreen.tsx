import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLeaves } from '@/components/BrandLeaves';
import { OrganicBackground } from '@/components/OrganicBackground';
import { getMaharashtraCropLabel, strings } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  buttonSurface,
  cardSurface,
  iconSize,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { ProfileAvatar } from './components/ProfileAvatar';
import { useMyProfile } from './hooks/useMyProfile';
import { useProfilePhoto } from './hooks/useProfilePhoto';
import { profileStrings } from './profile.strings';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.sm} color={theme.colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '500' }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: profile, loading, error, refresh } = useMyProfile();
  const { displayUri, isBusy, showPhotoActions } = useProfilePhoto({
    profileImage: profile?.profileImage,
    refreshProfile: refresh,
  });
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

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

  const cropSummary =
    profile && profile.favoriteCrops.length > 0
      ? profileStrings.header.favoriteCrops(profile.favoriteCrops.length)
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarStage}>
            <BrandLeaves variant="profile" />
            <ProfileAvatar
              name={profile?.name ?? ''}
              imageUri={displayUri}
              uploading={isBusy}
              onPress={showPhotoActions}
            />
          </View>
          <Text style={[typography.largeHeading, { color: theme.colors.onBackground, textAlign: 'center' }]}>
            {profile?.name ?? '—'}
          </Text>
          {profile?.district ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker" size={iconSize.sm} color={theme.colors.primary} />
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
                {profile.district}
              </Text>
            </View>
          ) : null}
          {cropSummary ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="sprout" size={iconSize.sm} color={theme.colors.primary} />
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
                {cropSummary}
              </Text>
            </View>
          ) : null}
          {user?.mobile ? (
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {user.mobile}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator animating size="small" style={styles.loader} color={theme.colors.primary} />
        ) : error ? (
          <Card mode="elevated" style={[styles.card, cardSurface]}>
            <Card.Content style={styles.errorContent}>
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, flex: 1 }]}>
                {error}
              </Text>
              <Button compact mode="text" onPress={refresh}>
                {strings.market.retry}
              </Button>
            </Card.Content>
          </Card>
        ) : profile ? (
          <Card mode="elevated" style={[styles.card, cardSurface]}>
            <Card.Content style={styles.cardContent}>
              <InfoRow icon="map-marker-outline" label="District" value={profile.district} />
              <InfoRow icon="home-outline" label="Village" value={`${profile.village}, ${profile.taluka}`} />
              <InfoRow
                icon="sprout-outline"
                label="Favourite Crops"
                value={profile.favoriteCrops.map(getMaharashtraCropLabel).join(', ')}
              />
            </Card.Content>
          </Card>
        ) : null}

        <Button
          mode="outlined"
          icon="account-edit-outline"
          style={[styles.actionButton, buttonSurface]}
          contentStyle={styles.buttonContent}
          onPress={() => router.push('/edit-profile')}
        >
          {profileStrings.header.editProfile}
        </Button>

        <Button
          mode="contained"
          icon="logout"
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.onErrorContainer}
          style={[styles.actionButton, buttonSurface]}
          contentStyle={styles.buttonContent}
          onPress={() => setLogoutDialogVisible(true)}
        >
          {strings.profile.logout}
        </Button>

        <Portal>
          <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
            <Dialog.Title>{strings.profile.logoutConfirmTitle}</Dialog.Title>
            <Dialog.Content>
              <Text style={typography.body}>{strings.profile.logoutConfirmMessage}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  avatarStage: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loader: { marginTop: spacing.lg },
  card: { marginBottom: spacing.md },
  cardContent: { gap: spacing.md },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 2 },
  actionButton: { marginTop: spacing.sm },
  buttonContent: { minHeight: 48 },
});
