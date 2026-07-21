import { api } from '@/services/api';

import type {
  MyPollsResponse,
  PollDetailResponse,
  PollDetailResponseDTO,
  PollResponseDTO,
  SubmitVoteBody,
  SubmitVoteResponse,
} from './farmer-price.types';

const FARMER_PRICE_BASE = '/api/v1/farmer-price';
const MY_POLLS_ENDPOINT = `${FARMER_PRICE_BASE}/polls/my`;
const POLLS_ENDPOINT = `${FARMER_PRICE_BASE}/polls`;

/** Fetches open polls for the authenticated user's district + favourite crops. */
export const getMyPolls = async (): Promise<PollResponseDTO[]> => {
  const response = await api.get<MyPollsResponse>(MY_POLLS_ENDPOINT);
  return response.data.data;
};

/** Fetches a single poll with remaining time and recent insights. */
export const getPollById = async (pollId: string): Promise<PollDetailResponseDTO> => {
  const response = await api.get<PollDetailResponse>(`${POLLS_ENDPOINT}/${pollId}`);
  return response.data.data;
};

/**
 * Loads my polls and hydrates each with detail (insights + remainingHours).
 * Detail fetches run in parallel.
 */
export const getMyPollDetails = async (): Promise<PollDetailResponseDTO[]> => {
  const polls = await getMyPolls();
  if (polls.length === 0) return [];
  return Promise.all(polls.map((poll) => getPollById(poll.id)));
};

/** Submits a farmer expected-price vote for a poll. */
export const submitFarmerVote = async (
  pollId: string,
  body: SubmitVoteBody,
): Promise<PollDetailResponseDTO> => {
  const response = await api.post<SubmitVoteResponse>(
    `${POLLS_ENDPOINT}/${pollId}/vote`,
    body,
  );
  return response.data.data;
};
