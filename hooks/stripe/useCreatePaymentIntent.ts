import { useMutation } from '@tanstack/react-query';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth } from '../../services/firebase';
import { Program } from '../../types/program';

export type CreatePaymentIntentVariables<T> = {
  price: string;
  product_uid: string;
  metadata: T,
  seller_id: string;
  platform_percentage: number;
};

type PaymentIntentResult = {
  paymentIntent: {
    id: string;
    client_secret: string;
    [key: string]: any;
  };
  transferInfo: {
    amount: number;
    sellerId: string;
    platformPercentage: number;
    transferGroup: string;
  };
};

const createPaymentIntent = async <T>(
  intentData: CreatePaymentIntentVariables<T>
): Promise<PaymentIntentResult> => {
  const functions = getFunctions();
  const createPaymentIntentFunction = httpsCallable<CreatePaymentIntentVariables<T>, PaymentIntentResult>(
    functions,
    'createPaymentIntent'
  );

  try {
    const result = await createPaymentIntentFunction(intentData);

    return result.data;
  } catch (error) {
    console.error('Error in createPaymentIntent:', error);
    throw error;
  }
};
//<ScheduledMeeting | Program>
const useCreatePaymentIntent = <T>() => {
  return useMutation<PaymentIntentResult, Error, CreatePaymentIntentVariables<T>>({
    mutationFn: createPaymentIntent,
    mutationKey: ['create_payment_intent', auth?.currentUser?.uid],
  });
};

export default useCreatePaymentIntent;