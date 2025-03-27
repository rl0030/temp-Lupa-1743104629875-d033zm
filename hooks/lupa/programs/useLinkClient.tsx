import {useMutation, useQueryClient} from '@tanstack/react-query';
import {doc, setDoc} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import queryClient from '../../../react-query';

interface TrainerClientRelationship {
  uid: string;
  client_uid: string;
  trainer_uid: string;
  linked_programs: string[];
}

const useLinkClient = () => {
  const useMutationResult = useMutation<void, Error, TrainerClientRelationship>(
    {
      mutationFn: async (updatedRelationship: TrainerClientRelationship) => {
        await setDoc(
          doc(db, 'trainer_client_relationship', updatedRelationship.uid),
          updatedRelationship,
        ).catch(error => console.error(error))
      },
      onSuccess: (_, updatedRelationship) => {
        queryClient.invalidateQueries([
          'trainer_client_relationship',
          updatedRelationship.client_uid,
          updatedRelationship.trainer_uid,
        ]);
      },
    },
  );

  return useMutationResult;
};

export default useLinkClient;
