# Tana PGP

Tana PGP est une extension navigateur open-source conçue pour vérifier et chiffrer des contenus avec une logique PGP simple et légère. Elle permet de sécuriser des messages ou des blocs de contenu visibles dans une page web, tout en gardant une compatibilité forte avec les anciens mécanismes d’extensions navigateur.

## Objectif du projet

Le projet vise à apporter :

- une vérification de signature pour confirmer qu’un message n’a pas été altéré,
- un chiffrement de contenu basé sur une paire de clés publique/privée,
- une intégration légère dans une page web sans framework ni chaîne de build complexe,
- une gestion locale des clés via le stockage navigateur.

L’extension est pensée pour être simple, auditable et facile à personnaliser dans le cadre de pages statiques ou de contenus générés côté client.

## Fonctionnalités principales

### Vérification de signature

Le code de signature vérifie qu’un message correspond bien à la clé publique fournie. Cela permet de confirmer l’origine et l’intégrité d’un texte chiffré ou d’un message signé.

### Chiffrement et déchiffrement

Le flux principal inclut :

- transformation UTF-8 vers Base64,
- découpage des messages en morceaux pour le chiffrement,
- chiffrement avec la clé publique,
- déchiffrement avec la clé privée,
- vérification de la signature avant d’afficher le contenu final.

### Déchiffrement automatique

Le script injecté dans les pages inspecte les éléments HTML portant des classes spécifiques comme :

- `tana-simple-decryption`
- `tana-own-decryption`
- `tana-multi-decryption`

et déchiffre automatiquement le contenu au chargement ou lors d’un clic sur un bouton configuré.

### Génération et gestion des clés

La page d’options permet de :

- générer une nouvelle paire de clés,
- afficher la clé publique et la clé privée,
- modifier manuellement les clés stockées,
- supprimer la paire existante.

## Architecture du dépôt

```text
.
├── README.md
├── manifest.json
├── auto.js
├── .gitignore
├── package.json
├── lib/
│   └── crypto-helpers.js
├── js/
│   ├── crypto.js
│   ├── jquery.min.js
│   └── js-encrypt.js
├── options/
│   ├── options.html
│   └── options.js
├── css/
│   └── bootstrap.css
└── tests/
    └── crypto-helpers.test.js
```

### Description rapide des fichiers

- `manifest.json` : configuration de l’extension navigateur.
- `auto.js` : logique de chiffrement/déchiffrement injectée dans les pages.
- `options/options.html` : interface de gestion des clés.
- `options/options.js` : logique de stockage et manipulation des clés.
- `lib/crypto-helpers.js` : fonctions partagées pour le code de crypto.
- `js/` : bibliothèques tierces utilisées par le plugin.
- `tests/` : tests de validation des utilitaires de support.

## Installation et chargement dans le navigateur

### 1. Récupérer le dépôt

```bash
git clone https://github.com/your-user/tana-pgp.git
cd tana-pgp/tana
```

### 2. Vérifier les dépendances

Le projet est volontairement léger : il n’utilise pas de build system moderne. Il suffit de vérifier que la structure du dossier est présente.

### 3. Charger l’extension dans le navigateur

Selon le navigateur, la procédure est généralement la suivante :

- Firefox / navigateur basé sur Firefox :
  - ouvrir `about:debugging`
  - cliquer sur “Ce navigateur”
  - choisir “Charger un module complémentaire temporaire”
  - sélectionner le dossier `tana`

- Autres navigateurs compatibles avec les extensions WebExtensions :
  - suivre la procédure équivalente de chargement d’une extension non signée depuis le dossier du projet.

## Utilisation

### Générer une paire de clés

1. Ouvrir la page des options de l’extension.
2. Cliquer sur “Generate Key Pair”.
3. Copier la clé publique et la clé privée dans un endroit sûr.

### Stocker les clés

Les clés sont enregistrées dans le stockage local du navigateur `browser.storage.local`.

### Utiliser la clé publique

La clé publique sert à :

- chiffrer un message pour une personne donnée,
- vérifier la signature d’un message venant d’une autre personne.

### Utiliser la clé privée

La clé privée sert à :

- déchiffrer les messages destinés à l’utilisateur,
- signer un message avec la propre identité de l’utilisateur.

> La clé privée doit rester secrète. En cas de fuite, le message chiffré à l’aide de la clé publique correspondante peut être lu par l’attaquant.

## Format de données

Le plugin manipule des structures de type tableau d’éléments. En pratique, un message chiffré ressemble à une structure de ce type :

```json
[
  ["signature"],
  ["encrypted_part_1", "encrypted_part_2", "encrypted_part_3"]
]
```

L’élément `[0]` contient la signature, tandis que `[1]` contient les blocs chiffrés d’un message.

## Sécurité

### Bonnes pratiques

- ne jamais stocker la clé privée dans un fichier public,
- ne pas réutiliser la même clé sur plusieurs projets différents,
- sauvegarder la clé privée dans un coffre de mots de passe fiable,
- vérifier l’origine des clés publique avant de les utiliser pour du chiffrement réel.

### Limites du projet

Ce projet est un outil pédagogique / utilitaire et ne remplace pas :

- un système de gestion de clés complet,
- un flux de signature PGP standardisé complet,
- une intégration de sécurité avancée avec gestion d’outils externes.

Le code reste volontairement simple pour rester lisible et compatible avec une extension navigateur légère.

## Développement

### Installer les dépendances de test

Le dépôt a un script minimal pour validation.

```bash
npm install
```

### Exécuter les tests

```bash
npm test
```

### Vérifier la syntaxe JavaScript

```bash
npm run check
```

### Vérification locale recommandée

Avant de livrer une modification :

```bash
npm test && npm run check
```

## Bonnes pratiques de contribution

- garder le code compatible avec les navigateurs webextension anciens,
- privilégier la lisibilité et la robustesse sur le “compactage” du code,
- ajouter des tests pour les fonctions utilitaires partagées,
- éviter les globals implicites,
- préférer des garde-fous explicites avant d’utiliser des structures complexes.

## FAQ

### Pourquoi il y a des bibliothèques dans `js/` ?

Parce que le projet intègre des dépendances tierces directement dans le dossier de l’extension pour rester autonome et compatible avec le chargement de fichiers locaux.

### Le projet utilise-t-il un bundler ?

Non. Il s’agit d’un projet minimal, sans compilation ni transpilation, dans le but de rester facile à comprendre et à déboguer.

### Est-ce qu’il supporte plusieurs pages ou plusieurs domaines ?

Le `manifest.json` déclare un `content_scripts` sur toutes les URLs (`<all_urls>`), donc le script est injecté sur la majorité des pages ouvertes dans le navigateur.

### Que faire si les clés ne chargent pas ?

Vérifier :

- que l’extension est bien activée,
- que le stockage local du navigateur est accessible,
- que la page d’options ne contient pas d’erreur JavaScript,
- que la clé stockée a le bon format.

## Licence

Ce projet est distribué sous licence ouverte. Voir le fichier `LICENSE` pour les détails.

## Remerciements

Merci à toutes les personnes qui contribuent à garder ce projet simple, abordable et utile pour la sécurité sur le web.
