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

### 5. Initialiser la base de données

Le SQL du dépôt est regroupé dans trois fichiers à exécuter dans cet ordre,
depuis le SQL Editor Supabase :

| Ordre | Fichier dans `supabase/migrations` | Contenu |
| --- | --- | --- |
| 1 | `20260904090000_create_core_tables.sql` | Création des dix tables, clés étrangères, cascades, statut d’accès et publication realtime du profil. |
| 2 | `20260915100000_transactions.sql` | Fonctions et RPC, décision d’accès, changement des rôles, protection des profils, sessions et propriété Storage. |
| 3 | `20260916100000_policies_by_table.sql` | Activation RLS et policies des tables et du Storage, dont le contrôle des sessions actives et du statut d’accès. |

Chaque fichier est encadré par `BEGIN` / `COMMIT` : une erreur annule les
changements du fichier concerné. Les fonctions sont créées avant les policies
qui les utilisent.

Ces fichiers consolident les anciennes migrations. La base existante possède
déjà les corrections précédentes. L’ajout de la validation des inscriptions exige toutefois l’ajout du champ, puis l’application des transactions et des RLS.
Sur un projet déjà migré, ne pas lancer directement `supabase db push` avec ces
fichiers sans avoir aligné l’historique des migrations Supabase.

La migration de création supprime également l’ancienne colonne `annonce.image_url`
et ses URL d’images. La migration des transactions supprime l’ancien indicateur
`user_profil.is_admin` au profit de `role_app` et permet au pasteur et aux
administrateurs d’accepter une inscription précédemment refusée.
Dans l’écran Demandes, le filtre Refusés propose l’acceptation et la suppression
du compte après confirmation. La suppression utilise la fonction `delete-account`
et conserve les restrictions de rôle existantes.

### 6. Règles RLS et permissions

La gestion des catégories permet la recherche par nom, le renommage et la suppression.
Les noms sont uniques sans distinction de casse, d’espaces au début ou à la fin,
ni d’espaces successifs. Cette règle est contrôlée par le service et par l’index
`categorie_predication_name_unique` du fichier de création des tables.
La suppression conserve les prédications et remet leur catégorie à `NULL`.
Les catégories et les prédications sont synchronisées avec Realtime et TanStack Query.
Sur une base existante, appliquer l’index unique, le remplacement de la clé étrangère
`predication_categorie_fkey` avec `ON DELETE SET NULL`, et l’ajout des tables à la
publication Realtime depuis ce fichier. Les éventuels doublons existants doivent
être renommés avant la création de l’index unique.

Le fichier des tables intègre les cascades : supprimer un groupe retire ses
membres et messages ; supprimer une prédication retire ses favoris et likes.
Le test `tests/deletion-cascades.sql` vérifie ces suppressions et la conservation
des autres données dans une transaction annulée.

La fonction `can_delete_group`, définie dans le fichier des transactions et
utilisée par la policy RLS, autorise la suppression d’un groupe par son créateur
ou par un pasteur qui est aussi administrateur du groupe, avec une session active.
Un administrateur de l’application ou du groupe ne dispose pas de ce droit à lui
seul. Les tests `tests/group-deletion-permissions.sql` et
`tests/group-deletion.test.cjs` vérifient ces permissions et le refus d’un succès
apparent sans ligne supprimée.

### Rôles dans les groupes

Dans le rouage d’un groupe, le créateur et les administrateurs du groupe peuvent
attribuer le rôle membre ou administrateur et retirer les autres membres, avec
confirmation. Le pasteur est automatiquement administrateur de chaque nouveau groupe.
Le pasteur et le créateur ne peuvent pas être retirés ni rétrogradés par les autres
membres, mais peuvent quitter volontairement le groupe après confirmation.
Après un départ ou un retrait, le trigger `delete_empty_group` supprime le groupe
et ses messages s’il n’a plus de membres, ou s’il ne reste que le pasteur sans
qu’il en soit le créateur. Le pasteur peut rester seul dans un groupe qu’il a créé ;
son départ supprime alors le groupe. Un groupe reste conservé si au moins un membre
autre que le pasteur y participe.
Les modifications d’adhésion sont sérialisées par groupe pour gérer les départs
simultanés. « Quitter le groupe » est disponible
pour tous les membres ; « Supprimer le groupe » reste une action distincte.
Une mise à jour du profil sans changement de rôle ne réinscrit pas le pasteur.
Ces protections sont
appliquées dans les services de l’application et par des triggers SQL, y compris
pour les groupes existants. Supprimer un groupe continue à supprimer ses adhésions.
Sur une base existante, remplacer les fonctions `protect_group_membership()` et
`sync_pastor_group_memberships()` par leurs définitions du fichier des transactions
pour autoriser le départ volontaire du pasteur et du créateur.
Appliquer également la fonction `delete_empty_group()` et son trigger du même fichier
pour activer cette règle de suppression automatique.

