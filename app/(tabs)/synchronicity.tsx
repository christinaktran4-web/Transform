import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { Synchronicity, SynchronicityType } from '../../types';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

const TYPE_OPTIONS: { value: SynchronicityType; label: string; icon: string }[] = [
  { value: 'number', label: 'Number', icon: '∞' },
  { value: 'animal', label: 'Animal', icon: '◈' },
  { value: 'song', label: 'Song', icon: '♪' },
  { value: 'symbol', label: 'Symbol', icon: '△' },
  { value: 'coincidence', label: 'Coincidence', icon: '◎' },
  { value: 'intuition', label: 'Intuition', icon: '◉' },
  { value: 'name', label: 'Name', icon: '◇' },
  { value: 'other', label: 'Other', icon: '○' },
];

export default function SynchronicityScreen() {
  const [items, setItems] = useState<Synchronicity[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    const data = await storage.getSynchronicities();
    setItems(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deleteItem = (s: Synchronicity) =>
    Alert.alert('Remove Sign', 'Delete this synchronicity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await storage.deleteSynchronicity(s.id); load(); } },
    ]);

  const grouped = items.reduce<Record<string, Synchronicity[]>>((acc, s) => {
    const key = format(new Date(s.date), 'MMMM d, yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Label variant="micro" color={Colors.textTertiary}>Tracker</Label>
          <Label variant="title">Signs & Symbols</Label>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Label variant="body" color={Colors.textSecondary}>Nothing logged yet.</Label>
          <Label variant="caption" color={Colors.textTertiary}>The universe speaks in patterns. Start recording.</Label>
          <Button label="Log a Sign" onPress={() => setModalVisible(true)} style={{ marginTop: Spacing.lg }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {Object.entries(grouped).map(([date, signs]) => (
            <View key={date}>
              <Label variant="micro" color={Colors.textTertiary} style={styles.dateLabel}>{date}</Label>
              {signs.map(s => (
                <TouchableOpacity key={s.id} onLongPress={() => deleteItem(s)} activeOpacity={0.8}>
                  <Card style={styles.signCard}>
                    <View style={styles.signRow}>
                      <View style={styles.signIcon}>
                        <Label style={styles.iconText}>
                          {TYPE_OPTIONS.find(t => t.value === s.type)?.icon ?? '○'}
                        </Label>
                      </View>
                      <View style={styles.signContent}>
                        <View style={styles.signTopRow}>
                          <Label variant="micro" color={Colors.textTertiary}>{s.type.toUpperCase()}</Label>
                          <SignificanceDots value={s.significance} />
                        </View>
                        <Label variant="body">{s.description}</Label>
                        {s.notes && (
                          <Label variant="caption" color={Colors.textSecondary}>{s.notes}</Label>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <LogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (s) => {
          await storage.addSynchronicity(s);
          load();
          setModalVisible(false);
        }}
      />
    </View>
  );
}

function SignificanceDots({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <View key={n} style={[styles.sigDot, value >= n && styles.sigDotActive]} />
      ))}
    </View>
  );
}

interface LogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Synchronicity) => void;
}

function LogModal({ visible, onClose, onSave }: LogModalProps) {
  const [type, setType] = useState<SynchronicityType>('number');
  const [description, setDescription] = useState('');
  const [significance, setSignificance] = useState(3);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (visible) {
      setType('number');
      setDescription('');
      setSignificance(3);
      setNotes('');
    }
  }, [visible]);

  const save = () => {
    if (!description.trim()) return;
    const item: Synchronicity = {
      id: Date.now().toString(),
      user_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type,
      description: description.trim(),
      significance,
      notes: notes.trim() || null,
      created_at: new Date().toISOString(),
    };
    onSave(item);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHandle} />
        <Label variant="heading" style={{ marginBottom: Spacing.xl }}>Log a Sign</Label>
        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>Type</Label>
        <View style={styles.typeGrid}>
          {TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setType(opt.value)}
              style={[styles.typeBtn, type === opt.value && styles.typeBtnActive]}
            >
              <Label style={styles.typeBtnIcon}>{opt.icon}</Label>
              <Label variant="micro">{opt.label}</Label>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="Saw 11:11 three times today..."
          containerStyle={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}
        />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>Significance</Label>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setSignificance(n)} style={{ flex: 1 }}>
              <View style={[styles.sigBlock, significance >= n && styles.sigBlockActive]}>
                <Label variant="micro" style={{ textAlign: 'center' }}>{n}</Label>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Context, feeling, what you were thinking..."
          multiline
          containerStyle={{ marginBottom: Spacing.xl }}
        />
        <View style={styles.modalFooter}>
          <Button label="Cancel" variant="secondary" onPress={onClose} size="md" />
          <Button label="Save" onPress={save} disabled={!description.trim()} size="md" />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: Spacing.xl, paddingTop: 60 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xs },
  list: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.sm },
  dateLabel: { marginBottom: Spacing.sm, marginTop: Spacing.md },
  signCard: { marginBottom: 0 },
  signRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  signIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  signContent: { flex: 1, gap: 4 },
  signTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sigDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  sigDotActive: { backgroundColor: Colors.text },
  modal: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: Spacing.lg },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeBtn: { width: '22%', aspectRatio: 1, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  typeBtnActive: { borderColor: Colors.text, backgroundColor: Colors.surfaceElevated },
  typeBtnIcon: { fontSize: 20 },
  sigBlock: { paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sigBlockActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.xxl },
});
