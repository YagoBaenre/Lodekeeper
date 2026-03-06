import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterService } from '../../../core/services/character.service';
import { FcService } from '../../../core/services/fc.service';
import { Character, FreeCompany } from '../../../core/models';

@Component({
  selector: 'app-fc-overview',
  imports: [RouterLink],
  templateUrl: './fc-overview.html',
  styleUrl: './fc-overview.scss',
})
export class FcOverview implements OnInit {
  private readonly characterService = inject(CharacterService);
  private readonly fcService = inject(FcService);

  protected fc = signal<FreeCompany | null>(null);
  protected members = signal<Character[]>([]);

  ngOnInit() {
    this.characterService.getMyCharacters().subscribe({
      next: (chars) => {
        const withFc = chars.find((c) => c.freeCompanyId);
        if (withFc?.freeCompanyId) {
          this.loadFc(withFc.freeCompanyId);
        }
      },
    });
  }

  private loadFc(fcId: number) {
    this.fcService.getFreeCompany(fcId).subscribe({
      next: (fc) => this.fc.set(fc),
    });
    this.fcService.getMembers(fcId).subscribe({
      next: (members) => this.members.set(members),
    });
  }
}
