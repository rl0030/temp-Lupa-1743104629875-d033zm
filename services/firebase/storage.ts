import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  uploadBytesResumable,
} from 'firebase/storage';
import * as ImagePicker from 'react-native-image-picker';
import app from '.';
import {ensureBase64ImageString} from '../../util/media';
import { Alert } from 'react-native';

export const uploadProgramAssetToFirebaseStorage = async (
  asset: ImagePicker.Asset,
  programUid: string,
  id: string,
  weekIndex: number,
  sessionIndex: number,
) => {
  try {
    const {uri, fileName} = asset;

    if (!uri) {
      throw new Error('Uri does not exist');
    }

    const storage = getStorage(app);
    const storageRef = ref(
      storage,
      `programs/${programUid}/assets/${weekIndex}/${sessionIndex}/${id}`,
    );

    // Fetch the asset file as a Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload the asset file to Firebase Storage
    await uploadBytesResumable(storageRef, blob);

    // Get the download URL of the uploaded asset
    const downloadURL = await getDownloadURL(storageRef);

    console.log('Asset uploaded to Firebase Storage successfully.');
    console.log('Download URL:', downloadURL);

    // Return the download URL
    return downloadURL;
  } catch (error) {
    console.error('Error uploading asset to Firebase Storage:', error);
    throw error;
  }
};

export const writeProgramAssetsToFirebaseStorage = async (
  assets: ImagePicker.Asset[],
  programUid: string,
  id: string,
  weekIndex: number,
  sessionIndex: number,
) => {
  try {
    const downloadURLs: string[] = [];

    // Upload each asset to Firebase Storage
    for (const asset of assets) {
      const downloadURL = await uploadProgramAssetToFirebaseStorage(
        asset,
        programUid,
        id,
        weekIndex,
        sessionIndex,
      );
      downloadURLs.push(downloadURL);
    }

    console.log('All assets uploaded to Firebase Storage successfully.');

    // Return the array of download URLs
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading assets to Firebase Storage:', error);
    throw error;
  }
};

export const removeMediaFromFirebaseStorage = async (
  programUid: string,
  weekIndex: number,
  sessionIndex: number,
  mediaId: string,
) => {
  try {
    const storage = getStorage(app);
    const mediaRef = ref(
      storage,
      `programs/${programUid}/assets/${weekIndex}/${sessionIndex}/${mediaId}`,
    );
    await deleteObject(mediaRef);
    console.log('Media removed from Firebase Storage successfully!');
  } catch (error) {
    console.error('Error removing media from Firebase Storage:', error);
    // Handle the error appropriately (e.g., show an error message to the user)
  }
};

export const removeWeekAssetsFromFirebaseStorage = async (
  programUid: string,
  weekIndex: number,
) => {
  try {
    const storage = getStorage(app);
    const weekAssetsRef = ref(
      storage,
      `programs/${programUid}/assets/${weekIndex}`,
    );
    const weekAssetsSnapshot = await listAll(weekAssetsRef);

    // Remove each session's assets within the week
    const removeSessionAssetsPromises = weekAssetsSnapshot.prefixes.map(
      sessionRef => {
        return listAll(sessionRef).then(sessionAssetsSnapshot => {
          const deleteAssetsPromises = sessionAssetsSnapshot.items.map(
            assetRef => deleteObject(assetRef),
          );
          return Promise.all(deleteAssetsPromises);
        });
      },
    );

    await Promise.all(removeSessionAssetsPromises);

    // Remove the week directory itself
    deleteObject(weekAssetsRef);

    console.log('Week assets removed from Firebase Storage successfully!');
  } catch (error) {
    console.error('Error removing week assets from Firebase Storage:', error);
    // Handle the error appropriately (e.g., show an error message to the user)
  }
};

export async function storeMediaFromUri(
  base64String: string,
  storagePath: string,
): Promise<string> {
  try {
    const storage = getStorage(app);

    // Create a reference to the location where the image will be stored
    const imageRef = ref(storage, storagePath);

    try {
      // Create a Blob from the base64 image data
      const blob = await fetch(base64String)
        .then(res => res.blob())
        .catch(error => {
          console.log('Error creating Blob:', error);
          throw error;
        });

      // Upload the Blob
      await uploadBytes(imageRef, blob).catch(error => {
        console.log('Error uploading Blob:', error);
        throw error;
      });
    } catch (error) {
      console.log(error);
    }

    // Get the download URL of the uploaded image
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  } catch (error) {
    console.log('Error in storeMediaFromBase64:', error);
    throw error;
  }
}


export async function storeMediaFromBase64(
  base64String: string,
  storagePath: string,
): Promise<string> {
  const maxRetries = 3;
  let retries = 0;
  

  while (retries < maxRetries) {
    try {
      const storage = getStorage(app);
      const imageRef = ref(storage, storagePath);
      const base64Data = ensureBase64ImageString(base64String);
      if (!base64Data) {
        throw new Error('Invalid base64 image data');
      }
      const base64Image = base64Data.split(',')[1];
      const blob = await fetch(base64String)
        .then(res => res.blob())
        .catch(error => {
          console.log('Error creating Blob:', error);
          throw error;
        });

      await uploadBytesResumable(imageRef, blob).catch(error => {
        console.log('Error uploading Blob:', error);
        throw error;
      });

      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      Alert.alert("", JSON.stringify(error))
      console.log('Error in storeMediaFromBase64:', error);
      retries++;

      if (retries === maxRetries) {
        throw error;
      }

      // Delay before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Failed to store media after multiple retries');
}

export const uploadVideoToStorage = async (path: string, uri: string) => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);

    const response = await fetch(uri);
    const blob = await response.blob();

    const snapshot = await uploadBytesResumable(storageRef, blob);
    console.log('Video uploaded successfully!');

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};