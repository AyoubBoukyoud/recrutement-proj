# Plan technique — implémentation du rôle User (candidat)

*Comment construire les fonctionnalités listées dans [`plan-role-user-candidat.md`](plan-role-user-candidat.md). Rédigé le 2026-08-24.*

> Le plan fonctionnel dit **quoi** et **pourquoi**. Ce document dit **comment** : fichiers à créer, schéma, routes, contrats de données, tests, ordre des opérations. Les deux se lisent ensemble — chaque section reprend l'identifiant du plan fonctionnel (P0.1, P1.2…).

---

## 0. Règle préalable : vérifier avant d'ouvrir un chantier

Trois fois pendant la rédaction du plan fonctionnel, du travail **déjà livré** a été planifié comme s'il restait à faire — à chaque fois en faisant confiance à `FEATURES_TO_IMPLEMENT.md` plutôt qu'au code (médias privés, limitation de débit, schéma d'abonnement).

**Avant de démarrer une section de ce plan, lancer la vérification qu'elle donne en tête.** Si elle renvoie autre chose que ce qui est écrit, c'est le document qui a tort.

---

## 1. Conventions du dépôt à respecter

Ces conventions sont déduites du code existant. Les suivre, plutôt qu'appliquer des habitudes Laravel/Next génériques.

### 1.1 Backend (`backend/`)

| Aspect | Convention observée |
|---|---|
| Contrôleurs | `app/Http/Controllers/Api/*Controller.php`, un par ressource, méthodes REST classiques |
| Logique métier | Extraite en service dans `app/Services/` dès qu'elle dépasse le contrôleur (`ProfileCompleteness`, `RecruiterCandidateSearch`, `FileAccess`, `ReferralCommissions`) |
| Autorisation | Pas de Policies : la vérification est faite dans le contrôleur ou dans un service dédié (`FileAccess` est le modèle à imiter — **une** porte d'autorisation, pas des `if` dispersés) |
| Sérialisation | Modèles sérialisés bruts, **pas d'API Resources**. Ne pas en introduire pour une seule fonctionnalité : soit on migre tout, soit on suit l'existant |
| Rôles | Spatie — `Administrator`, `Company`, `Commercial Agent`, `User` |
| Routes | `routes/api.php`, groupe `['auth:sanctum', 'throttle:api', 'account.active']`, sous-groupes `->middleware('role:...')` |
| Limitation de débit | Limiteurs nommés déclarés dans `AppServiceProvider` puis `->middleware('throttle:<nom>')` |
| Fichiers privés | **Toujours** passer par `FileAccess` — jamais d'URL de disque public |
| Migrations | Un fichier par changement, avec un **commentaire d'en-tête expliquant la décision** (voir `create_subscriptions_table`) |
| Tests | `tests/Feature/<Sujet>Test.php`, noms de méthodes en phrase : `test_a_candidate_can_open_their_own_document_via_its_signed_url` |

### 1.2 Frontend (`frontend/`)

Le point le plus important : **le patron dépôt à deux implémentations**. Toute nouvelle donnée candidat le suit.

```
src/lib/<domaine>.ts        →  fonctions HTTP typées : le contrat du back
src/data/<domaine>.ts       →  interface Repository
                               + http<Domaine>  (délègue à lib/)
                               + mock<Domaine>  (fixtures, état en mémoire)
                               + export const <domaine>Repository = USE_MOCKS ? mock : http
src/data/fixtures/<dom>.ts  →  les fausses données
src/lib/use<Domaine>.ts     →  hook react-query au-dessus du dépôt
```

**Piège à ne pas reproduire** — l'état de maquette s'initialise **paresseusement, au premier appel**, jamais au niveau du module :

```ts
let store: T[] | null = null;   // et non : let store = MOCK_DATA;
```

Une initialisation au niveau du module est un effet de bord que webpack ne peut pas éliminer : les fausses données partent alors dans le bundle de production même avec le drapeau éteint. C'est ce que `npm run verify:no-mocks` détecte — **le faire passer avant toute livraison**.

| Aspect | Convention |
|---|---|
| État serveur | react-query, une clé par domaine (`CANDIDATE_PROFILE_QUERY_KEY`), invalidation après écriture |
| Écritures hors-ligne | Passer par `src/lib/syncQueue.ts` (`enqueue`) pour tout ce qui doit survivre à une coupure |
| i18n | **Un fichier de contenu par écran** : `src/content/candidate-<ecran>.{fr,ar,en,de}.json` + un accesseur `candidate<Ecran>ContentFor` dans `src/lib/` |
| Composants | Réutiliser `src/components/shared/` avant d'en créer (`Button`, `ChecklistItem`, `Timeline`, `DocumentViewer`, `ProgressBar`, `Skeleton`, `EmptyState` côté `/amud`) |
| Routes protégées | Ajouter le chemin à `CANDIDATE_PATHS` dans `src/middleware.ts` — sinon la route est publique |
| Nouvel écran candidat | Vit dans `src/app/(candidate)/<nom>/page.tsx` pour hériter du layout (tab bar + garde-fou de complétude) |

---

## 2. Lot 1 (P0) — cohérence et droit

### P0.2 — Brancher `/lecon-jour` sur le vrai stage quotidien

> **Vérifier d'abord** : `grep -rl "candidate/tasks" frontend/src` doit être **vide**. S'il renvoie un fichier, c'est déjà fait.

Le backend est complet (`CandidateTaskController`, tables `task_tables.php`, service `TaskEngagement`). C'est **du câblage front uniquement**.

**À créer**
```
src/lib/candidateTasks.ts        listTasks(token), updateAssignment(id, patch, token)
src/data/candidateTasks.ts       CandidateTasksRepository + http/mock
src/data/fixtures/tasks.ts       fixtures de maquette
src/lib/useCandidateTasks.ts     hook react-query, clé ['candidate-tasks']
```

**À modifier** — `src/app/(candidate)/lecon-jour/page.tsx` : supprimer `WEEK_SLOTS` et `QUIZ_OPTIONS`, lire le hook. La progression hebdomadaire se dérive du statut des affectations, elle ne se code plus en dur.

**Hors-ligne** : valider une tâche doit passer par `syncQueue` — un candidat qui coche dans le métro ne doit pas perdre son geste.

**Tests** : `CandidateTaskController` est-il déjà couvert ? Si non, ajouter `tests/Feature/CandidateTaskTest.php` (le candidat ne voit que ses propres affectations ; il ne peut pas modifier celles d'autrui).

**Acceptation** : une tâche assignée depuis `/admin/stage` apparaît chez le candidat ; la valider se voit côté admin.

---

### P0.3 — Persister quiz, salaire et visibilité

Trois écrans, trois décisions différentes — ne pas les traiter en bloc.

| Écran | Décision | Mise en œuvre |
|---|---|---|
| `/quiz-metier` | Le résultat a une valeur métier (orientation) → **le persister** | Colonnes sur `candidate_profiles` via une migration `add_orientation_to_candidate_profiles_table`, écrites par `PUT /candidate/profile`. Aucun nouvel endpoint |
| `/salaire` | Simulateur informatif, sans valeur métier → **`localStorage` suffit** | Ne pas créer de schéma pour ça. Conserver la dernière simulation côté client |
| `/visibilite` | Le score doit être **calculé côté serveur**, sinon il ment | Étendre `App\Services\ProfileCompleteness` (qui calcule déjà la complétude) plutôt que créer un service concurrent. Exposer via le bloc `completeness` déjà renvoyé par `GET /candidate/profile` |

**Attention** : `/visibilite` est aussi l'écran de P0.6. Traiter les deux ensemble, sinon l'écran sera repris deux fois.

---

### P0.6 — Rendre le consentement révocable

> **Vérifier d'abord** : `grep -rn "cndp" backend/routes/api.php` — aucune route de retrait ne doit exister.

**Backend**

Migration `add_consent_withdrawal_to_candidate_profiles_table` :

| Colonne | Type | Rôle |
|---|---|---|
| `cndp_withdrawn_at` | `timestamp` nullable | Date de retrait ; `null` = consentement actif |
| `visibility_paused_at` | `timestamp` nullable | Retrait « doux » : je reste inscrit, je sors des recherches |

Routes, dans le groupe candidat :
```php
Route::post('/candidate/visibility/pause',  [CandidateVisibilityController::class, 'pause']);
Route::post('/candidate/visibility/resume', [CandidateVisibilityController::class, 'resume']);
Route::post('/candidate/consent/withdraw',  [CandidateVisibilityController::class, 'withdraw']);
```

**Le point qui compte** : `RecruiterProfileView::isVisible()` est le seul juge de la visibilité. Y ajouter la condition de retrait **là et nulle part ailleurs** — un second endroit qui décide de la visibilité, et les deux divergeront.

**Frontend** — `/visibilite` devient l'écran de contrôle : état actuel en clair (« Vous êtes visible par les recruteurs »), interrupteur de pause, retrait définitif derrière une confirmation qui **énonce les conséquences** plutôt qu'un « Êtes-vous sûr ? » creux.

**Tests** (`tests/Feature/CandidateVisibilityTest.php`) : un candidat en pause disparaît de la recherche recruteur ; il réapparaît après reprise ; un retrait est horodaté ; un dossier **déjà débloqué** par un recruteur reste-t-il accessible ? ← *dépend de la décision §6.7 du plan fonctionnel, à trancher avant d'écrire le test*.

---

### P0.1 — Parrainage réel

> **Vérifier d'abord** : le code `AMUD-2024-X` doit toujours être en dur dans `parrainage/page.tsx`.

Le domaine existe déjà côté agent (`ReferralAgent`, `ReferralRegistration`, `ReferralCommissions`, `ReferralAgentController`). **Ne pas dupliquer** : ajouter la vue candidat du même domaine.

- **Backend** : `GET /referrals/me` dans le groupe candidat → code personnel, filleuls, état des primes. S'inspirer de `ReferralAgentController::show` sans le réutiliser (il est protégé par `role:Commercial Agent`).
- **Frontend** : `src/lib/referrals.ts` + `src/data/referrals.ts` + hook ; `/parrainage` consomme le hook, `REFERRAL_TOKEN` et `referralCode` disparaissent.
- **Acceptation** : deux comptes candidats voient deux codes différents ; une inscription via un code apparaît chez le parrain.

---

### P0.4 — Décision `/offres`

Pas de développement tant que §6.2 du plan fonctionnel n'est pas tranché. Si le module est reporté : retirer l'entrée de la tab bar (`(candidate)/layout.tsx`) et de `CANDIDATE_PATHS`, et remplacer la page par un état « bientôt disponible ». **Ne pas laisser les données inventées en place.**

---

## 3. Lot 2 (P1) — offres et candidatures

Le seul vrai chantier backend. À construire dans l'ordre : chaque étape dépend de la précédente.

### P1.1 — Module offres

**Migration `create_job_offers_table`**

| Colonne | Type | Note |
|---|---|---|
| `id` | `id` | |
| `employer_profile_id` | `foreignId` → `employer_profiles` | l'émetteur |
| `title`, `description` | `string`, `text` | |
| `sector` | `string` | aligner sur les secteurs existants du dossier candidat |
| `city`, `country` | `string` | |
| `required_cefr_level` | `enum('A1'…'C2')` nullable | **piège connu** : un filtre `>=` sur une colonne ENUM ne compare pas comme un niveau. Réutiliser `RecruiterCandidateSearch::levelsAtLeast`, qui a déjà corrigé ce bug côté recruteur |
| `salary_min`, `salary_max` | `unsignedInteger` nullable | en centimes, devise séparée |
| `contract_type` | `enum` | |
| `status` | `enum('draft','published','closed')` | |
| `published_at` | `timestamp` nullable | |

**Contrôleur** `JobOfferController` : `index` (recherche, filtres, pagination) et `show`. Extraire la recherche en `App\Services\JobOfferSearch`, calqué sur `RecruiterCandidateSearch`.

**Routes** — publiques en lecture ? Décision : une offre visible sans compte est un atout SEO, mais expose les employeurs. Par défaut, **dans le groupe authentifié**.

**Frontend** : `src/lib/jobOffers.ts`, `src/data/jobOffers.ts`, `useJobOffers`. `/offres` réécrit (recherche, filtres, pagination via le composant `Pagination` existant) + nouvel écran `/offres/[id]`. Ajouter `/offres/[id]` à `CANDIDATE_PATHS`.

### P1.2 — Candidatures

**Migration `create_job_applications_table`** : `candidate_profile_id`, `job_offer_id`, `status` (`submitted`, `viewed`, `interview`, `accepted`, `rejected`, `withdrawn`), `applied_at`, `status_changed_at`, `withdrawn_at`. **Index unique `(candidate_profile_id, job_offer_id)`** — on ne postule qu'une fois.

**Routes** : `POST /offers/{offer}/apply`, `GET /candidate/applications`, `DELETE /candidate/applications/{application}`.

**Règle d'éligibilité** — §6.3 du plan fonctionnel. À implémenter dans **un service dédié** (`CanApplyToOffer`) et non dans le contrôleur : la règle sera consultée à trois endroits (bouton grisé côté front, validation côté API, futur filtre). L'API doit renvoyer **pourquoi** le candidat ne peut pas postuler, pour que l'écran l'explique au lieu d'afficher un bouton mort.

**Frontend** : bouton sur `/offres/[id]`, écran `/candidatures` avec une timeline par candidature — réutiliser `src/components/shared/Timeline.tsx`, déjà utilisé par `/profil`.

### P1.3 — Favoris

`create_job_offer_favorites_table` (`candidate_profile_id`, `job_offer_id`, unique), `POST|DELETE /offers/{offer}/favorite`, `GET /candidate/favorites`. Icône sur les cartes d'offre, écran dédié. **Mise à jour optimiste** côté react-query, et `syncQueue` pour le mode hors-ligne.

### P1.4 — Notifications

**Migration `create_notifications_table`** — ne pas utiliser le système de notifications natif de Laravel : il vise l'envoi (mail, Slack), pas un fil consultable in-app. Table propre : `user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`.

**Émission** : depuis les points existants — validation/refus de document (`DocumentController::review`, `admin/documents/{document}/approval`), réponse à une réclamation (`ComplaintController::update`), changement de statut de candidature (P1.2), affectation de tâche (`AdminTaskController::assign`).

**Routes** : `GET /candidate/notifications`, `PATCH /candidate/notifications/{id}/read`, `PATCH /candidate/notifications/read-all`.

**Frontend** : cloche dans le layout candidat + écran `/notifications`. **Réutiliser le composant de cloche déjà écrit** dans `src/components/amud/*Shell.tsx` (menu déroulant, pastille de compteur, « tout marquer comme lu ») — le comportement est identique, seuls les tokens de couleur diffèrent.

**Gain collatéral** : supprime le *polling* de 2 minutes utilisé aujourd'hui pour détecter une réponse de l'administration à une réclamation.

---

## 4. Lot 3 (P2) — compte et conformité

### P2.1 — Écran « Mon compte » *(le back est déjà là)*

> **Vérifier d'abord** : `grep -rl "auth/sessions" frontend/src` doit être vide.

`DeviceSessionController` et `PhoneChangeController` existent et sont routés. Il manque **uniquement l'écran**.

Créer `src/app/(candidate)/compte/page.tsx` (+ `CANDIDATE_PATHS`, + `src/content/candidate-compte.{fr,ar,en,de}.json`) regroupant :
- sessions actives et déconnexion à distance (`GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `DELETE /auth/sessions/others`)
- changement de numéro (`POST /auth/phone/change` + `/confirm`) — flux OTP en deux temps
- langue, thème, et la préférence de taille de texte si `SettingsContext` est monté (P3.1)
- **déconnexion** — aujourd'hui enfouie en bas de `/profil` (P3.1c)
- accès à la suppression de compte (P2.4)

### P2.4 — Suppression de compte et export *(CNDP)*

- `DELETE /candidate/account` : anonymisation ou suppression ? **Une suppression franche casse l'intégrité référentielle** des commissions de parrainage et des placements. Recommandation : suppression du compte et des médias, conservation des lignes financières sous forme anonymisée, avec un délai de grâce (`users.deletion_requested_at`) et une commande planifiée qui purge à échéance.
- `GET /candidate/account/export` : dossier, formations, langues, documents (métadonnées + URL signées via `FileAccess`), évaluations, réclamations, candidatures. JSON.
- **Purge des médias** : passer par le disque `local` déjà en place ; vérifier qu'aucun fichier orphelin ne subsiste (à couvrir par un test).

### P2.3 — Export du dossier en PDF

Réutiliser `GET /candidate/profile/preview`, qui produit déjà le rendu partagé avec le recruteur. Deux options : impression navigateur (`window.print()` + feuille `@media print`, ce que fait déjà le dossier recruteur — **coût quasi nul**), ou génération serveur (`dompdf`). Commencer par l'impression navigateur.

### P2.2 — Messagerie *(si retenue, §6.4)*

`conversations` + `messages`, ouverture déclenchée par `POST /recruiter/candidates/{id}/contact` (qui trace déjà le déblocage). Notification via P1.4. **Ne pas démarrer avant l'arbitrage produit** : c'est un module complet, pas un écran.

---

## 5. Abonnement B2C (P2.5) — projet à part

> **Vérifier d'abord** : `ls backend/app/Models/Subscription*.php` — le schéma **existe déjà**.

### 5.1 Ce qui est livré

Tables `subscription_plans` (`price_amount`, `price_currency` défaut `MAD`, `interval`, `is_active`), `subscriptions` (`status` ∈ `trialing|active|past_due|canceled|expired`, période courante, `cancel_at`, références prestataire nullables), `payment_attempts`, plus `placements` pour la commission B2B. Modèles présents. **Aucune route, aucun lecteur.**

### 5.2 Ce qui reste

1. **Trancher la règle d'usage** (§6.6 du plan fonctionnel) — *bloquant, avant toute ligne de code*. La migration le dit elle-même : brancher l'abonnement dans `RecruiterProfileView::isVisible()` est une étape séparée et volontairement différée.
2. **Choisir le prestataire.** Le commentaire de migration penche pour **PayZone** — CMI ne gère pas nativement le prélèvement récurrent, et Stripe couvre mal les cartes MAD. Le schéma étant agnostique, ce choix ne le fait pas bouger.
3. **Routes** : `GET /candidate/subscription`, `POST /candidate/subscription/checkout`, webhook du prestataire, `POST /candidate/subscription/cancel`.
4. **Expiration** : commande planifiée faisant passer `active` → `expired` à `current_period_end`, plus les relances.
5. **Frontend** : écran d'abonnement, état dans « Mon compte », et **traitement du cas expiré partout où la règle mord**.

**Le commentaire de la migration renvoie à « the plan doc's payment-provider comparison » — cette comparaison n'existe dans aucun document du dépôt.** À écrire avant de choisir (frais par transaction, prise en charge du récurrent, délai de règlement, qualité du bac à sable, exigences KYC).

---

## 6. Lot 4 (P3) — dette

| Item | Mise en œuvre |
|---|---|
| P3.1 `SettingsContext` mort | Le monter dans `Providers.tsx` **et** l'exposer dans « Mon compte », ou le supprimer. Ne pas le laisser à mi-chemin |
| P3.1b `AvatarUpload` mort | Le brancher sur l'étape 1 de `/profile-creation` (le dossier n'a aucune photo) ou le supprimer |
| P3.1c Déconnexion enfouie | Résolu par P2.1 |
| P3.1d `/faq` sans recherche | Filtre client sur les questions + lien vers `/reclamation` quand aucune réponse ne convient |
| P3.5 Intercepteur 401 | Ajouter un intercepteur de réponse dans `src/lib/opsApi.ts` **et** dans `src/lib/api.ts` : purge de session + redirection vers `/auth-phone` |
| P3.7 UX d'erreur | Un composant d'erreur unique avec action de reprise, appliqué aux 15 écrans |
| P3.8 Télémétrie | Choisir un outil, l'ajouter dans `Providers.tsx`. **Attention CNDP** : ne pas transmettre de données personnelles à un tiers sans base légale |
| P3.9 `candidate_skills` orphelin | Brancher les compétences sur le dossier (utile au matching P1.1) ou retirer la table |
| P3.2 Accessibilité | Reprendre la méthode du module Centres : contrastes WCAG AA **calculés** sur les valeurs réelles, cibles 44px, focus visible, navigation clavier |

---

## 7. Tests et vérification

**Backend** — un fichier par domaine dans `tests/Feature/`, nommé comme l'existant. Minimum par fonctionnalité : le chemin nominal, le refus d'accès aux données d'autrui, et la règle métier propre à la fonctionnalité (éligibilité, expiration, visibilité).

**Frontend** — **il n'existe aujourd'hui aucun test frontend**. Ne pas ouvrir ce chantier au milieu d'une fonctionnalité : soit c'est une décision à part, soit on s'en tient à `tsc --noEmit`, `eslint` et `npm run verify:no-mocks` en CI.

**Avant toute livraison**
```bash
cd backend  && php artisan test
cd frontend && npx tsc --noEmit && npx eslint src --ext .ts,.tsx && npm run verify:no-mocks
```

**Limite connue** : aucun outil de navigateur n'est disponible dans l'environnement actuel — rien de ce qui est décrit ici ne peut être validé visuellement par un agent. Les écrans mobiles, les états d'erreur et les parcours de bout en bout demandent une passe humaine ou un outillage CI dédié.

---

## 8. Ordre d'exécution recommandé

| # | Chantier | Charge | Dépend de |
|---|---|---|---|
| 1 | P0.2 câblage stage | faible — front seul | — |
| 2 | P2.1 écran Mon compte | faible — back prêt | — |
| 3 | P0.6 + P0.3 visibilité (même écran) | moyenne | décision §6.7 |
| 4 | P0.1 parrainage | moyenne | — |
| 5 | P0.4 décision offres | nulle | décision §6.2 |
| 6 | P1.1 offres | **élevée** | 5 |
| 7 | P1.2 candidatures | élevée | 6, décision §6.3 |
| 8 | P1.3 favoris | faible | 6 |
| 9 | P1.4 notifications | moyenne | 7 |
| 10 | P2.4 CNDP suppression + export | moyenne | 2 |
| 11 | P2.3 export PDF | faible | — |
| 12 | Lot 4 dette | variable | — |
| 13 | P2.5 abonnement | **projet** | 6-7, décision §6.6 |

Les points 1, 2 et 11 sont livrables immédiatement et sans arbitrage. Les points 3, 5, 7 et 13 sont **bloqués par une décision produit** — les commencer avant l'arbitrage, c'est coder deux fois.
