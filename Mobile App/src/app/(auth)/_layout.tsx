import { Stack } from 'expo-router';

/** Auth Stack: Splash -> Mobile -> OTP -> Complete Profile. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="mobile" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
