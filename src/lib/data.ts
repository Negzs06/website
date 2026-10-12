export const BRAND = {
  name: 'NOIR ATELIER',
  product: 'ÉCLIPSE',
  tagline: 'A fragrance for the hour between acts.',
};

export const NAV_LINKS = [
  { href: '#reveal', label: 'Éclipse' },
  { href: '#notes', label: 'Composition' },
  { href: '#philosophy', label: 'Maison' },
  { href: '#showcase', label: 'Rituel' },
  { href: '#acquire', label: 'Acquérir' },
] as const;

export const NOTES = {
  top: {
    title: 'Ouverture',
    items: ['Black pepper', 'Bergamot husk', 'Cold rain accord'],
  },
  heart: {
    title: 'Adagio',
    items: ['Black orchid absolute', 'Wet marble mineral', 'Dark iris'],
  },
  base: {
    title: 'Finale',
    items: ['Smoked vetiver', 'Ambered leather', 'Velvet musk'],
  },
};

export const PHILOSOPHY_PARAGRAPHS = [
  'NOIR ATELIER was founded on a single conviction: that a fragrance should behave like a memory half-recalled — present, then gone, then suddenly overwhelming.',
  'Every composition is built in the dark, in a room with no mirrors, so that nothing is designed to be seen. Only felt.',
];

export const RITUAL_STEPS = [
  {
    index: '01',
    title: 'The Curtain',
    body: 'Applied to the pulse points at dusk, as the room empties and the house lights dim.',
  },
  {
    index: '02',
    title: 'The Interval',
    body: 'Left to settle through the opening minutes — the pepper and rain accord recede first.',
  },
  {
    index: '03',
    title: 'The Encore',
    body: 'The orchid and marble accord surface slowly, lingering long after the final note.',
  },
];

export const PRODUCT = {
  name: 'ÉCLIPSE',
  subtitle: 'Eau de Parfum · Unisex',
  price: '€ 285',
  volumes: ['50 ml', '100 ml', '200 ml — Atelier Flacon'],
  description:
    'Housed in hand-blown smoked glass with a brushed-silver collar, each flacon is numbered and cast in a limited annual run.',
};

export const FOOTER_LINKS = {
  maison: ['The Atelier', 'Our Perfumers', 'Sustainability', 'Journal'],
  collection: ['Éclipse', 'Private Collection', 'Discovery Set', 'Gift Atelier'],
  client: ['Contact', 'Shipping', 'Returns', 'Find a Boutique'],
};
