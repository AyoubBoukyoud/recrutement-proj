# Rôles et fonctionnalités — Application frontend

*Analyse de l'existant : `frontend/` (Next.js 14, App Router) au 2026-08-20. Périmètre : le dossier `frontend/` uniquement — `backend/`, `mobile-expo/`, `user-app/` et `web-admin/` existent à la racine du repo mais ne sont pas couverts ici.*

---

## Résumé exécutif

Le frontend contient **deux applications qui cohabitent dans le même projet Next.js, sans se toucher** :

1. **L'application réelle** — 4 rôles (`candidate`, `employer`, `admin`, `agent`), protégés par `middleware.ts`, avec un vrai bascule mock/API réelle (`NEXT_PUBLIC_USE_MOCKS`) pointant vers le backend Laravel. C'est le produit en construction sérieuse : onboarding OTP, dossier candidat avec OCR, recherche recruteur, console admin, parrainage agent.
2. **Le module `/amud/*`** — d'anciennes maquettes HTML ("Amud Skills" / Google Stitch) portées telles quelles en pages Next.js. Aucune authentification, aucun backend, aucune API : uniquement des tableaux en dur et `localStorage`. Conçu à l'origine comme un espace isolé pour ne pas risquer l'app réelle (voir décision produit en fin de document).

Trois pages ont franchi la frontière entre les deux mondes : `/`, `/employeurs` et `/produit` sont aujourd'hui les **vraies** pages publiques de production, portées depuis les maquettes `/amud/marketing/*` (qui restent, elles, figées comme copie historique).

Ce document détaille, rôle par rôle, ce qui existe réellement, ce qui est maquette, et ce qui manque.

---

## 1. Architecture générale : deux univers parallèles

```
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION RÉELLE (protégée, backend Laravel)               │
│                                                                 │
│  Public          Onboarding        4 espaces par rôle          │
│  /, /employeurs   /splash          /dashboard   (candidat)     │
│  /produit         /language        /recruiter   (employeur)    │
│  /metiers/[slug]  /auth-phone      /admin/*     (admin)        │
│                   /otp             /agent       (agent)        │
│                   /profile-creation                            │
│                                                                 │
│  Garde-fou : middleware.ts (cookie as_role)                   │
│  Données   : lib/api.ts + lib/opsApi.ts → Laravel (backend/)  │
│              bascule NEXT_PUBLIC_USE_MOCKS (mockAdapter.ts)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODULE /amud/*  (maquette, non protégée, aucun backend)       │
│                                                                 │
│  /amud            (hub)                                        │
│  /amud/admin/*     (13 pages — console interne complète)       │
│  /amud/commercial/* (3 pages — CRM self-service)                │
│  /amud/employer     (1 page — portail B2B)                     │
│  /amud/candidate    (1 page — portail candidat)                │
│  /amud/marketing/*  (3 pages — copie figée de l'ancien accueil)│
│                                                                 │
│  Données : seed arrays (src/data/amud/*) + localStorage         │
│            (src/lib/amud/local*.ts) — jamais de fetch/axios     │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi deux mondes ?** Le module `/amud` a été intégré comme lot de maquettes (19 pages + 3 pages marketing) sans jamais toucher aux routes réelles `/admin`, `/agent`, `/recruiter`, `(candidate)` qui sont, elles, connectées à une vraie API. Le choix explicite a été d'ajouter des routes isolées plutôt que de relooker l'existant qui fonctionne — voir §9.

---

## 2. Stack technique

| Aspect | Détail |
|---|---|
| Framework | Next.js **14.2.3**, App Router (`src/app`) |
| UI | React 18.3.1, TypeScript 5.4.5, Tailwind CSS 3.4.3 |
| Data fetching | `@tanstack/react-query` 5.101.4 (console ops), `axios` (ops), `fetch` natif typé (candidat réel) |
| État global | React Context uniquement (`AuthContext`, `ProfileContext`, `NetworkContext`, `LanguageContext`) + `useState`/`localStorage` local — pas de Redux/Zustand |
| PWA | `next-pwa` — manifest, page `/offline`, bannière hors-ligne, prompt d'installation |
| Autres libs | `lucide-react` (icônes), `qrcode` (QR de parrainage) |
| Design tokens | `packages/design-tokens/{tokens.cjs,colors.json}` — palette « Pillar Foundation » (sarcelle `#006266`/or/bordeaux, style Material 3), partagée par l'app réelle. Le module `/amud` a son **propre** namespace Tailwind isolé (`amud-*` dans `frontend/tailwind.config.js`) pour ne jamais entrer en collision avec les tokens réels. |
| Garde-fou mock | `npm run verify:no-mocks` — build sans mocks puis grep du bundle pour détecter une fuite de données factices en production |

