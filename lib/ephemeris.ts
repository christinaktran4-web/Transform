import { julianDayFromDate, getSunLongitudeJD, getMoonLongitudeJD } from './astrology';

const DEG = Math.PI / 180;
const sinD = (d: number) => Math.sin(d * DEG);
const cosD = (d: number) => Math.cos(d * DEG);
const atan2D = (y: number, x: number) => Math.atan2(y, x) / DEG;
const norm = (d: number) => ((d % 360) + 360) % 360;

// Mean orbital elements at J2000.0
// [L0 mean_longitude, L1 per_century, a_AU, e0, e1_per_century, w0 perihelion_lon, w1_per_century]
const ELEMENTS: Record<string, [number, number, number, number, number, number, number]> = {
  Mercury: [252.250906, 149472.674614, 0.387098, 0.205635, 0.000020,  77.457799, 0.159510],
  Venus:   [181.979101,  58517.815676, 0.723330, 0.006773,-0.000050, 131.563963, 0.002657],
  Earth:   [100.466449,  36000.769822, 1.000000, 0.016709,-0.000042, 102.937348, 0.322503],
  Mars:    [355.433000,  19140.299315, 1.523688, 0.093405, 0.000092, -23.943629, 0.440016],
  Jupiter: [ 34.351519,   3034.905675, 5.202603, 0.048498,-0.000120,  14.331185, 0.213252],
  Saturn:  [ 50.077444,   1222.113777, 9.537070, 0.055546,-0.000290,  93.057033, 0.566020],
  Uranus:  [314.055005,    428.466998,19.191264, 0.046381,-0.000050, 173.005159, 0.089694],
  Neptune: [304.348665,    218.486200,30.068963, 0.009456, 0.000030,  48.123691, 0.027850],
  Pluto:   [238.929101,    145.207094,39.481687, 0.248808, 0.000060, 224.206600, 0.000000],
};

interface HelioState { lon: number; r: number }

function heliocentric(name: string, T: number): HelioState {
  const [L0, L1, a, e0, e1, w0, w1] = ELEMENTS[name];
  const L = norm(L0 + L1 * T);
  const e = e0 + e1 * T;
  const w = norm(w0 + w1 * T);
  const M = norm(L - w);
  const C = (2*e - e**3/4) * sinD(M) + (5/4)*e**2 * sinD(2*M) + (13/12)*e**3 * sinD(3*M);
  const nu = norm(M + C);
  const lon = norm(nu + w);
  const r = a * (1 - e**2) / (1 + e * cosD(nu));
  return { lon, r };
}

function toGeocentric(planet: HelioState, earth: HelioState): number {
  const dx = planet.r * cosD(planet.lon) - earth.r * cosD(earth.lon);
  const dy = planet.r * sinD(planet.lon) - earth.r * sinD(earth.lon);
  return norm(atan2D(dy, dx));
}

function eclipticObliquity(T: number): number {
  return 23.439291 - 0.013004 * T - 0.000000164 * T**2 + 0.000000504 * T**3;
}

function gmst(jd: number, T: number): number {
  return norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T**2);
}

function computeAscendant(jd: number, lat: number, lon: number): number {
  const T = (jd - 2451545.0) / 36525;
  const lst = norm(gmst(jd, T) + lon);
  const eps = eclipticObliquity(T);
  return norm(atan2D(-cosD(lst), sinD(lst) * cosD(eps) + Math.tan(lat * DEG) * sinD(eps)));
}

function computeMidheaven(jd: number, lon: number): number {
  const T = (jd - 2451545.0) / 36525;
  const lst = norm(gmst(jd, T) + lon);
  const eps = eclipticObliquity(T);
  return norm(atan2D(sinD(lst), cosD(lst) * cosD(eps)));
}

const ZODIAC_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

function lonToPlacement(lon: number): { sign: string; symbol: string; degree: number } {
  const n = norm(lon);
  const idx = Math.floor(n / 30) % 12;
  return { sign: ZODIAC_SIGNS[idx], symbol: ZODIAC_SYMBOLS[idx], degree: Math.floor(n % 30) };
}

export interface PlanetPlacement { sign: string; symbol: string; degree: number }

export interface NatalChart {
  planets: Record<string, PlanetPlacement>;
  ascendant: PlanetPlacement | null;
  midheaven: PlanetPlacement | null;
  hasTime: boolean;
  hasLocation: boolean;
}

