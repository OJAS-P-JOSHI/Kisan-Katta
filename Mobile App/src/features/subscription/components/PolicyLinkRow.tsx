import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Visual tokens copied from the Subscription paywall legal rows. */
const C = {
  primaryGreen: '#006A2C',
  brandGreen: '#0D5C2E',
  bodyGrey: '#6B6560',
  paleGreen: '#E8F5EC',
  white: '#FFFFFF',
  rowBorder: '#E6E2D8',
  title: '#1A1C19',
} as const;

export async function openPolicyUrl(url: string): Promise<void> {
  await Linking.openURL(url);
}

type PolicyLinkRowProps = {
  icon: IconName;
  title: string;
  hint: string;
  onPress: () => void;
};

export function PolicyLinkRow({ icon, title, hint, onPress }: PolicyLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.linkRow, pressed ? styles.linkPressed : null]}
    >
      <View style={styles.linkIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={C.primaryGreen} />
      </View>
      <View style={styles.linkText}>
        <Text style={styles.linkTitle} maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
        <Text style={styles.linkHint} numberOfLines={2} maxFontSizeMultiplier={1.5}>
          {hint}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={C.brandGreen}
        style={styles.linkChevron}
      />
    </Pressable>
  );
}

export function PolicyLinkDivider() {
  return <View style={styles.linkDivider} />;
}

type PolicyLinkCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PolicyLinkCard({ children, style }: PolicyLinkCardProps) {
  return <View style={[styles.linkCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  linkCard: {
    borderWidth: 1,
    borderColor: C.rowBorder,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.white,
    width: '100%',
    maxWidth: '100%',
  },
  linkRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  linkPressed: { backgroundColor: C.paleGreen },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkText: { flex: 1, minWidth: 0 },
  linkTitle: {
    color: C.title,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  linkHint: {
    marginTop: 2,
    color: C.bodyGrey,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  linkDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.rowBorder, marginLeft: 58 },
  linkChevron: { flexShrink: 0 },
});
