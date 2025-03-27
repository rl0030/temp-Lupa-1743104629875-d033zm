import {useMutation, useQuery} from '@tanstack/react-query';
import {doc, getDoc} from 'firebase/firestore';
import queryClient from '../../../react-query';
import {createPack, getUserPacks} from '../../../api';
import {auth, db} from '../../../services/firebase';
import {Pack} from '../../../types/user';

const usePack = (packUid: string) => {
  return useQuery({
    queryKey: ['use_pack', packUid],
    queryFn: async () => {
      const packRef = doc(db, 'packs', packUid);
      const packDoc = await getDoc(packRef);
      if (packDoc.exists()) {
        const pack = packDoc.data()

        return pack as Pack
      }
      throw new Error('Pack not found');
    },
    enabled: !!packUid
  });
};

interface ICreatePackVariables {
  pack: Pack;
}

export const useCreatePack = () => {
  return useMutation<any, Error, ICreatePackVariables>({
    mutationFn: ({pack}) => createPack(pack),
    mutationKey: ['create_pack'],
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['use_pack', variables.pack.uid]);
    },
  });
};

export const useUserPacks = () => {
  const currentUser = auth?.currentUser?.uid as string;
  return useQuery({
    queryKey: ['userPacks', currentUser],
    queryFn: getUserPacks,
  });
};

export default usePack;
