import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setToken } from '@/api/token'

type Client = typeof import('@/api/client')
type PostConfig = { headers: Record<string, string>; signal?: AbortSignal }
type CreateConfig = {
  baseURL?: string
  timeout?: number
  validateStatus?: (status: number) => boolean
  transitional?: { clarifyTimeoutError?: boolean }
}

const { post, creations } = vi.hoisted(() => ({
  post: vi.fn<(url: string, body: unknown, config: PostConfig) => Promise<unknown>>(),
  creations: [] as CreateConfig[],
}))

vi.mock('axios', () => ({
  default: {
    create: (config: CreateConfig) => {
      creations.push(config)
      return { post }
    },
  },
}))

/** Fresh client module for a given VITE_BACKEND_URL, so the local .env never leaks into the tests */
async function loadClient(backendUrl = ''): Promise<Client> {
  vi.stubEnv('VITE_BACKEND_URL', backendUrl)
  vi.resetModules()
  return import('@/api/client')
}

/** Config of the axios instance created by the last loaded client */
function lastCreation(): CreateConfig | undefined {
  return creations[creations.length - 1]
}

function respond(data: unknown, status = 200) {
  post.mockResolvedValueOnce({ status, data })
}

function sentHeaders() {
  return post.mock.lastCall?.[2].headers
}

const unauthenticated = {
  errors: [
    {
      message: 'Unauthorized',
      extensions: {
        code: 'UNAUTHENTICATED',
        originalError: { message: 'Unauthorized', statusCode: 401 },
      },
    },
  ],
}

let client: Client

