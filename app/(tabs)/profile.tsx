import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { UserProfile } from '../../types';
import { calcPersonalYear, calcPersonalMonth, calcPersonalDay, calcDestiny, calcLifePath, LIFE_PATH_MEANINGS, PERSONAL_YEAR_MEANINGS, LIFE_PATH_DEEP } from '../../lib/numerology';
import { getSunSign, getMoonSignApprox, getBirthMoonPhase, ZODIAC_DETAILS, getCuspInfo, ELEMENT_AURA } from '../../lib/astrology';
import { getHumanDesignGates, HD_TYPES, PROFILE_NAMES, PROFILE_DESCRIPTIONS, INNER_AUTHORITY_DESCRIPTIONS, GATE_THEMES } from '../../lib/humanDesign';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { Label } from '../../components/ui/Label';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { Input } from '../../components/ui/Input';

function parseBirthDate(birthDate: string): Date {
  const [y, m, d] = birthDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

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

function time24To12h(time24: string): { time12: string; ampm: 'AM' | 'PM' } {
  const parts = time24.split(':');
  if (parts.length !== 2) return { time12: time24, ampm: 'AM' };
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (h === 0) return { time12: `12:${m}`, ampm: 'AM' };
  if (h === 12) return { time12: `12:${m}`, ampm: 'PM' };
  if (h > 12) return { time12: `${h - 12}:${m}`, ampm: 'PM' };
  return { time12: `${h}:${m}`, ampm: 'AM' };
}

function formatBirthTime(time24: string): string {
  const { time12, ampm } = time24To12h(time24);
  return `${time12} ${ampm}`;
}

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

  const saveSignOverride = async (sign: string) => {
    if (!profile) return;
    const updated = { ...profile, sun_sign_override: sign };
    await storage.setProfile(updated);
    setProfile(updated);
  };

  if (!profile) return null;

  const today = new Date();
  const personalNums = {
    year: calcPersonalYear(profile.birth_date, today.getFullYear()),
    month: calcPersonalMonth(profile.birth_date, today.getFullYear(), today.getMonth() + 1),
    day: calcPersonalDay(profile.birth_date, today.getFullYear(), today.getMonth() + 1, today.getDate()),
  };
  const destiny = calcDestiny(profile.name);
  const sunSign = getSunSign(profile.birth_date, profile.sun_sign_override);
  const sunDetail = ZODIAC_DETAILS[sunSign];
  const sunAura = ELEMENT_AURA[sunDetail?.element ?? ''];
  const moonSign = getMoonSignApprox(new Date(profile.birth_date + 'T12:00:00Z'));
  const moonDetail = ZODIAC_DETAILS[moonSign];
  const moonAura = ELEMENT_AURA[moonDetail?.element ?? ''];
  const birthMoon = getBirthMoonPhase(profile.birth_date);
  const hasRising = !profile.birth_time_unknown && !!profile.birth_time;
  const pyMeaning = PERSONAL_YEAR_MEANINGS[personalNums.year];
  const hdType = profile.human_design_type ? HD_TYPES[profile.human_design_type] : null;
  const hdGates = getHumanDesignGates(profile.birth_date, profile.birth_time);
  const lifePathDeep = LIFE_PATH_DEEP[profile.life_path_number];
  const birthDateDisplay = format(parseBirthDate(profile.birth_date), 'MMMM d, yyyy');
  const cuspInfo = getCuspInfo(profile.birth_date);
  const showCuspPicker = !!cuspInfo && !profile.sun_sign_override;

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
            {birthDateDisplay} · {profile.birth_location}
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

      {showCuspPicker && (
        <CuspPickerCard cuspInfo={cuspInfo} onPick={saveSignOverride} />
      )}

      {/* Your Reading */}
      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Your Reading</Label>

        <ReadingSection label="Sun Sign" icon={sunDetail?.symbol}>
          <Label variant="body" style={{ color: sunAura?.color ?? Colors.accent }}>{sunSign}</Label>
          <Label variant="caption" color={Colors.textTertiary}>{sunDetail?.element} · {sunDetail?.quality} · ruled by {sunDetail?.rulingPlanet}</Label>
          {sunDetail && <Label variant="caption" color={Colors.textSecondary} style={styles.readingBody}>{sunDetail.description}</Label>}
          {cuspInfo && profile.sun_sign_override && (
            <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: 4 }}>
              ✦ Cusp: {cuspInfo.signs[0]} / {cuspInfo.signs[1]} · you chose {profile.sun_sign_override}
            </Label>
          )}
          {sunDetail?.deepDive && (
            <RevealCard label="Your Sun sign secret ✦">
              <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{sunDetail.deepDive}</Label>
            </RevealCard>
          )}
        </ReadingSection>

        <Divider />
        <ReadingSection label="Moon Sign" icon={moonDetail?.symbol}>
          <Label variant="body" style={{ color: moonAura?.color ?? Colors.text }}>{moonSign}</Label>
          <Label variant="caption" color={Colors.textTertiary}>{moonDetail?.element} · born under {birthMoon.phaseEmoji} {birthMoon.phase}</Label>
          {moonDetail && <Label variant="caption" color={Colors.textSecondary} style={styles.readingBody}>{moonDetail.description}</Label>}
          {moonDetail?.deepDive && (
            <RevealCard label="Your Moon sign secret ✦">
              <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{moonDetail.deepDive}</Label>
            </RevealCard>
          )}
        </ReadingSection>

        <Divider />
        <ReadingSection label={`Life Path ${profile.life_path_number}`} icon="◆">
          <Label variant="caption" color={Colors.textSecondary} style={styles.readingBody}>
            {LIFE_PATH_MEANINGS[profile.life_path_number]}
          </Label>
          <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>
            Sun in {sunSign} + Life Path {profile.life_path_number}: your {sunDetail?.element?.toLowerCase()} nature channels through a path of {LIFE_PATH_MEANINGS[profile.life_path_number]?.split('—')[0]?.trim()?.toLowerCase() ?? 'purpose'}.
          </Label>
          {lifePathDeep && (
            <RevealCard label="Your Life Path secret ✦">
              <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{lifePathDeep.deepDive}</Label>
              <View style={styles.giftList}>
                {lifePathDeep.gifts.map(g => (
                  <Label key={g} variant="micro" color={Colors.textSecondary} style={styles.giftItem}>✦ {g}</Label>
                ))}
              </View>
              <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.xs }}>Shadow: {lifePathDeep.shadow}</Label>
              <Label variant="micro" style={{ color: Colors.accent, marginTop: Spacing.xs, fontStyle: 'italic' }}>"{lifePathDeep.mantra}"</Label>
            </RevealCard>
          )}
        </ReadingSection>

        {(hdType || profile.human_design_type) && (
          <>
            <Divider />
            <ReadingSection label={`Human Design · ${profile.human_design_type ?? ''}`} icon="◈">
              {hdType && (
                <>
                  <Label variant="body" style={{ color: Colors.accent }}>{hdType.icon} {profile.human_design_type}</Label>
                  <Label variant="caption" color={Colors.textSecondary} style={styles.readingBody}>{hdType.description}</Label>
                  <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>
                    Strategy: {hdType.strategy}
                  </Label>
                  <RevealCard label="Your Human Design secret ✦">
                    <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{hdType.deepDive}</Label>
                    <Label variant="micro" style={{ color: Colors.accent, marginTop: Spacing.xs }}>Signature: {hdType.signature}</Label>
                    <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: 2 }}>Not-self: {hdType.notSelf}</Label>
                  </RevealCard>
                </>
              )}
              <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm }}>
                Profile {hdGates.profile} · {hdGates.profileName}
              </Label>
            </ReadingSection>
          </>
        )}

        <Divider />
        <ReadingSection label={`Personal Year ${personalNums.year}`} icon="◎">
          {pyMeaning && (
            <>
              <Label variant="body" style={{ color: Colors.accent }}>{pyMeaning.title}</Label>
              <Label variant="caption" color={Colors.textTertiary}>{pyMeaning.theme}</Label>
              <RevealCard label="What this year holds ✦">
                <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{pyMeaning.description}</Label>
              </RevealCard>
            </>
          )}
        </ReadingSection>
      </Card>

      {/* Astrological Profile */}
      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Astrological Profile</Label>

        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.xs }}>Sun Sign</Label>
        <View style={[styles.auraSection, sunAura && {
          borderColor: sunAura.border,
          borderWidth: 1,
          backgroundColor: sunAura.glow,
          shadowColor: sunAura.color,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5,
        }]}>
          <View style={styles.signRow}>
            <Label variant="body" style={{ color: sunAura?.color ?? Colors.accent }}>{sunSign} {sunDetail?.symbol}</Label>
            <Label variant="caption" color={Colors.textTertiary}>{sunDetail?.element} · {sunDetail?.quality}</Label>
          </View>
          <View style={styles.keywordRow}>
            {sunDetail?.keywords.map(k => (
              <View key={k} style={[styles.keyword, sunAura && { borderColor: sunAura.border, borderWidth: 1, backgroundColor: 'transparent' }]}>
                <Label variant="micro" style={{ color: sunAura?.color ?? Colors.textSecondary }}>{k}</Label>
              </View>
            ))}
          </View>
        </View>

        <Divider />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>Moon Sign (birth)</Label>
        <View style={[styles.auraSection, moonAura && {
          borderColor: moonAura.border,
          borderWidth: 1,
          backgroundColor: moonAura.glow,
          shadowColor: moonAura.color,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5,
        }]}>
          <View style={styles.signRow}>
            <Label variant="body" style={{ color: moonAura?.color ?? Colors.text }}>{moonSign} {moonDetail?.symbol}</Label>
            <Label variant="caption" color={Colors.textTertiary}>{moonDetail?.element} · {moonDetail?.quality}</Label>
          </View>
          <Label variant="caption" color={Colors.textSecondary}>Born under the {birthMoon.phaseEmoji} {birthMoon.phase}</Label>
        </View>

        <Divider />
        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>Rising Sign</Label>
        {hasRising ? (
          <ProfileRow label="Birth Time" value={formatBirthTime(profile.birth_time!)} />
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

      {/* Human Design */}
      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.sm }}>Human Design</Label>
        {hdType ? (
          <>
            <View style={styles.hdTypeRow}>
              <Label style={styles.hdTypeIcon}>{hdType.icon}</Label>
              <View style={{ flex: 1 }}>
                <Label variant="body" style={{ color: Colors.accent }}>{profile.human_design_type}</Label>
                <Label variant="caption" color={Colors.textTertiary}>{hdType.aura}</Label>
              </View>
              <Label variant="micro" color={Colors.textTertiary}>{hdType.population}</Label>
            </View>
            <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md, lineHeight: 20 }}>
              {hdType.description}
            </Label>
            <ProfileRow label="Strategy" value={hdType.strategy} />
            <Divider />
            <ProfileRow label="Signature" value={hdType.signature} />
            <Divider />
            <ProfileRow label="Not-Self Theme" value={hdType.notSelf} />
            {profile.human_design_authority && (
              <>
                <Divider />
                <ProfileRow label="Inner Authority" value={profile.human_design_authority} />
                {INNER_AUTHORITY_DESCRIPTIONS[profile.human_design_authority] && (
                  <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4, lineHeight: 18 }}>
                    {INNER_AUTHORITY_DESCRIPTIONS[profile.human_design_authority].description}
                  </Label>
                )}
              </>
            )}
            <Divider />
            <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: 4 }}>Profile</Label>
            <Label variant="body">{hdGates.profile} · {hdGates.profileName}</Label>
            {PROFILE_DESCRIPTIONS[hdGates.profile] && (
              <RevealCard label="Your Profile secret ✦">
                <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>
                  {PROFILE_DESCRIPTIONS[hdGates.profile]}
                </Label>
              </RevealCard>
            )}
            <Divider />
            <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>Conscious & Unconscious Sun Gates</Label>
            <View style={styles.gatesRow}>
              <View style={styles.gateBox}>
                <Label variant="micro" color={Colors.textTertiary}>Conscious ☉</Label>
                <Label variant="heading" style={{ color: Colors.accent }}>Gate {hdGates.conscious.gate}</Label>
                <Label variant="micro" color={Colors.textSecondary}>Line {hdGates.conscious.line}</Label>
                <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>{GATE_THEMES[hdGates.conscious.gate]}</Label>
              </View>
              <View style={styles.gateBox}>
                <Label variant="micro" color={Colors.textTertiary}>Unconscious ☉</Label>
                <Label variant="heading">{hdGates.unconscious.gate}</Label>
                <Label variant="micro" color={Colors.textSecondary}>Line {hdGates.unconscious.line}</Label>
                <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>{GATE_THEMES[hdGates.unconscious.gate]}</Label>
              </View>
            </View>
            <RevealCard label="Your Human Design deep dive ✦">
              <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{hdType.deepDive}</Label>
            </RevealCard>
          </>
        ) : (
          <>
            <View style={styles.hdTypeRow}>
              <View style={{ flex: 1 }}>
                <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.xs }}>Profile</Label>
                <Label variant="body">{hdGates.profile} · {hdGates.profileName}</Label>
              </View>
            </View>
            {PROFILE_DESCRIPTIONS[hdGates.profile] && (
              <Label variant="caption" color={Colors.textSecondary} style={{ lineHeight: 20, marginTop: Spacing.sm, marginBottom: Spacing.md }}>
                {PROFILE_DESCRIPTIONS[hdGates.profile]}
              </Label>
            )}
            <Divider />
            <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>Sun Gates</Label>
            <View style={styles.gatesRow}>
              <View style={styles.gateBox}>
                <Label variant="micro" color={Colors.textTertiary}>Conscious ☉</Label>
                <Label variant="heading" style={{ color: Colors.accent }}>Gate {hdGates.conscious.gate}</Label>
                <Label variant="micro" color={Colors.textSecondary}>Line {hdGates.conscious.line}</Label>
                <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>{GATE_THEMES[hdGates.conscious.gate]}</Label>
              </View>
              <View style={styles.gateBox}>
                <Label variant="micro" color={Colors.textTertiary}>Unconscious ☉</Label>
                <Label variant="heading">{hdGates.unconscious.gate}</Label>
                <Label variant="micro" color={Colors.textSecondary}>Line {hdGates.unconscious.line}</Label>
                <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>{GATE_THEMES[hdGates.unconscious.gate]}</Label>
              </View>
            </View>
            <Label variant="caption" color={Colors.textTertiary} style={{ marginTop: Spacing.md, lineHeight: 18 }}>
              Your Type and Authority help complete the picture — add them in Edit Profile.
            </Label>
            <Button label="Set HD Type" onPress={() => setEditVisible(true)} size="md" variant="secondary" style={{ marginTop: Spacing.md }} />
          </>
        )}
      </Card>

      {/* Numerology */}
      <Card>
        <Label variant="heading" style={{ marginBottom: Spacing.md }}>Numerology</Label>
        <ProfileRow label="Life Path" value={`${profile.life_path_number}`} />
        <Divider />
        <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
          {LIFE_PATH_MEANINGS[profile.life_path_number]}
        </Label>
        {lifePathDeep && (
          <RevealCard label="Life Path deep dive ✦">
            <Label variant="caption" color={Colors.textSecondary} style={styles.deepDiveText}>{lifePathDeep.deepDive}</Label>
            <View style={styles.giftList}>
              {lifePathDeep.gifts.map(g => <Label key={g} variant="micro" color={Colors.textSecondary} style={styles.giftItem}>✦ {g}</Label>)}
            </View>
            <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.xs }}>Shadow: {lifePathDeep.shadow}</Label>
            <Label variant="micro" style={{ color: Colors.accent, marginTop: Spacing.xs, fontStyle: 'italic' }}>"{lifePathDeep.mantra}"</Label>
          </RevealCard>
        )}
        <Divider />
        <ProfileRow label="Destiny Number" value={`${destiny}`} />
        <Divider />
        <ProfileRow label="Personal Year" value={`${personalNums.year} — ${pyMeaning?.title ?? ''}`} />
        {pyMeaning && (
          <Label variant="caption" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm, lineHeight: 18 }}>
            {pyMeaning.description}
          </Label>
        )}
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

