import { useRoute, useRouter } from 'vue-router'

/** After login or register, go back to the page that required auth (`?redirect=`), else home */
export function useAuthRedirect() {
  const route = useRoute()
  const router = useRouter()

  return function redirectAfterAuth() {
    const redirect = route.query.redirect
    // Internal paths only: `//evil.com` would be an open redirect
    const isInternal =
      typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    return router.replace(isInternal ? redirect : { name: 'home' })
  }
}
