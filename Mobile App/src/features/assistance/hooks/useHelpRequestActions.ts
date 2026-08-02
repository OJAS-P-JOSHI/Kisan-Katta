import { useCallback, useState } from 'react';
import { Share } from 'react-native';

import { getAssistanceErrorMessage, isConflictError } from '../assistance.errors';
import { reportHelpRequest, supportHelpRequest } from '../assistance.service';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest, ReportHelpRequestPayload } from '../assistance.types';
import { buildHelpRequestShareMessage } from '../assistance.utils';

type UseHelpRequestActionsOptions = {
  /** Called with the patched request so lists and detail stay in sync. */
  onRequestUpdated?: (request: HelpRequest) => void;
};

type UseHelpRequestActionsResult = {
  supportingId: string | null;
  reportTarget: HelpRequest | null;
  reportSubmitting: boolean;
  /** Supports a request. Resolves with a snackbar message, or null on success. */
  support: (request: HelpRequest) => Promise<string | null>;
  share: (request: HelpRequest) => Promise<string | null>;
  openReport: (request: HelpRequest) => void;
  closeReport: () => void;
  submitReport: (payload: ReportHelpRequestPayload) => Promise<string | null>;
};

/**
 * Support / share / report actions shared by the feed card and the detail
 * screen. Support is a stance, never a payment.
 */
export function useHelpRequestActions(
  options: UseHelpRequestActionsOptions = {},
): UseHelpRequestActionsResult {
  const { onRequestUpdated } = options;
  const [supportingId, setSupportingId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<HelpRequest | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const support = useCallback(
    async (request: HelpRequest): Promise<string | null> => {
      if (supportingId) return null;
      if (request.isOwner) return assistanceStrings.support.ownRequest;
      if (request.hasSupported) return assistanceStrings.support.alreadySupported;
      if (request.status !== 'OPEN') return assistanceStrings.support.notOpen;

      setSupportingId(request.id);
      try {
        const result = await supportHelpRequest(request.id);
        onRequestUpdated?.({
          ...request,
          supportCount: result.supportCount,
          hasSupported: true,
        });
        return assistanceStrings.support.thanksMessage;
      } catch (error) {
        if (isConflictError(error)) {
          onRequestUpdated?.({ ...request, hasSupported: true });
          return assistanceStrings.support.alreadySupported;
        }
        return getAssistanceErrorMessage(error);
      } finally {
        setSupportingId(null);
      }
    },
    [onRequestUpdated, supportingId],
  );

  const share = useCallback(async (request: HelpRequest): Promise<string | null> => {
    try {
      await Share.share({
        message: buildHelpRequestShareMessage(request),
        title: assistanceStrings.share.dialogTitle,
      });
      return null;
    } catch {
      return assistanceStrings.share.failed;
    }
  }, []);

  const openReport = useCallback((request: HelpRequest) => {
    setReportTarget(request);
  }, []);

  const closeReport = useCallback(() => {
    setReportTarget(null);
  }, []);

  const submitReport = useCallback(
    async (payload: ReportHelpRequestPayload): Promise<string | null> => {
      if (!reportTarget) return null;

      setReportSubmitting(true);
      try {
        const result = await reportHelpRequest(reportTarget.id, payload);
        onRequestUpdated?.({
          ...reportTarget,
          reportCount: result.reportCount,
          hasReported: true,
        });
        setReportTarget(null);
        return assistanceStrings.report.success;
      } catch (error) {
        if (isConflictError(error)) {
          onRequestUpdated?.({ ...reportTarget, hasReported: true });
          setReportTarget(null);
          return assistanceStrings.report.alreadyReported;
        }
        return getAssistanceErrorMessage(error);
      } finally {
        setReportSubmitting(false);
      }
    },
    [onRequestUpdated, reportTarget],
  );

  return {
    supportingId,
    reportTarget,
    reportSubmitting,
    support,
    share,
    openReport,
    closeReport,
    submitReport,
  };
}
