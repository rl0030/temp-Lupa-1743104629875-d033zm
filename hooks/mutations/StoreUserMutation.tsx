import {useMutation} from '@tanstack/react-query';
import {putUser} from '../../api';
import {useEffect} from 'react';
import {LupaUser, TrainerMetadata} from '../../types/user';

export default function useStoreUserMutation() {
  const mutationResult = useMutation<
    any,
    Error,
    {user: LupaUser; trainerMetadata?: TrainerMetadata | null}
  >({
    mutationKey: ['store_user'],
    mutationFn: ({user, trainerMetadata}) => putUser(user, trainerMetadata),
  });

  const {submittedAt, status, error, isError, isSuccess, data} = mutationResult;

  useEffect(() => {
    if (isError) {
      console.error(error);
    }

    if (isSuccess) {
      console.debug(
        `${submittedAt}: Successfully stored user with doc id: `,
        data,
      );
    }
  }, [status, isError, isSuccess]);

  return mutationResult;
}
