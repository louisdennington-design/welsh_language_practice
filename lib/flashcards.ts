export type DurationOption = `${10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100}` | 'unlimited';
export type FrontLanguage = 'english' | 'welsh';
export type CoreLinguisticTypeOption = 'VERB' | 'ADJ' | 'NOUN';
export type LinguisticTypeOption = CoreLinguisticTypeOption | 'STACK';
export type FrequencyFilterOption = 'all' | 'common' | 'intermediate' | 'rare';
export type RarityOption = `${number}`;
export type ThemeOption = string;

export type SessionHistoryPoint = {
  session: number;
  totalLearned: number;
  wordsShown: number;
};

export const DEFAULT_FRONT_LANGUAGE: FrontLanguage = 'welsh';
export const DEFAULT_FILTER_TYPES: LinguisticTypeOption[] = ['NOUN'];
export const DEFAULT_RARITY: RarityOption = '40';
export const DEFAULT_DURATION: DurationOption = '10';
export const DEFAULT_THEME_OPTIONS = [
  'people',
  'social_communication',
  'mind',
  'actions_events',
  'states_qualities',
  'objects',
  'body_health',
  'food_consumption',
  'animals',
  'plants',
  'substances_materials',
  'places',
  'time_quantity',
  'natural_phenomena',
] as const satisfies readonly string[];

export const CORE_TYPE_OPTIONS: Array<{ description: string; label: string; value: CoreLinguisticTypeOption }> = [
  { description: 'Verbs', label: 'Verbs', value: 'VERB' },
  { description: 'Adjectives', label: 'Adjectives', value: 'ADJ' },
  { description: 'Nouns', label: 'Nouns', value: 'NOUN' },
];

export const SESSION_SIZE_OPTIONS: DurationOption[] = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100', 'unlimited'];

export const FRONT_LANGUAGE_OPTIONS: Array<{ description: string; label: string; value: FrontLanguage }> = [
  { description: 'Show the Welsh side first', label: 'Welsh', value: 'welsh' },
  { description: 'Show the English side first', label: 'English', value: 'english' },
];

export const TYPE_OPTIONS: Array<{ description: string; label: string; value: LinguisticTypeOption }> = [...CORE_TYPE_OPTIONS];
export const STACK_TYPE_OPTION = { description: 'My stack', label: 'My stack', value: 'STACK' } as const;

export const THEME_OPTIONS: Array<{ label: string; value: ThemeOption }> = [...DEFAULT_THEME_OPTIONS].map((theme) => ({
  label: formatThemeLabel(theme),
  value: theme,
}));

export const CATEGORY_TOTALS: Record<CoreLinguisticTypeOption, number> = {
  ADJ: 3966,
  NOUN: 12998,
  VERB: 4507,
};

