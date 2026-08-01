import { useCallback, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { getErrorMessage } from '@/utils';

import {
  cancelSubscription,
  getBillingHistory,
  getCurrentSubscription,
  refreshSubscription,
} from '../subscription.service';
import type { BillingPaymentDTO, SubscriptionDTO } from '../subscription.types';

export function useSubscriptionBilling() {
  const { refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDTO | null>(null);
  const [history, setHistory] = useState<BillingPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [sub, bills] = await Promise.all([
        getCurrentSubscription(),
        getBillingHistory(),
      ]);
      setSubscription(sub);
      setHistory(bills);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load subscription details.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const syncFromGateway = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const refreshed = await refreshSubscription();
      setSubscription(refreshed);
      const bills = await getBillingHistory();
      setHistory(bills);
      await refreshUser();
    } catch (err) {
      // Refresh may 404 if no sub — fall back to local load.
      await load({ soft: true });
      setError(getErrorMessage(err, 'Unable to refresh subscription.'));
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshUser]);

  const cancel = useCallback(async (): Promise<boolean> => {
    setCancelling(true);
    setError(null);
    try {
      const updated = await cancelSubscription(true);
      setSubscription(updated);
      await refreshUser();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to cancel subscription.'));
      return false;
    } finally {
      setCancelling(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void load({ soft: true });
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [load]);

  return {
    subscription,
    history,
    loading,
    refreshing,
    cancelling,
    error,
    reload: load,
    syncFromGateway,
    cancel,
  };
}
