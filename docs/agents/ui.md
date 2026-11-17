# UI: components, styles, tokens, rarities

Read [AGENTS.md](../../AGENTS.md) first. The design source of truth is Figma. Its workflow is described
in [docs/design-handoff/DESIGN_HANDOFF.md](../design-handoff/DESIGN_HANDOFF.md).

## Working from Figma

- The Figma file is `iSsaIbulMhR5hvyXsjc0Ct`, page "Homepage".
- `.mcp.json` declares the Figma MCP server (`https://mcp.figma.com/mcp`). Each person must
  authenticate with Figma themselves.
  - With access: call `get_design_context` and `get_screenshot` on the node ID.
  - Without access: use `DESIGN_HANDOFF.md` and the exported assets in `docs/design-handoff/assets/`.
- Generated Figma code is a **reference**. Never paste it as is: rewrite it with the existing atoms,
  tokens and BEM classes.
- Build bottom-up: tokens → atoms → card → screens, with one Figma component per code component.
- These Figma components already exist in code. Reuse them, don't recreate them:

  | Figma                            | Code              |
  | -------------------------------- | ----------------- |
  | Tag                              | `BaseTag`         |
  | Button                           | `BaseButton`      |
  | Header                           | `HeaderComponent` |
  | RarityIcon, RarityBadge          | same names        |
  | CardContent, TcgCard             | same names        |
  | Catalogue, Ma collection screens | `CardBrowser`     |

- Still to build: CarouselArrow, BoosterPack and BoosterPurchase, and the "Ouvrir un booster" screen.
  Following the naming rules, CarouselArrow is a generic atom (`components/ui/BaseCarouselArrow.vue`),
  and the booster components go in `components/booster/`. The screen is the `booster_list`
  placeholder (`views/game/BoosterListView.vue`).
