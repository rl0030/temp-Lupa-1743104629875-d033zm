import {UseQueryResult, useQuery} from '@tanstack/react-query';
import {
  getUser,
  getUserPrograms,
  getProgram,
  getPurchasedPrograms,
  getTrainerCreatedPrograms,
} from '../../api';
import {useEffect, useState} from 'react';
import {Program, ProgramDetailsWithTrainerName} from '../../types/program';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

// i.e. useTrainerPrograms
// @param uid trainer_uid
export function useCreatedPrograms(uid: string) {
  const queryResult = useQuery({
    queryKey: ['trainer_created_programs', uid],
    queryFn: () => getTrainerCreatedPrograms(uid),
  });
  

  const userQueryResult = useQuery({
    queryKey: ['user_programs_trainer_info', uid],
    queryFn: () => getUser(uid),
  });



  return {
    ...queryResult,
    data: {programs: queryResult.data, trainer: { name: userQueryResult.data?.name, picture: userQueryResult.data?.picture, uid: userQueryResult.data?.uid }},
    isError: queryResult.isError || userQueryResult.isError,
    isLoading: queryResult.isLoading || userQueryResult.isLoading,
    isFetching: queryResult.isFetching || userQueryResult.isFetching,
    isSuccess: queryResult.isSuccess || userQueryResult.isSuccess,
  };
}

export default function usePrograms(uid: string) {
  const queryResult = useQuery({
    queryKey: ['user_programs', uid],
    queryFn: () => getUserPrograms(uid),
  });

  const userQueryResult = useQuery({
    queryKey: ['user_programs_trainer_info', uid],
    queryFn: () => getUser(uid),
  });

  return {
    ...queryResult,
    data: {programs: queryResult.data, trainer: { name: userQueryResult.data?.name, picture: userQueryResult.data?.picture, uid: userQueryResult.data?.uid }},
    isError: queryResult.isError || userQueryResult.isError,
    isLoading: queryResult.isLoading || userQueryResult.isLoading,
    isFetching: queryResult.isFetching || userQueryResult.isFetching,
    isSuccess: queryResult.isSuccess || userQueryResult.isSuccess,
  };
}

export function useProgram(program_uid: string) {
  const useQueryResult = useQuery({
    queryKey: ['use_program', program_uid],
    queryFn: () => getProgram(program_uid),
    retry: false,
  });

  return useQueryResult;
}

export const useGetPurchasedPrograms = (uid: string) => {
  return useQuery<any, Error, ProgramDetailsWithTrainerName[]>({
    queryKey: ['get_purchased_programs', uid],
    queryFn: () => getPurchasedPrograms(uid),
  });
};


export function useGetDataForPrograms(programUids: string[]) {
  return useQuery({
    queryFn: async () => {
      if (programUids.length === 0) {
        return []
      }

      try {
        const programsCollection = collection(db, 'programs');
        const programQuery = query(programsCollection, where('uid', 'in', programUids));
        const querySnapshot = await getDocs(programQuery);

        const fetchedPrograms: Program[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPrograms.push({ id: doc.id, ...doc.data() } as Program);
        });

        return fetchedPrograms

      } catch (err) {
        return []
      } 
    },
    queryKey: ['use_get_data_for_programs', programUids.length]
  })

}