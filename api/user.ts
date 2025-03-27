import {
  FieldValue,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {db} from '../services/firebase';
import { LupaUser } from '../types/user';

export const getUser = async (uid: string): Promise<LupaUser | null> => {
  const usersCollectionRef = collection(db, 'users');
  const userQuery = query(usersCollectionRef, where('uid', '==', uid));
  const userQuerySnapshot = await getDocs(userQuery);

  if (!userQuerySnapshot.empty) {
    const userDoc = userQuerySnapshot.docs[0];
    const userData = {id: userDoc.id, ...userDoc.data()};
    return userData as LupaUser & {id: string};
  }

  return null;
};

export const blockUser = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<void> => {
  const currentUser = await getDocs(
    query(collection(db, 'users'), where('uid', '==', referenceUserId)),
  );
  if (currentUser.size === 0) {
    return;
  }
  const currentUserRef = currentUser.docs[0].ref;
  const currentUserDoc = currentUser.docs[0].data();
  const blockedUsers = currentUserDoc?.settings?.blocked_uids || [];
  await updateDoc(currentUserRef, {
    'settings.blocked_uids': [...blockedUsers, targetUserId],
  });
};

// Method to unblock a user
export const unblockUser = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<void> => {
  const currentUser = await getDocs(
    query(collection(db, 'users'), where('uid', '==', referenceUserId)),
  );
  if (currentUser.size === 0) {
    return;
  }
  const currentUserRef = currentUser.docs[0].ref;
  const currentUserDoc = currentUser.docs[0].data();
  const blockedUsers = currentUserDoc?.settings?.blocked_uids || [];
  const updatedUnBlockedUsers = JSON.parse(blockedUsers);
  updatedUnBlockedUsers.splice(updatedUnBlockedUsers.indexOf(targetUserId));
  await updateDoc(currentUserRef, {
    'settings.blocked_uids': updatedUnBlockedUsers,
  });
};

// Check if a user is blocked
export const isUserBlocked = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<boolean> => {
  const currentUser = await getDocs(
    query(collection(db, 'users'), where('uid', '==', referenceUserId)),
  );
  const currentUserRef = currentUser.docs[0].ref;
  const currentUserDoc = currentUser.docs[0].data();
  const blockedUsers = currentUserDoc?.settings?.blocked_uids || [];

  return blockedUsers.includes(targetUserId);
};

