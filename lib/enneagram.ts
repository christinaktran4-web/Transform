export interface EnneagramType {
  name: string;
  alias: string;
  coreFear: string;
  coreDesire: string;
  description: string;
  strengths: string[];
  atBest: string;
  underStress: string;
  wing1: number;
  wing2: number;
}

export const ENNEAGRAM_TYPES: Record<number, EnneagramType> = {
  1: {
    name: 'The Reformer',
    alias: 'The Perfectionist',
    coreFear: 'Being corrupt, defective, or wrong',
    coreDesire: 'To be good, virtuous, and right',
    description: 'Principled, purposeful, and self-controlled. Ones hold themselves and others to high standards, driven by a deep inner critic and a genuine desire to improve the world.',
    strengths: ['Integrity', 'Discernment', 'Diligence'],
    atBest: 'Wise, noble, discerning, and profoundly principled',
    underStress: 'Critical, rigid, judgmental of self and others',
    wing1: 9,
    wing2: 2,
  },
  2: {
    name: 'The Helper',
    alias: 'The Giver',
    coreFear: 'Being unloved or unwanted',
    coreDesire: 'To feel loved and needed',
    description: 'Caring, interpersonal, and generous. Twos put the needs of others first, cultivating deep connections — sometimes at the cost of their own unspoken needs.',
    strengths: ['Empathy', 'Warmth', 'Generosity'],
    atBest: 'Unconditionally loving, nurturing, and deeply supportive',
    underStress: 'Possessive, people-pleasing, and quietly resentful',
    wing1: 1,
    wing2: 3,
  },
  3: {
    name: 'The Achiever',
    alias: 'The Performer',
    coreFear: 'Being worthless or without value',
    coreDesire: 'To feel valuable and admired',
    description: 'Adaptive, success-oriented, and image-conscious. Threes are driven to excel and shape themselves to what success looks like in their environment.',
    strengths: ['Ambition', 'Charisma', 'Efficiency'],
    atBest: 'Authentic, inspiring, a true role model for others',
    underStress: 'Competitive, image-driven, prone to deception',
    wing1: 2,
    wing2: 4,
  },
  4: {
    name: 'The Individualist',
    alias: 'The Romantic',
    coreFear: 'Having no identity or personal significance',
    coreDesire: 'To find themselves and their unique identity',
    description: 'Expressive, dramatic, and self-aware. Fours live deeply in their inner world, seeking authenticity and beauty while mourning what feels perpetually out of reach.',
    strengths: ['Depth', 'Creativity', 'Emotional honesty'],
    atBest: 'Profoundly creative, introspective, and compassionate',
    underStress: 'Withdrawn, melancholic, envious of others',
    wing1: 3,
    wing2: 5,
  },
  5: {
    name: 'The Investigator',
    alias: 'The Observer',
    coreFear: 'Being overwhelmed or incompetent',
    coreDesire: 'To be capable, competent, and knowledgeable',
    description: 'Perceptive, innovative, and private. Fives gather information and conserve energy, preferring the inner world of ideas to the demands of other people.',
    strengths: ['Insight', 'Focus', 'Independent thinking'],
    atBest: 'Visionary, open-hearted, and pioneering in thought',
    underStress: 'Detached, isolated, cynical',
    wing1: 4,
    wing2: 6,
  },
  6: {
    name: 'The Loyalist',
    alias: 'The Skeptic',
    coreFear: 'Being without support or guidance',
    coreDesire: 'To have security and feel supported',
    description: 'Committed, responsible, and anxious. Sixes are loyal to people and systems they trust, always scanning for what could go wrong — often their own fiercest advocates.',
    strengths: ['Loyalty', 'Responsibility', 'Courage'],
    atBest: 'Courageous, self-reliant, and deeply trustworthy',
    underStress: 'Anxious, suspicious, and reactively defensive',
    wing1: 5,
    wing2: 7,
  },
  7: {
    name: 'The Enthusiast',
    alias: 'The Epicure',
    coreFear: 'Being deprived or trapped in pain',
    coreDesire: 'To be satisfied, content, and fulfilled',
    description: 'Spontaneous, fun-loving, and versatile. Sevens keep their options open, chasing pleasure and stimulation to avoid deeper pain or limitation.',
    strengths: ['Enthusiasm', 'Optimism', 'Versatility'],
    atBest: 'Grateful, focused, joyful, and deeply present',
    underStress: 'Scattered, impulsive, escapist',
    wing1: 6,
    wing2: 8,
  },
  8: {
    name: 'The Challenger',
    alias: 'The Protector',
    coreFear: 'Being controlled or harmed by others',
    coreDesire: 'To protect themselves and be self-reliant',
    description: 'Powerful, decisive, and confrontational. Eights assert themselves boldly, protect those they love fiercely, and refuse to show vulnerability.',
    strengths: ['Confidence', 'Decisiveness', 'Protective instinct'],
    atBest: 'Heroic, magnanimous, and empowering to others',
    underStress: 'Domineering, aggressive, and controlling',
    wing1: 7,
    wing2: 9,
  },
  9: {
    name: 'The Peacemaker',
    alias: 'The Mediator',
    coreFear: 'Loss and fragmentation — conflict that tears things apart',
    coreDesire: 'To have inner peace and harmony with the world',
    description: 'Receptive, reassuring, and agreeable. Nines seek harmony above all, often merging with others\' agendas and losing sight of their own desires and priorities.',
    strengths: ['Calmness', 'Acceptance', 'Natural mediation'],
    atBest: 'Peaceful, healing, grounding, and deeply supportive',
    underStress: 'Disengaged, complacent, and emotionally numb',
    wing1: 8,
    wing2: 1,
  },
};