---

## 3. Authentification et système de rôles

### 3.1 Système réel (production)

```ts
// src/lib/types.ts
export type UserRole = 'candidate' | 'employer' | 'admin' | 'agent';
```

- **Connexion** : téléphone + code OTP (WhatsApp/SMS), pas de mot de passe ni email. Flux : `/language` → `/auth-phone` → `/otp` → redirection selon rôle.
- **Mapping backend** : rôles Spatie du Laravel — `Administrator → admin`, `Company → employer`, `Commercial Agent → agent`, `User → candidate` (`AuthContext.tsx`).
- **Session** : cookies `as_role` / `as_uid` + `localStorage` (token).
- **Garde-fou de routes** — `src/middleware.ts` : chaque groupe de routes exige le bon rôle en cookie, sinon redirection vers `/auth-phone` (ou `/dashboard` si un candidat tente une route staff).
- **Destination post-connexion** — `src/lib/roleDestination.ts` :

| Rôle | Atterrit sur |
|---|---|
| `candidate` | `/dashboard` (ou `/profile-creation?step=N` si dossier incomplet) |
| `employer` | `/recruiter` |
| `admin` | `/admin/apercu` |
| `agent` | `/agent` |

- **Granularité** : le contrôle est **au niveau de la route**, pas d'un système de permissions fines (pas de "peut voir mais pas modifier X").

### 3.2 Système du module `/amud` (maquette, décoratif)

- `src/data/amud/utilisateurs.ts` définit un type `Role = 'Candidat' | 'Recruteur' | 'Commercial' | 'Administrateur'` — **une simple étiquette de colonne** dans un tableau, utilisée pour filtrer l'affichage, jamais pour autoriser quoi que ce soit.
- `/amud/admin/roles-permissions` est un **éditeur de matrice de permissions complet à l'écran** (4 rôles seedés, matrice 3 modules × 6 actions, visibilité de données, zone géo, clonage de rôle) — mais entièrement `useState` : rien n'est persisté, rien n'est appliqué ailleurs dans l'app. C'est une maquette/spécification, pas une fonctionnalité active.
- Aucune page de `/amud/*` ne vérifie de session : on accède à un espace en tapant simplement son URL. Le seul lien entre les deux systèmes est le menu de connexion rapide développeur (`DEV_LOGIN_MENU` dans `/auth-phone`), qui n'existe que pour naviguer plus vite en environnement de dev (`USE_MOCKS`).

---

## 4. Rôles et fonctionnalités — détail

### 4.1 Visiteur / grand public (non connecté)

Pages réelles, sans compte :

| Page | Fonction |
|---|---|
| `/` | Accueil : présentation, bandeau de confiance, 4 secteurs, méthodologie |
| `/employeurs` | Page confiance/conformité employeur : coûts de vacance, normes RGPD/CECR, calculateur de ROI (`RoiCalculatorForm`) |
| `/produit` | Vitrine produit : pitch vidéo, gratuité candidat, OCR, suivi temps réel |
| `/metiers/[slug]` | Fiche métier détaillée (ex. infirmier) — niveau d'allemand requis, diplôme, dossier attendu. Seul point d'entrée dans un arbre de pages indexées SEO |
| `/splash`, `/language` | Écran de lancement puis choix de langue (FR/AR/EN/DE) |
| `/offline` | Page de repli PWA hors-ligne |

**État** : réel, en production, localisé FR/EN/DE/AR (voir §7).

### 4.2 Candidat (`role: candidate`)

L'espace le plus construit de l'application. Toutes les routes ci-dessous sont protégées par le middleware (`CANDIDATE_PATHS`).

