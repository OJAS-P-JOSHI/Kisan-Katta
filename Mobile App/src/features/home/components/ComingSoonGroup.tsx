import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/constants';

import { homeSpacing } from '../home.theme';
import { PlaceholderCard } from './PlaceholderCard';

/** Compact grouping for coming-soon placeholders — same props/messaging, less visual weight. */
export const ComingSoonGroup = memo(function ComingSoonGroup() {
  return (
    <View style={styles.wrap}>
      <PlaceholderCard
        variant="compact"
        icon="file-document-outline"
        title={strings.home.govTitle}
        subtitle={strings.home.govSubtitle}
        message={strings.home.govComing}
      />
      <PlaceholderCard
        variant="compact"
        icon="newspaper-variant-outline"
        title={strings.home.newsTitle}
        subtitle={strings.home.newsSubtitle}
        message={strings.home.newsComing}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: homeSpacing.sectionGapTight,
    marginBottom: homeSpacing.sectionGap,
  },
});
