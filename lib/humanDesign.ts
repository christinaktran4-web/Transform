import { getSunLongitudeJD, julianDayFromDate } from './astrology';
import { getPlanetGateLongitudes } from './ephemeris';

const HD_GATE_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

function longitudeToGate(lon: number): { gate: number; line: number } {
  const offset = ((lon - 300) % 360 + 360) % 360;
  const gateIdx = Math.floor(offset / 5.625) % 64;
  const gate = HD_GATE_SEQUENCE[gateIdx];
  const line = Math.min(Math.floor((offset % 5.625) / 0.9375) + 1, 6);
  return { gate, line };
}

export function getHumanDesignGates(birthDate: string, birthTime?: string | null): {
  conscious: { gate: number; line: number };
  unconscious: { gate: number; line: number };
  profile: string;
  profileName: string;
} {
  const [y, m, d] = birthDate.split('-').map(Number);
  let hour = 12, minute = 0;
  if (birthTime) {
    const parts = birthTime.split(':').map(Number);
    if (parts.length === 2) { hour = parts[0]; minute = parts[1]; }
  }
  const jdConscious = julianDayFromDate(y, m, d, hour, minute);
  const jdUnconscious = jdConscious - 88.736;

  const conscious = longitudeToGate(getSunLongitudeJD(jdConscious));
  const unconscious = longitudeToGate(getSunLongitudeJD(jdUnconscious));
  const profileKey = `${conscious.line}/${unconscious.line}`;
  const profileName = PROFILE_NAMES[profileKey] ?? profileKey;
  return { conscious, unconscious, profile: profileKey, profileName };
}

export const PROFILE_NAMES: Record<string, string> = {
  '1/3': 'Investigator / Martyr',
  '1/4': 'Investigator / Opportunist',
  '2/4': 'Hermit / Opportunist',
  '2/5': 'Hermit / Heretic',
  '3/5': 'Martyr / Heretic',
  '3/6': 'Martyr / Role Model',
  '4/6': 'Opportunist / Role Model',
  '4/1': 'Opportunist / Investigator',
  '5/1': 'Heretic / Investigator',
  '5/2': 'Heretic / Hermit',
  '6/2': 'Role Model / Hermit',
  '6/3': 'Role Model / Martyr',
};

export const PROFILE_DESCRIPTIONS: Record<string, string> = {
  '1/3': 'You need a solid foundation of knowledge before you can move forward — and life teaches you through trial and error. The combination creates someone who researches deeply, then tests everything firsthand.',
  '1/4': 'You build your security through deep knowledge and share it through your network. What you know opens doors, and your relationships are the vehicle.',
  '2/4': "You have natural gifts you barely notice yourself — others see them before you do. Your network is your destiny; the right people bring out what's already there.",
  '2/5': "You're seen as a practical problem-solver, a savior of sorts — whether you want to be or not. The hermit who becomes a heretic when the world needs something real.",
  '3/5': "You learn by doing — and failing — and those hard-won lessons become the solutions others are desperately waiting for. Your life is an experiment that benefits everyone.",
  '3/6': "Your first 30 years are a beautiful wreckage of experiments. After that, you become the observer — and then the living example of what it means to get it right.",
  '4/6': "You are built to influence through relationship and embody the wisdom you've lived. Your life moves in three acts: experiment, witness, transmit.",
  '4/1': "You need a secure foundation and a solid network to thrive. When both are in place, your opportunities expand in ways that seem almost magical.",
  '5/1': "You're seen as the practical savior — someone who can solve problems others can't. The weight of that projection is real; the foundation you build in private is what saves you.",
  '5/2': "Natural gifts others see before you do, projected onto a screen of expectation. You need to be selective about which calls to answer.",
  '6/2': "You are here to be the living example — but only after you've lived enough to know what that means. The first half of life is research; the second half is transmission.",
  '6/3': "You become the role model — but through the unmistakable route of having done everything wrong first, and survived it with grace.",
};

