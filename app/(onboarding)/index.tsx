import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../../lib/storage';
import { calcLifePath } from '../../lib/numerology';
import { geocodeLocation } from '../../lib/ephemeris';
import { UserProfile } from '../../types';
import { HD_TYPES, INNER_AUTHORITY_DESCRIPTIONS, getFullHumanDesign } from '../../lib/humanDesign';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type Step = 'welcome' | 'name' | 'birthdate' | 'birthtime' | 'location' | 'humandesign' | 'complete';

const STEPS: Step[] = ['welcome', 'name', 'birthdate', 'birthtime', 'location', 'humandesign', 'complete'];

function timeTo24h(time: string, ampm: 'AM' | 'PM'): string {
  const parts = time.trim().split(':');
  if (parts.length !== 2) return '';
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) return '';
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [location, setLocation] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [hdAuthority, setHdAuthority] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const next = async () => {
    if (step === 'location' && location.trim().length >= 2) {
      setGeocoding(true);
      try {
        const coords = await geocodeLocation(location.trim());
        if (coords) setLatLng(coords);
      } finally {
        setGeocoding(false);
      }
    }
    setStep(STEPS[stepIndex + 1]);
  };
  const goBack = () => { if (stepIndex > 0) setStep(STEPS[stepIndex - 1]); };

  const finish = async () => {
    setLoading(true);
    try {
      const stored24h = birthTimeUnknown ? null : (birthTime.trim() ? timeTo24h(birthTime.trim(), ampm) || null : null);
      const profile: UserProfile = {
        id: Date.now().toString(),
        name: name.trim(),
        birth_date: birthDate,
        birth_time: stored24h,
        birth_time_unknown: birthTimeUnknown,
        birth_location: location.trim(),
        birth_lat: latLng?.lat ?? null,
        birth_lng: latLng?.lon ?? null,
        life_path_number: calcLifePath(birthDate),
        human_design_type: (() => { try { return getFullHumanDesign(birthDate, stored24h).type; } catch { return null; } })(),
        human_design_authority: hdAuthority,
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
    if (step === 'birthtime') return birthTimeUnknown || /^\d{1,2}:\d{2}$/.test(birthTime.trim());
    if (step === 'location') return location.trim().length >= 2;
    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {stepIndex > 0 && step !== 'complete' && (
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Label style={styles.backArrow}>←</Label>
        </TouchableOpacity>
      )}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && <WelcomeStep />}

        {step === 'name' && (
          <FieldStep title="What is your name?" description="This is how the Oracle will know you.">
            <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoFocus autoCapitalize="words" />
          </FieldStep>
        )}

        {step === 'birthdate' && (
          <FieldStep title="When were you born?" description="Your birth date anchors your numerology and astrological profile.">
            <Input
              label="Birth date (YYYY-MM-DD)"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1998-06-21"
              keyboardType="numeric"
              autoFocus
              maxLength={10}
            />
          </FieldStep>
        )}

        {step === 'birthtime' && (
          <FieldStep title="What time were you born?" description="Used for your rising sign and house placements.">
            <Input
              label="Birth time (H:MM)"
              value={birthTime}
              onChangeText={t => { setBirthTime(t); if (birthTimeUnknown) setBirthTimeUnknown(false); }}
              placeholder="3:32"
              keyboardType="numbers-and-punctuation"
              autoFocus
              maxLength={5}
              editable={!birthTimeUnknown}
            />
            {!birthTimeUnknown && (
              <View style={styles.ampmRow}>
                {(['AM', 'PM'] as const).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.ampmBtn, ampm === period && styles.ampmBtnActive]}
                    onPress={() => setAmpm(period)}
                  >
                    <Label style={[styles.ampmLabel, ampm === period && styles.ampmLabelActive]}>{period}</Label>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.unknownRow}
              onPress={() => { setBirthTimeUnknown(v => !v); setBirthTime(''); }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, birthTimeUnknown && styles.checkboxOn]}>
                {birthTimeUnknown && <Label style={styles.checkmark}>✓</Label>}
              </View>
              <Label variant="caption" color={Colors.textSecondary}>I don't know my birth time</Label>
            </TouchableOpacity>
            {birthTimeUnknown && (
              <Label variant="caption" color={Colors.textTertiary} style={styles.unknownNote}>
                Astrological readings for rising sign and house placements will be approximate.
              </Label>
            )}
          </FieldStep>
        )}

        {step === 'location' && (
          <FieldStep title="Where were you born?" description="City and country help refine your chart.">
            <Input label="Birth location" value={location} onChangeText={setLocation} placeholder="New York, USA" autoFocus autoCapitalize="words" />
          </FieldStep>
        )}

        {step === 'humandesign' && (() => {
          const hd24h = birthTimeUnknown ? null : (birthTime.trim() ? timeTo24h(birthTime.trim(), ampm) || null : null);
          let hdCalc: ReturnType<typeof getFullHumanDesign> | null = null;
          try { hdCalc = getFullHumanDesign(birthDate, hd24h); } catch {}
          const hdInfo = hdCalc ? HD_TYPES[hdCalc.type] : null;
          return (
            <FieldStep title="Your Human Design" description="Calculated from your birth data — your energy strategy and decision-making authority.">
              {hdCalc && hdInfo && (
                <View style={styles.enneagramRow}>
                  <Label style={styles.hdIcon}>{hdInfo.icon}</Label>
                  <View style={{ flex: 1 }}>
                    <Label variant="body" style={{ color: Colors.accent }}>{hdCalc.type}</Label>
                    <Label variant="caption" color={Colors.textSecondary}>{hdInfo.strategy}</Label>
                  </View>
                  <Label variant="micro" color={Colors.textTertiary}>{hdInfo.population}</Label>
                </View>
              )}
              {hdCalc && (
                <Label variant="caption" color={Colors.textTertiary}>
                  Profile {hdCalc.profile} · {hdCalc.profileName}
                </Label>
              )}
              <View style={styles.authoritySection}>
                <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.xs }}>Inner Authority</Label>
                {Object.entries(INNER_AUTHORITY_DESCRIPTIONS).map(([auth, info]) => {
                  const active = hdAuthority === auth;
                  return (
                    <TouchableOpacity key={auth} onPress={() => setHdAuthority(active ? null : auth)} activeOpacity={0.7}>
                      <View style={[styles.enneagramRow, active && styles.enneagramRowActive, { paddingVertical: Spacing.sm }]}>
                        <View style={{ flex: 1 }}>
                          <Label variant="body">{auth}</Label>
                          <Label variant="caption" color={Colors.textSecondary} numberOfLines={1}>{info.short}</Label>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FieldStep>
          );
        })()}

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
            <Button
              label={geocoding ? 'Locating...' : 'Continue'}
              onPress={next}
              disabled={!canContinue() || geocoding}
              loading={geocoding}
              size="md"
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.centerContent}>
      <Label variant="micro" color={Colors.textTertiary} style={styles.eyebrow}>Quantified Mysticism</Label>
      <Label variant="display" style={styles.displayText}>Your inner{"\n"}world,{"\n"}visualized.</Label>
      <Label variant="body" color={Colors.textSecondary} style={styles.subtitle}>
        A personal pattern-recognition platform that connects your inner experience with the rhythms of the universe.
      </Label>
    </View>
  );
}

function FieldStep({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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
  container: { flex: 1, backgroundColor: 'transparent' },
  backBtn: { position: 'absolute', top: 60, left: Spacing.xl, zIndex: 10, padding: Spacing.sm },
  backArrow: { fontSize: 22, color: Colors.textSecondary },
  progressTrack: { height: 2, backgroundColor: Colors.border, marginTop: 60 },
  progressFill: { height: 2, backgroundColor: Colors.accent },
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
  ampmRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  ampmBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  ampmBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  ampmLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  ampmLabelActive: { color: Colors.background },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 12, color: Colors.background },
  unknownNote: { marginTop: Spacing.sm, lineHeight: 18 },
  enneagramList: { gap: Spacing.sm, marginTop: Spacing.xs },
  enneagramRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  enneagramRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  hdIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  authoritySection: { marginTop: Spacing.md, gap: Spacing.sm },
});
