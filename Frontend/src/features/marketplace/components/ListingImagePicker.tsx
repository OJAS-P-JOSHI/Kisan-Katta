import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, ProgressBar, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import type { UseListingImagesReturn } from '../hooks/useListingImages';
import { marketplaceStrings } from '../marketplace.strings';

type ListingImagePickerProps = {
  images: UseListingImagesReturn;
  disabled?: boolean;
  onRetry?: () => void;
};

function ListingImagePickerComponent({ images, disabled = false, onRetry }: ListingImagePickerProps) {
  const theme = useAppTheme();
  const {
    previewUris,
    canAddMore,
    isUploading,
    uploadProgress,
    uploadError,
    showImageSourcePicker,
    removeImage,
    clearUploadError,
  } = images;

  const progressValue =
    uploadProgress && uploadProgress.total > 0
      ? uploadProgress.current / uploadProgress.total
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {previewUris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            <Pressable
              style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
              onPress={() => void removeImage(index)}
              disabled={disabled || isUploading}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close" size={14} color={theme.colors.onError} />
            </Pressable>
          </View>
        ))}

        {canAddMore ? (
          <Pressable
            style={[styles.addTile, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
            onPress={showImageSourcePicker}
            disabled={disabled || isUploading}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={28} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, textAlign: 'center' }}>
              {marketplaceStrings.images.addPhoto}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!canAddMore ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {marketplaceStrings.images.maxReached}
        </Text>
      ) : null}

      {isUploading && uploadProgress ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <ActivityIndicator animating size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {marketplaceStrings.images.uploading}
            </Text>
          </View>
          <ProgressBar progress={progressValue} color={theme.colors.primary} style={styles.progressBar} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {marketplaceStrings.images.uploadProgress(uploadProgress.current, uploadProgress.total)}
          </Text>
        </View>
      ) : null}

      {uploadError ? (
        <View style={styles.errorBlock}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {uploadError}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {marketplaceStrings.images.uploadFailedHint}
          </Text>
          <Button mode="outlined" onPress={onRetry ?? clearUploadError} style={styles.retryButton} compact>
            {marketplaceStrings.images.retry}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const ListingImagePicker = memo(ListingImagePickerComponent);

const THUMB_SIZE = 100;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  progressBlock: { gap: spacing.xs, marginTop: spacing.xs },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: { height: 8, borderRadius: radius.sm },
  errorBlock: { gap: spacing.xs },
  retryButton: { alignSelf: 'flex-start' },
});
