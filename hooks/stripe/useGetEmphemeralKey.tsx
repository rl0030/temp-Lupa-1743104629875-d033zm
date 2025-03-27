import {useMutation, useQuery} from '@tanstack/react-query';
import {auth} from '../../services/firebase';
import {STRIPE_SECRET_KEY} from '../../api/env';

const useGetEmphemeralKey = (customerId: string) => {
  const getEmphemeralKey = async (customerId: string) => {

    const response = await fetch(`https://api.stripe.com/v1/ephemeral_keys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-04-10',
      },
      body: `customer=${customerId}`,
    });

    if (!response.ok) {
      throw new Error('Failed to get emphemeral key');
    }

    const data = await response.json();
    return data;
  };

  return useQuery({
    retry: false,
    queryKey: ['get_emphemeral_key', auth?.currentUser?.uid, customerId],
    queryFn: () => getEmphemeralKey(customerId),
    enabled: !!customerId,
  });
};

export default useGetEmphemeralKey;
