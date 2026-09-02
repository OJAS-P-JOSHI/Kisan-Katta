import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text, TextInput } from 'react-native-paper';

import { spacing, typography, useAppTheme } from '@/theme';

import { LISTING_REPORT_REASONS, REPORT_DETAILS_MAX_LENGTH } from '../marketplace.constants';
import { getListingReportReasonLabel, marketplaceStrings } from '../marketplace.strings';
import type { ListingReportReason, ReportListingPayload } from '../marketplace.types';

type ReportListingDialogProps = {
  visible: boolean;
  submitting: boolean;
  onDismiss: () => void;
  onSubmit: (payload: ReportListingPayload) => void;
};

/** Reason picker for reporting a marketplace listing. One report per user. */
export function ReportListingDialog({
  visible,
  submitting,
  onDismiss,
  onSubmit,
}: ReportListingDialogProps) {
  const theme = useAppTheme();
  const [reason, setReason] = useState<ListingReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);

  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) {
      setReason(null);
      setDetails('');
      setError(null);
    }
  }

  const handleSubmit = () => {
    if (!reason) {
      setError(marketplaceStrings.report.reasonRequired);
      return;
    }

    const trimmedDetails = details.trim();
    if (reason === 'OTHER' && trimmedDetails.length === 0) {
      setError(marketplaceStrings.report.detailsRequired);
      return;
    }

    setError(null);
    onSubmit(trimmedDetails.length > 0 ? { reason, details: trimmedDetails } : { reason });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={submitting ? undefined : onDismiss}>
        <Dialog.Title style={typography.sectionTitle}>
          {marketplaceStrings.report.title}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {marketplaceStrings.report.subtitle}
            </Text>

            <RadioButton.Group
              value={reason ?? ''}
              onValueChange={(value) => {
                setReason(value as ListingReportReason);
                setError(null);
              }}
            >
              {LISTING_REPORT_REASONS.map((item) => (
                <RadioButton.Item
                  key={item}
                  label={getListingReportReasonLabel(item)}
                  value={item}
                  position="leading"
                  disabled={submitting}
                  labelStyle={[typography.body, styles.radioLabel]}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>

            <TextInput
              mode="outlined"
              label={marketplaceStrings.report.detailsLabel}
              placeholder={marketplaceStrings.report.detailsPlaceholder}
              value={details}
              onChangeText={(value) => {
                setDetails(value.slice(0, REPORT_DETAILS_MAX_LENGTH));
                setError(null);
              }}
              multiline
              numberOfLines={3}
              maxLength={REPORT_DETAILS_MAX_LENGTH}
              disabled={submitting}
              style={styles.input}
            />

            {error ? (
              <Text style={[typography.caption, { color: theme.colors.error }]}>{error}</Text>
            ) : (
              <View style={styles.errorSpacer} />
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={submitting}>
            {marketplaceStrings.report.cancel}
          </Button>
          <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting}>
            {submitting ? marketplaceStrings.report.submitting : marketplaceStrings.report.submit}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: { paddingHorizontal: 0, maxHeight: 420 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  radioItem: { paddingHorizontal: 0, paddingVertical: 2 },
  radioLabel: { textAlign: 'left', flexShrink: 1 },
  input: { marginTop: spacing.xs },
  errorSpacer: { height: spacing.xs },
});
