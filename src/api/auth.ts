import { gql } from '@/api/client'
import type { User } from '@/types/user'

export interface Credentials {
  email: string
  password: string
}

/** Fields of the back-end `UpdateUserProfileInput` */
export interface UpdateProfileInput {
  username?: string
}

interface TokenResponse {
  access_token: string
}

// `id` may come as a GraphQL ID (string), so it is normalized by `toUser`
type RawUser = Omit<User, 'id'> & { id: number | string }

function toUser(raw: RawUser): User {
  return { ...raw, id: Number(raw.id) }
}

const PROFILE_FIELDS = 'id email username avatarUrl coins createdAt'

export async function login(input: Credentials): Promise<string> {
  const data = await gql<{ login: TokenResponse }>(
    `mutation Login($input: LoginInput!) {
      login(input: $input) { access_token }
    }`,
    { input },
    // A token left in storage must not be sent: its rejection would read as an expired session
    { token: null },
  )
  return data.login.access_token
}

export async function register(input: Credentials): Promise<string> {
  const data = await gql<{ register: TokenResponse }>(
    `mutation Register($input: RegisterInput!) {
      register(input: $input) { access_token }
    }`,
    { input },
    { token: null },
  )
  return data.register.access_token
}

/** Profile of the owner of the token; `token` overrides the stored one (Google callback) */
export async function fetchMyProfile(token?: string): Promise<User> {
  const data = await gql<{ myProfile: RawUser }>(
    `query { myProfile { ${PROFILE_FIELDS} } }`,
    undefined,
    { token },
  )
  return toUser(data.myProfile)
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<void> {
  await gql(
    `mutation UpdateMyProfile($input: UpdateUserProfileInput!) {
      updateMyProfile(input: $input) { id }
    }`,
    { input },
  )
}
