# API, auth and back-end contract

How this front talks to the back. Read [AGENTS.md](../../AGENTS.md) first.

## The client: `src/api/client.ts`

It is the only module that talks HTTP. The axios instance (`http`) is private.

```ts
gql<T>(query: string, variables?: Record<string, unknown>, options?: GqlOptions): Promise<T>
apiUrl(path: string): string          // `<VITE_BACKEND_URL><path>`: '/auth/google' when it is empty
class ApiError extends Error {        // new ApiError(message, { code?, status? })
  code?: string; status?: number; get isUnauthorized(): boolean
}
setUnauthorizedHandler(handler: (() => void) | null): void   // set by the auth store, nowhere else
interface GqlOptions { token?: string | null; signal?: AbortSignal }
```

### URLs

- `VITE_BACKEND_URL` is the **back root URL**, without `/graphql`. It is empty by default.
  - It is read at **build time**. Trailing slashes are removed, and so is a `/graphql` suffix copied
    from the former `VITE_API_URL` (with a warning in dev).
  - Empty means **same origin**: the browser calls `/graphql` and `/auth/google` on the front's origin.
- `gql()` POSTs `{ query, variables }` to `<root>/graphql`. `apiUrl('/auth/google')` returns
  `<root>/auth/google`.
- Who forwards those paths to the back:

  | Environment             | Forwarder                              | Target                                                                                                            |
  | ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
  | Dev                     | Vite proxy (`vite.config.ts`)          | `API_PROXY_TARGET`, default `http://localhost:3000`                                                               |
  | Docker / staging / prod | nginx (`docker/default.conf.template`) | `BACKEND_UPSTREAM`, set in the Portainer stack, e.g. `http://api:3000`. Empty, or without `http(s)://`, means 503 |

- Both forwarders normalize their target the same way as the client: trailing slashes and a
  `/graphql` suffix are dropped, then the request path and query string are appended. A path
  prefix such as `https://host/api` is kept.
- Which paths are forwarded:
  - Vite matches its proxy keys **by prefix**, so `/graphql-explorer` would be proxied in dev;
  - nginx matches `^/(graphql|auth/google|media)(/|$)`, so it forwards `/graphql/…` but not
    `/graphql-explorer`. Never create a front route that starts with one of these paths;
  - `/auth/google` also covers `/auth/google/callback`;
  - `/auth/callback` is **not** proxied, because it is a front route.
  - Never add `/auth` as a whole to a proxy.
- Deployed builds keep `VITE_BACKEND_URL` empty (decision A2): the Docker image has no build argument
  for it, and the back's address is `BACKEND_UPSTREAM`. Set it only for a local setup without the
  proxy: the calls become cross-origin, and the back must list the front's origin in its `CORS_ORIGINS`.
- The warnings for a stripped `/graphql` come from two places:
  - for `API_PROXY_TARGET`, Vite warns in the terminal;
  - for `VITE_BACKEND_URL`, the app warns in the browser console, in dev only. A production build
    strips it silently.
- Error pages: nginx answers 503 (empty `BACKEND_UPSTREAM`) or 502 (back down) with its own HTML page.
  A JSON error page comes from the back itself.

### Token

| `options.token`       | Authorization header                     |
| --------------------- | ---------------------------------------- |
| `undefined` (default) | `Bearer <stored token>` if one is stored |
| `'abc'`               | `Bearer abc`, the stored one is ignored  |
| `null`                | none                                     |

- The JWT lives in `localStorage['slop-battle:access-token']`. Read and write it **only** with
  `getToken` / `setToken` / `clearToken` from `src/api/token.ts`.
- Browser storage keys always start with `slop-battle:`.
- Pass `{ token: null }` on `login`: otherwise a stale stored token is sent, and the 401 fires the
  unauthorized handler, which logs the user out. `register` passes it too, as a precaution (the back
  answers it with 409 or 400, never 401). Every other call keeps the default, except
  `fetchMyProfile(token)` in the store's `startSession`, which sends the new token explicitly because
  it is stored only after the back accepts it.

### Errors

`gql()` throws an `ApiError` when one of these happens:

