import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { UserProfile } from '../../types';
import { calcPersonalYear, calcPersonalMonth, calcPersonalDay, calcDestiny, calcLifePath, LIFE_PATH_MEANINGS } from '../../lib/numerology';
import { getSunSign, getMoonSignApprox, getBirthMoonPhase, ZODIAC_DETAILS } from '../../lib/astrology';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { Input } from '../../components/ui/Input';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ dreams: 0, syncs: 0, checkins: 0 });
  const [editVisible, setEditVisible] = useState(false);

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
  const sunDetail = ZODIAC_DETAILS[sunSign];
  const moonSign = getMoonSignApprox(new Date(profile.birth_date + 'T12:00:00Z'));
  const moonDetail = ZODIAC_DETAILS[moonSign];
  const birthMoon = getBirthMoonPhase(profile.birth_date);
  const hasRising = !profile.birth_time_unknown && !!profile.birth_time;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Label variant="micro" color={Colors.textTertiary}>Chart</Label>
          <Label variant="title">{profile.name}</Label>
          <Label variant="caption" color={Colors.textSecondary}>
            {format(new Date(profile.birth_date), 'MMMM d, yyyy')} · {profile.birth_location}
          </Label>
          <TouchableOpacity onPress={() => setEditVisible(true)} style={{ marginTop: Spacing.xs }}>
            <Label variant="caption" style={{ color: Colors.accent }}>Edit Profile →</Label>
          </TouchableOpacity>
        </View>
        <View style={styles.avatar}>
          <Label style={[styles.avatarText, { color: Colors.accent }]}>{profile.name[0].toUpperCase()}</Label>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Dreams', value: stats.dreams },
          { label: 'Signs', value: stats.syncs },
          { label: 'Check-Ins', value: stats.checkins },
        ].map(s => (
          <Card key={s.label} style={styles.statCard}>
            <Label variant="heading" style={{ color: Colors.accent }}>{s.value}</Label>
            <Label variant="micro" color={Colors.textTertiary}>{s.label}</Label>
          </Card>
        ))}
      </View>

      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Astrological Profile</Label>

        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.xs }}>Sun Sign</Label>
        <View style={styles.signRow}>
          <Label variant="body" style={{ color: Colors.accent }}>{sunSign} {sunDetail?.symbol}</Label>
          <Label variant="caption" color={Colors.textTertiary}>{sunDetail?.element} · {sunDetail?.quality}</Label>
        </View>
        {sunDetail && (
          <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
            {sunDetail.description}
          </Label>
        )}

        <Divider />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>Moon Sign (birth)</Label>
        <View style={styles.signRow}>
          <Label variant="body">{moonSign} {moonDetail?.symbol}</Label>
          <Label variant="caption" color={Colors.textTertiary}>{moonDetail?.element} · {moonDetail?.quality}</Label>
        </View>
        <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
          Born under the {birthMoon.phaseEmoji} {birthMoon.phase}
        </Label>

        <Divider />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>Rising Sign</Label>
        {hasRising ? (
          <ProfileRow label="Birth Time" value={profile.birth_time!} />
        ) : (
          <Label variant="caption" color={Colors.textTertiary}>
            {profile.birth_time_unknown
              ? 'Unknown — rising sign requires an accurate birth time.'
              : 'Add birth time to reveal your rising sign.'}
          </Label>
        )}

        <Divider />
        <View style={{ marginTop: Spacing.sm }}>
          <ProfileRow label="Birth Place" value={profile.birth_location} />
        </View>
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

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSave={async (updated) => {
          await storage.setProfile(updated);
          setProfile(updated);
          setEditVisible(false);
        }}
      />
    </ScrollView>
  );
}

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => Promise<void>;
}

function EditProfileModal({ visible, profile, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birth_date);
  const [birthTime, setBirthTime] = useState(profile.birth_time ?? '');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(profile.birth_time_unknown ?? false);
  const [location, setLocation] = useState(profile.birth_location);

  React.useEffect(() => {
    if (visible) {
      setName(profile.name);
      setBirthDate(profile.birth_date);
      setBirthTime(profile.birth_time ?? '');
      setBirthTimeUnknown(profile.birth_time_unknown ?? false);
      setLocation(profile.birth_location);
    }
  }, [visible, profile]);

  const save = () => {
    if (!name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !location.trim()) return;
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      birth_date: birthDate.trim(),
      birth_time: birthTimeUnknown ? null : (birthTime.trim() || null),
      birth_time_unknown: birthTimeUnknown,
      birth_location: location.trim(),
      life_path_number: calcLifePath(birthDate.trim()),
    };
    onSave(updated);
  };

  const canSave = name.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && location.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHandle} />
        <Label variant="heading" style={{ marginBottom: Spacing.xl }}>Edit Profile</Label>
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          containerStyle={{ marginBottom: Spacing.md }}
        />
        <Input
          label="Birth Date (YYYY-MM-DD)"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="1990-06-15"
          keyboardType="numeric"
          maxLength={10}
          containerStyle={{ marginBottom: Spacing.md }}
        />
        <Input
          label="Birth Time (HH:MM, optional)"
          value={birthTime}
          onChangeText={t => { setBirthTime(t); if (birthTimeUnknown) setBirthTimeUnknown(false); }}
          placeholder="14:30"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          editable={!birthTimeUnknown}
          containerStyle={{ marginBottom: Spacing.sm }}
        />
        <TouchableOpacity
          style={styles.unknownRow}
          onPress={() => { setBirthTimeUnknown(v => !v); setBirthTime(''); }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, birthTimeUnknown && styles.checkboxOn]}>
            {birthTimeUnknown && <Label style={styles.checkmark}>✓</Label>}
          </View>
          <Label variant="caption" color={Colors.textSecondary}>Birth time unknown</Label>
        </TouchableOpacity>
        <Input
          label="Birth Location"
          value={location}
          onChangeText={setLocation}
          placeholder="London, UK"
          autoCapitalize="words"
          containerStyle={{ marginTop: Spacing.md, marginBottom: Spacing.xl }}
        />
        <View style={styles.modalFooter}>
          <Button label="Cancel" variant="secondary" onPress={onClose} size="md" />
          <Button label="Save" onPress={save} disabled={!canSave} size="md" />
        </View>
      </ScrollView>
    </Modal>
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
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: Spacing.xl, paddingTop: 60, gap: Spacing.md },
  contentWeb: { maxWidth: 640, alignSelf: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.md, gap: 4, alignItems: 'center' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  profileValue: { fontWeight: '500' },
  dangerCard: { borderColor: '#FF3B3040' },
  modal: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: Spacing.lg },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: Radius.sm - 4, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 12, color: Colors.background },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.xxl },
});
