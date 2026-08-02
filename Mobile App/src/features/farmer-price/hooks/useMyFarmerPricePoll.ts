import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import { getMyPollDetails } from '../farmer-price.service';
import type { PollDetailResponseDTO, SubmittedVoteLocal } from '../farmer-price.types';
import { getAllSubmittedVotes } from '../farmer-price.vote-storage';

type LoadMode = 'initial' | 'refresh' | 'silent';

export type UseMyFarmerPricePollReturn = {
  polls: PollDetailResponseDTO[];
  /**
   * Optimistic thank-you snapshots only (SecureStore).
   * Voted CTAs must use poll.hasVoted from the backend.
   */
  optimisticVotes: Record<string, SubmittedVoteLocal>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Background re-fetch with no spinner — used when the screen regains focus. */
  revalidate: () => Promise<void>;
  setPollDetail: (poll: PollDetailResponseDTO) => void;
  setOptimisticVote: (vote: SubmittedVoteLocal) => void;
};

/**
 * Loads the farmer's active polls with detail payloads.
 * hasVoted / myVote come from the backend on each poll.
 */
export function useMyFarmerPricePoll(): UseMyFarmerPricePollReturn {
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [polls, setPolls] = useState<PollDetailResponseDTO[]>([]);
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, SubmittedVoteLocal>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Guards against a slow response overwriting a newer one. */
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode): Promise<void> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (mode === 'refresh') {
        setRefreshing(true);
      } else if (mode === 'initial') {
        setLoading(true);
      }
      if (mode !== 'silent') {
        setError(null);
      }

      try {
        if (!userId) {
          setPolls([]);
          setOptimisticVotes({});
          return;
        }
        const [details, cached] = await Promise.all([
          getMyPollDetails(),
          getAllSubmittedVotes(userId),
        ]);
        if (requestIdRef.current !== requestId) return;
        setPolls(details);
        setOptimisticVotes(cached);
        setError(null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(getErrorMessage(err));
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await load('refresh');
  }, [load]);

  const revalidate = useCallback(async (): Promise<void> => {
    await load('silent');
  }, [load]);

  const setPollDetail = useCallback((poll: PollDetailResponseDTO) => {
    setPolls((prev) => {
      const index = prev.findIndex((p) => p.id === poll.id);
      if (index === -1) return [poll, ...prev];
      const next = [...prev];
      next[index] = poll;
      return next;
    });
  }, []);

  const setOptimisticVote = useCallback((vote: SubmittedVoteLocal) => {
    setOptimisticVotes((prev) => ({ ...prev, [vote.pollId]: vote }));
  }, []);

  useEffect(() => {
    setOptimisticVotes({});
    void load('initial');
  }, [load]);

  return {
    polls,
    optimisticVotes,
    loading,
    refreshing,
    error,
    refresh,
    revalidate,
    setPollDetail,
    setOptimisticVote,
  };
}
