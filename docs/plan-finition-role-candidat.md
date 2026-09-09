# Plan de finition — Rôle candidat

*Suite de `plan-role-user-candidat.md` (24/08) et `plan-technique-role-user.md`. Rédigé le **2026-08-26**, à partir du code, pas des documents.*

---

## 0. Objet et méthode

Les deux plans précédents décrivaient un espace candidat où presque tout le cœur produit manquait. **Ce n'est plus l'état du dépôt** : le lot 1 (P0) et l'essentiel du lot 2 (P1) ont été livrés entre le 24 et le 26/08. Ce document ne les réécrit pas — il liste **ce qui reste**, en partant d'une relecture du code.

État vérifié le 26/08 avant rédaction :

```
backend   php artisan test        →  218 tests, 1002 assertions, vert
frontend  npx tsc --noEmit        →  aucune erreur
```

> **Règle de ce document** (reprise de `plan-role-user-candidat.md` §7, où l'erreur s'est produite trois fois) : ne rien inscrire ici sans l'avoir constaté dans un fichier. Chaque constat cite sa source. Inversement, **rien de ce qui figure au §1 ne doit être replanifié**.

Les conventions de dépôt à respecter (dépôt à deux implémentations côté front, services côté back, un fichier de contenu i18n par écran, initialisation paresseuse des maquettes) restent celles de `plan-technique-role-user.md` §1 — elles ne sont pas répétées ici.

---

## 1. Ce qui est livré depuis le 24/08 — ne pas replanifier

| Item des plans précédents | Statut au 26/08 | Preuve |
|---|---|---|
| P0.1 Parrainage réel | **Fait** | `CandidateReferralController`, route `GET /referrals/me` (`routes/api.php:73`), écran branché (`parrainage/page.tsx:17`) |
| P0.2 Stage quotidien câblé | **Fait** | `/taches` consomme `GET /candidate/tasks` (`taches/page.tsx:21`) |
| P0.3 Persistance quiz | **Fait** | `orientation_result` / `orientation_score` écrits via `PUT /candidate/profile` (`quiz-metier/page.tsx:52`) |
| P0.3 Persistance salaire | **Non fait** | toujours `localStorage` (`salaire/page.tsx:80`) → §2.E2 |
| P0.6 Consentement révocable | **Fait** | `CandidateVisibilityController` (pause / resume / withdraw / grant), écran réel (`visibilite/page.tsx:30`) |
| P1.1 Module offres (back + liste) | **Fait** | migration `2026_08_24_120000_create_candidate_marketplace_tables.php`, `JobOfferController`, `/offres` sur API réelle |
| P1.1 Fiche offre `/offres/[id]` | **Non fait** | le dossier ne contient que `page.tsx` et `loading.tsx` → §2.B1 |
| P1.2 Candidatures | **Fait** | `CandidateApplicationController`, règles métier appliquées (dossier soumis + niveau CECR requis) |
| P1.3 Favoris | **Fait** | `CandidateFavoriteController`, écran `/favoris` |
| P1.4 Notifications | **Socle fait, couverture incomplète** | `AppNotification` + écran `/notifications` ; 3 émetteurs seulement → §2.C1 |
| P2.1 Écran « Mon compte » | **Fait** | `/compte` : sessions, changement de numéro, export, suppression |
| P2.4 Export + suppression CNDP | **Partiel** | routes livrées, mais **aucune purge n'est exécutée** → §2.D1 |
| P3.5 Intercepteur 401 | **Fait** | `lib/api.ts:77`, `lib/opsApi.ts:56` |
| P3.6 Limitation de débit | **Déjà fait au 24/08** | `ApiRateLimitingTest.php` |
| P0.5 Médias privés | **Déjà fait au 24/08** | `FileAccess.php`, `PrivateMediaTest.php` |

