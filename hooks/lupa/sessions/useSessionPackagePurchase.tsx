import {
  DocumentData,
  DocumentReference,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {useMutation, useQuery} from '@tanstack/react-query';
import uuid from 'react-native-uuid';
import {auth, db} from '../../../services/firebase';
import {
  LupaUser,
  PackScheduledEvent,
  PurchasedSessionPackage,
  ScheduledMeetingClientType,
  TrainerMetadata,
  UserScheduledEvent,
} from '../../../types/user';
import {realtime_db} from '../../../services/firebase/realtime_database';
import {push, ref, update} from 'firebase/database';
import {getClientPurchasedPackages, getUser} from '../../../api';
import {SessionPackage} from '../packages';
import {
  MessageType,
  UserMessageType,
  sendPackMessage,
  sendUserMessage,
} from '../../../util/messages';
import {NotificationType,  UserSessionPackagePurchaseMetadata} from '../../../types/notifications';

export enum SessionPackageType {
  IN_PERSON,
  VIDEO
}

type PurchaseSessionPackageVariables = {
  userUid: string; // May be a user id or a pack id
  packageUid: string;
  packageName: string;
  clientType: ScheduledMeetingClientType;
  trainer_uid: string;
  packageType: SessionPackageType
};

export const purchaseSessionPackage = async (
  userUid: string,
  packageUid: string,
  packageName: string,
  clientType: ScheduledMeetingClientType,
  trainer_uid: string,
  packageType: SessionPackageType
) => {
  try {
    // Get the session package document
    let packageDocRef: DocumentReference<DocumentData, DocumentData>;

    if (clientType === 'user') {
      packageDocRef = doc(db, 'packages', packageUid);
    } else if (clientType === 'pack') {
      packageDocRef = doc(db, 'pack_programs', packageUid);
    }

    // @ts-ignore
    const packageDocSnapshot = await getDoc(packageDocRef);

    if (!packageDocSnapshot.exists()) {
      throw new Error('Session package does not exist');
    }

    const packageData = packageDocSnapshot.data() as SessionPackage;

    // Create a new document in the "purchased_packages" collection
    const packagesCollectionRef = collection(db, 'purchased_packages');
    const newPackageDocRef = doc(packagesCollectionRef);

    await setDoc(newPackageDocRef, {
      ...packageData,
      purchase_uid: packageUid,
      clientType,
      client: userUid,
      uid: newPackageDocRef.id,
      trainer_uid,
      packageType
    });

    // TODO: Check the trainer metadata document to see if the user is already a client.
    // If not, add the user as a client using the `userId`
    const trainerMetadataCollectionRef = collection(db, 'trainer_metadata');
    const trainerMetadataDocRef = doc(
      trainerMetadataCollectionRef,
      trainer_uid,
    );
    const trainerMetadataDocSnapshot = await getDoc(trainerMetadataDocRef);

    if (trainerMetadataDocSnapshot.exists()) {
      const trainerMetadata =
        trainerMetadataDocSnapshot.data() as TrainerMetadata;

      if (!trainerMetadata.clients.includes(userUid)) {
        // User is not a client, add them to the clients array
        await updateDoc(trainerMetadataDocRef, {
          clients: arrayUnion(userUid),
        });
      }
    }

    if (clientType === ScheduledMeetingClientType.User) {
      // Send a message from trainer account to user account using privateChats
  

      await sendUserMessage(
        trainer_uid,
        userUid,
        "Thank you for purchasing a session package. Let's schedule your sessions!",
        UserMessageType.SESSION_PACKAGE_PURCHASE,
        {
          packageUid,
          packageName,
          clientType,
          purchaser: userUid,
          trainerUid: trainer_uid,
          packUid: null,
        } as UserSessionPackagePurchaseMetadata,
        
      );
  
    } else if (clientType === ScheduledMeetingClientType.Pack) {
      // Send a message from trainer account to pack chat using packChats
      sendPackMessage(
        trainer_uid,
        userUid,
        "Thank you for purchasing a session package. Let's schedule your sessions!",
        MessageType.PACK_PACKAGE_INVITATION,
        {
          packageId: packageData?.name,
          packageTrainerUid: trainer_uid,
        },
      );
 
    }

    if (clientType === 'user') {
      // Create notifications for the user and trainer
      // Create and set user notification
      const userNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(userNotificationRef, {
        id: userNotificationRef.id,
        receiver: userUid,
        type: NotificationType.USER_SESSION_PACKAGE_PURCHASE,
        message: `Your package purchase of ${packageData?.name} is complete.`,
        createdAt: serverTimestamp(),
        isRead: false,
        metadata: {
          packageUid,
          packageName,
          clientType,
          purchaser: userUid,
          trainerUid: trainer_uid,
          packUid: null,
        } as UserSessionPackagePurchaseMetadata,
      });
    }

    if (clientType === 'pack') {
      const packRef = doc(db, 'packs', userUid);
      const packDoc = await getDoc(packRef);
      const packDocData = packDoc.data();

      // Send a notification to each member
      const userNotificationRef = doc(collection(db, 'notifications'));
      for (const member of packDocData?.members) {
        await setDoc(userNotificationRef, {
          id: userNotificationRef.id,
          receiver: member,
          type: NotificationType.PACK_SESSION_PACKAGE_PURCHASE,
          message: `Your pack's purchase of ${packageData?.name} is complete.`,
          createdAt: serverTimestamp(),
          isRead: false,
          metadata: {
            packageUid,
            packageName,
            clientType,
            purchaser: userUid,
            trainerUid: trainer_uid,
            packUid: null,
          } as UserSessionPackagePurchaseMetadata,
        });
      }
    }

    // Create and set trainer notification
    const trainerNotificationRef = doc(collection(db, 'notifications'));
    await setDoc(trainerNotificationRef, {
      id: trainerNotificationRef.id,
      receiver: trainer_uid,
      type: clientType === 'user' ? NotificationType.USER_SESSION_PACKAGE_PURCHASE : NotificationType.PACK_SESSION_PACKAGE_PURCHASE,
      message: `A client has purchased a package of ${packageData?.name}. Check your scheduler.`,
      createdAt: serverTimestamp(),
      isRead: false,
      metadata: {
        packageUid,
        packageName,
        clientType,
        purchaser: userUid,
        trainerUid: trainer_uid,
        packUid: null,
      } as UserSessionPackagePurchaseMetadata,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const useSessionPackagePurchase = () => {
  return useMutation<void, Error, PurchaseSessionPackageVariables>({
    mutationFn: ({userUid, packageUid, packageName, clientType, trainer_uid, packageType}) =>
      purchaseSessionPackage(userUid, packageUid, packageName, clientType, trainer_uid, packageType),
    mutationKey: ['purchase_session_package', auth?.currentUser?.uid],
    retry: false,
  });
};

export const useClientPurchasedPackages = (clientId: string | null) => {
  return useQuery({
    queryKey: ['clientPurchasedPackages', clientId],
    queryFn: async () => (clientId ? getClientPurchasedPackages(clientId) : []),
  });
};

export default useSessionPackagePurchase;
