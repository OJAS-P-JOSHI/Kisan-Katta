import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import { submitFarmerVote } from '../farmer-price.service';
import type {
  PollDetailResponseDTO,
  SubmitVoteBody,
  SubmittedVoteLocal,
} from '../farmer-price.types';
import { markAlreadyVoted, saveSubmittedVote } from '../farmer-price.vote-storage';

export type SubmitFarmerVoteResult =
  | { ok: true; poll: PollDetailResponseDTO; vote: SubmittedVoteLocal }
  | { ok: false; message: string; alreadyVoted: boolean };

export type UseSubmitFarmerVoteReturn = {
  submitting: boolean;
  submit: (pollId: string, body: SubmitVoteBody) => Promise<SubmitFarmerVoteResult>;
};

/** Submits a vote and persists a local thank-you snapshot for this user only. */
export function useSubmitFarmerVote(): UseSubmitFarmerVoteReturn {
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (pollId: string, body: SubmitVoteBody): Promise<SubmitFarmerVoteResult> => {
      setSubmitting(true);
      try {
        if (!userId) {
          return { ok: false, message: 'Not authenticated.', alreadyVoted: false };
        }

        const poll = await submitFarmerVote(pollId, body);
        const vote: SubmittedVoteLocal = {
          pollId,
          expectedPrice: body.expectedPrice,
          reasonType: body.reasonType,
          reasonText: body.reasonText,
          submittedAt: new Date().toISOString(),
        };
        await saveSubmittedVote(userId, vote);
        return { ok: true, poll, vote };
      } catch (err) {
        const message = getErrorMessage(err);
        const alreadyVoted = message === 'Already Voted';
        if (alreadyVoted && userId) {
          await markAlreadyVoted(userId, pollId);
        }
        return { ok: false, message, alreadyVoted };
      } finally {
        setSubmitting(false);
      }
    },
    [userId],
  );

  return { submitting, submit };
}
