import { useRoute, useRouter } from 'vue-router'

const REMEMBERED_KEY = 'slop-battle:auth-redirect'

function toInternalPath(value: unknown): string | null {
  // Internal paths only: `//evil.com` would be an open redirect
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : null
}

/** Keeps the target across an external round trip (Google) that loses the query string */
export function rememberRedirect(value: unknown): void {
  const path = toInternalPath(value)
  if (path) sessionStorage.setItem(REMEMBERED_KEY, path)
  else sessionStorage.removeItem(REMEMBERED_KEY)
}

export function takeRememberedRedirect(): string | null {
  const path = toInternalPath(sessionStorage.getItem(REMEMBERED_KEY))
  sessionStorage.removeItem(REMEMBERED_KEY)
  return path
}

/** After login or register, go back to the page that required auth (`?redirect=`), else home */
export function useAuthRedirect() {
  const route = useRoute()
  const router = useRouter()

  return function redirectAfterAuth(fallback?: string | null) {
    const target = toInternalPath(route.query.redirect) ?? toInternalPath(fallback)
    return router.replace(target ?? { name: 'home' })
  }
}
