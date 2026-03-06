export interface FreeCompany {
  id: number;
  lodestoneId: string;
  name: string;
  server: string;
  tag: string;
  memberCount: number;
  slogan?: string;
  crest?: string;
  lastScrapedAt?: Date;
}

export interface FCLeaderboardEntry {
  characterId: number;
  characterName: string;
  portrait: string;
  totalCollectibles: number;
  mountCount: number;
  minionCount: number;
  achievementCount: number;
  rank: number;
}

export interface FCAlmostThere {
  collectible: {
    id: number;
    name: string;
    icon: string;
    type: string;
  };
  ownedByCount: number;
  totalMembers: number;
  percentage: number;
}
