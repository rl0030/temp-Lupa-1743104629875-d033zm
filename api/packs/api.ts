import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc, runTransaction, updateDoc, arrayRemove } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { Pack, PackScheduledEvent } from "../../types/user";
import { FirebaseDatabaseTypes } from "../../types/firebase";
import queryClient from "../../react-query";
import { NotificationType } from "../../types/notifications";

/**
 * Fetches packs for given user IDs.
 * @param uids - Array of user IDs
 * @returns Promise resolving to an array of Pack objects with IDs
 * @throws Error if the Firestore query fails
 */
export const getPacks = async (
  uids: Array<string>,
): Promise<Array<Pack>> => {
  try {
    if (uids.length === 0) {
        return [];
      }

    const usersCollectionRef = collection(db, FirebaseDatabaseTypes.LupaCollections.PACKS);

    if (!Array.isArray(uids)) {
      throw new Error("Invalid input: uids must be an array");
    }


    const userQuery = query(usersCollectionRef, where('uid', 'in', uids));
    const userQuerySnapshot = await getDocs(userQuery);

    const packs: Pack[] = [];

    userQuerySnapshot.forEach(userDoc => {
      const userData = {id: userDoc.id, ...userDoc.data()};
      packs.push(userData as Pack);
    });

    return packs;
  } catch (error) {
    console.error("Error in getPacks:", error);
    throw error;
  }
};

/**
 * Fetches scheduled events for a given pack.
 * @param packId - ID of the pack
 * @returns Promise resolving to an array of PackScheduledEvent objects
 * @throws Error if the Firestore query fails
 */
export const getPackScheduledEvents = async (
  packId: string,
): Promise<PackScheduledEvent[]> => {
  try {
    if (!packId) {
      throw new Error("Invalid input: packId is required");
    }

    const scheduledEventsRef = collection(db, 'pack_scheduled_events');
    const q = query(scheduledEventsRef, where('pack_uid', '==', packId));
    const querySnapshot = await getDocs(q);

    const scheduledEvents: PackScheduledEvent[] = [];
    querySnapshot.forEach(doc => {
      scheduledEvents.push(doc.data() as PackScheduledEvent);
    });

    return scheduledEvents;
  } catch (error) {
    console.error("Error in getPackScheduledEvents:", error);
    throw error;
  }
};

/**
 * Fetches all packs from the database.
 * @returns Promise resolving to an array of all pack data
 * @throws Error if the Firestore query fails
 */
export const getAllPacks = async () => {
  try {
    const packSnapshot = await getDocs(collection(db, FirebaseDatabaseTypes.LupaCollections.PACKS));
    return packSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error in getAllPacks:", error);
    throw error;
  }
};

/**
 * Creates a new pack in the database.
 * @param pack - Pack object to be created
 * @returns Promise resolving to the newly created pack data
 * @throws Error if pack creation fails
 */
export const createPack = async (pack: Pack) => {
  try {
    if (!pack) {
      throw new Error("Invalid input: pack object is required");
    }

    const packRef = doc(collection(db, FirebaseDatabaseTypes.LupaCollections.PACKS));
    await setDoc(packRef, {
      ...pack,
      uid: packRef.id,
      id: packRef.id,
      created_at: serverTimestamp(),
      is_live: false, // Packs do not go live until all user's have accepted the invitation
    });

    const newPack = await getDoc(packRef).then(doc => doc.data());

    if (!newPack) {
      throw new Error("Failed to retrieve newly created pack");
    }

    return newPack;
  } catch (error) {
    console.error("Error in createPack:", error);
    throw error;
  }
};

/**
 * Fetches packs for the current authenticated user.
 * @returns Promise resolving to an array of pack data for the current user
 * @throws Error if the Firestore query fails or if no user is authenticated
 */
export const getUserPacks = async () => {
  try {
    const currentUser = auth?.currentUser?.uid;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const packsRef = collection(db, FirebaseDatabaseTypes.LupaCollections.PACKS);
    const q = query(packsRef, where('members', 'array-contains', currentUser));

    const querySnapshot = await getDocs(q);
    const packs = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

    return packs;
  } catch (error) {
    console.error("Error in getUserPacks:", error);
    throw error;
  }
};

/**
 * Fetches a specific pack by its ID.
 * @param uid - ID of the pack to fetch
 * @returns Promise resolving to the Pack object or null if not found
 * @throws Error if the Firestore query fails
 */
export const getPack = async (uid: string): Promise<Pack | null> => {
  try {
    if (!uid) {
      throw new Error("Invalid input: packUid is required");
    }

    const packDoc = await getDoc(doc(db, FirebaseDatabaseTypes.LupaCollections.PACKS, uid));
    const packsData = packDoc.data();

    if (!packsData) {
      return null;
    }

    return packsData as Pack;
  } catch (error) {
    console.error("Error in getPack:", error);
    throw error;
  }
};


export const acceptPackInvitation = async ({packId}: {packId: string}) => {
    const packRef = doc(db, FirebaseDatabaseTypes.LupaCollections.PACKS, packId);
    const currentUser = auth?.currentUser?.uid;
  
    // Fetch the pack document
    const packSnapshot = await getDoc(packRef);
    const packData = packSnapshot.data();
  
    if (!packData) {
      throw new Error('Pack not found');
    }
  
    // Start a transaction to ensure data consistency
    await runTransaction(db, async transaction => {
      const updatedPackSnapshot = await transaction.get(packRef);
      const updatedPackData = updatedPackSnapshot.data();
  
      if (!updatedPackData) {
        throw new Error('Pack not found in transaction');
      }
  
      const updatedPendingInvites = updatedPackData.pendingInvites.filter(
        (uid: string) => uid !== currentUser,
      );
      const updatedMembers = [...updatedPackData.members, currentUser];
  
      transaction.update(packRef, {
        pendingInvites: updatedPendingInvites,
        members: updatedMembers,
      });
  
      // Check if this is the last member to join
      if (
        updatedPackData?.is_live === false &&
        updatedPendingInvites.length === 0
      ) {
        transaction.update(packRef, {is_live: true});
  
        // Create notifications for all pack members
        updatedMembers.forEach((memberUid: string) => {
          const notificationRef = doc(collection(db, FirebaseDatabaseTypes.LupaCollections.NOTIFICATIONS));
          transaction.set(notificationRef, {
            id: notificationRef.id,
            receiver: memberUid,
            type: NotificationType.PACK_LIVE,
            message: `Your pack ${updatedPackData.name} is now live!`,
            createdAt: serverTimestamp(),
            isRead: false,
          });
        });
      } else {
        // Pack is already live
        // Create notifications for existing pack members about the new member
        updatedPackData.members.forEach((memberUid: string) => {
          if (memberUid !== currentUser) {
            const notificationRef = doc(collection(db, FirebaseDatabaseTypes.LupaCollections.NOTIFICATIONS));
            transaction.set(notificationRef, {
              id: notificationRef.id,
              receiver: memberUid,
              type: NotificationType.PACK_MEMBER_JOINED,
              message: `A new member has joined your pack ${updatedPackData.name}`,
              createdAt: serverTimestamp(),
              isRead: false,
            });
          }
        });
      }
    });
  
    queryClient.invalidateQueries({
      queryKey: ['use_pack', packId],
    });
  };
  
  export const declinePackInvitation = async ({packId}: {packId: string}) => {
    const packRef = doc(db, FirebaseDatabaseTypes.LupaCollections.PACKS, packId);
    const currentUser = auth?.currentUser?.uid as string
  
    await updateDoc(packRef, {
      pendingInvites: arrayRemove(currentUser),
    });
  };