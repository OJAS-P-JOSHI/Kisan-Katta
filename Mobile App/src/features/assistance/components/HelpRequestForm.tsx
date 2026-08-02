import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { radius, spacing, typography, useAppTheme } from '@/theme';

import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  TITLE_MAX_LENGTH,
} from '../assistance.constants';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import type { UseProofPhotosReturn } from '../hooks/useProofPhotos';
import { AuthorAutoFillCard } from './AuthorAutoFillCard';
import { ProofPhotoPicker } from './ProofPhotoPicker';

export type HelpRequestFormValues = {
  title: string;
  description: string;
};

type HelpRequestFormProps = {
  initialRequest?: HelpRequest;
  photos: UseProofPhotosReturn;
  submitting: boolean;
  serverError?: string | null;
  submitLabel: string;
  submittingLabel: string;
  onUploadRetry?: () => void;
  onSubmit: (values: HelpRequestFormValues) => void | Promise<void>;
};

type FieldErrors = Partial<Record<keyof HelpRequestFormValues | 'photos' | 'profile', string>>;

/**
 * Title, description, and proof photos — the only three inputs a farmer fills.
 * Author identity comes from the profile snapshot the server builds.
 */
export function HelpRequestForm({
  initialRequest,
  photos,
  submitting,
  serverError,
  submitLabel,
  submittingLabel,
  onUploadRetry,
  onSubmit,
}: HelpRequestFormProps) {
  const theme = useAppTheme();
  const { data: profile, loading: profileLoading } = useMyProfile();
  const [values, setValues] = useState<HelpRequestFormValues>(() => ({
    title: initialRequest?.title ?? '',
    description: initialRequest?.description ?? '',
  }));
  const [errors, setErrors] = useState<FieldErrors>({});

  const isBusy = submitting || photos.isUploading;
  const trimmedDescriptionLength = values.description.trim().length;
  const profileReady =
    !!profile?.name?.trim() &&
    !!profile?.village?.trim() &&
    !!profile?.taluka?.trim() &&
    !!profile?.district?.trim();

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (!profileReady) {
      nextErrors.profile = assistanceStrings.validation.profileRequired;
    }

    if (title.length === 0) {
      nextErrors.title = assistanceStrings.validation.titleRequired;
    } else if (title.length > TITLE_MAX_LENGTH) {
      nextErrors.title = assistanceStrings.validation.titleTooLong;
    }

    if (description.length === 0) {
      nextErrors.description = assistanceStrings.validation.descriptionRequired;
    } else if (description.length < DESCRIPTION_MIN_LENGTH) {
      nextErrors.description = assistanceStrings.validation.descriptionTooShort;
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
      nextErrors.description = assistanceStrings.validation.descriptionTooLong;
    }

    if (!photos.hasPhotos) {
      nextErrors.photos = assistanceStrings.validation.photosRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isBusy || profileLoading) return;
    if (!validate()) return;

    void onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
    });
  };

  return (
    <View style={styles.form}>
      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
        {assistanceStrings.create.intro}
      </Text>

      <AuthorAutoFillCard />
      {errors.profile ? <HelperText type="error">{errors.profile}</HelperText> : null}

      <TextInput
        mode="outlined"
        label={assistanceStrings.create.titleLabel}
        placeholder={assistanceStrings.create.titlePlaceholder}
        value={values.title}
        onChangeText={(title) => {
          setValues((current) => ({ ...current, title: title.slice(0, TITLE_MAX_LENGTH) }));
          setErrors((current) => ({ ...current, title: undefined }));
        }}
        maxLength={TITLE_MAX_LENGTH}
        error={!!errors.title}
        disabled={isBusy}
      />
      <HelperText type={errors.title ? 'error' : 'info'} visible>
        {errors.title ?? assistanceStrings.create.titleHelper(values.title.trim().length)}
      </HelperText>

      <TextInput
        mode="outlined"
        label={assistanceStrings.create.descriptionLabel}
        placeholder={assistanceStrings.create.descriptionPlaceholder}
        value={values.description}
        onChangeText={(description) => {
          setValues((current) => ({
            ...current,
            description: description.slice(0, DESCRIPTION_MAX_LENGTH),
          }));
          setErrors((current) => ({ ...current, description: undefined }));
        }}
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
        numberOfLines={8}
        style={styles.descriptionInput}
        error={!!errors.description}
        disabled={isBusy}
      />
      <HelperText type={errors.description ? 'error' : 'info'} visible>
        {errors.description ?? assistanceStrings.create.descriptionHelper(trimmedDescriptionLength)}
      </HelperText>

      <View style={styles.photosBlock}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
          {assistanceStrings.create.photosLabel}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          {assistanceStrings.create.photosHelper}
        </Text>
        <ProofPhotoPicker photos={photos} disabled={isBusy} onRetry={onUploadRetry} />
        {errors.photos ? <HelperText type="error">{errors.photos}</HelperText> : null}
      </View>

      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {assistanceStrings.create.moderationNotice}
      </Text>

      {serverError ? <HelperText type="error">{serverError}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isBusy}
        disabled={isBusy || profileLoading || !profileReady}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isBusy ? submittingLabel : submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xs },
  descriptionInput: { minHeight: 160 },
  photosBlock: { gap: spacing.xs, marginTop: spacing.sm },
  submitButton: { marginTop: spacing.md, borderRadius: radius.md },
  submitButtonContent: { paddingVertical: spacing.sm, minHeight: 48 },
});

export const helpRequestFormScrollProps = {
  contentContainerStyle: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  keyboardShouldPersistTaps: 'handled' as const,
};
