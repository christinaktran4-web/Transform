import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyCheckin, DreamEntry, Synchronicity } from '../types';

const KEYS = {
  USER_PROFILE: 'qm:user_profile',
  CHECKINS: 'qm:checkins',
  DREAMS: 'qm:dreams',
  SYNCHRONICITIES: 'qm:synchronicities',
  ORACLE_MESSAGES: 'qm:oracle_messages',
  ONBOARDED: 'qm:onboarded',
};

async function get<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  isOnboarded: () => AsyncStorage.getItem(KEYS.ONBOARDED).then(v => v === 'true'),
  setOnboarded: () => AsyncStorage.setItem(KEYS.ONBOARDED, 'true'),

  getProfile: () => get<UserProfile>(KEYS.USER_PROFILE),
  setProfile: (p: UserProfile) => set(KEYS.USER_PROFILE, p),

  getCheckins: () => get<DailyCheckin[]>(KEYS.CHECKINS).then(v => v ?? []),
  addCheckin: async (c: DailyCheckin) => {
    const list = await get<DailyCheckin[]>(KEYS.CHECKINS).then(v => v ?? []);
    await set(KEYS.CHECKINS, [c, ...list]);
  },

  getDreams: () => get<DreamEntry[]>(KEYS.DREAMS).then(v => v ?? []),
  addDream: async (d: DreamEntry) => {
    const list = await get<DreamEntry[]>(KEYS.DREAMS).then(v => v ?? []);
    await set(KEYS.DREAMS, [d, ...list]);
  },
  updateDream: async (updated: DreamEntry) => {
    const list = await get<DreamEntry[]>(KEYS.DREAMS).then(v => v ?? []);
    await set(KEYS.DREAMS, list.map(d => d.id === updated.id ? updated : d));
  },
  deleteDream: async (id: string) => {
    const list = await get<DreamEntry[]>(KEYS.DREAMS).then(v => v ?? []);
    await set(KEYS.DREAMS, list.filter(d => d.id !== id));
  },

  getSynchronicities: () => get<Synchronicity[]>(KEYS.SYNCHRONICITIES).then(v => v ?? []),
  addSynchronicity: async (s: Synchronicity) => {
    const list = await get<Synchronicity[]>(KEYS.SYNCHRONICITIES).then(v => v ?? []);
    await set(KEYS.SYNCHRONICITIES, [s, ...list]);
  },
  deleteSynchronicity: async (id: string) => {
    const list = await get<Synchronicity[]>(KEYS.SYNCHRONICITIES).then(v => v ?? []);
    await set(KEYS.SYNCHRONICITIES, list.filter(s => s.id !== id));
  },

  clearAll: async () => {
    await Promise.all(Object.values(KEYS).map(k => AsyncStorage.removeItem(k)));
  },
};
