# Plan d'implémentation — Rôle **User** (candidat)

*Analyse de l'existant et plan fonctionnel. Rédigé le 2026-08-24. Périmètre : le rôle `candidate` de l'application réelle (`frontend/src/app/(candidate)/*` + `backend/`).*

---

## 0. De quel rôle parle-t-on ?

Le mot « User » désigne bien **le candidat** — c'est littéralement le nom du rôle Spatie côté Laravel :

```
Administrator     → admin
Company           → employer
Commercial Agent  → agent
User              → candidate     ← ce document
```
*(mapping dans `frontend/src/context/AuthContext.tsx`)*

C'est l'utilisateur final de la plateforme : la personne qui cherche un emploi en Allemagne, constitue son dossier, passe le test de langue et postule. À ne pas confondre avec `/amud/admin/utilisateurs` (gestion des comptes, côté admin) ni avec le type décoratif `Role` de `src/data/amud/utilisateurs.ts`.

> **Portée** : ce plan couvre l'application réelle. Le portail maquette `/amud/candidate` (1 page, 7 entrées de nav inertes, aucun backend) n'est **pas** la cible — il est traité en §6 comme décision à trancher.

---

## 1. Méthode

Tout ce qui suit a été vérifié dans le code, pas repris d'un document existant. `docs/roles-et-fonctionnalites-frontend.md` (2026-08-20) reste une bonne vue d'ensemble mais **trois de ses constats sont périmés** :

| Constat du doc du 20/08 | Réalité au 24/08 |
|---|---|
| « Deux simulateurs de salaire » (`/simulateur-salaire` vs `/salaire`) | **Résolu** — seul `/salaire` existe |
| « Deux écrans leçon du jour » (`/cours-allemand` vs `/lecon-jour`) | **Résolu** — seul `/lecon-jour` existe |
| « i18n non branché sur l'espace candidat » | **Faux aujourd'hui** — les 15 pages candidat sont traduites, 4 langues, un fichier de contenu par page (`src/content/candidate-*.{fr,ar,en,de}.json`) |

Vérifications faites : inventaire des routes (`backend/routes/api.php`), inventaire des endpoints réellement appelés par le front (`grep` sur `src/lib` + `src/data`), et lecture page par page des 20 écrans atteignables par un candidat pour distinguer données réelles / données en dur.

**Révision du 24/08 — ce document a lui-même été corrigé après un contrôle d'exhaustivité :**

| Erreur de la première version | Correction |
|---|---|
| L'assistant de dossier était décrit comme ayant **5 étapes** (chiffre repris du doc périmé) | Il en a **6** — `step === 1..6`, et `REQUIRED_SECTION_TO_STEP` mappe `personal:1, education:3, languages:4, availability:5, consents:6` |
| `/faq` n'apparaissait nulle part | Ajouté au §2.1 |
| Le parcours d'entrée (`/splash`, `/language`, `/auth-phone`, `/otp`) n'était pas inventorié | Ajouté au §2.1 — c'est la porte d'entrée du rôle |
| L'inventaire était organisé par endpoint, pas par fonctionnalité | §2.1 réécrit en inventaire fonctionnel exhaustif |

---

## 2. État des lieux vérifié

### 2.1 Inventaire fonctionnel complet de ce que le rôle possède aujourd'hui

Les **20 écrans** atteignables par un candidat, regroupés par domaine. Le statut distingue *réel* (connecté au backend), *local* (fonctionne mais ne persiste rien côté serveur) et *fiction* (données inventées dans le composant — détaillé au §2.2).

#### A. Entrée dans l'application (4 écrans, publics)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/splash` | Écran de lancement | Réel |
| `/language` | Choix de langue FR / AR (RTL) / EN / DE | Réel |
| `/auth-phone` | Saisie du numéro, envoi du code par WhatsApp/SMS — `POST /auth/otp/request`. Pas de mot de passe, pas d'email | Réel |
| `/otp` | Saisie du code, compte à rebours, renvoi du code — `POST /auth/otp/verify` | Réel |

Après connexion, `roleDestination.ts` envoie le candidat sur `/dashboard`, ou sur `/profile-creation?step=N` si son dossier est incomplet.

