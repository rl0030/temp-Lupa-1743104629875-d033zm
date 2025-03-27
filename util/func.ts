import {requestCameraRollPermission} from './permissions';
import * as ImagePicker from 'react-native-image-picker';

export async function onSelectMediaSetup(
  cameraRollOptions: ImagePicker.ImageLibraryOptions,
  onError: (error: Error) => void,
  onPermissionsDenied: () => void,
) {
  const permissionsResult = await requestCameraRollPermission();

  try {
    if (!permissionsResult) {
      onPermissionsDenied();
      return;
    }

    // Make sure the includeBase64 options is present
    if (
      cameraRollOptions?.includeBase64 === false ||
      !Object.keys(cameraRollOptions).includes('includeBase64')
    ) {
      cameraRollOptions.includeBase64 = true;
    }
  } catch (error) {
    onError(error as Error);
  }
}

export const onSelectMedia = async (
  cameraRollOptions: ImagePicker.ImageLibraryOptions,
  onSuccess: (base64: string, uri: string) => void,
  onError: (error: Error) => void,
  onPermissionsDenied: () => void,
  onDidCancel: () => void,
) => {
  try {
    onSelectMediaSetup(cameraRollOptions, onError, onPermissionsDenied);

    const {assets, didCancel, errorCode, errorMessage} =
      await ImagePicker.launchImageLibrary(cameraRollOptions);

    // User closed the image picker without choosing
    if (didCancel) {
      await onDidCancel();
      return;
    }

    if (errorCode || errorMessage) {
      // Handle the error appropriately in the catch clause
      throw new Error(errorCode);
    }

    // Check if assets exist, is an array and has more than one item
    if (!assets || !Array.isArray(assets) || assets.length <= 0) {
      throw new Error('No assets received');
    }

    if (cameraRollOptions?.selectionLimit === 1) {
      const media: ImagePicker.Asset = assets[0];
      const {base64, uri, fileName, fileSize} = media;

      // Store the base64 encoded version
      if (base64 && uri) {
        await onSuccess(base64, uri);
      }
    }

    if (cameraRollOptions?.selectionLimit > 1) {
      const mediaPromises = assets.map((asset: ImagePicker.Asset) => {
        if (asset.base64 && asset.uri) {
          const {base64, uri} = asset;
          onSuccess(base64, uri);
        }
      });

      await Promise.all(mediaPromises);
    }
  } catch (error) {
    // TODO
    // Camera Roll Error Codes: https://github.com/react-native-image-picker/react-native-image-picker?tab=readme-ov-file#ErrorCode
    await onError(error as Error);
  }
};

export const onSelectMediaManaged = async (
  cameraRollOptions: ImagePicker.ImageLibraryOptions,
  onSuccess: ImagePicker.Callback,
  onError: (error: Error) => void,
  onPermissionsDenied: () => void,
  onDidCancel: () => void,
) => {
  try {
    onSelectMediaSetup(cameraRollOptions, onError, onPermissionsDenied);

    await ImagePicker.launchImageLibrary(cameraRollOptions, onSuccess);
  } catch (error) {
    // TODO
    // Camera Roll Error Codes: https://github.com/react-native-image-picker/react-native-image-picker?tab=readme-ov-file#ErrorCode
    await onError(error as Error);
  }
};
