<!-- Titre : <emoji> SCRUM-<n> : <résumé en français>. Base : develop. -->
<!-- Si la branche part d'une autre PR non mergée, première ligne : « Dépend de #<PR> ». -->

Ticket Jira : [SCRUM-<n>](https://ynovbrainrot.atlassian.net/browse/SCRUM-<n>)

### Pourquoi

<!-- Le problème ou le besoin, en 1 à 3 phrases. -->

### Ce qui change

-

### Tests

- [ ] `npx oxlint . && npx eslint . && npm run type-check && npx vitest run && npm run build-only`
- [ ] `npx prettier --check src/`
- [ ] Vérifié dans le navigateur (`npm run dev`), y compris au clavier, si l'interface change
- [ ] Tableaux de `AGENTS.md` / `docs/agents/` à jour si un composant, un module API, une route ou un token change

<!-- Ce qui a été testé à la main, et comment. -->

### À demander au back

<!-- Ce qui manque côté back, ou « Rien ». -->

### Hors périmètre

<!-- Ce que cette PR ne fait volontairement pas, ou supprimer la section. -->