| Page | Fonction | Backend |
|---|---|---|
| `/dashboard` | Accueil candidat : checklist de complétude + accès rapides | Réel |
| `/profile-creation` | Assistant en 5 étapes (identité, secteur, langues, disponibilité, consentements) | Réel |
| `/documents` | Upload de documents + **extraction OCR** (CV, diplômes) | Réel |
| `/video` | Enregistrement de vidéo de présentation (MediaRecorder) | Réel |
| `/test-langue` | Test de niveau d'allemand (CECR) par IA vocale | Réel |
| `/profil` | Profil public candidat : jauge CECR, documents, vidéo, QR code, timeline | Réel |
| `/verification-identite` | Vérification d'identité par capture caméra | Réel |
| `/reclamation` | Formulaire de réclamation, note vocale possible, mise en file hors-ligne | Réel |
| `/faq` | Centre d'aide statique | Réel |
| `/matching-preferences` | Préférences de matching (régions, secteur, salaire) | Réel |
| `/offres` | Liste d'offres d'emploi | Données statiques (seed) |
| `/quiz-metier` | Quiz d'auto-évaluation de compétences | Réel |
| `/parrainage` | Programme de parrainage : code, partage WhatsApp | Réel |
| `/visibilite` | Écran "score de visibilité" | Réel |
| `/simulateur-salaire` **et** `/salaire` | **Deux simulateurs de salaire distincts** (doublon, voir §8) | Réel (composants différents) |
| `/cours-allemand` **et** `/lecon-jour` | **Deux écrans de "leçon du jour"** (doublon, voir §8) | Réel |

**État** : le cœur métier (dossier, OCR, test de langue, vidéo) est réel et connecté à l'API. Quelques écrans secondaires sont des variantes de gabarit ("Stitch") jamais unifiées.

### 4.3 Recruteur / Employeur (`role: employer`)

| Page | Fonction |
|---|---|
| `/recruiter` (`RecruiterSearch`) | Recherche de candidats avec filtres, deux onglets internes : Recherche / Ma sélection. Inclut `CandidateDossier` (dossier détaillé), `ShortlistPanel` (short-list), `AssessmentMetrics`, `DocumentList` |

**État** : réel, connecté à l'API via `opsApi.ts`. Un seul espace, pas encore de sous-navigation multi-pages.

### 4.4 Administrateur (`role: admin`)

Console `/admin/*`, layout partagé avec `TopBar` (pastille de connectivité API) :

| Page | Fonction |
|---|---|
| `/admin/apercu` | Tableau de bord métriques/files d'attente |
| `/admin/candidats` | Liste des candidats, filtres, actions valider/rejeter |
| `/admin/candidats/[id]` | Dossier candidat : documents, checklist, assignation de tâches |
| `/admin/reclamations` | File de traitement des réclamations |
| `/admin/stage` | Catalogue des tâches "stage quotidien" assignables |
| `/admin/utilisateurs` | Utilisateurs de la plateforme + attribution de rôles Spatie |
| `/admin/parrainage` | Paiement des commissions de parrainage |

**État** : réel, connecté à l'API Laravel. C'est la console de production, distincte du CRM maquette `/amud/admin`.

### 4.5 Agent commercial (`role: agent`)

| Page | Fonction |
|---|---|
| `/agent` (`AgentDashboard`) | QR code de parrainage + suivi des commissions |

**État** : réel. Un seul écran aujourd'hui — pas de CRM (contacts, rendez-vous) côté réel ; cette partie n'existe que côté maquette (§4.6.2).

### 4.6 Module `/amud/*` — maquettes par rôle

Aucune de ces pages n'a de backend. Données = tableaux seedés (`src/data/amud/*`) + `localStorage` (`src/lib/amud/local*.ts`, clé `amud:<entité>:extra`) pour que les ajouts survivent à la navigation dans une même session. Rien ne persiste entre appareils ni ne survit à un `localStorage.clear()`.

#### 4.6.1 Admin — CRM interne complet (13 pages, `AdminShell`)

