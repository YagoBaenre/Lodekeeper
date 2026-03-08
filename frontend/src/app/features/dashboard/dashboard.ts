import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Avatar } from 'primeng/avatar';
import { CharacterService } from '../../core/services/character.service';
import { Character } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Button, Tag, Avatar],
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
