import { gql } from './client'
import type { GetCardTypesQuery } from './generated/graphql'

export type CardType = GetCardTypesQuery['cardTypes'][number]

export const getCardTypes = () =>
  gql<GetCardTypesQuery>(/* GraphQL */ `
    query GetCardTypes {
      cardTypes {
        id
        name
      }
    }
  `).then((d) => d.cardTypes)
