import { gql } from './client'
import type {
  CardFieldsFragment,
  GetCardQuery,
  GetCardQueryVariables,
  GetCardsQuery,
  GetCardsQueryVariables,
} from './generated/graphql'

/** Card as returned by the back (Card entity of SlopBattle-back) */
export type Card = CardFieldsFragment

const CARD_FIELDS = /* GraphQL */ `
  fragment CardFields on Card {
    id
    title
    description
    imageUrl
    rarityId
    createdAt
    updatedAt
    categories {
      id
      name
    }
    types {
      id
      name
    }
  }
`

/** Values inside one field are OR-ed, different fields are AND-ed (back rule) */
export interface CardsFilter {
  rarityId?: number
  categoryIds?: string[]
  typeIds?: string[]
}

export const getCards = (filter?: CardsFilter) =>
  gql<GetCardsQuery>(
    /* GraphQL */ `
      ${CARD_FIELDS}
      query GetCards($filter: CardsFilterInput) {
        cards(filter: $filter) {
          ...CardFields
        }
      }
    `,
    {
      // The filter expects Int ids while the API returns them as strings
      filter: filter && {
        ...filter,
        categoryIds: filter.categoryIds?.map(Number),
        typeIds: filter.typeIds?.map(Number),
      },
    } satisfies GetCardsQueryVariables,
  ).then((d) => d.cards)

export const getCard = (id: string) =>
  gql<GetCardQuery>(
    /* GraphQL */ `
      ${CARD_FIELDS}
      query GetCard($id: ID!) {
        card(id: $id) {
          ...CardFields
        }
      }
    `,
    { id } satisfies GetCardQueryVariables,
  ).then((d) => d.card)
