import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import { createHelpRequest } from '../assistance.service';
import { getAssistanceErrorMessage } from '../assistance.errors';
import { AssistanceEmptyView, AssistanceErrorView, AssistanceLoadingView } from '../components/AssistanceStateViews';
import {
  HelpRequestForm,
  helpRequestFormScrollProps,
  type HelpRequestFormValues,
} from '../components/HelpRequestForm';
import { useMyAssistanceSummary } from '../hooks/useMyAssistanceSummary';
import { ProofPhotoUploadError, useProofPhotos } from '../hooks/useProofPhotos';

const MY_REQUESTS_HREF = '/assistance-my-requests' as Href;

/** Publishes a new help request. The server snapshots the author's profile and
 * publishes it as OPEN so other farmers can see it in the public feed. */
export default function CreateHelpRequestScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const photos = useProofPhotos();
  const summary = useMyAssistanceSummary();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pendingValuesRef = useRef<HelpRequestFormValues | null>(null);

  const publish = useCallback(
    async (values: HelpRequestFormValues) => {
      setSubmitting(true);
      setServerError(null);
      photos.clearUploadError();

      try {
        const images = await photos.uploadAll();
        const request = await createHelpRequest({ ...values, images });
        router.replace(`/assistance-request/${request.id}` as Href);
      } catch (err) {
        if (!(err instanceof ProofPhotoUploadError)) {
          setServerError(getAssistanceErrorMessage(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [photos, router],
  );

  const handleSubmit = useCallback(
    async (values: HelpRequestFormValues) => {
      pendingValuesRef.current = values;
      await publish(values);
    },
    [publish],
  );

  const handleRetryUpload = useCallback(() => {
    if (pendingValuesRef.current) {
      void publish(pendingValuesRef.current);
    }
  }, [publish]);

  if (summary.loading) {
    return <AssistanceLoadingView message={assistanceStrings.create.authorLoading} />;
  }

  if (summary.error) {
    return (
      <AssistanceErrorView
        title={assistanceStrings.feed.errorTitle}
        message={summary.error}
        onAction={summary.refresh}
      />
    );
  }

  if (!summary.data.canCreate) {
    return (
      <AssistanceEmptyView
        title={assistanceStrings.create.limitReachedTitle}
        message={assistanceStrings.create.limitReachedMessage}
        actionLabel={assistanceStrings.create.viewMyRequests}
        onAction={() => router.replace(MY_REQUESTS_HREF)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView {...helpRequestFormScrollProps}>
        <HelpRequestForm
          photos={photos}
          submitting={submitting}
          serverError={serverError}
          submitLabel={assistanceStrings.create.publish}
          submittingLabel={
            photos.isUploading
              ? assistanceStrings.images.uploading
              : assistanceStrings.create.publishing
          }
          onUploadRetry={handleRetryUpload}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