export const FREQUENCY_FILTER_OPTIONS: Array<{ label: string; value: FrequencyFilterOption }> = [
  { label: 'All', value: 'all' },
  { label: 'Common', value: 'common' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Rare', value: 'rare' },
];

const POS_VALUES = [...CORE_TYPE_OPTIONS].map((option) => option.value);
const TYPE_VALUES = new Set<LinguisticTypeOption>([...POS_VALUES, 'STACK']);
const THEME_VALUES = new Set(DEFAULT_THEME_OPTIONS);
const RARITY_SLIDER_MIN = 10;
const RARITY_SLIDER_MAX = 100;
const SESSION_SIZES = new Set(SESSION_SIZE_OPTIONS);
const DECILE_THRESHOLDS: Record<CoreLinguisticTypeOption, [number, number, number, number, number, number, number, number, number]> = {
  ADJ: [1, 3, 5.6, 11, 20, 42.2, 82, 195.2, 544],
  NOUN: [1, 3, 6, 12, 23, 49, 100, 238, 677],
  VERB: [1, 3, 6, 13, 27, 53, 112.1, 265.4, 836.7],
};

export function getQueueSize(duration: DurationOption) {
  if (duration === 'unlimited') {
    return null;
  }

  return Number(duration);
}

export function getSessionSizeLabel(duration: DurationOption) {
  return duration === 'unlimited' ? '∞' : `${duration} cards`;
}

export function getSelectedDuration(rawDuration: string | undefined): DurationOption {
  if (!rawDuration) {
    return DEFAULT_DURATION;
  }

  if (rawDuration === '1') {
    return '10';
  }

  if (rawDuration === '3') {
    return '30';
  }

  if (rawDuration === '5') {
    return '50';
  }

  return SESSION_SIZES.has(rawDuration as DurationOption) ? (rawDuration as DurationOption) : DEFAULT_DURATION;
}

export function getSelectedTypes(rawTypes: string | undefined) {
  if (!rawTypes) {
    return DEFAULT_FILTER_TYPES;
  }

  const parsedTypes = rawTypes
    .split(',')
    .map((type) => type.trim().toUpperCase())
    .filter((type): type is LinguisticTypeOption => TYPE_VALUES.has(type as LinguisticTypeOption));

  return parsedTypes.length > 0 ? parsedTypes : DEFAULT_FILTER_TYPES;
}

export function getSelectedThemes(rawThemes: string | undefined) {
  if (!rawThemes) {
    return [...DEFAULT_THEME_OPTIONS];
  }

  const parsedThemes = rawThemes
    .split(',')
    .map((theme) => normalizeTheme(theme))
    .filter((theme): theme is ThemeOption => Boolean(theme) && isThemeOption(theme));

  return parsedThemes.length > 0 ? parsedThemes : [...DEFAULT_THEME_OPTIONS];
}

export function getSelectedFrontLanguage(rawFrontLanguage: string | undefined) {
  return rawFrontLanguage === 'english' ? 'english' : DEFAULT_FRONT_LANGUAGE;
}

export function getSelectedRarity(rawRarity: string | undefined): RarityOption {
  if (!rawRarity) {
    return DEFAULT_RARITY;
  }

  const numericValue = Number(rawRarity);

  if (Number.isNaN(numericValue)) {
    return DEFAULT_RARITY;
  }

  return String(Math.max(RARITY_SLIDER_MIN, Math.min(RARITY_SLIDER_MAX, Math.round(numericValue)))) as RarityOption;
}

export function getCoreSelectedTypes(selectedTypes: LinguisticTypeOption[]) {
  return selectedTypes.filter((type): type is CoreLinguisticTypeOption => POS_VALUES.includes(type as CoreLinguisticTypeOption));
}

export function normalizeTheme(theme: string) {
  return theme.trim().toLowerCase().replace(/\s+/g, '');
}

export function formatThemeLabel(theme: ThemeOption) {
  const labels: Record<ThemeOption, string> = {
    actions_events: 'actions and events',
    animals: 'animals',
    body_health: 'body and health',
    food_consumption: 'food and consumption',
    mind: 'mind',
    natural_phenomena: 'natural phenomena',
    objects: 'objects',
    people: 'people',
    places: 'places',
    plants: 'plants',
    social_communication: 'social communication',
    states_qualities: 'states and qualities',
    substances_materials: 'substances and materials',
    time_quantity: 'time and quantities',
  };

  return labels[theme] ?? theme.replaceAll('_', ' ');
}

function isThemeOption(theme: string): theme is ThemeOption {
  return THEME_VALUES.has(theme as (typeof DEFAULT_THEME_OPTIONS)[number]);
}

export function normalizeThemeArray(rawThemes: string[] | null | undefined) {
  if (!rawThemes) {
    return [];
  }

  return [...new Set(rawThemes.map((theme) => normalizeTheme(theme)).filter((theme): theme is ThemeOption => isThemeOption(theme)))];
}

export function matchesSelectedTypes(pos: string | null | undefined, selectedTypes: CoreLinguisticTypeOption[]) {
  return Boolean(pos) && selectedTypes.includes(pos as CoreLinguisticTypeOption);
}

export function matchesSelectedThemes(rawThemes: string[] | null | undefined, selectedThemes: ThemeOption[]) {
  const normalizedThemes = normalizeThemeArray(rawThemes);

  if (selectedThemes.length === DEFAULT_THEME_OPTIONS.length) {
    return normalizedThemes.length > 0;
  }

  return normalizedThemes.some((theme) => selectedThemes.includes(theme));
}

export function getRarityForFrequency(pos: CoreLinguisticTypeOption, frequency: number | null | undefined): RarityOption {
  if (frequency === null || frequency === undefined) {
    return '100';
  }

  const [p10, p20, p30, p40, p50, p60, p70, p80, p90] = DECILE_THRESHOLDS[pos];

  if (frequency >= p90) return '10';
  if (frequency >= p80) return '20';
  if (frequency >= p70) return '30';
  if (frequency >= p60) return '40';
  if (frequency >= p50) return '50';
  if (frequency >= p40) return '60';
  if (frequency >= p30) return '70';
  if (frequency >= p20) return '80';
  if (frequency >= p10) return '90';

  return '100';
}

export function getRarityLabel(rarity: RarityOption) {
  const upperBound = getRarityWindowBounds(rarity).upperBound;

  if (upperBound <= 25) {
    return 'common';
  }

  if (upperBound <= 50) {
    return 'fairly common';
  }

  if (upperBound <= 75) {
    return 'rare';
  }

  return 'very rare';
}

export function getBroadFrequencyFilter(pos: CoreLinguisticTypeOption, frequency: number | null | undefined): Exclude<FrequencyFilterOption, 'all'> {
  const bucket = Number(getRarityForFrequency(pos, frequency)) / 10;

  if (bucket <= 3) {
    return 'common';
  }

  if (bucket <= 7) {
    return 'intermediate';
  }

  return 'rare';
}

export function getRarityWindowBounds(rarity: RarityOption) {
  const upperBound = Math.max(10, Math.min(100, Math.floor(Number(rarity) / 5) * 5));
  return {
    lowerBound: Math.max(0, upperBound - 35),
    upperBound: Math.max(10, upperBound - 5),
  };
}

export function matchesRarityWindow(pos: CoreLinguisticTypeOption, frequency: number | null | undefined, rarity: RarityOption) {
  const decileUpperBound = Number(getRarityForFrequency(pos, frequency));
  const decileLowerBound = decileUpperBound - 10;
  const { lowerBound, upperBound } = getRarityWindowBounds(rarity);

  return decileUpperBound > lowerBound && decileLowerBound <= upperBound;
}

export function matchesFrequencyFilter(
  frequencyRank: number | null | undefined,
  filter: FrequencyFilterOption,
  pos: CoreLinguisticTypeOption,
) {
  if (filter === 'all') {
    return true;
  }

  return getBroadFrequencyFilter(pos, frequencyRank) === filter;
}
