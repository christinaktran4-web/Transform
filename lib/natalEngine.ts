/**
 * Natal chart calculation engine.
 *
 * Single source of truth for all astrological positions. Uses:
 * - Keplerian orbital mechanics (Meeus-style) for Sun–Pluto
 * - Meeus 10-term series for the Moon
 * - Meeus 4-term polynomial for the Mean North Node
 * - Keplerian elements for Chiron
 * - Placidus house system via iterative algorithm
 * - Retrograde detection by comparing longitude at T and T+1h
 * - Six classical aspects with standard orbs
 */

import { resolveUTCOffset } from './timezone';
import type { NatalChart, PlanetData, HouseCusp, Aspect, AspectType, ZodiacSign } from './chartTypes';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const sinD = (d: number) => Math.sin(d * DEG);
const cosD = (d: number) => Math.cos(d * DEG);
const tanD = (d: number) => Math.tan(d * DEG);
const atanD = (x: number) => Math.atan(x) / DEG;
const atan2D = (y: number, x: number) => Math.atan2(y, x) / DEG;
const asinD = (x: number) => Math.asin(x) / DEG;
const acosD = (x: number) => Math.acos(x) / DEG;
const norm = (d: number) => ((d % 360) + 360) % 360;

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
export const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const PLANET_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','NorthNode','Chiron'];

// ---------------------------------------------------------------------------
// Julian Day
// ---------------------------------------------------------------------------

export function jdFromUTC(year: number, month: number, day: number, hour = 12, minute = 0): number {
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

// ---------------------------------------------------------------------------
// Ecliptic obliquity (degrees)
// ---------------------------------------------------------------------------

function obliquity(T: number): number {
  return 23.439291 - 0.013004 * T - 0.000000164 * T ** 2 + 0.000000504 * T ** 3;
}

// ---------------------------------------------------------------------------
// Mean orbital elements at J2000.0
// [L0, L1/cy, a_AU, e0, e1/cy, w0 perihelion_lon, w1/cy]
// ---------------------------------------------------------------------------

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

function heliocentric(name: string, T: number): { lon: number; r: number } {
  const [L0, L1, a, e0, e1, w0, w1] = ELEMENTS[name];
  const L = norm(L0 + L1 * T);
  const e = e0 + e1 * T;
  const w = norm(w0 + w1 * T);
  const M = norm(L - w);
  const C = (2 * e - e ** 3 / 4) * sinD(M) + (5 / 4) * e ** 2 * sinD(2 * M) + (13 / 12) * e ** 3 * sinD(3 * M);
  const nu = norm(M + C);
  const lon = norm(nu + w);
  const r = a * (1 - e ** 2) / (1 + e * cosD(nu));
  return { lon, r };
}

function geocentric(planet: { lon: number; r: number }, earth: { lon: number; r: number }): number {
  const dx = planet.r * cosD(planet.lon) - earth.r * cosD(earth.lon);
  const dy = planet.r * sinD(planet.lon) - earth.r * sinD(earth.lon);
  return norm(atan2D(dy, dx));
}

// ---------------------------------------------------------------------------
// Sun (Meeus 3-term)
// ---------------------------------------------------------------------------

function sunLon(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = 357.52911 + 35999.05029 * T;
  const Mr = norm(M) * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(Mr)
    + 0.019993 * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  return norm(L0 + C);
}

// ---------------------------------------------------------------------------
// Moon (Meeus 10-term)
// ---------------------------------------------------------------------------

function moonLon(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = (218.3164477 + 481267.88123421 * T) % 360;
  const M  = (134.9633964 + 477198.8675055  * T) % 360;
  const D  = (297.8501921 + 445267.1114034  * T) % 360;
  const Ms = (357.5291092 + 35999.0502909   * T) % 360;
  const F  = (93.2720950  + 483202.0175233  * T) % 360;
  const r = DEG;
  const corr =
    6.288774  * Math.sin(M         * r) +
    1.274027  * Math.sin((2*D - M) * r) +
    0.658314  * Math.sin(2*D       * r) +
    0.213618  * Math.sin(2*M       * r) +
   -0.185116  * Math.sin(Ms        * r) +
   -0.114332  * Math.sin(2*F       * r) +
    0.058793  * Math.sin((2*D - 2*M)    * r) +
    0.057066  * Math.sin((2*D - Ms - M) * r) +
    0.053322  * Math.sin((2*D + M)      * r) +
    0.045758  * Math.sin((2*D - Ms)     * r);
  return ((L0 + corr) % 360 + 360) % 360;
}

// ---------------------------------------------------------------------------
// Mean North Node (Meeus 4-term)
// ---------------------------------------------------------------------------

function northNodeLon(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm(125.0445479 - 1934.1362608 * T + 0.0020754 * T ** 2 + 0.0000022 * T ** 3);
}

// ---------------------------------------------------------------------------
// Chiron (Keplerian orbital elements, approx perihelion Feb 1996)
// Period ~50.7 years
// ---------------------------------------------------------------------------

function chironLon(T: number, earth: { lon: number; r: number }): number {
  const a = 13.70;           // semi-major axis AU
  const e = 0.3783;          // eccentricity
  const w = 339.14;          // argument of perihelion (deg)
  const N = 209.1;           // longitude of ascending node (deg)
  const incl = 6.93;         // inclination (deg)
  const Tp = 2450083.5;      // JDE of perihelion (Feb 14, 1996)
  const jd = 2451545.0 + T * 36525;
  // Mean motion: n = 360 / (period_years * 365.25)  (deg/day)
  const n = 360 / (50.7 * 365.25);
  const M = norm(n * (jd - Tp));
  const C = (2 * e - e ** 3 / 4) * sinD(M) + (5 / 4) * e ** 2 * sinD(2 * M);
  const nu = norm(M + C);
  // Longitude in orbit plane
  const lon_orbit = norm(nu + w);
  // Project to ecliptic (full 3D)
  const xh = a * (1 - e ** 2) / (1 + e * cosD(nu)) * (
    cosD(N) * cosD(lon_orbit) - sinD(N) * sinD(lon_orbit) * cosD(incl)
  );
  const yh = a * (1 - e ** 2) / (1 + e * cosD(nu)) * (
    sinD(N) * cosD(lon_orbit) + cosD(N) * sinD(lon_orbit) * cosD(incl)
  );
  const rh = Math.sqrt(xh ** 2 + yh ** 2);
  const lonH = norm(atan2D(yh, xh));
  return geocentric({ lon: lonH, r: rh }, earth);
}

// ---------------------------------------------------------------------------
// GMST and RAMC
// ---------------------------------------------------------------------------

function gmst(jd: number, T: number): number {
  return norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T ** 2);
}

