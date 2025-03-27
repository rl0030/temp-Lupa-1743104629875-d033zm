import { query, collection, where, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { STRIPE_API_PAYMENT_INTENTS } from "../url";
import { STRIPE_SECRET_KEY } from "../env";

export const fetchUserStripeAccountId = async (): Promise<string | null> => {
    console.debug(`Fetching stripe account id for: ${auth?.currentUser?.uid}`)
    try {
      const queryResult = query(
        collection(db, 'user_stripe_details'),
        where('lupa_uid', '==', auth?.currentUser?.uid as string),
        limit(1),
      );
  
      const querySnapshot = await getDocs(queryResult);
  
      if (querySnapshot.empty) {
        console.log('No matching documents found for user');
        return null;
      }

      const docData = querySnapshot.docs[0].data();
      const accountId = docData['stripe_account_id'];
  
      if (!accountId) {
        console.log('Stripe account ID not found in document');
        return null;
      }
  
      return accountId;
    } catch (error) {
      console.error('Error fetching user account ID:', error);
      return null;
    }
  }

  export const fetchUpdatedPaymentIntent = async (paymentIntentId: string) => {
    const response = await fetch(
      `${STRIPE_API_PAYMENT_INTENTS}/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch updated PaymentIntent');
    }

    return await response.json();
  };