### Suppression des comptes

Le pasteur peut supprimer les comptes membres et administrateurs depuis le
rouage de la liste des membres, avec une confirmation. Les administrateurs
peuvent uniquement supprimer les comptes membres. Les membres et administrateurs
peuvent également supprimer leur propre compte dans « Mon espace ».
Le compte pasteur est protégé contre toute suppression, y compris par lui-même :
l’application ne peut pas rester sans pasteur. Un message invite à contacter le
développeur pour ce changement critique. Ces permissions sont contrôlées dans
l’Edge Function, avec vérification de la session active.

L’Edge Function `delete-account` vérifie la session et le rôle en base, supprime
les connexions du compte ciblé (blocage des nouvelles connexions et révocation
de toutes ses sessions), supprime les photos du dossier `profiles/<userId>`,
puis supprime le compte Auth. Les
cascades retirent le profil et ses données personnelles liées ; les messages,
groupes, annonces et prédications sont conservés pour la communauté.

Le fichier `20260915100000_transactions.sql` ajoute
une fonction réservée à `service_role` pour détacher la propriété des médias
partagés avant la suppression Auth.

Les fonctions de révocation sont dans le fichier des transactions. Les règles
du fichier `20260916100000_policies_by_table.sql` exigent une session encore active sur les tables de l’application
et les opérations Storage authentifiées : un ancien JWT ne suffit plus après
révocation. Le realtime déconnecte l’appareil lors de la suppression du profil.
Une vérification au démarrage, au retour dans l’application, à la reconnexion
réseau sur le web et toutes les 30 secondes couvre un événement realtime manqué.
Les écrans privés sont également protégés contre un accès sans session locale.

Si le nettoyage échoue après la révocation, le compte reste bloqué ; le pasteur
peut relancer sa suppression. Les médias publiés dans les buckets publics restent
publics, conformément à la configuration existante.

Déployer ensuite l’Edge Function :

```bash
npx supabase functions deploy delete-account --use-api
```

Si le bucket d’images est personnalisé, définir le secret serveur
`SUPABASE_IMAGE_BUCKET` avec le même nom que
`EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET` (par défaut `church-images`). La clé
`SUPABASE_SERVICE_ROLE_KEY` reste exclusivement côté serveur.

Tests des permissions de suppression et des sessions révoquées :

```bash
node --test tests/delete-account-permissions.test.cjs
```

Le test SQL `tests/account-session-rls.sql` vérifie une session active puis
révoquée avec les mêmes claims JWT. Ses données fictives sont annulées par
`ROLLBACK`.

La RPC `change_user_role` vérifie également la session active avant toute
modification, car son exécution `SECURITY DEFINER` contourne les règles RLS.
Le test `tests/change-user-role-session.sql` vérifie qu’un admin et un pasteur
peuvent changer les rôles avec une session active, puis sont refusés avec les
mêmes claims JWT après révocation, sans modifier les rôles cibles. Toutes ses
données fictives sont annulées par `ROLLBACK`.

### 7. Créer les buckets Storage

Dans Supabase Storage, vérifier que les buckets suivants existent :

```text
church-images
predications-audio
```

Si les buckets n'existent pas encore, les créer en public depuis l'interface
Supabase Storage. Les fichiers SQL configurent les permissions Storage ; les
buckets doivent être créés séparément.

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
Elles contiennent un titre et un texte, sans image.

Selon les permissions configurées, seuls certains rôles peuvent créer, modifier ou supprimer des annonces.

### Prédications

La section des prédications permet de consulter les messages disponibles.

