# Rapport d'utilisation de l'intelligence artificielle

## 1. Outil utilisé

**Outil : OpenAI Codex**

OpenAI Codex a été utilisé comme outil d'assistance au développement de l'application **Church Connect**.

Son utilisation a principalement porté sur l'analyse du code, la résolution de problèmes techniques, la proposition de corrections et l'accompagnement dans la mise en place de certains mécanismes liés à Supabase.

L'intelligence artificielle n'a pas été utilisée pour remplacer la réflexion ou la validation du développeur. Les propositions fournies par l'outil ont été analysées, adaptées lorsque cela était nécessaire et testées avant leur intégration dans le projet.


## 2. Nature des interventions

### 2.1. Mise en place des politiques RLS de Supabase

Codex a été utilisé comme assistance pour la mise en place et la correction des politiques **Row Level Security (RLS)** de Supabase.

Ces politiques permettent de contrôler directement au niveau de la base de données les opérations pouvant être réalisées par les utilisateurs.

L'intervention a notamment concerné la sécurisation des profils, des groupes, des annonces, des notifications et des prédications. Codex a également été utilisé pour analyser certaines politiques lorsque des requêtes étaient refusées ou lorsque les règles d'accès ne correspondaient pas au comportement attendu.


### 2.2. Gestion des permissions selon les rôles

Codex a été utilisé pour aider à mettre en place et vérifier certaines règles d'autorisation liées aux différents rôles de Church Connect.

L'application distingue principalement trois rôles : **membre**, **administrateur** et **pasteur**.

Certaines opérations sensibles, notamment la création, la modification ou la suppression de prédications et d'annonces ainsi que la gestion des catégories, doivent être réservées aux utilisateurs disposant des permissions nécessaires.

L'intervention de Codex a permis d'aider à analyser et à adapter les mécanismes permettant de différencier les actions autorisées selon le rôle de l'utilisateur.


### 2.3. Sécurisation de la gestion des groupes

Codex a également été utilisé comme assistance lors de la mise en place des règles de sécurité relatives aux groupes.

L'objectif était notamment de permettre aux membres d'accéder uniquement aux groupes auxquels ils appartiennent et de réserver certaines opérations de gestion au créateur ou aux administrateurs du groupe.

L'outil a également été utilisé pour aider à définir les règles concernant la gestion des membres et les opérations de suppression afin qu'un utilisateur ne puisse effectuer que les actions correspondant à ses autorisations.


### 2.4. Gestion des notifications internes

Codex a été utilisé comme assistance pour la mise en place du système de notifications internes de Church Connect.

Ces notifications concernent notamment la publication d'une nouvelle annonce, l'envoi d'un message dans un groupe ainsi que certains événements liés à l'invitation ou à l'ajout d'un utilisateur dans un groupe.

L'outil a permis d'aider à structurer la logique nécessaire à la création et à la transmission des notifications aux utilisateurs concernés.


### 2.5. Gestion des accès à Supabase Storage

Codex a été utilisé pour aider à organiser et sécuriser l'accès aux fichiers enregistrés dans **Supabase Storage**.

Les règles d'accès diffèrent selon le type de contenu concerné. Chaque utilisateur authentifié doit notamment pouvoir gérer sa propre image de profil sans pouvoir modifier celle d'un autre utilisateur.

La gestion des fichiers associés aux prédications, tels que les images d'illustration et les fichiers audio, doit quant à elle être réservée aux utilisateurs disposant des permissions nécessaires, notamment les administrateurs et le pasteur.

Codex a été utilisé comme assistance dans la définition et la vérification de ces différentes règles d'accès.


## 3. Méthode d'utilisation

Lorsqu'un problème était rencontré pendant le développement, les informations nécessaires à sa compréhension étaient fournies à Codex.

Selon la situation, cela pouvait comprendre :

- le code concerné ;
- le contexte de la fonctionnalité ;
- le comportement attendu ;
- le comportement réellement observé ;
- les éventuels messages d'erreur ;
- les rôles et permissions concernés.

Un prompt était ensuite formulé afin d'expliquer le problème rencontré et de préciser le résultat attendu.