function ramc(jd: number, geoLng: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm(gmst(jd, T) + geoLng);
}

// ---------------------------------------------------------------------------
// Ascendant and Midheaven
// ---------------------------------------------------------------------------

function computeMidheaven(ramc_deg: number, eps: number): number {
  return norm(atan2D(sinD(ramc_deg), cosD(ramc_deg) * cosD(eps)));
}

function computeAscendant(ramc_deg: number, geoLat: number, eps: number): number {
  return norm(atan2D(-cosD(ramc_deg), sinD(ramc_deg) * cosD(eps) + tanD(geoLat) * sinD(eps)));
}

// ---------------------------------------------------------------------------
// RA <-> ecliptic longitude conversion (tropical)
// ---------------------------------------------------------------------------

/** Ecliptic longitude → right ascension (degrees) */
function lonToRA(lon: number, eps: number): number {
  return norm(atan2D(sinD(lon) * cosD(eps), cosD(lon)));
}

/** Right ascension → ecliptic longitude (degrees) */
function raToLon(ra: number, eps: number): number {
  return norm(atan2D(sinD(ra) / cosD(eps), cosD(ra)));
}

/** Declination of an ecliptic longitude */
function lonToDecl(lon: number, eps: number): number {
  return asinD(sinD(eps) * sinD(lon));
}

// ---------------------------------------------------------------------------
// Placidus houses (iterative algorithm)
// ---------------------------------------------------------------------------

