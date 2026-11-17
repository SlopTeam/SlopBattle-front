import axios, { type AxiosResponse } from 'axios'
import { getToken } from '@/api/token'

/**
 * URL of a back-end route, for full page navigations such as the Google sign-in. The back is
 * always reached on the front's own origin: the Vite proxy forwards it in dev, nginx in Docker.
 */
export function apiUrl(path: string): string {
  return path
}

const http = axios.create({
  timeout: 15_000,
  // A timeout gets its own code (ETIMEDOUT), distinct from a request aborted by the browser
  transitional: { clarifyTimeoutError: true },
  // We read the body ourselves: the back sends its GraphQL errors with a 200 or a 400
  validateStatus: () => true,
})

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

/** Failure of an API call; `message` comes from the back-end when available, and can be shown as is */
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

// Nest puts the HTTP exception in `originalError`; a validation error carries a list of messages
function toApiError(error: GraphQLErrorPayload, status: number): ApiError {
  const original = error.extensions?.originalError
  const detail = Array.isArray(original?.message) ? original.message[0] : original?.message
  return new ApiError(detail ?? error.message, {
    code: error.extensions?.code,
    status: original?.statusCode ?? status,
  })
}

function isTimeout(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'ETIMEDOUT'
}

export interface GqlOptions {
  /** Token to send instead of the stored one; `null` sends the request without a token */
  token?: string | null
  /** Cancels the request; the rejection is then the original cancellation error, not an ApiError */
  signal?: AbortSignal
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: GqlOptions = {},
): Promise<T> {
  const token = options.token === undefined ? getToken() : options.token

  let res: AxiosResponse<unknown>
  try {
    res = await http.post<unknown>(
      '/graphql',
      { query, variables },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: options.signal,
      },
    )
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(
      isTimeout(error)
        ? 'Le serveur met trop de temps à répondre. Réessayez dans un instant.'
        : 'Impossible de joindre le serveur. Réessayez dans un instant.',
    )
  }

  // axios leaves a non-JSON body (proxy error page…) as a string
  const payload =
    typeof res.data === 'object' && res.data !== null ? (res.data as GraphQLResponse<T>) : null
  const firstError = payload?.errors?.[0]
  const ok = res.status >= 200 && res.status < 300

  if (firstError || !ok || !payload?.data) {
    const error = firstError
      ? toApiError(firstError, res.status)
      : new ApiError('Une erreur est survenue, réessayez.', { status: res.status })
    // Without a token, a 401 is a refused login, not an expired session
    if (token && error.isUnauthorized) {
      unauthorizedHandler?.()
    }
    throw error
  }

  return payload.data
}
