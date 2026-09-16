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
- Git installé ;
- un compte Supabase.

## Installation du projet

### 1. Récupérer le projet depuis GitHub

Cloner le dépôt sur la machine :

```bash
git clone <url-du-repository-github>
```



### 2. Créer le projet Supabase

Créer un nouveau projet depuis le tableau de bord Supabase :

1. Se connecter à Supabase.
2. Créer un nouveau projet.
3. Choisir le nom du projet, le mot de passe de base de données et la région.
4. Attendre que Supabase termine l'initialisation du projet.

Le projet Supabase doit être vide au départ. La structure de la base sera créée
avec les migrations SQL du dépôt.

### 3. Récupérer les clés Supabase

Dans le tableau de bord Supabase :

1. Ouvrir le projet.
2. Aller dans `Project Settings`.
3. Aller dans `API`.
4. Copier la valeur `Project URL`.
5. Copier la clé publique `anon` ou `publishable`.

La clé à utiliser dans l'application est la clé publique.

### 4. Configurer le fichier `.env`

Créer un fichier `.env` à la racine du projet, ou partir d'un fichier déjà
préparé avec les placeholders suivants :

```env
EXPO_PUBLIC_SUPABASE_URL=<project-url-supabase>
EXPO_PUBLIC_SUPABASE_KEY=<cle-publique-anon-ou-publishable>
EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET=church-images
EXPO_PUBLIC_SUPABASE_PREDICATION_AUDIO_BUCKET=predications-audio
```

Remplacer uniquement les placeholders Supabase :

- `<project-url-supabase>` par la valeur `Project URL` ;
- `<cle-publique-anon-ou-publishable>` par la clé publique Supabase.

Les noms de buckets doivent rester identiques, car ils sont utilisés par le code
et par les policies Storage.

### 5. Migrer la structure des tables

Les migrations SQL se trouvent dans :

```text
supabase/migrations
```

Commencer par exécuter la migration de création des tables :

```text
supabase/migrations/20260904090000_create_core_tables.sql
```

Cette migration crée les tables principales :

- `user_profil` ;
- `categorie_predication` ;
- `predication` ;
- `predication_favorites` ;
- `predication_likes` ;
- `groupe` ;
- `groupe_membre` ;
- `annonce` ;
- `message_groupe` ;
- `notification`.

Elle peut être exécutée depuis le SQL Editor Supabase.

### 6. Migrer les règles RLS et les policies

Après la création des tables, exécuter la migration des policies :

```text
supabase/migrations/20260916100000_policies_by_table.sql
```

Cette migration active Row Level Security et crée les policies par table.
Elle contient aussi les fonctions SQL utilisées par les règles d'accès.

### 7. Créer les buckets Storage

Dans Supabase Storage, vérifier que les buckets suivants existent :

```text
church-images
predications-audio
```

Si les buckets n'existent pas encore, les créer en public depuis l'interface
Supabase Storage, ou exécuter les migrations du dossier `supabase/migrations`
qui créent les buckets.

### 8. Installer les dépendances

Installer les dépendances Node.js :

```bash
npm install
```

### 9. Lancer l'application

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

Elles permettent de créer ou mettre à jour les tables, fonctions, triggers,
buckets et politiques de sécurité nécessaires.

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
