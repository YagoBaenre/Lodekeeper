import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterService } from '../../core/services/character.service';
import { Character } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly characterService = inject(CharacterService);
  protected characters = signal<Character[]>([]);

  ngOnInit() {
    this.characterService.getMyCharacters().subscribe({
      next: (chars) => this.characters.set(chars),
    });
  }
}
