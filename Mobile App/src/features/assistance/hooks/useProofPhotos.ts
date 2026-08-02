import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import {
  IMAGE_COMPRESSION_QUALITY,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PROOF_PHOTOS,
  MIN_PROOF_PHOTO_EDGE_PX,
} from '../assistance.constants';
import { assistanceStrings } from '../assistance.strings';
import { deleteAssistanceImage, uploadAssistanceImage } from '../assistance.service';
import type { HelpRequestImage } from '../assistance.types';
import { normalizeHelpRequestImages } from '../assistance.utils';

export type LocalPhotoSlot = {
  kind: 'local';
  id: string;
  uri: string;
  mimeType: string;
  fileName: string;
};

export type RemotePhotoSlot = {
  kind: 'remote';
  id: string;
  url: string;
  publicId: string;
};

export type PhotoSlot = LocalPhotoSlot | RemotePhotoSlot;

export type UploadProgress = {
  current: number;
  total: number;
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toRemoteSlot = (image: HelpRequestImage): RemotePhotoSlot => ({
  kind: 'remote',
  id: createId(),
  url: image.url,
  publicId: image.publicId,
});

const toLocalSlot = (asset: ImagePicker.ImagePickerAsset): LocalPhotoSlot => ({
  kind: 'local',
  id: createId(),
  uri: asset.uri,
  mimeType: asset.mimeType ?? 'image/jpeg',
  fileName: asset.fileName ?? `proof-${Date.now()}.jpg`,
});

const isNetworkError = (error: unknown): boolean =>
  axios.isAxiosError(error) && !error.response;

/** Rejects unsupported MIME types before the file leaves the device. */
const isSupportedType = (asset: ImagePicker.ImagePickerAsset): boolean => {
  const mimeType = asset.mimeType?.toLowerCase();
  if (!mimeType) return true;
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Rejects photos still above 5 MB after picker compression. A missing
 * `fileSize` is treated as unknown and allowed — the server enforces the limit.
 */
const isWithinSizeLimit = (asset: ImagePicker.ImagePickerAsset): boolean => {
  const size = asset.fileSize;
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) return true;
  return size <= MAX_IMAGE_SIZE_BYTES;
};

export class ProofPhotoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofPhotoUploadError';
  }
}

