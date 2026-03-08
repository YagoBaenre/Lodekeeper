import { Component, inject, OnInit, signal } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { CharacterService } from '../../../core/services/character.service';
import { FcService } from '../../../core/services/fc.service';
import { FCAlmostThere } from '../../../core/models';

@Component({
  selector: 'app-fc-almost-there',
  imports: [ProgressBar, Tag],
  templateUrl: './fc-almost-there.html',
  styleUrl: './fc-almost-there.scss',
})
export class FcAlmostThereComponent implements OnInit {
  private readonly characterService = inject(CharacterService);
  private readonly fcService = inject(FcService);

  protected items = signal<FCAlmostThere[]>([]);

  ngOnInit() {
    this.characterService.getMyCharacters().subscribe({
      next: (chars) => {
        const withFc = chars.find((c) => c.freeCompanyId);
        if (withFc?.freeCompanyId) {
          this.fcService.getAlmostThere(withFc.freeCompanyId).subscribe({
            next: (items) => this.items.set(items),
          });
        }
      },
    });
  }
}
