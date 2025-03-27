import {
  initPaymentSheet,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import {auth, db} from '../../services/firebase';
import {Program} from '../../types/program';
import useCreateStripeUser from '../stripe/useCreateCustomer';
import useCreatePaymentIntent from '../stripe/useCreatePaymentIntent';
import useGetEmphemeralKey from '../stripe/useGetEmphemeralKey';
import useUser from '../useAuth';
import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {useMutation} from '@tanstack/react-query';
import {putCompletedProgramPurchase} from '../../api';

export default function usePurchaseProgram() {
  return useMutation({
    mutationKey: ['use_purchase_program'],
    mutationFn: ({
      lupaUserUid,
      programData,
    }: {
      lupaUserUid: string;
      programData: Program;
    }) => putCompletedProgramPurchase(lupaUserUid, programData),
    retry: false
  });
}
