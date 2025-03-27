import {useMutation, useQuery} from '@tanstack/react-query';
import queryClient from '../../../react-query';
import {
  acceptPackInvitation,
  declinePackInvitation,
  purchasePackageForPack,
} from '../../../api';
import {collection, getDocs, query, where} from 'firebase/firestore';
import {SessionPackage} from '../../../types/user';
import {auth, db} from '../../../services/firebase';

interface IPurchasePackageForPackVariables {
  packUid: string;
  packageUid: string;
}

export const usePurchaseSessionPackageForPack = () => {
  return useMutation<any, Error, IPurchasePackageForPackVariables>({
    mutationFn: ({packUid, packageUid}) =>
      purchasePackageForPack(packUid, packageUid),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'pack',
        variables.packUid,
        variables.packageUid,
      ]);
    },
  });
};

export const useAcceptPackInvitation = () => {
  return useMutation({
    mutationFn: acceptPackInvitation,
    mutationKey: ['accept_pack_invite', auth?.currentUser?.uid],
  });
};

export const useDeclinePackInvitation = () => {
  return useMutation({
    mutationFn: declinePackInvitation,
    mutationKey: ['decline_pack_invite', auth?.currentUser?.uid],
  });
};

export default useDeclinePackInvitation;
