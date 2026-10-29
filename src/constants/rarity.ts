/** Dev codes, from the most common to the rarest */
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'goat'] as const

export type Rarity = (typeof RARITIES)[number]

/** Names shown to the user */
export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Mid',
  uncommon: 'Based',
  rare: 'Sigma',
  epic: 'Chad',
  legendary: 'Ascended',
  goat: 'Goated',
}
