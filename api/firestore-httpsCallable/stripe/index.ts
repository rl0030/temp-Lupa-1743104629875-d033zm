import {httpsCallable} from 'firebase/functions';
import {functionsInstance} from '../../../services/firebase/functions';

export const getStripeBalance = httpsCallable(
  functionsInstance,
  'getStripeBalance',
);
export const initiateStripePayout = httpsCallable(
  functionsInstance,
  'initiateStripePayout',
);
export const getStripeAccountInfo = httpsCallable(
  functionsInstance,
  'getStripeAccountInfo',
);

export const getPayoutReports = httpsCallable(  functionsInstance, 'getPayoutReports');
export const generatePayoutReport = httpsCallable(  functionsInstance, 'generatePayoutReport');


export const getTaxTransactionsFunction = httpsCallable(functionsInstance, 'getTaxTransactions');

const getSellerPayments = httpsCallable(functionsInstance, 'getSellerPayments');

export const fetchSellerPaymentsByAccountId = async (account_id: string) => {
  try {
    return await getSellerPayments({sellerId: account_id, limit: 50})
      .then(result => {
        const {payments, hasMore} = result.data;

        return {
          payments,
          hasMore,
        };
      })
      .catch(error => {
        console.error('Error fetching seller payments:', error);
      });
  } catch (error) {
    throw error;
  }
};

export const fetchStripeAccountInfo = async (accountId: string) => {
  console.debug('Fetching Stripe account information for: ', accountId);
  try {
    const result = await getStripeAccountInfo({accountId});

    return result.data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Fetch the users stripe balance
 * @param accountId The stripe users account id
 * @returns
 */
export const fetchStripeBalance = async (accountId: string) => {
  try {
    const result = await getStripeBalance({accountId});
    return result.data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Initiates a payment into a user's account
 * @param accountId The stripe users account id
 * @param amount The amount of the balance to
 * @returns
 */
export const initiatePayout = async (accountId: string, amount: string) => {
  try {
    const balance = await getStripeBalance({accountId});

    if (Number(amount) > Number(balance.data)) {
      throw new Error('Requested amount must be lower than user balance.');
    }

    const result = await initiateStripePayout({accountId, amount});
    return result.data;
  } catch (error) {
    console.error('Error initiating payout:', error);
    throw error;
  }
};

// Fetch payout reports with transfer data
export const fetchPayoutReports = async () => {
  try {
    const result = await getPayoutReports();
    // @ts-ignore
    
    if (!result.data) {
      throw new Error("Internal Exception")
    }

    // @ts-ignore
    const { reports } = result.data
    return reports
    // Each report now includes a 'transfers' array
  } catch (error) {
    throw error;
  }
};
