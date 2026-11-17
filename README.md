# Slop Battle: front

Web front of Slop Battle, the meme trading-card game of the SlopTeam (Ynov YDays). Vue 3 + Vite +
TypeScript + Pinia, talking to the NestJS GraphQL back (SlopBattle-back).

**Contributors and AI agents: read [AGENTS.md](AGENTS.md) first.** It holds the conventions, the
commands, the local setup with the back, and the git and PR rules. Details are in
[docs/agents/](docs/agents/).

## Quick start

```sh
nvm use                # Node 24, from .nvmrc
npm ci
cp .env.example .env   # leave VITE_BACKEND_URL empty: Vite proxies the back
npm run dev            # http://localhost:5173, the back expected on http://localhost:3000
```

Running the back locally is covered in [AGENTS.md › Local setup](AGENTS.md#local-setup).

## Checks

The same checks as CI, none of which modifies files:

```sh
npx oxlint . && npx eslint . && npm run type-check && npx vitest run && npm run build-only
npx prettier --check src/
```

`npm run lint` and `npm run format` rewrite the whole repo: run them only on purpose.

## Recommended setup

- **Editor:** [VS Code](https://code.visualstudio.com/) +
  [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar). Disable Vetur.
- **Browser:** Vue.js devtools for
  [Chromium](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/).
