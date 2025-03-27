// useUpdateUserLocation.ts
import {useMutation} from '@tanstack/react-query';
import {useEffect} from 'react';
import {GeoCoordinates} from 'react-native-geolocation-service';
import updateUserLocation from '../../api';

export default function useUpdateUserLocation() {
  const mutationResult = useMutation<
    any,
    Error,
    {uid: string; position: {latitude: number; longitude: number}}
  >({
    mutationKey: ['update_user_location'],
    mutationFn: async payload => updateUserLocation(payload),
  });

  const {submittedAt, status, error, isError, isSuccess, data} = mutationResult;

  useEffect(() => {
    if (status === 'error') {
      console.error(error);
    }
    if (status === 'success') {
      console.debug('Successfully updated user location');
    }
  }, [status]);

  return mutationResult;
}
