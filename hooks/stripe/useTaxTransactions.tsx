import { useMutation } from '@tanstack/react-query';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { functionsInstance } from '../../services/firebase/functions';
import { getTaxTransactionsFunction } from '../../api/firestore-httpsCallable/stripe';

const useGetTaxTransactions = () => {

  return useMutation({
    mutationFn: async ({ accountId, time_created_utc }: { accountId: string; time_created_utc: number }) => {
      const result = await getTaxTransactionsFunction({ accountId, time_created_utc });
   
      return result.data as { 
        downloadUrl: string; 
        reportId: string;
        startDate: number;
        endDate: number;
      };
    },
  });
};

export default useGetTaxTransactions;