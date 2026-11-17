# Recipes

Step-by-step templates for the most common tasks. Read [AGENTS.md](../../AGENTS.md) first. Each recipe
ends with the [Definition of done](../../AGENTS.md#definition-of-done). Files marked "to create" don't
exist yet.

## Add a page (route + view)

1. If the page already has a placeholder view ([AGENTS.md › Routes](../../AGENTS.md#routes)), build it
   there and keep its route. Otherwise create `src/views/<domain>/<Name>View.vue`. Domains:

   | Domain       | Holds                                           |
   | ------------ | ----------------------------------------------- |
   | `auth`       | login, register, Google callback, pseudo choice |
   | `account`    | profile, settings                               |
   | `collection` | catalogue, Ma collection                        |
   | `game`       | boosters, and later quests and battles          |
   | `system`     | coming soon, maintenance, not found             |

   ```vue
   <template>
     <section class="trade-list">
       <h1 class="trade-list__title">Échanges</h1>
     </section>
   </template>

   <script setup lang="ts">
   // imports, then state, then functions
   </script>

   <style scoped lang="scss">
   .trade-list {
     padding: 32px;

     &__title {
       margin: 0;
       font-size: 28px;
       font-weight: var(--font-weight-bold);
     }
   }
   </style>
   ```

2. Register the route in `src/router/index.ts`, **before** the `// System` block. The path is English
   and kebab-case, and the name is snake_case:

   ```ts
   {
     path: '/trades',
     name: 'trade_list',
     component: () => import('@/views/game/TradeListView.vue'),
     meta: { requiresAuth: true }, // only if the page needs a logged-in user
   },
   ```

   If the request doesn't say whether the page needs a logged-in user, ask.

3. Link to it by name: `<router-link :to="{ name: 'trade_list' }">Échanges</router-link>`. In code,
   use `router.push({ name: 'trade_list' })`.
4. Add it to `HeaderComponent.vue` only if the request asks for a header entry.

## Add a back-end call

1. Check that the operation exists in the back's schema: see the schema tables in [api.md](api.md).
   If it doesn't exist, stop and write a back request.
2. Add the function to `src/api/<resource>.ts`, or create the module. API functions take ids as the API
   returns them (strings). Convert them with `Number()` only for `Int` inputs (`cardIds`,
   `categoryIds`, `typeIds`); pass `ID!` arguments such as `card(id)` as is. Template
   (`src/api/collection.ts`, to create):

   ```ts
   import { gql } from '@/api/client'

   /** One owned card, as returned by `myCardCollection`: card details come from `getCards` */
   export interface CollectionEntry {
     /** GraphQL always serializes an ID as a string */
     cardId: string
     quantity: number
     /** ISO timestamp */
     firstObtainedAt: string
   }

   /** Cards owned by the logged-in user (the back requires a token) */
   export const getMyCardCollection = () =>
     gql<{ myCardCollection: { cards: CollectionEntry[] } }>(/* GraphQL */ `
       query GetMyCardCollection {
         myCardCollection {
           cards {
             cardId
             quantity
             firstObtainedAt
           }
         }
       }
     `).then((d) => d.myCardCollection.cards)

   /** Adds one copy of each card to the collection of the logged-in user (the back requires a token) */
   export const addCardsInCollection = (cardIds: string[]) =>
     gql<{ addCardsInCollection: { id: string; quantity: number }[] }>(
       /* GraphQL */ `
         mutation AddCardsInCollection($input: UpdateUserCardsInput!) {
           addCardsInCollection(input: $input) {
             id
             quantity
           }
         }
       `,
       // The input expects Int ids while the API returns them as strings
       { input: { cardIds: cardIds.map(Number) } },
     ).then((d) => d.addCardsInCollection)
   ```

3. Test it in `src/api/__tests__/collection.spec.ts`. Mock `@/api/client`, then check what is returned
   and the variables sent:

   ```ts
   import { describe, expect, it, vi } from 'vitest'
   import { addCardsInCollection, getMyCardCollection } from '@/api/collection'

   const { gql } = vi.hoisted(() => ({
     gql: vi.fn<(query: string, variables?: Record<string, unknown>) => Promise<unknown>>(),
   }))

   vi.mock('@/api/client', () => ({ gql }))

   describe('getMyCardCollection', () => {
     it('returns the owned cards', async () => {
       const cards = [{ cardId: '7', quantity: 2, firstObtainedAt: '2026-11-01T10:00:00.000Z' }]
       gql.mockResolvedValueOnce({ myCardCollection: { cards } })
       await expect(getMyCardCollection()).resolves.toEqual(cards)
     })
   })

   describe('addCardsInCollection', () => {
     it('sends the card ids as numbers, as the back expects', async () => {
       gql.mockResolvedValueOnce({ addCardsInCollection: [{ id: '1', quantity: 1 }] })
       await expect(addCardsInCollection(['7', '8'])).resolves.toEqual([{ id: '1', quantity: 1 }])
       expect(gql.mock.lastCall?.[1]).toEqual({ input: { cardIds: [7, 8] } })
     })
   })
   ```

4. Check the document against the real schema:
   - with a local back, read the type's fields with the introspection `curl` in
     [api.md](api.md#back-end-schema-back-develop-read-only-reference);
   - without one, compare it with the tables in [api.md](api.md) and write « Non testé contre le back »
     in the PR's Tests section.

## Show back-end data in a view

1. Convert API shapes to UI shapes in `src/api/adapters.ts` (to create), with pure `to<UiType>()`
   functions, never in a component. For cards, don't invent the two unknowns: `toRarity()` and
   `toSet()` hold the mappings a human gave you (see AGENTS.md › Domain notes), and `toCard()` calls
   them. Until you have them, keep the throwing placeholders below and say what is blocked.

   ```ts
   import type { Card as ApiCard } from '@/api/cards'
   import type { Rarity } from '@/constants/rarity'
   import type { Card } from '@/types/card'

   /** Rarity code of a back `rarityId` */
   export function toRarity(rarityId: number): Rarity {
     // TODO(back): rarity contract (B2). Replace with the mapping a human gave you, and ask what an
     // unknown id does.
     throw new Error(`No rarity mapping for ${rarityId}`)
   }

   /** Edition (« Édition » filter) of a card */
   export function toSet(card: ApiCard): string {
     // TODO(back): card set (B8). Replace with the rule a human gave you.
     throw new Error(`No set rule for card ${card.id}`)
   }

   /** UI card from an API card */
   export function toCard(card: ApiCard): Card {
     return {
       id: Number(card.id),
       name: card.title,
       rarity: toRarity(card.rarityId),
       types: card.types.map((type) => type.name),
       description: card.description ?? '',
       set: toSet(card),
       categories: card.categories.map((category) => category.name),
       createdAt: card.createdAt.slice(0, 10),
       illustration: card.imageUrl,
     }
   }
   ```

2. Load the data with `useApi` and a request function that turns every error into a French message,
   so `error` is safe to display:

   ```vue
   <template>
     <section class="category-list">
       <p v-if="loading" role="status">Chargement…</p>
       <BaseAlert v-else-if="error" :message="error" />
       <ul v-else-if="data" class="category-list__items">
         <li v-for="name in data" :key="name">{{ name }}</li>
       </ul>
     </section>
   </template>

   <script setup lang="ts">
   import { getCategories } from '@/api/categories'
   import { ApiError } from '@/api/client'
   import BaseAlert from '@/components/ui/BaseAlert.vue'
   import { useApi } from '@/composables/useApi'

   async function loadCategories() {
     try {
       return (await getCategories()).map((category) => category.name)
     } catch (error) {
       throw new Error(
         error instanceof ApiError && error.isUnauthorized
           ? 'Connectez-vous pour voir les catégories.'
           : 'Une erreur est survenue, réessayez.',
       )
     }
   }

   const { data, error, loading } = useApi(loadCategories)
   </script>
   ```

3. Test the three states. Mock the API module the view imports:

   ```ts
   import { beforeEach, describe, expect, it, vi } from 'vitest'
   import { flushPromises, mount } from '@vue/test-utils'
   import { getCategories } from '@/api/categories'
   import { ApiError } from '@/api/client'
   import CategoryListView from '@/views/collection/CategoryListView.vue'

   vi.mock('@/api/categories')

   describe('CategoryListView', () => {
     beforeEach(() => {
       vi.resetAllMocks()
     })

     it('shows a loading state, then the categories', async () => {
       vi.mocked(getCategories).mockResolvedValue([{ id: '1', name: 'Saison 1' }])
       const wrapper = mount(CategoryListView)
       expect(wrapper.text()).toContain('Chargement…')
       await flushPromises()
       expect(wrapper.text()).toContain('Saison 1')
     })

     it('asks a logged-out visitor to log in', async () => {
       vi.mocked(getCategories).mockRejectedValue(
         new ApiError('Unauthorized', { code: 'UNAUTHENTICATED', status: 401 }),
       )
       const wrapper = mount(CategoryListView)
       await flushPromises()
       expect(wrapper.text()).toContain('Connectez-vous pour voir les catégories.')
     })
   })
   ```

4. Remember that `cards`, `categories` and `cardTypes` require a token today. Ask what logged-out
   visitors should see on a public page before you wire it. The 401 message above fits a page behind
   auth; on the public catalogue, it would hide request B1.

## Call a mutation from a button

`useApi` runs on setup, so it doesn't fit a click. Use `pending` and `error` refs:

```ts
import { ref } from 'vue'
import { ApiError } from '@/api/client'
import { addCardsInCollection } from '@/api/collection'

const pending = ref(false)
const errorMessage = ref('')

async function add(cardId: number) {
  errorMessage.value = ''
  pending.value = true
  try {
    await addCardsInCollection([String(cardId)])
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError && error.isUnauthorized
        ? 'Connectez-vous pour ajouter des cartes.'
        : 'Une erreur est survenue, réessayez.'
  } finally {
    pending.value = false
  }
}
```

- Disable the button while `pending`: `<BaseButton :disabled="pending" …>`.
- Show the message with `<BaseAlert v-if="errorMessage" :message="errorMessage" />` next to it:
  `BaseAlert` renders its box even when the message is empty.
- Placing the button inside `TcgCard` or `CardBrowser` changes a shared component's API: ask first.
- `addCardsInCollection` is a test-data tool today (any user can add any card). Ask before you put it
  behind a player-facing button.

## Add a form

The pattern of the auth forms (`LoginView.vue`):

```ts
import { ref } from 'vue'
import { useAuthRedirect } from '@/composables/useAuthRedirect'
import { AuthError, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const redirectAfterAuth = useAuthRedirect()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})
const formError = ref('')
const pending = ref(false)

function validate() {
  return {
    email: email.value.trim() ? undefined : 'Saisissez votre email.',
    password: password.value ? undefined : 'Saisissez votre mot de passe.',
  }
}

async function submit() {
  formError.value = ''
  errors.value = validate()
  if (errors.value.email || errors.value.password) return

  pending.value = true
  try {
    await auth.login(email.value, password.value)
    await redirectAfterAuth()
  } catch (error) {
    formError.value =
      error instanceof AuthError ? error.message : 'Une erreur est survenue, réessayez.'
  } finally {
    pending.value = false
  }
}
```

- Use a `<form novalidate @submit.prevent="submit">` with `TextField`s. `AuthForm` is the card layout of
  the auth pages: use it only there.
- The submit label shows `…` while `pending`.
- Error messages are French and use vouvoiement.
- **Outside auth**:
  - replace the store action with your API call, or with a store action when the data lives in a
    store (change the pseudo with `auth.setUsername()`, so `auth.user` stays in sync);
  - don't call `redirectAfterAuth()`: stay on the page and show a success message with
    `<BaseAlert variant="success">`, or navigate with `router.push({ name: '…' })` if the request says
    so;
  - map `ApiError` statuses to French messages in the catch. `setUsername` throws `AuthError`s, but
    they keep the back's message unchanged ("Ce nom d'utilisateur est déjà utilisé", or an English
    validation message such as "username must be shorter than or equal to 30 characters"): validate
    3–30 characters locally and map those errors to French too.

## Add a reusable component

1. Decide where it goes:
   - a generic atom goes in `components/ui/Base<Name>.vue`;
   - a feature component goes in `components/<feature>/<MultiWord>.vue`. Create the feature folder if
     needed (`components/booster/`).

   Check [ui.md](ui.md#components) first: the component may already exist.

2. Template:

   ```vue
   <template>
     <span class="chip" :class="`chip--${tone}`">
       <slot>{{ label }}</slot>
     </span>
   </template>

   <script setup lang="ts">
   withDefaults(
     defineProps<{
       label?: string
       /** Visual emphasis */
       tone?: 'neutral' | 'brand'
     }>(),
     { tone: 'neutral' },
   )
   </script>

   <style scoped lang="scss">
   .chip {
     padding: 2px 8px;
     border-radius: var(--radius-pill);
     font-size: 12px;
     font-weight: var(--font-weight-medium);

     &--neutral {
       background: var(--color-gray-100);
       color: var(--color-gray-700);
     }

     &--brand {
       background: var(--color-brand);
       color: var(--color-white);
     }
   }
   </style>
   ```

3. Test the behavior that matters in `components/<folder>/__tests__/<ComponentName>.spec.ts`:

   ```ts
   import { describe, expect, it } from 'vitest'
   import { mount } from '@vue/test-utils'
   import BaseChip from '@/components/ui/BaseChip.vue'

   describe('BaseChip', () => {
     it('renders the label with the requested tone', () => {
       const wrapper = mount(BaseChip, { props: { label: 'Nouveau', tone: 'brand' } })
       expect(wrapper.text()).toBe('Nouveau')
       expect(wrapper.classes()).toContain('chip--brand')
     })
   })
   ```

4. Add the component and its props to the table in [ui.md](ui.md#components).

## Build a screen on mock data

When the back has no API for a screen yet (boosters today):

1. Add or reuse a UI type in `src/types/<resource>.ts`, named after the data (`card.ts`, `booster.ts`).
2. Put the data in `src/mocks/<resource>.ts` (`cards.ts`, `boosters.ts`), typed with that UI type, headed
   `// TODO(back): <missing API>`.
3. The view imports the mock directly. Never put mocks in `src/api/` and never fake a GraphQL response.
4. Write the missing API under « À demander au back » in the PR.

## Test a component that needs the router or a store

Copy `src/views/auth/__tests__/AuthCallbackView.spec.ts`. Stub the store actions the component calls:
otherwise they send real requests to `http://localhost:3000/graphql` (jsdom's origin in Vitest).

```ts
function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/auth/callback', name: 'auth_callback', component: AuthCallbackView },
    ],
  })
  return { pinia, router, auth: useAuthStore() }
}

it('logs in with the token from the URL', async () => {
  const { pinia, router, auth } = setup()
  const loginWithToken = vi.spyOn(auth, 'loginWithToken').mockResolvedValue()
  await router.push('/auth/callback#access_token=abc') // push BEFORE mount
  mount(AuthCallbackView, { global: { plugins: [pinia, router] } })
  await flushPromises()

  expect(loginWithToken).toHaveBeenCalledWith('abc')
  expect(router.currentRoute.value.name).toBe('home')
})
```

To test a store, auto-mock the API module: `vi.mock('@/api/auth')`, then
`vi.mocked(authApi.login).mockResolvedValue('token')`. In `beforeEach`, run `localStorage.clear()`,
`vi.resetAllMocks()` and `setActivePinia(createPinia())`.

## Test code that depends on an env variable

Vitest loads your local `.env`. To control a value, stub it and reload the module that reads it
(`VITE_FEATURE_FLAG` and `@/config` are placeholders: there is no client variable today):

```ts
async function loadConfig(value = '') {
  vi.stubEnv('VITE_FEATURE_FLAG', value)
  vi.resetModules()
  return import('@/config')
}
afterEach(() => vi.unstubAllEnvs())
```

## Change the dev or deploy configuration

Changing these files is **Ask first**, unless the request asks for it. Setting `API_PROXY_TARGET` in
your own `.env` ([AGENTS.md › Local setup](../../AGENTS.md#local-setup)) and running the image locally
change nothing in the repo. A request for one change approves only that change: if it also needs the
`Dockerfile` or `ci.yml`, ask.

| Need                                    | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The local back runs on another port     | `.env`: `API_PROXY_TARGET=http://localhost:3001`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Proxy a new back route in dev           | `vite.config.ts` `server.proxy`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Proxy a new back route in Docker / prod | `docker/default.conf.template`: add the path inside the group of `location ~ ^/(graphql\|auth/google)(/\|$)` and keep the `(/\|$)` boundary                                                                                                                                                                                                                                                                                                                                   |
| Back address in staging and prod        | `BACKEND_UPSTREAM` in the Portainer stack, outside the repo: a human with access does it                                                                                                                                                                                                                                                                                                                                                                                      |
| A new client env variable               | `VITE_*` in `.env.example`, declared in `env.d.ts`, read in a single module. Values are inlined at build time into the public bundle: never put a secret there. The Docker image gets none (`.dockerignore` drops `.env` and `.env.*` except `.env.example`, which Vite never reads, and the `Dockerfile` has no `ARG`). Staging and prod would need a build argument in the `Dockerfile` and in `.github/workflows/ci.yml`: ask first, and ask whether one image serves both |
| Run the Docker image locally            | `docker build -t slopbattle-front:local .` then `docker run --rm -p 18080:80 -e BACKEND_UPSTREAM=http://host.docker.internal:3000 slopbattle-front:local` (Docker Desktop; on Linux, nginx resolves the name through DNS only, so use the bridge gateway IP, e.g. `http://172.17.0.1:3000`)                                                                                                                                                                                   |