#### B. Constitution du dossier (5 écrans)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/profile-creation` | Assistant **6 étapes** : identité · secteur · formation · langues · disponibilité · consentements. Reprise automatique à la première étape manquante. Barre de progression. Soumission finale (`POST /candidate/profile/submit`) | Réel |
| `/documents` | Dépôt de documents, **extraction OCR**, relecture et correction des champs extraits (`PATCH .../review`), relance d'un scan échoué (`retry`), remplacement du fichier (`rescan`), visionneuse (`DocumentViewer`) | Réel |
| `/video` | Enregistrement d'une vidéo de présentation (MediaRecorder), relecture avant envoi, lecteur (`VideoPlayer`) | Réel |
| `/test-langue` | Test de niveau d'allemand CECR par IA vocale, historique des passages (`GET /candidate/language-assessments`) | Réel |
| `/verification-identite` | Vérification d'identité par capture caméra | Réel |

Sous-domaines rattachés à l'assistant : **formation** (`/candidate/educations`, CRUD complet) et **langues** (`/candidate/languages`, niveau CECR + pièce jointe de certificat, par fichier ou par document déjà déposé).

#### C. Profil et visibilité (3 écrans)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/dashboard` | Accueil : checklist de complétude (`ChecklistItem`), accès rapides, indicateur de progression | Réel |
| `/profil` | Profil public : jauge CECR (`CEFRGauge`), documents, vidéo, **QR code** de partage (`QRCodeGenerator`), **timeline** du dossier (`GET /candidate/profile/timeline`), squelettes de chargement, **et le seul bouton de déconnexion de tout l'espace candidat** | Réel |
| `/visibilite` | Score de visibilité du profil | Local — non calculé côté serveur |

#### D. Recherche d'emploi (2 écrans)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/offres` | Liste d'offres, puces de filtre par secteur | **Fiction** — tableau en dur, aucun backend |
| `/matching-preferences` | Préférences de matching : régions, secteur, salaire — enregistrées via `PUT /candidate/profile` | Réel |

Aucun écran de candidature, de favori ou de suivi n'existe (§2.4).

#### E. Montée en compétences (3 écrans)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/lecon-jour` | Leçon du jour, progression hebdomadaire, quiz | **Fiction** — alors que le backend existe (§2.3) |
| `/quiz-metier` | Quiz d'auto-évaluation de compétences | Local — résultat perdu au rechargement |
| `/salaire` | Simulateur de salaire | Local — aucun rattachement au profil |

#### F. Support et communauté (3 écrans)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/reclamation` | Dépôt d'une réclamation, **note vocale** (`AudioRecorder`), **mise en file d'attente hors-ligne**, consultation de ses propres signalements et de la réponse de l'administration (`GET /complaints`, `POST /complaints/{id}/seen`) | Réel |
| `/faq` | Centre d'aide : accordéon, 4 sections (profil, documents, formation, départ) | Statique — pas de recherche, pas d'escalade vers le support |
| `/parrainage` | Code de parrainage, copie, partage WhatsApp | **Fiction** — code identique pour tous |

#### G. Écran système (1)

| Écran | Fonctionnalités | Statut |
|---|---|---|
| `/offline` | Page de repli PWA | Réel |

#### H. Capacités transverses (hors écran)

Présentes sur tout l'espace candidat, montées dans `Providers.tsx` ou le layout :

| Capacité | Détail |
|---|---|
| Garde-fou de routes | `middleware.ts` / `CANDIDATE_PATHS` — cookie `as_role`, redirection si rôle incorrect |
| Blocage tant que le dossier est incomplet | `(candidate)/layout.tsx` redirige vers l'étape manquante à chaque chargement |
| Navigation | Tab bar 5 entrées sur mobile (Accueil · Offres · Documents · Profil · Support), sidebar à partir de `lg` |
| Hors-ligne | File d'attente d'écritures (`syncQueue.ts`), bandeau `OfflineBanner`, pastille `SyncBadge`, page `/offline` |
| PWA | Manifeste, service worker (`next-pwa`), invite d'installation (`InstallPrompt`) |
| i18n | 4 langues dont l'arabe en RTL, **un fichier de contenu par écran** (`content/candidate-*.{fr,ar,en,de}.json`) — les 15 écrans du groupe sont couverts |
| Thème | Clair / sombre (`ThemeContext` + `ThemeToggle`) |
| Session | Token en `localStorage` + cookies `as_role` / `as_uid` ; déconnexion (`POST /auth/logout`) |

