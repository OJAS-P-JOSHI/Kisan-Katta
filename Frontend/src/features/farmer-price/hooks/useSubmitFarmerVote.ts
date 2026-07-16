import { useCallback, useState } from 'react';

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

/** Submits a vote and persists a local thank-you snapshot. */
export function useSubmitFarmerVote(): UseSubmitFarmerVoteReturn {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (pollId: string, body: SubmitVoteBody): Promise<SubmitFarmerVoteResult> => {
      setSubmitting(true);
      try {
        const poll = await submitFarmerVote(pollId, body);
        const vote: SubmittedVoteLocal = {
          pollId,
          expectedPrice: body.expectedPrice,
          reasonType: body.reasonType,
          reasonText: body.reasonText,
          submittedAt: new Date().toISOString(),
        };
        await saveSubmittedVote(vote);
        return { ok: true, poll, vote };
      } catch (err) {
        const message = getErrorMessage(err);
        const alreadyVoted = message === 'Already Voted';
        if (alreadyVoted) {
          await markAlreadyVoted(pollId);
        }
        return { ok: false, message, alreadyVoted };
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { submitting, submit };
}