| Page | Fonction |
|---|---|
| `/amud/admin` | Dashboard : KPI, classement commerciaux, actions rapides |
| `/amud/admin/utilisateurs` | Table utilisateurs (CRUD front, filtres rôle/statut) |
| `/amud/admin/entreprises` | Entreprises partenaires, tiroir de détail, filtres, pagination |
| `/amud/admin/offres` | Offres d'emploi, actions groupées, filtres |
| `/amud/admin/candidatures` | Pipeline candidat en **Kanban** (4 colonnes, glisser-déposer) + vue tableau |
| `/amud/admin/commerciaux` | Répertoire des commerciaux |
| `/amud/admin/commerciaux/[id]` | Profil commercial 360° — 10 onglets (aperçu, infos, activités, appels, rappels, RDV, objectifs, performance, historique, permissions) |
| `/amud/admin/commerciaux/nouveau` | Formulaire de création de commercial |
| `/amud/admin/objectifs` | Éditeur d'objectifs commerciaux, anneau de progression global |
| `/amud/admin/activites` | Journal d'activités commerciales (appels/RDV/emails/notes), export CSV |
| `/amud/admin/journal-activite` | Journal d'audit système (création/modif/désactivation/échec de connexion, IP, diff) |
| `/amud/admin/roles-permissions` | Éditeur de matrice rôles/permissions (voir §3.2 — non fonctionnel) |
| `/amud/admin/parametres` | Paramètres généraux : identité plateforme, règles de validation d'offres, objectifs, bascules IA |

Navigation : certains liens de la barre latérale (Candidats, Recruteurs) sont volontairement des `InertNavItem` — visibles mais inertes, avec l'infobulle *"Pas encore disponible dans cette maquette"*.

#### 4.6.2 Commercial — CRM en libre-service (3 pages, `CommercialShell`)

| Page | Fonction |
|---|---|
| `/amud/commercial` | Espace de travail quotidien : quota d'appels, log rapide d'appel, journal d'activité |
| `/amud/commercial/rendez-vous` | Calendrier hebdomadaire des rendez-vous (statuts : programmé/confirmé/terminé/annulé/reporté) |
| `/amud/commercial/contacts` | Portefeuille de contacts (candidats/recruteurs/entreprises), priorité et relance |

3 pages réelles sur 5 items de nav (2 restent inertes).

#### 4.6.3 Employeur — portail B2B (1 page, `EmployerShell`)

| Page | Fonction |
|---|---|
| `/amud/employer` | Dashboard : cartes candidats avec score de matching, langues, disponibilité |

1 page réelle sur 6 items de nav.

#### 4.6.4 Candidat — portail maquette (1 page, `CandidateShell`)

| Page | Fonction |
|---|---|
| `/amud/candidate` | Dashboard : checklist profil, offres recommandées avec % de matching |

1 page réelle sur 8 items de nav (profil, CV, compétences, offres, candidatures, favoris, messages, notifications sont inertes).

#### 4.6.5 Marketing — mini-site public figé (3 pages, `MarketingShell`)

| Page | Fonction |
|---|---|
| `/amud/marketing/home` | Copie figée de l'ancien contenu, aujourd'hui porté sur `/` |
| `/amud/marketing/employers` | Copie figée, portée sur `/employeurs` |
| `/amud/marketing/product` | Copie figée, portée sur `/produit` |

Boutons "Connexion" et sélecteur de langue volontairement inertes (toast : *"La connexion réelle se fait via le flux OTP"*). Conservées comme référence historique de la maquette d'origine — les pages réelles à maintenir sont `/`, `/employeurs`, `/produit`.

---

## 5. Inventaire complet des routes

### Application réelle

| Route | Rôle requis | Fichier |
|---|---|---|
| `/`, `/employeurs`, `/produit`, `/metiers/[slug]`, `/offline` | Public | `src/app/{page,employeurs,produit,metiers/[slug],offline}/page.tsx` |
| `/splash`, `/language`, `/auth-phone`, `/otp` | Public (flux de connexion) | `src/app/{splash,language,auth-phone,otp}/page.tsx` |
| `/profile-creation`, `/dashboard`, `/documents`, `/video`, `/test-langue`, `/profil`, `/reclamation`, `/faq`, `/matching-preferences`, `/offres`, `/quiz-metier`, `/simulateur-salaire`, `/salaire`, `/parrainage`, `/verification-identite`, `/visibilite`, `/cours-allemand`, `/lecon-jour` | `candidate` | `src/app/(candidate)/*/page.tsx` |
| `/recruiter` | `employer` | `src/app/recruiter/page.tsx` |
| `/admin`, `/admin/apercu`, `/admin/candidats[/[id]]`, `/admin/reclamations`, `/admin/stage`, `/admin/utilisateurs`, `/admin/parrainage` | `admin` | `src/app/admin/**` |
| `/agent` | `agent` | `src/app/agent/page.tsx` |

