import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import { isProfileImageWithinSizeLimit } from '../profile.imageValidation';
import { deleteProfileImage, uploadProfileImage } from '../profile.service';
import { profileStrings } from '../profile.strings';
import type { ProfileImage } from '../profile.types';

export type UseProfilePhotoOptions = {
  profileImage: ProfileImage | null | undefined;
  /** Refetch profile from the backend after a successful upload/delete. */
  refreshProfile: () => Promise<void>;
  /**
   * When false, selected photo is kept locally and uploaded later via
   * `uploadPendingPhoto()` (useful during first-time profile creation).
   */
  canUploadNow?: boolean;
};

export type UseProfilePhotoReturn = {
  /** Local preview URI during upload; otherwise the remote Cloudinary URL. */
  displayUri: string | null;
  hasRemoteImage: boolean;
  hasPendingPhoto: boolean;
  isUploadingPhoto: boolean;
  isBusy: boolean;
  uploadError: string | null;
  uploadPendingPhoto: () => Promise<boolean>;
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

/** Shared size gate used by camera, gallery, pending set, and retry upload. */
const rejectIfImageTooLarge = (asset: ImagePicker.ImagePickerAsset): boolean => {
  if (isProfileImageWithinSizeLimit(asset)) return false;

  Alert.alert(profileStrings.photo.sizeExceeded, profileStrings.photo.sizeExceededEn);
  return true;
};

/**
 * Camera / gallery picking and immediate profile-photo upload/delete.
 * Upload state is local to this hook; profile image itself comes from `useMyProfile`.
 */
export function useProfilePhoto({
  profileImage,
  refreshProfile,
  canUploadNow = true,
}: UseProfilePhotoOptions): UseProfilePhotoReturn {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const pendingAssetRef = useRef<ImagePicker.ImagePickerAsset | null>(null);

  const hasRemoteImage = Boolean(profileImage?.url);
  const displayUri = previewUri ?? profileImage?.url ?? null;
  const hasPendingPhoto = pendingAssetRef.current !== null;
  const isBusy = isUploadingPhoto || isRemovingPhoto;

  const uploadSelectedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset): Promise<boolean> => {
      if (busyRef.current) return false;
      if (rejectIfImageTooLarge(asset)) {
        setUploadError(profileStrings.photo.sizeExceeded);
        return false;
      }

      busyRef.current = true;
      setIsUploadingPhoto(true);
      setUploadError(null);
      setPreviewUri(asset.uri);
      pendingAssetRef.current = asset;

      try {
        const mimeType = asset.mimeType ?? 'image/jpeg';
        const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
        await uploadProfileImage(asset.uri, fileName, mimeType);
        await refreshProfile();
        setPreviewUri(null);
        pendingAssetRef.current = null;
        Alert.alert(profileStrings.photo.uploadSuccess);
        return true;
      } catch {
        // Keep the local preview + pending asset so the caller can retry once
        // profile creation succeeds (first-time onboarding case).
        const message = `${profileStrings.photo.uploadFailed}\n${profileStrings.photo.uploadFailedHint}`;
        setUploadError(message);
        Alert.alert(profileStrings.photo.uploadFailed, profileStrings.photo.uploadFailedHint);
        return false;
      } finally {
        busyRef.current = false;
        setIsUploadingPhoto(false);
      }
    },
    [refreshProfile],
  );

  const setPendingAsset = useCallback((asset: ImagePicker.ImagePickerAsset): void => {
    if (rejectIfImageTooLarge(asset)) {
      setUploadError(profileStrings.photo.sizeExceeded);
      return;
    }
    pendingAssetRef.current = asset;
    setUploadError(null);
    setPreviewUri(asset.uri);
  }, []);

  const uploadPendingPhoto = useCallback(async (): Promise<boolean> => {
    const pending = pendingAssetRef.current;
    if (!pending) return true;
    return uploadSelectedAsset(pending);
  }, [uploadSelectedAsset]);

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
      if (canUploadNow) {
        await uploadSelectedAsset(result.assets[0]);
      } else {
        setPendingAsset(result.assets[0]);
      }
    }
  }, [canUploadNow, setPendingAsset, uploadSelectedAsset]);

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
      if (canUploadNow) {
        await uploadSelectedAsset(result.assets[0]);
      } else {
        setPendingAsset(result.assets[0]);
      }
    }
  }, [canUploadNow, setPendingAsset, uploadSelectedAsset]);

  const removePhoto = useCallback(async (): Promise<void> => {
    if (busyRef.current) return;
    if (!canUploadNow && pendingAssetRef.current) {
      pendingAssetRef.current = null;
      setPreviewUri(null);
      setUploadError(null);
      return;
    }
    if (!hasRemoteImage) return;

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
  }, [canUploadNow, hasRemoteImage, refreshProfile]);

  const showPhotoActions = useCallback((): void => {
    if (busyRef.current) return;
    const canRemove = hasRemoteImage || pendingAssetRef.current !== null;

    const onCamera = () => {
      void pickFromCamera();
    };
    const onGallery = () => {
      void pickFromGallery();
    };
    const onRemove = () => {
      void removePhoto();
    };
    const onSkip = () => {};

    if (Platform.OS === 'ios') {
      const options = canRemove
        ? [
            profileStrings.photo.cancel,
            profileStrings.photo.takePhoto,
            profileStrings.photo.chooseGallery,
            profileStrings.photo.removePhoto,
            profileStrings.photo.skip,
          ]
        : [
            profileStrings.photo.cancel,
            profileStrings.photo.takePhoto,
            profileStrings.photo.chooseGallery,
            profileStrings.photo.skip,
          ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: canRemove ? 3 : undefined,
        },
        (index) => {
          if (index === 1) onCamera();
          if (index === 2) onGallery();
          if (canRemove && index === 3) onRemove();
          if ((canRemove && index === 4) || (!canRemove && index === 3)) onSkip();
        },
      );
      return;
    }

    Alert.alert(profileStrings.photo.pickerTitle, undefined, [
      { text: profileStrings.photo.cancel, style: 'cancel' },
      { text: profileStrings.photo.takePhoto, onPress: onCamera },
      { text: profileStrings.photo.chooseGallery, onPress: onGallery },
      ...(canRemove
        ? [
            { text: profileStrings.photo.removePhoto, style: 'destructive' as const, onPress: onRemove },
            { text: profileStrings.photo.skip, onPress: onSkip },
          ]
        : [{ text: profileStrings.photo.skip, onPress: onSkip }]),
    ]);
  }, [hasRemoteImage, pickFromCamera, pickFromGallery, removePhoto]);

  return {
    displayUri,
    hasRemoteImage,
    hasPendingPhoto,
    isUploadingPhoto,
    isBusy,
    uploadError,
    uploadPendingPhoto,
    showPhotoActions,
  };
}
