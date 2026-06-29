import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { calcLifePath } from '../../lib/numerology';
import { UserProfile } from '../../types';
import { Colors, Spacing } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type Step = 'welcome' | 'name' | 'birthdate' | 'birthtime' | 'location' | 'complete';

const STEPS: Step[] = ['welcome', 'name', 'birthdate', 'birthtime', 'location', 'complete'];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const next = () => setStep(STEPS[stepIndex + 1]);

  const finish = async () => {
    setLoading(true);
    try {
      const profile: UserProfile = {
        id: Date.now().toString(),
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_location: location.trim(),
        birth_lat: null,
        birth_lng: null,
        life_path_number: calcLifePath(birthDate),
        created_at: new Date().toISOString(),
      };
      await storage.setProfile(profile);
      await storage.setOnboarded();
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    if (step === 'name') return name.trim().length >= 2;
    if (step === 'birthdate') return /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
    if (step === 'location') return location.trim().length >= 2;
    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'welcome' && <WelcomeStep />}
        {step === 'name' && (
          <FieldStep
            title="What is your name?"
            description="This is how the Oracle will know you."
          >
            <Input
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoFocus
              autoCapitalize="words"
            />
          </FieldStep>
        )}
        {step === 'birthdate' && (
          <FieldStep
            title="When were you born?"
            description="Your birth date anchors your numerology and astrological profile."
          >
            <Input
              label="Birth date (YYYY-MM-DD)"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1990-06-15"
              keyboardType="numeric"
              autoFocus
              maxLength={10}
            />
          </FieldStep>
        )}
        {step === 'birthtime' && (
          <FieldStep
            title="What time were you born?"
            description="Optional — used for your rising sign and house placements."
          >
            <Input
              label="Birth time (HH:MM, 24h)"
              value={birthTime}
              onChangeText={setBirthTime}
              placeholder="14:30 (optional)"
              keyboardType="numbers-and-punctuation"
              autoFocus
              maxLength={5}
            />
          </FieldStep>
        )}
        {step === 'location' && (
          <FieldStep
            title="Where were you born?"
            description="City and country help refine your chart."
          >
            <Input
              label="Birth location"
              value={location}
              onChangeText={setLocation}
              placeholder="London, UK"
              autoFocus
              autoCapitalize="words"
            />
          </FieldStep>
        )}
        {step === 'complete' && <CompleteStep name={name} />}
      </ScrollView>

      <View style={styles.footer}>
        {step === 'welcome' ? (
          <Button label="Begin" onPress={next} size="lg" style={styles.fullWidth} />
        ) : step === 'complete' ? (
          <Button label="Enter" onPress={finish} size="lg" loading={loading} style={styles.fullWidth} />
        ) : (
          <View style={styles.footerRow}>
            <Button label="Skip" variant="ghost" onPress={next} size="md" />
            <Button label="Continue" onPress={next} disabled={!canContinue()} size="md" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.centerContent}>
      <Label variant="micro" color={Colors.textTertiary} style={styles.eyebrow}>
        Quantified Mysticism
      </Label>
      <Label variant="display" style={styles.displayText}>Your inner{"\n"}world,{"\n"}visualized.</Label>
      <Label variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        A personal pattern-recognition platform that connects your inner experience with the rhythms of the universe.
      </Label>
    </View>
  );
}

function FieldStep({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldContent}>
      <Label variant="title" style={styles.fieldTitle}>{title}</Label>
      <Label variant="body" color={Colors.textSecondary} style={styles.fieldDesc}>{description}</Label>
      {children}
    </View>
  );
}

function CompleteStep({ name }: { name: string }) {
  return (
    <View style={styles.centerContent}>
      <Label variant="micro" color={Colors.textTertiary} style={styles.eyebrow}>Ready</Label>
      <Label variant="title" style={styles.fieldTitle}>Hello, {name}.</Label>
      <Label variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        Your profile has been created. The patterns are waiting to be discovered.
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressTrack: { height: 2, backgroundColor: Colors.border, marginTop: 60 },
  progressFill: { height: 2, backgroundColor: Colors.text },
  content: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  centerContent: { flex: 1, justifyContent: 'center' },
  fieldContent: { flex: 1, justifyContent: 'center', gap: Spacing.md },
  eyebrow: { marginBottom: Spacing.md },
  displayText: { marginBottom: Spacing.lg, lineHeight: 44 },
  subtitle: { lineHeight: 24 },
  fieldTitle: { marginBottom: Spacing.xs },
  fieldDesc: { marginBottom: Spacing.md },
  footer: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fullWidth: { width: '100%' },
});
