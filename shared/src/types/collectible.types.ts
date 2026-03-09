export enum CollectibleType {
  MOUNT = 'mount',
  MINION = 'minion',
  TITLE = 'title',
  EMOTE = 'emote',
  HAIRSTYLE = 'hairstyle',
  ORCHESTRION = 'orchestrion',
}

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
