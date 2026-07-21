import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import { getMyPollDetails } from '../farmer-price.service';
import type { PollDetailResponseDTO, SubmittedVoteLocal } from '../farmer-price.types';
import { getAllSubmittedVotes } from '../farmer-price.vote-storage';

export type UseMyFarmerPricePollReturn = {
  polls: PollDetailResponseDTO[];
  /** Thank-you cache for the authenticated user only, keyed by pollId. */
  submittedVotes: Record<string, SubmittedVoteLocal>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setPollDetail: (poll: PollDetailResponseDTO) => void;
  setSubmittedVote: (vote: SubmittedVoteLocal) => void;
};

/**
 * Loads the farmer's active polls (district + favourite crops) with detail
 * payloads, plus this user's locally cached submitted votes for thank-you cards.
 */
export function useMyFarmerPricePoll(): UseMyFarmerPricePollReturn {
  const { user } = useAuth();
  const userId = user?.userId ?? null;

  const [polls, setPolls] = useState<PollDetailResponseDTO[]>([]);
  const [submittedVotes, setSubmittedVotes] = useState<Record<string, SubmittedVoteLocal>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh'): Promise<void> => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        if (!userId) {
          setPolls([]);
          setSubmittedVotes({});
          return;
        }
        const [details, votes] = await Promise.all([
          getMyPollDetails(),
          getAllSubmittedVotes(userId),
        ]);
        setPolls(details);
        setSubmittedVotes(votes);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  const refresh = useCallback(async (): Promise<void> => {
    await load('refresh');
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

  const setSubmittedVote = useCallback((vote: SubmittedVoteLocal) => {
    setSubmittedVotes((prev) => ({ ...prev, [vote.pollId]: vote }));
  }, []);

  useEffect(() => {
    // Reset UI cache immediately when the authenticated user changes.
    setSubmittedVotes({});
    void load('initial');
  }, [load]);

  return {
    polls,
    submittedVotes,
    loading,
    refreshing,
    error,
    refresh,
    setPollDetail,
    setSubmittedVote,
  };
}
