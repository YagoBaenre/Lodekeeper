export interface Collectible {
  id: number;
  xivapiId: number;
  type: CollectibleType;
  name: string;
  icon: string;
  source: CollectibleSource;
  patch?: string;
  description?: string;
}

export enum CollectibleType {
  MOUNT = 'mount',
  MINION = 'minion',
  TITLE = 'title',
  EMOTE = 'emote',
  HAIRSTYLE = 'hairstyle',
  ORCHESTRION = 'orchestrion',
}

export enum CollectibleSource {
  RAID = 'raid',
  TRIAL = 'trial',
  DUNGEON = 'dungeon',
  CRAFTING = 'crafting',
  TREASURE_MAP = 'treasure_map',
  PVP = 'pvp',
  MOGSTATION = 'mogstation',
  ACHIEVEMENT = 'achievement',
  EVENT = 'event',
  OTHER = 'other',
}

export interface CollectionProgress {
  total: number;
  owned: number;
  percentage: number;
  missing: Collectible[];
  ownedItems: CharacterCollectible[];
}

export interface CharacterCollectible {
  id: number;
  characterId: number;
  collectibleId: number;
  collectible: Collectible;
  obtainedAt?: string;
}

export interface Achievement {
  id: number;
  xivapiId: number;
  name: string;
  description?: string;
  category?: string;
  points: number;
  icon?: string;
  patch?: string;
}

export interface AchievementProgress {
  total: number;
  obtained: number;
  percentage: number;
  missing: Achievement[];
}
