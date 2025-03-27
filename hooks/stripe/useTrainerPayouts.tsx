import { useState, useEffect, useCallback } from 'react';
import { fetchSellerPaymentsByAccountId, fetchStripeAccountInfo, fetchStripeBalance, initiatePayout } from '../../api/firestore-httpsCallable/stripe';
import { fetchUserStripeAccountId } from '../../api/payments';
import useGetTaxTransactions from './useTaxTransactions';
import { ProductType, ProgramPurchasePaymentIntentMetadata, SellerPaymentsData, SessionPurchasePaymentIntentMetadata } from '../../types/purchase';

export interface TrainerPayoutsState {
  accountInfo: any;
  loading: boolean;
  error: string | null;
  accountId: string | null;
  balance: number;
  sellerPayments: Array<SellerPaymentsData<SessionPurchasePaymentIntentMetadata | ProgramPurchasePaymentIntentMetadata>>;
  taxTransactions: any;
}

export const useTrainerPayouts = () => {
  const [state, setState] = useState<TrainerPayoutsState>({
    accountInfo: null,
    loading: false,
    error: null,
    accountId: null,
    balance: 0,
    sellerPayments: [],
    taxTransactions: {}
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const id = state.accountId || await fetchUserStripeAccountId();
      if (id) {
        const [accountInfo, balanceData, sellerPaymentsData] = await Promise.all([
          fetchStripeAccountInfo(id),
          fetchStripeBalance(id),
          fetchSellerPaymentsByAccountId(id),
        ]);

        setState(prev => ({
          ...prev,
          accountId: id,
          accountInfo,
          balance: balanceData.available[0]?.amount || 0,
          sellerPayments: sellerPaymentsData?.payments || [],
        }));
      } else {
        throw new Error('Unable to find user Stripe account ID. Navigate to settings to enable payouts.');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.accountId]);

  const handleInitiatePayout = async () => {
    if (!state.accountId) {
      setState(prev => ({ ...prev, error: 'Account ID not found' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await initiatePayout(state.accountId, state.balance.toString());
      await fetchData();
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message || 'Failed to initiate payout' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...state,
    refreshData: fetchData,
    handleInitiatePayout,
  };
};