### 2.2 Ce qui est de la **fiction d'écran**

Écrans qui ont l'air fonctionnels mais dont les données sont écrites en dur dans le composant. C'est le point le plus important de cette analyse : un testeur ou un client qui clique **ne peut pas les distinguer** du reste.

| Écran | Problème constaté |
|---|---|
| `/offres` | Le tableau `JOB_OFFERS` est en dur (Klinik Berlin, Hôtel München…). Aucun backend d'offres n'existe. Aucun bouton « postuler » ne mène nulle part. |
| `/parrainage` | Code de parrainage **en dur** : `const referralCode = 'AMUD-2024-X'` et un `REFERRAL_TOKEN` figé. Tous les candidats voient le même code ; aucun parrainage n'est traçable. |
| `/lecon-jour` | `WEEK_SLOTS` et `QUIZ_OPTIONS` en dur — **alors que le backend expose déjà `GET /candidate/tasks` et `PATCH /candidate/tasks/{assignment}`**, qui ne sont appelés par personne. |
| `/quiz-metier` | Aucune persistance : ni API ni `localStorage`. Le résultat disparaît au rechargement. |
| `/salaire` | Idem — simulateur purement local, rien n'est conservé ni rattaché au profil. |
| `/visibilite` | Affiche un score de visibilité qui n'est calculé nulle part côté serveur. |

### 2.3 Backend disponible mais **non consommé**

Endpoints déjà livrés côté Laravel qu'aucun écran candidat n'appelle. Ce sont les gains les plus rapides du plan :

