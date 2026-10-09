<template>
  <header>
    <nav>
      <ul>
        <li><router-link :to="{ name: 'home' }">Accueil</router-link></li>
        <li><router-link :to="{ name: 'collection_list' }">Mes cartes</router-link></li>
        <li><router-link :to="{ name: 'booster_list' }">Boosters</router-link></li>
        <li>
          Profile
          <ul>
            <li><router-link :to="{ name: 'profile' }">Mon compte</router-link></li>
            <li><router-link :to="{ name: 'settings' }">Paramètres</router-link></li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>
</template>
