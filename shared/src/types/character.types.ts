export interface Character {
  id: number;
  lodestoneId: string;
  name: string;
  server: string;
  dataCenter: string;
  portrait: string;
  title?: string;
  verified: boolean;
  userId: number;
  freeCompanyId?: number;
  lastScrapedAt?: Date;
  createdAt: Date;
}

export interface CharacterSearchResult {
  lodestoneId: string;
  name: string;
  server: string;
  portrait: string;
}

export interface VerificationRequest {
  lodestoneId: string;
  verificationCode: string;
}
