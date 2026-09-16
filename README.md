# Church Connect

Church Connect est une application mobile développée avec Expo, React Native et Supabase.

## Technologies utilisées

- Expo
- React Native
- TypeScript
- Expo Router
- Supabase
- React Hook Form
- Zod

## Prérequis

Avant d'installer le projet, il faut avoir :

- Node.js installé ;
- npm installé ;
- Expo disponible via les commandes npm/npx ;
- un projet Supabase configuré ;
- les variables d'environnement nécessaires au fonctionnement de l'application.

## Installation du projet

1. Cloner ou récupérer le projet sur la machine.

2. Se placer dans le dossier du projet :

   ```bash
   cd churchConnect
   ```

3. Installer les dépendances :

   ```bash
   npm install
   ```

4. Créer un fichier `.env` à la racine du projet.

5. Ajouter les variables d'environnement nécessaires :

   ```env
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_KEY=
   EXPO_PUBLIC_SUPABASE_PREDICATION_AUDIO_BUCKET=
   ```


## Configuration de Supabase

L'application utilise Supabase pour :

- l'authentification ;
- la base de données ;
- les politiques RLS ;
- les notifications internes ;
- le stockage des images et des fichiers audio ;
- la gestion des profils, groupes, annonces et prédications.

Les migrations SQL du projet se trouvent dans le dossier :

```text
supabase/migrations
```

Elles doivent être appliquées sur la base Supabase afin de créer ou mettre à jour les tables, fonctions, triggers, buckets et politiques de sécurité nécessaires.

## Lancement de l'application

Pour lancer le serveur de développement Expo :

```bash
npm run start
```

Pour lancer directement la version Android :

```bash
npm run android
```

Pour lancer directement la version iOS :

```bash
npm run ios
```

Pour lancer la version web :

```bash
npm run web
```

## Vérification du code

Pour lancer la vérification du code avec ESLint :

```bash
npm run lint
```

## Utilisation de l'application

### Création de compte et connexion

Un utilisateur peut créer un compte, se connecter, puis compléter ou modifier son profil.

Le profil contient notamment les informations personnelles de l'utilisateur, son image de profil et son rôle dans l'application.

### Accueil

L'écran d'accueil présente les contenus principaux de l'application, notamment les annonces et les informations utiles à la communauté.

### Annonces

Les annonces permettent de diffuser des informations importantes aux utilisateurs.

Selon les permissions configurées, seuls certains rôles peuvent créer, modifier ou supprimer des annonces.

### Prédications

La section des prédications permet de consulter les messages disponibles.

Les utilisateurs peuvent écouter une prédication, consulter ses informations et gérer leurs favoris.

La création, la modification et la suppression des prédications sont réservées aux utilisateurs autorisés.

### Groupes

La section des groupes permet aux utilisateurs d'accéder aux groupes auxquels ils appartiennent.

Les membres peuvent consulter les informations du groupe et participer aux échanges selon les règles d'accès définies.

Le créateur ou les administrateurs d'un groupe peuvent gérer certains paramètres et membres du groupe.

### Notifications

L'application dispose d'un système de notifications internes.

Les notifications peuvent être générées lors de certains événements, comme :

- la publication d'une annonce ;
- l'envoi d'un message dans un groupe ;
- l'ajout ou l'invitation d'un utilisateur dans un groupe.

### Mon espace

L'écran personnel de l'utilisateur permet de consulter son profil, ses statistiques, ses groupes, ses favoris et les accès rapides vers les principales fonctionnalités.

## Rôles et permissions

L'application distingue plusieurs niveaux d'accès :

- membre ;
- administrateur ;
- pasteur.

Les permissions sont contrôlées côté application et côté base de données grâce aux politiques RLS de Supabase.

Les membres disposent principalement de droits de consultation et d'utilisation des fonctionnalités courantes.

Les administrateurs et le pasteur disposent de permissions supplémentaires pour gérer certains contenus sensibles, comme les annonces, les prédications, les catégories et certains fichiers.

## Structure du projet

```text
app/
src/
supabase/
assets/
```

Le dossier `app` contient les routes Expo Router.

Le dossier `src` contient le code principal de l'application, organisé par couches :

- `application` pour les services applicatifs ;
- `composition` pour l'assemblage des dépendances ;
- `domain` pour les entités, règles et interfaces ;
- `infrastructure` pour les implémentations Supabase et Storage ;
- `presentation` pour les écrans, composants et hooks ;
- `shared` pour les éléments communs.

Le dossier `supabase` contient les migrations liées à la base de données et à la sécurité.

## Rapport d'utilisation de l'IA

Le rapport d'utilisation de l'intelligence artificielle est disponible dans le fichier :

```text
IA_REPORT.md
```
