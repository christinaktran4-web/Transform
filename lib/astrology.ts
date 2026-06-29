import { format } from 'date-fns';

export interface MoonData {
  phase: string;
  phaseEmoji: string;
  illumination: number;
  sign: string;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440;
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
}

export function getMoonPhase(date: Date = new Date()): MoonData {
  const jd = julianDay(date);
  const knownNew = 2451549.5; // Jan 6, 2000 new moon
  const synodicMonth = 29.53058867;
  const age = ((jd - knownNew) % synodicMonth + synodicMonth) % synodicMonth;
  const illumination = Math.round(
    (1 - Math.cos((2 * Math.PI * age) / synodicMonth)) / 2 * 100
  );

  let phase: string;
  let phaseEmoji: string;
  if (age < 1.85) { phase = 'New Moon'; phaseEmoji = '🌑'; }
  else if (age < 7.38) { phase = 'Waxing Crescent'; phaseEmoji = '🌒'; }
  else if (age < 9.22) { phase = 'First Quarter'; phaseEmoji = '🌓'; }
  else if (age < 14.77) { phase = 'Waxing Gibbous'; phaseEmoji = '🌔'; }
  else if (age < 16.61) { phase = 'Full Moon'; phaseEmoji = '🌕'; }
  else if (age < 22.15) { phase = 'Waning Gibbous'; phaseEmoji = '🌖'; }
  else if (age < 23.99) { phase = 'Last Quarter'; phaseEmoji = '🌗'; }
  else { phase = 'Waning Crescent'; phaseEmoji = '🌘'; }

  const moonLong = (age / synodicMonth * 360 + 218.316) % 360;
  const signIndex = Math.floor(moonLong / 30) % 12;
  const sign = ZODIAC_SIGNS[signIndex];

  return { phase, phaseEmoji, illumination, sign };
}

export function getCurrentZodiacSeason(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const seasons: [number, number, string][] = [
    [3, 21, 'Aries'], [4, 20, 'Taurus'], [5, 21, 'Gemini'],
    [6, 21, 'Cancer'], [7, 23, 'Leo'], [8, 23, 'Virgo'],
    [9, 23, 'Libra'], [10, 23, 'Scorpio'], [11, 22, 'Sagittarius'],
    [12, 22, 'Capricorn'], [1, 20, 'Aquarius'], [2, 19, 'Pisces'],
  ];
  for (let i = seasons.length - 1; i >= 0; i--) {
    const [sm, sd] = seasons[i];
    if (month > sm || (month === sm && day >= sd)) {
      return seasons[i][2];
    }
  }
  return 'Capricorn';
}

export function getSunSign(birthDate: string): string {
  const [, month, day] = birthDate.split('-').map(Number);
  const date = new Date(2000, month - 1, day);
  return getCurrentZodiacSeason(date);
}

export const MOON_PHASE_MEANINGS: Record<string, string> = {
  'New Moon': 'A time for intention-setting and new beginnings.',
  'Waxing Crescent': 'Build momentum toward your intentions.',
  'First Quarter': 'Take decisive action; push through resistance.',
  'Waxing Gibbous': 'Refine and adjust — you are close.',
  'Full Moon': 'Culmination, release, and heightened awareness.',
  'Waning Gibbous': 'Share, express, and integrate your experiences.',
  'Last Quarter': 'Release what no longer serves you.',
  'Waning Crescent': 'Rest, reflect, and prepare for renewal.',
};
