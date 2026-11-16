import { getToken } from '@/api/token'

interface GraphQLErrorPayload {
  message: string
  extensions?: {
    code?: string
    originalError?: { message?: string | string[]; statusCode?: number }
  }
}

interface GraphQLResponse<T> {
  data?: T | null
  errors?: GraphQLErrorPayload[]
}

/** Failure of an API call; `message` comes from the back-end when available */
export class ApiError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === 'UNAUTHENTICATED'
  }
}

let unauthorizedHandler: (() => void) | null = null

/** Called when a request sent with a token is rejected (expired or invalid token) */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function toApiError(error: GraphQLErrorPayload, status: number): ApiError {
  const original = error.extensions?.originalError
  const detail = Array.isArray(original?.message) ? original.message[0] : original?.message
  return new ApiError(detail ?? error.message, {
    code: error.extensions?.code,
    status: original?.statusCode ?? status,
  })
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<T> {
  const token = options.token ?? getToken()

  let response: Response
  try {
    response = await fetch(import.meta.env.VITE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Réessaie dans un instant.')
  }

  let payload: GraphQLResponse<T> | null = null
  try {
    payload = (await response.json()) as GraphQLResponse<T>
  } catch {
    // Non-JSON body: handled below through the HTTP status
  }

  const firstError = payload?.errors?.[0]
  if (firstError || !response.ok || !payload?.data) {
    const error = firstError
      ? toApiError(firstError, response.status)
      : new ApiError('Une erreur est survenue. Réessaie dans un instant.', {
          status: response.status,
        })
    if (token && error.isUnauthorized) {
      unauthorizedHandler?.()
    }
    throw error
  }

  return payload.data
}