const promptOpenSettings = (message: string) => {
  Alert.alert(message, undefined, [
    { text: assistanceStrings.lifecycle.cancel, style: 'cancel' },
    {
      text: assistanceStrings.images.openSettings,
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
};

/**
 * Manages proof photo slots: picking with compression, local previews,
 * Cloudinary metadata, and publish-time uploads.
 */
export function useProofPhotos(initialImages?: unknown) {
  const [slots, setSlots] = useState<PhotoSlot[]>(() =>
    normalizeHelpRequestImages(initialImages).map(toRemoteSlot),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadingRef = useRef(false);

  const canAddMore = slots.length < MAX_PROOF_PHOTOS;
  const remainingSlots = MAX_PROOF_PHOTOS - slots.length;
  const hasPhotos = slots.length > 0;

  const clearUploadError = useCallback(() => setUploadError(null), []);

  const addAssets = useCallback(
    (assets: ImagePicker.ImagePickerAsset[]) => {
      if (assets.length === 0) return;

      const available = MAX_PROOF_PHOTOS - slots.length;
      if (available <= 0) {
        Alert.alert(assistanceStrings.images.maxReached);
        return;
      }

      if (assets.length > available) {
        Alert.alert(assistanceStrings.images.maxSelected);
      }

      const candidates = assets.slice(0, available);

      if (candidates.some((asset) => !isSupportedType(asset))) {
        Alert.alert(assistanceStrings.images.unsupportedType);
      }

      const typed = candidates.filter(isSupportedType);

      if (typed.some((asset) => !isWithinSizeLimit(asset))) {
        Alert.alert(assistanceStrings.images.tooLarge);
      }

      const sized = typed.filter(isWithinSizeLimit);

      const isLargeEnough = (asset: ImagePicker.ImagePickerAsset): boolean => {
        const edge = Math.min(asset.width ?? 0, asset.height ?? 0);
        // Missing dimensions are allowed — server still validates the bytes.
        if (edge <= 0) return true;
        return edge >= MIN_PROOF_PHOTO_EDGE_PX;
      };

      if (sized.some((asset) => !isLargeEnough(asset))) {
        Alert.alert(assistanceStrings.images.tooSmall);
      }

      const nextSlots = sized.filter(isLargeEnough).map(toLocalSlot);
      if (nextSlots.length === 0) return;

      setSlots((prev) => [...prev, ...nextSlots]);
      clearUploadError();
    },
    [clearUploadError, slots.length],
  );

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(assistanceStrings.images.cameraPermission);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: IMAGE_COMPRESSION_QUALITY,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      addAssets([result.assets[0]]);
    }
  }, [addAssets]);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(assistanceStrings.images.galleryPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: IMAGE_COMPRESSION_QUALITY,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      allowsEditing: false,
    });

    if (!result.canceled) {
      addAssets(result.assets);
    }
  }, [addAssets, remainingSlots]);

  const showPhotoSourcePicker = useCallback(() => {
    if (!canAddMore) {
      Alert.alert(assistanceStrings.images.maxReached);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            assistanceStrings.lifecycle.cancel,
            assistanceStrings.images.takePhoto,
            assistanceStrings.images.chooseGallery,
          ],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void pickFromCamera();
          if (index === 2) void pickFromGallery();
        },
      );
      return;
    }

    Alert.alert(assistanceStrings.images.pickerTitle, undefined, [
      { text: assistanceStrings.lifecycle.cancel, style: 'cancel' },
      { text: assistanceStrings.images.takePhoto, onPress: () => void pickFromCamera() },
      {
        text: assistanceStrings.images.chooseGallery,
        onPress: () => void pickFromGallery(),
      },
    ]);
  }, [canAddMore, pickFromCamera, pickFromGallery]);

  const removePhoto = useCallback(
    async (index: number) => {
      const slot = slots[index];
      if (!slot) return;

      if (slot.kind === 'remote' && slot.publicId) {
        try {
          await deleteAssistanceImage(slot.publicId);
        } catch {
          Alert.alert(assistanceStrings.images.deleteFailed);
          return;
        }
      }

      setSlots((prev) => prev.filter((_, i) => i !== index));
      clearUploadError();
    },
    [clearUploadError, slots],
  );

  const uploadAll = useCallback(async (): Promise<HelpRequestImage[]> => {
    if (uploadingRef.current) {
      throw new Error('Upload already in progress');
    }

    const localSlots = slots.filter((slot): slot is LocalPhotoSlot => slot.kind === 'local');
    const remoteImages: HelpRequestImage[] = slots
      .filter((slot): slot is RemotePhotoSlot => slot.kind === 'remote')
      .map((slot) => ({ url: slot.url, publicId: slot.publicId }));

    if (localSlots.length === 0) {
      return remoteImages;
    }

    uploadingRef.current = true;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: localSlots.length });

    const uploadedImages: HelpRequestImage[] = [];

    try {
      for (let index = 0; index < localSlots.length; index += 1) {
        const local = localSlots[index]!;
        const uploaded = await uploadAssistanceImage(
          local.uri,
          local.fileName,
          local.mimeType,
        );
        uploadedImages.push(uploaded);
        setUploadProgress({ current: index + 1, total: localSlots.length });
      }

      const nextSlots: PhotoSlot[] = [];
      let uploadIndex = 0;

      for (const slot of slots) {
        if (slot.kind === 'local') {
          nextSlots.push(toRemoteSlot(uploadedImages[uploadIndex]!));
          uploadIndex += 1;
        } else {
          nextSlots.push(slot);
        }
      }

      setSlots(nextSlots);

      return nextSlots
        .map((slot) =>
          slot.kind === 'remote'
            ? { url: slot.url, publicId: slot.publicId }
            : { url: '', publicId: '' },
        )
        .filter((image) => image.url.length > 0);
    } catch (error) {
      const message = isNetworkError(error)
        ? assistanceStrings.images.offline
        : assistanceStrings.images.uploadFailed;
      setUploadError(message);
      throw new ProofPhotoUploadError(message);
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [slots]);

  const previewUris = useMemo(
    () => slots.map((slot) => (slot.kind === 'local' ? slot.uri : slot.url)),
    [slots],
  );

  return {
    slots,
    previewUris,
    hasPhotos,
    canAddMore,
    isUploading,
    uploadProgress,
    uploadError,
    clearUploadError,
    showPhotoSourcePicker,
    removePhoto,
    uploadAll,
  };
}

export type UseProofPhotosReturn = ReturnType<typeof useProofPhotos>;
