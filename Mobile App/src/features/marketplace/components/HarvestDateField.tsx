import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';
import {
  formatHarvestDateApi,
  formatHarvestDateDisplay,
  parseHarvestDateApi,
} from '../marketplace.utils';

type HarvestDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
};

export function HarvestDateField({
  value,
  onChange,
  error,
  label = marketplaceStrings.create.harvestDate,
  placeholder = marketplaceStrings.create.harvestDatePlaceholder,
}: HarvestDateFieldProps) {
  const theme = useAppTheme();
  const [iosVisible, setIosVisible] = useState(false);
  const [iosDate, setIosDate] = useState<Date>(() => parseHarvestDateApi(value) ?? new Date());

  const displayValue = value ? formatHarvestDateDisplay(value) : '';

  const applyDate = useCallback(
    (date: Date) => {
      onChange(formatHarvestDateApi(date));
    },
    [onChange],
  );

  const openPicker = useCallback(() => {
    const initial = parseHarvestDateApi(value) ?? new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        onValueChange: (_event, selectedDate) => {
          applyDate(selectedDate);
        },
      });
      return;
    }

    setIosDate(initial);
    setIosVisible(true);
  }, [applyDate, value]);

  const confirmIos = useCallback(() => {
    applyDate(iosDate);
    setIosVisible(false);
  }, [applyDate, iosDate]);

  return (
    <View>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            placeholder={placeholder}
            value={displayValue}
            editable={false}
            error={!!error}
            outlineColor={mp.searchBorder}
            activeOutlineColor={mp.primaryGreen}
            style={styles.input}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </Pressable>
      {error ? <HelperText type="error">{error}</HelperText> : null}

      {Platform.OS === 'ios' ? (
        <Portal>
          <Modal
            visible={iosVisible}
            onDismiss={() => setIosVisible(false)}
            contentContainerStyle={[styles.iosModal, { backgroundColor: theme.colors.surface }]}
          >
            <DateTimePicker
              value={iosDate}
              mode="date"
              display="spinner"
              onValueChange={(_event, selectedDate) => {
                setIosDate(selectedDate);
              }}
            />
            <Pressable onPress={confirmIos} style={styles.iosConfirm}>
              <Text variant="labelLarge" style={{ color: mp.primaryGreen }}>
                {marketplaceStrings.create.selectDate}
              </Text>
            </Pressable>
          </Modal>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: mp.white,
  },
  iosModal: {
    margin: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iosConfirm: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
});
