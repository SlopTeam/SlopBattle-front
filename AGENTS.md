# AGENTS.md: SlopBattle front

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex…) and for humans working in this
repo. These rules are team decisions. They win over the habits of other Vue projects, over older code
and over `docs/design-handoff/DESIGN_HANDOFF.md`. When a rule here and the code disagree, follow the
rule and mention the gap in your answer.

Read this file entirely before your first change. Then open the guide for the area you work in:

| Area                                                  | Read                                                 |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Calling the back, auth, errors, the back's schema     | [docs/agents/api.md](docs/agents/api.md)             |
| Components, styles, tokens, rarities, Figma           | [docs/agents/ui.md](docs/agents/ui.md)               |
| Step-by-step recipes (page, API call, view, test…)    | [docs/agents/recipes.md](docs/agents/recipes.md)     |
| Why things are the way they are, gaps, open questions | [docs/agents/decisions.md](docs/agents/decisions.md) |

## TL;DR: the rules people break most often

1. **Front only.** The back is another repo (SlopBattle-back, NestJS). Never edit it or work around it here.
   If you need something from the back, write the request down (see [Back-end needs](#back-end-needs)).
2. **One HTTP client.** Every back-end call goes through `gql()` from `src/api/client.ts`. Never import
   axios and never call `fetch` for the back. The one exception is a full-page navigation to the back
   (the Google sign-in), which uses `apiUrl()`.
3. **Check, don't rewrite.** `npm run lint` rewrites fixable files across the whole repo and
   `npm run format` rewrites every file in `src/`. To check, run the commands from
   [Definition of done](#definition-of-done).
4. **Tests never use watch mode.** Run `npx vitest run`, never `npm run test:unit` (it is `vitest`, which
   waits forever in a terminal).
5. **`<script setup lang="ts">` + `<style scoped lang="scss">`**, block order template → script → style.
   Component names are multi-word: never `Header.vue` or `Card.vue`.
6. **Colors, radii and font weights come only from CSS variables** (`var(--color-gray-500)`). There are no
   spacing or font-size tokens: write px. Shadow and mask colors are the only literal colors allowed.
7. **UI text is French and uses vouvoiement** ("Connectez-vous", "Réessayez"). Code, comments, commits and
   docs are in English. PR titles and bodies are in French.
8. **Navigate with named routes** (`{ name: 'collection_list' }`), never with hard-coded paths. Route
   names are snake_case. Never create a route that starts with `/graphql` or `/auth/google`.
9. **Two `Card` types exist.** UI code uses `Card` from `@/types/card`. `Card` from `@/api/cards` is the
   raw API shape. Convert in `src/api/adapters.ts` only.
10. **Rarities use dev codes** (`common` … `goat`). User-facing names come only from `RARITY_LABELS`.
11. **Never show a raw back-end message.** It can be English ("Unauthorized"). Map the cases you expect
    to French, otherwise show `Une erreur est survenue, réessayez.`
12. **Commit, push or open a PR only when the human asks.** PRs always target `develop`
    (`--base develop`): the GitHub default branch is `main`, and a push to `main` triggers the
    production deploy.
13. **No secrets in the repo.** Only `*.env` (which covers `.env`) and `*.local` are gitignored:
    `.env.development` or `.env.production` would be committed.

## How to work

### Decide or ask

- **Decide yourself** for code structure, naming and style that this documentation doesn't cover: copy
  the most similar existing file in the same folder. The rules here, including the (decision) ones,
  win over older code.
- **Write yourself** the error, validation, loading and empty-state messages, following
  [UI copy](#ui-copy).
- **Ask the human** before you pick, for:
  - product behavior, visual design and page text (headings, descriptions, button labels) that neither
    the request nor Figma gives;
  - anything the back doesn't define yet (the card "set", missing APIs), and any change to the
    assumed rarity mapping;
  - every topic in [decisions.md › Unknowns](docs/agents/decisions.md#unknowns-ask-dont-guess);
  - every item in **Ask first** below.
- A human's request that explicitly asks for an Ask-first change ("add a CI job", "swap these
  files") is the approval for that change. Ask again before you go beyond it.

### Boundaries

**Always**

- Run the [Definition of done](#definition-of-done) checks before you say a change is finished, and
  report their real output.
- Keep changes scoped to the task. List any other problem you notice instead of fixing it on the way.
- Run `git status` before you switch branches. If it shows changes you didn't make, stop and ask.

**Ask first**

- Adding or upgrading a dependency.
- Changing config: Vite, TypeScript, ESLint, oxlint, Prettier, Playwright, CI, Docker or nginx.
- Adding a client env variable (`VITE_*`).
- Changing design tokens, the rarity system, the router guard, the auth store or `src/api/client.ts`.
- Renaming or moving files, or changing the props, events or slots of a component other files use.
- Deleting tests, or skipping them (in `src/`, `.skip` and `.only` fail lint; in `e2e/`, only `.only`
  does).
- Creating a branch or a commit without a Jira key: ask for the `SCRUM-<n>` key first. Never invent one.
  Questions, reviews and diagnoses need no key.

**Never**

- Edit the back repo, or call the back without `gql()` / `apiUrl()`.
- Run `npm run lint` or `npm run format` unless the human asks, or reformat files you didn't change.
- Commit secrets, `.env` files, tokens or credentials (even test ones).
- Push to `develop` or `main`, force-push a branch someone else pushed to, merge a PR, or approve one.
- Stash, reset or discard changes you didn't make.
- Use `any`, the non-null assertion (`value!`), `as unknown as`, `@ts-ignore`, `@ts-expect-error`, or
  `v-html` with anything but a local SVG.
- Run `npm run test:e2e`: without `CI=1` it starts the dev server and runs firefox and webkit too. Use
  the E2E command from [Commands](#commands).
- Remove `--no-experimental-webstorage` from `vitest.config.ts`.
- Invent a token, a rarity mapping, a Jira key or a back-end field.

## Project

SlopBattle is an online trading-card game built from memes and internet culture, made for the Ynov
YDays program by the SlopTeam. Players collect parody cards, open boosters (with a 3D opening later)
and build a collection. Planned later: quests, an economy (SlopCOIN) and battles. This repo is the
**web front**.

- Jira: <https://ynovbrainrot.atlassian.net>, project key **SCRUM**. Keys look like `SCRUM-54`. Agents
  can't read Jira: ask the human for the key and the ticket's content.
- The back is NestJS + Apollo GraphQL (code-first) + MikroORM + Postgres, with JWT and Google OAuth.
  - Its code lives in `SlopTeam/SlopBattle-back`, usually checked out next to this repo
    (`../SlopBattle-back`). If that folder doesn't exist, ask the human for its path.
  - Its current code is on `develop`. Its `main` is a stale init commit.
  - Read it without checking it out: `git -C ../SlopBattle-back fetch`, then
    `git -C ../SlopBattle-back show origin/develop:<path>`.
- Design source of truth: the Figma file. See [docs/agents/ui.md](docs/agents/ui.md#working-from-figma).
- Current state:
  - Wired to the back: auth (email/password, Google, choosing a pseudo).
  - The catalogue loads its cards page by page from the back (`cardsPage`, through `useCardsPage`).
  - The collection still renders **mock data** (`src/mocks/cards.ts`).
  - Boosters, profile and settings pages are placeholders.

## Stack

The installed majors are newer than most training data. Before you use an API from memory, check the
installed version (`npm ls <pkg>`) and its types in `node_modules/<pkg>/`.

| Package          | Version   | Notes                                                          |
| ---------------- | --------- | -------------------------------------------------------------- |
| vue              | 3.5       | `useId`, `useTemplateRef`, `defineModel`                       |
| vue-router       | 5.4       |                                                                |
| pinia            | 4.0       | setup stores only                                              |
| axios            | 1.20      | hidden inside `src/api/client.ts`                              |
| vite             | 8.3       |                                                                |
| vitest           | 4.1       | jsdom, no globals                                              |
| typescript       | 6.0       | `lib` is ES2022: no `toSorted`, `findLast` or `Object.groupBy` |
| eslint / oxlint  | 10 / 1.82 | keep `oxlint` and `eslint-plugin-oxlint` on the same version   |
| prettier         | 3.9       | no semicolons, single quotes, `printWidth` 100                 |
| sass-embedded    | 1.106     | SCSS, modern `@use` syntax                                     |
| @playwright/test | 1.64      | e2e, a scaffold spec only                                      |

- Use **Node 24**, at least 24.12 (`engines` rejects older 24.x), like CI and the Dockerfile.
  `nvm install` reads `.nvmrc`. Node 26 also passes every check,
  because `vitest.config.ts` always passes `--no-experimental-webstorage` to the test workers (Node ≥ 25
  ships an empty native `localStorage` that would shadow jsdom's). **Never remove that flag.**
- npm is the only package manager, and `package-lock.json` is committed. Use `npm ci` for a clean install.
- Only 4 runtime dependencies: vue, vue-router, pinia and axios. No UI kit, no CSS framework, no icon
  library, no i18n.

## Commands

Run every command from the repo root: `vite.config.ts` reads `.env` from `process.cwd()`.

| Goal                     | Command                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Install, exactly like CI | `npm ci`                                                                                                                         |
| Dev server               | `npm run dev` (http://localhost:5173, back-end routes proxied to `API_PROXY_TARGET`)                                             |
| All unit tests           | `npx vitest run`                                                                                                                 |
| One test file            | `npx vitest run src/api/__tests__/client.spec.ts`                                                                                |
| One test by name         | `npx vitest run -t "part of the it() title"`                                                                                     |
| Type-check               | `npm run type-check`                                                                                                             |
| Regenerate API types     | `npm run codegen` (the back must run on `http://localhost:3000`, or set `VITE_API_URL`)                                        |
| Lint (read-only)         | `npx oxlint .` then `npx eslint .`                                                                                               |
| Format check (read-only) | `npx prettier --check src/`                                                                                                      |
| Fix your files only      | `npx prettier --write <files>`, `npx eslint --fix <files>`, `npx oxlint --fix <files>`                                           |
| Production build         | `npm run build-only` (no type-check) or `npm run build` (type-check + build)                                                     |
| E2E (scaffold only)      | `npm run build-only && CI=1 npx playwright test --project=chromium --reporter=line` (run `npx playwright install chromium` once) |

### Local setup

1. **Front:** `npm ci`, then `cp .env.example .env`. Leave `VITE_BACKEND_URL` **empty**: the browser
   calls `/graphql` on the front's own origin and Vite proxies it.
2. **Back:** in `../SlopBattle-back`, on `develop`:
   1. Copy `.env.example` to `.env` and fill it:
      - `DB_*`;
      - `JWT_SECRET`;
      - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: dummy values work unless you test Google;
      - `GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback`;
      - `FRONT_URL=http://localhost:5173`;
      - `NODE_ENV=development` (it enables the GraphQL playground).

      The back refuses to start without the JWT and Google values. It reads `FRONT_URL` only when
      Google returns: without it, the Google sign-in ends on a 500.

   2. Start the database with `docker compose up -d db`.
   3. Run `npm ci`, then `npm run start:dev`. Migrations run at startup, and it listens on
      `http://localhost:3000`.
3. If your back runs on another port, set `API_PROXY_TARGET=http://localhost:<port>` in the front's
   `.env`.
4. Run `npm run dev`. If Vite says it moved to 5174, free 5173: the back redirects the Google sign-in
   to `FRONT_URL`.
5. **Test data:** the back has no seed. With the playground at `http://localhost:3000/graphql`:
   - create categories, types and cards with the admin mutations (`createCategory`,
     `createCardType`, `createCard`);
   - give yourself copies with `addCardsInCollection`, sent with your token: sign in on the front, copy
     `slop-battle:access-token` from the browser's localStorage, and put
     `{ "Authorization": "Bearer <token>" }` in the playground's HTTP HEADERS panel;
   - `rarityId` is a plain integer with no table behind it: use 1 to 6 for `common` to `goat`, the
     mapping the front assumes (see [Rarities](#domain-notes)).

   See [docs/agents/api.md](docs/agents/api.md#mutations).

`VITE_API_URL` and `VITE_API_BASE_URL` no longer exist. Vite prints a warning while they are still in
your `.env`. Delete them.

## Definition of done

A change is done when **all** of these pass. The first line is what the CI `ci` job runs on Node 24.
CI then builds the Docker image, which `npm run build-only` covers unless you touch `Dockerfile`,
`docker/` or `.dockerignore`:

```sh
npx oxlint . && npx eslint . && npm run type-check && npx vitest run && npm run build-only
npx prettier --check src/    # not in CI, but required here
```

Also:

- **Specs.** Every new or changed API function, adapter, composable, store action, and component or
  view behavior gets a spec in `<folder>/__tests__/<SourceFileName>.spec.ts` (`TcgCard.vue` →
  `TcgCard.spec.ts`). Add to the existing spec when there is one. Router guard tests go in
  `src/router/__tests__/guard.spec.ts`. A template-only view needs none. A bug fix comes with a test
  that fails without the fix, unless the fix is only assets or SCSS (Vitest doesn't compile styles):
  then say so and check it in the browser.
- **Browser check.** UI changes are checked in the browser (`npm run dev`), keyboard focus included. If
  you can't open a browser, say so: write « Non vérifié dans le navigateur » in the PR.
- **Docs.** In the same change, update what your change makes false:
  - component props → [ui.md › Components](docs/agents/ui.md#components);
  - API modules → [api.md › API modules](docs/agents/api.md#api-modules);
  - composables → [api.md › Composables](docs/agents/api.md#composables) and the [Repo map](#repo-map);
  - routes → [Routes](#routes);
  - tokens → [ui.md › Tokens](docs/agents/ui.md#tokens-css-custom-properties) and [Styles](#styles);
  - back requests → [decisions.md › Open back-end requests](docs/agents/decisions.md#open-back-end-requests);
  - env variables → [Local setup](#local-setup) and `.env.example`;
  - any other sentence that becomes false: "Current state" in [Project](#project), the CI line above,
    [decisions.md › Known gaps](docs/agents/decisions.md#known-gaps).
- **Scope.** Don't edit unrelated files, don't reformat untouched code, and don't delete tests to make
  CI pass.

## Repo map

```
src/
  main.ts                 app bootstrap: Pinia, router, global styles, session-expiry redirect
  App.vue                 layout shell: Header, <router-view>, Footer
  api/                    network layer and API → UI adapters: no Vue, no store
    client.ts             THE client: gql(), ApiError, apiUrl(), setUnauthorizedHandler()
    token.ts              JWT in localStorage ('slop-battle:access-token'), the only accessor
    generated/graphql.ts  types written by `npm run codegen` (committed, never edited)
    auth.ts cards.ts categories.ts cardTypes.ts   one module per back-end resource
    adapters.ts           API shapes → UI types, pure functions
  assets/
    styles/               main.scss → _fonts, _tokens, _rarity, _base; abstracts/ = maps + mixins
    icons/ textures/ images/ fonts/inter/
  components/
    ui/                   generic atoms: BaseButton, BaseTag, BaseAlert, TextField, SearchInput,
                          FilterSelect, RarityBadge, RarityIcon
    auth/                 AuthForm, GoogleButton
    card/                 TcgCard, CardContent
    collection/           CardBrowser (search, filters, sort, paged grid)
    layout/               HeaderComponent, FooterComponent
  composables/            useX.ts: useApi, useAuthRedirect, useCardFilters, useCardsPage, useGridColumns
  constants/              auth.ts (length rules), rarity.ts (RARITIES, RARITY_LABELS)
  mocks/                  typed fake data until the back provides it (cards.ts today)
  router/index.ts         routes, meta flags, global guard, session-expiry redirect
  stores/auth.ts          the only Pinia store
  types/                  UI/domain types: card.ts (UI Card), user.ts
  views/HomeView.vue      the home page (the only view outside a domain folder)
  views/<domain>/<Name>View.vue   one view per route; domains: auth, account, collection, game, system
e2e/                      Playwright specs (vue.spec.ts is the create-vue scaffold)
docs/design-handoff/      Figma handoff (French, written before AGENTS.md) and exported assets
docker/ Dockerfile        nginx image: serves dist/ and proxies /graphql and /auth/google
.github/workflows/ci.yml  CI, then the Docker image, then the Portainer deploy
```

## Conventions

These are the conventions of the code. Rules marked **(decision)** are team choices where the code was
inconsistent or silent. Follow every rule for new code. Don't rewrite old code just for them: some
older files predate them (listed in [decisions.md](docs/agents/decisions.md#convention-decisions)).

### TypeScript

- Strict mode with `noUncheckedIndexedAccess`: `arr[0]` is `T | undefined`. Narrow it with a guard,
  `?.` or `??`. **Never** use the non-null assertion (`value!`) or `as unknown as` (the codebase has
  none).
- No `any` (lint error).
- No `enum` and no `console.*` in `src/`. The only exception is the dev-only `console.warn` in
  `src/api/client.ts`.
- Lint doesn't catch `enum`, `console.*`, `value!`, `as unknown as`, `v-html` or "should" in test
  titles: check them yourself.
- For a fixed set of values, use an `as const` array plus a derived type, like `RARITIES` in
  `constants/rarity.ts`.
- Use `interface` for object shapes and `type` for unions or derived types. Names are PascalCase with
  no `I` prefix.
- Imports:
  - Import TS and Vue modules through `@/` (decision), never with a relative path. SCSS `@use` between
    the global partials in `assets/styles/` stays relative.
  - Don't add an extension to TS imports. Always add `.vue` to component imports.
  - Use `import type { X }` when everything you import is a type, and an inline `type` when you mix
    values and types: `import { RouterLink, type RouteLocationRaw } from 'vue-router'`.
- Naming:
  - fixed module-level values (keys, limits, patterns, fragments, code lists: `STORAGE_KEY`,
    `PASSWORD_MIN_LENGTH`, `CARD_FIELDS`, `RARITIES`) are `SCREAMING_SNAKE_CASE`;
  - object instances (`http`, `router`, `collator`) and functions are `camelCase`;
  - write `catch (error)`, not `catch (e)` (decision). When `error` is already a ref, name the ref
    `errorMessage` or `formError`.
- Comments:
  - Add a one-line `/** JSDoc */` on new exported functions, interface fields and non-obvious props
    (decision).
  - Comments are in English and explain _why_.
  - Tag debt as `TODO(<scope>): <English text>`, with a scope such as design, a11y, api or back
    (decision).

### Vue components

- Write `<script setup lang="ts">` only: no Options API, no `defineComponent`. Block order is template →
  script → style.
- Names are PascalCase and multi-word (lint enforces it), and the file name matches.
  - Generic atoms go in `components/ui/`. New atoms take the `Base` prefix (decision).
  - Feature components go in `components/<feature>/`. Create the folder for a new feature, e.g.
    `components/booster/`.
  - Views end in `View.vue`.
- Props:
  - Declare them with types: `defineProps<{ … }>()`. Add defaults with
    `withDefaults(defineProps<{…}>(), {…})`.
  - Variants are string-literal unions (`variant?: 'primary' | 'secondary'`).
  - A busy flag is `pending?: boolean`. An error is `error?: string` (the message), never a boolean.
- Events (decision):
  - Declare them with types and camelCase names: `defineEmits<{ buy: []; freeOpen: [] }>()`. Listen to
    them in kebab-case (`@free-open`).
  - A Figma or handoff callback prop (`onBuy`) becomes an event (`buy`), never a function prop.
- v-model: `const model = defineModel<string>({ required: true })`, bound to the native element.
- Templates:
  - Bind props in kebab-case (`:created-at`, `submit-label`).
  - Write `<router-link>` and `<router-view>` in kebab-case.
  - Self-close components that have no slot content (decision).
  - Event handlers are named functions (`@submit="submit"`). Keep only trivial toggles inline.
- In `<script setup>`, write `function` declarations, not `const fn = () =>`. Get template refs with
  `useTemplateRef('name')` and ids with `useId()`.
- A type that belongs to a component's API is exported from its `<script setup>`:
  `import FilterSelect, { type SelectOption } from '@/components/ui/FilterSelect.vue'`.
- Reuse the existing components before you create one. Their props are listed in
  [docs/agents/ui.md](docs/agents/ui.md#components).

### Styles

Details and the full token list are in [docs/agents/ui.md](docs/agents/ui.md).

- Write `<style scoped lang="scss">`. Classes are BEM written with SCSS nesting: `.block`,
  `&__element`, `&--modifier`.
  - The root block is the component name in kebab-case without the `Base` prefix and without the
    `View` suffix (decision).
  - Examples: `BaseButton` → `.button`, `TextField` → `.text-field`, `TradeListView` → `.trade-list`.
- **Only use tokens that exist**, as `var(--…)`:
  - `--color-brand`, `--color-white`, `--color-focus`, `--color-error`,
    `--color-{success,error}-{bg,border,text}`;
  - `--color-gray-{50,100,200,300,400,500,600,700,900}` (there is **no 800**);
  - `--radius-{sm,md,lg,xl,card,pill}`;
  - `--font-weight-{regular,medium,semibold,bold}`;
  - `--font-family-base`;
  - `--rarity-{border,badge-bg,badge-text,texture,glow}`, only inside an element that has
    `data-rarity`.

  An undefined variable fails silently. Map Figma hex values to tokens: the grays are the Tailwind
  palette, so `#E5E7EB` is gray-200 and `#6B7280` is gray-500.

- Spacing, font sizes and line heights are **literal px** copied from Figma: no tokens exist for them.
- Shadow and mask colors have no token. Write them literally, as `HeaderComponent`
  (`rgb(17 24 39 / 12%)`) and `TcgCard` (`#000` / `#0000` in masks) do. Any other new theme color needs
  a token, which is an Ask-first change. Colors that are content (a booster's gradient) are data: see
  [ui.md › Colors from data](docs/agents/ui.md#colors-from-data).
- In a component, never `@use` the SCSS abstracts: Vite injects them into every component
  `<style lang="scss">`. Their mixins are ready to use: `focus-ring`, `field-label`, `field-box`,
  `small-screen` (≤ 640px, the only breakpoint) and `visually-hidden`. The global partials in
  `assets/styles/` are not injected: one that uses a map or a mixin loads them with
  `@use 'abstracts' as *;`, as `_tokens`, `_rarity` and `_base` do.
- `_base.scss` does not reset margins: reset `margin: 0` on headings, `p` and `ul` in your component.
- Style a child component by passing it a class, which falls through to its root. Use `:deep()` only
  for slot content.
- Accessibility:
  - Keep the visible focus. If you remove an outline, put `&:focus-within { @include focus-ring; }` on
    the wrapper.
  - Decorative images take `alt=""` and decorative icons `aria-hidden="true"`.
  - Use real `<button>`, `<label>` and native `<select>` elements.

### Router (`src/router/index.ts`)

- A route has a kebab-case `path` in English, a snake_case `name` and a lazy component:
  `component: () => import('@/views/<domain>/<Name>View.vue')`.
- Protected pages need `meta: { requiresAuth: true }`. Login and register pages take
  `meta: { guestOnly: true }`.
- Add new routes **before** the `// System` block: the `/:pathMatch(.*)*` catch-all must stay last.
- Never create a front route that starts with `/graphql` or `/auth/google`: those paths are proxied to
  the back. `/auth/callback` is a front route (the Google return).
- The guard sends a logged-in user who has no pseudo to `choose_username`, from any route except
  `auth_callback`.
- Hard-coded paths are allowed only for a `?redirect=` value checked by `toInternalPath`, and in specs.

#### Routes

| Name              | Path                  | Meta           | View                                        |
| ----------------- | --------------------- | -------------- | ------------------------------------------- |
| `home`            | `/`                   | —              | `HomeView`                                  |
| `catalogue`       | `/catalogue`          | — (public)     | `collection/CatalogueView`                  |
| `collection_list` | `/profile/collection` | `requiresAuth` | `collection/CollectionView` (Ma collection) |
| `booster_list`    | `/boosters`           | —              | `game/BoosterListView` (placeholder)        |
| `login`           | `/login`              | `guestOnly`    | `auth/LoginView`                            |
| `register`        | `/register`           | `guestOnly`    | `auth/RegisterView`                         |
| `auth_callback`   | `/auth/callback`      | —              | `auth/AuthCallbackView` (Google return)     |
| `choose_username` | `/choose-username`    | `requiresAuth` | `auth/ChooseUsernameView`                   |
| `profile`         | `/profile`            | `requiresAuth` | `account/ProfileView` (placeholder)         |
| `settings`        | `/settings`           | `requiresAuth` | `account/SettingsView` (placeholder)        |
| `coming_soon`     | `/coming-soon`        | —              | `system/ComingSoonView`                     |
| `maintenance`     | `/maintenance`        | —              | `system/MaintenanceView`                    |
| `not_found`       | `/:pathMatch(.*)*`    | —              | `system/NotFoundView` (must stay last)      |

Routes are flat: `/profile/collection` is not a child of `/profile`. When a request names a page that
has a placeholder here, build it in that view and keep its route, instead of creating a new one.

### State (Pinia)

- Use setup stores only: `export const useXStore = defineStore('x', () => { … return { … } })`. State
  is `ref`, getters are `computed` and actions are `function`s. The returned object lists every public
  member.
- Consume a store as `const auth = useAuthStore()` and read it directly. Don't use `storeToRefs`.
- Today there is one store, `auth`: `user` (a `User` with `id`, `email`, `username`, `avatarUrl`,
  `coins`, `createdAt`), `isAuthenticated`, `needsUsername`, `sessionExpired` (set when the back
  rejects the token, reset by `redirectOnSessionExpiry` in the router), and the actions in
  [docs/agents/api.md](docs/agents/api.md#auth-flows-srcstoresauthts-srcrouterindexts).
- The logged-in user's profile is already in `auth.user`: read it there, and change the pseudo with
  `auth.setUsername()` so every screen stays in sync. Don't reload it with `useApi`.
- Other data that only one view needs stays in that view (`useApi`). Create a new store only when
  several views share state, and ask first.

### API layer (`src/api/`)

Full reference, with the back's schema, errors and gaps: [docs/agents/api.md](docs/agents/api.md).

- Use one module per back resource (`src/api/<resource>.ts`, camelCase, e.g. `collection.ts`). Each
  exports typed functions that wrap `gql<T>(query, variables?, { token?, signal? })`.
  - Name queries `get*` (decision). Mutations reuse the back's mutation name.
  - Prefix every document with `/* GraphQL */` and give it a PascalCase name (`query GetCards`,
    `mutation Login`) (decision).
  - Fragments must use the **back's type names**: `Card`, `CategoryEntity`, `CardTypeEntity`,
    `UserProfileModel`. `fragment X on Category` fails.
- IDs:
  - Fields typed `ID` arrive as **strings**: card, category and card-type ids, `CollectionCard.cardId`.
  - The inputs `cardIds`, `categoryIds` and `typeIds` expect `Int`: convert them with `Number()`.
  - `rarityId` and user ids are `Int` both ways, except `CardCollection.userId` (from
    `myCardCollection`), which is an `ID` and arrives as a string.
  - `card(id)`, `category(id)` and `cardType(id)` take the string as is.
- Pass `{ token: null }` on `login` and `register`. Otherwise a stale stored token is sent, and a wrong
  password looks like an expired session.
- `ApiError` carries `message`, `code`, `status` and `isUnauthorized`. Branch on `status` (401, 404,
  409), not on `code`: Nest sends 404 and 409 as `INTERNAL_SERVER_ERROR`. A missing `card(id)` is not a
  404: it arrives with `status` 200 and an English message.
- Wire types come from the codegen (`src/api/generated/graphql.ts`) and are re-exported by their
  `src/api/*.ts` module. UI types live in `src/types/` (decision).
  Conversions go in `src/api/adapters.ts`: pure `to<UiType>()` functions (`toCard`), tested in
  `src/api/__tests__/adapters.spec.ts` (decision). Never convert in a component.
- Types come from the GraphQL codegen: run `npm run codegen` (back running) after you add or change a
  document, and commit `src/api/generated/graphql.ts`. Never edit that file. See
  [docs/agents/api.md](docs/agents/api.md#codegen).
- Client env variables must be declared in `env.d.ts`: `strictImportMetaEnv` makes any other
  `import.meta.env.X` a type error.

### Tests

- **Unit tests (Vitest)** live in a `__tests__/` folder next to the code: `src/api/__tests__/cards.spec.ts`.
  Anywhere else in `src/` they are type-checked as app code and lose the ESLint vitest rules.
  **E2E tests (Playwright)** live in `e2e/`.
- Always import `describe`, `it`, `expect`, `vi` and the rest from `'vitest'` (no globals), in
  alphabetical order (decision).
- `describe('<unit name>')`. Write `it('<verb in the present tense>…')` in English, never "should".
- Every `vi.fn` takes a signature: `vi.fn<() => void>()` (lint error otherwise). `toThrow()` must take a
  message.
- Variables used inside a `vi.mock` factory are created with `vi.hoisted`.
- Mock only the layer just below the code under test:
  - API modules mock `@/api/client`;
  - the store mocks `@/api/auth`;
  - views and components that load data mock the API module they import (`vi.mock('@/api/cards')`);
  - client and integration tests mock `axios`;
  - components get a real Pinia plus a memory router, and spy on store actions they call.
- In `beforeEach`, reset what the spec touches:
  - `localStorage.clear()` (plus `sessionStorage.clear()`) when it uses storage;
  - `setActivePinia(createPinia())` when it uses a store;
  - `vi.resetAllMocks()` when it has mocks.

  Undo `vi.stubEnv` and `vi.stubGlobal` in `afterEach`.

- E2E: `e2e/vue.spec.ts` checks the `<h1>` of `HomeView.vue`. If you change it, update the spec and
  run the E2E command: CI doesn't run Playwright.

- Build an `ApiError` in a test with `new ApiError(message, { code, status })`.
- Copy the patterns from the existing specs. [docs/agents/recipes.md](docs/agents/recipes.md) has
  templates.

### UI copy

- **French, vouvoiement**, typed in the templates (there is no i18n).
  - Full sentences end with a period (decision).
  - Pending labels use the single `…` character: "Connexion…".
- Product name: "Slop Battle" (decision).
- Standard messages:

  | Situation           | Text                                                                       |
  | ------------------- | -------------------------------------------------------------------------- |
  | Any other error     | `Une erreur est survenue, réessayez.` (this exact string)                  |
  | Loading             | `<p role="status">Chargement…</p>`                                         |
  | Filtered list empty | `Aucune carte ne correspond à votre recherche.` (already in `CardBrowser`) |

  Write a specific message when you know the case, e.g. "Connectez-vous pour voir vos cartes." for a
  401, and the validation messages of a form. Ask for page text (headings, descriptions, button
  labels).

- Words used in the UI:
  - carte, catalogue, Ma collection, booster;
  - édition (a card set), type, rareté;
  - pseudo (never "nom d'utilisateur"), SlopCOIN;
  - exemplaire(s);
  - email (never "e-mail" or "courriel"), mot de passe, se connecter, se déconnecter, créer un compte.
- Answer the human in the language they write in (French for this team).
- Format numbers and dates with `Intl` and `'fr-FR'`. Format date-only strings (`YYYY-MM-DD`) with
  `timeZone: 'UTC'`. The back's `DateTime` values are full timestamps: cut them to `YYYY-MM-DD` in the
  adapter.
- `aria-label` values are in French too.

## Domain notes

- **Rarities**:
  - Dev codes, from most common to rarest: `common`, `uncommon`, `rare`, `epic`, `legendary`, `goat`.
  - Labels: Mid, Based, Sigma, Chad, Ascended, Goated, in `RARITY_LABELS`.
  - The design handoff uses the labels as codes (mid, sigma…). Never copy them into code.
  - `goat` exists only in the front and has no design yet.
  - The back has a `Rarity { id, name, sortOrder }` entity (`rarities` query, sorted by `sortOrder`).
    Mapping chosen by the human: the n-th rarity of that list takes the n-th code (`common`…`goat`),
    an unknown one falls back to `common`. It lives in `toRarity()` in `src/api/adapters.ts`, with
    `TODO(back): rarity contract (B2)`. Ask before changing it.
  - The catalogue's rarity filter lists the back's rarities (value = id, label = back `name`); the
    collection (mocks) still lists the codes with `RARITY_LABELS`.
- **Cards**: the UI `Card` (`@/types/card`) and the API `Card` (`@/api/cards`) differ:

  | UI `Card`                              | API `Card`                    | Adapter rule                      |
  | -------------------------------------- | ----------------------------- | --------------------------------- |
  | `id: number`                           | `id: string`                  | `Number(id)`                      |
  | `name`                                 | `title`                       | copy                              |
  | `illustration`                         | `imageUrl`                    | copy                              |
  | `rarity: Rarity`                       | `rarity: { id, name, sortOrder }` | `toRarity(id, rarities)`: rank |
  | `types: string[]`                      | `types: { id, name }[]`       | names                             |
  | `categories: string[]`                 | `categories: { id, name }[]`  | names                             |
  | `set: string` (the « Édition » filter) | none                          | `''` until the back has one (B8)  |
  | `description: string`                  | `description: string \| null` | `?? ''`                           |
  | `createdAt` `YYYY-MM-DD`               | `createdAt` full timestamp    | `.slice(0, 10)`                   |
  | none                                   | `updatedAt` full timestamp    | dropped                           |

  `toCard()` in `src/api/adapters.ts` applies these rules. The UI `Card` has no copy count. Adding one
  changes `CardBrowser`'s props: ask how it is shown (no Figma node shows it) even when the request
  asks for it.

- **Two catalogues** (product decision):
  - the public catalogue (`/catalogue`) shows all cards, without an account;
  - the personal collection (`/profile/collection`) shows the user's cards with their copy count.

  Today the back requires a JWT for `cards`, `cardsPage`, `card`, `categories`, `category`,
  `cardTypes` and `cardType`. A logged-out visitor on the catalogue therefore sees « Connectez-vous
  pour voir les cartes. » until the back opens these reads (request B1).

- **Mock data**:
  - When a screen needs data that the back doesn't expose yet (boosters today), build it on typed mock
    data in `src/mocks/<resource>.ts`, named after the data like `cards.ts` (e.g. `boosters.ts`).
  - Type it with a UI type from `src/types/`, and mark it `// TODO(back): <missing API>`.
  - Never put mocks in `src/api/`, never fake a GraphQL response, and list the missing API under
    « À demander au back ». (Playwright `page.route` mocks in `e2e/` are a separate question: ask.)
- **Auth**:
  - The JWT lasts 1 hour, with no refresh token.
  - When it expires, the next call logs the user out. On a `requiresAuth` page, the user is redirected
    to login with `?redirect=`.
  - Google sign-in is a full-page navigation to `apiUrl('/auth/google')`. The back returns to
    `/auth/callback#access_token=…`.

## Back-end needs

Never change the back from this repo and never hide a missing back feature in the front. Instead:

1. Code against the contract the back exposes today. Isolate any assumption in one function with
   `TODO(back): …`.
2. Write the request in your answer or PR under **« À demander au back »**, so a human can turn it into
   a Jira ticket.
3. If the whole fix belongs to the back or to the deploy config, deliver a diagnosis and the request
   in your answer. "Corrige ça" is not a request for a branch or a PR: create one only when the human
   asks for it. You may describe the exact back change (file, guard, line) so a back developer can
   apply it.

Known open requests: [docs/agents/decisions.md › Open back-end requests](docs/agents/decisions.md#open-back-end-requests).

## Git and pull requests

- **Branch** from an up-to-date `develop`:
  `git fetch --prune && git switch --no-track -c <type>/SCRUM-<n>-<kebab-slug> origin/develop`.
  Push it the first time with `git push -u origin HEAD`. (Without `--no-track`, the branch tracks
  `develop` and a plain `git push` fails or targets `develop`.)
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`.
  - Example: `feat/SCRUM-28-public-catalogue`. The slug is English.
  - Always use the full Jira key, never a bare number.
- **Commits** are in English, in gitmoji form: `:<gitmoji>: | Imperative subject`, e.g.
  `:bug: | Let the Google return through the router guard`. That is the gitmoji code, a space, a pipe,
  a space, then a capitalized subject with no final period.
  - Add a body (the why, as a bulleted list) unless the subject alone explains the change.
  - End with a `Refs: SCRUM-<n>` line in the last paragraph, directly above any `Co-Authored-By:` line
    your tool adds, with no blank line between them (git only parses the last paragraph as trailers).
  - Only use codes from this list:

  | Code                    | Use for                           | Code                 | Use for                                      |
  | ----------------------- | --------------------------------- | -------------------- | -------------------------------------------- |
  | `:sparkles:`            | new feature                       | `:bug:`              | fix that changes behavior (with its test)    |
  | `:adhesive_bandage:`    | small fix with no behavior change | `:recycle:`          | refactor                                     |
  | `:lipstick:`            | UI or style only                  | `:white_check_mark:` | tests                                        |
  | `:memo:`                | docs                              | `:wrench:`           | config files (Vite, TS, lint, Docker, nginx) |
  | `:construction_worker:` | CI workflow                       | `:heavy_plus_sign:`  | add a dependency                             |
  | `:heavy_minus_sign:`    | remove a dependency               | `:fire:`             | remove code or files                         |
  | `:truck:`               | move or rename                    | `:wheelchair:`       | accessibility                                |
  | `:label:`               | types                             | `:speech_balloon:`   | UI text and wording                          |
  | `:tada:`                | initial commit                    |                      |                                              |

- **Pull requests**:
  - Open one only when the human asks. Always target develop: `gh pr create --base develop`, or pick
    `develop` as the base on GitHub.
  - Title: the Unicode emoji of the main gitmoji (`:recycle:` → ♻️, `:bug:` → 🐛, `:sparkles:` → ✨;
    see [gitmoji.dev](https://gitmoji.dev)), then `SCRUM-<n> : <résumé en français>`. Example:
    `♻️ SCRUM-54 : un seul client GraphQL`.
  - Open it ready for review, with no reviewer, assignee or label unless the human names them.
  - Body in French, following `.github/pull_request_template.md`: Jira link, Pourquoi, Ce qui change,
    Tests, À demander au back, and Hors périmètre (delete it when empty).
  - One ticket per PR. If your branch starts from another unmerged branch, write `Dépend de #<PR>` as
    the first line of the body.
  - PRs are squash-merged by a human (decision). The merger sets the squash commit title to the PR
    title (for a one-commit PR, GitHub prefills the commit's own subject instead).
- **Updating a branch** (only when the human asks): `git fetch && git rebase origin/develop`, then
  `git push --force-with-lease` on your own branch. If your branch was stacked on a PR that has since
  been squash-merged, replay only your commits:
  `git rebase --onto origin/develop <last commit of the base branch>`. Never merge `main` into a
  branch. Never force-push `develop`, `main`, or a branch someone else pushed to.
- **Deploys:** a push to `develop` triggers the staging deploy job, and a push to `main` the production
  one. The deploy jobs run on GitHub-hosted runners and reach Portainer through Cloudflare Access.
  Neither branch is protected.
- **Reviewing a PR** when asked:
  - If the human gives no PR number or link, ask for it.
  - Answer in the chat, in French, with blocking points first, then suggestions. Quote `file:line`.
    Blocking: a broken check, a TL;DR rule or a **Never** item broken, a missing spec. Commit messages
    of the branch are suggestions only, since the squash replaces them.
  - Post on GitHub only if the human asks. Never approve, request changes or merge.
  - To run the checks, use a separate worktree:
    `git fetch origin <branch> && git worktree add ../review-<n> origin/<branch>`, then `npm ci` in it
    (worktrees don't share `node_modules`). Run the Definition of done there, then
    `git worktree remove ../review-<n>`.
  - Check the TL;DR rules first: component names, tokens, routes, commit and PR format.
