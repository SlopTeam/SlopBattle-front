import type { Rarity } from '@/constants/rarity'

export interface Card {
  id: number
  name: string
  rarity: Rarity
  /** Gameplay types, e.g. « Créature », « Feu » */
  types: string[]
  description: string
  set: string
  /** Season and theme tags shown at the bottom of the card */
  categories: string[]
  /** ISO date (YYYY-MM-DD) */
  createdAt: string
  illustration: string
}
