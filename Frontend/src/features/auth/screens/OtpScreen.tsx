import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@/constants';
import { radius, spacing, useAppTheme } from '@/theme';

import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ mobile: string; devOtp?: string }>();
  const mobile = params.mobile ?? '';

  const { login } = useAuth();
  const { loading: verifying, error: verifyError, verifyOtp, clearError: clearVerifyError } = useVerifyOtp();
  const { loading: resending, error: resendError, sendOtp, clearError: clearResendError } = useSendOtp();

  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(params.devOtp);
  const { seconds, restart } = useCountdown(RESEND_COOLDOWN_SECONDS);

  const handleChangeCode = (value: string): void => {
    setCode(value);
    if (verifyError) clearVerifyError();
  };

  const handleVerify = async (): Promise<void> => {
    if (code.length !== OTP_LENGTH) return;

    const result = await verifyOtp(mobile, code);
    if (!result) return;

    await login(result.token);

    if (!result.isProfileCompleted) {
      router.replace('/complete-profile');
    }
    // If the profile is already complete, the root layout's Stack.Protected
    // guard reactively swaps to the App Stack (Home) once `user` refreshes.
  };

  const handleResend = async (): Promise<void> => {
    if (seconds > 0 || resending) return;
    setCode('');
    clearResendError();
    const result = await sendOtp(mobile);
    if (result) {
      setDevOtp(result.otp);
      restart();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          {strings.auth.otpTitle}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {strings.auth.otpSubtitle} +91 {mobile}
        </Text>

        {!!devOtp && (
          <Card mode="contained" style={[styles.devCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Card.Content style={styles.devCardContent}>
              <MaterialCommunityIcons name="flask-outline" size={18} color={theme.colors.onSecondaryContainer} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                {strings.auth.devOtpLabel}: <Text style={styles.devOtpValue}>{devOtp}</Text>
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.otpBox}>
          <OtpInput value={code} onChange={handleChangeCode} error={!!verifyError} disabled={verifying} />
        </View>

        {!!verifyError && (
          <HelperText type="error" visible>
            {verifyError}
          </HelperText>
        )}
        {!!resendError && (
          <HelperText type="error" visible>
            {resendError}
          </HelperText>
        )}

        <Button
          mode="contained"
          style={styles.button}
          contentStyle={styles.buttonContent}
          onPress={handleVerify}
          loading={verifying}
          disabled={verifying || code.length !== OTP_LENGTH}
        >
          {verifying ? strings.auth.verifyingOtp : strings.auth.verifyOtp}
        </Button>

        <View style={styles.footerRow}>
          {seconds > 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {strings.auth.resendOtpIn} {seconds}s
            </Text>
          ) : (
            <Button mode="text" compact onPress={handleResend} loading={resending} disabled={resending}>
              {strings.auth.resendOtp}
            </Button>
          )}
          <Button mode="text" compact onPress={() => router.back()} disabled={verifying || resending}>
            {strings.auth.changeNumber}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontWeight: '700' },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  devCard: { marginBottom: spacing.lg, borderRadius: radius.md },
  devCardContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  devOtpValue: { fontWeight: '700' },
  otpBox: { marginBottom: spacing.sm },
  button: { marginTop: spacing.lg, borderRadius: radius.md },
  buttonContent: { paddingVertical: spacing.xs },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
});
