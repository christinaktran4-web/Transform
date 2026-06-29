import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { DreamEntry } from '../../types';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Divider } from '../../components/ui/Divider';
import { Ionicons } from '@expo/vector-icons';

const INTENSITY_LABELS = ['', 'Faint', 'Vague', 'Present', 'Vivid', 'Vivid', 'Intense', 'Intense', 'Surreal', 'Surreal', 'Overwhelming'];

export default function JournalScreen() {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<DreamEntry | null>(null);

  const load = useCallback(async () => {
    const d = await storage.getDreams();
    setDreams(d);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => { setSelected(null); setModalVisible(true); };
  const openEdit = (d: DreamEntry) => { setSelected(d); setModalVisible(true); };

  const deleteDream = (d: DreamEntry) =>
    Alert.alert('Delete Dream', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await storage.deleteDream(d.id); load(); } },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Label variant="micro" color={Colors.textTertiary}>Journal</Label>
          <Label variant="title">Dream Log</Label>
        </View>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {dreams.length === 0 ? (
        <View style={styles.empty}>
          <Label variant="body" color={Colors.textSecondary}>No dreams logged yet.</Label>
          <Label variant="caption" color={Colors.textTertiary}>Dreams are the raw material of self-knowledge.</Label>
          <Button label="Log a Dream" onPress={openNew} style={{ marginTop: Spacing.lg }} />
        </View>
      ) : (
        <FlatList
          data={dreams}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openEdit(item)} onLongPress={() => deleteDream(item)} activeOpacity={0.8}>
              <Card style={styles.dreamCard}>
                <View style={styles.dreamHeader}>
                  <View style={styles.dreamMeta}>
                    <Label variant="micro" color={Colors.textTertiary}>
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </Label>
                    <IntensityDots value={item.intensity} />
                  </View>
                  <Label variant="body" style={styles.dreamTitle} numberOfLines={1}>{item.title}</Label>
                </View>
                <Label variant="caption" color={Colors.textSecondary} numberOfLines={3}>
                  {item.content}
                </Label>
                {item.tags.length > 0 && (
                  <View style={styles.tags}>
                    {item.tags.slice(0, 4).map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Label variant="micro">{tag}</Label>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <DreamModal
        visible={modalVisible}
        initial={selected}
        onClose={() => setModalVisible(false)}
        onSave={async (d) => {
          if (selected) await storage.updateDream(d);
          else await storage.addDream(d);
          load();
          setModalVisible(false);
        }}
      />
    </View>
  );
}

function IntensityDots({ value }: { value: number }) {
  return (
    <View style={styles.intensityRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={[styles.intensityDot, i < Math.ceil(value / 2) && styles.intensityDotActive]} />
      ))}
    </View>
  );
}

interface DreamModalProps {
  visible: boolean;
  initial: DreamEntry | null;
  onClose: () => void;
  onSave: (d: DreamEntry) => void;
}

function DreamModal({ visible, initial, onClose, onSave }: DreamModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [intensity, setIntensity] = useState(initial?.intensity ?? 5);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  React.useEffect(() => {
    setTitle(initial?.title ?? '');
    setContent(initial?.content ?? '');
    setIntensity(initial?.intensity ?? 5);
    setTags(initial?.tags ?? []);
    setTagInput('');
  }, [initial, visible]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const save = () => {
    if (!title.trim() || !content.trim()) return;
    const dream: DreamEntry = {
      id: initial?.id ?? Date.now().toString(),
      user_id: '',
      date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
      title: title.trim(),
      content: content.trim(),
      intensity,
      tags,
      themes: [],
      created_at: initial?.created_at ?? new Date().toISOString(),
    };
    onSave(dream);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHandle} />
        <Label variant="heading" style={{ marginBottom: Spacing.xl }}>
          {initial ? 'Edit Dream' : 'Log a Dream'}
        </Label>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Name this dream" containerStyle={{ marginBottom: Spacing.md }} />
        <Input
          label="What happened?"
          value={content}
          onChangeText={setContent}
          placeholder="Describe your dream in as much detail as you remember..."
          multiline
          containerStyle={{ marginBottom: Spacing.lg }}
        />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>
          Intensity — {INTENSITY_LABELS[intensity]}
        </Label>
        <View style={styles.intensitySlider}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <TouchableOpacity key={n} onPress={() => setIntensity(n)} style={styles.intensityBtn}>
              <View style={[styles.intensityBlock, intensity >= n && styles.intensityBlockActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <Divider />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>Tags</Label>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            placeholder="water, flying, shadow..."
            placeholderTextColor={Colors.textTertiary}
            keyboardAppearance="dark"
            returnKeyType="done"
          />
          <TouchableOpacity onPress={addTag} style={styles.tagAddBtn}>
            <Label variant="caption">Add</Label>
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map(t => (
              <TouchableOpacity key={t} onPress={() => removeTag(t)} style={styles.tagRemovable}>
                <Label variant="micro">{t} ×</Label>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={[styles.modalFooter, { marginTop: Spacing.xxl }]}>
          <Button label="Cancel" variant="secondary" onPress={onClose} size="md" />
          <Button label="Save Dream" onPress={save} disabled={!title.trim() || !content.trim()} size="md" />
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
  list: { padding: Spacing.xl, paddingTop: 0, gap: Spacing.md },
  dreamCard: { gap: Spacing.sm },
  dreamHeader: { gap: 4 },
  dreamMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dreamTitle: { fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.border },
  tagRemovable: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  intensityRow: { flexDirection: 'row', gap: 3 },
  intensityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  intensityDotActive: { backgroundColor: Colors.text },
  modal: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: Spacing.lg },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  intensitySlider: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  intensityBtn: { flex: 1 },
  intensityBlock: { height: 32, borderRadius: Radius.sm, backgroundColor: Colors.border },
  intensityBlockActive: { backgroundColor: Colors.text },
  tagInputRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  tagInput: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, color: Colors.text, fontSize: FontSize.md },
  tagAddBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.xxl },
});
