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

export interface Collectible {
  id: number;
  xivapiId: number;
  type: CollectibleType;
  name: string;
  icon: string;
  source: CollectibleSource;
  patch: string;
  description?: string;
}

export interface CharacterCollectible {
  characterId: number;
  collectibleId: number;
  obtainedAt?: Date;
}

export interface CollectionProgress {
  total: number;
  owned: number;
  percentage: number;
  missing: Collectible[];
  almostThere: Collectible[];
}
