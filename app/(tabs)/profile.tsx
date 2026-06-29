import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { UserProfile } from '../../types';
import { calcPersonalYear, calcPersonalMonth, calcPersonalDay, calcDestiny, LIFE_PATH_MEANINGS } from '../../lib/numerology';
import { getSunSign } from '../../lib/astrology';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ dreams: 0, syncs: 0, checkins: 0 });

  const load = useCallback(async () => {
    const p = await storage.getProfile();
    setProfile(p);
    if (p) {
      const [dreams, syncs, checkins] = await Promise.all([
        storage.getDreams(),
        storage.getSynchronicities(),
        storage.getCheckins(),
      ]);
      setStats({ dreams: dreams.length, syncs: syncs.length, checkins: checkins.length });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetApp = () =>
    Alert.alert('Reset App', 'This will delete all your data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await storage.clearAll();
          router.replace('/');
        },
      },
    ]);

  if (!profile) return null;

  const today = new Date();
  const personalNums = {
    year: calcPersonalYear(profile.birth_date, today.getFullYear()),
    month: calcPersonalMonth(profile.birth_date, today.getFullYear(), today.getMonth() + 1),
    day: calcPersonalDay(profile.birth_date, today.getFullYear(), today.getMonth() + 1, today.getDate()),
  };
  const destiny = calcDestiny(profile.name);
  const sunSign = getSunSign(profile.birth_date);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Label variant="micro" color={Colors.textTertiary}>Profile</Label>
          <Label variant="title">{profile.name}</Label>
          <Label variant="caption" color={Colors.textSecondary}>
            {format(new Date(profile.birth_date), 'MMMM d, yyyy')} · {profile.birth_location}
          </Label>
        </View>
        <View style={styles.avatar}>
          <Label style={styles.avatarText}>{profile.name[0].toUpperCase()}</Label>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Dreams', value: stats.dreams },
          { label: 'Signs', value: stats.syncs },
          { label: 'Check-Ins', value: stats.checkins },
        ].map(s => (
          <Card key={s.label} style={styles.statCard}>
            <Label variant="heading">{s.value}</Label>
            <Label variant="micro" color={Colors.textTertiary}>{s.label}</Label>
          </Card>
        ))}
      </View>

      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Astrological Profile</Label>
        <ProfileRow label="Sun Sign" value={sunSign} />
        <Divider />
        <ProfileRow label="Birth Date" value={format(new Date(profile.birth_date), 'MMMM d, yyyy')} />
        {profile.birth_time && <><Divider /><ProfileRow label="Birth Time" value={profile.birth_time} /></>}
        <Divider />
        <ProfileRow label="Birth Place" value={profile.birth_location} />
      </Card>

      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Numerology</Label>
        <ProfileRow label="Life Path" value={`${profile.life_path_number}`} />
        <Divider />
        <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
          {LIFE_PATH_MEANINGS[profile.life_path_number]}
        </Label>
        <ProfileRow label="Destiny Number" value={`${destiny}`} />
        <Divider />
        <ProfileRow label="Personal Year" value={`${personalNums.year}`} />
        <Divider />
        <ProfileRow label="Personal Month" value={`${personalNums.month}`} />
        <Divider />
        <ProfileRow label="Personal Day" value={`${personalNums.day}`} />
      </Card>

      <Card style={styles.dangerCard}>
        <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
          Resetting will permanently delete all your journals, signs, and check-ins.
        </Label>
        <Button label="Reset All Data" variant="destructive" onPress={resetApp} size="md" />
      </Card>
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Label variant="caption" color={Colors.textSecondary}>{label}</Label>
      <Label variant="body" style={styles.profileValue}>{value}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: 60, gap: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.md, gap: 4, alignItems: 'center' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  profileValue: { fontWeight: '500' },
  dangerCard: { borderColor: '#FF3B3040' },
});
