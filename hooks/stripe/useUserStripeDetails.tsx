import {useQuery} from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {db} from '../../services/firebase';

interface UserStripeDetails {
  lupa_uid: string;
  stripe_account_id: string;
  customer_id: string;
}

const useUserStripeDetails = (uid: string) => {
  return useQuery<UserStripeDetails | null, Error>({
    queryKey: ['userStripeDetails', uid],
    queryFn: async () => {
      const userStripeDetailsCollection = collection(db, 'user_stripe_details');
      const q = query(
        userStripeDetailsCollection,
        where('lupa_uid', '==', uid),
      );

      console.log("SKSKSK")
      console.log(uid)

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Assuming there's only one document per user
        const doc = querySnapshot.docs[0];
        return {id: doc.id, ...doc.data()} as UserStripeDetails;
      }

      return null; 
    },
    enabled: !!uid, 
  });
};

export default useUserStripeDetails;
