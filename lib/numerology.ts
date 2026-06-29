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
