# Decisions, known gaps and open questions

Why the rules in [AGENTS.md](../../AGENTS.md) exist. The rule for open cases is in
[AGENTS.md › Decide or ask](../../AGENTS.md#decide-or-ask):

- follow the most similar existing file for code structure and style that the docs don't cover (the
  decisions below win over older code);
- ask for product, design, copy and back-end questions, starting with the [Unknowns](#unknowns-ask-dont-guess).

## Architecture decisions

| #   | Decision                                                                                                                  | Why                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **One GraphQL client**: `src/api/client.ts` (axios), set up in SCRUM-54                                                   | Two clients used to coexist, with different token keys and different URL meanings. Everything now goes through `gql()`                                                                                         |
| A2  | **Same origin**: deployed builds keep `VITE_BACKEND_URL` empty. Vite proxies in dev, nginx (`BACKEND_UPSTREAM`) in Docker | No CORS to configure. The Google redirect and `/graphql` share the front's origin. Never add a build argument for it                                                                                           |
| A3  | **Generated API types**: `npm run codegen` writes `src/api/generated/graphql.ts` (SCRUM-62)                               | The back's schema is code-first and in memory (no `.graphql` file), so the codegen introspects a running back (introspection is on unless `NODE_ENV=production`). The output is committed, so CI needs no back |
| A4  | **Two card views**: a public catalogue (all cards, no account) and a personal collection (behind auth, with copy counts)  | Product decision. The public view is blocked until the back opens its reads (see B1)                                                                                                                           |
| A5  | **Front only**: back problems become requests, never workarounds                                                          | The back is a separate repo (SlopBattle-back), owned by the team's back-end developers                                                                                                                         |
| A6  | API shapes live in `src/api/*.ts`, UI shapes in `src/types/`, and adapters in `src/api/adapters.ts`                       | Keeps components free of back details. The back contract is still moving (rarity, ids, set)                                                                                                                    |
| A7  | **Mock data** in `src/mocks/<domain>.ts` while the back has no API for a screen                                           | The roadmap needs screens (boosters) before their APIs. Mocks stay out of `src/api/` so that wiring the API later only swaps the import                                                                        |

## Convention decisions

These were settled where the code was inconsistent or silent. Older code may still follow the other
variant. Don't rewrite it just for that.

| Topic                  | Rule                                                                                                                                                  | The other variant you will see                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI tone                | Vouvoiement                                                                                                                                           | Tutoiement in the client's error messages on `develop` before SCRUM-54. None after it                                                                 |
| Language               | UI in French. Code, comments, branch commits and docs in English. PR titles and bodies in French: the PR title becomes the squash commit on `develop` | French comments in `Dockerfile`, `ci.yml`, nginx; `DESIGN_HANDOFF.md` is French                                                                       |
| Generic error          | `Une erreur est survenue, réessayez.`                                                                                                                 | —                                                                                                                                                     |
| Full sentences         | End with a period                                                                                                                                     | the system views (`ComingSoonView`, `MaintenanceView`, `NotFoundView`)                                                                                |
| Imports                | Always `@/…`                                                                                                                                          | `./App.vue` and `./router` in `main.ts`; `./client`, `./categories`, `./cardTypes` in `src/api/`                                                      |
| JSDoc                  | One line on every new exported function                                                                                                               | `gql`, `token.ts`, `login`, `register`, `getCards`… have none                                                                                         |
| Query function names   | `get*`                                                                                                                                                | `fetchMyProfile`                                                                                                                                      |
| GraphQL documents      | `/* GraphQL */` tag + an operation name                                                                                                               | — (fixed with the codegen, SCRUM-62)                                                                                                                  |
| API function style     | New modules: arrow functions with `.then((d) => d.x)`. In an existing module, match it                                                                | `async function` in `auth.ts`                                                                                                                         |
| API → UI conversion    | `to<UiType>()` in `src/api/adapters.ts`                                                                                                               | —                                                                                                                                                     |
| New atoms              | `Base` prefix in `components/ui/`                                                                                                                     | `TextField`, `SearchInput`, `FilterSelect`, `RarityBadge`, `RarityIcon`                                                                               |
| Events                 | camelCase in `defineEmits`, kebab-case listeners; never callback props                                                                                | `onBuy` / `onFreeOpen` props in `DESIGN_HANDOFF.md`                                                                                                   |
| BEM root block         | The kebab-case component name without `Base` and without `View`                                                                                       | `.card` (TcgCard), `.browser` (CardBrowser), `.auth` (AuthForm), `.search` (SearchInput), `.header` (HeaderComponent), `.callback` (AuthCallbackView) |
| Self-closing           | Components with no slot content                                                                                                                       | `<router-view></router-view>` in `App.vue`                                                                                                            |
| TODO format            | `TODO(<scope>): English text`                                                                                                                         | `TODO : …` (French HTML comments in 3 views, an English `//` comment in `src/mocks/cards.ts`), `ponytail:` in `useApi.ts`                             |
| `catch` variable       | `error`                                                                                                                                               | `e`                                                                                                                                                   |
| Vitest imports         | Alphabetical                                                                                                                                          | `{ describe, it, expect, vi }`                                                                                                                        |
| Product name in the UI | "Slop Battle"                                                                                                                                         | "Slop battle", "SlopBattle"                                                                                                                           |
| Comment spelling       | American English (`color`)                                                                                                                            | `colour` in 3 comments                                                                                                                                |
| Node                   | 24 (`.nvmrc`), as in CI and the Dockerfile                                                                                                            | local Node 26 works thanks to the vitest flag                                                                                                         |

## Process decisions

| Topic             | Rule                                                                                                                                                               | History                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Branch names      | `<type>/SCRUM-<n>-<kebab-slug>`                                                                                                                                    | `feat/api_client`, `feat/scrum28_Catalogue`, `feat-76-…`                         |
| Commits           | `:gitmoji: \| Imperative English subject`, using the code list in AGENTS.md                                                                                        | free text (`added comment`) and conventional (`feat(76): …`)                     |
| Agents and git    | Commit, push or open a PR only when the human asks. Never merge or approve                                                                                         | —                                                                                |
| PR base           | `develop`, always                                                                                                                                                  | 4 of the first 6 PRs went to `main`, because `main` is the GitHub default branch |
| PR title/body     | `<Unicode emoji> SCRUM-<n> : <résumé>`, French body from the PR template                                                                                           | the first 6 PRs had empty bodies                                                 |
| Jira keys         | Always the full key `SCRUM-<n>`: GitHub for Jira only links full keys                                                                                              | `76`, `scrum28`                                                                  |
| Updating a branch | Rebase on `origin/develop`, then `--force-with-lease` on your own branch                                                                                           | merging `main` into the branch                                                   |
| Merges            | Squash, by a human, after a teammate's review. The merger sets the squash commit title to the PR title (for a one-commit PR, GitHub prefills the commit's subject) | merge commits and squashes mixed; 3 of 6 PRs merged without review               |
| AI attribution    | Keep whatever trailer your tool adds (`Co-Authored-By: …`). Never fake human authorship                                                                            | —                                                                                |