**Conséquence sur le diagnostic** : le produit n'a plus de trou fonctionnel majeur côté candidat. Ce qui reste est de la **finition** — accessibilité des écrans livrés, cohérence du tableau de bord, traductions, et deux chaînes non terminées (notifications, purge CNDP).

---

## 2. Ce qui reste à construire

Priorités : **A** = le travail déjà payé n'est pas visible par l'utilisateur · **B** = parcours incomplet · **C/D** = chaîne non terminée · **E/F** = fiction résiduelle et dette.

---

### Lot A — Rendre atteignable ce qui est déjà construit

> C'est le lot au meilleur rapport valeur / coût du dépôt : quatre écrans fonctionnels et testés sont invisibles pour un utilisateur réel. Aucun travail backend.

#### A1 — Navigation vers `/taches`, `/candidatures`, `/favoris`, `/notifications`

**Constat**
- La tab bar candidat a toujours ses 5 entrées d'origine (`(candidate)/layout.tsx:25-31`) : Accueil · Offres · Documents · Profil · Support.
- `/taches`, `/candidatures` et `/favoris` **ne sont liés depuis aucun écran candidat**. Les seules références hors `middleware.ts` sont le panneau de développement `auth-phone/DevAuthTools.tsx:56-62`, qui ne s'affiche pas en production.
- `/notifications` n'est lié que depuis la sidebar `hidden lg:flex` (`layout.tsx:51`) : **invisible sur mobile**, alors que la cible principale est un PWA mobile.
- La cloche du tableau de bord (`dashboard/page.tsx:122`) est un `IconButton` **inerte** — ni `onClick` ni `Link` — surmonté d'une pastille rouge affichée **en permanence**, sans rapport avec le nombre de non-lues.
- `/parrainage`, `/visibilite`, `/salaire`, `/quiz-metier`, `/lecon-jour` sont bien atteignables (grilles `QUICK_ACTIONS` `dashboard/page.tsx:20-32` et `TOOLS_META` `profil/page.tsx:29-37`).

**À faire**
1. Rendre la cloche du tableau de bord cliquable (`Link href="/notifications"`), et **piloter la pastille par le compteur réel** de non-lues — la requête existe déjà dans le layout (`layout.tsx:22-23`), la remonter dans un hook partagé `useUnreadNotifications` plutôt que de la dupliquer.
2. Ajouter `/candidatures`, `/favoris` et `/taches` aux deux grilles existantes (`QUICK_ACTIONS`, `TOOLS_META`) avec les clés i18n correspondantes dans les 4 fichiers `candidate-dashboard.*.json` et `candidate-profil.*.json`.
3. Depuis `/offres`, ajouter deux liens de tête : « Mes favoris » et « Mes candidatures » — c'est le contexte où on les cherche.
4. **Décision de navigation** (§4.1) : si le stage quotidien et les candidatures deviennent des destinations quotidiennes, elles méritent une entrée de tab bar, pas une case de grille. La tab bar est pleine à 5 : arbitrer avant de coder.

**Acceptation** — un compte candidat neuf, sans outils de développement, atteint les quatre écrans en partant de `/dashboard` ; la pastille de la cloche disparaît quand tout est lu.

**Coût** — faible, front seul.

#### A2 — Tableau de bord : remplacer la fiction par les données réelles

**Constat** — le tableau de bord est aujourd'hui **le seul écran candidat qui invente encore ses données**, et il contredit les écrans réels auxquels il renvoie :
- `APPLICATIONS` en dur (`dashboard/page.tsx:34-38`) : Klinik Berlin, Elektro GmbH, Logistik Nord — alors que `GET /candidate/applications` existe et que `/candidatures` l'affiche correctement.
- `RECOMMENDATIONS` en dur (`dashboard/page.tsx:81-85`) : Hôtel München, Pflegeheim Hamburg.
- Le fichier importe encore le catalogue `localStorage` `@/data/jobOffers` (`dashboard/page.tsx:12`) pour persister un « postuler » **qui n'atteint jamais le backend**. Un candidat peut donc « postuler » depuis l'accueil sans qu'aucune candidature n'existe.
- L'en-tête de `data/jobOffers.ts:4` affirme encore « Il n'existe pas d'API Laravel équivalente aujourd'hui » : c'est faux depuis le 24/08.

