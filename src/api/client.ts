import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // We read the body ourselves: the back sends its GraphQL errors with a 200 or a 400
  validateStatus: () => true,
})

export const TOKEN_KEY = 'token'

// The upcoming auth system will store the token under this key; here we only send it
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface GqlResponse<T> {
  data?: T | null
  errors?: { message: string }[]
}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await http.post<GqlResponse<T> | undefined>('/graphql', { query, variables })
  const body = res.data

  if (body?.errors?.length) throw new Error(body.errors.map((e) => e.message).join(', '))
  if (!body?.data) throw new Error(`Réponse invalide du serveur (HTTP ${res.status})`)

  return body.data
}