export const HD_TYPES: Record<string, {
  strategy: string;
  signature: string;
  notSelf: string;
  aura: string;
  description: string;
  deepDive: string;
  population: string;
  icon: string;
}> = {
  Manifestor: {
    icon: '⚡',
    population: '~9%',
    aura: 'Closed & repelling',
    strategy: 'Inform before you act',
    signature: 'Peace',
    notSelf: 'Anger',
    description: 'You are here to initiate — to start things others haven\'t even imagined yet. You have a direct connection to creation.',
    deepDive: "You were built to move first and move fast. The Manifestor's superpower is that you can make things happen through sheer force of will — without waiting for permission, invitation, or consensus. The catch: you weren't made to work alone, and when you forget to inform the people in your wake, you create resistance that slows everything down. Your anger is information — it shows up when you're being controlled or stopped. When you inform, peace follows. Not because you asked. Because you set the terms.",
  },
  Generator: {
    icon: '🔥',
    population: '~37%',
    aura: 'Open & enveloping',
    strategy: 'Respond to what life brings',
    signature: 'Satisfaction',
    notSelf: 'Frustration',
    description: 'You have the most powerful and sustainable life force energy in Human Design. You are here to respond — and to find satisfaction in the work.',
    deepDive: "You were not built to initiate — you were built to respond, and when you do, your energy is magnetic and unstoppable. The frustration you've felt from chasing things that didn't light up your sacral center? That's not failure. That's data. The Generator who follows the gut response — that uh-huh, that full-body yes — finds that the right work doesn't deplete them. It fuels them. The secret: your satisfaction is contagious. When you're lit up, everything around you catches fire.",
  },
  'Manifesting Generator': {
    icon: '✨',
    population: '~33%',
    aura: 'Open & enveloping',
    strategy: 'Respond, then inform before acting',
    signature: 'Satisfaction & peace',
    notSelf: 'Frustration & anger',
    description: 'You are multi-passionate and built for speed. You skip steps others need, move in multiple directions at once, and do it sustainably.',
    deepDive: "You are the hybrid — the Generator's sustaining life force combined with the Manifestor's direct connection to initiation. The result: you move faster than anyone expects, in more directions than seems sane, and somehow make it all work. The 'mistake' MGs make is guilt about moving on before something is fully complete. Here's your permission slip: you're not flighty. You're efficient. Your energy is a radar for what's next. Skip the steps that don't matter. You'll circle back if you need to.",
  },
  Projector: {
    icon: '🔭',
    population: '~21%',
    aura: 'Focused & absorbing',
    strategy: 'Wait for the invitation',
    signature: 'Success',
    notSelf: 'Bitterness',
    description: 'You are a natural guide and systems-reader. You see what others miss. But your gifts are only received well when someone asks.',
    deepDive: "You were designed to understand others more deeply than they understand themselves. The Projector's burden is that this is only welcome when the other person has recognized your gift and asked. Unsolicited wisdom — however accurate — lands as intrusion. This is not about playing small. It's about timing. Wait for the invitation: to the relationship, the career, the conversation. When it comes, step fully in. Your bitterness is a signal that you've been giving your energy to people and places that haven't invited you in. Success is your signature — when the invitation is real.",
  },
  Reflector: {
    icon: '🌕',
    population: '~1%',
    aura: 'Resistant & sampling',
    strategy: 'Wait 28 days before major decisions',
    signature: 'Delight & surprise',
    notSelf: 'Disappointment',
    description: 'You are a mirror of the world around you, reflecting back the health of your environment. You are here to be surprised by life.',
    deepDive: "You are the rarest type — almost all of your centers are undefined, which means you're exquisitely sensitive to the energy around you. You literally become a different person depending on who you're with and where you are. This is not inconsistency. It's one of the most sophisticated forms of perception available to a human being. The key: your environment is everything. Surround yourself with people and places that feel good, because you become what you're near. Wait the full lunar cycle before making major decisions — not as a rule, but because the moon's full journey through your chart tells you something each position cannot. Delight is what you're here to experience.",
  },
};

