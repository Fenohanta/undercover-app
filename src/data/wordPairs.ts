import type { WordPair } from '../types/game';

export const wordPairs: WordPair[] = [
  // Fruits
  { category: 'Fruits', civil: 'Pomme',        undercover: 'Poire',            source: 'local' },
  { category: 'Fruits', civil: 'Orange',        undercover: 'Clémentine',       source: 'local' },
  { category: 'Fruits', civil: 'Fraise',        undercover: 'Framboise',        source: 'local' },
  { category: 'Fruits', civil: 'Raisin',        undercover: 'Groseille',        source: 'local' },
  { category: 'Fruits', civil: 'Banane',        undercover: 'Plantain',         source: 'local' },
  { category: 'Fruits', civil: 'Pêche',         undercover: 'Abricot',          source: 'local' },

  // Animaux
  { category: 'Animaux', civil: 'Chien',        undercover: 'Loup',             source: 'local' },
  { category: 'Animaux', civil: 'Chat',         undercover: 'Tigre',            source: 'local' },
  { category: 'Animaux', civil: 'Cheval',       undercover: 'Zèbre',            source: 'local' },
  { category: 'Animaux', civil: 'Grenouille',   undercover: 'Crapaud',          source: 'local' },
  { category: 'Animaux', civil: 'Dauphin',      undercover: 'Orque',            source: 'local' },
  { category: 'Animaux', civil: 'Aigle',        undercover: 'Faucon',           source: 'local' },

  // Boissons
  { category: 'Boissons', civil: 'Café',        undercover: 'Thé',              source: 'local' },
  { category: 'Boissons', civil: 'Bière',       undercover: 'Cidre',            source: 'local' },
  { category: 'Boissons', civil: 'Coca-Cola',   undercover: 'Pepsi',            source: 'local' },
  { category: 'Boissons', civil: 'Eau',         undercover: 'Limonade',         source: 'local' },
  { category: 'Boissons', civil: 'Jus d\'orange', undercover: 'Nectar',         source: 'local' },
  { category: 'Boissons', civil: 'Champagne',   undercover: 'Prosecco',         source: 'local' },

  // Lieux
  { category: 'Lieux', civil: 'Plage',          undercover: 'Piscine',          source: 'local' },
  { category: 'Lieux', civil: 'Cinéma',         undercover: 'Théâtre',          source: 'local' },
  { category: 'Lieux', civil: 'Forêt',          undercover: 'Jungle',           source: 'local' },
  { category: 'Lieux', civil: 'Montagne',       undercover: 'Colline',          source: 'local' },
  { category: 'Lieux', civil: 'Musée',          undercover: 'Galerie d\'art',   source: 'local' },
  { category: 'Lieux', civil: 'Aéroport',       undercover: 'Gare',             source: 'local' },

  // Sports
  { category: 'Sports', civil: 'Football',      undercover: 'Rugby',            source: 'local' },
  { category: 'Sports', civil: 'Tennis',        undercover: 'Badminton',        source: 'local' },
  { category: 'Sports', civil: 'Natation',      undercover: 'Plongée',          source: 'local' },
  { category: 'Sports', civil: 'Ski',           undercover: 'Snowboard',        source: 'local' },
  { category: 'Sports', civil: 'Cyclisme',      undercover: 'Triathlon',        source: 'local' },
  { category: 'Sports', civil: 'Boxe',          undercover: 'Karaté',           source: 'local' },

  // Objets
  { category: 'Objets', civil: 'Stylo',         undercover: 'Crayon',           source: 'local' },
  { category: 'Objets', civil: 'Lunettes',      undercover: 'Jumelles',         source: 'local' },
  { category: 'Objets', civil: 'Sac à dos',     undercover: 'Valise',           source: 'local' },
  { category: 'Objets', civil: 'Montre',        undercover: 'Réveil',           source: 'local' },
  { category: 'Objets', civil: 'Parapluie',     undercover: 'Imperméable',      source: 'local' },
  { category: 'Objets', civil: 'Bougie',        undercover: 'Lampe de poche',   source: 'local' },

  // Nourriture
  { category: 'Nourriture', civil: 'Pizza',           undercover: 'Quiche',           source: 'local' },
  { category: 'Nourriture', civil: 'Sushi',            undercover: 'Maki',             source: 'local' },
  { category: 'Nourriture', civil: 'Croissant',        undercover: 'Pain au chocolat', source: 'local' },
  { category: 'Nourriture', civil: 'Glace',            undercover: 'Sorbet',           source: 'local' },
  { category: 'Nourriture', civil: 'Hamburger',        undercover: 'Sandwich',         source: 'local' },
  { category: 'Nourriture', civil: 'Tarte',            undercover: 'Gâteau',           source: 'local' },

  // Tech
  { category: 'Tech', civil: 'Téléphone',       undercover: 'Tablette',         source: 'local' },
  { category: 'Tech', civil: 'Casque audio',    undercover: 'Écouteurs',        source: 'local' },
  { category: 'Tech', civil: 'Ordinateur',      undercover: 'Laptop',           source: 'local' },
  { category: 'Tech', civil: 'Imprimante',      undercover: 'Scanner',          source: 'local' },

  // Vêtements
  { category: 'Vêtements', civil: 'Manteau',    undercover: 'Veste',            source: 'local' },
  { category: 'Vêtements', civil: 'Baskets',    undercover: 'Running',          source: 'local' },
  { category: 'Vêtements', civil: 'Pull',       undercover: 'Sweat',            source: 'local' },
  { category: 'Vêtements', civil: 'Robe',       undercover: 'Jupe',             source: 'local' },

  // Nature
  { category: 'Nature', civil: 'Volcan',        undercover: 'Geyser',           source: 'local' },
  { category: 'Nature', civil: 'Rivière',       undercover: 'Ruisseau',         source: 'local' },
  { category: 'Nature', civil: 'Désert',        undercover: 'Savane',           source: 'local' },
  { category: 'Nature', civil: 'Cascade',       undercover: 'Fontaine',         source: 'local' },
];

export const LOCAL_CATEGORIES = [...new Set(wordPairs.map(wp => wp.category))];
