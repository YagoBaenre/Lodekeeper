import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Collectible,
  CollectibleType,
  CollectionProgress,
  AchievementProgress,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCollectibles(type?: CollectibleType, search?: string) {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (search) params = params.set('search', search);
    return this.http.get<Collectible[]>(`${this.apiUrl}/collectibles`, { params });
  }

  getCollectible(id: number) {
    return this.http.get<Collectible>(`${this.apiUrl}/collectibles/${id}`);
  }

  getCharacterCollection(characterId: number, type?: CollectibleType, search?: string) {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (search) params = params.set('search', search);
    return this.http.get<CollectionProgress>(
      `${this.apiUrl}/characters/${characterId}/collections`,
      { params },
    );
  }

  toggleCollectible(characterId: number, collectibleId: number) {
    return this.http.post<{ owned: boolean }>(
      `${this.apiUrl}/characters/${characterId}/collections/toggle`,
      { collectibleId },
    );
  }

  getCharacterAchievements(characterId: number) {
    return this.http.get<AchievementProgress>(
      `${this.apiUrl}/characters/${characterId}/achievements`,
    );
  }
}