export function getNatalChart(
  birthDate: string,
  birthTime: string | null | undefined,
  lat: number | null | undefined,
  lon: number | null | undefined,
): NatalChart {
  const [y, m, d] = birthDate.split('-').map(Number);
  let hour = 12, minute = 0;
  const hasTime = !!(birthTime && birthTime.trim());
  if (hasTime) {
    const parts = birthTime!.split(':').map(Number);
    if (parts.length === 2) { hour = parts[0]; minute = parts[1]; }
  }
  const jd = julianDayFromDate(y, m, d, hour, minute);
  const T = (jd - 2451545.0) / 36525;
  const earth = heliocentric('Earth', T);

  const planets: Record<string, PlanetPlacement> = {
    Sun: lonToPlacement(getSunLongitudeJD(jd)),
    Moon: lonToPlacement(getMoonLongitudeJD(jd)),
  };

  for (const name of ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']) {
    const helio = heliocentric(name, T);
    planets[name] = lonToPlacement(toGeocentric(helio, earth));
  }

  const hasLocation = lat != null && lon != null;
  let ascendant: PlanetPlacement | null = null;
  let midheaven: PlanetPlacement | null = null;
  if (hasLocation && hasTime) {
    ascendant = lonToPlacement(computeAscendant(jd, lat!, lon!));
    midheaven = lonToPlacement(computeMidheaven(jd, lon!));
  }

  return { planets, ascendant, midheaven, hasTime, hasLocation };
}

export function getMeanNorthNodeLon(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm(125.0445479 - 1934.1362608 * T + 0.0020754 * T**2 + 0.0000022 * T**3);
}

// Returns ecliptic longitudes for all 13 HD planets at a given JD
export function getPlanetGateLongitudes(jd: number): { name: string; lon: number }[] {
  const T = (jd - 2451545.0) / 36525;
  const earthHelio = heliocentric('Earth', T);
  const sunLon = getSunLongitudeJD(jd);
  const northNode = getMeanNorthNodeLon(jd);
  const result = [
    { name: 'Sun', lon: sunLon },
    { name: 'Earth', lon: norm(sunLon + 180) },
    { name: 'Moon', lon: getMoonLongitudeJD(jd) },
    { name: 'NorthNode', lon: northNode },
    { name: 'SouthNode', lon: norm(northNode + 180) },
  ];
  for (const name of ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']) {
    const helio = heliocentric(name, T);
    result.push({ name, lon: toGeocentric(helio, earthHelio) });
  }
  return result;
}

export async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  // Primary: Photon (OSM-backed, CORS-friendly, no API key required)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(location)}&limit=1`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const f = data?.features?.[0];
      if (f) {
        // GeoJSON: coordinates are [lon, lat]
        return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
      }
    }
  } catch {}
  // Fallback: Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

export const PLANET_FUNCTIONS: Record<string, string> = {
  Sun: 'Identity & life force',
  Moon: 'Emotions & instincts',
  Mercury: 'Mind & communication',
  Venus: 'Love & values',
  Mars: 'Drive & desire',
  Jupiter: 'Growth & expansion',
  Saturn: 'Structure & discipline',
  Uranus: 'Revolution & awakening',
  Neptune: 'Dreams & dissolution',
  Pluto: 'Transformation & power',
};

