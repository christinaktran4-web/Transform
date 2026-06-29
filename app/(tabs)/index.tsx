import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { getMoonPhase, getCurrentZodiacSeason, MOON_PHASE_MEANINGS } from '../../lib/astrology';
import { calcPersonalYear, calcPersonalMonth, calcPersonalDay } from '../../lib/numerology';
import { UserProfile, DailyCheckin } from '../../types';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';

export default function TodayScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [checkinVisible, setCheckinVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const moon = getMoonPhase(today);
  const zodiacSeason = getCurrentZodiacSeason(today);
  const dateStr = format(today, 'yyyy-MM-dd');

  const load = useCallback(async () => {
    const p = await storage.getProfile();
    setProfile(p);
    if (p) {
      const checkins = await storage.getCheckins();
      const todays = checkins.find(c => c.date === dateStr);
      setTodayCheckin(todays ?? null);
    }
  }, [dateStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const personalNums = profile
    ? {
        year: calcPersonalYear(profile.birth_date, today.getFullYear()),
        month: calcPersonalMonth(profile.birth_date, today.getFullYear(), today.getMonth() + 1),
        day: calcPersonalDay(profile.birth_date, today.getFullYear(), today.getMonth() + 1, today.getDate()),
      }
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Label variant="micro" color={Colors.textTertiary}>
            {format(today, 'EEEE, MMMM d')}
          </Label>
          <Label variant="title">
            {profile ? `Good ${getGreeting()}, ${profile.name.split(' ')[0]}.` : 'Today'}
          </Label>
        </View>

        <Card style={styles.moonCard}>
          <View style={styles.moonRow}>
            <View style={styles.moonLeft}>
              <Label variant="micro" color={Colors.textTertiary}>Moon</Label>
              <Label variant="heading">{moon.phase}</Label>
              <Label variant="caption">in {moon.sign}</Label>
            </View>
            <View style={styles.moonRight}>
              <Label style={styles.moonEmoji}>{moon.phaseEmoji}</Label>
              <Label variant="caption" color={Colors.textSecondary}>{moon.illumination}% full</Label>
            </View>
          </View>
          <Divider />
          <Label variant="caption" color={Colors.textSecondary}>
            {MOON_PHASE_MEANINGS[moon.phase]}
          </Label>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Label variant="micro" color={Colors.textTertiary}>Season</Label>
            <Label variant="body" style={styles.statValue}>{zodiacSeason}</Label>
          </Card>
          {personalNums && (
            <>
              <Card style={styles.statCard}>
                <Label variant="micro" color={Colors.textTertiary}>Personal Day</Label>
                <Label variant="heading" style={styles.statValue}>{personalNums.day}</Label>
              </Card>
              <Card style={styles.statCard}>
                <Label variant="micro" color={Colors.textTertiary}>Personal Month</Label>
                <Label variant="heading" style={styles.statValue}>{personalNums.month}</Label>
              </Card>
            </>
          )}
        </View>

        <Card elevated>
          {todayCheckin ? (
            <CheckinSummary checkin={todayCheckin} />
          ) : (
            <View>
              <Label variant="heading" style={{ marginBottom: Spacing.xs }}>Daily Check-In</Label>
              <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
                How are you feeling today? Your data builds the pattern.
              </Label>
              <Button label="Check In" onPress={() => setCheckinVisible(true)} size="md" />
            </View>
          )}
        </Card>

        <TouchableOpacity style={styles.oracleBanner} onPress={() => router.push('/(tabs)/oracle')} activeOpacity={0.8}>
          <Label variant="micro" color={Colors.textTertiary}>AI Oracle</Label>
          <Label variant="body">What patterns are emerging?</Label>
          <Label variant="caption" color={Colors.textSecondary}>Ask the Oracle →</Label>
        </TouchableOpacity>
      </ScrollView>

      <CheckinModal
        visible={checkinVisible}
        profile={profile}
        onClose={() => setCheckinVisible(false)}
        onSave={async (c) => {
          await storage.addCheckin(c);
          setTodayCheckin(c);
          setCheckinVisible(false);
        }}
      />
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function CheckinSummary({ checkin }: { checkin: DailyCheckin }) {
  return (
    <View>
      <Label variant="heading" style={{ marginBottom: Spacing.md }}>Today's Check-In</Label>
      <View style={styles.checkinRow}>
        <CheckinStat label="Mood" value={checkin.mood} max={10} />
        <CheckinStat label="Energy" value={checkin.energy} max={10} />
        <CheckinStat label="Stress" value={checkin.stress} max={10} />
      </View>
      {checkin.notes && (
        <Label variant="caption" color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
          "{checkin.notes}"
        </Label>
      )}
    </View>
  );
}

function CheckinStat({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={styles.checkinStat}>
      <Label variant="heading">{value}</Label>
      <Label variant="micro" color={Colors.textTertiary}>{label}</Label>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(value / max) * 100}%` }]} />
      </View>
    </View>
  );
}

interface CheckinModalProps {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (c: DailyCheckin) => void;
}

function CheckinModal({ visible, profile, onClose, onSave }: CheckinModalProps) {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [gratitude, setGratitude] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    if (!profile) return;
    const checkin: DailyCheckin = {
      id: Date.now().toString(),
      user_id: profile.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      mood,
      energy,
      stress,
      gratitude: gratitude.trim() || null,
      notes: notes.trim() || null,
      created_at: new Date().toISOString(),
    };
    onSave(checkin);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHandle} />
        <Label variant="heading" style={{ marginBottom: Spacing.xl }}>How are you today?</Label>
        <SliderRow label="Mood" value={mood} onChange={setMood} />
        <SliderRow label="Energy" value={energy} onChange={setEnergy} />
        <SliderRow label="Stress" value={stress} onChange={setStress} />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.lg, marginBottom: Spacing.xs }}>Gratitude</Label>
        <TextInput
          style={styles.modalInput}
          value={gratitude}
          onChangeText={setGratitude}
          placeholder="I'm grateful for..."
          placeholderTextColor={Colors.textTertiary}
          keyboardAppearance="dark"
        />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}>Notes</Label>
        <TextInput
          style={[styles.modalInput, styles.modalMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything on your mind..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          keyboardAppearance="dark"
          textAlignVertical="top"
        />
        <View style={styles.modalFooter}>
          <Button label="Cancel" variant="secondary" onPress={onClose} size="md" />
          <Button label="Save" onPress={save} size="md" />
        </View>
      </View>
    </Modal>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabel}>
        <Label variant="body">{label}</Label>
        <Label variant="heading">{value}</Label>
      </View>
      <View style={styles.sliderDots}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} style={styles.dotWrapper}>
            <View style={[styles.dot, value >= n && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingTop: 60, gap: Spacing.md },
  header: { marginBottom: Spacing.sm },
  moonCard: { marginBottom: 0 },
  moonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  moonLeft: { gap: 2 },
  moonRight: { alignItems: 'flex-end', gap: 4 },
  moonEmoji: { fontSize: 48 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.md, gap: 4 },
  statValue: { marginTop: 2 },
  oracleBanner: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  checkinRow: { flexDirection: 'row', gap: Spacing.md },
  checkinStat: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', height: 2, backgroundColor: Colors.border, borderRadius: 1, marginTop: 4 },
  barFill: { height: 2, backgroundColor: Colors.text, borderRadius: 1 },
  modal: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: Spacing.lg },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  modalInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: 15 },
  modalMultiline: { minHeight: 80, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, marginTop: 'auto', paddingTop: Spacing.xl },
  sliderRow: { marginBottom: Spacing.md },
  sliderLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sliderDots: { flexDirection: 'row', gap: Spacing.xs },
  dotWrapper: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.text },
});
