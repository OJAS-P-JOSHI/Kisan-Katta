import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconSize, spacing } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import { saath, saathShadow, saathText } from '../assistance.ui';

type AssistanceInfoSheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Lightweight bottom sheet explaining that Assistance is support — not money. */
export function AssistanceInfoSheet({ visible, onDismiss }: AssistanceInfoSheetProps) {
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
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={copy.close}
      />

      <View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={iconSize.lg}
              color={saath.primary}
            />
          </View>
          <Text style={[saathText.cardTitle, { color: saath.heading, flex: 1 }]}>
            {copy.title}
          </Text>
        </View>

        <Text style={[saathText.heroSubtitle, styles.body, { color: saath.body }]}>
          {copy.body}
        </Text>

        <View style={styles.points}>
          {copy.points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={iconSize.sm}
                color={saath.primary}
              />
              <Text style={[saathText.introBody, { color: saath.heading, flex: 1, fontSize: 14, lineHeight: 20 }]}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={onDismiss}
          style={styles.closeButton}
          contentStyle={styles.closeContent}
          buttonColor={saath.primary}
        >
          {copy.close}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 28, 25, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: saath.white,
    ...saathShadow.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    marginBottom: spacing.xs,
    backgroundColor: saath.disabled,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: saath.washStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { lineHeight: 22 },
  points: { gap: spacing.sm, marginTop: spacing.xs },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  closeButton: { marginTop: spacing.sm, borderRadius: 14 },
  closeContent: { paddingVertical: spacing.xs, minHeight: 48 },
});
