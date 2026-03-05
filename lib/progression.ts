import type { SessionHistoryPoint } from '@/lib/flashcards';

export const LEVELS = [
  { description: 'You are a seed, sealed and full of potential.', glyph: '/glyphs/seed.png', name: 'Hadyn, the seed', requiredSessions: 0 },
  { description: 'You stand firm in the soil.', glyph: '/glyphs/leek.png', name: 'Cennin, the leek', requiredSessions: 3 },
  { description: 'You reach up bright in the clear spring light.', glyph: '/glyphs/daffodil.png', name: 'Cenhinen Bedr, the daffodil', requiredSessions: 5 },
  { description: 'Your claws are sharp and the heat is rising.', glyph: '/glyphs/dragon_cub.png', name: 'Cenaw Draig, the dragon cub', requiredSessions: 8 },
  { description: 'Your voice rings out clear and pure.', glyph: '/glyphs/harp.png', name: 'Telyn, the harp', requiredSessions: 12 },
  { description: 'Your fortifications are set high and steady.', glyph: '/glyphs/castle.png', name: 'Castell, the castle', requiredSessions: 16 },
  { description: 'You float light and agile on the rippling waves.', glyph: '/glyphs/coracle.png', name: 'Cwch, the coracle', requiredSessions: 20 },
  { description: 'You move lean and purposeful across the hills.', glyph: '/glyphs/wolf.png', name: 'Blaidd, the wolf', requiredSessions: 25 },
  { description: 'Your wings are wide and your eyes fix on far horizons.', glyph: '/glyphs/eagle.png', name: 'Eryr, the eagle', requiredSessions: 30 },
  { description: 'Your roots run deep, ancient wisdoms contained within you.', glyph: '/glyphs/oak.png', name: 'Derwen, the oak', requiredSessions: 36 },
  { description: 'Your intricate forged metal catches the glistening sun.', glyph: '/glyphs/crown.png', name: 'Coron, the crown', requiredSessions: 43 },
  {
    description: 'Truly, your skills are unsurpassed. Spread your wings and feel the fire alive within you. We hear you roar!',
    glyph: '/glyphs/dragon.png',
    name: 'Draig Goch, the red dragon',
    requiredSessions: 51,
  },
] as const;

export function countQualifyingSessions(history: SessionHistoryPoint[]) {
  return history.filter((point) => point.wordsShown >= 10).length;
}

export function getCurrentLevel(history: SessionHistoryPoint[]) {
  const qualifyingSessions = countQualifyingSessions(history);

  return LEVELS.reduce((currentLevel, level) => {
    if (qualifyingSessions >= level.requiredSessions) {
      return level;
    }

    return currentLevel;
  }, LEVELS[0]);
}

export function getLevelProgress(history: SessionHistoryPoint[]) {
  const qualifyingSessions = countQualifyingSessions(history);
  const currentLevelIndex = LEVELS.findIndex((level) => level.name === getCurrentLevel(history).name);
  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressLabel: 'Maximum level reached',
      progressPercentage: 100,
    };
  }

  const completedWithinBand = Math.max(0, qualifyingSessions - currentLevel.requiredSessions);
  const requiredWithinBand = Math.max(1, nextLevel.requiredSessions - currentLevel.requiredSessions);
  const progressPercentage = Math.max(0, Math.min(100, Math.round((completedWithinBand / requiredWithinBand) * 100)));

  return {
    currentLevel,
    nextLevel,
    progressLabel: `${qualifyingSessions} of ${nextLevel.requiredSessions} qualifying sessions`,
    progressPercentage,
  };
}
