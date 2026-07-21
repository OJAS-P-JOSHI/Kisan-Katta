import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSubmitFarmerVote } from '../hooks/useSubmitFarmerVote';
import type {
  PollDetailResponseDTO,
  ReasonType,
  SubmittedVoteLocal,
} from '../farmer-price.types';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { PollCard } from './PollCard';
import { ThankYouCard } from './ThankYouCard';
import { VoteCard } from './VoteCard';

type PollBlockProps = {
  poll: PollDetailResponseDTO;
  submittedVote: SubmittedVoteLocal | undefined;
  onVoted: (poll: PollDetailResponseDTO, vote: SubmittedVoteLocal) => void;
  onError: (message: string) => void;
  onAlreadyVoted: (pollId: string) => void;
};

export function PollBlock({
  poll,
  submittedVote,
  onVoted,
  onError,
  onAlreadyVoted,
}: PollBlockProps) {
  const { submitting, submit } = useSubmitFarmerVote();
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleSubmit = useCallback(
    async (payload: {
      expectedPrice: number;
      reasonType?: ReasonType;
      reasonText?: string;
    }) => {
      const result = await submit(poll.id, payload);
      if (!result.ok) {
        if (result.alreadyVoted) {
          onAlreadyVoted(poll.id);
        }
        onError(result.message);
        return;
      }
      onVoted(result.poll, result.vote);
    },
    [onAlreadyVoted, onError, onVoted, poll.id, submit],
  );

  return (
    <View style={styles.block}>
      <PollCard poll={poll} onViewComments={() => setCommentsOpen(true)}>
        {submittedVote ? (
          <ThankYouCard vote={submittedVote} />
        ) : (
          <VoteCard
            governmentPriceAvailable={poll.governmentPriceAvailable}
            governmentPriceSnapshot={poll.governmentPriceSnapshot}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </PollCard>

      <CommentsBottomSheet
        visible={commentsOpen}
        comments={poll.recentInsights}
        onDismiss={() => setCommentsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
});
