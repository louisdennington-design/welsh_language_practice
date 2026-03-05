export const WELSH_FACTS = [
  'Welsh is older than English in Britain. It was spoken centuries before English arrived.',
  'Welsh evolved from the Celtic language, Brythonic, of which Welsh and Breton are the only surviving descendants.',
  'The earliest documented Welsh poetry was composed by the "Cynfeirdd" ("early poets"), known as Aneirin and Taliesin.',
  'The Gododdin by Aneirin is an elegiac poem for 600 warriors who fell in battle against the Saxons in the sixth century AD. It is the earliest known major work of literature in the western world.',
  "'Pen' meaning 'head' is found in place names in Yorkshire such as Pen-y-ghent, Penrith and Pendle.",
  "The place name 'Dover' is believed to be derived from 'Dwfr' or 'Dwr' ('water') and 'Avon' comes from 'Afon' ('river').",
  'Wales is home to the longest place name in Europe, the second longest in the world: Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
  "Wales was one of the first countries to use its own language to create laws, and the word 'Cymry' was used to describe its people as long ago as the seventh century.",
  "English words derived from Welsh include 'dad' from 'tad', and 'penguin', 'corgi', 'flannel' and 'bard'.",
  'In 1865, Welsh settlers founded a colony in Patagonia called Y Wladfa, and to this day there are communities in Argentina where Welsh is still spoken, taught in schools, and used in chapels over 7,000 miles from Wales.',
  'Over the last 500 years, there have been multiple attempts to eliminate spoken Welsh, one being the 1536 Act of Union in which Henry VIII prohibited the use of Welsh within the legal system and in public administration.',
  "During the 19th Century, some schools punished children for speaking Welsh. Children would have a wooden token hung around their necks with the words 'Welsh Not' or 'WN' inscribed.",
  "There is no concrete word in Welsh that directly translates to 'no' in English. The word used depends on the form of the question.",
  "The 'll' sound that appears in so many Welsh place names might be considered by many to be unique to Welsh but it appears in Native American and some Chinese dialects.",
  'Welsh was introduced to Duolingo over 6 years ago and ranked the fastest growing language in the UK in 2020 ahead of French, which came in second and Japanese, which came third that year. In 2021 Japanese overtook Welsh and claimed the top spot but Welsh still remained closely behind in second place.',
  "The Welsh word 'glas' translates to 'blue' but is also used for things such as grass, leaves and the sea, as well as shades of grey such as silver.",
  'The letters K, Q, V, X and Z are not included in the Welsh alphabet but are sometimes found in borrowed words and in technical words. When present, these letters have their English sounds, except for Z, which tends to be /s/ in North Wales.',
  `It is believed that the leek was originally the only national symbol and the daffodil was gradually adopted afterwards. This may have been due to the similarity between both words. In Welsh, leek is cenhinen and daffodil is cenhinen Bedr ("Peter's leek").`,
  'Wales has more castles per square mile than any other country in Europe.',
  'Yr Wyddfa (Snowdon) is the highest mountain in England and Wales.',
  'The tales of King Arthur, often thought of as English, originated from Wales, with some academics believing the inspiration for the fictional king came from a real-life Welsh tribal leader.',
  "Wales has produced a string of world-famous singers, including Dame Shirley Bassey (Diamonds Are Forever), Bonnie Tyler (Total Eclipse of the Heart) and the unmistakable Sir Tom Jones (It's Not Unusual).",
  'Since 1999, studying Welsh is compulsory for all pupils in all state schools in Wales up to the age of 16. This has had a major effect in keeping the language alive and thriving.',
  'The language has greatly increased its prominence since the creation of the Welsh language television channel S4C in November 1982, which broadcasts exclusively in Welsh. There is also a Welsh language radio station, BBC Radio Cymru, which was launched in 1977.',
  'The Welsh language was first heard across the airwaves on 13 February 1923, when the song Dafydd y Garreg Wen was broadcast from a tiny studio on Castle Street, Cardiff.',
  'Cardiff has been the capital city of Wales since 1955, making it one of the youngest capital cities in Europe.',
  "The National Museum in Cardiff has one of Europe's most extensive collections of Impressionist art, with works by Van Gogh, Renoir and Monet.",
  "Robert Falcon Scott's ill-fated 1910 expedition to the Antarctic set off from Cardiff. The crew enjoyed a farewell meal in the city's Angel Hotel, which still welcomes guests today.",
  'Wales was the first country in the world to formally declare a climate emergency, back in 2019.',
  'Wales consistently ranks among the best countries in the world for recycling rates.',
  'The world’s first passenger-carrying railway ran along the seafront between Swansea and Mumbles on the South Wales coast. Established in 1804, it began passenger services in 1807 using horse-drawn vehicles.',
  'The world’s first iron suspension bridge was built in North Wales. Designed by Thomas Telford and completed in 1826, the Menai Suspension Bridge still provides a road traffic link between the island of Anglesey and the Welsh mainland.',
  'Many famous inventions have come out of Wales, including the spare wheel, ball bearings, the RIB boat, and the equals sign.',
  'Wales has provided iconic actors, such as Oscar-winners Catherine Zeta Jones and Anthony Hopkins.',
  "There's an established population of rare red kites in Mid Wales, attracting birdwatchers from all over the world.",
  'Llyn Tegid in Bala is home to a unique fish known as the gwyniad. The species was left isolated in this single location at the end of the last ice age.',
  "Britain's only leech farm can be found in the south west of Wales. Biopharm Leeches was established in 1812, and moved to Hendy, near Swansea, in 1984.",
  "St Davids is Britain's smallest city, with fewer than 2,000 residents. Its city status was confirmed by Queen Elizabeth II in 1994.",
  'Welsh gold has been used in wedding rings for the British Royal Family for over a century.',
  'The last-ever attempted invasion of mainland Britain took place at Fishguard on the Pembrokeshire coast, by an ill-equipped French force of 1,400 men on 22 February 1797.',
  "The Coal Exchange in Cardiff is reputedly where Britain's first million-pound deal was struck.",
  'Cardiff has the oldest record shop in the world: Spillers, established in 1894.',
  "The Welsh word for microwave is not really popty-ping. (Popty means 'oven', so it's an oven that goes ping. It's a joke.) The proper name is microdon and the don bit means 'wave'.",
  'The Annual Population Survey (July 2024 to June 2025) reported that 26.9% of people aged three and over were able to speak Welsh.',
  'According to 2016 statistics, sheep outnumber human beings in Wales at a ratio of three sheep to every one person.',
  "The UK's deepest cave can be found in Wales. Ogof Ffynnon Ddu (Cave of the Black Spring) is 59km long and 274 meters deep.",
  "It's claimed that the leek became a national symbol when 7th century king of Gwynedd, Cadwaladr, ordered his army to strap a leek to their armour to help distinguish them from the enemy in the chaos of battle.",
  "Henrhyd falls in the Brecon Beacons is used as the entrance to Batman's HQ in The Dark Knight Rises.",
] as const;