export const PLANET_IN_SIGN: Record<string, Partial<Record<string, string>>> = {
  Moon: {
    Aries:       'You feel fast and need to act on it immediately. Emotions are loud and leave as quickly as they arrive.',
    Taurus:      'You need comfort, beauty, and constancy to feel safe. Your body tells the emotional truth before your mind does.',
    Gemini:      'You process feelings by talking through them. You need mental stimulation to feel emotionally alive.',
    Cancer:      'Your emotional depth is oceanic. Memory is how you love — you hold everyone who ever mattered, and they hold you back.',
    Leo:         'You need to be seen in your feeling. Recognition isn\'t vanity — it\'s oxygen.',
    Virgo:       'You process emotion through analysis and service. You feel better when something is fixed.',
    Libra:       'You feel best in harmony. Conflict doesn\'t just upset you — it lives in your body until it\'s resolved.',
    Scorpio:     'You feel at oceanic depths. You don\'t do surface emotions — everything has weight and history.',
    Sagittarius: 'You need freedom to feel — to move, explore, and believe in something larger than the moment.',
    Capricorn:   'You feel most secure through achievement and structure. Your stoicism isn\'t coldness; it\'s a container.',
    Aquarius:    'You feel things intellectually first. You need space between your emotions and your identity.',
    Pisces:      'You absorb what\'s around you without trying. Your empathy is a gift that requires careful tending.',
  },
  Mercury: {
    Aries:       'Fast, direct, sometimes blunt. You think in sparks and speak before the sentence finishes itself.',
    Taurus:      'Deliberate and thorough. Your mind needs to feel secure before it commits to an idea.',
    Gemini:      'Rapid-fire, curious, endlessly associating. You think in networks, not lines.',
    Cancer:      'You think through feeling. Your intuition is a form of intelligence that logic only confirms later.',
    Leo:         'Expressive, dramatic, storytelling. Your mind wants to be heard — and it usually deserves to be.',
    Virgo:       'Analytical, precise, discerning. You notice what everyone else walks past.',
    Libra:       'You weigh everything before speaking. Your mind is a scales — and it hates tipping too fast.',
    Scorpio:     'You see through things. Your mind goes directly to what\'s underneath, and it rarely misses.',
    Sagittarius: 'Big ideas, philosophical leaps, direct to the point. You hate hedging.',
    Capricorn:   'Strategic, practical, structured. Your thinking builds toward something concrete.',
    Aquarius:    'Unconventional, future-facing, original. You think what no one else thought to think.',
    Pisces:      'Fluid, associative, imaginative. Your mind works in impressions and images, not outlines.',
  },
  Venus: {
    Aries:       'You fall fast, love boldly, and need a partner who can keep up. You pursue.',
    Taurus:      'You love through sensory experience — touch, taste, presence. You are devoted once you\'re in.',
    Gemini:      'You fall in love with a mind. Conversation is foreplay. Curiosity keeps you.',
    Cancer:      'You love by nurturing. Your care is the thing — and you need to receive as much as you give.',
    Leo:         'You love generously and dramatically. You need to be adored, and you will adore back magnificently.',
    Virgo:       'Your love language is acts of service — the details no one asked you to notice but you always do.',
    Libra:       'You are the romance archetype. Beauty, fairness, and partnership are how you love and what you need.',
    Scorpio:     'You love with total intensity or not at all. Halfway isn\'t in your vocabulary.',
    Sagittarius: 'You love freedom and adventure in a partner. The relationship has to feel like expansion.',
    Capricorn:   'You value commitment, loyalty, and building something real. Love must pass the long-term test.',
    Aquarius:    'You love what\'s different. You need a partner who is also, genuinely, a friend.',
    Pisces:      'You love without borders — sometimes without enough self-protection. Your devotion is total.',
  },
  Mars: {
    Aries:       'Fast, direct, unstoppable when lit. You act before the plan is done — and often that\'s the right call.',
    Taurus:      'Slow to start, impossible to stop once moving. Your power is in persistence.',
    Gemini:      'You pursue multiple things simultaneously and thrive in it. Your energy is nervous, quick, and scattered in the best way.',
    Cancer:      'You fight for home, family, and the people you protect. Your drive is emotional and fierce.',
    Leo:         'You pursue glory, recognition, and creative expression. Your ambition is bold and personal.',
    Virgo:       'You work harder than almost anyone. Your ambition is precise and your output is exceptional.',
    Libra:       'You move diplomatically but don\'t mistake that for softness. You\'re strategic, not passive.',
    Scorpio:     'Your drive is intense and relentless. You don\'t stop until it\'s done — or transformed.',
    Sagittarius: 'You act on conviction. Big movements, philosophical goals, and freedom from constraint.',
    Capricorn:   'Disciplined, strategic, and built for the long game. Your ambition is a mountain you were born to climb.',
    Aquarius:    'You fight for collective vision — ideas, causes, the future. Personal ambition bores you.',
    Pisces:      'Your drive is sensitive and responsive. You move through inspiration, not force.',
  },
  Jupiter: {
    Aries:       'You expand through bold, pioneering moves. Growth comes fast when you trust your instinct to go first.',
    Taurus:      'Abundance through patience and material mastery. You grow steadily and build to last.',
    Gemini:      'Expansion through ideas, communication, and connection. Your mind is your fortune.',
    Cancer:      'Growth through emotional depth and nurturing. Home and family are your source of abundance.',
    Leo:         'You expand through creative expression and leadership. Visibility is luck for you.',
    Virgo:       'Growth through service and refinement. The details you master become the system that scales.',
    Libra:       'Abundance through partnership and justice. You grow best alongside others.',
    Scorpio:     'Deep, transformational growth. You expand by going into what others avoid.',
    Sagittarius: 'Jupiter in its home sign — the most expansive placement. Philosophy, travel, truth are your growth paths.',
    Capricorn:   'Growth through discipline and long-term ambition. Every sacrifice compounds.',
    Aquarius:    'Expansion through innovation, community, and collective vision.',
    Pisces:      'Growth through spiritual depth, compassion, and surrender to something larger than yourself.',
  },
  Saturn: {
    Aries:       'Your lessons are in action and self-assertion. Learning to trust your own initiative takes time but becomes your greatest strength.',
    Taurus:      'Material and financial discipline is your path. Security is earned slowly — and it holds.',
    Gemini:      'Your mind is disciplined and serious. The challenge is learning to communicate without self-censoring.',
    Cancer:      'Emotional structure is your work. Learning to be vulnerable without losing stability is the task of a lifetime.',
    Leo:         'You\'re learning that recognition must come from within first. Creativity built on internal authority lasts.',
    Virgo:       'You are precise, self-critical, and devoted to improvement. The lesson is knowing when good enough is great.',
    Libra:       'Saturn is exalted here. Your lessons around fairness, partnership, and justice become your greatest gifts.',
    Scorpio:     'Deep, transformational discipline. You learn power, control, and letting go on the most profound level.',
    Sagittarius: 'Your lessons come through belief, philosophy, and truth. You learn to commit to a worldview that actually holds.',
    Capricorn:   'Saturn in its home sign — natural authority and mastery earned over time. You were built for this.',
    Aquarius:    'Saturn in its classical home — you build structures that serve the collective. Community is your responsibility.',
    Pisces:      'Your work is spiritual discipline and compassionate boundaries. The lesson: sacrifice is different from surrender.',
  },
};