Les utilisateurs peuvent écouter une prédication, consulter ses informations et gérer leurs favoris.

La création, la modification et la suppression des prédications sont réservées aux utilisateurs autorisés.

### Groupes

La section des groupes permet aux utilisateurs d'accéder aux groupes auxquels ils appartiennent.

Les membres peuvent consulter les informations du groupe et participer aux échanges selon les règles d'accès définies.

Le créateur ou les administrateurs d'un groupe peuvent gérer certains paramètres et membres du groupe.

En cas d'erreur réseau pendant l'envoi d'un message, le texte reste dans le champ
et une erreur en français invite à réessayer. Une nouvelle tentative du même
texte conserve son identifiant tant que l'écran reste ouvert : si le serveur
avait déjà enregistré le message, le dépôt le retrouve sans créer de doublon
ni déclencher une seconde notification.

### Notifications

L'application dispose d'un système de notifications internes.

Les notifications peuvent être générées lors de certains événements, comme :

- la publication d'une annonce ;
- l'envoi d'un message dans un groupe ;
- l'ajout ou l'invitation d'un utilisateur dans un groupe.

Le trigger `notify_group_message` crée une notification interne pour chaque autre
membre accepté du groupe lors d'un nouveau message. L'auteur ne reçoit pas sa
propre notification. La création est atomique avec le message et le cache
TanStack existant reçoit les changements via Realtime, sans requêtes périodiques.
Pour une base déjà déployée, appliquer le bloc `notify_group_message` à la fin de
`20260915100000_transactions.sql` et ajouter `public.notification` à la publication
`supabase_realtime` si la table n'y figure pas déjà. Modifier un ancien fichier de
migration ne met pas automatiquement à jour la base distante.

### Mon espace

L'écran personnel de l'utilisateur permet de consulter son profil, ses statistiques, ses groupes, ses favoris et les accès rapides vers les principales fonctionnalités.

### Validation des inscriptions

Le profil contient un seul champ `statut_acces` : `en_attente`, `accepte` ou `refuse`.
Les profils existants restent acceptés lors de l’ajout du champ ; les nouveaux profils sont en attente.
L’inscription demande un nom affiché pour identifier la demande. Le profil en attente est créé dès la connexion, sans accès aux écrans de l’application.

Les comptes en attente ou refusés voient uniquement une alerte, avec actualisation et déconnexion.
L’onglet « Demandes », réservé au pasteur et aux administrateurs, affiche le nombre de demandes et permet de les accepter ou refuser.
La décision est suivie par TanStack Query et Realtime. Après acceptation, l’utilisateur complète son profil.

La RPC `decide_account_access(uuid, boolean)` permet d’accepter ou de refuser les demandes en attente, ainsi que d’accepter les inscriptions précédemment refusées.
Un contrôle interne `has_approved_app_access()` permet aux RLS de vérifier le statut sans récursion sur les profils.
Les comptes non acceptés peuvent lire leur propre statut, mais ne peuvent consulter les données privées ni modifier leur statut ou rôle.
Aucun retrait d’accès ni révocation supplémentaire n’est ajouté à ce parcours.

Sur une base existante, appliquer dans cet ordre l’ajout de `statut_acces` du fichier de création, puis les transactions et les RLS, avant de déployer l’application.
Le premier compte pasteur doit recevoir son rôle et le statut `accepte` par le développeur dans Supabase ; l’application ne permet pas de s’attribuer ces droits.
La confirmation d’adresse email doit être désactivée dans Supabase Auth :
dans Authentication → Sign In / Providers → Email, désactiver « Confirm email ».
L’application ouvre directement une session après l’inscription et n’utilise
aucun écran ni lien de confirmation email. Le fichier `supabase/config.toml`
applique également ce choix pour Supabase local ; il ne modifie pas le projet hébergé.

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
- `domain` pour les entities, règles et interfaces ;
- `infrastructure` pour les implémentations Supabase et Storage ;
- `presentation` pour les écrans, composants et hooks ;
- `shared` pour les éléments communs.

Le dossier `supabase` contient les migrations liées à la base de données et à la sécurité.

## Rapport d'utilisation de l'IA

Le rapport d'utilisation de l'intelligence artificielle est disponible dans le fichier :

```text
IA_REPORT.md
```