const FACT_ROTATION_KEY = 'cymrucards-fact-rotation';

type FactRotationState = {
  cursor: number;
  order: number[];
};

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function buildShuffledOrder() {
  const order = WELSH_FACTS.map((_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentValue = order[index];

    order[index] = order[randomIndex];
    order[randomIndex] = currentValue;
  }

  return order;
}

function readFactRotationState() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawState = window.sessionStorage.getItem(FACT_ROTATION_KEY);

  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState) as FactRotationState;
  } catch {
    return null;
  }
}

function writeFactRotationState(state: FactRotationState) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(FACT_ROTATION_KEY, JSON.stringify(state));
}

export function getRotatingFacts(limit: number) {
  if (limit <= 0) {
    return [];
  }

  let state = readFactRotationState();

  if (!state || state.order.length !== WELSH_FACTS.length) {
    state = {
      cursor: 0,
      order: buildShuffledOrder(),
    };
  }

  const selectedFacts: string[] = [];

  while (selectedFacts.length < limit) {
    if (state.cursor >= state.order.length) {
      state = {
        cursor: 0,
        order: buildShuffledOrder(),
      };
    }

    selectedFacts.push(WELSH_FACTS[state.order[state.cursor]]);
    state.cursor += 1;
  }

  writeFactRotationState(state);
  return selectedFacts;
}
