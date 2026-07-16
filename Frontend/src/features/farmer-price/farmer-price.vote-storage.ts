import { requireOptionalNativeModule } from 'expo-modules-core';

import type { SubmittedVoteLocal } from './farmer-price.types';

/**
 * Persists submitted votes so thank-you cards survive pull-to-refresh.
 * Uses SecureStore when available; falls back to in-memory map.
 * Backend has no "my vote" endpoint — this is UI-only cache.
 */
const STORAGE_KEY = 'farmerPriceSubmittedVotes';

type SecureStoreNative = {
  getValueWithKeyAsync: (key: string, options?: Record<string, unknown>) => Promise<string | null>;
  setValueWithKeyAsync: (value: string, key: string, options?: Record<string, unknown>) => Promise<void>;
};

let nativeStore: SecureStoreNative | null | undefined;
let memoryVotes: Record<string, SubmittedVoteLocal> = {};

function getNativeSecureStore(): SecureStoreNative | null {
  if (nativeStore !== undefined) return nativeStore;
  nativeStore = requireOptionalNativeModule<SecureStoreNative>('ExpoSecureStore');
  return nativeStore;
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

export async function getSubmittedVote(pollId: string): Promise<SubmittedVoteLocal | null> {
  const all = await readAll();
  return all[pollId] ?? null;
}

export async function getAllSubmittedVotes(): Promise<Record<string, SubmittedVoteLocal>> {
  return readAll();
}

export async function saveSubmittedVote(vote: SubmittedVoteLocal): Promise<void> {
  const all = await readAll();
  all[vote.pollId] = vote;
  await writeAll(all);
}

export async function markAlreadyVoted(pollId: string): Promise<void> {
  const existing = await getSubmittedVote(pollId);
  if (existing) return;
  await saveSubmittedVote({
    pollId,
    expectedPrice: 0,
    submittedAt: new Date().toISOString(),
  });
}
