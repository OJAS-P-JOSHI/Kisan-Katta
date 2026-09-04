import { Image, StyleSheet, View } from 'react-native';

/**
 * Shared compact scenic header used by Marketplace home (source of truth)
 * and साथ. Cream must stay `#FDF9F3` so the fade matches Marketplace.
 */
const LANDSCAPE = require('../../../assets/branding/login-landscape.webp');

const CREAM = '#FDF9F3';
const BOTTOM_FADE_STEPS = 14;
const LEFT_FADE_STEPS = 8;

export function headerBandHeight(insetTop: number): number {
  return Math.round(Math.max(170, Math.min(190, insetTop + 138)));
}

type HeaderLandscapeStripProps = {
  width: number;
  height: number;
};

/** Compact landscape strip — cover-crop only, fades into cream. No overlays that darken the art. */
export function HeaderLandscapeStrip({ width, height }: HeaderLandscapeStripProps) {
  const imgW = Math.round(width * 1.36);
  const imgH = Math.round(height * 1.5);
  const fadeH = Math.round(height * 0.5);

  return (
    <View pointerEvents="none" style={styles.headerArtClip}>
      <Image
        source={LANDSCAPE}
        resizeMode="cover"
        style={{
          position: 'absolute',
          width: imgW,
          height: imgH,
          left: Math.round(-(width * 0.3)),
          top: Math.round(-(height * 0.08)),
        }}
      />
      <View style={styles.headerLeftFade}>
        {Array.from({ length: LEFT_FADE_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.headerFadeSlice,
              { opacity: ((LEFT_FADE_STEPS - i) / LEFT_FADE_STEPS) * 0.32 },
            ]}
          />
        ))}
      </View>
      <View style={[styles.headerBottomFade, { height: fadeH }]}>
        {Array.from({ length: BOTTOM_FADE_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.headerFadeSlice,
              { opacity: ((i + 1) / BOTTOM_FADE_STEPS) ** 1.7 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerArtClip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  headerLeftFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '40%',
    flexDirection: 'row',
  },
  headerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerFadeSlice: {
    flex: 1,
    backgroundColor: CREAM,
  },
});
