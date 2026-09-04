import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderLandscapeStrip, headerBandHeight } from '@/components/branding/HeaderLandscapeStrip';
import { strings } from '@/constants';
import { getCropLabel, useCrops } from '@/features/crop';
import { useAuth } from '@/features/auth/context/AuthContext';
import { iconSize, palette, radius, spacing, typography } from '@/theme';

import { ProfileActionSection, ProfileLogoutButton } from './components/ProfileActionSection';
import { ProfileHero } from './components/ProfileHero';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { ProfileLegalSection } from './components/ProfileLegalSection';
import { useMyProfile } from './hooks/useMyProfile';
import { useProfilePhoto } from './hooks/useProfilePhoto';
import { profileStrings } from './profile.strings';
import type { ProfileResponseDTO } from './profile.types';
import {
  profileAvatarSize,
  profileCard,
  profileNameSize,
  profilePadX,
  profileScrollBottomPad,
  profileUi,
} from './profile.ui';

function displayDistrict(profile: ProfileResponseDTO): string {
  return profile.location?.district?.name || profile.district || '—';
}

function displayTaluka(profile: ProfileResponseDTO): string {
  return profile.location?.taluka?.name || profile.taluka || '—';
}

function displayVillage(profile: ProfileResponseDTO): string {
  return profile.location?.village?.name || profile.village || '—';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { data: profile, loading, error, refresh } = useMyProfile();
  const { data: crops } = useCrops();
  const { displayUri, isBusy, showPhotoActions } = useProfilePhoto({
    profileImage: profile?.profileImage,
    refreshProfile: refresh,
  });
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [headerH, setHeaderH] = useState(() => headerBandHeight(0));

  const padX = profilePadX(width);
  const avatarSize = profileAvatarSize(width);
  const nameSize = profileNameSize(width);
  const minHeaderH = headerBandHeight(insets.top);
  const stripH = Math.max(headerH, minHeaderH);

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

  const cropLabels = profile
    ? profile.favoriteCrops.map((crop) => getCropLabel(crop, crops))
    : [];

  const district = profile ? displayDistrict(profile) : null;

  return (
    <View style={[styles.screen, { backgroundColor: profileUi.cream }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: profileScrollBottomPad(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            {
              minHeight: minHeaderH,
              paddingTop: insets.top + 8,
              paddingLeft: padX + Math.max(insets.left, 0),
              paddingRight: padX + Math.max(insets.right, 0),
              paddingBottom: Math.round(minHeaderH * 0.22),
            },
          ]}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            setHeaderH((prev) => (prev === next ? prev : next));
          }}
        >
          <HeaderLandscapeStrip width={width} height={stripH} />
          <ProfileHero
            name={profile ? profile.name : loading ? '' : '—'}
            imageUri={displayUri}
            uploading={isBusy}
            onPhotoPress={showPhotoActions}
            district={district && district !== '—' ? district : null}
            cropSummary={cropSummary}
            mobile={user?.mobile ?? null}
            avatarSize={avatarSize}
            nameSize={nameSize}
          />
        </View>

        <View style={[styles.body, { paddingHorizontal: padX }]}>
          {loading ? (
            <View style={[profileCard, styles.loadingCard]}>
              <ActivityIndicator animating size="small" color={profileUi.primary} />
            </View>
          ) : error ? (
            <View style={[profileCard, styles.errorCard]}>
              <View style={styles.errorIcon}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={iconSize.md}
                  color={palette.red700}
                />
              </View>
              <Text
                style={[typography.body, styles.errorText, { color: profileUi.muted }]}
                maxFontSizeMultiplier={1.35}
              >
                {error}
              </Text>
              <Button compact mode="text" onPress={refresh}>
                {strings.market.retry}
              </Button>
            </View>
          ) : profile ? (
            <ProfileInfoCard
              district={displayDistrict(profile)}
              taluka={displayTaluka(profile)}
              village={displayVillage(profile)}
              cropLabels={cropLabels}
            />
          ) : null}

          <ProfileActionSection
            onEdit={() => router.push('/edit-profile')}
            onMembership={() => router.push('/subscription-billing' as Href)}
          />

          <ProfileLegalSection />

          <ProfileLogoutButton onLogout={() => setLogoutDialogVisible(true)} />
        </View>

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
  content: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: profileUi.cream,
  },
  body: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  loadingCard: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: profileUi.logoutWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    flex: 1,
    minWidth: 0,
  },
});