| Endpoint | Manque côté front |
|---|---|
| `GET /candidate/tasks`, `PATCH /candidate/tasks/{assignment}` | Le « stage quotidien » réel — `/lecon-jour` devrait s'y brancher |
| `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `DELETE /auth/sessions/others` | Aucun écran de gestion des sessions/appareils |
| `POST /auth/phone/change` + `/confirm` | Aucun écran de changement de numéro |

### 2.4 Absent partout (backend **et** frontend)

Aucune route dans `backend/routes/api.php` ne couvre : **offres d'emploi, candidatures, favoris, notifications, messagerie**. Ces fonctionnalités demandent du travail backend complet (migrations, contrôleurs, politiques) avant toute UI.

---

## 3. Fonctionnalités à implémenter

Priorités : **P0** = le produit est incohérent sans ça · **P1** = cœur de parcours · **P2** = valeur produit · **P3** = confort.

---

### P0 — Sécurité et suppression de la fiction d'écran

> Un écran qui invente ses données est pire qu'un écran absent : il fait croire la fonctionnalité livrée, en démo comme en test.

#### P0.1 — Parrainage réel
- **Constat** : `referralCode = 'AMUD-2024-X'` en dur pour tout le monde.
- **À faire** : endpoint candidat `GET /referrals/me` (code personnel, compteur de filleuls, statut des primes). Le backend a déjà `/referrals/agent*` pour le rôle `agent` — s'en inspirer, ne pas le réutiliser tel quel (il est protégé par le rôle agent).
- **Écran** : `/parrainage` branché dessus, code copiable, partage WhatsApp, liste des filleuls et de leur état.
- **Acceptation** : deux comptes candidats voient deux codes différents ; une inscription via un code apparaît chez le parrain.
- **Alternative si le backend n'est pas prêt** : marquer l'écran « bientôt disponible » plutôt que d'afficher un faux code.

#### P0.2 — Brancher `/lecon-jour` sur le vrai stage quotidien
- **Constat** : le backend est déjà là, l'écran l'ignore.
- **À faire** : consommer `GET /candidate/tasks` et `PATCH /candidate/tasks/{assignment}`; la progression hebdomadaire vient du serveur, pas d'un tableau `WEEK_SLOTS` figé.
- **Acceptation** : une tâche assignée depuis `/admin/stage` apparaît chez le candidat ; la valider se voit côté admin.
- **Coût** : faible — c'est du câblage, pas du développement backend.

#### P0.3 — Persister quiz, salaire et visibilité
- **À faire** : rattacher les résultats au profil (`PUT /candidate/profile` ou une table dédiée). Le score de visibilité doit être **calculé côté serveur** à partir de la complétude réelle du dossier, sinon il ne veut rien dire.
- **Acceptation** : je passe le quiz, je recharge, mon résultat est toujours là.

#### P0.4 — Statuer sur `/offres`
Deux options, à trancher (voir §6) : soit on construit le module offres (P1.1), soit on retire l'écran du menu en attendant. **Ne pas le laisser tel quel.**

#### P0.5 — ~~Sécuriser l'accès aux médias du candidat~~ ✅ **déjà fait — vérifié le 24/08**
- **Correction d'une erreur de ce document.** Une version antérieure annonçait ici une « exposition de données en cours », sur la foi de `FEATURES_TO_IMPLEMENT.md` (section *Security*). **C'est faux aujourd'hui** : le correctif est livré.
- **Ce qui existe réellement** : `backend/app/Services/FileAccess.php` — porte d'autorisation unique pour tout fichier privé (CV, diplômes, pièces d'identité, vidéo, audio d'évaluation, notes vocales de réclamation). Les fichiers sont sur le disque `local` (jamais exposé par `storage:link`), servis par URL signée expirant en **10 minutes**, et l'autorisation est vérifiée *avant* de produire l'URL.
- **Couvert par 8 tests** (`backend/tests/Feature/PrivateMediaTest.php`) : accès par le propriétaire, chemin brut refusé sans signature, expiration effective, accès administrateur, recruteur refusé sur un dossier non découvrable puis autorisé une fois découvrable, audio de réclamation restreint, visiteur anonyme sans URL.
- **Rien à faire.** Conservé ici uniquement pour que la correction soit traçable.

#### P0.6 — Rendre le consentement révocable *(le candidat doit pouvoir se retirer)*
- **Constat** : la visibilité recruteur s'ouvre dès que les deux consentements (CGU + CNDP) sont enregistrés à l'étape 6 — « le candidat contrôle sa visibilité, et ça lui coûte une case à cocher » (`PLATFORM_OVERVIEW.md` §6). Mais cette case ne se coche **qu'une fois, à l'inscription** : aucun écran ne permet ensuite de la décocher.
- **Conséquence** : un candidat ne peut pas se retirer du vivier. C'est un problème produit *et* juridique — un consentement qu'on ne peut pas retirer n'en est pas vraiment un.
- **À faire** : exposer l'état de visibilité et un interrupteur de retrait, avec ses conséquences écrites en clair. `/visibilite` est l'écran naturel : il montre déjà un score, il doit montrer surtout **si je suis visible et comment cesser de l'être**.
- **Backend** : route de retrait/rétablissement du consentement CNDP, avec horodatage et journalisation.

---

### P1 — Cœur de parcours : offres et candidatures

C'est le chaînon manquant du produit. Aujourd'hui un candidat peut monter un dossier complet… et n'a littéralement aucun moyen de postuler. Le recruteur cherche des candidats (`/recruiter`), mais le flux inverse n'existe pas.

#### P1.1 — Module offres d'emploi *(backend + frontend)*
- **Backend** : migrations `job_offers` (intitulé, entreprise, ville, secteur, niveau CECR requis, fourchette salariale, type de contrat, statut, date de publication) ; `GET /offers` (recherche + filtres + pagination), `GET /offers/{id}`.
- **Frontend** : `/offres` réel (recherche, filtres secteur/ville/niveau/disponibilité, pagination) et `/offres/[id]` (fiche détaillée).
- **Réutiliser** : le moteur de filtres de `RecruiterCandidateSearch.php` côté back, et les composants `Pagination` / patterns de filtres déjà écrits côté front.

#### P1.2 — Candidatures
- **Backend** : `candidate_applications` (candidat, offre, statut, dates) ; `POST /offers/{id}/apply`, `GET /candidate/applications`, `DELETE /candidate/applications/{id}` (retrait).
- **Frontend** : bouton « Postuler » sur la fiche, écran `/candidatures` avec la timeline de chaque candidature (envoyée → vue → entretien → décision).
- **Règle métier à trancher** : postuler exige-t-il un dossier soumis (`submitted_at`) et/ou un niveau CECR atteint ? À décider avant de coder — ça conditionne l'UI (bouton bloqué + explication).

#### P1.3 — Favoris
- `POST|DELETE /offers/{id}/favorite`, `GET /candidate/favorites` ; icône sur les cartes d'offre, écran dédié.

#### P1.4 — Notifications
- **Backend** : table `notifications` + `GET /candidate/notifications`, `PATCH .../{id}/read`, `PATCH .../read-all`.
- **Événements** : document validé/rejeté, réponse à une réclamation, changement de statut de candidature, nouvelle offre correspondant aux préférences de matching, tâche de stage assignée.
- **Frontend** : cloche dans la chrome candidat + écran `/notifications`.
- **Note** : `docs/FEATURES_TO_IMPLEMENT.md` signale déjà que la réponse à une réclamation est récupérée par un *polling de 2 minutes*, faute de push — ce module résout ce point.

---

### P2 — Compte, sécurité, communication

#### P2.1 — Écran « Mon compte » *(backend déjà prêt)*
Il n'existe aujourd'hui **aucun** écran de paramètres de compte. À créer, en consommant l'existant :
- Sessions actives et déconnexion à distance — `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `DELETE /auth/sessions/others`
- Changement de numéro de téléphone — `POST /auth/phone/change` + `/confirm`
- Choix de langue et de thème (déjà en contexte, à exposer au même endroit)
- Déconnexion — `POST /auth/logout`

