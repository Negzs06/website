/**
 * All copy for CHRONOLITH lives here.
 *
 * The verbal identity is austere and slightly liturgical: short
 * declaratives, real numbers, no marketing verbs. The institute is
 * writing for readers who do not exist yet, and it knows it.
 */

export const SITE = {
  name: 'CHRONOLITH',
  tagline: 'An archive engineered for the deep future.',
  descriptor: 'Deep-time archive — Vault 04, Permian Basin',
  founded: 2031,
  mandate: 10_000,
  vaultDepth: 847, // metres below datum
  coords: { lat: '32°09′47″N', lon: '103°51′22″W' },
  timezone: 'America/Denver',
  contact: {
    general: 'record@chronolith.institute',
    deposit: 'deposit@chronolith.institute',
    press: 'press@chronolith.institute',
    phone: '+1 575 0114 220',
  },
  address: ['Chronolith Institute', 'Access Road 7, Vault 04', 'Permian Basin, NM 88220'],
} as const;

/** The ten scenes of the home descent, in order. */
export const CHAPTERS = [
  { id: 'surface', index: '00', label: 'Surface', depth: 0 },
  { id: 'descent', index: '01', label: 'Descent', depth: 62 },
  { id: 'medium', index: '02', label: 'The Medium', depth: 148 },
  { id: 'inscription', index: '03', label: 'Inscription', depth: 236 },
  { id: 'sequence', index: '04', label: 'The Sequence', depth: 341 },
  { id: 'vault', index: '05', label: 'The Vault', depth: 468 },
  { id: 'dispersal', index: '06', label: 'Dispersal', depth: 590 },
  { id: 'mandate', index: '07', label: 'The Mandate', depth: 688 },
  { id: 'reader', index: '08', label: 'The Reader', depth: 790 },
  { id: 'transmit', index: '09', label: 'Transmit', depth: 847 },
] as const;

export const NAV = [
  { href: '/', label: 'Descent', index: '01' },
  { href: '/method', label: 'Method', index: '02' },
  { href: '/register', label: 'Register', index: '03' },
  { href: '/contact', label: 'Deposit', index: '04' },
] as const;

/* ------------------------------------------------------------------
   The register: what is actually in the vault.
   ------------------------------------------------------------------ */

export type Record_ = {
  id: string;
  ref: string;
  title: string;
  kind: string;
  volume: string;
  deposited: string;
  plate: string;
  summary: string;
  detail: string;
  status: 'sealed' | 'writing' | 'open';
};

export const RECORDS: Record_[] = [
  {
    id: 'seed',
    ref: 'CHR-0001',
    title: 'The Seed Index',
    kind: 'Biological',
    volume: '41.2 TB',
    deposited: '2033.04.11',
    plate: 'plate-halite',
    status: 'sealed',
    summary:
      'Complete genomic sequences for 21,400 cultivated plant varieties, with the growing notes that make them useful.',
    detail:
      'A genome without its agronomy is a curiosity. Every sequence in the Seed Index is deposited alongside sowing depth, day length, companion species and the failure modes recorded by the people who actually grew it. The index is the largest single deposit in Vault 04 and the only one written twice.',
  },
  {
    id: 'tongues',
    ref: 'CHR-0014',
    title: 'Six Hundred Tongues',
    kind: 'Linguistic',
    volume: '8.7 TB',
    deposited: '2034.09.02',
    plate: 'plate-varve',
    status: 'sealed',
    summary:
      'Audio, orthography and grammar for 604 languages, 311 of which had fewer than a thousand living speakers at deposit.',
    detail:
      'Recorded in the field between 2031 and 2034. Each language is stored as sound first and description second, because a grammar is a theory and a recording is evidence. Where a speaker asked not to be archived, the gap is recorded too.',
  },
  {
    id: 'ledger',
    ref: 'CHR-0027',
    title: 'The Common Ledger',
    kind: 'Civic',
    volume: '129.5 TB',
    deposited: '2036.01.29',
    plate: 'plate-section',
    status: 'sealed',
    summary:
      'Land title, water right and boundary record for 74 jurisdictions, current to the day of sealing.',
    detail:
      'The most requested deposit and the most contested. Boundaries are recorded as claimed by each party rather than resolved, and every conflicting claim is stored beside its rival at equal weight. The vault does not arbitrate.',
  },
  {
    id: 'failure',
    ref: 'CHR-0031',
    title: 'Catalogue of Failure',
    kind: 'Technical',
    volume: '17.9 TB',
    deposited: '2036.11.14',
    plate: 'plate-inscribe',
    status: 'sealed',
    summary:
      'Structural, medical and industrial failures from 1850 onward, with the inquiry that followed each one.',
    detail:
      'Successes are reproduced constantly and need no help surviving. Failures are buried by the institutions that caused them, and are the more useful record. Every entry includes the design intent, the mode of failure, and the change in practice that followed — or the absence of one.',
  },
  {
    id: 'sky',
    ref: 'CHR-0044',
    title: 'Sky Survey, Northern',
    kind: 'Astronomical',
    volume: '302.0 TB',
    deposited: '2038.06.30',
    plate: 'plate-wafer',
    status: 'writing',
    summary:
      'Positions and proper motions for 1.4 billion stars — a clock that any future reader can check against their own sky.',
    detail:
      'The survey is the vault’s dating mechanism. Stellar proper motion is slow, predictable and visible from the ground with modest instruments. A reader who compares this catalogue to their own sky can establish how long the record has been waiting without trusting a single word we wrote.',
  },
  {
    id: 'hand',
    ref: 'CHR-0052',
    title: 'Work of the Hand',
    kind: 'Material',
    volume: '63.4 TB',
    deposited: '2039.03.17',
    plate: 'plate-surface',
    status: 'writing',
    summary:
      'Photogrammetry and process film for 3,900 crafts practised without industrial power.',
    detail:
      'Smelting, tanning, coppicing, throwing, forging, milling. Recorded at the speed the work is actually done, with the hands of practitioners rather than demonstrators. If the grid ever goes quiet for a century, this is the deposit that matters.',
  },
];