**À faire**
1. Alimenter le bloc « Suivi des candidatures » par `marketplaceApi.applications(token)`, en réutilisant le rendu de statut de `/candidatures` (extraire la carte dans `components/shared/` plutôt que de la dupliquer).
2. Alimenter « Recommandations » par `GET /offers`, filtré par les `matching_preferences` du profil. **Le score de correspondance affiché (92 %, 87 %) n'est calculé nulle part** : soit on le calcule côté serveur (§4.2), soit on retire le pourcentage — pas de troisième option honnête.
3. Retirer l'import de `@/data/jobOffers` du tableau de bord, puis **supprimer le module** (`data/jobOffers.ts`, ses fixtures et ses clés `STORAGE_KEYS`) une fois qu'il n'a plus d'importateur.
4. Adapter les fichiers `candidate-dashboard.*.json` : les textes des candidatures et recommandations sont aujourd'hui indexés par identifiant fixe (`content.applications.items`, `content.recommendations.items`) — un contenu serveur impose de passer à des libellés génériques (`statusLabel` par statut) au lieu d'un texte par offre.

**Acceptation** — deux comptes candidats voient deux tableaux de bord différents ; une candidature envoyée depuis `/offres` apparaît sur l'accueil ; `grep -r "Klinik Berlin\|Hôtel München" frontend/src` ne renvoie plus rien ; `npm run verify:no-mocks` passe.

**Coût** — moyen, front seul. **À faire avant toute démo client.**

#### A3 — i18n des quatre écrans livrés en français seulement

**Constat** — `candidatures`, `favoris`, `notifications` et `compte` ont leurs chaînes **écrites en dur en français** dans le composant. Aucun `src/content/candidate-{candidatures,favoris,notifications,compte}.*.json` n'existe, alors que les 15 autres écrans candidat ont leurs 4 langues. Un utilisateur arabophone (RTL) tombe sur du français.
*(`/taches` est correct : il réutilise volontairement le bundle `candidate-lecon-jour.*.json`, décision documentée en tête du fichier.)*

**À faire** — pour chacun des quatre écrans, créer le bundle `fr/ar/en/de` et l'accesseur `candidate<Ecran>ContentFor` sur le modèle de `lib/candidateVisibiliteContent.ts` (le typage sur `typeof fr` fait échouer le build si une traduction oublie une clé — c'est la protection à conserver). Vérifier le rendu RTL des trois écrans à listes.

**Acceptation** — bascule en arabe : aucune chaîne française ne subsiste sur les quatre écrans ; `tsc --noEmit` échoue si une clé manque dans une langue.

**Coût** — faible mais mécanique (16 fichiers).

#### A4 — Normaliser le style des fichiers livrés minifiés

**Constat** — les livraisons du 24-26/08 sont écrites sur une seule ligne : `compte/page.tsx` fait **3 lignes**, `favoris/page.tsx` **2 lignes**, `CandidateAccountController.php` **4 lignes**, `lib/candidateMarketplace.ts` **8 lignes**. Le reste du dépôt est formaté normalement et commenté en français. Le code fonctionne — il n'est simplement ni relisable ni modifiable sans le reformater d'abord, et il annule la valeur des revues.

**À faire** — reformater (Prettier côté front, PSR-12 côté back) `(candidate)/{candidatures,favoris,notifications,compte}/page.tsx`, `lib/{candidateMarketplace,candidateAccount}.ts`, `layout.tsx:51`, et `app/Http/Controllers/Api/{CandidateAccount,CandidateNotification,CandidateFavorite,CandidateApplication,CandidateReferral,CandidateVisibility}Controller.php`. Ajouter l'en-tête de commentaire attendu par la convention du dépôt.