### Module `/amud` (aucune protection de route)

| Route | Espace |
|---|---|
| `/amud` | Hub — cartes vers les 4 espaces + le mini-site marketing |
| `/amud/admin/{page,utilisateurs,entreprises,offres,candidatures,commerciaux,commerciaux/[id],commerciaux/nouveau,objectifs,activites,journal-activite,roles-permissions,parametres}` | Admin (13 pages) |
| `/amud/commercial/{page,rendez-vous,contacts}` | Commercial (3 pages) |
| `/amud/employer` | Employeur (1 page) |
| `/amud/candidate` | Candidat (1 page) |
| `/amud/marketing/{home,employers,product}` | Marketing figé (3 pages) |

---

## 6. Couche de données et intégration backend

### Application réelle — bascule mock/réel authentique

- `src/lib/api.ts` — client `fetch` typé, utilisé par le candidat (`src/data/auth.ts`, `documents.ts`, `candidate.ts`), cible `NEXT_PUBLIC_API_URL` (Laravel, `backend/`).
- `src/lib/opsApi.ts` — instance `axios`, utilisée par recruteur/admin/agent (~30 appels).
- `src/data/mockAdapter.ts` — **faux serveur REST en mémoire**, branché sur `api.defaults.adapter` uniquement si `NEXT_PUBLIC_USE_MOCKS=1`, importé dynamiquement pour être totalement absent du bundle de prod quand désactivé (vérifié par `npm run verify:no-mocks`).
- Chaque dépôt de données (`data/auth.ts`, `data/candidate.ts`, `data/documents.ts`) expose une implémentation `http*` (réelle) et `mock*` (fixtures), sélectionnée par ce même drapeau.
- **Aujourd'hui, `.env.local` a `NEXT_PUBLIC_USE_MOCKS=1`** — l'app réelle tourne donc actuellement sur mocks elle aussi, mais via un mécanisme prévu pour basculer vers le vrai backend, contrairement au module `/amud`.

### Module `/amud` — mock permanent, sans issue

- `src/data/amud/*.ts` — tableaux `xSeed` statiques (utilisateurs, candidatures, entreprises, offres, commerciaux, alertes).
- `src/lib/amud/local*.ts` — lecture/écriture `localStorage` pour simuler la persistance des ajouts ("Ajouter un utilisateur", etc.).
- `src/lib/amud/csv.ts` — export CSV généré côté client (aucun serveur).
- **Aucun fichier de `/amud/*` n'importe `fetch` ni `axios`.** Brancher ce module sur un vrai backend nécessiterait un travail backend complet (contrôleurs/routes/migrations Laravel) — rien n'existe côté API pour le CRM commercial (contacts, rendez-vous, objectifs).

---

## 7. Internationalisation (i18n)

| Élément | Détail |
|---|---|
| Langues | FR, AR (RTL), EN, DE — `src/content/languages.json` |
| Mécanisme | `src/lib/i18n.ts` + `useLanguage()` (repli sur le français si clé/langue manquante) |
| Dictionnaires génériques | `content/i18n.{fr,ar,en,de}.json` — libellés transverses (navigation, actions génériques, hors-ligne) |
| Contenu marketing dédié | `content/home.*.json`, `content/trades.*.json` — via `useHomeContent()` / `useTrades()` |

**Portée réelle de l'i18n — étroite, pas globale :**
- Réellement branché sur : `/language`, `/auth-phone`, `/otp`, la chrome partagée (`OfflineBanner`, `LanguageSwitcher`, `InstallPrompt`), et les pages publiques `/`, `/employeurs`, `/produit`, `/metiers/[slug]`.
- **Non branché** : toutes les pages fonctionnelles de l'espace candidat, toute la console admin réelle, et **l'intégralité du module `/amud`** — tout est écrit en français en dur dans les composants.

---

## 8. Constats, doublons et dette technique