/**
 * Iteratively solve for the ecliptic longitude of a Placidus house cusp.
 *
 * For upper hemisphere cusps (11, 12):
 *   RA(λ) = RAMC + fraction × DSA(λ)
 *
 * For lower hemisphere cusps (2, 3):
 *   RA(λ) = RAMC + 180° + fraction × NSA(λ)   (fraction is negative for houses going toward ASC)
 */
function solvePlacidusCusp(
  ramc_deg: number,
  geoLat: number,
  eps: number,
  targetRAFromRAMC: (dsa: number) => number,   // returns target RA given DSA
  initialGuess: number,
): number {
  let lon = norm(initialGuess);
  for (let i = 0; i < 50; i++) {
    const decl = lonToDecl(lon, eps);
    const tPhi_tDecl = tanD(geoLat) * tanD(decl);
    // Handle circumpolar: clamp argument of arccos to [-1, 1]
    const arg = Math.max(-1, Math.min(1, -tPhi_tDecl));
    const dsa = acosD(arg);   // semidiurnal arc 0–180°
    const targetRA = norm(ramc_deg + targetRAFromRAMC(dsa));
    const newLon = raToLon(targetRA, eps);
    if (Math.abs(norm(newLon - lon + 180) - 180) < 0.0001) break;
    lon = newLon;
  }
  return lon;
}

function computePlacidusHouses(
  ramc_deg: number,
  geoLat: number,
  eps: number,
  asc: number,
  mc: number,
): HouseCusp[] {
  const cusps: number[] = new Array(12).fill(0);

  // Axes
  cusps[9]  = mc;                // House 10 (MC)
  cusps[3]  = norm(mc + 180);   // House 4 (IC)
  cusps[0]  = asc;              // House 1 (ASC)
  cusps[6]  = norm(asc + 180);  // House 7 (DSC)

  // House 11: 1/3 of DSA from MC toward ASC (going east of meridian)
  cusps[10] = solvePlacidusCusp(ramc_deg, geoLat, eps, dsa => dsa / 3, norm(ramc_deg + 30));
  // House 12: 2/3 of DSA from MC toward ASC
  cusps[11] = solvePlacidusCusp(ramc_deg, geoLat, eps, dsa => 2 * dsa / 3, norm(ramc_deg + 60));
  // House 5 = opposite of 11, House 6 = opposite of 12
  cusps[4] = norm(cusps[10] + 180);
  cusps[5] = norm(cusps[11] + 180);

  // House 2: 1/3 of NSA from IC toward ASC
  // RA(λ) = RAMC + 180° - NSA/3 = RAMC + 180° - (180° - DSA)/3
  cusps[1] = solvePlacidusCusp(ramc_deg, geoLat, eps, dsa => 180 - (180 - dsa) / 3, norm(ramc_deg + 120));
  // House 3: 2/3 of NSA from IC toward ASC
  cusps[2] = solvePlacidusCusp(ramc_deg, geoLat, eps, dsa => 180 - 2 * (180 - dsa) / 3, norm(ramc_deg + 150));
  // House 8 = opposite of 2, House 9 = opposite of 3
  cusps[7] = norm(cusps[1] + 180);
  cusps[8] = norm(cusps[2] + 180);

  return cusps.map((lon, i) => {
    const idx = Math.floor(norm(lon) / 30) % 12;
    return {
      house: i + 1,
      lon: norm(lon),
      sign: ZODIAC_SIGNS[idx],
      signSymbol: ZODIAC_SYMBOLS[idx],
      degree: Math.floor(norm(lon) % 30),
    } satisfies HouseCusp;
  });
}

// ---------------------------------------------------------------------------
// House placement: which house does a planet (by lon) fall in?
// ---------------------------------------------------------------------------

