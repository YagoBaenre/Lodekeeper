import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { ProgressSpinner } from 'primeng/progressspinner';
import { CollectionService } from '../../../core/services/collection.service';
import { Collectible, CollectibleType } from '../../../core/models';

interface TrackedCollectible extends Collectible {
  isOwned: boolean;
}

@Component({
  selector: 'app-collection-tracker',
  imports: [FormsModule, Button, InputText, ProgressSpinner],
  templateUrl: './collection-tracker.html',
  styleUrl: './collection-tracker.scss',
})
export class CollectionTracker implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly collectionService = inject(CollectionService);

  protected collectibles = signal<TrackedCollectible[]>([]);
  protected activeType = signal<CollectibleType>(CollectibleType.MOUNT);
  protected loading = signal(true);
  protected characterId = signal<number | null>(null);
  protected searchTerm = signal('');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly types = [
    { value: CollectibleType.MOUNT, label: 'Mounts' },
    { value: CollectibleType.MINION, label: 'Minions' },
    { value: CollectibleType.TITLE, label: 'Titles' },
    { value: CollectibleType.EMOTE, label: 'Emotes' },
  ];

  ngOnInit() {
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    const charIdParam = this.route.snapshot.queryParamMap.get('characterId');

    if (typeParam) this.activeType.set(typeParam as CollectibleType);
    if (charIdParam) this.characterId.set(Number(charIdParam));

    this.loadCollectibles();
  }

  setType(type: CollectibleType) {
    this.activeType.set(type);
    this.searchTerm.set('');
    this.loadCollectibles();
  }

  onSearch(term: string) {
    this.searchTerm.set(term);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadCollectibles(), 400);
  }

  toggleOwned(item: TrackedCollectible) {
    const charId = this.characterId();
    if (!charId) return;

    this.collectionService.toggleCollectible(charId, item.id).subscribe({
      next: (res) => {
        this.collectibles.update((list) =>
          list.map((c) => (c.id === item.id ? { ...c, isOwned: res.owned } : c)),
        );
      },
    });
  }

  private loadCollectibles() {
    this.loading.set(true);
    const charId = this.characterId();
    const search = this.searchTerm() || undefined;

    if (charId) {
      this.collectionService.getCharacterCollection(charId, this.activeType(), search).subscribe({
        next: (progress) => {
          const owned: TrackedCollectible[] = progress.ownedItems.map((oi) => ({
            ...oi.collectible,
            isOwned: true,
          }));
          const missing: TrackedCollectible[] = progress.missing.map((c) => ({
            ...c,
            isOwned: false,
          }));
          const all = [...owned, ...missing].sort((a, b) => a.name.localeCompare(b.name));
          this.collectibles.set(all);
          this.loading.set(false);
        },
      });
    } else {
      this.collectionService.getCollectibles(this.activeType(), search).subscribe({
        next: (items) => {
          this.collectibles.set(items.map((c) => ({ ...c, isOwned: false })));
          this.loading.set(false);
        },
      });
    }
  }
}
