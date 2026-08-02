import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import { getPollById } from '../farmer-price.service';
import type { PollDetailResponseDTO, SubmittedVoteLocal } from '../farmer-price.types';
import { resolveDisplayVote } from '../farmer-price.utils';
import { getSubmittedVote } from '../farmer-price.vote-storage';

export type UseFarmerPricePollDetailReturn = {
  poll: PollDetailResponseDTO | null;
  /** Display vote: backend myVote, with optimistic SecureStore overlay after submit. */
  displayVote: SubmittedVoteLocal | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyVoteResult: (poll: PollDetailResponseDTO, vote: SubmittedVoteLocal) => void;
};

/** Single-poll detail. Voted state comes from poll.hasVoted (backend). */
export function useFarmerPricePollDetail(pollId: string): UseFarmerPricePollDetailReturn {
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [poll, setPoll] = useState<PollDetailResponseDTO | null>(null);
  const [optimisticVote, setOptimisticVote] = useState<SubmittedVoteLocal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh'): Promise<void> => {
      if (!pollId) {
        setLoading(false);
        return;
      }
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const [detail, cachedVote] = await Promise.all([
          getPollById(pollId),
          userId ? getSubmittedVote(userId, pollId) : Promise.resolve(null),
        ]);
        setPoll(detail);
        setOptimisticVote(cachedVote);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pollId, userId],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await load('refresh');
  }, [load]);

  const applyVoteResult = useCallback(
    (nextPoll: PollDetailResponseDTO, vote: SubmittedVoteLocal) => {
      setPoll(nextPoll);
      setOptimisticVote(vote);
    },
    [],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const displayVote = poll
    ? resolveDisplayVote(poll.id, poll.myVote, optimisticVote)
    : optimisticVote;

  return {
    poll,
    displayVote,
    loading,
    refreshing,
    error,
    refresh,
    applyVoteResult,
  };
}