**Quand** — **avant** les lots B et C, qui modifient précisément ces fichiers. Le faire après reviendrait à le faire deux fois.

**Coût** — faible. Aucun changement de comportement : `php artisan test` et `tsc --noEmit` sont le filet.

---

### Lot B — Terminer le module offres

#### B1 — Fiche offre `/offres/[id]`

**Constat** — `GET /offers/{offer}` existe (`routes/api.php:76`) et renvoie l'offre avec `employer.companyProfile`. Côté front, seule la liste existe : le candidat postule depuis une carte **sans avoir jamais lu la description**, qui n'est affichée nulle part.

**À faire** — `(candidate)/offres/[id]/page.tsx` : description complète, entreprise, ville, type de contrat, fourchette salariale, niveau CECR requis, boutons Postuler / Favori, lien de retour. Ajouter `offer:(id, token)` à `marketplaceApi`, le matcher `/offres/:path*` (`middleware.ts:165`) couvre déjà la route imbriquée.

**Acceptation** — la carte de la liste mène à la fiche ; postuler depuis la fiche crée bien la candidature ; une offre `draft` ou `closed` renvoie un 404 propre, pas un écran cassé.

#### B2 — Filtres et recherche

**Constat** — le backend filtre sur `sector`, `city`, `contract_type`, `required_cefr_level` et une recherche plein texte `q` (`JobOfferController::index`). Le client n'envoie **que** `sector` (`lib/candidateMarketplace.ts`, signature `offers(token, sector?)`).

**À faire** — étendre `marketplaceApi.offers` à un objet de filtres typé, et exposer dans l'UI ville, type de contrat, niveau CECR et champ de recherche. Pré-remplir depuis les `matching_preferences` du profil au premier chargement.

#### B3 — Pagination

**Constat** — toutes les listes candidat (`offers`, `applications`, `favorites`, `notifications`) sont paginées côté serveur ; le front n'affiche jamais que la première page. Au-delà de 20 éléments, le reste est inaccessible et rien ne le signale.

**À faire** — pagination ou défilement infini sur `/offres`, `/candidatures`, `/favoris`, `/notifications` (react-query `useInfiniteQuery`), en réutilisant le composant `Pagination` déjà écrit côté `/amud`.

#### B4 — Messages d'erreur métier

**Constat** — `apply()` renvoie `422 "Submit your candidate profile before applying."` ou `422 "Required CEFR level not met."`, et `409` en cas de doublon (`CandidateApplicationController::apply`). Ces messages **anglais et bruts** remontent tels quels dans l'UI (`offres/page.tsx:321-323`).

**À faire** — mapper les codes d'erreur sur des messages traduits, et **désactiver le bouton en amont** avec l'explication : un candidat dont le dossier n'est pas soumis doit le voir avant de cliquer, pas après. Le niveau CECR requis est déjà dans la charge utile de l'offre : la comparaison est faisable côté client.

---

### Lot C — Terminer la chaîne de notifications

#### C1 — Émetteurs manquants

**Constat** — trois émetteurs seulement dans tout le backend (`grep AppNotification::create`) : offre modérée, candidature reçue, statut de candidature changé. Les événements listés par `plan-role-user-candidat.md` §P1.4 et qui concernent le candidat ne produisent **aucune** notification.

| Événement | Point d'accroche |
|---|---|
| Document validé / rejeté | `AdminCandidateController::reviewDocument` (`:223`) — le motif de rejet est déjà obligatoire, il fait le corps du message |
| Réponse de l'administration à une réclamation | `ComplaintController::update` (`:83`, branche `filled($data['response'])`) |
| Tâche de stage assignée | `AdminTaskController::assign` (`:94`) — une notification par journée assignée, pas par tâche |
| Nouvelle offre correspondant aux préférences | `JobOfferController::store` / `update` au passage à `published` — dépend de §4.2 |

