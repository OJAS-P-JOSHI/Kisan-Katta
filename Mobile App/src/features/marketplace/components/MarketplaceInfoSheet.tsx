import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type MarketplaceInfoSheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

const SECTIONS = [
  {
    key: 'produce',
    icon: 'basket' as const,
    iconColor: palette.green700,
    wash: palette.green50,
    title: marketplaceStrings.infoSheet.produceTitle,
    body: marketplaceStrings.infoSheet.produceBody,
  },
  {
    key: 'product',
    icon: 'sack' as const,
    iconColor: palette.amber700,
    wash: palette.amber100,
    title: marketplaceStrings.infoSheet.productTitle,
    body: marketplaceStrings.infoSheet.productBody,
  },
  {
    key: 'labour',
    icon: 'account-hard-hat' as const,
    iconColor: palette.blue800,
    wash: palette.blue100,
    title: marketplaceStrings.infoSheet.labourTitle,
    body: marketplaceStrings.infoSheet.labourBody,
  },
] as const;

/** Bottom sheet explaining farmer-to-farmer marketplace sections. Presentation only. */
export function MarketplaceInfoSheet({ visible, onDismiss }: MarketplaceInfoSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const copy = marketplaceStrings.infoSheet;
  const maxBody = Math.round(Math.min(height * 0.62, 520));

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
            backgroundColor: mp.cream,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
            paddingLeft: spacing.md + Math.max(insets.left, 0),
            paddingRight: spacing.md + Math.max(insets.right, 0),
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={iconSize.lg}
              color={theme.colors.onPrimaryContainer}
            />
          </View>
          <Text
            style={[typography.sectionTitle, styles.headerTitle, { color: theme.colors.onSurface }]}
            maxFontSizeMultiplier={1.5}
          >
            {copy.title}
          </Text>
        </View>

        <ScrollView
          style={{ maxHeight: maxBody }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text
            style={[typography.body, styles.body, { color: theme.colors.onSurfaceVariant }]}
            maxFontSizeMultiplier={1.5}
          >
            {copy.body}
          </Text>

          <View style={styles.points}>
            {SECTIONS.map((section) => (
              <View key={section.key} style={styles.pointRow}>
                <View style={[styles.pointIcon, { backgroundColor: section.wash }]}>
                  <MaterialCommunityIcons
                    name={section.icon}
                    size={iconSize.md}
                    color={section.iconColor}
                  />
                </View>
                <View style={styles.pointText}>
                  <Text
                    style={[styles.pointTitle, { color: theme.colors.onSurface }]}
                    maxFontSizeMultiplier={1.5}
                  >
                    {section.title}
                  </Text>
                  <Text
                    style={[styles.pointBody, { color: theme.colors.onSurfaceVariant }]}
                    maxFontSizeMultiplier={1.5}
                  >
                    {section.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <Button
          mode="contained"
          onPress={onDismiss}
          style={styles.closeButton}
          contentStyle={styles.closeContent}
          labelStyle={styles.closeLabel}
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
    backgroundColor: 'rgba(11, 15, 12, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
    minWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  body: { lineHeight: 22 },
  points: { gap: spacing.sm },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
  },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pointText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingTop: 2,
  },
  pointTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  pointBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: { marginTop: spacing.xs, borderRadius: radius.md },
  closeContent: { minHeight: 48, paddingVertical: spacing.xs },
  closeLabel: { fontWeight: '700', letterSpacing: 0.2 },
});
