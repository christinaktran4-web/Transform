import { Stack } from 'expo-router';

export default function OracleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }} />
  );
}
