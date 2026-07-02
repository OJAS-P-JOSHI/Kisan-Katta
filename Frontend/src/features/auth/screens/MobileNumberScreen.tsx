import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { radius, spacing, useAppTheme } from '@/theme';

import { useSendOtp } from '../hooks/useSendOtp';

const MOBILE_REGEX = /^\d{10}$/;

export default function MobileNumberScreen() {
  const theme = useAppTheme();
  const [mobile, setMobile] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { loading, error, sendOtp, clearError } = useSendOtp();

  const handleChangeMobile = (text: string): void => {
    setMobile(text.replace(/[^0-9]/g, '').slice(0, 10));
    if (validationError) setValidationError(null);
    if (error) clearError();
  };

  const handleContinue = async (): Promise<void> => {
    if (!MOBILE_REGEX.test(mobile)) {
      setValidationError(strings.auth.mobileInvalid);
      return;
    }

    const result = await sendOtp(mobile);
    if (result) {
      router.push({ pathname: '/otp', params: { mobile, devOtp: result.otp ?? '' } });
    }
  };

  const displayedError = validationError ?? error;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.primary }]}>
            {strings.app.name}
          </Text>

          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
            {strings.auth.mobileTitle}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {strings.auth.mobileSubtitle}
          </Text>

          <View style={styles.inputRow}>
            <View
              style={[
                styles.prefixBox,
                { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                +91
              </Text>
            </View>
            <TextInput
              mode="outlined"
              style={styles.input}
              value={mobile}
              onChangeText={handleChangeMobile}
              keyboardType="number-pad"
              maxLength={10}
              placeholder={strings.auth.mobilePlaceholder}
              error={!!displayedError}
              autoFocus
            />
          </View>
          {!!displayedError && (
            <HelperText type="error" visible>
              {displayedError}
            </HelperText>
          )}

          <Button
            mode="contained"
            style={styles.button}
            contentStyle={styles.buttonContent}
            onPress={handleContinue}
            loading={loading}
            disabled={loading || mobile.length !== 10}
          >
            {loading ? strings.auth.sendingOtp : strings.auth.continue}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  appName: { fontWeight: '700', marginBottom: spacing.xl },
  title: { fontWeight: '700' },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  prefixBox: {
    height: 56,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1 },
  button: { marginTop: spacing.lg, borderRadius: radius.md },
  buttonContent: { paddingVertical: spacing.xs },
});
