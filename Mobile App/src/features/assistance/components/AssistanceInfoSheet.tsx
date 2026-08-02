import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';

type AssistanceInfoSheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Lightweight bottom sheet explaining that Assistance is support — not money. */
export function AssistanceInfoSheet({ visible, onDismiss }: AssistanceInfoSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const copy = assistanceStrings.infoSheet;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(11,15,12,0.45)' }]}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={copy.close}
      />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="information-outline"
              size={iconSize.lg}
              color={theme.colors.onPrimaryContainer}
            />
          </View>
          <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, flex: 1 }]}>
            {copy.title}
          </Text>
        </View>

        <Text style={[typography.body, styles.body, { color: theme.colors.onSurfaceVariant }]}>
          {copy.body}
        </Text>

        <View style={styles.points}>
          {copy.points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={iconSize.sm}
                color={theme.colors.primary}
              />
              <Text style={[typography.body, { color: theme.colors.onSurface, flex: 1 }]}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <Button mode="contained" onPress={onDismiss} style={styles.closeButton} contentStyle={styles.closeContent}>
          {copy.close}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { lineHeight: 22 },
  points: { gap: spacing.sm, marginTop: spacing.xs },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  closeButton: { marginTop: spacing.sm, borderRadius: radius.md },
  closeContent: { paddingVertical: spacing.xs },
});
