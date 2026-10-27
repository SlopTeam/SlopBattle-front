# Design handoff — Slop Battle TCG

Source of truth: Figma file `iSsaIbulMhR5hvyXsjc0Ct` (« Sans titre », page **Homepage**).
Base URL: `https://www.figma.com/design/iSsaIbulMhR5hvyXsjc0Ct/Sans-titre?node-id=<id avec - au lieu de :>`

## Instructions pour Claude Code

1. Le serveur MCP Figma est connecté. Pour chaque composant ou écran, appelle `get_design_context` sur son node ID (tableau ci-dessous) et `get_screenshot` pour comparer visuellement. Le code renvoyé est une **référence** : adapte-le à la stack et aux conventions du projet. Ne colle pas du code généré tel quel.
2. Construis **bottom-up** : tokens → atomes → carte → écrans. Un composant Figma = un composant code.
3. Réutilise ce qui existe déjà dans le repo (boutons, layout, header…) avant de créer quoi que ce soit.
4. Après chaque composant, lance l'app et compare au screenshot Figma avant de passer au suivant.
5. Les textes de l'UI sont en français et doivent le rester.

## Ordre de build

| # | Élément | Node ID | Props Figma → props code |
|---|---|---|---|
| 1 | Tokens rareté (variables) | — | voir § Tokens |
| 2 | `RarityIcon` | `12:132` `12:135` `12:138` `12:141` `12:144` | `rarity` — SVG dans `assets/icons/` |
| 3 | `RarityBadge` | `12:172` | `rarity` |
| 4 | `Tag` | `12:177` | `label`, `kind: "type" \| "category"` |
| 5 | `Button` | `28:823` | `label`, `variant: "primary" \| "secondary" \| "free"` |
| 6 | `CarouselArrow` | `28:830` | `direction: "prev" \| "next"` |
| 7 | `CardContent` | `12:178` | `name`, `types[]`, `description`, `categories[]`, `id`, `createdAt`, `rarity` |
| 8 | `TcgCard` | `9:259` | `rarity`, `illustration` (url) + props de `CardContent` |
| 9 | `BoosterPack` | `28:816` | `name`, `info`, `size: "lg" \| "sm"`, `color` (dégradé), `image` |
| 10 | `BoosterPurchase` | `28:831` | `price`, `freeAvailable: boolean`, `onBuy`, `onFreeOpen` |
| 11 | `Header` | `25:976` | — |
| 12 | Écran **Catalogue** | `1:4` | grille de `TcgCard` |
| 13 | Écran **Ma collection** | `1:9` | recherche, filtres (set/type/rareté), tri, grille, pagination |
| 14 | Écran **Ouvrir un booster** | `25:1415` | carrousel de `BoosterPack` + infos + taux + `BoosterPurchase` |

## Tokens

Police : **Inter** (Regular 400, Medium 500, Semi Bold 600, Bold 700). Couleur de marque : `#FF0505`.

Collection de variables « Rareté » (une variable par rareté, à exposer en CSS custom properties) :

| Rareté (code) | Label UI | Équivalent | border | badge-bg | badge-text | Glow |
|---|---|---|---|---|---|---|
| `mid` | Mid | common | `#9CA3AF` | `#F3F4F6` | `#4B5563` | — |
| `based` | Based | uncommon | `#22C55E` | `#DCFCE7` | `#15803D` | — |
| `chad` | Chad | rare | `#3B82F6` | `#DBEAFE` | `#1D4ED8` | — |
| `sigma` | Sigma | epic | `#A855F7` | `#F3E8FF` | `#7E22CE` | `0 0 16px` border @ 35 % |
| `ascended` | Ascended | legendary | `#F59E0B` | `#FEF3C7` | `#B45309` | `0 0 24px` border @ 50 % |

Conseil : une seule règle `.card[data-rarity="…"]` qui fixe `--rarity-border`, `--rarity-badge-bg`, `--rarity-badge-text`, `--rarity-texture`, plutôt que 5 composants.

## Carte TCG — détails qui ne passent pas bien par l'export auto

- **Format** : 360 × 504 (≈ 5:7), `border-radius: 18px`, `overflow: hidden`.
- **Bordure 12 px** = padding de la carte, pas une `border` CSS. Le fond de la carte = couleur de rareté + texture répétée :
  ```css
  .card { padding: 12px; background: var(--rarity-texture) 0 0 / 48px repeat, var(--rarity-border); }
  .card[data-rarity="ascended"] { background-blend-mode: screen, normal; }
  ```
  Textures (tuiles 48 px, transparentes, à poser par-dessus la couleur) : `assets/textures/border-<rarity>.png`.
- **Illustration** : 200 px de haut, radius 6 px en haut. **Contenu** : fond blanc, radius 6 px en bas, padding 16 px, gap 10 px.
- **Découpe de l'image par rareté** (calque « Cadre image » dans Figma, à faire en `clip-path`/`mask` sur l'image, l'illustration reste échangeable) :
  - `mid` : rectangle simple
  - `based` : coins supérieurs biseautés 16 px — `clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px)`
  - `chad` : coins supérieurs en encoche concave r = 20 px — `mask` avec deux `radial-gradient(20px at 0 0 / 100% 0, #0000 98%, #000)`
  - `sigma` : biseaux 22 px + bas en dents de scie (pas 14 px, hauteur 10 px) — générer le polygon en JS
  - `ascended` : arche avec pointe centrale — `clip-path: path(...)`, récupérer le tracé exact via `get_design_context` sur le calque « Cadre image » de la variante Ascended
- **Pied de carte** : séparateur 1 px `#E5E7EB` en haut, 3 colonnes égales : ID (gauche, 11 px Medium `#6B7280`) · `RarityBadge` (centre) · date (droite).

## Booster opening — comportement attendu

- Carrousel de 5 boosters : l'élément sélectionné est au centre en taille `lg` avec un glow `0 16px 40px -4px rgba(255,77,26,.45)`, les autres en `sm`. Opacité des voisins 0.7, des extrêmes 0.4.
- Flèches prev/next + clic sur un booster = changer la sélection. Points de pagination : actif = pilule 24 × 8 `#FF0505`, inactif = 8 × 8 `#D1D5DB`.
- Le panneau d'infos (nom, tags, description, taux d'obtention) et le prix suivent le booster sélectionné.
- Bouton « Ouvrir gratuitement » + séparateur « ou » + texte de recharge : affichés seulement si `freeAvailable`.
- Données des boosters (nom, couleurs du dégradé, prix, taux) : mockées dans un fichier de données en attendant le back.

## Hors scope du design (à décider avec l'équipe)

- L'animation d'ouverture du booster et l'écran de révélation des 5 cartes ne sont pas encore designés.
- États hover/focus/disabled des boutons et du carrousel non designés : utiliser des valeurs sobres et accessibles (focus visible).
- Responsive : maquettes en 1440 px uniquement.