| # | Constat | Où | Impact |
|---|---|---|---|
| 1 | Deux simulateurs de salaire distincts et non unifiés | `/simulateur-salaire` vs `/salaire` | Confusion produit, double maintenance |
| 2 | Deux écrans "leçon du jour" distincts | `/cours-allemand` vs `/lecon-jour` | Idem |
| 3 | Éditeur de rôles/permissions entièrement décoratif | `/amud/admin/roles-permissions` | Peut donner une fausse impression de fonctionnalité à un client/testeur |
| 4 | Liens de navigation volontairement morts (`InertNavItem`) | Toutes les shells `/amud/*` | Attendu par design (maquette fidèle à l'IA d'origine), mais à ne jamais confondre avec un bug si l'app est démontrée telle quelle |
| 5 | `SettingsContext` (préférence de taille de texte) défini mais jamais monté dans `Providers.tsx` | `src/context/SettingsContext.tsx` | Code mort |
| 6 | Aucune protection de route sur `/amud/*` | `middleware.ts` ne couvre que l'app réelle | Sans conséquence tant que `/amud` reste une maquette interne, mais à traiter avant toute exposition publique |
| 7 | i18n non branché sur l'essentiel du produit (candidat, admin réel, tout `/amud`) | §7 | Le multilingue n'est aujourd'hui qu'une vitrine sur l'onboarding et le site public |
| 8 | Module `/amud` sans aucun chemin vers un vrai backend | §6 | Toute mise en production du CRM commercial ou des portails maquette exige un travail backend complet, pas seulement frontend |

---

## 9. Recommandations et pistes (priorisées)

**Court terme (clarifier l'existant)**
- Documenter clairement, y compris pour toute personne externe qui visite l'app, que `/amud/*` est une maquette de démonstration et non le produit — un bandeau discret ou une mention dans le hub `/amud` suffit déjà en partie.
- Trancher le sort des paires dupliquées (§8.1–2) : garder une version, supprimer/rediriger l'autre.

**Moyen terme (si le module `/amud` doit devenir réel)**
- Le CRM commercial (`/amud/commercial`, `/amud/admin` volet commercial) est le morceau le plus abouti fonctionnellement côté maquette mais le plus vide côté backend : c'est le candidat naturel si l'équipe veut prioriser un vrai module commercial/CRM.
- Le portail employeur maquette (`/amud/employer`) et le portail candidat maquette (`/amud/candidate`) sont, eux, largement couverts côté réel (`/recruiter`, `(candidate)/*`) — la vraie question à trancher est laquelle des deux versions (réelle ou maquette) devient la référence avant d'investir plus dans l'une ou l'autre.

**Long terme**
- Étendre l'i18n réel (aujourd'hui limité à l'onboarding + site public) au tableau de bord candidat et à la console admin si le multilingue est un objectif produit et pas seulement une vitrine d'accueil.
- Si `/amud/admin/roles-permissions` doit devenir une vraie fonctionnalité, elle suppose un système de permissions fines côté backend — le système réel actuel n'a que 4 rôles à granularité "route entière" (§3.1).

---

## 10. Annexes

**Documents connexes déjà présents dans `docs/`** : `PLATFORM_OVERVIEW.md` (vision produit), `FEATURES_TO_IMPLEMENT.md` (audit fonctionnel vs. spec, très détaillé côté backend/mobile), `Project_Summary_Recruitment_Platform.md` (pitch d'origine), `plan-home-recruitment.md` (spécification de l'accueil). Ces documents couvrent surtout `backend/` et `mobile-expo/` ; le présent document est le premier centré spécifiquement sur `frontend/` avec la distinction réel/maquette.

**Fichiers clés à connaître**
- Rôles & garde-fous réels : `src/lib/types.ts`, `src/middleware.ts`, `src/lib/roleDestination.ts`, `src/context/AuthContext.tsx`
- Bascule mock/réel : `src/data/config.ts`, `src/lib/api.ts`, `src/lib/opsApi.ts`, `src/data/mockAdapter.ts`
- Shells `/amud` : `src/components/amud/{AdminShell,CommercialShell,EmployerShell,MarketingShell}.tsx`, `src/components/amud/ui.tsx`
- Données `/amud` : `src/data/amud/*.ts`, `src/lib/amud/local*.ts`
- i18n : `src/lib/i18n.ts`, `src/content/*.json`
