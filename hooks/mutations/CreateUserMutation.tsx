import {useMutation} from '@tanstack/react-query';
import {createUser} from '../../api';
import {useEffect} from 'react';

type CreateUserPayload = {
  email: string;
  password: string;
};

export default function useCreateUserMutation() {
  const mutationResult = useMutation({
    mutationKey: ['store_user'],
    mutationFn: (payload: CreateUserPayload) =>
      createUser(payload.email, payload.password),
  });

  const {submittedAt, status, error, isError, isSuccess, data} = mutationResult;

  useEffect(() => {
    if (status === 'error') {
      console.error(error);
    }

    if (status === 'success') {
      console.debug(`${submittedAt}: Successfully created user`);
    }
  }, [status]);

  return mutationResult;
}
