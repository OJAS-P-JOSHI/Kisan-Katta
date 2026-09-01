import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { mp, mpCard } from '../marketplace.ui';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type FormSectionProps = {
  icon: IconName;
  title: string;
  hint?: string;
  children: ReactNode;
  accent?: string;
};

/** Visual grouping for create/edit listing fields. No form logic. */
export function FormSection({ icon, title, hint, children, accent }: FormSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={[styles.iconWrap, accent ? { backgroundColor: `${accent}18` } : null]}>
          <MaterialCommunityIcons name={icon} size={16} color={accent ?? mp.primaryGreen} />
        </View>
        <Text style={styles.title} maxFontSizeMultiplier={1.5}>
          {title}
        </Text>
      </View>
      {hint ? (
        <Text style={styles.hint} maxFontSizeMultiplier={1.5}>
          {hint}
        </Text>
      ) : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: mp.produceBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: mp.headingGreen,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  hint: {
    marginTop: -4,
    marginLeft: 36,
    color: mp.bodyGrey,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    ...mpCard,
    padding: 14,
    gap: 12,
  },
});
