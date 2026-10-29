import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // On lit le corps de la réponse nous-mêmes : le back renvoie ses erreurs en 200 ou en 400
  validateStatus: () => true,
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
