import { gql } from '@/api/client'
import type {
  GetMyProfileQuery,
  LoginMutation,
  LoginMutationVariables,
  RegisterMutation,
  RegisterMutationVariables,
  UpdateMyProfileMutation,
  UpdateMyProfileMutationVariables,
} from '@/api/generated/graphql'
import type { User } from '@/types/user'

const LOGIN = /* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
    }
  }
`

const REGISTER = /* GraphQL */ `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      access_token
    }
  }
`

const GET_MY_PROFILE = /* GraphQL */ `
  query GetMyProfile {
    myProfile {
      id
      email
      username
      avatarUrl
      coins
      createdAt
    }
  }
`

const UPDATE_MY_PROFILE = /* GraphQL */ `
  mutation UpdateMyProfile($input: UpdateUserProfileInput!) {
    updateMyProfile(input: $input) {
      id
    }
  }
`

export async function login(input: LoginMutationVariables['input']): Promise<string> {
  // A token left in storage must not be sent: its rejection would read as an expired session
  const data = await gql<LoginMutation>(LOGIN, { input }, { token: null })
  return data.login.access_token
}

export async function register(input: RegisterMutationVariables['input']): Promise<string> {
  const data = await gql<RegisterMutation>(REGISTER, { input }, { token: null })
  return data.register.access_token
}

/** Profile of the owner of the token; `token` overrides the stored one (Google callback) */
export async function fetchMyProfile(token?: string): Promise<User> {
  const data = await gql<GetMyProfileQuery>(GET_MY_PROFILE, undefined, { token })
  return data.myProfile
}

export async function updateMyProfile(
  input: UpdateMyProfileMutationVariables['input'],
): Promise<void> {
  await gql<UpdateMyProfileMutation>(UPDATE_MY_PROFILE, { input })
}