La réponse générée était analysée avant toute intégration dans le projet. Lorsque la proposition ne correspondait pas au résultat attendu, le prompt pouvait être complété ou reformulé afin d'apporter davantage de contexte.

Les modifications retenues étaient ensuite testées directement dans l'application afin de vérifier leur fonctionnement et de s'assurer qu'elles n'introduisaient pas de nouveaux dysfonctionnements.


## 4. Prompts et instructions soumis à l'IA

Les prompts suivants correspondent aux principales demandes adressées à Codex dans le cadre des interventions décrites précédemment.


### 4.1. Mise en place des politiques RLS

> « Je dois sécuriser la base de données Supabase de mon application Church Connect. Comment puis-je mettre en place des politiques RLS (Row Level Security) efficaces afin de protéger les principales tables de l'application, notamment les profils, les groupes, les annonces, les notifications et les prédications ? Les politiques doivent garantir que chaque utilisateur puisse uniquement effectuer les opérations correspondant à ses autorisations. »


### 4.2. Gestion des permissions selon les rôles

> « Dans Church Connect, trois rôles principaux sont définis : membre, administrateur et pasteur. Je souhaite limiter les permissions en fonction du rôle de l'utilisateur. Comment mettre en place les règles nécessaires afin que seuls les administrateurs et le pasteur puissent créer, modifier ou supprimer des prédications et des annonces, ainsi que gérer les catégories, tandis que les membres disposent uniquement des droits de consultation pour ces fonctionnalités ? »


### 4.3. Sécurisation de l'accès aux groupes

> « Je souhaite mettre en place des politiques RLS afin que seuls les membres appartenant à un groupe puissent accéder à son contenu. Les administrateurs du groupe et son créateur doivent pouvoir gérer les membres, tandis que les autres utilisateurs doivent uniquement disposer des actions correspondant à leurs autorisations. Peux-tu m'aider à définir ces règles et à les traduire en politiques SQL adaptées à Supabase ? »


### 4.4. Mise en place des notifications internes

> « Je souhaite mettre en place un système de notifications internes dans mon application React Native utilisant Supabase. Comment structurer ce système afin qu'une notification soit générée pour les utilisateurs concernés lorsqu'une nouvelle annonce est publiée, qu'un message est envoyé dans un groupe ou qu'un utilisateur est invité ou ajouté à un groupe ? »


### 4.5. Sécurisation de Supabase Storage

> « Comment configurer les politiques de sécurité RLS de Supabase Storage afin de différencier les droits d'accès aux fichiers ? Chaque utilisateur authentifié doit pouvoir ajouter, modifier ou supprimer uniquement sa propre photo de profil. En revanche, la gestion des fichiers associés aux prédications, notamment les images d'illustration et les fichiers audio, doit être réservée aux utilisateurs autorisés, tels que le pasteur et les administrateurs. Les autres membres doivent uniquement pouvoir consulter ces fichiers. »


## 5. Vérification des interventions de l'IA

Les réponses fournies par Codex n'ont pas été intégrées automatiquement dans le projet.

Chaque proposition nécessitant une modification du code ou de la configuration de Supabase a été examinée afin de vérifier sa cohérence avec l'architecture et les besoins de Church Connect.

Les modifications retenues ont ensuite été testées dans l'application. Une attention particulière a été portée aux mécanismes liés aux autorisations et aux politiques RLS, car une mauvaise configuration pouvait soit empêcher un utilisateur légitime d'accéder à certaines données, soit accorder des permissions qui ne lui étaient pas destinées.

Lorsqu'une solution proposée ne fonctionnait pas correctement, le problème était de nouveau analysé et les instructions fournies à Codex étaient adaptées avant de procéder à de nouveaux tests.


## 6. Responsabilité du développement

L'utilisation de Codex s'est inscrite dans une démarche d'assistance au développement et à la résolution de problèmes techniques.

L'outil a contribué à l'analyse de certaines problématiques et à la proposition de solutions, mais les réponses générées ont fait l'objet d'une vérification avant leur utilisation.

La conception générale de Church Connect, les choix fonctionnels et techniques, l'organisation du projet ainsi que la décision d'intégrer ou non les solutions proposées sont restés sous la responsabilité de l'auteur du projet.
