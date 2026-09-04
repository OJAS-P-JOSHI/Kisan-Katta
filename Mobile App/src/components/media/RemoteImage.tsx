import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, spacing, useAppTheme } from '@/theme';
import { buildCloudinaryDisplayUrl } from '@/utils/cloudinaryDisplayUrl';

type RemoteImageProps = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** Max width for Cloudinary c_limit transform. */
  displayWidth?: number;
  accessibilityLabel?: string;
};

/**
 * Network image with explicit loading / error / retry states.
 * Avoids the permanent gray-rectangle flash when a URI fails or is slow.
 */
function RemoteImageComponent({
  uri,
  style,
  containerStyle,
  resizeMode = 'cover',
  displayWidth = 1200,
  accessibilityLabel,
}: RemoteImageProps) {
  const theme = useAppTheme();
  const displayUri = buildCloudinaryDisplayUrl(uri, displayWidth);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  const imageSource = useMemo(() => ({ uri: displayUri }), [displayUri]);
  const imageStyle = useMemo(
    () => StyleSheet.flatten([styles.image, style]),
    [style],
  );
  const containerStyles = useMemo(
    () => [styles.container, { backgroundColor: theme.colors.surfaceVariant }, containerStyle],
    [theme.colors.surfaceVariant, containerStyle],
  );

  useEffect(() => {
    setStatus('loading');
  }, [displayUri, reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
  }, []);

  const handleError = useCallback(() => {
    setStatus('error');
  }, []);

  return (
    <View style={containerStyles}>
      {status !== 'error' ? (
        <Image
          key={`${displayUri}-${reloadKey}`}
          source={imageSource}
          style={imageStyle}
          resizeMode={resizeMode}
          accessibilityLabel={accessibilityLabel}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}

      {status === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}

      {status === 'error' ? (
        <Pressable
          style={styles.overlay}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry image"
        >
          <MaterialCommunityIcons
            name="image-off-outline"
            size={iconSize.xl}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            पुन्हा प्रयत्न करा
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const RemoteImage = memo(RemoteImageComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
