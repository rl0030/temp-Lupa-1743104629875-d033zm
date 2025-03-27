import {useMutation} from '@tanstack/react-query';
import {createPackage} from '../../api';
import { auth } from '../../services/firebase';

const useCreatePackage = () => {
  return useMutation({ mutationFn: createPackage, mutationKey: ['create_package', auth?.currentUser?.uid] });
};

export default useCreatePackage;
