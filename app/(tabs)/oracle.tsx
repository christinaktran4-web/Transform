import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { sendOracleMessage } from '../../lib/oracle';
import { OracleMessage, UserProfile } from '../../types';
import { getMoonPhase, getCurrentZodiacSeason } from '../../lib/astrology';
import { calcPersonalDay } from '../../lib/numerology';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Ionicons } from '@expo/vector-icons';

const STARTER_PROMPTS = [
  'What patterns are emerging in my life?',
  'What themes keep appearing in my dreams?',
  'How has my mood been lately?',
  'What should I reflect on today?',
];

export default function OracleScreen() {
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => {
    storage.getProfile().then(setProfile);
  }, []));

  const buildContext = async (): Promise<string> => {
    if (!profile) return '';
    const today = new Date();
    const moon = getMoonPhase(today);
    const zodiac = getCurrentZodiacSeason(today);
    const personalDay = calcPersonalDay(
      profile.birth_date,
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
    const checkins = (await storage.getCheckins()).slice(0, 7);
    const dreams = (await storage.getDreams()).slice(0, 5);
    const syncs = (await storage.getSynchronicities()).slice(0, 5);

    const avgMood = checkins.length
      ? (checkins.reduce((a, c) => a + c.mood, 0) / checkins.length).toFixed(1)
      : 'no data';

    const dreamSummary = dreams.map(d => `"${d.title}" (intensity ${d.intensity}, tags: ${d.tags.join(', ')})`).join('; ');
    const syncSummary = syncs.map(s => `${s.type}: "${s.description}"`).join('; ');

    return `Name: ${profile.name}
Birth: ${profile.birth_date}
Life Path Number: ${profile.life_path_number}
Today: ${format(today, 'EEEE, MMMM d, yyyy')}
Moon: ${moon.phase} in ${moon.sign}
Zodiac Season: ${zodiac}
Personal Day Number: ${personalDay}
Average Mood (last 7 days): ${avgMood}/10
Recent Dreams: ${dreamSummary || 'none'}
Recent Synchronicities: ${syncSummary || 'none'}`;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: OracleMessage = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const context = await buildContext();
      const reply = await sendOracleMessage(next, context);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...next, {
        role: 'assistant',
        content: 'The Oracle is unavailable at this moment. Ensure your API key is configured.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.header}>
        <Label variant="micro" color={Colors.textTertiary}>AI</Label>
        <Label variant="title">Oracle</Label>
        <Label variant="caption" color={Colors.textSecondary}>
          Ask about your patterns. The Oracle only knows what you've shared.
        </Label>
      </View>

      {messages.length === 0 && (
        <View style={styles.starters}>
          {STARTER_PROMPTS.map(p => (
            <TouchableOpacity key={p} onPress={() => send(p)} style={styles.starterBtn} activeOpacity={0.7}>
              <Label variant="caption" color={Colors.textSecondary}>{p}</Label>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={Colors.textSecondary} />
          <Label variant="caption" color={Colors.textTertiary}> The Oracle is reflecting...</Label>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your patterns..."
          placeholderTextColor={Colors.textTertiary}
          keyboardAppearance="dark"
          multiline
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
        >
          <Ionicons name="arrow-up" size={18} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: OracleMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOracle]}>
      {!isUser && (
        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: 4 }}>Oracle</Label>
      )}
      <Label variant="body" color={isUser ? Colors.background : Colors.text} style={styles.bubbleText}>
        {message.content}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingTop: 60, gap: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  starters: { padding: Spacing.xl, gap: Spacing.sm },
  starterBtn: { padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  messageList: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.md },
  bubble: { maxWidth: '85%', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  bubbleUser: { backgroundColor: Colors.text, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOracle: { backgroundColor: Colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { lineHeight: 22 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, color: Colors.text, fontSize: FontSize.md, maxHeight: 120 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.3 },
});
