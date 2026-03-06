import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService } from '../../../core/services/character.service';

@Component({
  selector: 'app-character-link',
  imports: [FormsModule],
  templateUrl: './character-link.html',
  styleUrl: './character-link.scss',
})
export class CharacterLink {
  private readonly characterService = inject(CharacterService);
  private readonly router = inject(Router);

  protected lodestoneId = '';
  protected error = signal<string | null>(null);
  protected loading = signal(false);

  onSubmit() {
    this.error.set(null);
    this.loading.set(true);

    this.characterService.linkCharacter(this.lodestoneId).subscribe({
      next: (character) => {
        this.router.navigate(['/characters', character.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Failed to link character');
        this.loading.set(false);
      },
    });
  }
}
