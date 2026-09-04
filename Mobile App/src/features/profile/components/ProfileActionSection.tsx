import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { strings } from '@/constants';
import { billingStrings } from '@/features/subscription/billing.strings';
import { buttonSurface, radius, spacing, useAppTheme } from '@/theme';

import { profileStrings } from '../profile.strings';

type ProfileActionSectionProps = {
  onEdit: () => void;
  onMembership: () => void;
};

export function ProfileActionSection({ onEdit, onMembership }: ProfileActionSectionProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.section}>
      <Button
        mode="contained"
        icon="account-edit-outline"
        onPress={onEdit}
        style={[styles.button, buttonSurface]}
        contentStyle={styles.content}
        labelStyle={styles.label}
      >
        {profileStrings.header.editProfile}
      </Button>

      <Button
        mode="outlined"
        icon="credit-card-outline"
        onPress={onMembership}
        style={[
          styles.button,
          buttonSurface,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.primaryContainer },
        ]}
        contentStyle={styles.content}
        labelStyle={styles.label}
        textColor={theme.colors.primary}
      >
        {billingStrings.profileEntry}
      </Button>
    </View>
  );
}

type ProfileLogoutButtonProps = {
  onLogout: () => void;
};

export function ProfileLogoutButton({ onLogout }: ProfileLogoutButtonProps) {
  const theme = useAppTheme();

  return (
    <Button
      mode="contained"
      icon="logout"
      onPress={onLogout}
      buttonColor={theme.colors.errorContainer}
      textColor={theme.colors.onErrorContainer}
      style={[styles.button, buttonSurface]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {strings.profile.logout}
    </Button>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm + 4,
    marginTop: spacing.xs,
    width: '100%',
  },
  button: {
    borderRadius: radius.lg,
    alignSelf: 'stretch',
    elevation: 0,
  },
  content: {
    minHeight: 52,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
