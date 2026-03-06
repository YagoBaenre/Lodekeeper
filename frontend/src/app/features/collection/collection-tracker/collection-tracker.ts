import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { Collectible, CollectibleType } from '../../../core/models';

@Component({
  selector: 'app-collection-tracker',
  imports: [],
  templateUrl: './collection-tracker.html',
  styleUrl: './collection-tracker.scss',
})
export class CollectionTracker implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly collectionService = inject(CollectionService);

  protected collectibles = signal<Collectible[]>([]);
  protected activeType = signal<CollectibleType>(CollectibleType.MOUNT);
  protected loading = signal(true);

  protected readonly types = [
    { value: CollectibleType.MOUNT, label: 'Mounts' },
    { value: CollectibleType.MINION, label: 'Minions' },
    { value: CollectibleType.TITLE, label: 'Titles' },
    { value: CollectibleType.EMOTE, label: 'Emotes' },
  ];

  ngOnInit() {
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam) {
      this.activeType.set(typeParam as CollectibleType);
    }
    this.loadCollectibles();
  }

  setType(type: CollectibleType) {
    this.activeType.set(type);
    this.loadCollectibles();
  }

  private loadCollectibles() {
    this.loading.set(true);
    this.collectionService.getCollectibles(this.activeType()).subscribe({
      next: (items) => {
        this.collectibles.set(items);
        this.loading.set(false);
      },
    });
  }
}