#### C2 — Extraire un service `Notifications`

**Constat** — `AppNotification::create([...])` est appelé en ligne dans les contrôleurs. Avec quatre émetteurs de plus, le titre, le corps et le lien de chaque type seront dispersés dans huit fichiers.

**À faire** — `app/Services/Notifications.php`, une méthode par type (`documentReviewed`, `complaintAnswered`, `tasksAssigned`, `applicationStatusChanged`…), conformément à la convention « logique métier en service » (`plan-technique-role-user.md` §1.1). C'est aussi le seul endroit d'où C3 peut être traité proprement.

#### C3 — Les notifications ne sont pas traduisibles

**Constat** — le titre et le corps sont **stockés en anglais dans la table** (`'title' => 'New application'`, `'body' => $d['status']`). L'application est en 4 langues ; une notification restera dans la langue de l'émetteur, et une notification déjà écrite ne peut plus être traduite.

**À faire** — stocker `type` + une charge utile JSON (`payload`) et faire le rendu côté client depuis les bundles i18n, en gardant `title`/`body` comme repli pour les lignes existantes. Migration additive : ajouter `payload` nullable, ne pas casser les données en place.

**Décision liée** — §4.3.

#### C4 — Supprimer les scrutations devenues inutiles

**Constat** — `/reclamation` recharge la liste **toutes les 3 secondes** (`reclamation/page.tsx:69`, `setInterval(refresh, 3000)`), et la couche notifications scrute toutes les 60 s à deux endroits (`layout.tsx:22` et `notifications/page.tsx`). Le document du 24/08 mentionnait une scrutation de 2 minutes : la réalité est 40 fois plus agressive.

**À faire** — une fois C1 livré, ramener `/reclamation` à un rechargement au focus de fenêtre, et factoriser la requête de non-lues dans un hook unique partagé par le layout et l'écran (voir A1).

---

### Lot D — Terminer la conformité CNDP

#### D1 — La suppression de compte ne supprime rien

**Constat** — `DELETE /candidate/account` positionne `deletion_requested_at = now()+30j`, bloque le compte et révoque les jetons. **Aucun code ne relit jamais ce champ** : pas de commande, pas d'entrée dans `routes/console.php` (qui ne planifie que `documents:scan-pending`). Les données personnelles et les médias restent indéfiniment. L'écran promet pourtant « supprimé après le délai de grâce » (`compte/page.tsx`).

**À faire** — commande `candidates:purge-deleted` planifiée quotidiennement : purge des médias privés via le disque `local` (CV, diplômes, pièces d'identité, vidéo, audio de réclamation), anonymisation ou suppression des enregistrements liés, journalisation de l'opération. Trancher au passage le sort des candidatures déjà envoyées à un recruteur (§4.4).

**Acceptation** — un test de fonctionnalité qui avance l'horloge de 31 jours, exécute la commande, et vérifie que le compte, ses documents et ses fichiers ont disparu du disque.

#### D2 — Annulation impossible pendant le délai de grâce

**Constat** — `CandidateAccountController::cancel()` est écrit mais **n'a aucune route** (`routes/api.php` n'expose que `export` et `destroy`). Et il serait inatteignable de toute façon : `destroy()` bloque le compte, donc le middleware `account.active` refuse toute requête suivante. Un délai de grâce qu'on ne peut pas utiliser n'est pas un délai de grâce.

**À faire** — soit exposer l'annulation par un chemin qui survit au blocage (reconnexion OTP puis annulation, via une exception explicite dans `EnsureAccountIsActive`), soit retirer `cancel()` et **cesser de promettre un délai de grâce dans l'UI**. Trancher en §4.4.

#### D3 — L'export n'est pas lisible par un humain

**Constat** — `export()` renvoie un `User` Eloquent sérialisé brut, avec ses relations (`compte/page.tsx` le télécharge en `.json`). Une obligation d'accès aux données personnelles suppose un format compréhensible, pas un vidage de base.

