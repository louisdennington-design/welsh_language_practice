import type { CoreLinguisticTypeOption, RarityOption, ThemeOption } from '@/lib/flashcards';

export type QueueDirection = 'left' | 'right';

export function createFocusKey(rarity: RarityOption, types: CoreLinguisticTypeOption[], themes: ThemeOption[]) {
  const normalizedTypes = [...types].sort();
  const normalizedThemes = [...themes].sort();

  return `rarity:${rarity}|types:${normalizedTypes.join(',') || 'none'}|themes:${normalizedThemes.join(',') || 'any'}`;
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

export function shuffleDeterministically<T>(items: T[], seed: string) {
  const nextItems = [...items];
  const random = createSeededRandom(seed);

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

export function reconcileQueue(existingQueue: number[], eligiblePool: number[], seed: string) {
  const eligibleSet = new Set(eligiblePool);
  const preserved = existingQueue.filter((cardId, index) => eligibleSet.has(cardId) && existingQueue.indexOf(cardId) === index);
  const preservedSet = new Set(preserved);
  const newEligible = eligiblePool.filter((cardId) => !preservedSet.has(cardId));

  return [...preserved, ...shuffleDeterministically(newEligible, seed)];
}

export function getQueueWindow(queue: number[], cursor: number, size: number | null) {
  if (queue.length === 0) {
    return [];
  }

  if (size === null) {
    return [...queue.slice(cursor), ...queue.slice(0, cursor)];
  }

  const windowSize = Math.min(size, queue.length);
  const selected: number[] = [];

  for (let index = 0; index < windowSize; index += 1) {
    selected.push(queue[(cursor + index) % queue.length]);
  }

  return selected;
}

function clamp(minimum: number, value: number, maximum: number) {
  return Math.max(minimum, Math.min(value, maximum));
}

function getJumpSizes(queueLength: number) {
  if (queueLength <= 30) {
    return {
      lessJump: 4,
      moreJump: 2,
    };
  }

  return {
    lessJump: clamp(10, Math.round(queueLength * 0.08), 200),
    moreJump: clamp(3, Math.round(queueLength * 0.02), 30),
  };
}

export function repositionQueueCard(queue: number[], cardId: number, direction: QueueDirection, cursor: number) {
  const currentIndex = queue.indexOf(cardId);

  if (currentIndex === -1) {
    return queue;
  }

  const nextQueue = queue.filter((queuedCardId) => queuedCardId !== cardId);
  const { lessJump, moreJump } = getJumpSizes(queue.length);
  const maxIndex = nextQueue.length;
  const activeFrontFloor = clamp(0, cursor + 3, maxIndex);
  const activeWindowFloor = clamp(0, cursor + 10, maxIndex);

  const proposedIndex =
    direction === 'right'
      ? Math.max(0, currentIndex - moreJump)
      : Math.min(maxIndex, currentIndex + lessJump);

  const nextIndex =
    direction === 'right' ? Math.max(proposedIndex, activeFrontFloor) : Math.max(proposedIndex, activeWindowFloor);

  nextQueue.splice(nextIndex, 0, cardId);

  return nextQueue;
}

export function rotateQueueCursor(queue: number[], cursor: number, completedCards: number) {
  if (queue.length === 0) {
    return 0;
  }

  return (cursor + completedCards) % queue.length;
}
