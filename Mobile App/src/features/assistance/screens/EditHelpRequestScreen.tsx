import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { EDITABLE_HELP_REQUEST_STATUSES } from '../assistance.constants';
import { getAssistanceErrorMessage } from '../assistance.errors';
import { getHelpRequestById, updateHelpRequest } from '../assistance.service';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import { AssistanceErrorView, AssistanceLoadingView } from '../components/AssistanceStateViews';
import {
  HelpRequestForm,
  helpRequestFormScrollProps,
  type HelpRequestFormValues,
} from '../components/HelpRequestForm';
import { ProofPhotoUploadError, useProofPhotos } from '../hooks/useProofPhotos';

const isEditable = (request: HelpRequest): boolean =>
  request.isOwner &&
  (EDITABLE_HELP_REQUEST_STATUSES as readonly string[]).includes(request.status);

function EditHelpRequestForm({ request }: { request: HelpRequest }) {
  const router = useRouter();
  const photos = useProofPhotos(request.images);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pendingValuesRef = useRef<HelpRequestFormValues | null>(null);

  const publishUpdate = useCallback(
    async (values: HelpRequestFormValues) => {
      setSubmitting(true);
      setServerError(null);
      photos.clearUploadError();

      try {
        const images = await photos.uploadAll();
        await updateHelpRequest(request.id, { ...values, images });
        router.back();
      } catch (err) {
        if (!(err instanceof ProofPhotoUploadError)) {
          setServerError(getAssistanceErrorMessage(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [photos, request.id, router],
  );

  const handleSubmit = useCallback(
    async (values: HelpRequestFormValues) => {
      pendingValuesRef.current = values;
      await publishUpdate(values);
    },
    [publishUpdate],
  );

  const handleRetryUpload = useCallback(() => {
    if (pendingValuesRef.current) {
      void publishUpdate(pendingValuesRef.current);
    }
  }, [publishUpdate]);

  return (
    <HelpRequestForm
      initialRequest={request}
      photos={photos}
      submitting={submitting}
      serverError={serverError}
      submitLabel={assistanceStrings.create.update}
      submittingLabel={
        photos.isUploading
          ? assistanceStrings.images.uploading
          : assistanceStrings.create.updating
      }
      onUploadRetry={handleRetryUpload}
      onSubmit={handleSubmit}
    />
  );
}

/** Authors may edit a request while it is still pending review or open. */
export default function EditHelpRequestScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError(assistanceStrings.errors.generic);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getHelpRequestById(id);
      setRequest(data);
    } catch (err) {
      setError(getAssistanceErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRequest();
  }, [fetchRequest]);

  if (loading) {
    return <AssistanceLoadingView message={assistanceStrings.detail.loading} />;
  }

  if (error || !request) {
    return (
      <AssistanceErrorView
        title={assistanceStrings.detail.errorTitle}
        message={error ?? assistanceStrings.errors.generic}
        onAction={fetchRequest}
      />
    );
  }

  if (!isEditable(request)) {
    return (
      <AssistanceErrorView
        title={assistanceStrings.detail.errorTitle}
        message={assistanceStrings.errors.cannotEdit}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView {...helpRequestFormScrollProps}>
        <EditHelpRequestForm key={request.id} request={request} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