- `DESIGN_HANDOFF.md` is in French and was written for Claude Code before `AGENTS.md`. Where they
  differ, `AGENTS.md` and this guide win:

  | `DESIGN_HANDOFF.md` says                       | Do                                                                               |
  | ---------------------------------------------- | -------------------------------------------------------------------------------- |
  | `Header`, `Tag`, `Button`                      | `HeaderComponent`, `BaseTag`, `BaseButton` (multi-word names)                    |
  | Rarity codes mid, based, sigma, chad, ascended | Dev codes `common` … `legendary` (see [Rarities](#rarities))                     |
  | Callback props (`onBuy`, `onFreeOpen`)         | Events (`buy`, `freeOpen`, listened as `@free-open`)                             |
  | "Le serveur MCP Figma est connecté"            | Only if you authenticated (see above)                                            |
  | Booster data "mockées dans un fichier"         | `src/mocks/boosters.ts`, typed, with `TODO(back)` (AGENTS.md › Domain notes)     |
  | Only 5 rarities (« Rareté » table)             | The `Rarity` type has 6 (with `goat`): ask how `goat` fits before you type rates |

- The Figma MCP server in `.mcp.json` is read by Claude Code. Cursor, Copilot and Codex need their own
  MCP configuration, which is not in the repo: add `https://mcp.figma.com/mcp` in your tool's MCP
  settings, outside the repo. Without Figma access, the handoff has text specs and the rarity assets only, not
  the booster images or screenshots: ask the human for exports before you build a screen.
- The design is 1440px only.
  - Small screens: keep them usable with `@include small-screen` (≤ 640px). Don't invent layouts.
  - Hover, focus and disabled states are not designed. Reuse `BaseButton`'s patterns:
    - hover: `filter: brightness(0.92)` on brand fills, `background: var(--color-gray-50)` on white
      fills;
    - disabled: `opacity: 0.5; cursor: not-allowed`;
    - focus: the global focus ring, which you never remove.
  - A whole screen or component that Figma doesn't have: ask before you design it. You may propose a
    minimal layout built from existing atoms, and wait for a yes.
  - Motion: put decorative animations and transitions inside
    `@media (prefers-reduced-motion: no-preference) { … }`. The booster opening animation and the card
    reveal are not designed: ask before you build them.
  - Carousels, sliders and similar widgets: their keyboard behavior, ARIA pattern and `aria-label`s
    are not designed. Ask, or propose arrows as real `<button>`s with French labels.

## Global styles

`src/main.ts` imports `src/assets/styles/main.scss` **once**, which loads `_fonts`, `_tokens`,
`_rarity` and `_base` in that order. Components never import global CSS.

`vite.config.ts` injects `@use "@/assets/styles/abstracts" as *;` into every component
`<style lang="scss">` and into `main.scss`. Vitest doesn't compile component styles, so a SCSS error never
fails `npx vitest run`: only `npm run build-only` or the dev server reveal it.

- Mixins and maps can be used without any import.
- **Never** `@use` the abstracts again in a component. The injection doesn't reach the partials that
  `main.scss` loads: a global partial that uses a map or a mixin loads them with
  `@use 'abstracts' as *;`, like `_tokens.scss`, `_rarity.scss` and `_base.scss` (`_fonts.scss` needs
  none).
- **Never** put a rule that outputs CSS in `abstracts/`: it would be copied into every component.

The SCSS maps (`$colors`, `$grays`, `$radii`, `$rarities`…) are the token **source**. Components
consume the CSS custom properties, never `map.get`.

## Tokens (CSS custom properties)

| Group        | Tokens                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Brand        | `--color-brand` #ff0505: primary buttons, brand accents. Not the error red                           |
| Status       | `--color-error` #dc2626, `--color-error-{bg,border,text}`, `--color-success-{bg,border,text}`        |
| Misc         | `--color-white`, `--color-focus` (a mint **placeholder**, marked TODO(design); deliberately not red) |
| Grays        | `--color-gray-{50,100,200,300,400,500,600,700,900}`: the Tailwind gray palette, and **no 800**       |
| Radii        | `--radius-sm` 6px, `-md` 10px, `-lg` 12px, `-xl` 16px, `-card` 18px, `-pill` 999px                   |
| Font weights | `--font-weight-regular` 400, `-medium` 500, `-semibold` 600, `-bold` 700                             |
| Font         | `--font-family-base` (Inter, self-hosted). Components never set `font-family`                        |

These Figma hex values map to existing tokens:

| Figma hex | Token    |
| --------- | -------- |
| `#E5E7EB` | gray-200 |
| `#D1D5DB` | gray-300 |
| `#9CA3AF` | gray-400 |
| `#6B7280` | gray-500 |
| `#FF0505` | brand    |

**No token exists** for spacing, font size, line height, shadow, z-index, breakpoints or motion. Write
literal px from Figma.

Don't invent `--space-*`, `--font-size-*`, `--shadow-*`, `--color-gray-800`, `--color-warning` or
`--color-text`. An undefined `var()` fails silently. Adding a token is an **ask-first** change. Add it to its map in
`abstracts/_maps.scss`. `_tokens.scss` emits every entry of `$colors`, `$grays`, `$radii` and
`$font-weights` (`$colors` keys are quoted). `$rarities` is emitted by `_rarity.scss`, which reads
only `border`, `badge-bg`, `badge-text`, `texture`, `glow-blur` and `glow-alpha`. A new map also needs
its own `@each` loop in `_tokens.scss`. A token with no map, like
`--font-family-base`, goes directly in `_tokens.scss`. Never define a token in a component.

Shadow and mask colors are the exception: write them literally (`rgb(17 24 39 / 12%)` in
`HeaderComponent`, `#000` / `#0000` in `TcgCard` masks, the handoff's booster glow
`rgba(255, 77, 26, 0.45)`).

### Colors from data

Colors that are content, not theme (a booster's gradient), are data. Type them as strings in the UI
type, keep them in `src/mocks/<resource>.ts` until the API provides them, and bind them with `:style`
on the root element: `:style="{ '--booster-gradient': booster.gradient }"`, consumed in SCSS as
`var(--booster-gradient)`. They need no token.

## Mixins (available in every component)

| Mixin                      | Effect                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `focus-ring($offset: 2px)` | 2px solid `--color-focus` outline                                         |
| `field-label`              | gray-500, 12px, semibold                                                  |
| `field-box`                | 48px high, 1px gray-200 border, `--radius-lg`, white background           |
| `small-screen { … }`       | `@media (max-width: 640px)`, the only breakpoint. Nest it inside the rule |
| `visually-hidden`          | hides an element but keeps it readable by screen readers                  |

`_base.scss` sets these globally:

- `box-sizing: border-box`;
- on `body`: Inter, gray-900 text on a gray-100 background;
- `img` and `svg` are `display: block` with `max-width: 100%`;
- form controls inherit font and color;
- a global `:focus-visible { @include focus-ring }`.

There is **no margin reset** on headings, `p` or `ul`. Reset them in your component.

## Components

### `components/ui/` (generic atoms)

| Component      | Props                                                                                                                                                                   | Notes                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BaseButton`   | `label?`, `variant?: 'primary' \| 'secondary' \| 'free'` (primary), `size?: 'md' \| 'sm' \| 'xs'` (md), `to?: RouteLocationRaw`, `type?: 'button' \| 'submit'` (button) | The slot falls back to `label`. With `to` it renders a `RouterLink`: `disabled` and `type` then have no effect. `md` is the Figma button, `sm` is for the header and filters, `xs` for pagination |
| `BaseTag`      | `label`, `kind?: 'type' \| 'category'` (type)                                                                                                                           | `type` is a gray chip, `category` an outlined pill                                                                                                                                                |
| `BaseAlert`    | `message?`, `variant?: 'error' \| 'success'` (error)                                                                                                                    | The slot falls back to `message`. `error` renders `role="alert"` (announced right away), `success` renders `role="status"`                                                                        |
| `TextField`    | `label`, `type?: 'text' \| 'email' \| 'password'`, `autocomplete?`, `placeholder?`, `error?` + `v-model` (string, required)                                             | Wires `useId`, `aria-invalid` and `aria-describedby` to the error message                                                                                                                         |
| `SearchInput`  | `label` (visually hidden), `placeholder?` + `v-model`                                                                                                                   | `type="search"` with the search icon                                                                                                                                                              |
| `FilterSelect` | `label`, `options: SelectOption[]` (`{ value, label }`), `placeholder?` + `v-model`                                                                                     | A native `<select>`. The value `''` means "no filter": add `{ value: '', label: 'Tous …' }` to allow a reset                                                                                      |
| `RarityBadge`  | `rarity: Rarity`                                                                                                                                                        | Icon + `RARITY_LABELS[rarity]`, colors from the rarity variables                                                                                                                                  |
| `RarityIcon`   | `rarity: Rarity`                                                                                                                                                        | 14×14, `aria-hidden`, color from `currentColor`                                                                                                                                                   |

### Feature components

| Component                            | Props                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TcgCard`                            | `rarity`, `illustration` (url), `name`, `types: string[]`, `description`, `categories: string[]`, `id: number`, `createdAt` (`YYYY-MM-DD`), all required |
| `CardContent`                        | the same props without `illustration`. Renders `#007` and the date in fr-FR (UTC); the description is clamped to 3 lines                                 |
| `CardBrowser`                        | `title`, `subtitle`, `cards: Card[]` (the **UI** Card). Search, 3 filters, sort and a paged grid. Used by the catalogue and the collection               |
| `AuthForm`                           | `title`, `subtitle`, `submitLabel`, `pending?`, `error?`. Emits `submit`. Slots: `default` (fields), `alternatives`, `footer`                            |
| `GoogleButton`                       | no props. Full-page navigation to the back's Google sign-in                                                                                              |
| `HeaderComponent`, `FooterComponent` | layout. `App.vue` imports them as `Header` and `Footer`                                                                                                  |

`TcgCard` departs from the handoff **on purpose**:

- `aspect-ratio: 333 / 466` is a minimum size, there is no `overflow: hidden`, and the width is fluid.
  A longer name or more tags grow the card instead of being cut. Only the description is cut:
  `CardContent` clamps it to 3 lines. Don't "fix" the card back to a fixed 360×504.
- The rarity frame is 12px of padding with the texture, not a CSS border.

## Rarities

Code values and display names:

- Codes, in `src/constants/rarity.ts`, from most common to rarest: `common`, `uncommon`, `rare`,
  `epic`, `legendary`, `goat`. The order matters: sorting uses `RARITIES.indexOf`.
- Labels, in `RARITY_LABELS`: Mid, Based, Sigma, Chad, Ascended, Goated. **Never hard-code a label.**
- The handoff uses the labels as codes (mid, based, sigma, chad, ascended) and names its asset files
  that way. Map them through the "Équivalent" column of the handoff. Those names never go into code.

How the styling works:

- Any element with `data-rarity="<code>"` gets 5 CSS variables: `--rarity-border`,
  `--rarity-badge-bg`, `--rarity-badge-text`, `--rarity-texture` and `--rarity-glow`. They cascade to
  its children.
- `TcgCard` and `RarityBadge` set the attribute.

Adding or changing a rarity touches 5 places:

1. `RARITIES` and `RARITY_LABELS`;
2. `$rarities` in `_maps.scss`;
3. the icon: `src/assets/icons/rarity-<code>.svg` (with `fill="currentColor"`), imported with `?raw`
   into the record in `RarityIcon.vue`, or a fallback entry like `goat: legendary`;
4. the texture PNG, or a `texture:` fallback in the map;
5. optionally, in `TcgCard.vue`: the image frame, and the `background-blend-mode: screen, normal` rule
   (today only `legendary` and `goat`).

Known issues:

- **Don't fix them inside an unrelated change.** Fixing one is its own task: ask for its Jira key.
- **rare and epic assets are swapped:**
  - `rarity-rare.svg` and `border-rare.png` are the handoff's _chad_ assets;
  - the epic assets are _sigma_;
  - the TcgCard image frames are swapped the same way: the `rare` selector has the concave notch
    (chad), and the `epic` one has the bevels and saw-tooth (sigma).

  Labels, colors and glows are right (epic = Chad, with a glow). The fix:
  1. Overwrite the content of the 4 asset files with the right handoff files: rare = `sigma`, epic =
     `chad`, from `docs/design-handoff/assets/icons/rarity-<name>.svg` and
     `docs/design-handoff/assets/textures/border-<name>.png`. They already use `fill="currentColor"`.
     Keep the front's file names.
  2. Swap the two frame rules in `TcgCard.vue`.
  3. Never touch `RARITY_LABELS` or `$rarities`.

  The fix covers icons, textures and frames, even when the request names only one of them. It is
  assets and SCSS only, so no spec can fail without it: check a rare and an epic card in the browser,
  and remove this entry and the one in decisions.md › Known gaps in the same change.

  `_rarity.scss` builds `--rarity-texture` from the file name `border-<code>.png`. `RarityIcon.vue`
  imports `rarity-<code>.svg?raw`.

- `goat` is front-only and has no design:
  - its border equals `--color-error`;
  - its icon, texture and frame are borrowed from legendary;
  - it is marked `TODO(design)`.
- The back has no rarity model, only `rarityId: Int`. There is no `rarityId → code` mapping yet.

## Icons and images

- **UI icons** are imported as URLs: `import searchIcon from '@/assets/icons/search.svg'`, then
  `<img :src="searchIcon" alt="" width="18" height="18" />`. They are raw Figma exports with hard-coded
  strokes, so CSS cannot recolor them.
- **Rarity icons** are imported with `?raw` and inlined with `v-html`, with `fill="currentColor"`. This
  is acceptable **only** for trusted local SVGs. Never use `v-html` with API data (lint does not catch
  it).
- File names:
  - icons: `src/assets/icons/<kebab-name>.svg`; rarity icons are `rarity-<code>.svg`;
  - textures: `src/assets/textures/border-<code>.png` (48×48 tiles).
- `src/assets/images/card-placeholder.jpg` is the only image, used by the mocks.
- There is no `public/` folder: import assets from `src/assets`.

## Class naming

- BEM through SCSS nesting:
  - value modifiers come from props: ``:class="`button--${variant}`"``;
  - boolean states use object syntax: `:class="{ 'text-field__input--error': error }"`.
  - No `is-*` or `has-*` classes.
- Root block for new components (decision): the component name in kebab-case without `Base` and
  without `View` (`TradeListView` → `.trade-list`). Older
  components use other root blocks: `TcgCard` → `.card`, `CardBrowser` → `.browser` (plus `.panel`),
  `AuthForm` → `.auth`, `SearchInput` → `.search`, `HeaderComponent` → `.header` (plus `.brand`,
  `.actions`, `.profile`), `AuthCallbackView` → `.callback`. Don't rename them.
- Use BEM element classes (decision). In new code, nested tag selectors are allowed only for margin
  resets (`h1, p { margin: 0; }`) and inside `:deep()` for slot content. Older components also style
  nested tags (`h1`/`p` in `AuthForm` and `CardBrowser`, `strong`/`span`/`a`/`button` in
  `HeaderComponent`, `img` in `TcgCard`): don't rewrite them.

## Accessibility checklist

- `<html lang="fr">` is set. Every UI string and `aria-label` is French.
- Every interactive element is reachable and visible with the keyboard:
  - use native elements;
  - keep the focus ring;
  - when a wrapper draws the field, use `&:focus-within { @include focus-ring; }`.
- Decorative `<img>` take `alt=""`. Decorative icons take `aria-hidden="true"`.
- Form fields:
  - take a `<label>`, through `TextField`, or `SearchInput`'s visually hidden label;
  - show errors with `aria-invalid` and `aria-describedby`;
  - form-level errors use `BaseAlert` (`role="alert"`).
- The header menu has an open `TODO(a11y)`: return focus on Escape, close on focus out.
