import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text, TextInput } from 'react-native-paper';

import { spacing, typography, useAppTheme } from '@/theme';

import { REPORT_DETAILS_MAX_LENGTH, REPORT_REASONS } from '../assistance.constants';
import { assistanceStrings, getReportReasonLabel } from '../assistance.strings';
import type { ReportHelpRequestPayload, ReportReason } from '../assistance.types';

type ReportRequestDialogProps = {
  visible: boolean;
  submitting: boolean;
  onDismiss: () => void;
  onSubmit: (payload: ReportHelpRequestPayload) => void;
};

/** Reason picker for reporting a help request. One report per user per request. */
export function ReportRequestDialog({
  visible,
  submitting,
  onDismiss,
  onSubmit,
}: ReportRequestDialogProps) {
  const theme = useAppTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);

  // Clearing during render (instead of in an effect) keeps a reopened dialog blank
  // without an extra committed render showing the previous reason.
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
      setError(assistanceStrings.report.reasonRequired);
      return;
    }

    const trimmedDetails = details.trim();
    if (reason === 'OTHER' && trimmedDetails.length === 0) {
      setError(assistanceStrings.report.detailsRequired);
      return;
    }

    setError(null);
    onSubmit(
      trimmedDetails.length > 0 ? { reason, details: trimmedDetails } : { reason },
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={submitting ? undefined : onDismiss}>
        <Dialog.Title style={typography.sectionTitle}>
          {assistanceStrings.report.title}
        </Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {assistanceStrings.report.subtitle}
            </Text>

            <RadioButton.Group
              value={reason ?? ''}
              onValueChange={(value) => {
                setReason(value as ReportReason);
                setError(null);
              }}
            >
              {REPORT_REASONS.map((item) => (
                <RadioButton.Item
                  key={item}
                  label={getReportReasonLabel(item)}
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
              label={assistanceStrings.report.detailsLabel}
              placeholder={assistanceStrings.report.detailsPlaceholder}
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
            {assistanceStrings.report.cancel}
          </Button>
          <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting}>
            {submitting ? assistanceStrings.report.submitting : assistanceStrings.report.submit}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: { paddingHorizontal: 0 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  radioItem: { paddingHorizontal: 0, paddingVertical: 2 },
  radioLabel: { textAlign: 'left' },
  input: { marginTop: spacing.xs },
  errorSpacer: { height: spacing.xs },
});
