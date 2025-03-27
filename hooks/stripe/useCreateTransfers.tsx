import { useMutation } from '@tanstack/react-query';
import { httpsCallable, getFunctions } from 'firebase/functions';

export type TransferInfo = {
  amount: number;
  sellerId: string;
  platformPercentage: number;
  transferGroup: string;
};

export interface CreateTransfersResult {
  sellerTransfer: {
    id: string;
    object: string;
    amount: number;
    currency: string;
    destination: string;
    transfer_group: string;
    [key: string]: any;
  };
  platformAmount: number;
}

const createTransfers = async (
  paymentIntentId: string,
  transferInfo: TransferInfo,
  metadata: any
): Promise<CreateTransfersResult> => {
  const functions = getFunctions();
  const createTransfersFunction = httpsCallable<
    { paymentIntentId: string; transferInfo: TransferInfo; metadata: any; },
    CreateTransfersResult
  >(functions, 'createTransfers');

  try {
    const result = await createTransfersFunction({ paymentIntentId, transferInfo, metadata });
    return result.data;
  } catch (error) {
    console.error('Failed to create transfers:', error);
    throw new Error('Failed to process payment. Please try again or contact support.');
  }
};

export const useCreateTransfers = () => {
  return useMutation({
    mutationFn: async ({
      paymentIntentId,
      transferInfo,
      metadata
    }: {
      paymentIntentId: string;
      transferInfo: TransferInfo;
      metadata: any;
    }) => {
      return await createTransfers(paymentIntentId, transferInfo, metadata);
    },
  });
};

export default useCreateTransfers;