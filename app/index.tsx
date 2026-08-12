import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { storage } from '../lib/storage';
import { Colors } from '../constants/theme';

export default function Entry() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const onboarded = await storage.isOnboarded();
      router.replace(onboarded ? '/(tabs)' : '/(onboarding)');
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
