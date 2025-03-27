import {useMutation, useQuery} from '@tanstack/react-query';
import {
  doc,
  getDocs,
  query,
  where,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import {LupaUser, TrainerMetadata} from '../../../types/user';
import queryClient from '../../../react-query';

export interface TrainerClientRelationship {
  uid: string;
  clientData: LupaUser | null;
  trainerData: {
    data: LupaUser | null;
    metadata: TrainerMetadata | null;
  };
  linked_programs: string[];
}

const useTrainerClientRelationship = (
  trainer_uid: string,
  client_uid: string,
) => {
  const useQueryResult = useQuery<TrainerClientRelationship>({
    queryKey: ['trainer_client_relationship', trainer_uid, client_uid],
    queryFn: async () => {
      const documentsSnapshot = await getDocs(
        query(
          collection(db, 'trainer_client_relationship'),
          where('trainer_uid', '==', trainer_uid),
          where('client_uid', '==', client_uid),
        ),
      );

      let relationshipQuerySnapshot;
      let relationshipDocumentData;

      if (documentsSnapshot.empty) {
        // Create a new document if it doesn't exist
        const docRef = doc(collection(db, 'trainer_client_relationship'));
        await setDoc(docRef, {
          trainer_uid,
          client_uid,
          linked_programs: [],
          uid: docRef.id,
        });
        relationshipQuerySnapshot = await getDoc(docRef);
        relationshipDocumentData = relationshipQuerySnapshot.data();
      } else {
        relationshipQuerySnapshot = documentsSnapshot.docs[0];
        relationshipDocumentData = relationshipQuerySnapshot.data();
      }

      const usersCollectionRef = collection(db, 'users');
      const trainerMetadataCollectionRef = collection(db, 'trainer_metadata');

      // Obtain trainer data
      const trainerQueryDocs = await getDocs(
        query(usersCollectionRef, where('uid', '==', trainer_uid)),
      );
      const trainerDocumentsSnapshot = trainerQueryDocs.docs[0];
      const trainerData = trainerDocumentsSnapshot?.data() as LupaUser | null;

      const trainerMetadataQueryDocs = await getDocs(
        query(
          trainerMetadataCollectionRef,
          where('user_uid', '==', trainer_uid),
        ),
      );
      const trainerMetadataDocumentSnapshot = trainerMetadataQueryDocs.docs[0];
      const trainerMetadata =
        trainerMetadataDocumentSnapshot?.data() as TrainerMetadata | null;

      // Obtain user data
      const userQueryDocs = await getDocs(
        query(usersCollectionRef, where('uid', '==', client_uid)),
      );
      const userDocumentsSnapshot = userQueryDocs.docs[0];
      const userData = userDocumentsSnapshot?.data() as LupaUser | null;

      const data = {
        uid: relationshipQuerySnapshot.id,
        clientData: userData,
        trainerData: {
          data: trainerData,
          metadata: trainerMetadata,
        },
        linked_programs: relationshipDocumentData?.linked_programs || [],
        id: relationshipQuerySnapshot.id,
      };

      return data;
    },
  });

  return useQueryResult;
};
interface UpdateLinkedProgramsParams {
  trainer_uid: string;
  client_uid: string;
  programs: string[];
}

const updateLinkedPrograms = async ({
  trainer_uid,
  client_uid,
  programs,
}: UpdateLinkedProgramsParams) => {
  // First, we need to get the document ID
  const querySnapshot = await getDocs(
    query(
      collection(db, 'trainer_client_relationship'),
      where('trainer_uid', '==', trainer_uid),
      where('client_uid', '==', client_uid),
    ),
  );

  if (querySnapshot.empty) {
    throw new Error('Relationship document not found');
  }

  const docId = querySnapshot.docs[0].id;
  const docRef = doc(db, 'trainer_client_relationship', docId);

  // Update the document with the new linked programs
  await updateDoc(docRef, {
    linked_programs: arrayUnion(...programs),
  });

  // Fetch the updated document
  const updatedDoc = await getDoc(docRef);
  const updatedData = updatedDoc.data();

  return updatedData?.linked_programs || [];
};

export const useUpdateLinkedPrograms = () => {
  return useMutation({
    mutationFn: async (payload: UpdateLinkedProgramsParams) =>
      updateLinkedPrograms(payload),

    onSuccess: (data: any, variables: UpdateLinkedProgramsParams) => {
      // Invalidate and refetch the trainer client relationship query
      queryClient.invalidateQueries([
        'trainer_client_relationship',
        variables.trainer_uid,
        variables.client_uid,
      ]);
    },
  });
};

export default useTrainerClientRelationship;
