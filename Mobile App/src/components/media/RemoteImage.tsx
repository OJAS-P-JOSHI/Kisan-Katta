import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    setStatus('loading');
  }, [displayUri, reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant },
        containerStyle,
      ]}
    >
      {status !== 'error' ? (
        <Image
          key={`${displayUri}-${reloadKey}`}
          source={{ uri: displayUri }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          accessibilityLabel={accessibilityLabel}
          onLoadStart={() => setStatus('loading')}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
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
