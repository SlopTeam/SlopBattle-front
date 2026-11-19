import { gql, type GqlOptions } from './client'
import type {
  CardFieldsFragment,
  GetCardQuery,
  GetCardQueryVariables,
  CardSort,
  GetCardsPageQuery,
  GetCardsPageQueryVariables,
  GetCardsQuery,
  GetCardsQueryVariables,
} from './generated/graphql'

export type { CardSort }

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
  /** Case-insensitive part of the title */
  search?: string
  rarityId?: number
  categoryIds?: string[]
  typeIds?: string[]
}

// The filter expects Int ids while the API returns them as strings
function toFilterInput(filter?: CardsFilter) {
  return (
    filter && {
      ...filter,
      categoryIds: filter.categoryIds?.map(Number),
      typeIds: filter.typeIds?.map(Number),
    }
  )
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
    { filter: toFilterInput(filter) } satisfies GetCardsQueryVariables,
  ).then((d) => d.cards)

export interface CardsPageParams {
  filter?: CardsFilter
  /** 1-based */
  page: number
  /** The back clamps it to 1..100 */
  pageSize: number
  sort: CardSort
}

/** One page of cards matching the filter, with the total count (token required) */
export const getCardsPage = (params: CardsPageParams, options?: GqlOptions) =>
  gql<GetCardsPageQuery>(
    /* GraphQL */ `
      ${CARD_FIELDS}
      query GetCardsPage(
        $filter: CardsFilterInput
        $page: Int!
        $pageSize: Int!
        $sort: CardSort!
      ) {
        cardsPage(filter: $filter, page: $page, pageSize: $pageSize, sort: $sort) {
          items {
            ...CardFields
          }
          total
          page
          pageCount
        }
      }
    `,
    { ...params, filter: toFilterInput(params.filter) } satisfies GetCardsPageQueryVariables,
    options,
  ).then((d) => d.cardsPage)

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
