import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Button, ProgressBar, Text } from 'react-native-paper';

import { radius, spacing } from '@/theme';

import type { UseListingImagesReturn } from '../hooks/useListingImages';
import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type ListingImagePickerProps = {
  images: UseListingImagesReturn;
  disabled?: boolean;
  onRetry?: () => void;
  /** Override max images display/limit (e.g. 2 for labour). */
  maxImages?: number;
};

function ListingImagePickerComponent({
  images,
  disabled = false,
  onRetry,
  maxImages,
}: ListingImagePickerProps) {
  const { width } = useWindowDimensions();
  const {
    previewUris,
    canAddMore: hookCanAddMore,
    isUploading,
    uploadProgress,
    uploadError,
    showImageSourcePicker,
    removeImage,
    clearUploadError,
  } = images;

  const canAddMore =
    maxImages !== undefined ? previewUris.length < maxImages && hookCanAddMore : hookCanAddMore;
  const maxReachedMessage =
    maxImages !== undefined && maxImages <= 2
      ? marketplaceStrings.images.maxReachedLabour
      : marketplaceStrings.images.maxReached;

  const handleAddPress = () => {
    if (!canAddMore) {
      Alert.alert(maxReachedMessage);
      return;
    }
    showImageSourcePicker();
  };

  const progressValue =
    uploadProgress && uploadProgress.total > 0
      ? uploadProgress.current / uploadProgress.total
      : 0;

  const thumbSize = Math.max(88, Math.min(108, Math.floor((width - 72) / 3)));

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {previewUris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={[styles.thumbWrap, { width: thumbSize, height: thumbSize }]}>
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            <Pressable
              style={styles.removeButton}
              onPress={() => void removeImage(index)}
              disabled={disabled || isUploading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={marketplaceStrings.images.removePhoto}
            >
              <MaterialCommunityIcons name="close" size={14} color={mp.white} />
            </Pressable>
          </View>
        ))}

        {canAddMore ? (
          <Pressable
            style={[styles.addTile, { width: thumbSize, height: thumbSize }]}
            onPress={handleAddPress}
            disabled={disabled || isUploading}
            accessibilityRole="button"
            accessibilityLabel={marketplaceStrings.images.addPhoto}
          >
            <MaterialCommunityIcons name="camera-plus-outline" size={28} color={mp.primaryGreen} />
            <Text variant="labelMedium" style={styles.addLabel}>
              {marketplaceStrings.images.addPhoto}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!canAddMore ? (
        <Text variant="bodySmall" style={styles.hint}>
          {maxReachedMessage}
        </Text>
      ) : null}

      {isUploading && uploadProgress ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <ActivityIndicator animating size="small" color={mp.primaryGreen} />
            <Text variant="bodyMedium" style={{ color: mp.headingGreen }}>
              {marketplaceStrings.images.uploading}
            </Text>
          </View>
          <ProgressBar progress={progressValue} color={mp.primaryGreen} style={styles.progressBar} />
          <Text variant="bodySmall" style={styles.hint}>
            {marketplaceStrings.images.uploadProgress(uploadProgress.current, uploadProgress.total)}
          </Text>
        </View>
      ) : null}

      {uploadError ? (
        <View style={styles.errorBlock}>
          <Text variant="bodyMedium" style={{ color: '#BA1A1A' }}>
            {uploadError}
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
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

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BA1A1A',
  },
  addTile: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: mp.searchBorder,
    backgroundColor: mp.produceBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  addLabel: { color: mp.primaryGreen, textAlign: 'center', fontWeight: '700' },
  hint: { color: mp.bodyGrey },
  progressBlock: { gap: spacing.xs, marginTop: spacing.xs },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: { height: 8, borderRadius: radius.sm },
  errorBlock: { gap: spacing.xs },
  retryButton: { alignSelf: 'flex-start' },
});
