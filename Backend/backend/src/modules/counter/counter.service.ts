import { getNextSequence, peekSequence } from "./counter.repository";

/**
 * Thin service wrapper over the counter repository. Kept separate so callers
 * depend on the service layer (consistent with the rest of the project) rather
 * than the repository directly.
 */
export const nextSequence = (counterId: string): Promise<number> =>
  getNextSequence(counterId);

export const currentSequence = (counterId: string): Promise<number> =>
  peekSequence(counterId);