| Situation                                                | `message`                                                                                   | `status`                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| The body has `errors`, whatever the HTTP status          | `extensions.originalError.message` (first item if it is an array), else `errors[0].message` | `originalError.statusCode`, else the HTTP status |
| The HTTP status is not 2xx, or `data` is missing or null | `Une erreur est survenue, réessayez.`                                                       | the HTTP status                                  |
| Timeout (15 s)                                           | `Le serveur met trop de temps à répondre. Réessayez dans un instant.`                       | none                                             |
| Network failure                                          | `Impossible de joindre le serveur. Réessayez dans un instant.`                              | none                                             |

Notes:

- `errors` wins over `data`: only `errors[0]` is used, and partial data is thrown away.
- `code` is `extensions.code`. `isUnauthorized` is `status === 401 || code === 'UNAUTHENTICATED'`.
- A request aborted through `signal` rejects with axios' own cancellation error, **not** an
  `ApiError`. Callers check `signal.aborted` and ignore it.
- When a request **sent with a token** fails with `isUnauthorized`, the client calls the unauthorized
  handler. The auth store registers it: it runs `logout()` and sets `sessionExpired`.

How the back's errors arrive (Nest + Apollo):

| Back exception                                                         | `code`                                                                  | `status` | HTTP |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- | ---- |
| 400 BadRequest / class-validator                                       | `BAD_REQUEST`                                                           | 400      | 200  |
| 401 Unauthorized (guard, wrong credentials)                            | `UNAUTHENTICATED`                                                       | 401      | 200  |
| 403                                                                    | `FORBIDDEN`                                                             | 403      | 200  |
| 404 NotFoundException, 409 ConflictException                           | `INTERNAL_SERVER_ERROR`                                                 | 404, 409 | 200  |
| MikroORM `findOneOrFail` (`card(id)` not found…)                       | `INTERNAL_SERVER_ERROR`                                                 | 200      | 200  |
| GraphQL parse or validation error (unknown field, wrong variable type) | `GRAPHQL_PARSE_FAILED` / `GRAPHQL_VALIDATION_FAILED` / `BAD_USER_INPUT` | 400      | 400  |

So:

- **Branch on `status`, not on `code`.** A missing `card(id)`, `category(id)` or `cardType(id)` is not a
  404: MikroORM's error arrives with `status` 200 and an English message.
