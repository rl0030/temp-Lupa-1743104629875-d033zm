import {useMutation} from '@tanstack/react-query';
import {StripeCustomer} from '../../types/stripe';
import {addDoc, collection, getDocs, query, setDoc, where} from 'firebase/firestore';
import {db} from '../../services/firebase';
import {STRIPE_SECRET_KEY} from '../../api/env';

type CreateUserVariables = {
  name: string;
  email: string;
  uid: string;
};
const useCreateStripeUser = () => {
  const createUser = async (userData: CreateUserVariables) => {
    const userStripeDetailsRef = collection(db, 'user_stripe_details');
 
    const q = query(
      userStripeDetailsRef,
      where('lupa_uid', '==', userData.uid),
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
 
      return null;
    }

    const userDoc = querySnapshot.docs[0].data()
    const userDocRef = querySnapshot.docs[0].ref;


    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `name=${userData.name}&email=${userData.email}`,
    });

 
    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    const newUser: StripeCustomer = await response.json();

 

    if (userDocRef) {
      setDoc(userDocRef, {
        ...userDoc,
        customer_id: newUser.id
      })
    } else {
      addDoc(userStripeDetailsRef, {
        lupa_uid: userData.uid,
        customer_id: newUser.id,
      });
    }
  

    return newUser;
  };

  return useMutation({
    mutationFn: (userDetails: CreateUserVariables) => createUser(userDetails),
    mutationKey: ['create_customer'],
  });
};

export default useCreateStripeUser;
