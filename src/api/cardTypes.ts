import { gql } from './client'

export interface CardType {
  id: string
  name: string
}

export const getCardTypes = () =>
  gql<{ cardTypes: CardType[] }>(/* GraphQL */ `
    {
      cardTypes {
        id
        name
      }
    }
  `).then((d) => d.cardTypes)
