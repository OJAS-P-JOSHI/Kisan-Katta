import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import {
  openPolicyUrl,
  PolicyLinkCard,
  PolicyLinkDivider,
  PolicyLinkRow,
} from '@/features/subscription/components/PolicyLinkRow';
import { SUBSCRIPTION_POLICY_URLS } from '@/features/subscription/subscription.constants';
import { subscriptionStrings } from '@/features/subscription/subscription.strings';
import { elevation, spacing } from '@/theme';

import { profileStrings } from '../profile.strings';
import { profileUi } from '../profile.ui';

export function ProfileLegalSection() {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="information-outline" size={16} color={profileUi.primary} />
        <Text
          style={[styles.headText, { color: profileUi.heading }]}
          maxFontSizeMultiplier={1.4}
        >
          {profileStrings.legal.title}
        </Text>
      </View>

      <View style={styles.cardShadow}>
        <PolicyLinkCard>
          <PolicyLinkRow
            icon="shield-outline"
            title={subscriptionStrings.privacyTitle}
            hint={subscriptionStrings.privacyHint}
            onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.privacy)}
          />
          <PolicyLinkDivider />
          <PolicyLinkRow
            icon="file-document-outline"
            title={subscriptionStrings.termsTitle}
            hint={subscriptionStrings.termsHint}
            onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.terms)}
          />
          <PolicyLinkDivider />
          <PolicyLinkRow
            icon="cash-refund"
            title={subscriptionStrings.refundTitle}
            hint={subscriptionStrings.refundHint}
            onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.refund)}
          />
          <PolicyLinkDivider />
          <PolicyLinkRow
            icon="headset"
            title={subscriptionStrings.contactTitle}
            hint={subscriptionStrings.contactHint}
            onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.contact)}
          />
        </PolicyLinkCard>
      </View>

      <View style={styles.cardShadow}>
        <PolicyLinkCard>
          <PolicyLinkRow
            icon="account-group-outline"
            title={profileStrings.legal.aboutTitle}
            hint={profileStrings.legal.aboutHint}
            onPress={() => void openPolicyUrl(SUBSCRIPTION_POLICY_URLS.about)}
          />
        </PolicyLinkCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    maxWidth: '100%',
  },
  headText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
  },
  cardShadow: {
    width: '100%',
    borderRadius: 14,
    ...elevation.soft,
  },
});
