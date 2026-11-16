import { gql } from './client'

export interface Category {
  id: string
  name: string
}

export const getCategories = () =>
  gql<{ categories: Category[] }>(/* GraphQL */ `
    {
      categories {
        id
        name
      }
    }
  `).then((d) => d.categories)