beforeEach(async () => {
  localStorage.clear()
  post.mockReset()
  client = await loadClient()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('http instance', () => {
  it('calls /graphql on the same origin by default', async () => {
    respond({ data: { hello: 'world' } })
    await client.gql('{ hello }', { a: 1 })

    expect(lastCreation()?.baseURL).toBe('')
    expect(post.mock.lastCall?.[0]).toBe('/graphql')
    expect(post.mock.lastCall?.[1]).toEqual({ query: '{ hello }', variables: { a: 1 } })
  })

  it('targets VITE_BACKEND_URL when set, without doubling the slash', async () => {
    client = await loadClient('https://api.test/')
    expect(lastCreation()?.baseURL).toBe('https://api.test')
  })

  it('lets every HTTP status through, so GraphQL errors sent with a 400 can be read', () => {
    expect(lastCreation()?.validateStatus?.(400)).toBe(true)
    expect(lastCreation()?.validateStatus?.(500)).toBe(true)
  })

  it('gives up after a timeout, reported with its own error code', () => {
    expect(lastCreation()?.timeout).toBeGreaterThan(0)
    expect(lastCreation()?.transitional?.clarifyTimeoutError).toBe(true)
  })
})

describe('gql', () => {
  it('returns data on success', async () => {
    respond({ data: { cards: [] } })
    await expect(client.gql('{ cards { id } }')).resolves.toEqual({ cards: [] })
  })

  it('sends the stored token as Bearer, and no header without one', async () => {
    respond({ data: {} })
    await client.gql('{ a }')
    expect(sentHeaders()).toEqual({})

    setToken('stored')
    respond({ data: {} })
    await client.gql('{ a }')
    expect(sentHeaders()).toEqual({ Authorization: 'Bearer stored' })
  })

  it('sends the token given to the call instead of the stored one, or none with null', async () => {
    setToken('stored')

    respond({ data: {} })
    await client.gql('{ a }', undefined, { token: 'from-google' })
    expect(sentHeaders()).toEqual({ Authorization: 'Bearer from-google' })

    respond({ data: {} })
    await client.gql('{ a }', undefined, { token: null })
    expect(sentHeaders()).toEqual({})
  })

  it('throws the first message of a Nest validation error, with its code and status', async () => {
    respond({
      errors: [
        {
          message: 'Bad Request Exception',
          extensions: {
            code: 'BAD_REQUEST',
            originalError: { message: ['email must be an email', 'other'], statusCode: 400 },
          },
        },
      ],
    })

    const error = await client.gql('{ a }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(client.ApiError)
    expect(error).toMatchObject({
      message: 'email must be an email',
      code: 'BAD_REQUEST',
      status: 400,
    })
  })

  it('falls back to the GraphQL message and the HTTP status', async () => {
    respond({ errors: [{ message: 'Cannot query field "x"' }] }, 400)
    await expect(client.gql('{ x }')).rejects.toMatchObject({
      message: 'Cannot query field "x"',
      status: 400,
    })
  })

  it('throws a readable error when the response is not GraphQL', async () => {
    respond('<html>Bad Gateway</html>', 502)
    const error = await client.gql('{ a }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(client.ApiError)
    expect(error).toMatchObject({
      message: 'Une erreur est survenue, réessayez.',
      status: 502,
    })
  })

  it('throws when a successful response has no data', async () => {
    respond({ data: null })
    await expect(client.gql('{ a }')).rejects.toBeInstanceOf(client.ApiError)
  })

  it('turns a network failure into a readable ApiError', async () => {
    post.mockRejectedValueOnce(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }))
    const error = await client.gql('{ a }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(client.ApiError)
    expect((error as Error).message).toBe(
      'Impossible de joindre le serveur. Réessayez dans un instant.',
    )
  })

  it('turns a timeout into a readable ApiError', async () => {
    post.mockRejectedValueOnce(
      Object.assign(new Error('timeout of 15000ms exceeded'), { code: 'ETIMEDOUT' }),
    )
    const error = await client.gql('{ a }').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(client.ApiError)
    expect((error as Error).message).toBe(
      'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
    )
  })

  it('treats a request aborted by the browser as unreachable, not as a timeout', async () => {
    post.mockRejectedValueOnce(
      Object.assign(new Error('Request aborted'), { code: 'ECONNABORTED' }),
    )
    await expect(client.gql('{ a }')).rejects.toThrow('Impossible de joindre le serveur.')
  })

  it('passes the abort signal and rethrows a cancellation as is', async () => {
    const controller = new AbortController()
    const canceled = Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' })
    post.mockImplementationOnce(async () => {
      controller.abort()
      throw canceled
    })

    await expect(client.gql('{ a }', undefined, { signal: controller.signal })).rejects.toBe(
      canceled,
    )
    expect(post.mock.lastCall?.[2].signal).toBe(controller.signal)
  })
})

describe('unauthorized handler', () => {
  let handler: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    handler = vi.fn<() => void>()
    client.setUnauthorizedHandler(handler)
  })

  it('is called when the stored token is rejected, by code or by HTTP status', async () => {
    setToken('expired')

    respond(unauthenticated)
    const error = await client.gql('{ a }').catch((e: unknown) => e)
    expect((error as InstanceType<Client['ApiError']>).isUnauthorized).toBe(true)
    expect(handler).toHaveBeenCalledOnce()

    respond('Unauthorized', 401)
    await client.gql('{ a }').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('is not called for a 401 when no token is stored', async () => {
    respond(unauthenticated)
    await expect(client.gql('{ a }')).rejects.toMatchObject({ status: 401 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('is not called for a 401 when the call explicitly sends no token (refused login)', async () => {
    setToken('stored')
    respond(unauthenticated)
    await expect(client.gql('{ a }', undefined, { token: null })).rejects.toMatchObject({
      status: 401,
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('is not called for another error sent with a valid token', async () => {
    setToken('valid')
    respond({
      errors: [
        {
          message: 'Conflict',
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            originalError: { message: 'Ce pseudo est déjà utilisé', statusCode: 409 },
          },
        },
      ],
    })
    await expect(client.gql('{ a }')).rejects.toMatchObject({ status: 409 })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('apiUrl', () => {
  it('stays on the same origin by default', () => {
    expect(client.apiUrl('/auth/google')).toBe('/auth/google')
  })

  it('prefixes VITE_BACKEND_URL, without doubling the slash', async () => {
    client = await loadClient('https://api.test/')
    expect(client.apiUrl('/auth/google')).toBe('https://api.test/auth/google')
  })

  it('drops a /graphql copied from the former VITE_API_URL, and warns in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('DEV', true)
    try {
      for (const value of ['http://localhost:3000/graphql', 'http://localhost:3000/graphql/']) {
        client = await loadClient(value)
        expect(client.apiUrl('/auth/google')).toBe('http://localhost:3000/auth/google')
        expect(lastCreation()?.baseURL).toBe('http://localhost:3000')
      }
      expect(warn).toHaveBeenCalledTimes(2)
    } finally {
      warn.mockRestore()
    }
  })

  it('keeps a root that merely contains "graphql", without warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      client = await loadClient('https://graphql.example.com/api')
      expect(client.apiUrl('/auth/google')).toBe('https://graphql.example.com/api/auth/google')
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})
