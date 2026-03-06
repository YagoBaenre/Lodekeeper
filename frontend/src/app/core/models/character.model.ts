export interface Character {
  id: number;
  lodestoneId: string;
  name: string;
  server: string;
  dataCenter: string;
  portrait: string;
  title?: string;
  verified: boolean;
  verificationCode?: string;
  userId: number;
  freeCompanyId?: number;
  freeCompany?: FreeCompany;
  lastScrapedAt?: string;
  createdAt: string;
}

export interface FreeCompany {
  id: number;
  lodestoneId: string;
  name: string;
  server: string;
  tag: string;
  memberCount: number;
  slogan?: string;
  crest?: string;
  lastScrapedAt?: string;
}

export interface FCLeaderboardEntry {
  characterId: number;
  characterName: string;
  portrait: string;
  totalCollectibles: number;
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
