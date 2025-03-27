import {useState, useEffect} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {getUser, checkOnboardingStatus, getUsers} from '../api';
import {User} from 'firebase/auth';
import {auth} from '../services/firebase';
import {useAnimatedGestureHandler} from 'react-native-reanimated';
import { LupaUser } from '../types/user';

const useUser = (uid: string) => {
  const queryResult = useQuery<LupaUser>({
    queryKey: ['use_user', uid],
    queryFn: () => getUser(uid),
    enabled: !!uid,
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return queryResult;
};

const useUsers = (uids: string[]) => {
  const queryResult = useQuery({
    queryKey: ['use_users', uids],
    queryFn: () => getUsers(uids),
    enabled: !!uids,
  });

  return queryResult;
};

const useFetchUsers = () => {
  const mutationResult = useMutation({
    mutationKey: ['use_users'],
    mutationFn: (uids: string[]) => getUsers(uids),
  });

  return mutationResult;
};

export {useUsers, useFetchUsers};
export default useUser;
