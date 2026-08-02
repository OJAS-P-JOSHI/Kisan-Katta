import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { getHelpRequestStatusLabel } from '../assistance.strings';
import type { HelpRequestStatus } from '../assistance.types';
import { getStatusChipColors } from '../assistance.utils';

type HelpRequestStatusChipProps = {
  status: HelpRequestStatus;
  compact?: boolean;
};

function HelpRequestStatusChipComponent({
  status,
  compact = true,
}: HelpRequestStatusChipProps) {
  const theme = useAppTheme();
  const colors = getStatusChipColors(status, theme);

  return (
    <Chip
      compact={compact}
      style={[styles.chip, { backgroundColor: colors.background }]}
      textStyle={[styles.chipText, { color: colors.text }]}
    >
      {getHelpRequestStatusLabel(status)}
    </Chip>
  );
}

export const HelpRequestStatusChip = memo(HelpRequestStatusChipComponent);

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
  chipText: { fontSize: 11, lineHeight: 14, marginVertical: 0 },
});
