import {useQuery} from '@tanstack/react-query';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {StripeCustomer} from '../../types/stripe';
import {STRIPE_API_CUSTOMERS} from '../../api/url';
import {STRIPE_SECRET_KEY} from '../../api/env';
import {db} from '../../services/firebase';

const useCustomerDetails = (uid: string) => {
  const fetchUserStripeDetails = async () => {
    const userStripeDetailsRef = collection(db, 'user_stripe_details');
    const q = query(userStripeDetailsRef, where('lupa_uid', '==', uid));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const customerId = doc.data().customer_id;

      if (!customerId) {
        return null;
      }

      const response = await fetch(`${STRIPE_API_CUSTOMERS}/${customerId}`, {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }

      const customerData = await response.json();

      return customerData;
    }

    return null;
  };

  return useQuery<any, Error, StripeCustomer>({
    queryKey: ['userStripeDetails', uid],
    queryFn: fetchUserStripeDetails,
  });
};

export default useCustomerDetails;
