import { useCallback, useState } from 'react';

import { getAssistanceErrorMessage } from '../assistance.errors';
import { deleteHelpRequest, resolveHelpRequest } from '../assistance.service';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';

export type LifecycleDialog = 'resolve' | 'delete' | null;

type UseHelpRequestLifecycleOptions = {
  onResolved?: (request: HelpRequest) => void;
  onDeleted?: (requestId: string) => void;
};

type UseHelpRequestLifecycleResult = {
  dialog: LifecycleDialog;
  loading: boolean;
  openResolveDialog: (requestId: string) => void;
  openDeleteDialog: (requestId: string) => void;
  closeDialog: () => void;
  /** Both confirms resolve with a snackbar message. */
  confirmResolve: () => Promise<string | null>;
  confirmDelete: () => Promise<string | null>;
};

/** Owner-only lifecycle actions: mark resolved and soft delete. */
export function useHelpRequestLifecycle(
  options: UseHelpRequestLifecycleOptions = {},
): UseHelpRequestLifecycleResult {
  const { onResolved, onDeleted } = options;
  const [dialog, setDialog] = useState<LifecycleDialog>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openResolveDialog = useCallback((requestId: string) => {
    setTargetId(requestId);
    setDialog('resolve');
  }, []);

  const openDeleteDialog = useCallback((requestId: string) => {
    setTargetId(requestId);
    setDialog('delete');
  }, []);

  const closeDialog = useCallback(() => {
    if (loading) return;
    setDialog(null);
    setTargetId(null);
  }, [loading]);

  const confirmResolve = useCallback(async (): Promise<string | null> => {
    if (!targetId || loading) return null;

    setLoading(true);
    try {
      const updated = await resolveHelpRequest(targetId);
      onResolved?.(updated);
      return assistanceStrings.lifecycle.resolved;
    } catch (error) {
      return getAssistanceErrorMessage(error);
    } finally {
      setLoading(false);
      setDialog(null);
      setTargetId(null);
    }
  }, [loading, onResolved, targetId]);

  const confirmDelete = useCallback(async (): Promise<string | null> => {
    if (!targetId || loading) return null;

    setLoading(true);
    try {
      const result = await deleteHelpRequest(targetId);
      onDeleted?.(result.id);
      return assistanceStrings.lifecycle.deleted;
    } catch (error) {
      return getAssistanceErrorMessage(error);
    } finally {
      setLoading(false);
      setDialog(null);
      setTargetId(null);
    }
  }, [loading, onDeleted, targetId]);

  return {
    dialog,
    loading,
    openResolveDialog,
    openDeleteDialog,
    closeDialog,
    confirmResolve,
    confirmDelete,
  };
}
