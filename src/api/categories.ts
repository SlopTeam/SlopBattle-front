import { gql } from './client'
import type { GetCategoriesQuery } from './generated/graphql'

export type Category = GetCategoriesQuery['categories'][number]

export const getCategories = () =>
  gql<GetCategoriesQuery>(/* GraphQL */ `
    query GetCategories {
      categories {
        id
        name
      }
    }
  `).then((d) => d.categories)