export const OUTER_PLANET_IN_SIGN: Record<string, Partial<Record<string, string>>> = {
  Uranus: {
    Aries:       'Your generation rewrites individuality — breaks old identities to birth something genuinely new.',
    Taurus:      'Your generation revolutionizes material values, the body, and our relationship to earth and resource.',
    Gemini:      'Your generation transforms communication, media, and how information moves.',
    Cancer:      'Your generation reimagines home, family, and emotional belonging.',
    Leo:         'Your generation disrupts creative authority and redefines personal expression at scale.',
    Virgo:       'Your generation revolutionizes work, health systems, and the way we organize daily life.',
    Libra:       'Your generation breaks down old relationship structures and rebuilds justice.',
    Scorpio:     'Your generation transforms power, sexuality, and what remains hidden.',
    Sagittarius: 'Your generation disrupts belief systems, education, and the meaning of truth.',
    Capricorn:   'Your generation dismantles institutional authority and rebuilds structure from the ground up.',
    Aquarius:    'Uranus in its home sign — your generation is born to awaken collective consciousness.',
    Pisces:      'Your generation dissolves spiritual boundaries and expands collective imagination.',
  },
  Neptune: {
    Aries:       'Your generation redefines the spiritual warrior — inspired action without ego.',
    Taurus:      'Your generation dissolves materialism and reconnects with earth as sacred.',
    Gemini:      'Your generation expands consciousness through story, media, and the written word.',
    Cancer:      'Your generation is the psychic mirror of collective emotional wounds — and healing.',
    Leo:         'Your generation spiritualizes art, drama, and self-expression.',
    Virgo:       'Your generation dissolves the boundary between service and spirituality.',
    Libra:       'Your generation idealized love and partnership — and is learning the difference between ideals and reality.',
    Scorpio:     'Your generation dissolved the taboo around death, sex, and power.',
    Sagittarius: 'Your generation expanded spiritual seeking — sometimes into illusion, sometimes into transcendence.',
    Capricorn:   'Your generation questions whether institutions can carry spiritual authority.',
    Aquarius:    'Your generation dissolves the boundary between individual and collective consciousness.',
    Pisces:      'Neptune in its home sign — your generation is the most porous and most psychic.',
  },
  Pluto: {
    Aries:       'Your generation transforms through raw power and pioneering will.',
    Taurus:      'Your generation transforms material civilization — resource, wealth, the earth itself.',
    Gemini:      'Your generation transforms communication, language, and the nature of mind.',
    Cancer:      'Your generation transforms family systems and the meaning of home.',
    Leo:         'Your generation transforms creative authority, leadership, and the nature of the self.',
    Virgo:       'Your generation transforms health, systems, and the ethics of work.',
    Libra:       'Your generation transforms relationship, justice, and the meaning of balance.',
    Scorpio:     'Pluto in its home sign — your generation transforms power, sexuality, and death itself.',
    Sagittarius: 'Your generation transforms belief systems, religion, and the meaning of truth.',
    Capricorn:   'Your generation is dismantling institutional power at every level.',
    Aquarius:    'Your generation transforms collective systems — technology, social structure, the nature of humanity.',
    Pisces:      'Your generation transforms spirituality, the unconscious, and the collective dream.',
  },
};