function houseOfLon(lon: number, cusps: HouseCusp[]): number {
  const cuspLons = cusps.map(c => c.lon);
  // Walk forward through cusps; a planet is in house N if lon >= cusp[N-1] and < cusp[N]
  // (with wrap-around handling)
  for (let i = 0; i < 12; i++) {
    const start = cuspLons[i];
    const end = cuspLons[(i + 1) % 12];
    const l = norm(lon - start);
    const span = norm(end - start);
    if (l < span) return i + 1;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Retrograde detection: compare lon at T and T+1h
// ---------------------------------------------------------------------------

function isRetrograde(name: string, jd: number, earth: { lon: number; r: number }): boolean {
  const jd1 = jd + 1 / 24;
  const T1 = (jd1 - 2451545.0) / 36525;
  const earth1 = heliocentric('Earth', T1);

  let lon0: number, lon1: number;
  if (name === 'Sun' || name === 'Moon' || name === 'NorthNode' || name === 'Chiron') return false;
  if (name === 'Sun') { lon0 = sunLon(jd); lon1 = sunLon(jd1); }
  else if (name === 'Moon') { lon0 = moonLon(jd); lon1 = moonLon(jd1); }
  else {
    const T0 = (jd - 2451545.0) / 36525;
    lon0 = geocentric(heliocentric(name, T0), earth);
    lon1 = geocentric(heliocentric(name, T1), earth1);
  }
  const delta = norm(lon1 - lon0 + 180) - 180; // signed difference
  return delta < 0;
}

// ---------------------------------------------------------------------------
// Aspect calculation
// ---------------------------------------------------------------------------

const ASPECT_DEFS: { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0,   orb: 8 },
  { type: 'sextile',     angle: 60,  orb: 6 },
  { type: 'square',      angle: 90,  orb: 8 },
  { type: 'trine',       angle: 120, orb: 8 },
  { type: 'opposition',  angle: 180, orb: 8 },
  { type: 'quincunx',    angle: 150, orb: 3 },
];

function computeAspects(planets: Record<string, PlanetData>): Aspect[] {
  const results: Aspect[] = [];
  const keys = Object.keys(planets);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const p1 = planets[keys[i]];
      const p2 = planets[keys[j]];
      const sep = Math.abs(norm(p2.lon - p1.lon + 180) - 180); // 0–180°
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb) {
          // Applying: p1 is moving toward p2 (consider retrograde)
          const dir1 = p1.retrograde ? -1 : 1;
          const gap = norm(p2.lon - p1.lon); // 0–360
          const applying = dir1 > 0 ? gap < 180 : gap > 180;
          results.push({
            planet1: p1.name,
            planet2: p2.name,
            type: def.type,
            exactAngle: def.angle,
            separation: sep,
            orb,
            applying,
          });
          break; // only strongest matching aspect per pair
        }
      }
    }
  }
  return results.sort((a, b) => a.orb - b.orb);
}

// ---------------------------------------------------------------------------
// Convert raw longitude to PlanetData degrees/minutes/seconds
// ---------------------------------------------------------------------------

function lonToPlanetData(
  name: string,
  lon: number,
  retrograde: boolean,
  house: number,
): PlanetData {
  const n = norm(lon);
  const idx = Math.floor(n / 30) % 12;
  const withinSign = n % 30;
  const degree = Math.floor(withinSign);
  const minuteFrac = (withinSign - degree) * 60;
  const minute = Math.floor(minuteFrac);
  const second = Math.floor((minuteFrac - minute) * 60);
  return {
    name,
    lon: n,
    sign: ZODIAC_SIGNS[idx],
    signSymbol: ZODIAC_SYMBOLS[idx],
    degree,
    minute,
    second,
    retrograde,
    house,
  };
}

// ---------------------------------------------------------------------------
// Main computation (synchronous, takes UTC birth time)
// ---------------------------------------------------------------------------