#### P2.2 — Messagerie candidat ↔ recruteur *(backend + frontend)*
Le recruteur « débloque » les coordonnées d'un candidat (`POST /recruiter/candidates/{id}/contact`), mais le candidat n'en sait rien et ne peut pas répondre dans la plateforme. À spécifier : conversations, messages, notification associée. **Décision produit requise** : contact hors plateforme (statu quo) ou messagerie intégrée ?

#### P2.3 — Export du dossier
Le recruteur peut imprimer un dossier ; le candidat ne peut pas exporter le sien. Ajouter un export PDF depuis `/profil`, en réutilisant le rendu de `GET /candidate/profile/preview`.

#### P2.4 — Suppression de compte et export des données *(régime CNDP, pas RGPD)*
- **Correction d'une erreur de la première version de ce document** : le régime applicable n'est pas le RGPD européen mais la **CNDP marocaine** — c'est la déclaration que l'application fait explicitement accepter à l'étape 6 (`cndp_consent_at`). L'échéance ne dépend donc pas d'un « déploiement européen » : l'obligation existe dès la mise en production au Maroc.
- **Constat** : aucune route de suppression ni d'export de données personnelles n'existe (confirmé côté backend et signalé dans `FEATURES_TO_IMPLEMENT.md`).
- **À faire** : `DELETE /candidate/account` (avec délai de grâce et purge des médias), export des données personnelles dans un format lisible, et écran correspondant dans « Mon compte » (P2.1).

#### P2.5 — Abonnement candidat (B2C, 100 MAD/an)
- **Constat corrigé le 24/08** : `FEATURES_TO_IMPLEMENT.md` §K affirme que « rien n'existe ». **C'est périmé** — le socle de données est livré (commit `3de6567`) : tables `subscription_plans`, `subscriptions`, `payment_attempts` et modèles `Subscription`, `SubscriptionPlan`, `PaymentAttempt`, plus `placements` pour la commission B2B.
- **Ce qui manque réellement** : aucune route n'expose ces tables, **rien ne les lit** (`RecruiterProfileView::isVisible()` les ignore volontairement), aucune passerelle de paiement n'est branchée, et la règle d'usage n'est pas tranchée. Le schéma est délibérément agnostique du prestataire (`provider`, `provider_customer_reference`, `provider_subscription_reference` nullables).
- **Côté candidat, cela suppose** : un écran d'abonnement (état, échéance, renouvellement), un parcours de paiement, et — surtout — **une décision produit sur ce qui se dégrade quand l'abonnement expire**. Un dossier déjà constitué disparaît-il du vivier ? devient-il seulement moins visible ? reste-t-il consultable par son propriétaire ?
- **Contrainte technique** : Stripe couvre mal les cartes en MAD. Le commentaire de la migration `create_subscriptions_table` penche pour **PayZone** (CMI ne gère pas nativement le prélèvement récurrent) — voir la comparaison au §3 du plan technique.
- **À traiter comme un projet à part entière**, pas comme une fonctionnalité — c'est l'avis explicite de `FEATURES_TO_IMPLEMENT.md` §K, et il est fondé : facturation, renouvellement, expiration, relances et remboursements forment un domaine complet.
- **Dépendance** : ne pas démarrer avant que P1 (offres/candidatures) donne une raison de payer.