export const INNER_AUTHORITY_DESCRIPTIONS: Record<string, { short: string; description: string }> = {
  Sacral: {
    short: 'Gut response — uh-huh or uh-uh',
    description: 'Your authority lives in your gut sounds — a literal sound or feeling that happens before your mind weighs in. Trust the body, not the thought.',
  },
  Emotional: {
    short: 'Ride the wave before deciding',
    description: 'You are designed to wait through your emotional wave before committing. There is no truth in the now — only in the fullness of time.',
  },
  Splenic: {
    short: 'In-the-moment instinct',
    description: 'Yours is the oldest, fastest authority — it speaks once, in the moment, and never repeats itself. Learn to trust what comes immediately.',
  },
  'Ego/Heart': {
    short: 'Willpower and what you want',
    description: "You make decisions from desire — what do you truly want? What are you willing to commit to? Your authority is your willpower.",
  },
  'Self-Projected': {
    short: 'Hear yourself talk it through',
    description: "Your authority comes from listening to yourself speak. Talk it through with trusted people — not to get their opinion, but to hear what you already know.",
  },
  Environmental: {
    short: 'Your environment tells you',
    description: 'You have no inner authority — your guidance comes from the people and places around you. Notice where you feel clear and where you feel foggy.',
  },
};

const GATE_CENTER: Record<number, string> = {
  64: 'Head', 61: 'Head', 63: 'Head',
  47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 17: 'Ajna', 43: 'Ajna', 11: 'Ajna',
  62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat',
  45: 'Throat', 33: 'Throat', 8: 'Throat', 31: 'Throat', 20: 'Throat', 16: 'Throat',
  1: 'G', 13: 'G', 25: 'G', 46: 'G', 2: 'G', 15: 'G', 10: 'G', 7: 'G',
  21: 'Will', 26: 'Will', 51: 'Will', 40: 'Will',
  34: 'Sacral', 5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 59: 'Sacral',
  9: 'Sacral', 3: 'Sacral', 42: 'Sacral', 27: 'Sacral',
  6: 'SolarPlexus', 37: 'SolarPlexus', 22: 'SolarPlexus', 36: 'SolarPlexus',
  30: 'SolarPlexus', 55: 'SolarPlexus', 49: 'SolarPlexus',
  58: 'Root', 38: 'Root', 54: 'Root', 53: 'Root', 60: 'Root',
  52: 'Root', 19: 'Root', 39: 'Root', 41: 'Root',
  48: 'Spleen', 57: 'Spleen', 44: 'Spleen', 50: 'Spleen',
  32: 'Spleen', 28: 'Spleen', 18: 'Spleen',
};

const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
  [10, 20], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48], [17, 62],
  [18, 58], [19, 49], [20, 34], [21, 45], [25, 51], [26, 44], [27, 50],
  [28, 38], [29, 46], [30, 41], [32, 54], [34, 57], [35, 36], [37, 40],
  [39, 55], [42, 53], [43, 23], [47, 64], [61, 24],
];

function determineHDType(activatedGates: Set<number>): string {
  const definedChannels = CHANNELS.filter(([a, b]) => activatedGates.has(a) && activatedGates.has(b));
  const definedCenters = new Set<string>();
  for (const [a, b] of definedChannels) {
    definedCenters.add(GATE_CENTER[a]);
    definedCenters.add(GATE_CENTER[b]);
  }
  if (definedCenters.size === 0) return 'Reflector';

  const graph = new Map<string, Set<string>>();
  for (const [a, b] of definedChannels) {
    const ca = GATE_CENTER[a], cb = GATE_CENTER[b];
    if (!graph.has(ca)) graph.set(ca, new Set());
    if (!graph.has(cb)) graph.set(cb, new Set());
    graph.get(ca)!.add(cb);
    graph.get(cb)!.add(ca);
  }
  function component(start: string): Set<string> {
    const visited = new Set<string>();
    const q = [start];
    while (q.length) {
      const n = q.shift()!;
      if (visited.has(n)) continue;
      visited.add(n);
      graph.get(n)?.forEach(x => q.push(x));
    }
    return visited;
  }
  if (definedCenters.has('Sacral')) {
    return component('Sacral').has('Throat') ? 'Manifesting Generator' : 'Generator';
  }
  for (const motor of ['Will', 'SolarPlexus', 'Root']) {
    if (definedCenters.has(motor) && component(motor).has('Throat')) return 'Manifestor';
  }
  return 'Projector';
}

