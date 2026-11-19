# Copilot instructions

The full instructions for AI agents are in [AGENTS.md](../AGENTS.md) at the repo root, with guides in
[docs/agents/](../docs/agents/). Read them before you change code or review a PR. If they disagree with
this summary, they win.

The rules people miss most often:

- **Front only.** Every back-end call goes through `gql()` from `src/api/client.ts`. A full-page
  navigation to the back (Google sign-in) uses `apiUrl()`. Never edit the back repo.
- **Vue.** Write `<script setup lang="ts">` + `<style scoped lang="scss">`, with BEM classes. Component
  names are multi-word (`HeaderComponent.vue`, never `Header.vue`).
- **Tokens.** Take colors, radii and font weights only from the existing `var(--…)` tokens. Literal
  colors (hex, `rgb()`, names) are allowed only in shadows and masks.
- **Language.** UI text is French with vouvoiement. Never show a raw back-end message. Code, comments,
  commits and docs are English. PR titles and bodies are French.
- **Routes.** Navigate with named routes, which are snake_case. Never create a route under `/graphql`
  or `/auth/google`.
- **Checks.** Run tests with `npx vitest run`. `npm run lint` (whole repo) and `npm run format` (all
  of `src/`) rewrite files: never run them as checks.
- **Git.**
  - Commits: `:gitmoji: | Imperative English subject`, plus a `Refs: SCRUM-<n>` trailer.
  - Branches: `<type>/SCRUM-<n>-<slug>`.
  - PRs target `develop`, titled `<emoji> SCRUM-<n> : <résumé>`.
  - Never merge, approve or request changes.
- **Reviews.** Answer in French, blocking points first, then suggestions. The header already exists
  as `HeaderComponent`; routes under `/graphql` or `/auth/google` are proxied to the back.