## Known gaps

Don't be surprised by these. Don't fix them inside an unrelated change: fixing one is its own task.

- **Production back-end routing**:
  - the nginx image proxies `/graphql`, `/auth/google` and `/media` to `BACKEND_UPSTREAM`. It must be set in the
    Portainer stack to the back's root, e.g. `http://api:3000`. Otherwise those routes return 503;
  - the back's `FRONT_URL` must be the deployed front's exact origin;
  - the back's `GOOGLE_CALLBACK_URL` must be absolute (`https://<front>/auth/google/callback`) and
    registered as is in the Google console.
- **CI**:
  - runs twice per PR commit (push + pull_request);
  - doesn't check Prettier and doesn't run Playwright;
  - oxlint's type-aware rules (`no-floating-promises`…) are configured but not executed.
- **E2E**: `e2e/vue.spec.ts` is the create-vue scaffold and expects an `h1` "Home" (from `HomeView.vue`).
  It is not a real test yet. Playwright is configured for chromium, firefox and webkit.
- **Editor settings**:
  - `.vscode/` is not committed, so format-on-save is not shared;
  - run `npx prettier --check src/` yourself.
- **Mocks**: Ma collection still renders `src/mocks/cards.ts` (B3). The catalogue loads from the back.
- **Rarities**:
  - the rare and epic assets are swapped (icons, textures, frames);
  - `goat` has no design yet.

  See [ui.md](ui.md#rarities).

- **Auth errors**: `toAuthError` (`src/stores/auth.ts`) maps only the 401 of `login` and the 409 of
  `register`. Every other `ApiError` keeps its raw message, which can be English ("Unauthorized",
  "email must be an email") or say "nom d'utilisateur". `AuthError` has no `status`, so a form can't
  branch on it.
- **Account deletion**: `deleteMyAccount` fails while the user owns cards (no delete cascade on
  `user_cards`).
- **Validation**: the existing forms don't check the 30-character pseudo maximum, and their e-mail
  checks are looser than the back's, so the back's English messages can reach the UI. New forms
  validate the full rules.
- **Leftover files** to ignore:
  - the Cypress entries in `tsconfig.node.json` and `.gitignore`;
  - `src/__tests__/.gitkeep` and `src/stores/.gitkeep`.

## Open back-end requests

These are the needs to pass on to the back team. Code against today's contract, and isolate the
assumption in one place.

| #   | Need                                                                                                                                                                      | Front impact today                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| B1  | Public reads: `cards`, `card`, `categories`, `category`, `cardTypes` and `cardType` without a JWT                                                                         | Logged-out visitors see « Connectez-vous pour voir les cartes. » on the catalogue |
| B2  | A rarity contract: an entity or enum, with a stable mapping to `common…goat` (or the back's own codes)                                                                    | The front assumes `rarityId` 1–6 = `common`–`goat`                                |
| B3  | `myCardCollection` should return the card details, or at least allow `card { … }`                                                                                         | Two calls plus a client-side join                                                 |
| B4  | Google OAuth errors (consent refused, unverified e-mail, e-mail linked to another Google account) should redirect to `/auth/callback#error=<code>` instead of a JSON page | Users stay stuck on the back's error page                                         |
| B5  | Guards on the admin mutations (`createCard`, `updateCard`, `removeCard`, and the same for Category and CardType)                                                          | Anyone with the URL can change the catalogue                                      |
| B6  | Populate `card` in the result of `addCardsInCollection` / `removeCardsFromCollection`                                                                                     | Select only `id` and `quantity`                                                   |
| B7  | French validation messages, or stable error codes                                                                                                                         | English class-validator messages can reach the UI                                 |
| B8  | A card "set" (édition): the UI filters and searches on it, the back has no such field                                                                                     | `toCard` leaves `set` empty; the catalogue filters by category instead            |

## Unknowns: ask, don't guess

- Whether the assumed rarity mapping (`rarityId` 1–6 = `common`–`goat`, unknown → `common`) becomes the
  contract (B2), and whether `goat` stays (the handoff's « Rareté » table has 5 rarities).
- Which category, if any, is a card's set (B8). Until then `toCard` leaves `set` empty.
- How copy counts are shown in Ma collection: no Figma node shows them.
- Boosters: how buying works, prices, the free booster's cooldown. No back API exists yet.
- The economy (SlopCOIN, `coins` on the profile): the rules are not specified.
- Avatars: the back never fills `avatarUrl` today, and there is no placeholder image or alt text.
- A card with an empty or broken `imageUrl`.
- An empty catalogue (no cards at all): no wording yet.
- An end-to-end test strategy: a real back in CI (secrets, seed) or Playwright `page.route` mocks.
- Who owns what outside the repo (Portainer stack, back env, Google console): ask the human who to
  contact.
- Responsive layouts beyond "usable at ≤ 640px".
- Any screen, color, size, state or wording that Figma and the request don't specify.
