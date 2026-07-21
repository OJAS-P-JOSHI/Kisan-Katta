import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import { deleteProfileImage, uploadProfileImage } from '../profile.service';
import { profileStrings } from '../profile.strings';
import type { ProfileImage } from '../profile.types';

export type UseProfilePhotoOptions = {
  profileImage: ProfileImage | null | undefined;
  /** Refetch profile from the backend after a successful upload/delete. */
  refreshProfile: () => Promise<void>;
};

export type UseProfilePhotoReturn = {
  /** Local preview URI during upload; otherwise the remote Cloudinary URL. */
  displayUri: string | null;
  hasRemoteImage: boolean;
  isUploadingPhoto: boolean;
  isBusy: boolean;
  uploadError: string | null;
  showPhotoActions: () => void;
};

const promptOpenSettings = (message: string): void => {
  Alert.alert(message, undefined, [
    { text: profileStrings.photo.cancel, style: 'cancel' },
    {
      text: profileStrings.photo.openSettings,
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
};

/**
 * Camera / gallery picking and immediate profile-photo upload/delete.
 * Upload state is local to this hook; profile image itself comes from `useMyProfile`.
 */
export function useProfilePhoto({
  profileImage,
  refreshProfile,
}: UseProfilePhotoOptions): UseProfilePhotoReturn {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const hasRemoteImage = Boolean(profileImage?.url);
  const displayUri = previewUri ?? profileImage?.url ?? null;
  const isBusy = isUploadingPhoto || isRemovingPhoto;

  const uploadSelectedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset): Promise<void> => {
      if (busyRef.current) return;

      busyRef.current = true;
      setIsUploadingPhoto(true);
      setUploadError(null);
      setPreviewUri(asset.uri);

      try {
        const mimeType = asset.mimeType ?? 'image/jpeg';
        const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
        await uploadProfileImage(asset.uri, fileName, mimeType);
        await refreshProfile();
        setPreviewUri(null);
        Alert.alert(profileStrings.photo.uploadSuccess);
      } catch {
        setPreviewUri(null);
        const message = `${profileStrings.photo.uploadFailed}\n${profileStrings.photo.uploadFailedHint}`;
        setUploadError(message);
        Alert.alert(profileStrings.photo.uploadFailed, profileStrings.photo.uploadFailedHint);
      } finally {
        busyRef.current = false;
        setIsUploadingPhoto(false);
      }
    },
    [refreshProfile],
  );

  const pickFromCamera = useCallback(async (): Promise<void> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(profileStrings.photo.cameraPermission);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadSelectedAsset(result.assets[0]);
    }
  }, [uploadSelectedAsset]);

  const pickFromGallery = useCallback(async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(profileStrings.photo.galleryPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: false,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadSelectedAsset(result.assets[0]);
    }
  }, [uploadSelectedAsset]);

  const removePhoto = useCallback(async (): Promise<void> => {
    if (busyRef.current || !hasRemoteImage) return;

    busyRef.current = true;
    setIsRemovingPhoto(true);
    setUploadError(null);

    try {
      await deleteProfileImage();
      await refreshProfile();
      setPreviewUri(null);
      Alert.alert(profileStrings.photo.deleteSuccess);
    } catch {
      setUploadError(profileStrings.photo.deleteFailed);
      Alert.alert(profileStrings.photo.deleteFailed);
    } finally {
      busyRef.current = false;
      setIsRemovingPhoto(false);
    }
  }, [hasRemoteImage, refreshProfile]);

  const showPhotoActions = useCallback((): void => {
    if (busyRef.current) return;

    const onCamera = () => {
      void pickFromCamera();
    };
    const onGallery = () => {
      void pickFromGallery();
    };
    const onRemove = () => {
      void removePhoto();
    };

    if (Platform.OS === 'ios') {
      const options = hasRemoteImage
        ? [
            profileStrings.photo.cancel,
            profileStrings.photo.takePhoto,
            profileStrings.photo.chooseGallery,
            profileStrings.photo.removePhoto,
          ]
        : [
            profileStrings.photo.cancel,
            profileStrings.photo.takePhoto,
            profileStrings.photo.chooseGallery,
          ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: hasRemoteImage ? 3 : undefined,
        },
        (index) => {
          if (index === 1) onCamera();
          if (index === 2) onGallery();
          if (hasRemoteImage && index === 3) onRemove();
        },
      );
      return;
    }

    Alert.alert(profileStrings.photo.pickerTitle, undefined, [
      { text: profileStrings.photo.cancel, style: 'cancel' },
      { text: profileStrings.photo.takePhoto, onPress: onCamera },
      { text: profileStrings.photo.chooseGallery, onPress: onGallery },
      ...(hasRemoteImage
        ? [{ text: profileStrings.photo.removePhoto, style: 'destructive' as const, onPress: onRemove }]
        : []),
    ]);
  }, [hasRemoteImage, pickFromCamera, pickFromGallery, removePhoto]);

  return {
    displayUri,
    hasRemoteImage,
    isUploadingPhoto,
    isBusy,
    uploadError,
    showPhotoActions,
  };
}
