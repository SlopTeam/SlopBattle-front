<template>
  <article class="card" :data-rarity="rarity">
    <div class="card__illustration">
      <img :src="illustration" alt="" loading="lazy" />
    </div>
    <CardContent
      :name="name"
      :types="types"
      :description="description"
      :categories="categories"
      :id="id"
      :created-at="createdAt"
      :rarity="rarity"
    />
  </article>
</template>

<script setup lang="ts">
import CardContent from '@/components/card/CardContent.vue'
import type { Rarity } from '@/constants/rarity'

defineProps<{
  rarity: Rarity
  illustration: string
  name: string
  types: string[]
  description: string
  categories: string[]
  id: number
  createdAt: string
}>()
</script>

<style scoped lang="scss">
@use 'sass:list';

// Image cut-outs (« Cadre image » layer in Figma). The clipped area reveals the
// card background, i.e. the rarity colour and texture.
$uncommon-bevel: 16px;
$rare-notch: 20px;
$epic-bevel: 22px;
$epic-tooth-width: 14px;
$epic-tooth-height: 10px;
// Teeth are laid out from the left; extra ones past the card's right edge are simply not visible
$epic-teeth: 48;
// Traced from the legendary overlay (309 × 200), stretched to the card width
$legendary-arch: 'M0 53C6 20 116 8 140 8L154.5 0 169 8C193 8 303 20 309 53V200H0Z';

@function epic-polygon() {
  $points: (
    0 $epic-bevel,
    $epic-bevel 0,
    calc(100% - #{$epic-bevel}) 0,
    100% $epic-bevel,
    100% 100%
  );
  @for $i from $epic-teeth through 1 {
    $x: $i * $epic-tooth-width;
    $points: list.append($points, $x 100%, comma);
    $points: list.append(
      $points,
      ($x - $epic-tooth-width * 0.5) calc(100% - #{$epic-tooth-height}),
      comma
    );
  }
  @return polygon(list.append($points, 0 100%, comma));
}

@mixin mask($value) {
  -webkit-mask: $value;
  mask: $value;
}

.card {
  display: flex;
  flex: 1;
  flex-direction: column;
  // A minimum: no `overflow: hidden` here, so a longer text grows the card instead of being cut
  aspect-ratio: 333 / 466;
  padding: 12px;
  border-radius: var(--radius-card);
  background:
    var(--rarity-texture) 0 0 / 48px repeat,
    var(--rarity-border);
  box-shadow: var(--rarity-glow);

  &[data-rarity='legendary'],
  &[data-rarity='goat'] {
    background-blend-mode: screen, normal;
  }

  &__illustration {
    flex-shrink: 0;
    height: 200px;
    overflow: hidden;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &[data-rarity='uncommon'] &__illustration {
    clip-path: polygon(
      $uncommon-bevel 0,
      calc(100% - #{$uncommon-bevel}) 0,
      100% $uncommon-bevel,
      100% 100%,
      0 100%,
      0 $uncommon-bevel
    );
  }

  &[data-rarity='rare'] &__illustration {
    @include mask(
      (
        radial-gradient(circle $rare-notch at 0 0, #0000 98%, #000) left / 51% 100% no-repeat,
        radial-gradient(circle $rare-notch at 100% 0, #0000 98%, #000) right / 51% 100% no-repeat
      )
    );
  }

  &[data-rarity='epic'] &__illustration {
    clip-path: epic-polygon();
  }

  // TODO(design): « Goated » has no frame of its own yet, it borrows the legendary arch
  &[data-rarity='legendary'] &__illustration,
  &[data-rarity='goat'] &__illustration {
    @include mask(
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 309 200' preserveAspectRatio='none'%3E%3Cpath d='#{$legendary-arch}'/%3E%3C/svg%3E")
        0 0 / 100% 100% no-repeat
    );
  }
}
</style>