**À faire** — structurer la charge utile (identité, dossier, documents, évaluations, candidatures, réclamations, consentements horodatés), exclure les colonnes techniques, et joindre les métadonnées des fichiers. **À réunir avec P2.3** (export PDF du dossier depuis `/profil`, en réutilisant `GET /candidate/profile/preview`) : c'est le même travail de rendu, sur deux sorties.

---

### Lot E — Fiction résiduelle

#### E1 — `/lecon-jour`

**Constat** — la leçon est intégralement en dur : `WEEK_SLOTS` (`lecon-jour/page.tsx:13`), `GERMAN_PHRASE`, `QUIZ_OPTIONS` (`:26-36`), série d'assiduité en `localStorage`, valeur initiale `count: 7` **inventée pour un compte neuf**. Aucun backend de leçons n'existe. L'écran est mis en avant partout : grille du tableau de bord, outils du profil, `/amud`, `/salaire`.

**Options** (§4.5) — (a) table `lessons` + `GET /candidate/lessons/today` et progression serveur ; (b) fusionner dans le stage quotidien (`tasks` a déjà une catégorie `language`) ; (c) l'étiqueter « contenu de démonstration » en attendant. **Ne pas laisser en l'état** : c'est le dernier écran qui simule une progression personnelle.

#### E2 — `/salaire`

**Constat** — simulateur purement local (`salaire/page.tsx:80`), non rattaché au profil. Seul reliquat de P0.3.

**À faire** — soit persister la dernière simulation sur le profil (comme le quiz avec `orientation_result`), soit assumer l'outil comme un calculateur sans mémoire et retirer l'écriture `localStorage`. Le seul choix intenable est celui d'aujourd'hui : une persistance qui disparaît au changement d'appareil sans que rien ne l'annonce.

#### E3 — `data/jobOffers.ts`

Traité en A2 : à supprimer une fois le tableau de bord câblé. Son commentaire d'en-tête est déjà mensonger.

---

### Lot F — Dette