export function getFullHumanDesign(birthDate: string, birthTime?: string | null, utcOffsetHours = 0): {
  type: string;
  profile: string;
  profileName: string;
  consciousSunGate: { gate: number; line: number };
  unconsciousSunGate: { gate: number; line: number };
  definedCenters: string[];
} {
  const [y, m, d] = birthDate.split('-').map(Number);
  let hour = 12, minute = 0;
  if (birthTime) {
    const parts = birthTime.split(':').map(Number);
    if (parts.length === 2) { hour = parts[0]; minute = parts[1]; }
  }
  // Convert local birth time to UTC before computing JD
  const jdLocal = julianDayFromDate(y, m, d, hour, minute);
  const jdConscious = jdLocal - utcOffsetHours / 24;
  const jdUnconscious = jdConscious - 88.736;
  const consciousLons = getPlanetGateLongitudes(jdConscious);
  const unconsciousLons = getPlanetGateLongitudes(jdUnconscious);
  const allGates = new Set<number>();
  for (const { lon } of [...consciousLons, ...unconsciousLons]) {
    allGates.add(longitudeToGate(lon).gate);
  }
  const type = determineHDType(allGates);
  const csLon = consciousLons.find(p => p.name === 'Sun')!.lon;
  const usLon = unconsciousLons.find(p => p.name === 'Sun')!.lon;
  const consciousSunGate = longitudeToGate(csLon);
  const unconsciousSunGate = longitudeToGate(usLon);
  const profile = `${consciousSunGate.line}/${unconsciousSunGate.line}`;
  const definedChannels = CHANNELS.filter(([a, b]) => allGates.has(a) && allGates.has(b));
  const definedCentersSet = new Set<string>();
  for (const [a, b] of definedChannels) {
    definedCentersSet.add(GATE_CENTER[a]);
    definedCentersSet.add(GATE_CENTER[b]);
  }
  return {
    type,
    profile,
    profileName: PROFILE_NAMES[profile] ?? profile,
    consciousSunGate,
    unconsciousSunGate,
    definedCenters: Array.from(definedCentersSet),
  };
}

export const GATE_THEMES: Record<number, string> = {
  1: 'Self-Expression', 2: 'Receptivity', 3: 'Ordering', 4: 'Formulization',
  5: 'Fixed Rhythms', 6: 'Friction', 7: 'The Role of the Self', 8: 'Contribution',
  9: 'Focus', 10: 'Behavior of the Self', 11: 'Ideas', 12: 'Caution',
  13: 'The Listener', 14: 'Power Skills', 15: 'Extremes', 16: 'Skills',
  17: 'Opinions', 18: 'Correction', 19: 'Wanting', 20: 'The Now',
  21: 'The Hunter', 22: 'Openness', 23: 'Assimilation', 24: 'Rationalization',
  25: 'Innocence', 26: 'The Egoist', 27: 'Caring', 28: 'The Game Player',
  29: 'Saying Yes', 30: 'Feelings', 31: 'Influence', 32: 'Continuity',
  33: 'Privacy', 34: 'Power', 35: 'Change', 36: 'Crisis',
  37: 'Friendship', 38: 'The Fighter', 39: 'Provocation', 40: 'Aloneness',
  41: 'Contraction', 42: 'Growth', 43: 'Breakthrough', 44: 'Alertness',
  45: 'The Gatherer', 46: 'Serendipity', 47: 'Realization', 48: 'Depth',
  49: 'Revolution', 50: 'Values', 51: 'Shock', 52: 'Stillness',
  53: 'Beginnings', 54: 'Ambition', 55: 'Spirit', 56: 'Stimulation',
  57: 'Intuitive Clarity', 58: 'Vitality', 59: 'Sexuality', 60: 'Acceptance',
  61: 'Mystery', 62: 'Detail', 63: 'Doubt', 64: 'Confusion',
};
