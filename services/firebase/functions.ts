import {getFunctions, httpsCallable} from 'firebase/functions';
import {getAuth} from 'firebase/auth';
import app, {db} from '.';
import {collection, getDocs, query, updateDoc, where} from 'firebase/firestore';

export const functionsInstance = getFunctions(app);
const auth = getAuth(app);

export const createAccountLink = async () => {
  try {
    // Ensure the user is logged in
    if (!auth.currentUser) {
      throw new Error('User must be logged in to create an account link');
    }

    // Get the current user's ID token
    const idToken = await auth.currentUser.getIdToken();

    const createStripeConnectAccountLink = httpsCallable(
      functionsInstance,
      'createStripeConnectAccountLink',
    );

    // Pass the ID token to the function
    const result = await createStripeConnectAccountLink({idToken});

    console.log('Function call successful:', result);
    return result.data.url;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
};

export const verifyStripeAccountStatus = async () => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to create an account link');
  }

  try {
    // Call your Firebase function to check the Stripe account status
    const verifyStripeAccount = httpsCallable(
      functionsInstance,
      'checkStripeAccountStatus',
    );

    const result = await verifyStripeAccount();
    const accountStatus = result.data;

    if (accountStatus?.payoutsEnabled) {
      const usersCollectionRef = collection(db, 'user_stripe_details');
      const userQuery = query(
        usersCollectionRef,
        where('lupa_uid', '==', auth?.currentUser?.uid),
      );
      const userRef = (await getDocs(userQuery)).docs[0].ref;
      // Update Firestore with the new status
      await updateDoc(userRef, {
        stripeAccountEnabled: true,
        stripeAccountId: accountStatus.accountId,
      });

      return true;
    } else {
      // The account is not fully set up
      return false;
    }
  } catch (error) {
    console.log(error);
 
    console.error('Error verifying Stripe account status:', error);
    return false;
  }
};

// Usage example
// createAccountLink()
//   .then(url => console.log('Received URL:', url))
//   .catch(error => console.error('Error in createAccountLink:', error));