---

### P3 — Confort et dette

| # | Sujet | Détail |
|---|---|---|
| P3.1 | `SettingsContext` code mort | Défini (`src/context/SettingsContext.tsx`, préférence de taille de texte) mais **jamais monté** dans `Providers.tsx`. Soit on le monte et on l'expose dans P2.1, soit on le supprime. |
| P3.1b | `AvatarUpload` code mort | `src/components/shared/AvatarUpload.tsx` n'est importé **nulle part**. Soit le brancher sur `/profile-creation` (le dossier n'a aujourd'hui aucune photo de profil), soit le supprimer. |
| P3.1c | Déconnexion difficile à trouver | Le seul bouton de déconnexion de tout l'espace candidat est enfoui en bas de `/profil`. À remonter dans l'écran « Mon compte » (P2.1). |
| P3.1d | `/faq` sans recherche ni escalade | Accordéon statique de 4 sections. Ajouter une recherche et un lien direct vers `/reclamation` quand aucune réponse ne convient. |
| P3.2 | Accessibilité | Pas d'audit sur l'espace candidat. Reprendre ce qui a été fait sur le module Centres : contrastes WCAG AA mesurés, cibles tactiles 44px, focus visible, navigation clavier. |
| P3.3 | Onboarding progressif | Le layout redirige de force vers `/profile-creation` tant que le dossier est incomplet (`layout.tsx`). Efficace mais brutal : envisager de laisser explorer `/offres` avant de bloquer. |
| P3.4 | Cohérence visuelle | L'espace candidat utilise les tokens `Pillar Foundation`, le module `/amud` son namespace `amud-*`. Deux systèmes séparés — acceptable tant que les deux mondes ne se rencontrent pas, à trancher s'ils fusionnent. |
| P3.5 | Aucun intercepteur 401 | Un jeton expiré affiche des erreurs au lieu de renvoyer vers la connexion (`src/lib/opsApi.ts`). Le candidat se retrouve devant un écran cassé sans comprendre qu'il doit se reconnecter. |
| ~~P3.6~~ | ~~Limitation de débit absente~~ ✅ | **Corrigé — autre erreur de ce document reprise de `FEATURES_TO_IMPLEMENT.md`.** Vérifié le 24/08 : `throttle:api` couvre tout le groupe authentifié, plus des limites dédiées sur `document-upload`, `language-assessment`, `complaint-create`, `otp-request`, `otp-verify` et `recruiter-search`. Couvert par `ApiRateLimitingTest.php`. |
| P3.7 | Gestion d'erreur incohérente | Plusieurs chemins d'échec se terminent par une alerte brute ou par rien du tout. Définir un motif unique erreur + reprise pour tout l'espace candidat. |
| P3.9 | `candidate_skills` : schéma orphelin | La table et le modèle `CandidateSkill` existent, **aucune route ne les expose et aucun écran ne les utilise**. Soit brancher les compétences sur le dossier (elles serviraient au matching de P1.1), soit retirer la table. |
| P3.8 | Aucune télémétrie | Ni analytics ni rapport de crash dans l'application. Aucune visibilité sur les échecs réels côté candidat une fois en production. |

---

## 4. Séquencement proposé

```
Lot 1 (P0) — cohérence & droit   : P0.2 câblage stage · P0.3 persistance · P0.6 retrait du consentement
                                   P0.1 parrainage · P0.4 décision offres
                                   (P0.5 médias authentifiés : déjà livré, rien à faire)
Lot 2 (P1) — cœur produit        : P1.1 offres -> P1.2 candidatures -> P1.3 favoris -> P1.4 notifications
Lot 3 (P2) — compte & conformité : P2.1 mon compte (rapide, back prêt) · P2.4 CNDP (suppression + export)
                                   P2.3 export du dossier · P2.2 messagerie (si retenue)
Lot 4 (P3) — qualité & dette     : 401, limitation de débit, UX d'erreur, télémétrie, accessibilité
Projet à part (P2.5)             : abonnement B2C — après le lot 2
```

Le lot 1 est majoritairement du câblage front. Le lot 2 est le seul qui exige un vrai chantier backend et conditionne tout le reste — P1.4 dépend de P1.2, qui dépend de P1.1. L'abonnement (P2.5) n'a de sens qu'une fois qu'il y a quelque chose à acheter.

