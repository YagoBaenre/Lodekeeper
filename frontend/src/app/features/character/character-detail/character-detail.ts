import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { CharacterService } from '../../../core/services/character.service';
import { CollectionService } from '../../../core/services/collection.service';
import { Character, CollectionProgress, CollectibleType } from '../../../core/models';

@Component({
  selector: 'app-character-detail',
  imports: [RouterLink, Button, Tag, ProgressBar, Message, ProgressSpinner],
  templateUrl: './character-detail.html',
  styleUrl: './character-detail.scss',
})
export class CharacterDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterService = inject(CharacterService);
  private readonly collectionService = inject(CollectionService);

  protected character = signal<Character | null>(null);
  protected mountProgress = signal<CollectionProgress | null>(null);
  protected minionProgress = signal<CollectionProgress | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.characterService.getCharacter(id).subscribe({
      next: (char) => {
        this.character.set(char);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Character not found or could not be loaded.');
        this.loading.set(false);
      },
    });

    this.collectionService.getCharacterCollection(id, CollectibleType.MOUNT).subscribe({
      next: (progress) => this.mountProgress.set(progress),
    });

    this.collectionService.getCharacterCollection(id, CollectibleType.MINION).subscribe({
      next: (progress) => this.minionProgress.set(progress),
    });
  }

  verify() {
    const char = this.character();
    if (!char) return;

    this.characterService.verifyCharacter(char.id).subscribe({
      next: (updated) => this.character.set(updated),
    });
  }

  refresh() {
    const char = this.character();
    if (!char) return;

    this.characterService.refreshCharacter(char.id).subscribe({
      next: (updated) => this.character.set(updated),
    });
  }
}
