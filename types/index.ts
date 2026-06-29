export interface UserProfile {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_location: string;
  birth_lat: number | null;
  birth_lng: number | null;
  life_path_number: number;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  gratitude: string | null;
  notes: string | null;
  created_at: string;
}

export interface DreamEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string;
  intensity: number;
  tags: string[];
  themes: string[];
  created_at: string;
}

export interface Synchronicity {
  id: string;
  user_id: string;
  date: string;
  type: SynchronicityType;
  description: string;
  significance: number;
  notes: string | null;
  created_at: string;
}

export type SynchronicityType =
  | 'number'
  | 'animal'
  | 'song'
  | 'name'
  | 'symbol'
  | 'coincidence'
  | 'intuition'
  | 'other';

export interface MoonPhase {
  phase: string;
  illumination: number;
  emoji: string;
  sign: string;
}

export interface OracleMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NumerologyProfile {
  lifePath: number;
  destiny: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}