- The messages are not always French:
  - the back's own business messages are French ("Identifiants invalides", "Cette adresse e-mail est
    déjà utilisée", "Ce nom d'utilisateur est déjà utilisé");
  - validation messages are English ("email must be an email");
  - a missing token gives the English "Unauthorized".

  **Never show `ApiError.message` as is.** Map the cases you expect to French messages and fall back
  to `Une erreur est survenue, réessayez.`:
  - in the auth store, `toAuthError` does it only partly: it maps the 401 of `login` and the 409 of
    `register`, but passes every other `ApiError` message through unchanged (see
    [Auth flows](#auth-flows-srcstoresauthts-srcrouterindexts)). Don't copy that fallback;
  - for data a view loads, do it in the request function passed to `useApi` (see
    [recipes.md › Show back-end data in a view](recipes.md#show-back-end-data-in-a-view)).

## API modules

Use one file per back resource. The target style for a new module:

```ts
import { gql } from '@/api/client'
import type {
  AddCardsInCollectionMutation,
  GetMyCardCollectionQuery,
} from '@/api/generated/graphql'

/** One owned card, as returned by `myCardCollection`: card details come from `getCards` */
export type CollectionEntry = GetMyCardCollectionQuery['myCardCollection']['cards'][number]

/** Cards owned by the logged-in user (the back requires a token) */
export const getMyCardCollection = () =>
  gql<GetMyCardCollectionQuery>(/* GraphQL */ `
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
  gql<AddCardsInCollectionMutation>(
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

The types come from `src/api/generated/graphql.ts`, written by `npm run codegen` from the documents.
Write the document first, run the codegen, then import the `<OperationName>Query`,
`<OperationName>Mutation` and `<OperationName>QueryVariables` types it produced. Never edit the
generated file.

`src/api/cards.ts` shows how to declare and spread a fragment (`CARD_FIELDS`, spread as
`...CardFields`, typed as `CardFieldsFragment`).

Rules:

- Name queries `get*` and mutations after the back's mutation. Document every export with one JSDoc
  line that says whether a token is required.
- Every document starts with `/* GraphQL */` and has an operation name in PascalCase: the codegen only
  reads tagged documents, and it fails on an anonymous one next to another operation. Keep the document
  a plain template literal (the only `${}` allowed is a fragment constant), otherwise the codegen
  can't read it.
- Select only the fields you use. Fragments go in a `SCREAMING_SNAKE` constant.
- Derive the API types from the generated ones (`GetCategoriesQuery['categories'][number]`, a
  `…Fragment`) instead of writing them by hand. The scalars are mapped in `codegen.ts`: `ID` and
  `DateTime` are `string`, `Int` is `number`. Keep a comment where the types differ (`id: string`
  because GraphQL serializes `ID` as a string).

| Module          | Exports                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`       | `login(input)` → token, `register(input)` → token, `fetchMyProfile(token?)` → `User`, `updateMyProfile({ username? })`. The username is sent through `updateMyProfile` after register: `RegisterInput` has no username. |
| `cards.ts`      | `getCards(filter?)`, `getCardsPage({ filter?, page, pageSize, sort }, options?)` → `{ items, total, page, pageCount }`, `getCard(id)`. Types `Card` (API shape, `CardFieldsFragment`), `CardsFilter`, `CardSort`.       |
| `adapters.ts`   | `toCard(apiCard, rarities)`, `toRarity(rarityId, rarities)`. Rarity mapping: the n-th rarity of `getRarities()` = the n-th code `common`..`goat`, unknown = `common`; `set` stays empty (B8).                                            |
| `categories.ts` | `getCategories()`. Type `Category` (`{ id: string; name: string }`).                                                                                                                                                    |
| `rarities.ts`   | `getRarities()`, most common first. Type `ApiRarity` (`{ id: string; name: string; sortOrder: number \| null }`). |
| `cardTypes.ts`  | `getCardTypes()`. Type `CardType` (`{ id: string; name: string }`).                                                                                                                                                     |
| `token.ts`      | `getToken()`, `setToken()`, `clearToken()`                                                                                                                                                                              |
| `generated/`    | `graphql.ts`: types written by `npm run codegen`, committed. Never edit it.                                                                                                                                             |

### Codegen

`npm run codegen` introspects the running back (`http://localhost:3000/graphql`, or the URL in the
`VITE_API_URL` variable) and writes `src/api/generated/graphql.ts` from the documents of `src/api/`
(`codegen.ts`). Run it, and commit the result, whenever you add or change a document or the back changes
its schema; `type-check` then flags the call sites that no longer match. The file is committed so CI
doesn't need a back.

`fetchMyProfile` predates the `get*` rule. Keep the name; don't rename it in an unrelated change.

`collection.ts` (the template above) doesn't exist yet: create it when a task needs it.

## Composables

| Composable           | Signature                                                                                                  | Notes                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useApi.ts`          | `useApi(request)` → `{ data, error, loading, reload }`                                                     | runs on setup, no cancellation (see [Fetching data in a view](#fetching-data-in-a-view))                                                                                                                                                                  |
| `useAuthRedirect.ts` | `useAuthRedirect()` → `redirectAfterAuth(fallback?)`                                                       | also exports `rememberRedirect(value)` and `takeRememberedRedirect()` (the Google round trip, in `sessionStorage`)                                                                                                                                        |
| `useCardFilters.ts`  | `useCardFilters(cards, pageSize = 12)`                                                                     | search, set/type/rarity filters, sort, pages, on UI `Card`s, client-side. Used by Ma collection (mock data). Exports the types `CardFilters`, `CardSort`                                                                                                  |
| `useCardsPage.ts`    | `useCardsPage(pageSize = 12)` → `{ filters, sort, page, cards, total, pageCount, loading, error, reload }` | the same filters and sort, run on the back through `getCardsPage`, one page at a time, with a 300 ms search delay (`SEARCH_DELAY`). `filters.set` holds a category id and `filters.type` a card type id. Errors are already French. Used by the catalogue |
| `useGridColumns.ts`  | `useGridColumns(target, initial = 4)` → `Ref<number>`                                                      | counts the grid's columns with a `ResizeObserver`, so pages fill whole rows                                                                                                                                                                               |

## Wiring CardBrowser to the back

`CardBrowser` only displays a page of cards and its filters. Feed it from one of the two composables:

- back data: `useCardsPage`, as `CatalogueView` does. Search, filters, sort and pages run on the back
  (`cardsPage`); the filter options are ids (`getCategories`, `getCardTypes`);
- local data: `useCardFilters`, as `CollectionView` does on mock data.

When Ma collection moves to the back, it needs `myCardCollection` joined with the card details (B3):
ask how before you wire it. If `imageUrl` is empty, ask what to show: `card-placeholder.jpg` is a
mock asset.

## Back-end schema (back `develop`, read-only reference)

The schema is code-first and lives in memory: there is no `.graphql` file in the back repo.

- Introspection is enabled unless `NODE_ENV=production`. `GRAPHQL_INTROSPECTION=true` turns it back on
  in production (the back's comment names staging and Apollo Sandbox).
- The playground runs only with `NODE_ENV=development`.
- With a local back, read a type's real fields before you write a document:
  `curl -s http://localhost:3000/graphql -H 'Content-Type: application/json' -d '{"query":"{ __type(name: \"Card\") { fields { name type { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }"}'`.
- When in doubt, ask a human or read the back's resolvers. Never guess a field.

### Queries

| Operation                                                      | Returns                                                                                                                                                                                    | Auth |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `myProfile`                                                    | `UserProfileModel { id: Int!, email, username?, avatarUrl?, coins: Int!, createdAt }`                                                                                                      | JWT  |
| `me`                                                           | `CurrentUserModel { id: Int!, email }` (unused)                                                                                                                                            | JWT  |
| `users(limit = 20, offset = 0)`                                | `[PublicUserModel]` (a profile without email; limit is clamped to 1..100)                                                                                                                  | JWT  |
| `user(id: Int!)`                                               | `PublicUserModel`                                                                                                                                                                          | JWT  |
| `cards(filter: CardsFilterInput)`                              | `[Card]`                                                                                                                                                                                   | JWT  |
| `cardsPage(filter, page = 1, pageSize = 20, sort = TITLE_ASC)` | `CardsPage { items: [Card!]!, total: Int!, page: Int!, pageSize: Int!, pageCount: Int! }`; `pageSize` is clamped to 1..100, `sort` is `TITLE_ASC`, `TITLE_DESC`, `RARITY_DESC` or `NEWEST` | JWT  |
| `card(id: ID!)`                                                | `Card`                                                                                                                                                                                     | JWT  |
| `rarities`, `rarity(id: ID!)`                                  | `RarityEntity { id, name, sortOrder: Int, createdAt, updatedAt }`; `rarities` is sorted by `sortOrder` ascending                                                                          | JWT  |
| `categories`, `category(id: ID!)`                              | `CategoryEntity { id, name, createdAt, updatedAt }`                                                                                                                                        | JWT  |
| `cardTypes`, `cardType(id: ID!)`                               | `CardTypeEntity { id, name, createdAt, updatedAt }`                                                                                                                                        | JWT  |
| `myCardCollection`                                             | `CardCollection { userId: ID!, cards: [CollectionCard { cardId: ID!, quantity: Float!, firstObtainedAt }] }`                                                                               | JWT  |

Field details:

- `Card` is `{ id: ID!, title, description?, imageUrl, rarity: RarityEntity!, categories: [CategoryEntity!]!, types: [CardTypeEntity!]!, createdAt, updatedAt }`.
- `CardsFilterInput` is `{ search?: String, rarityId?: Int, categoryIds?: [Int!], typeIds?: [Int!] }`;
  `search` is a case-insensitive part of the title. Values inside one
  field are OR-ed and the fields are AND-ed.
- `imageUrl` is meant to be an absolute CDN link (the back's comment), but the back only checks that it
  is a string.
- `myCardCollection` returns **no card details**. Join it with `getCards()` on the client.
  `quantity` is typed `Float!`: display it as an integer.

### Mutations

| Operation                                                                        | Input                                                                        | Auth                |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| `register(input: RegisterInput!)` → `AuthPayload { access_token }`               | `{ email (IsEmail), password (min 8) }`                                      | public              |
| `login(input: LoginInput!)` → `AuthPayload`                                      | `{ email (IsEmail), password }`                                              | public              |
| `updateMyProfile(input: UpdateUserProfileInput!)` → `UserProfileModel`           | `{ username? (3–30), avatarUrl? (http(s), ≤ 2048) }`                         | JWT                 |
| `deleteMyAccount` → `Boolean`                                                    | fails (English `INTERNAL_SERVER_ERROR`) when the user owns cards             | JWT                 |
| `addCardsInCollection(input: UpdateUserCardsInput!)` → `[UserCardsEntity]`       | `{ cardIds: [Int!]! }`, +1 copy per id                                       | JWT                 |
| `removeCardsFromCollection(input: UpdateUserCardsInput!)`                        | `{ cardIds: [Int!]! }`, −1 copy per id; ids the user doesn't own are ignored | JWT                 |
| `createCard`, `updateCard`, `removeCard`, the same for `Category` and `CardType` | admin, back-office                                                           | **none** (back gap) |

Notes:

- `register` fails with 409 when the e-mail is taken. `login` fails with 401 "Identifiants invalides".
  An account that only signs in with Google also gets 401 on `login`.
- `updateMyProfile` fails with 409 when the username is taken.
- Both collection mutations return `UserCardsEntity` rows:
  - `addCardsInCollection` returns one row per input id, in input order;
  - `removeCardsFromCollection` returns only the rows that still exist: it skips ids the user doesn't
    own, and leaves out a row whose last copy it removed (it never returns `quantity` 0). Never match
    its result to `cardIds` by index;
  - `id` is the **collection row's** id, not the card id;
  - `quantity` is the new count;
  - select only `id` and `quantity`: the `card` relation is not populated by the back.

  In `addCardsInCollection`, an unknown card id fails on a database constraint with an English
  `INTERNAL_SERVER_ERROR`, and the ids before it in the same call stay saved.
  `removeCardsFromCollection` ignores an unknown id.

- `deleteMyAccount` fails while the user owns cards: the `user_cards` foreign key has no delete
  cascade.

- The admin mutations exist so that the back office can manage the catalogue. In this front, use them
  only to create local test data, never in app code.

Type names for fragments are `Card`, `CategoryEntity`, `CardTypeEntity`, `UserProfileModel`,
`PublicUserModel`, `CardCollection`, `CollectionCard` and `UserCardsEntity`.

### Validation parity

| Rule                   | Front                                      | Back                                     |
| ---------------------- | ------------------------------------------ | ---------------------------------------- |
| Password length        | `PASSWORD_MIN_LENGTH = 8`                  | min 8                                    |
| Username length        | `USERNAME_MIN_LENGTH = 3`                  | 3 to 30                                  |
| Login e-mail format    | only checks that it is not empty           | must be an e-mail                        |
| Register e-mail format | loose regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `IsEmail`, stricter (it rejects `a@b.c`) |

The existing forms don't check the 30-character username maximum, and their e-mail checks are looser
than the back's: the back's English validation message can reach the UI. That is a known gap: don't fix
it inside an unrelated change. A **new** form validates the full rules locally. Put any new limit in
`src/constants/auth.ts` (e.g. `USERNAME_MAX_LENGTH = 30`).

## Auth flows (`src/stores/auth.ts`, `src/router/index.ts`)

The `useAuthStore()` API:

- `user` (a `User` or `null`), `isAuthenticated`, `needsUsername` and `sessionExpired`;
- `login(email, password)`, `register({ username, email, password })`, `loginWithToken(token)`,
  `setUsername(username)`, `init()` and `logout()`.

Errors that can be shown to the user are `AuthError`s (`import { AuthError } from '@/stores/auth'`),
produced by the store's private `toAuthError`:

- in `login`, a 401 becomes "Email ou mot de passe incorrect.";
- in `register`, a 409 (or a message matching `/exist|already/i`) becomes "Un compte existe déjà avec
  cet email.";
- every other `ApiError` becomes an `AuthError` with its message unchanged: the back's message, or the
  client's French message for a timeout, a network failure or a non-GraphQL response. For example, a
  taken pseudo in `setUsername` shows the back's "Ce nom d'utilisateur est déjà utilisé", and a
  refused token in `loginWithToken` shows "Unauthorized" (or "Jeton invalide" when the token's user no
  longer exists).

`AuthError` has no `status`. A new form that calls a store action can't branch on 409: validate
locally what you can (3–30 characters for a pseudo), and map the messages you know. This is a known
gap (see [decisions.md › Known gaps](decisions.md#known-gaps)).

`setUsername(username)` also works after registration: it trims the pseudo, calls `updateMyProfile`,
then reloads `user`.

**Email/password login**:

1. The e-mail is normalized (`trim().toLowerCase()`).
2. `login` is sent with `{ token: null }`.
3. `startSession(token)`: `fetchMyProfile(token)`, then `setToken`. A token the back refuses is never
   stored.
4. The view calls `redirectAfterAuth()`.

**Register**: `register` runs, then `startSession`, then `setUsername`. If `setUsername` fails, the
session is kept and the guard sends the user to `/choose-username`.

**Google**:

1. `GoogleButton` calls `rememberRedirect(route.query.redirect)`, then sets
   `window.location.href = apiUrl('/auth/google')`.
2. The back redirects to Google, then to `/auth/google/callback`, then to
   `${FRONT_URL}/auth/callback#access_token=<jwt>`.
3. `AuthCallbackView` reads the token from the hash, removes it from the URL with `router.replace`,
   then runs `loginWithToken(token)` and `redirectAfterAuth`.
4. A new Google user has no username, so the guard sends them to `choose_username`.

Back-side errors in that flow never reach the front. They end on a JSON page at
`/auth/google/callback` (request B4). When someone reports one, ask for the URL and the JSON body:

| JSON on `/auth/google/callback`                                   | Cause                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 401 `Unauthorized`                                                | consent refused on Google's screen                                      |
| 401 `Google doit fournir une adresse e-mail vérifiée`             | Google account without a verified e-mail                                |
| 409 `Cette adresse e-mail est déjà liée à un autre compte Google` | e-mail already linked to another Google account                         |
| 500 `Internal server error`                                       | back config, e.g. `FRONT_URL` missing or a failed Google token exchange |

When the hash has no `access_token`, `AuthCallbackView` shows "La connexion avec Google a échoué." with a
link back to login. Google in staging also needs config outside the repo:

- `BACKEND_UPSTREAM` in the Portainer stack;
- in the back, `FRONT_URL` = the front's exact origin;
- `GOOGLE_CALLBACK_URL` = `https://<front>/auth/google/callback`, an absolute URL registered as is in
  the Google console.

A human with access changes them. Ask for the staging URLs: they are not in the repo.

**Restoring the session**:

- `init()` runs once per page load: the router guard awaits it.
- With no stored token, it makes no request.
- If the back refuses the token, the store logs out. If the back is down, the token is kept and `user`
  stays `null`.

**Expiry**:

- The JWT lasts 1 h and there is no refresh token.
- The next call made with the expired token fires the unauthorized handler.
- `redirectOnSessionExpiry()` (called in `main.ts`) sends the user to `login?redirect=…` only when the
  current route has `requiresAuth`. On a public page, the user is logged out silently.

**Redirects**:

- `?redirect=` and the remembered redirect go through `toInternalPath`: the path must start with `/`
  and not with `//`, to block open redirects.
- `redirectAfterAuth(fallback?)` picks, in order: `?redirect=`, then the fallback, then `home`.

**Router guard order**:

1. `await auth.init()`.
2. `auth_callback` always passes. The view reads the token, then redirects through the guard with
   the new session. Redirecting earlier would copy the token into a `?redirect=` query.
3. `requiresAuth` while logged out sends the user to login with `?redirect=`.
4. `needsUsername` sends the user to `choose_username`.
5. A user who already has a username and opens `choose_username` goes to home.
6. `guestOnly` while logged in sends the user to home.

## Fetching data in a view

`useApi(request)` returns `{ data, error, loading, reload }`.

- It runs the request immediately.
- `error` is a string; `''` means no error.
- It doesn't cancel requests and doesn't guard against races (see the comment in the file).

`CatalogueView` uses it for the filter options. It is the intended way for a view to load data, except
paged card lists, which use `useCardsPage`.

- `error` holds the raw message of whatever the request throws. Wrap the API call in a request function
  that converts the result with the adapters and turns errors into French messages.
  [recipes.md](recipes.md#show-back-end-data-in-a-view) has the template.
- It runs on setup, so it doesn't fit a click. For a mutation behind a button, call the API function in
  an `async function` with `pending` and `error` refs, like the auth forms.