export function computeNatalChart(
  birthDate: string,
  utcHour: number,
  utcMinute: number,
  lat: number | null | undefined,
  lng: number | null | undefined,
  utcOffsetHours: number,
  hasTime: boolean,
): NatalChart {
  const [y, m, d] = birthDate.split('-').map(Number);
  const jd = jdFromUTC(y, m, d, utcHour, utcMinute);
  const T = (jd - 2451545.0) / 36525;
  const eps = obliquity(T);
  const earth = heliocentric('Earth', T);

  // Compute raw longitudes
  const rawLons: Record<string, number> = {
    Sun:      sunLon(jd),
    Moon:     moonLon(jd),
    Mercury:  geocentric(heliocentric('Mercury', T), earth),
    Venus:    geocentric(heliocentric('Venus',   T), earth),
    Mars:     geocentric(heliocentric('Mars',    T), earth),
    Jupiter:  geocentric(heliocentric('Jupiter', T), earth),
    Saturn:   geocentric(heliocentric('Saturn',  T), earth),
    Uranus:   geocentric(heliocentric('Uranus',  T), earth),
    Neptune:  geocentric(heliocentric('Neptune', T), earth),
    Pluto:    geocentric(heliocentric('Pluto',   T), earth),
    NorthNode: northNodeLon(jd),
    Chiron:   chironLon(T, earth),
  };

  // Retrograde flags (Sun, Moon, NorthNode never retrograde in this model)
  const retroFlags: Record<string, boolean> = {};
  for (const name of ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']) {
    retroFlags[name] = isRetrograde(name, jd, earth);
  }
  retroFlags['Sun'] = false;
  retroFlags['Moon'] = false;
  retroFlags['NorthNode'] = false;
  retroFlags['Chiron'] = false;

  const hasLocation = lat != null && lng != null;
  let asc = 0, mc = 0, ramc_deg = 0;
  let houses: HouseCusp[];

  if (hasLocation && hasTime) {
    ramc_deg = ramc(jd, lng!);
    mc = computeMidheaven(ramc_deg, eps);
    asc = computeAscendant(ramc_deg, lat!, eps);
    houses = computePlacidusHouses(ramc_deg, lat!, eps, asc, mc);
  } else {
    // Without time/location, place all planets in house 1
    houses = Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      lon: i * 30,
      sign: ZODIAC_SIGNS[i],
      signSymbol: ZODIAC_SYMBOLS[i],
      degree: 0,
    } satisfies HouseCusp));
  }

  const planets: Record<string, PlanetData> = {};
  for (const name of PLANET_ORDER) {
    const lon = rawLons[name] ?? 0;
    const house = (hasLocation && hasTime) ? houseOfLon(lon, houses) : 1;
    planets[name] = lonToPlanetData(name, lon, retroFlags[name] ?? false, house);
  }

  const aspects = computeAspects(planets);

  return {
    planets,
    ascendant: asc,
    midheaven: mc,
    houses,
    aspects,
    obliquity: eps,
    ramc: ramc_deg,
    jd,
    utcOffsetHours,
    houseSystem: 'Placidus',
    zodiacType: 'Tropical',
    hasTime,
    hasLocation,
    latitude: lat ?? null,
    longitude: lng ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public helper: longitude → PlanetData (for ASC, MC display in UI)
// ---------------------------------------------------------------------------

export function lonToSignData(lon: number, name: string, retrograde = false, house = 1): PlanetData {
  return lonToPlanetData(name, lon, retrograde, house);
}

// ---------------------------------------------------------------------------
// Async entry point: resolves timezone then calls synchronous engine
// ---------------------------------------------------------------------------

export async function buildNatalChart(
  birthDate: string,
  birthTime: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
): Promise<NatalChart> {
  const hasTime = !!(birthTime && birthTime.trim());
  let utcHour = 12, utcMinute = 0, utcOffsetHours = 0;

  if (hasTime) {
    const parts = birthTime!.trim().split(':').map(Number);
    const localHour = isNaN(parts[0]) ? 12 : parts[0];
    const localMin  = isNaN(parts[1]) ? 0  : parts[1];

    utcOffsetHours = await resolveUTCOffset(lat, lng, birthDate, birthTime!.trim());

    // Convert local time → UTC:  UTC = local - offset
    const localMinutesTotal = localHour * 60 + localMin;
    const utcMinutesTotal = localMinutesTotal - Math.round(utcOffsetHours * 60);
    // Normalize (birth date won't change more than ±13 hours)
    const normUTC = ((utcMinutesTotal % 1440) + 1440) % 1440;
    utcHour   = Math.floor(normUTC / 60);
    utcMinute = normUTC % 60;
  }

  return computeNatalChart(birthDate, utcHour, utcMinute, lat, lng, utcOffsetHours, hasTime);
}
