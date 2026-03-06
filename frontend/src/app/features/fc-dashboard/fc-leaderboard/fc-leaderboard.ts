import { Component, inject, OnInit, signal } from '@angular/core';
import { CharacterService } from '../../../core/services/character.service';
import { FcService } from '../../../core/services/fc.service';
import { FCLeaderboardEntry } from '../../../core/models';

@Component({
  selector: 'app-fc-leaderboard',
  imports: [],
  templateUrl: './fc-leaderboard.html',
  styleUrl: './fc-leaderboard.scss',
})
export class FcLeaderboard implements OnInit {
  private readonly characterService = inject(CharacterService);
  private readonly fcService = inject(FcService);

  protected leaderboard = signal<FCLeaderboardEntry[]>([]);

  ngOnInit() {
    this.characterService.getMyCharacters().subscribe({
      next: (chars) => {
        const withFc = chars.find((c) => c.freeCompanyId);
        if (withFc?.freeCompanyId) {
          this.fcService.getLeaderboard(withFc.freeCompanyId).subscribe({
            next: (lb) => this.leaderboard.set(lb),
          });
        }
      },
    });
  }
}
