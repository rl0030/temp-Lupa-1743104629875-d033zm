import {useState, useEffect, FC} from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  DocumentData,
  getDocs,
} from 'firebase/firestore';
import {db} from '../../services/firebase';

const useFirestoreDocumentListener = <T extends Object>(
  collectionName: string,
  field: string,
  value: string,
) => {
  const [document, setDocument] = useState<T>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const queryRef = query(collectionRef, where(field, '==', value));

    const unsubscribe = onSnapshot(
      queryRef,
      snapshot => {
        if (!snapshot.empty) {
          const documentData = snapshot.docs[0].data();
          setDocument({id: snapshot.docs[0].id, ...documentData});
          setLoading(false);
        } else {
          setDocument(null);
          setLoading(false);
        }
      },
      error => {
        setError(error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionName, field, value]);

  const mutateAsync = async (updatedData: any) => {
    if (!document) {
      throw new Error('Document not found');
    }

    if (collectionName === 'users') {
      const userQuery = await getDocs(
        query(collection(db, 'users'), where('uid', '==', value)),
      );
      const userRef = userQuery.docs[0].ref;
      await updateDoc(userRef, updatedData);
    } else {
      const documentRef = doc(db, collectionName, document.id);
      await updateDoc(documentRef, updatedData);
    }
  };

  return {document, loading, error, mutateAsync};
};

export default useFirestoreDocumentListener;