function RevealCard({ label = 'Reveal more ✦', children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: Spacing.sm }}>
      <TouchableOpacity onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <Label variant="micro" style={{ color: Colors.accent }}>
          {open ? '✦ Close' : label}
        </Label>
      </TouchableOpacity>
      {open && (
        <View style={styles.revealContent}>
          {children}
        </View>
      )}
    </View>
  );
}

function CuspPickerCard({
  cuspInfo,
  onPick,
}: {
  cuspInfo: { isCusp: boolean; signs: [string, string] };
  onPick: (sign: string) => void;
}) {
  return (
    <Card style={styles.cuspCard}>
      <Label variant="micro" style={{ color: Colors.accent, marginBottom: Spacing.xs }}>✦ You're on the Cusp</Label>
      <Label variant="heading" style={{ marginBottom: Spacing.xs }}>
        {cuspInfo.signs[0]} / {cuspInfo.signs[1]}
      </Label>
      <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md, lineHeight: 20 }}>
        Your birthday falls on the boundary between two signs. The Sun's exact crossing depends on the year and your birth time — so the call is yours to make. Choose the sign that resonates.
      </Label>
      <View style={styles.cuspOptions}>
        {cuspInfo.signs.map(sign => {
          const detail = ZODIAC_DETAILS[sign];
          const aura = ELEMENT_AURA[detail?.element ?? ''];
          return (
            <TouchableOpacity
              key={sign}
              style={[styles.cuspOption, { borderColor: aura?.border ?? Colors.border }]}
              onPress={() => onPick(sign)}
              activeOpacity={0.75}
            >
              <Label style={styles.cuspSymbol}>{detail?.symbol}</Label>
              <Label variant="body" style={{ color: aura?.color ?? Colors.text }}>{sign}</Label>
              <Label variant="micro" color={Colors.textTertiary}>{detail?.element}</Label>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

function ReadingSection({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <View style={styles.readingSection}>
      <View style={styles.readingSectionHeader}>
        {icon && <Label style={styles.readingIcon}>{icon}</Label>}
        <Label variant="micro" color={Colors.textTertiary}>{label.toUpperCase()}</Label>
      </View>
      <View style={{ gap: 4 }}>{children}</View>
    </View>
  );
}

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => Promise<void>;
}

function EditProfileModal({ visible, profile, onClose, onSave }: EditProfileModalProps) {
  const parsed = profile.birth_time ? time24To12h(profile.birth_time) : null;
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birth_date);
  const [birthTime, setBirthTime] = useState(parsed?.time12 ?? '');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(parsed?.ampm ?? 'AM');
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(profile.birth_time_unknown ?? false);
  const [location, setLocation] = useState(profile.birth_location);
  const [hdType, setHdType] = useState<string | null>(profile.human_design_type ?? null);
  const [hdAuthority, setHdAuthority] = useState<string | null>(profile.human_design_authority ?? null);
  const [sunSignOverride, setSunSignOverride] = useState<string | null>(profile.sun_sign_override ?? null);

  React.useEffect(() => {
    if (visible) {
      const p2 = profile.birth_time ? time24To12h(profile.birth_time) : null;
      setName(profile.name);
      setBirthDate(profile.birth_date);
      setBirthTime(p2?.time12 ?? '');
      setAmpm(p2?.ampm ?? 'AM');
      setBirthTimeUnknown(profile.birth_time_unknown ?? false);
      setLocation(profile.birth_location);
      setHdType(profile.human_design_type ?? null);
      setHdAuthority(profile.human_design_authority ?? null);
      setSunSignOverride(profile.sun_sign_override ?? null);
    }
  }, [visible, profile]);

  const currentCuspInfo = getCuspInfo(birthDate);

  const save = () => {
    if (!name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !location.trim()) return;
    const stored24h = birthTimeUnknown ? null : (birthTime.trim() ? timeTo24h(birthTime.trim(), ampm) || null : null);
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      birth_date: birthDate.trim(),
      birth_time: stored24h,
      birth_time_unknown: birthTimeUnknown,
      birth_location: location.trim(),
      life_path_number: calcLifePath(birthDate.trim()),
      human_design_type: hdType,
      human_design_authority: hdAuthority,
      sun_sign_override: currentCuspInfo ? sunSignOverride : null,
    };
    onSave(updated);
  };

  const canSave = name.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && location.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHandle} />
        <Label variant="heading" style={{ marginBottom: Spacing.xl }}>Edit Profile</Label>

        <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" containerStyle={{ marginBottom: Spacing.md }} />
        <Input label="Birth Date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1998-06-21" keyboardType="numeric" maxLength={10} containerStyle={{ marginBottom: Spacing.md }} />

        <Input
          label="Birth Time (H:MM)"
          value={birthTime}
          onChangeText={t => { setBirthTime(t); if (birthTimeUnknown) setBirthTimeUnknown(false); }}
          placeholder="3:32"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          editable={!birthTimeUnknown}
          containerStyle={{ marginBottom: Spacing.sm }}
        />
        {!birthTimeUnknown && (
          <View style={styles.ampmRow}>
            {(['AM', 'PM'] as const).map(period => (
              <TouchableOpacity key={period} style={[styles.ampmBtn, ampm === period && styles.ampmBtnActive]} onPress={() => setAmpm(period)}>
                <Label style={[styles.ampmLabel, ampm === period && styles.ampmLabelActive]}>{period}</Label>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.unknownRow} onPress={() => { setBirthTimeUnknown(v => !v); setBirthTime(''); }} activeOpacity={0.7}>
          <View style={[styles.checkbox, birthTimeUnknown && styles.checkboxOn]}>
            {birthTimeUnknown && <Label style={styles.checkmark}>✓</Label>}
          </View>
          <Label variant="caption" color={Colors.textSecondary}>Birth time unknown</Label>
        </TouchableOpacity>

        <Input label="Birth Location" value={location} onChangeText={setLocation} placeholder="New York, USA" autoCapitalize="words" containerStyle={{ marginTop: Spacing.md, marginBottom: Spacing.lg }} />

        {currentCuspInfo && (
          <View style={{ marginBottom: Spacing.lg }}>
            <Label variant="micro" color={Colors.accent} style={{ marginBottom: Spacing.xs }}>✦ Cusp Date Detected</Label>
            <Label variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
              {currentCuspInfo.signs[0]}/{currentCuspInfo.signs[1]} — pick the sign that resonates with you.
            </Label>
            <View style={styles.ampmRow}>
              {currentCuspInfo.signs.map(sign => (
                <TouchableOpacity
                  key={sign}
                  style={[styles.ampmBtn, sunSignOverride === sign && styles.ampmBtnActive]}
                  onPress={() => setSunSignOverride(sunSignOverride === sign ? null : sign)}
                  activeOpacity={0.7}
                >
                  <Label style={[styles.ampmLabel, sunSignOverride === sign && styles.ampmLabelActive]}>{sign}</Label>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Label variant="micro" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>Human Design Type</Label>
        <View style={styles.enneagramList}>
          {Object.entries(HD_TYPES).map(([typeName, t]) => {
            const active = hdType === typeName;
            return (
              <TouchableOpacity key={typeName} onPress={() => setHdType(active ? null : typeName)} activeOpacity={0.7}>
                <View style={[styles.enneagramRow, active && styles.enneagramRowActive]}>
                  <Label style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{t.icon}</Label>
                  <View style={{ flex: 1 }}>
                    <Label variant="body">{typeName}</Label>
                    <Label variant="caption" color={Colors.textSecondary} numberOfLines={1}>{t.strategy}</Label>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Label variant="micro" color={Colors.textTertiary} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>Inner Authority</Label>
        <View style={styles.enneagramList}>
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

        <View style={[styles.modalFooter, { marginTop: Spacing.xl }]}>
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
  readingSection: { paddingVertical: Spacing.sm, gap: Spacing.xs },
  readingSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  readingIcon: { fontSize: 14, color: Colors.textTertiary },
  readingBody: { lineHeight: 20, marginTop: 4 },
  revealContent: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  deepDiveText: { lineHeight: 22, fontStyle: 'italic' },
  giftList: { marginTop: Spacing.sm, gap: 2 },
  giftItem: { lineHeight: 20 },
  auraSection: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 0,
    borderColor: 'transparent',
    marginBottom: Spacing.sm,
  },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  keywordRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginTop: Spacing.xs },
  keyword: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.border },
  strengthsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginTop: Spacing.sm },
  hdTypeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  hdTypeIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  gatesRow: { flexDirection: 'row', gap: Spacing.md },
  gateBox: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, gap: 2 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4, gap: Spacing.md },
  profileValue: { fontWeight: '500', flex: 1, textAlign: 'right' },
  dangerCard: { borderColor: '#FF3B3040' },
  cuspCard: { borderColor: Colors.borderGlow, borderWidth: 1 },
  cuspOptions: { flexDirection: 'row', gap: Spacing.md },
  cuspOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  cuspSymbol: { fontSize: 24 },
  modal: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: Spacing.lg },
  modalHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
  ampmRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  ampmBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  ampmBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  ampmLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  ampmLabelActive: { color: Colors.background },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 12, color: Colors.background },
  enneagramList: { gap: Spacing.sm, marginBottom: Spacing.md },
  enneagramRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  enneagramRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.xxl },
});
