import { gql } from './client'
import type { GetRaritiesQuery } from './generated/graphql'

export type ApiRarity = GetRaritiesQuery['rarities'][number]

/** All rarities, from the most common to the rarest (the back sorts them by `sortOrder`) */
export const getRarities = () =>
  gql<GetRaritiesQuery>(/* GraphQL */ `
    query GetRarities {
      rarities {
        id
        name
        sortOrder
      }
    }
  `).then((d) => d.rarities)