/* ------------------------------------------------------------------
   The method: how the archive actually works.
   ------------------------------------------------------------------ */

export const METHOD = [
  {
    step: '01',
    title: 'Selection',
    lede: 'What deserves ten thousand years?',
    body: 'Nothing is admitted because it is popular. A deposit must be non-reconstructible — if a future reader could derive it from first principles or from the physical world itself, it does not belong in the vault. What survives selection is the record of choices humans made and the reasons they gave.',
    metric: '1 in 900',
    metricLabel: 'submissions admitted',
  },
  {
    step: '02',
    title: 'Inscription',
    lede: 'Written with light, into glass.',
    body: 'A femtosecond laser forms voxels inside a blank of fused silica — permanent changes to the refractive index of the glass itself, not marks on its surface. Five dimensions carry the data: three of position, plus the orientation and size of each voxel. There is no substrate to peel, no charge to leak, no oxide to grow.',
    metric: '360 TB',
    metricLabel: 'per 120 mm blank',
  },
  {
    step: '03',
    title: 'Proving',
    lede: 'Accelerate the millennia.',
    body: 'Every blank is thermally cycled to 1,000 °C, held, and read again. Silica written this way has a projected room-temperature lifetime beyond 10¹⁴ years; the constraint is never the medium. It is whether anyone can still read it.',
    metric: '1,000 °C',
    metricLabel: 'proof cycle',
  },
  {
    step: '04',
    title: 'Emplacement',
    lede: 'Salt closes behind you.',
    body: 'Vault 04 sits 847 metres inside a bedded salt formation that has been geologically quiet for 250 million years. Salt creeps. Within fifty years of emplacement the excavation closes around each canister under its own weight, and the deposit becomes part of the formation rather than a hole in it.',
    metric: '847 m',
    metricLabel: 'below datum',
  },
  {
    step: '05',
    title: 'Legibility',
    lede: 'Assume no shared language.',
    body: 'Each canister opens with a physical primer: a diffraction key etched at visible scale, a periodic table, and the sky survey. The primer teaches the encoding using only what a reader can verify from the physical world. It assumes no shared language, no electricity, and no goodwill.',
    metric: '0',
    metricLabel: 'assumed conventions',
  },
];

/* ------------------------------------------------------------------
   Statements used across the descent.
   ------------------------------------------------------------------ */

export const STATEMENTS = {
  hero: ['Nothing we', 'make here', 'is for us.'],
  heroLede:
    'CHRONOLITH encodes the human record into fused silica and emplaces it in bedded salt, 847 metres down. Rated for ten thousand years. Read by no one alive.',
  descent:
    'Every archive ever built has failed the same way. Not the medium — the attention. Paper outlasts the library. Tape outlasts the reader. The record survives and the habit of reading it does not.',
  medium: ['Glass', 'remembers', 'light.'],
  mandate: ['Ten', 'thousand', 'years.'],
  closing: ['Write', 'something', 'down.'],
} as const;

/* ------------------------------------------------------------------
   Small factual details used as editorial furniture.
   ------------------------------------------------------------------ */

export const FACTS = [
  { k: 'Formation', v: 'Bedded halite, 250 Ma' },
  { k: 'Emplacement', v: '847 m below datum' },
  { k: 'Medium', v: 'Fused silica, 5D' },
  { k: 'Mandate', v: '10,000 years' },
  { k: 'Canisters', v: '1,204 sealed' },
  { k: 'Vault status', v: 'Accepting deposits' },
] as const;
