import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import { MAX_LISTING_IMAGES } from '../marketplace.constants';
import { marketplaceStrings } from '../marketplace.strings';
import { deleteMarketplaceImage, uploadMarketplaceImage } from '../marketplace.service';
import type { ListingImage } from '../marketplace.types';
import { normalizeListingImages } from '../marketplace.utils';

export type LocalImageSlot = {
  kind: 'local';
  id: string;
  uri: string;
  mimeType: string;
  fileName: string;
};

export type RemoteImageSlot = {
  kind: 'remote';
  id: string;
  url: string;
  publicId: string;
};

export type ImageSlot = LocalImageSlot | RemoteImageSlot;

export type UploadProgress = {
  current: number;
  total: number;
};

type UseListingImagesOptions = {
  initialImages?: unknown;
  maxImages?: number;
};

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toRemoteSlot = (image: ListingImage): RemoteImageSlot => ({
  kind: 'remote',
  id: createId(),
  url: image.url,
  publicId: image.publicId,
});

const toLocalSlot = (asset: ImagePicker.ImagePickerAsset): LocalImageSlot => ({
  kind: 'local',
  id: createId(),
  uri: asset.uri,
  mimeType: asset.mimeType ?? 'image/jpeg',
  fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
});

const isNetworkError = (error: unknown): boolean =>
  axios.isAxiosError(error) && !error.response;

export class MarketplaceImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceImageUploadError';
  }
}

