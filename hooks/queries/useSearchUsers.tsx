import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import {LupaUser} from '../../types/user';
import {isUserBlocked} from '../../api/user';
import {auth, db} from '../../services/firebase';

type SearchCollections = Array<{
  collectionName: string;
  collectionFields: Array<string>;
}>;
const useCollectionsSearch = (
  searchQuery: string,
  searchCollections: SearchCollections,
) => {
  return useQuery({
    queryKey: ['search', searchQuery, searchCollections],
    queryFn: async () => {
      try {
        const promises = searchCollections.map(
          async ({collectionName, collectionFields}) => {
            const collectionRef = collection(db, collectionName);

            const queries = collectionFields.map(field =>
              query(
                collectionRef,
                where(field, '>=', searchQuery),
                where(field, '<=', searchQuery + '\uf8ff'),
              ),
            );



            const snapshots = await Promise.all(queries.map(q => getDocs(q)));
            const documents = snapshots.flatMap(snapshot =>
              snapshot.docs.map(doc => doc.data()),
            );

            if (collectionName === 'users') {
              let validUsers = await Promise.all(
                documents.map(async userDoc => {
                  return userDoc;
                  // const isBlocked =
                  //   (await isUserBlocked(
                  //     auth?.currentUser?.uid as string,
                  //     userDoc.uid,
                  //   )) ||
                  //   (await isUserBlocked(
                  //     userDoc.uid,
                  //     auth?.currentUser?.uid as string,
                  //   ));
                  // if (!isBlocked) {
                  //   return userDoc;
                  // } else {
                  //   return null;
                  // }
                }),
              );

              validUsers = validUsers.filter(user => user);
              return {[collectionName]: validUsers};
            }

            // For programs we need to attach the trainer's name to the program data
            if (collectionName === 'programs') {
              const programsWithTrainers = await Promise.all(
                documents.map(async program => {
                  const trainerQuery = query(
                    collection(db, 'users'),
                    where('uid', '==', program.metadata.owner),
                  );
                  const trainerSnapshot = await getDocs(trainerQuery);
                  const {name, picture, uid} =
                    trainerSnapshot.docs[0]?.data() as LupaUser;
                  return {
                    program: program,
                    trainer: {name, picture, uid},
                  };
                }),
              );
              return {[collectionName]: programsWithTrainers};
            }

            return {[collectionName]: documents};
          },
        );

        const results = await Promise.all(promises);
        const formattedResults = Object.assign({}, ...results);

        console.log('Search results:', formattedResults); // Debug log
        return formattedResults;
      } catch (error) {
        console.error('Error searching documents:', error);
        throw error;
      }
    },
    enabled: false,
    retry: false,
  });
};

export default useCollectionsSearch;
