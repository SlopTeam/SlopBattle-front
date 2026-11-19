import type { Card as ApiCard } from '@/api/cards'
import { RARITIES, type Rarity } from '@/constants/rarity'
import type { Card } from '@/types/card'

// TODO(back): rarity contract (B2). Assumed mapping, the same as the back office:
// rarityId 1..6 = common..goat (Mid..Goated)
/** Rarity code of a back `rarityId`; an unknown id falls back to `common` */
export function toRarity(rarityId: number): Rarity {
  return RARITIES[rarityId - 1] ?? 'common'
}

/** Back `rarityId` of a rarity code, the inverse of `toRarity` */
export function toRarityId(rarity: Rarity): number {
  return RARITIES.indexOf(rarity) + 1
}

/** UI card from an API card */
export function toCard(card: ApiCard): Card {
  return {
    id: Number(card.id),
    name: card.title,
    rarity: toRarity(card.rarityId),
    types: card.types.map((type) => type.name),
    description: card.description ?? '',
    // TODO(back): the back has no card set yet (B8)
    set: '',
    categories: card.categories.map((category) => category.name),
    createdAt: card.createdAt.slice(0, 10),
    illustration: card.imageUrl,
  }
}
