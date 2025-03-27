
async function putUser(
    user: LupaUser,
    trainerMetadata?: TrainerMetadata,
  ): Promise<string | undefined> {
    try {
      const usersCollection = collection(db, 'users');
      const trainerMetadataCollection = collection(db, 'trainer_metadata');
  
      const storage = getStorage();
  
      // Create a reference to the location where the image will be stored
      const imageRef = ref(storage, `${user.uid}/assets/index.png`);
  
      // Convert the base64 image to a Blob
      const base64Data = ensureBase64ImageString(user.picture);
      if (!base64Data) {
        throw new Error('Invalid base64 image data');
      }
      // Remove the data URL prefix if present
      const base64Image = base64Data.split(',')[1];
  
      // Create a Blob from the base64 image data
      const blob = await fetch(`data:image/png;base64,${base64Image}`).then(res =>
        res.blob(),
      );
      // Upload the Blob
      await uploadBytes(imageRef, blob);
      // Get the download URL of the uploaded image
      const downloadURL = await getDownloadURL(imageRef);
  
      const updatedUser = {...user, picture: downloadURL};
  
      const docRef = await addDoc(usersCollection, updatedUser);
  
      await updateUserDocumentWithFCMToken(docRef.id);
  
      if (updatedUser.role === 'trainer' && trainerMetadata) {
        await addDoc(trainerMetadataCollection, trainerMetadata);
      }
  
      // Perform a check for external invitations (packs)
      const packs = await queryExternalInvites(user);
  
      for (const packDoc of packs) {
        const packId = packDoc.id;
        const packData = packDoc.data() as Pack;
  
        // Update pack document to remove external invite and add to pending_invites
        // await updateDoc(packDoc.ref, {
        //   externalInvites: packData?.externalInvites.filter(invite => String(invite.email).toLowerCase() !== user.email.toLowerCase()),
        //   pending_invites: arrayUnion(user.uid),
        // });
  
        // Create notification for the new user
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          receiver: user.uid,
          sender: packData.owner,
          type: 'PACK_INVITE',
          message: `You've been invited to join the pack: ${packData.name}`,
          metadata: {
            packUid: packId,
            invitedUsers: [user.uid],
          },
          packUid: packId,
          createdAt: serverTimestamp(),
          isRead: false,
        });
      }
  
      return docRef.id;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function listUsers(): Promise<Array<LupaUser>> {
    try {
      const usersCollection = collection(db, FirebaseDatabaseTypes.LupaCollections.USERS);
      const usersSnapshot = await getDocs(usersCollection);
      const users = usersSnapshot.docs.map(doc => { 
        const data = doc.data();
        return {
        id: doc.data(),
        ...data
        }
      }) 
      return users as unknown as Array<LupaUser>
    } catch (error) {
      throw error;
    }
  }

  const getUser = async (uid: string): Promise<LupaUser> => {
    try {
      const usersCollectionRef = collection(db, 'users');
      const userQuery = query(usersCollectionRef, where('uid', '==', uid), limit(1));
      const userQuerySnapshot = await getDocs(userQuery);
  
      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = {id: userDoc.id, ...userDoc.data()};
        return userData as LupaUser & {id: string};
      }
    } catch (error) {
      throw error;
    }
  
    throw "getUser: Unable to find Lupa User: ${uid}"
  };
  
  export const getUsers = async (
    uids: Array<String>,
  ): Promise<Array<LupaUser>> => {
    const usersCollectionRef = collection(db, 'users');
  
    if (Array.isArray(uids) && uids.length === 0) {
      return [];
    }
  
    const userQuery = query(usersCollectionRef, where('uid', 'in', uids));
    const userQuerySnapshot = await getDocs(userQuery);
  
    const users: (LupaUser & {id: string})[] = [];
  
    userQuerySnapshot.forEach(userDoc => {
      const userData = {id: userDoc.id, ...userDoc.data()};
      users.push(userData as LupaUser & {id: string});
    });
  
    return users;
  };
  