const promptOpenSettings = (message: string) => {
  Alert.alert(message, undefined, [
    { text: marketplaceStrings.lifecycle.cancel, style: 'cancel' },
    {
      text: marketplaceStrings.images.openSettings,
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
};

/** Manages local previews, Cloudinary metadata, and publish-time uploads. */
export function useListingImages(
  initialImagesOrOptions?: unknown | UseListingImagesOptions,
  maybeMaxImages?: number,
) {
  const options: UseListingImagesOptions =
    initialImagesOrOptions !== null &&
    typeof initialImagesOrOptions === 'object' &&
    !Array.isArray(initialImagesOrOptions) &&
    ('initialImages' in (initialImagesOrOptions as object) ||
      'maxImages' in (initialImagesOrOptions as object))
      ? (initialImagesOrOptions as UseListingImagesOptions)
      : { initialImages: initialImagesOrOptions, maxImages: maybeMaxImages };

  const [maxImages, setMaxImagesState] = useState(
    options.maxImages ?? MAX_LISTING_IMAGES,
  );
  const isLabourLimit = maxImages < MAX_LISTING_IMAGES;

  const [slots, setSlots] = useState<ImageSlot[]>(() =>
    normalizeListingImages(options.initialImages).map(toRemoteSlot),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadingRef = useRef(false);
  const maxImagesRef = useRef(maxImages);
  maxImagesRef.current = maxImages;

  const canAddMore = slots.length < maxImages;
  const remainingSlots = maxImages - slots.length;

  const clearUploadError = useCallback(() => setUploadError(null), []);

  const addAssets = useCallback(
    (assets: ImagePicker.ImagePickerAsset[]) => {
      if (assets.length === 0) return;

      const limit = maxImagesRef.current;
      const available = limit - slots.length;
      if (available <= 0) {
        Alert.alert(
          isLabourLimit
            ? marketplaceStrings.images.maxReachedLabour
            : marketplaceStrings.images.maxReached,
        );
        return;
      }

      if (assets.length > available) {
        Alert.alert(
          isLabourLimit
            ? marketplaceStrings.images.maxSelectedLabour
            : marketplaceStrings.images.maxSelected,
        );
      }

      const nextSlots = assets.slice(0, available).map(toLocalSlot);
      setSlots((prev) => [...prev, ...nextSlots]);
      clearUploadError();
    },
    [clearUploadError, isLabourLimit, slots.length],
  );

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(marketplaceStrings.images.cameraPermission);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      addAssets([result.assets[0]]);
    }
  }, [addAssets]);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      promptOpenSettings(marketplaceStrings.images.galleryPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      allowsEditing: false,
    });

    if (!result.canceled) {
      addAssets(result.assets);
    }
  }, [addAssets, remainingSlots]);

  const showImageSourcePicker = useCallback(() => {
    if (!canAddMore) {
      Alert.alert(
        isLabourLimit
          ? marketplaceStrings.images.maxReachedLabour
          : marketplaceStrings.images.maxReached,
      );
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            marketplaceStrings.lifecycle.cancel,
            marketplaceStrings.images.takePhoto,
            marketplaceStrings.images.chooseGallery,
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

    Alert.alert(marketplaceStrings.images.pickerTitle, undefined, [
      { text: marketplaceStrings.lifecycle.cancel, style: 'cancel' },
      { text: marketplaceStrings.images.takePhoto, onPress: () => void pickFromCamera() },
      { text: marketplaceStrings.images.chooseGallery, onPress: () => void pickFromGallery() },
    ]);
  }, [canAddMore, isLabourLimit, pickFromCamera, pickFromGallery]);

  const removeImage = useCallback(async (index: number) => {
    const slot = slots[index];
    if (!slot) return;

    if (slot.kind === 'remote' && slot.publicId) {
      try {
        await deleteMarketplaceImage(slot.publicId);
      } catch {
        Alert.alert(marketplaceStrings.images.uploadFailed);
        return;
      }
    }

    setSlots((prev) => prev.filter((_, i) => i !== index));
    clearUploadError();
  }, [clearUploadError, slots]);

  /** Clears local/remote slots (e.g. when create form switches listing type). */
  const clearImages = useCallback(() => {
    setSlots([]);
    clearUploadError();
  }, [clearUploadError]);

  /**
   * Updates the max image cap and trims excess local slots.
   * Remote extras are dropped from state only (create flow); edit locks listing type.
   */
  const setMaxImages = useCallback((nextMax: number) => {
    setMaxImagesState(nextMax);
    maxImagesRef.current = nextMax;
    setSlots((prev) => (prev.length > nextMax ? prev.slice(0, nextMax) : prev));
  }, []);

  const uploadAll = useCallback(async (): Promise<ListingImage[]> => {
    if (uploadingRef.current) {
      throw new Error('Upload already in progress');
    }

    const localSlots = slots.filter((slot): slot is LocalImageSlot => slot.kind === 'local');
    const remoteImages: ListingImage[] = slots
      .filter((slot): slot is RemoteImageSlot => slot.kind === 'remote')
      .map((slot) => ({ url: slot.url, publicId: slot.publicId }));

    if (localSlots.length === 0) {
      return remoteImages;
    }

    uploadingRef.current = true;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: localSlots.length });

    const uploadedImages: ListingImage[] = [];

    try {
      for (let index = 0; index < localSlots.length; index += 1) {
        const local = localSlots[index]!;
        const uploaded = await uploadMarketplaceImage(local.uri, local.fileName, local.mimeType);
        uploadedImages.push(uploaded);
        setUploadProgress({ current: index + 1, total: localSlots.length });
      }

      const nextSlots: ImageSlot[] = [];
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
      return nextSlots.map((slot) =>
        slot.kind === 'remote' ? { url: slot.url, publicId: slot.publicId } : { url: '', publicId: '' },
      ).filter((image) => image.url.length > 0);
    } catch (error) {
      const message = isNetworkError(error)
        ? marketplaceStrings.images.offline
        : marketplaceStrings.images.uploadFailed;
      setUploadError(message);
      throw new MarketplaceImageUploadError(message);
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [slots]);

  const previewUris = useMemo(
    () =>
      slots.map((slot) => (slot.kind === 'local' ? slot.uri : slot.url)),
    [slots],
  );

  return {
    slots,
    previewUris,
    canAddMore,
    isUploading,
    uploadProgress,
    uploadError,
    clearUploadError,
    clearImages,
    setMaxImages,
    showImageSourcePicker,
    removeImage,
    uploadAll,
  };
}

export type UseListingImagesReturn = ReturnType<typeof useListingImages>;
