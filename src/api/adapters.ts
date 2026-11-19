import type { Card as ApiCard } from '@/api/cards'
import type { ApiRarity } from '@/api/rarities'
import { RARITIES, type Rarity } from '@/constants/rarity'
import type { Card } from '@/types/card'

// TODO(back): rarity contract (B2). Assumed: the n-th rarity of `rarities` (sorted by
// sortOrder, the most common first) takes the n-th visual style, common..goat
/**
 * Rarity code (icon, colours) of a back rarity, from its rank in `rarities`.
 * An unknown rarity, or one past the sixth, falls back to `common`, the plainest style.
 */
export function toRarity(id: string, rarities: readonly ApiRarity[]): Rarity {
  return RARITIES[rarities.findIndex((rarity) => rarity.id === id)] ?? 'common'
}

/** UI card from an API card; `rarities` is the list from `getRarities()` */
export function toCard(card: ApiCard, rarities: readonly ApiRarity[]): Card {
  return {
    id: Number(card.id),
    name: card.title,
    rarity: toRarity(card.rarity.id, rarities),
    types: card.types.map((type) => type.name),
    description: card.description ?? '',
    // TODO(back): the back has no card set yet (B8)
    set: '',
    categories: card.categories.map((category) => category.name),
    createdAt: card.createdAt.slice(0, 10),
    illustration: card.imageUrl,
  }
}
