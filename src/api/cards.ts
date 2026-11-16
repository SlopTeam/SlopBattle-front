import { gql } from './client'
import type { Category } from './categories'
import type { CardType } from './cardTypes'

/** Card as returned by the back (Card entity of SlopBattle-back) */
export interface Card {
  id: string // GraphQL always serializes an ID as a string
  title: string
  description: string | null
  imageUrl: string
  rarityId: number
  categories: Category[]
  types: CardType[]
  createdAt: string // ISO date
  updatedAt: string
}

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
  gql<{ cards: Card[] }>(
    /* GraphQL */ `
      ${CARD_FIELDS}
      query ($filter: CardsFilterInput) {
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
    },
  ).then((d) => d.cards)

export const getCard = (id: string) =>
  gql<{ card: Card }>(
    /* GraphQL */ `
      ${CARD_FIELDS}
      query ($id: ID!) {
        card(id: $id) {
          ...CardFields
        }
      }
    `,
    { id },
  ).then((d) => d.card)
