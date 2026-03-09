export interface CollectibleSourceEntry {
  type: string;
  text: string;
  related_type?: string | null;
  related_id?: number | null;
}

export interface Collectible {
  id: number;
  externalId: number;
  type: CollectibleType;
  name: string;
  icon: string;
  image?: string;
  description?: string;
  enhanced_description?: string;
  tooltip?: string;
  patch?: string;
  owned?: string;
  tradeable?: boolean;
  sources?: CollectibleSourceEntry[];
  movement?: string;
  seats?: number;
  command?: string;
  female_name?: string;
  category?: string;
  item_id?: number;
  order?: number;
}

export enum CollectibleType {
  MOUNT = 'mount',
  MINION = 'minion',
  TITLE = 'title',
  EMOTE = 'emote',
  HAIRSTYLE = 'hairstyle',
  ORCHESTRION = 'orchestrion',
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
  externalId: number;
  name: string;
  description?: string;
  category?: string;
  type_name?: string;
  points: number;
  icon?: string;
  patch?: string;
  owned?: string;
  order?: number;
}

export interface AchievementProgress {
  total: number;
  obtained: number;
  percentage: number;
  missing: Achievement[];
}
