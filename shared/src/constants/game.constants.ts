export const FFXIV_COLLECT_BASE_URL = 'https://ffxivcollect.com';

export const DATA_CENTERS = {
  Aether: ['Adamantoise', 'Cactuar', 'Faerie', 'Gilgamesh', 'Jenova', 'Midgardsormr', 'Sargatanas', 'Siren'],
  Primal: ['Behemoth', 'Excalibur', 'Exodus', 'Famfrit', 'Hyperion', 'Lamia', 'Leviathan', 'Ultros'],
  Crystal: ['Balmung', 'Brynhildr', 'Coeurl', 'Diabolos', 'Goblin', 'Malboro', 'Mateus', 'Zalera'],
  Dynamis: ['Halicarnassus', 'Maduin', 'Marilith', 'Seraph'],
  Chaos: ['Cerberus', 'Louisoix', 'Moogle', 'Omega', 'Phantom', 'Ragnarok', 'Sagittarius', 'Spriggan'],
  Light: ['Alpha', 'Lich', 'Odin', 'Phoenix', 'Raiden', 'Shiva', 'Twintania', 'Zodiark'],
  Elemental: ['Aegis', 'Atomos', 'Carbuncle', 'Garuda', 'Gungnir', 'Kujata', 'Tonberry', 'Typhon'],
  Gaia: ['Alexander', 'Bahamut', 'Durandal', 'Fenrir', 'Ifrit', 'Ridill', 'Tiamat', 'Ultima'],
  Mana: ['Anima', 'Asura', 'Chocobo', 'Hades', 'Ixion', 'Masamune', 'Pandaemonium', 'Titan'],
  Meteor: ['Belias', 'Mandragora', 'Ramuh', 'Shinryu', 'Unicorn', 'Valefor', 'Yojimbo', 'Zeromus'],
  Materia: ['Bismarck', 'Ravana', 'Sephirot', 'Sophia', 'Zurvan'],
} as const;

/** FFXIV Collect API endpoints (append to base URL) */
export const FFXIV_COLLECT_ENDPOINTS = {
  MOUNTS: 'mounts',
  MINIONS: 'minions',
  ACHIEVEMENTS: 'achievements',
  TITLES: 'titles',
  EMOTES: 'emotes',
  HAIRSTYLES: 'hairstyles',
  ORCHESTRIONS: 'orchestrions',
} as const;

export const LODESTONE_BASE_URL = 'https://na.finalfantasyxiv.com/lodestone';
