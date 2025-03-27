import {useMutation} from '@tanstack/react-query';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {useEffect} from 'react';
import { auth } from '../../services/firebase';

type LoginPayload = {
  email: string;
  password: string;
};

export default function useLogin() {
  const mutationResult = useMutation({
    mutationKey: ['store_user'],
    mutationFn: (payload: LoginPayload) =>
      signInWithEmailAndPassword(auth, payload.email, payload.password)
  });

  const {submittedAt, status, error, isError, isSuccess, data} = mutationResult;

  useEffect(() => {
    if (status === 'error') {
      console.error(error);
    }

    if (status === 'success') {
      console.debug('Successfully authenticated with user credentials: ')
    }
  }, [status]);

  return mutationResult;
}
