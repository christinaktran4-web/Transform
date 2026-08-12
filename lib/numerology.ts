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

export const LIFE_PATH_DEEP: Record<number, { gifts: string[]; shadow: string; mantra: string; deepDive: string }> = {
  1: {
    gifts: ['Self-reliance', 'Vision', 'Courage to pioneer'],
    shadow: 'Isolation — confusing independence with invulnerability.',
    mantra: 'I lead by embodying what I believe.',
    deepDive: "Here's your secret: you were not meant to need anyone — but the Life Path 1 who truly arrives is the one who chose connection anyway. Your independence isn't aloneness. It's sovereignty. The difference is everything.",
  },
  2: {
    gifts: ['Deep empathy', 'Diplomatic grace', 'Ability to hold space'],
    shadow: "Losing yourself in others' needs — the helper who never receives.",
    mantra: 'My sensitivity is strength, not softness.',
    deepDive: "You feel everything — and you've probably spent years apologizing for it. Stop. Life Path 2 carries the gift of true attunement: you sense what's unsaid, what's needed before it's asked. The work isn't to feel less. It's to trust your own needs as much as you trust everyone else's.",
  },
  3: {
    gifts: ['Infectious joy', 'Creative fluency', 'The ability to uplift simply by being'],
    shadow: 'Scattering — so many channels, none quite filled.',
    mantra: 'I create; therefore I am.',
    deepDive: "You were made to be expressed, not edited. Life Path 3s often dim themselves — too bright, too much, too loud. The secret is that the world doesn't need a quieter version of you. It needs the full transmission.",
  },
  4: {
    gifts: ['Structural genius', 'Reliability others build their lives around', 'The discipline to finish'],
    shadow: 'Rigidity — the blueprint becomes a cage.',
    mantra: 'I build what lasts because I am what lasts.',
    deepDive: "You are the foundation people stand on without realizing it. Life Path 4 carries a quiet, profound power: the ability to take a dream and turn it into something real. Your shadow is treating every part of life like a blueprint. Some things are meant to stay beautifully unfinished.",
  },
  5: {
    gifts: ['Magnetic adaptability', 'Experience as teacher', 'Freedom as philosophy'],
    shadow: 'Running — motion without direction. Change as avoidance.',
    mantra: 'I am free in all directions, including still.',
    deepDive: "You have lived more in one decade than most people do in three — because you're paying attention. Life Path 5's secret: you don't fear commitment. You fear the wrong commitment. The adventure doesn't end when you settle. Sometimes the wildest thing you can do is stay.",
  },
  6: {
    gifts: ['Unconditional heart', 'Vision for what community could be', 'The ability to make any space home'],
    shadow: 'Martyrdom — giving until resentment forms where love used to be.',
    mantra: 'I love without losing myself.',
    deepDive: "You have probably given more than people know — and quietly kept score in a way even you don't quite admit. Life Path 6 is here to learn that love isn't sacrifice. The real gift is teaching people what love looks like when it includes you.",
  },
  7: {
    gifts: ['Rare depth of insight', 'Ability to see what others overlook', 'Fierce intellectual honesty'],
    shadow: "Cynicism masquerading as discernment. The seeker who won't be found.",
    mantra: 'The deeper I go, the more I trust.',
    deepDive: "You have been asking the questions other people forgot to ask. Life Path 7 is the seeker who finds — but only if they're willing to be found, too. The solitude is real. And so is the longing for someone to match your depth. That longing is not weakness. It's the other half of your gift.",
  },
  8: {
    gifts: ['Natural authority', 'Capacity to create lasting material change', 'The courage to go big'],
    shadow: 'Confusing power over others with power from within.',
    mantra: 'I build power that lifts, not just that rises.',
    deepDive: "You did not come here to be small. Life Path 8 understands that the material world is not separate from the spiritual — money, influence, and structure are just energy in form. Your shadow is letting success become armor. The real win is when your power makes others braver.",
  },
  9: {
    gifts: ['Boundless compassion', 'Wisdom distilled from everything', 'The ability to release with grace'],
    shadow: 'Resentment at having to let go, again and again.',
    mantra: 'What I release returns as wisdom.',
    deepDive: "You have been here before — metaphorically, maybe literally. Life Path 9 carries the fullness of all the other paths, which means you feel everything at depth. Your secret: the completion you feel is not an ending. Every time you let go of something, you're not losing — you're graduating.",
  },
  11: {
    gifts: ['Prophetic intuition', 'The ability to transmit truth through presence alone', 'Rare emotional intelligence'],
    shadow: 'Nervous sensitivity — the antenna picks up everything, including noise.',
    mantra: 'I am the channel, not the static.',
    deepDive: "Eleven is not a number. It's a voltage. Life Path 11s feel the world at a frequency that can be overwhelming — because you were built to receive signals others can't detect. Your secret: the sensitivity that exhausts you is the same one that heals people when you walk into a room. Ground first. Then transmit.",
  },
  22: {
    gifts: ['The vision to see the impossible', 'The structure to actually build it', 'Generational impact'],
    shadow: 'Paralysis — so aware of the scale that nothing starts.',
    mantra: 'I build what the future will thank me for.',
    deepDive: "You were given the rarest combination: the dreamer's vision and the builder's hands. Life Path 22 doesn't just imagine transformation — it architects it. The shadow is that the vision is so large it can feel unworthy of starting. Begin anyway. The blueprint completes itself in the doing.",
  },
  33: {
    gifts: ['Unconditional love as lived practice', 'The teacher who transforms simply by being', 'Rare spiritual authority'],
    shadow: "Savior complex — taking on others' karma as your own.",
    mantra: 'I teach by being fully myself.',
    deepDive: "Life Path 33 is the rarest — and carries the heaviest gift. You are here not to rescue but to illuminate. The rescuer takes the weight. The illuminator shows people how to carry their own. Your secret: healing others begins with your willingness to be wholly, unapologetically healed yourself.",
  },
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