---

## 5. Ce que ce plan ne couvre pas

- Le portail maquette `/amud/candidate` (voir §6).
- `mobile-expo/` — l'app Expo à la racine, hors périmètre de cette analyse.
- Les rôles `employer`, `admin`, `agent`.
- Toute estimation en jours/homme : le découpage est par dépendance, pas par charge.

---

## 6. Décisions à trancher avant de coder

Ces points ne relèvent pas de la technique — ils demandent un arbitrage produit :

1. **`/amud/candidate` vs `(candidate)/*`** — deux portails candidat coexistent. Le réel est très en avance (15 écrans connectés contre 1 maquette). Confirmer que la maquette est abandonnée, et si oui la retirer ou la marquer clairement.
2. **`/offres` en attendant le module** — le retirer du menu, ou l'afficher en « bientôt disponible » ? Le laisser avec des données inventées n'est pas une option tenable.
3. **Conditions pour postuler** — dossier soumis obligatoire ? niveau CECR minimum ? (conditionne P1.2)
4. **Messagerie intégrée** (P2.2) — ou contact hors plateforme comme aujourd'hui ?
5. **Conformité CNDP** (P2.4) — la suppression de compte et l'export de données sont dus dès la mise en production au Maroc, pas seulement en cas de déploiement européen. Quel est le calendrier ?
6. **Modèle d'abonnement** (P2.5) — que perd exactement un candidat dont l'abonnement à 100 MAD expire ? Il sort du vivier, il devient moins visible, ou il garde tout et ne peut plus postuler ? Cette réponse détermine à elle seule l'essentiel du chantier.
7. **Retrait du consentement** (P0.6) — retirer le consentement CNDP retire-t-il le candidat du vivier immédiatement, ou seulement pour les nouvelles recherches ? Que deviennent les dossiers déjà débloqués par un recruteur ?

---

## 7. Risques

| Risque | Portée | Atténuation |
|---|---|---|
| Les écrans-fiction partent en démo client tels quels | Élevé — crédibilité | Traiter le lot 1 en priorité, ou marquer les écrans concernés |
| Le module offres est sous-estimé | Élevé — c'est un vrai chantier back | Le découper : lecture seule d'abord (P1.1), candidatures ensuite (P1.2) |
| `NEXT_PUBLIC_USE_MOCKS=1` reste actif | Moyen | `npm run verify:no-mocks` existe déjà, à passer en CI |
| Consentement irrévocable | Élevé — juridique | P0.6 |
| **Planifier du travail déjà fait** | **Élevé — gaspillage** | Cette erreur s'est produite trois fois dans ce document (médias, limitation de débit, schéma d'abonnement), à chaque fois en faisant confiance à `FEATURES_TO_IMPLEMENT.md`. **Vérifier dans le code avant d'ouvrir un chantier**, jamais dans un document |
| L'abonnement est traité comme une fonctionnalité | Moyen — dérive de charge | Le sortir du plan de fonctionnalités et le cadrer comme un projet (P2.5) |
| Aucune vérification visuelle | Moyen | Aucun outil navigateur n'est disponible dans l'environnement actuel — prévoir une passe manuelle ou outiller la CI |

---

## 8. Fichiers clés

- **Rôles & garde-fous** : `src/lib/types.ts`, `src/middleware.ts`, `src/lib/roleDestination.ts`, `src/context/AuthContext.tsx`
- **Écrans candidat** : `src/app/(candidate)/*/page.tsx`, layout `src/app/(candidate)/layout.tsx`
- **Couche données** : `src/data/{candidateProfile,documents,auth}.ts`, `src/lib/{candidateProfile,documents,complaints,languageAssessment}.ts`
- **Bascule mock/réel** : `src/data/config.ts`, `src/data/mockAdapter.ts`
- **Hors-ligne** : `src/lib/syncQueue.ts`, `src/context/NetworkContext.tsx`
- **i18n** : `src/lib/i18n.ts`, `src/content/candidate-*.{fr,ar,en,de}.json`
- **Backend** : `backend/routes/api.php`, `backend/app/Http/Controllers/Api/{CandidateProfileController,DocumentController,CandidateTaskController,ComplaintController}.php`
