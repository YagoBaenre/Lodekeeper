import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly apiUrl = `${environment.apiUrl}/characters`;

  constructor(private readonly http: HttpClient) {}

  getMyCharacters() {
    return this.http.get<Character[]>(this.apiUrl);
  }

  getCharacter(id: number) {
    return this.http.get<Character>(`${this.apiUrl}/${id}`);
  }

  linkCharacter(lodestoneId: string) {
    return this.http.post<Character>(`${this.apiUrl}/link`, { lodestoneId });
  }

  verifyCharacter(characterId: number) {
    return this.http.post<Character>(`${this.apiUrl}/${characterId}/verify`, {});
  }

  refreshCharacter(characterId: number) {
    return this.http.post<Character>(`${this.apiUrl}/${characterId}/refresh`, {});
  }
}