| # | Sujet | Constat | Action |
|---|---|---|---|
| F1 | Code mort | `context/SettingsContext.tsx` n'est monté nulle part ; `components/shared/AvatarUpload.tsx` n'est importé nulle part | Monter le premier dans `/compte` (taille du texte) ou le supprimer ; brancher le second sur `/profile-creation` (le dossier n'a toujours aucune photo) ou le supprimer |
| F2 | `candidate_skills` orphelin | Table, modèle et factory existent ; aucune route, aucun écran | Les brancher sur le dossier (elles serviraient aux filtres de B2) ou retirer la table |
| F3 | Accessibilité | Aucun audit sur l'espace candidat ; les écrans livrés minifiés ont peu d'attributs ARIA | Contrastes AA, cibles 44 px, focus visible, navigation clavier — en s'appuyant sur ce qui a été fait pour `/amud` |
| F4 | Télémétrie | Ni analytics ni rapport de crash | Décision à part : sans cela, aucun échec de production côté candidat n'est observable |
| F5 | Tests frontend | Il n'en existe **aucun** | Décision à part (`plan-technique-role-user.md` §7) : ne pas ouvrir ce chantier au milieu d'une fonctionnalité |
| F6 | Parité `mobile-expo` | L'app Expo couvre OTP, dossier, documents, tâches, évaluation, compte, parrainage — **rien du marketplace** (offres, candidatures, favoris, notifications) | Décision de périmètre (§4.6) |

---

## 3. Séquencement

```
Étape 1 — Visible immédiatement (front seul)
  A4 reformatage  →  A1 navigation  →  A2 tableau de bord réel  →  A3 i18n
  Sortie : plus aucune donnée inventée côté candidat, tout l'existant est atteignable.

Étape 2 — Parcours offres complet
  B1 fiche offre  →  B2 filtres  →  B3 pagination  →  B4 erreurs métier

Étape 3 — Chaînes non terminées (backend)
  C2 service  →  C1 émetteurs  →  C3 i18n notifications  →  C4 fin des scrutations
  D1 purge  →  D2 annulation  →  D3 export lisible + PDF

Étape 4 — Fiction résiduelle et dette
  E1 leçon (selon §4.5)  ·  E2 salaire  ·  F1 code mort  ·  F2 compétences  ·  F3 accessibilité

Hors séquence — projets à part entière
  Messagerie candidat ↔ recruteur (P2.2)  ·  Abonnement B2C (P2.5)  ·  Télémétrie (F4)  ·  Tests front (F5)
```

L'étape 1 ne dépend de rien et change tout ce qu'un client voit. L'étape 3 est la seule qui demande des migrations et des tests backend.

---

## 4. Décisions à trancher avant de coder

1. **Structure de navigation (A1)** — la tab bar mobile est pleine à 5 entrées. Les candidatures et le stage quotidien restent-ils dans les grilles d'actions rapides, ou l'une d'elles remplace-t-elle une entrée existante (« Support » est la moins consultée) ?
2. **Score de correspondance (A2, C1)** — le pourcentage de correspondance affiché sur les recommandations doit-il être calculé côté serveur à partir de `matching_preferences` (colonne JSON, aujourd'hui sans aucun lecteur), ou retiré ? Cette réponse conditionne aussi la notification « nouvelle offre correspondante ».
3. **Modèle des notifications (C3)** — passer à `type` + `payload` traduit côté client, ou assumer des notifications monolingues ? Le second choix est cohérent seulement si l'application cesse d'être multilingue.
4. **Suppression de compte (D1, D2)** — délai de grâce réellement annulable, ou suppression immédiate assumée ? Et que deviennent les candidatures déjà envoyées à un recruteur : purgées, ou conservées anonymisées comme trace contractuelle ?
5. **`/lecon-jour` (E1)** — vrai backend de leçons, fusion dans le stage quotidien, ou étiquetage « démonstration » ?
6. **`mobile-expo` (F6)** — l'app Expo doit-elle rattraper le marketplace, ou reste-t-elle l'app de constitution du dossier pendant que le PWA porte le reste ?
7. **Reliquats du 24/08 encore ouverts** — messagerie intégrée (P2.2) et règle de dégradation de l'abonnement expiré (P2.5). Inchangés, rappelés pour mémoire.

---

## 5. Vérification avant livraison

```bash
cd backend  && php artisan test
cd frontend && npx tsc --noEmit && npx eslint src --ext .ts,.tsx && npm run verify:no-mocks
```

Références au 26/08 : 218 tests verts, `tsc` propre. Toute régression sur ces chiffres est un échec de livraison.

Par lot :
- **A2** — `grep -rn "Klinik Berlin\|Hôtel München\|JOB_OFFERS" frontend/src` doit être vide.
- **A3** — supprimer une clé d'un `.ar.json` doit faire échouer `tsc`.
- **C1** — un test de fonctionnalité par émetteur : l'action admin crée bien la ligne pour le bon utilisateur.
- **D1** — test avec horloge avancée de 31 jours, vérifiant la disparition des fichiers sur le disque.

**Limite connue, inchangée** : aucun outil de navigateur n'est disponible dans cet environnement. Les écrans mobiles, le rendu RTL et les états d'erreur demandent une passe manuelle — c'est particulièrement vrai pour A1 et A3, dont l'essentiel du résultat est visuel.

---

## 6. Hors périmètre de ce plan

- Rôles `employer`, `admin`, `agent` — seul le versant candidat est traité ici.
- Le portail maquette `/amud/candidate` (décision §6.1 de `plan-role-user-candidat.md`, toujours ouverte).
- Messagerie (P2.2) et abonnement B2C (P2.5) : projets à part, cadrés dans les documents précédents.
- Toute estimation en jours/homme : le découpage est par dépendance.
