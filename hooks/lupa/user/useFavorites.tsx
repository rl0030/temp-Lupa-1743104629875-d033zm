import {useMutation, useQuery} from '@tanstack/react-query';

import {arrayUnion, doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import {UID} from '../../../types/common';
import queryClient from '../../../react-query';

// React Query hook to fetch favorites
const useFavorites = (userId: UID) => {
  return useQuery({
    queryKey: ['use_favorites', userId],
    queryFn: async () => {
      if (!userId) return [];

      const userDocRef = doc(db, 'users', userId);

      try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('User document not found');
          return [];
        }

        const userData = userDoc.data();
        return userData.interactions?.favorites || [];
      } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
    },
  });
};

const useAddFavorites = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      favoriteId,
    }: {
      userId: UID;
      favoriteId: UID;
    }) => {
      const userDocRef = doc(db, 'users', userId);

      await updateDoc(userDocRef, {
        'interactions.favorites': arrayUnion(favoriteId),
      });
    },
    onSuccess: (_, {userId}) => {
      queryClient.invalidateQueries(['use_favorites', userId]);
    },
  });
};

export {useFavorites, useAddFavorites};
