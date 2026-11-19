/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
export type CardSort = 'NEWEST' | 'RARITY_DESC' | 'TITLE_ASC' | 'TITLE_DESC'

export type CardsFilterInput = {
  categoryIds?: Array<number> | null | undefined
  rarityId?: number | null | undefined
  /** Case-insensitive substring of the title */
  search?: string | null | undefined
  typeIds?: Array<number> | null | undefined
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type UpdateUserProfileInput = {
  avatarUrl?: string | null | undefined
  username?: string | null | undefined
}

export type LoginMutationVariables = Exact<{
  input: LoginInput
}>

export type LoginMutation = { login: { access_token: string } }

export type RegisterMutationVariables = Exact<{
  input: RegisterInput
}>

export type RegisterMutation = { register: { access_token: string } }

export type GetMyProfileQueryVariables = Exact<{ [key: string]: never }>

export type GetMyProfileQuery = {
  myProfile: {
    id: number
    email: string
    username: string | null
    avatarUrl: string | null
    coins: number
    createdAt: string
  }
}

export type UpdateMyProfileMutationVariables = Exact<{
  input: UpdateUserProfileInput
}>

export type UpdateMyProfileMutation = { updateMyProfile: { id: number } }

export type GetCardTypesQueryVariables = Exact<{ [key: string]: never }>

export type GetCardTypesQuery = { cardTypes: Array<{ id: string; name: string }> }

export type CardFieldsFragment = {
  id: string
  title: string
  description: string | null
  imageUrl: string
  rarityId: number
  createdAt: string
  updatedAt: string
  categories: Array<{ id: string; name: string }>
  types: Array<{ id: string; name: string }>
}

export type GetCardsQueryVariables = Exact<{
  filter?: CardsFilterInput | null | undefined
}>

export type GetCardsQuery = {
  cards: Array<{
    id: string
    title: string
    description: string | null
    imageUrl: string
    rarityId: number
    createdAt: string
    updatedAt: string
    categories: Array<{ id: string; name: string }>
    types: Array<{ id: string; name: string }>
  }>
}

export type GetCardsPageQueryVariables = Exact<{
  filter?: CardsFilterInput | null | undefined
  page: number
  pageSize: number
  sort: CardSort
}>

export type GetCardsPageQuery = {
  cardsPage: {
    total: number
    page: number
    pageCount: number
    items: Array<{
      id: string
      title: string
      description: string | null
      imageUrl: string
      rarityId: number
      createdAt: string
      updatedAt: string
      categories: Array<{ id: string; name: string }>
      types: Array<{ id: string; name: string }>
    }>
  }
}

export type GetCardQueryVariables = Exact<{
  id: string
}>

export type GetCardQuery = {
  card: {
    id: string
    title: string
    description: string | null
    imageUrl: string
    rarityId: number
    createdAt: string
    updatedAt: string
    categories: Array<{ id: string; name: string }>
    types: Array<{ id: string; name: string }>
  }
}

export type GetCategoriesQueryVariables = Exact<{ [key: string]: never }>

export type GetCategoriesQuery = { categories: Array<{ id: string; name: string }> }
