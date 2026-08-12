export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type AspectType =
  | 'conjunction' | 'sextile' | 'square'
  | 'trine' | 'opposition' | 'quincunx';

export interface PlanetData {
  name: string;
  lon: number;       // ecliptic longitude 0–360°
  sign: ZodiacSign;
  signSymbol: string;
  degree: number;    // whole degrees within sign 0–29
  minute: number;    // arc-minutes 0–59
  second: number;    // arc-seconds 0–59
  retrograde: boolean;
  house: number;     // 1–12
}

export interface HouseCusp {
  house: number;       // 1–12
  lon: number;         // ecliptic longitude of cusp
  sign: ZodiacSign;
  signSymbol: string;
  degree: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: AspectType;
  exactAngle: number;  // ideal angle (0, 60, 90, 120, 180, 150)
  separation: number;  // actual angular separation
  orb: number;         // |separation - exactAngle|
  applying: boolean;   // planet1 approaching planet2
}

export interface NatalChart {
  planets: Record<string, PlanetData>;
  ascendant: number;     // ecliptic longitude of ASC
  midheaven: number;     // ecliptic longitude of MC
  houses: HouseCusp[];   // 12 elements, index 0 = house 1
  aspects: Aspect[];
  obliquity: number;     // axial tilt in degrees
  ramc: number;          // right ascension of midheaven in degrees
  jd: number;            // Julian Day of calculation (UTC)
  utcOffsetHours: number;
  houseSystem: 'Placidus';
  zodiacType: 'Tropical';
  hasTime: boolean;
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
}
