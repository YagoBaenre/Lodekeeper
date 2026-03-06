import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character, FreeCompany, FCLeaderboardEntry, FCAlmostThere } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FcService {
  private readonly apiUrl = `${environment.apiUrl}/fc`;

  constructor(private readonly http: HttpClient) {}

  getFreeCompany(id: number) {
    return this.http.get<FreeCompany>(`${this.apiUrl}/${id}`);
  }

  getMembers(fcId: number) {
    return this.http.get<Character[]>(`${this.apiUrl}/${fcId}/members`);
  }

  getLeaderboard(fcId: number) {
    return this.http.get<FCLeaderboardEntry[]>(`${this.apiUrl}/${fcId}/leaderboard`);
  }

  getAlmostThere(fcId: number) {
    return this.http.get<FCAlmostThere[]>(`${this.apiUrl}/${fcId}/almost-there`);
  }
}
