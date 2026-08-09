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

// Exported for humanDesign.ts
export function julianDayFromDate(year: number, month: number, day: number, hour = 12, minute = 0): number {
  const a = Math.floor((14 - month) / 12);
  const yr = year + 4800 - a;
  const mo = month + 12 * a - 3;
  const d = day + hour / 24 + minute / 1440;
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

// Jean Meeus moon longitude (degrees, ecliptic)
export function getMoonLongitudeJD(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = (218.3164477 + 481267.88123421 * T) % 360;
  const M  = (134.9633964 + 477198.8675055  * T) % 360;
  const D  = (297.8501921 + 445267.1114034  * T) % 360;
  const Ms = (357.5291092 + 35999.0502909   * T) % 360;
  const F  = (93.2720950  + 483202.0175233  * T) % 360;
  const r = Math.PI / 180;
  const corr =
    6.288774  * Math.sin(M         * r) +
    1.274027  * Math.sin((2*D - M) * r) +
    0.658314  * Math.sin(2*D       * r) +
    0.213618  * Math.sin(2*M       * r) +
   -0.185116  * Math.sin(Ms        * r) +
   -0.114332  * Math.sin(2*F       * r) +
    0.058793  * Math.sin((2*D - 2*M)       * r) +
    0.057066  * Math.sin((2*D - Ms - M)    * r) +
    0.053322  * Math.sin((2*D + M)         * r) +
    0.045758  * Math.sin((2*D - Ms)        * r);
  return ((L0 + corr) % 360 + 360) % 360;
}

// Exported for humanDesign.ts
export function getSunLongitudeJD(jd: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M  = 357.52911 + 35999.05029 * T;
  const Mr = (M % 360) * Math.PI / 180;
  const C  = (1.914602 - 0.004817 * T) * Math.sin(Mr)
           + 0.019993 * Math.sin(2 * Mr)
           + 0.000289 * Math.sin(3 * Mr);
  return ((L0 + C) % 360 + 360) % 360;
}

export function getMoonPhase(date: Date = new Date()): MoonData {
  const jd = julianDay(date);
  const knownNew = 2451549.5;
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

  const moonLong = getMoonLongitudeJD(jd);
  const signIndex = Math.floor(moonLong / 30) % 12;
  const sign = ZODIAC_SIGNS[signIndex];

  return { phase, phaseEmoji, illumination, sign };
}

export function getCurrentZodiacSeason(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const seasons: [number, number, string][] = [
    [1, 20, 'Aquarius'], [2, 19, 'Pisces'], [3, 21, 'Aries'],
    [4, 20, 'Taurus'], [5, 21, 'Gemini'], [6, 21, 'Cancer'],
    [7, 23, 'Leo'], [8, 23, 'Virgo'], [9, 23, 'Libra'],
    [10, 23, 'Scorpio'], [11, 22, 'Sagittarius'], [12, 22, 'Capricorn'],
  ];
  let current = 'Capricorn';
  for (const [sm, sd, sign] of seasons) {
    if (month > sm || (month === sm && day >= sd)) current = sign;
  }
  return current;
}

// Returns cusp info when birth date falls on or one day before a sign boundary.
export function getCuspInfo(birthDate: string): { isCusp: boolean; signs: [string, string] } | null {
  const [, month, day] = birthDate.split('-').map(Number);
  const transitions: [number, number, string, string][] = [
    [1, 20, 'Aquarius', 'Capricorn'],
    [2, 19, 'Pisces', 'Aquarius'],
    [3, 21, 'Aries', 'Pisces'],
    [4, 20, 'Taurus', 'Aries'],
    [5, 21, 'Gemini', 'Taurus'],
    [6, 21, 'Cancer', 'Gemini'],
    [7, 23, 'Leo', 'Cancer'],
    [8, 23, 'Virgo', 'Leo'],
    [9, 23, 'Libra', 'Virgo'],
    [10, 23, 'Scorpio', 'Libra'],
    [11, 22, 'Sagittarius', 'Scorpio'],
    [12, 22, 'Capricorn', 'Sagittarius'],
  ];
  for (const [sm, sd, newSign, prevSign] of transitions) {
    if (month === sm && (day === sd || day === sd - 1)) {
      return { isCusp: true, signs: [prevSign, newSign] };
    }
  }
  return null;
}

export function getSunSign(birthDate: string, override?: string | null): string {
  if (override) return override;
  const [, month, day] = birthDate.split('-').map(Number);
  const date = new Date(2000, month - 1, day);
  return getCurrentZodiacSeason(date);
}

export function getMoonSignApprox(date: Date): string {
  return getMoonPhase(date).sign;
}

export function getBirthMoonPhase(birthDate: string): Pick<MoonData, 'phase' | 'phaseEmoji'> {
  const date = new Date(birthDate + 'T12:00:00Z');
  const { phase, phaseEmoji } = getMoonPhase(date);
  return { phase, phaseEmoji };
}

export const ELEMENT_AURA: Record<string, { border: string; glow: string; color: string }> = {
  Fire:  { border: 'rgba(255, 130, 60, 0.45)',  glow: 'rgba(255, 130, 60, 0.08)',  color: '#FF8240' },
  Earth: { border: 'rgba(100, 200, 120, 0.40)', glow: 'rgba(100, 200, 120, 0.08)', color: '#64C878' },
  Air:   { border: 'rgba(160, 120, 240, 0.45)', glow: 'rgba(160, 120, 240, 0.08)', color: '#A078F0' },
  Water: { border: 'rgba(80, 160, 230, 0.45)',  glow: 'rgba(80, 160, 230, 0.08)',  color: '#50A0E6' },
};

export const ZODIAC_DETAILS: Record<string, {
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  quality: 'Cardinal' | 'Fixed' | 'Mutable';
  rulingPlanet: string;
  keywords: string[];
  description: string;
  deepDive: string;
}> = {
  Aries: {
    symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars',
    keywords: ['Initiative', 'Courage', 'Action'],
    description: 'Pioneer of the zodiac — bold, direct, energized by new beginnings.',
    deepDive: "Here is your first secret: you were not born patient — and that is a gift. Aries doesn't wait for permission. You are the alarm clock of the zodiac, firing first and asking questions later. The shadow? That same blaze can singe the people you love if you're not careful. Your real weapon is honesty so raw it's almost rude. Almost.",
  },
  Taurus: {
    symbol: '♉', element: 'Earth', quality: 'Fixed', rulingPlanet: 'Venus',
    keywords: ['Stability', 'Sensuality', 'Patience'],
    description: 'Grounded and enduring — drawn to beauty, comfort, and lasting value.',
    deepDive: "You are the zodiac's hidden hedonist. Everyone sees the stubbornness; fewer see the exquisite taste underneath it — the way you know exactly how a room should smell, how a Sunday should feel. Your secret: beneath all that groundedness is a quiet terror of losing what you love. That's why you hold on so hard. You're not possessive. You're devoted.",
  },
  Gemini: {
    symbol: '♊', element: 'Air', quality: 'Mutable', rulingPlanet: 'Mercury',
    keywords: ['Curiosity', 'Communication', 'Adaptability'],
    description: 'The twins in constant motion — quick-witted, versatile, endlessly curious.',
    deepDive: "You contain multitudes — and yes, you know it. The twins aren't two-faced; they're binocular. You see angles others miss entirely. Your secret: you're not actually indecisive — you just refuse to close off possibilities before you absolutely have to. The world loves a Gemini at a dinner party. What the world doesn't know is that Gemini needs silence more than anyone suspects.",
  },
  Cancer: {
    symbol: '♋', element: 'Water', quality: 'Cardinal', rulingPlanet: 'Moon',
    keywords: ['Nurturing', 'Intuition', 'Memory'],
    description: 'The cosmic caretaker — deeply intuitive, fiercely protective of those they love.',
    deepDive: "You remember everything. Not just what happened, but how it felt to be there — the exact quality of light in a room where you were loved. Your shell isn't armor; it's taste. You only open to the worthy, and you always know who that is. Your secret: you're not as fragile as you seem. You're strategic.",
  },
  Leo: {
    symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun',
    keywords: ['Creativity', 'Confidence', 'Leadership'],
    description: 'The radiant sovereign — generous, dramatic, born to shine.',
    deepDive: "Let's be honest — you already knew this was going to be good. Leo rules the Sun because the Sun doesn't apologize for shining. Your secret: beneath all that radiance is a profound sensitivity to whether people are genuinely delighted by you, or just impressed. You can tell the difference. Every time.",
  },
  Virgo: {
    symbol: '♍', element: 'Earth', quality: 'Mutable', rulingPlanet: 'Mercury',
    keywords: ['Precision', 'Service', 'Analysis'],
    description: 'The perfectionist healer — discerning, diligent, devoted to craft and wellness.',
    deepDive: "You are not the critic — you are the curator. There's a difference, and it matters. Virgo notices what's broken because Virgo already sees what it could become. Your deepest secret: you are not the anxious perfectionist the memes say you are. You are someone who cares enormously, in a world that doesn't always care back.",
  },
  Libra: {
    symbol: '♎', element: 'Air', quality: 'Cardinal', rulingPlanet: 'Venus',
    keywords: ['Balance', 'Harmony', 'Justice'],
    description: 'The cosmic diplomat — seeking equilibrium, beauty, and meaningful connection.',
    deepDive: "You are not indecisive. You are thorough. There's a difference — and you, of all signs, appreciate the nuance. Libra holds the scales not because you can't choose, but because you've felt the weight of bad choices on yourself and others. Your secret: when the scales finally tip, you already know which side you want. You just want to be sure.",
  },
  Scorpio: {
    symbol: '♏', element: 'Water', quality: 'Fixed', rulingPlanet: 'Pluto',
    keywords: ['Depth', 'Transformation', 'Intensity'],
    description: 'The alchemist of the zodiac — penetrating, magnetic, unafraid of the abyss.',
    deepDive: "You already suspected there was more to you than people say. You're right. Scorpio doesn't transform — Scorpio transmutes. You take in what's dark and return something with weight and truth. Your real secret: the intensity isn't about control. It's about the fact that you feel everything at full volume, all the time. The walls aren't coldness. They're sound insulation.",
  },
  Sagittarius: {
    symbol: '♐', element: 'Fire', quality: 'Mutable', rulingPlanet: 'Jupiter',
    keywords: ['Freedom', 'Philosophy', 'Adventure'],
    description: 'The eternal wanderer — expansive in mind and spirit, chasing truth and horizon.',
    deepDive: "Your optimism is not naïveté — it's a choice you make every morning. You've seen enough to be cynical and chose otherwise. The archer aims true because freedom is the only compass that never lies. Your secret: you need meaning more than you need adventure. The travel is just where the meaning tends to hide.",
  },
  Capricorn: {
    symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn',
    keywords: ['Ambition', 'Structure', 'Mastery'],
    description: 'The mountain climber — disciplined, strategic, quietly unstoppable.',
    deepDive: "You age backwards. The older you get, the more permission you give yourself to actually enjoy things. Capricorn carries the mountain, yes — but here's what no one tells you: the view from the top is yours first. Your secret: all that ambition is love in disguise. You build because you want something worth leaving behind.",
  },
  Aquarius: {
    symbol: '♒', element: 'Air', quality: 'Fixed', rulingPlanet: 'Uranus',
    keywords: ['Innovation', 'Humanity', 'Originality'],
    description: 'The visionary rebel — ahead of its time, dedicated to collective evolution.',
    deepDive: "You are ahead of your time — which means your whole life is a delayed vindication tour. The rebel of the zodiac is, secretly, the most loyal sign there is: not to people, but to ideas. Your secret: you care deeply about humanity in the abstract and sometimes struggle with people in the specific. This is not a flaw. It's a feature. You're here to hold the vision, not throw the party.",
  },
  Pisces: {
    symbol: '♓', element: 'Water', quality: 'Mutable', rulingPlanet: 'Neptune',
    keywords: ['Empathy', 'Dreams', 'Surrender'],
    description: 'The mystic dissolving all boundaries — compassionate, imaginative, deeply spiritual.',
    deepDive: "You already knew most of what anyone would tell you. You just weren't sure you were allowed to trust it. Pisces is the oldest soul in the room — not because of age, but because you contain residue from every sign that came before. Your secret: you're not lost in your dreams. The dreams are maps. You're the only one fluent enough to read them.",
  },
};

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
