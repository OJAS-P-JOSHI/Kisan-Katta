import { requireOptionalNativeModule } from 'expo-modules-core';

import type { SubmittedVoteLocal } from './farmer-price.types';

/**
 * Persists submitted votes so thank-you cards survive pull-to-refresh.
 * Keys are scoped per authenticated user so multiple farmers on one device
 * never share thank-you state.
 *
 * Cache key format: `vote:<userId>:<pollId>`
 *
 * Backend has no "my vote" endpoint — this is UI-only cache.
 */
const STORAGE_KEY = 'farmerPriceSubmittedVotes';

type SecureStoreNative = {
  getValueWithKeyAsync: (key: string, options?: Record<string, unknown>) => Promise<string | null>;
  setValueWithKeyAsync: (value: string, key: string, options?: Record<string, unknown>) => Promise<void>;
};

let nativeStore: SecureStoreNative | null | undefined;
/** Full device map keyed by `vote:<userId>:<pollId>`. */
let memoryVotes: Record<string, SubmittedVoteLocal> = {};

function getNativeSecureStore(): SecureStoreNative | null {
  if (nativeStore !== undefined) return nativeStore;
  nativeStore = requireOptionalNativeModule<SecureStoreNative>('ExpoSecureStore');
  return nativeStore;
}

/** Builds the per-user cache key. */
export function voteCacheKey(userId: string, pollId: string): string {
  return `vote:${userId}:${pollId}`;
}

function isVoteKeyForUser(key: string, userId: string): boolean {
  return key.startsWith(`vote:${userId}:`);
}

function pollIdFromVoteKey(key: string, userId: string): string | null {
  const prefix = `vote:${userId}:`;
  if (!key.startsWith(prefix)) return null;
  const pollId = key.slice(prefix.length);
  return pollId.length > 0 ? pollId : null;
}

async function readAll(): Promise<Record<string, SubmittedVoteLocal>> {
  const store = getNativeSecureStore();
  if (!store) return memoryVotes;
  try {
    const raw = await store.getValueWithKeyAsync(STORAGE_KEY);
    if (!raw) return memoryVotes;
    const parsed = JSON.parse(raw) as Record<string, SubmittedVoteLocal>;
    memoryVotes = parsed;
    return parsed;
  } catch {
    return memoryVotes;
  }
}

async function writeAll(votes: Record<string, SubmittedVoteLocal>): Promise<void> {
  memoryVotes = votes;
  const store = getNativeSecureStore();
  if (!store) return;
  try {
    await store.setValueWithKeyAsync(JSON.stringify(votes), STORAGE_KEY);
  } catch {
    // Keep in-memory copy; persistence is best-effort.
  }
}

/**
 * Returns one vote for the given user + poll, or null.
 * Legacy pollId-only keys are ignored (never shared across users).
 */
export async function getSubmittedVote(
  userId: string,
  pollId: string,
): Promise<SubmittedVoteLocal | null> {
  if (!userId) return null;
  const all = await readAll();
  return all[voteCacheKey(userId, pollId)] ?? null;
}

/**
 * Returns this user's votes keyed by pollId (UI-friendly map).
 * Other users' entries on the device are never included.
 */
export async function getAllSubmittedVotes(
  userId: string,
): Promise<Record<string, SubmittedVoteLocal>> {
  if (!userId) return {};
  const all = await readAll();
  const result: Record<string, SubmittedVoteLocal> = {};
  for (const [key, vote] of Object.entries(all)) {
    const pollId = pollIdFromVoteKey(key, userId);
    if (pollId) {
      result[pollId] = vote;
    }
  }
  return result;
}

/** Saves a vote under `vote:<userId>:<pollId>`. */
export async function saveSubmittedVote(
  userId: string,
  vote: SubmittedVoteLocal,
): Promise<void> {
  if (!userId) return;
  const all = await readAll();
  all[voteCacheKey(userId, vote.pollId)] = vote;
  await writeAll(all);
}

/** Marks a poll as already voted for this user (no price details). */
export async function markAlreadyVoted(userId: string, pollId: string): Promise<void> {
  if (!userId) return;
  const existing = await getSubmittedVote(userId, pollId);
  if (existing) return;
  await saveSubmittedVote(userId, {
    pollId,
    expectedPrice: 0,
    submittedAt: new Date().toISOString(),
  });
}

/**
 * Deletes only this user's vote cache entries.
 * Does not touch other farmers' cached votes on the same device.
 *
 * Not called on logout by default — persisted thank-you state must survive
 * re-login for the same user. Cross-user isolation is handled by the key.
 */
export async function clearUserVoteCache(userId: string): Promise<void> {
  if (!userId) return;
  const all = await readAll();
  let changed = false;
  const next: Record<string, SubmittedVoteLocal> = {};
  for (const [key, vote] of Object.entries(all)) {
    if (isVoteKeyForUser(key, userId)) {
      changed = true;
      continue;
    }
    next[key] = vote;
  }
  if (changed) {
    await writeAll(next);
  }
}
