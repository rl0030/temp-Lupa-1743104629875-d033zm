import { useState } from 'react';
import { doc, deleteDoc, collection } from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '../../../services/firebase';

export const useDeleteProgram = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProgram = async (programId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    return new Promise((resolve) => {
      Alert.alert(
        "Delete Program",
        "Are you sure you want to delete this program?",
        [
          {
            text: "Cancel",
            onPress: () => {
              setIsDeleting(false);
              resolve(false);
            },
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: async () => {
              try {
                const programRef = doc(collection(db, 'programs'), programId);
                await deleteDoc(programRef);
                console.debug('Program deleted from Firestore successfully!');
                setIsDeleting(false);
                resolve(true);
              } catch (error) {
                console.error('Error deleting program from Firestore:', error);
                setError('Failed to delete program. Please try again.');
                setIsDeleting(false);
                resolve(false);
              }
            }
          }
        ],
        { cancelable: false }
      );
    });
  };

  return { deleteProgram, isDeleting, error };
};