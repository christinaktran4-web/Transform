function reduceToSingleDigit(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n; // master numbers
  if (n < 10) return n;
  return reduceToSingleDigit(
    String(n)
      .split('')
      .reduce((sum, d) => sum + parseInt(d), 0)
  );
}

export function calcLifePath(birthDate: string): number {
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceToSingleDigit(sum);
}

export function calcPersonalYear(birthDate: string, year: number): number {
  const [, month, day] = birthDate.split('-').map(Number);
  const sum =
    reduceToSingleDigit(month) +
    reduceToSingleDigit(day) +
    reduceToSingleDigit(year);
  return reduceToSingleDigit(sum);
}

export function calcPersonalMonth(birthDate: string, year: number, month: number): number {
  const py = calcPersonalYear(birthDate, year);
  return reduceToSingleDigit(py + reduceToSingleDigit(month));
}

export function calcPersonalDay(birthDate: string, year: number, month: number, day: number): number {
  const pm = calcPersonalMonth(birthDate, year, month);
  return reduceToSingleDigit(pm + reduceToSingleDigit(day));
}

export function calcDestiny(name: string): number {
  const pythagorean: Record<string, number> = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  };
  const sum = name
    .toLowerCase()
    .split('')
    .filter(c => /[a-z]/.test(c))
    .reduce((acc, c) => acc + (pythagorean[c] ?? 0), 0);
  return reduceToSingleDigit(sum);
}

export const PERSONAL_YEAR_MEANINGS: Record<number, { title: string; theme: string; description: string }> = {
  1: { title: 'New Beginnings', theme: 'Independence & Initiation', description: 'A fresh nine-year cycle begins. This year favors bold new starts, self-reliance, and stepping into leadership. Plant seeds now — what you begin here you will tend for years to come.' },
  2: { title: 'Patience & Partnership', theme: 'Cooperation & Sensitivity', description: 'A year of quiet growth and deepening relationships. Focus on collaboration, diplomacy, and trust. What you started last year needs time and gentle attention.' },
  3: { title: 'Expression & Joy', theme: 'Creativity & Communication', description: 'Life opens up. Express yourself freely through art, conversation, and social connection. This is a year to enjoy, celebrate, and let your voice be heard.' },
  4: { title: 'Work & Structure', theme: 'Foundation & Discipline', description: 'A year to build — systems, habits, and plans that serve the long term. Hard work now creates lasting results. Focus, organize, and commit to what truly matters.' },
  5: { title: 'Change & Freedom', theme: 'Adventure & Adaptability', description: 'Expect the unexpected. Opportunities arrive suddenly, and flexibility is your greatest asset. Embrace change, new experiences, and anything that expands your world.' },
  6: { title: 'Responsibility & Love', theme: 'Home, Family & Service', description: 'A year of nurturing — yourself, your relationships, and your community. Harmony and beauty are highlighted. Commitments deepen and domestic life takes center stage.' },
  7: { title: 'Reflection & Inner Work', theme: 'Spirituality & Analysis', description: 'A quiet, introspective year. Solitude is productive. Study, meditate, and go inward. The answers you seek come from within, not from the outer world.' },
  8: { title: 'Power & Achievement', theme: 'Ambition & Material Mastery', description: 'A year of harvest and recognition. Apply yourself fully to professional and financial goals. Authority and influence are available — step forward with confidence.' },
  9: { title: 'Completion & Release', theme: 'Endings & Universal Love', description: 'The cycle closes. Let go of what no longer serves — old patterns, relationships, and ways of being. Forgiveness is your guide into the new cycle ahead.' },
  11: { title: 'Spiritual Illumination', theme: 'Master Intuition & Awakening', description: 'A heightened year of spiritual awareness and intuitive clarity. You may inspire many simply by showing up authentically. Trust what you feel, not only what you can prove.' },
  22: { title: 'Manifesting Grand Vision', theme: 'Master Building', description: 'A rare year of immense potential. You have the capacity to build something that truly matters — tangible, lasting, and meaningful to the world.' },
};

export const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: 'The Leader — independent, pioneering, self-determined.',
  2: 'The Diplomat — cooperative, sensitive, peacemaker.',
  3: 'The Communicator — creative, expressive, joyful.',
  4: 'The Builder — disciplined, practical, dependable.',
  5: 'The Freedom Seeker — adventurous, adaptable, curious.',
  6: 'The Nurturer — responsible, loving, harmonious.',
  7: 'The Seeker — analytical, spiritual, introspective.',
  8: 'The Achiever — ambitious, authoritative, material mastery.',
  9: 'The Humanitarian — compassionate, idealistic, wise.',
  11: 'Master Intuitive — highly sensitive, visionary, inspirational.',
  22: 'Master Builder — capable of manifesting grand visions.',
  33: 'Master Teacher — devoted to uplifting humanity.',
};
