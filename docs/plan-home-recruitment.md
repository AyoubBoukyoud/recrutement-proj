# Plan de conception — Page d'accueil publique

**Produit :** plateforme de recrutement international reliant des candidats marocains à des
employeurs allemands.
**Portée :** la page d'accueil publique (`/`) et ses composants, en 4 langues.
**Destinataires :** équipe front-end, product, contenu.
**Statut :** spécification de conception — prête à implémenter, sans réinterprétation.

---

## 0. Hypothèse produit à valider avant le lot 1

> **Il n'existe aucune offre d'emploi dans ce produit.** Le back-end n'a ni table d'offres, ni
> candidature, ni employeur-annonceur. Le modèle est inversé par rapport à un job board : ce sont
> les **recruteurs qui cherchent des candidats**, et non les candidats qui postulent à des annonces.
> Les « offres » visibles aujourd'hui dans l'application sont des données factices
> (`user-app/src/lib/mockData.ts`).

Conséquence directe sur le brief : une barre « recherche d'emploi » et une section « jobs mis en
avant » ne peuvent afficher que du vide ou du mensonge. Or promettre des offres à un candidat
marocain qui n'en trouvera aucune est exactement ce qui détruit la confiance que cette page doit
construire.

**Décision retenue** (appliquée dans tout ce document) : le champ de recherche du Hero est conservé
— il porte l'intention « je commence maintenant » — mais il interroge une **taxonomie de métiers**,
pas des annonces. Le résultat n'est pas une liste d'offres : c'est une **page métier** (« Infirmier
en Allemagne ») qui répond aux vraies questions du candidat — niveau d'allemand attendu,
reconnaissance du diplôme, délai réaliste, salaire indicatif — et le fait entrer dans son dossier.

| Option | Ce que ça implique | Recommandation |
| --- | --- | --- |
| **A. Recherche métier** (retenue) | Taxonomie statique (JSON versionné), aucune dépendance back-end, livrable au lot 1 | ✅ à faire maintenant |
| B. Vraies offres d'emploi | Nouveau domaine back-end complet : offres, employeurs annonceurs, candidatures, modération | À trancher produit — hors périmètre de cette page |

Si l'option B est un jour développée, le composant de recherche gagne un second type de résultat
sans changer d'interface : la conception ci-dessous le prévoit.

**Autres dépendances à confirmer avant rédaction finale du contenu :**

- Les chiffres de preuve sociale (candidats inscrits, entreprises, placements) : ce document les
  laisse en `{{placeholder}}`. **Ne jamais inventer un chiffre**, voir §7.3.
- Les logos d'entreprises partenaires : à n'afficher qu'avec accord écrit. Tant qu'il n'y en a pas,
  la section preuve utilise le format « conformité et méthode » décrit en §2.7, qui ne ment pas.

---

# 1. Stratégie UX

## 1.1 Les trois questions, et où elles trouvent leur réponse

| Question du visiteur | Réponse | Où |
| --- | --- | --- |
| Qu'est-ce que c'est ? | « Travailler en Allemagne, avec un dossier que les employeurs allemands savent lire » | Hero, headline |
| Pourquoi vous faire confiance ? | Méthode explicite + conformité CNDP + gratuité de l'inscription affichée d'entrée | Bandeau sous le Hero, puis §2.7 |
| Que puis-je faire maintenant ? | Saisir son métier → voir ce que ce métier exige en Allemagne → créer son dossier | Recherche du Hero |

## 1.2 Asymétrie assumée : la page appartient au candidat

Cette page n'est pas 50/50. Elle est à **environ 80 % candidat, 20 % recruteur**, et c'est un choix
raisonné :

- Le volume est du côté candidat. Un recruteur allemand acquis apporte des dizaines de candidats
  potentiels ; l'inverse n'est pas vrai.
- Le recruteur n'arrive presque jamais par une page d'accueil : il arrive par prospection
  commerciale, par un salon, par une recommandation. Il a besoin d'une **porte d'entrée nette et
  crédible**, pas de la moitié de la page.
- Une page qui parle également aux deux ne parle clairement à personne. Le candidat marocain qui
  arrive sur un hero « pour les entreprises » se croit sur le mauvais site.

Le recruteur reste servi par : un lien permanent « Espace recruteur » dans le header, une section
entière qui lui est dédiée (§2.8, traitement visuel inversé pour marquer le changement
d'interlocuteur), et un lien dans le footer.

## 1.3 Parcours psychologique du visiteur candidat

Cinq états successifs. Chaque section de la page en traite exactement un — c'est la règle qui
justifie l'ordre des sections, et qui permet de refuser toute section supplémentaire qui ne
correspondrait à aucun état.

| # | État mental | Question intérieure | Section qui répond |
| --- | --- | --- | --- |
| 1 | **Défiance** | « Encore une agence qui va me prendre de l'argent ? » | Hero + bandeau de confiance |
| 2 | **Reconnaissance** | « Est-ce que ça parle de *mon* métier ? » | Recherche + métiers en tension |
| 3 | **Compréhension** | « Concrètement, je fais quoi ? » | Comment ça marche |
| 4 | **Projection** | « Est-ce que ça peut marcher pour quelqu'un comme moi ? » | Ce qui rend un dossier crédible |
| 5 | **Objection finale** | « Ça coûte combien, ça prend combien de temps ? » | FAQ objections |

Le CTA final ne convertit que les visiteurs arrivés à l'état 5. Placer une seule action et la
répéter aux états 1, 3 et 5 est plus efficace que la disperser partout.

## 1.4 CTA

- **CTA principal, unique sur toute la page :** `Créer mon dossier` → `/auth-phone`.
  Un seul libellé, partout, sans variation. Une action répétée trois fois est mémorisée ; trois
  formulations différentes de la même action donnent l'impression de trois actions.
- **CTA secondaires :**
  - `Voir ce que mon métier demande` (Hero) → résultat de recherche métier, sans inscription.
  - `Espace recruteur` (header, section recruteur, footer) → `/auth-phone?role=recruiter`.
  - `J'ai déjà un dossier` (header) → `/auth-phone`.

**Règle :** le candidat doit pouvoir explorer sans créer de compte. Exiger l'inscription pour voir
ce que le métier demande ferait perdre les visiteurs à l'état 1, qui sont la majorité.

## 1.5 Hiérarchie visuelle et ligne de flottaison

Visible immédiatement, sans défiler, sur un mobile de 360 × 640 :

1. Le logo et le sélecteur de langue (le visiteur doit voir l'arabe disponible **avant** de lire
   quoi que ce soit — c'est un signal d'appartenance).
2. La headline, en deux lignes maximum.
3. La sous-headline, une phrase.
4. Le champ de recherche métier, focusable au pouce.
5. Le CTA principal.
6. **Un fragment** du bandeau de confiance qui dépasse — il crée l'amorce de défilement.

Ce qui est explicitement **hors** de la ligne de flottaison : les chiffres, les logos, la vidéo, les
témoignages. Un hero surchargé se lit comme une publicité, et une publicité n'inspire pas confiance
à un candidat qui a déjà croisé des intermédiaires douteux.

---

# 2. Structure de la page

Onze blocs. Trois écarts par rapport au brief, justifiés section par section : la section « Jobs mis
en avant » est remplacée par **Métiers en tension** (§0), la section « Pourquoi nous » générique est
remplacée par **Ce qui rend un dossier crédible** (§2.6), et une section **FAQ / objections** est
ajoutée (§2.9) car sur ce marché l'objection « est-ce une arnaque, combien ça coûte » est le
principal frein à la conversion.

## 2.1 Header

- **Objectif :** orientation permanente + porte recruteur + langue.
- **Contenu :** logo ; liens `Candidats`, `Recruteurs`, `Comment ça marche`, `FAQ` ; sélecteur de
  langue (FR / AR / EN / DE) ; `J'ai déjà un dossier` (lien) ; `Créer mon dossier` (bouton plein).
- **Comportement :** transparent sur le Hero, puis fond opaque + ombre légère au défilement (>80 px),
  transition 200 ms. Sticky. Le bouton CTA n'apparaît dans le header qu'**après** le défilement du
  Hero — avant, il ferait doublon avec celui du Hero.
- **Responsive :** < 1024 px, menu en `Sheet` plein écran ; le sélecteur de langue reste visible
  hors du menu, c'est un élément d'accueil, pas de navigation.
- **Raison UX :** le sélecteur de langue exposé traite l'état 1 (défiance) chez un visiteur
  arabophone : il n'a pas à chercher si le site lui parle.

## 2.2 Hero

Voir la conception détaillée en **§3**.

## 2.3 Bandeau de confiance

- **Objectif :** désamorcer les trois objections qui bloquent l'état 1, en une ligne, avant tout
  argumentaire.
- **Contenu :** trois éléments, icône + libellé court, sur une seule ligne :
  - `Inscription gratuite`
  - `Vos données protégées — déclaration CNDP`
  - `Vous choisissez qui voit votre dossier`
- **Composant :** `TrustStrip` — bande pleine largeur, fond `surface-container`, hauteur 56 px
  desktop / carrousel auto-scroll désactivable en mobile (`prefers-reduced-motion`).
- **Responsive :** mobile, les trois éléments deviennent une grille 1 colonne empilée, sans
  carrousel — un carrousel cacherait deux tiers du message.
- **Raison UX :** ces trois phrases sont les réponses aux trois peurs réelles (payer, être fiché,
  perdre le contrôle). Les placer avant les bénéfices, c'est reconnaître la peur avant de vendre.
- **⚠️ Contenu juridique :** le troisième point n'est vrai que parce que la visibilité du dossier
  dépend du consentement du candidat. Ne pas le reformuler en « vous restez maître de votre
  candidature » sans validation.

## 2.4 Métiers en tension (remplace « Jobs mis en avant »)

- **Objectif :** état 2 — reconnaissance. Le visiteur doit voir **son** métier écrit.
- **Titre :** `Les métiers qui recrutent en Allemagne`
- **Sous-titre :** `Santé, industrie, bâtiment, hôtellerie, informatique — voici ce que chaque métier
  demande vraiment.`
- **Contenu :** grille de 6 à 8 cartes métier. Chaque carte : icône, intitulé du métier, niveau
  d'allemand attendu (badge CEFR), mention de la reconnaissance de diplôme requise ou non, lien
  `Voir le parcours`.
- **Composant :** `TradeCard` + `TradeGrid`. Données depuis `src/content/trades.{lang}.json`
  (versionné, pas de back-end).
- **Comportement :** survol = élévation `shadow-floating` + translation −2 px. Clic = page métier.
- **Responsive :** 4 colonnes ≥ 1280 px, 2 colonnes ≥ 640 px, 1 colonne en dessous. Pas de
  carrousel horizontal : un candidat doit pouvoir balayer la liste entière du regard.
- **Raison UX :** remplace une promesse d'offres qui n'existent pas par une information réelle et
  utile. Un candidat qui lit « Infirmier — B2 exigé, reconnaissance du diplôme nécessaire »
  apprend quelque chose ; c'est ce qui fonde la crédibilité mieux qu'une fausse annonce.

## 2.5 Comment ça marche

- **Objectif :** état 3 — rendre le parcours concret et fini. Le candidat doit voir que ça se
  termine.
- **Titre :** `Quatre étapes, à votre rythme`
- **Contenu :** 4 étapes numérotées.
  1. `Créez votre compte` — un numéro de téléphone, un code reçu par WhatsApp. Pas de mot de passe.
  2. `Ajoutez votre CV` — il est lu automatiquement et remplit votre dossier. Vous corrigez, vous
     validez.
  3. `Prouvez votre niveau de langue` — un enregistrement d'une minute, un niveau CEFR estimé et
     expliqué.
  4. `Rendez votre dossier visible` — les entreprises allemandes vous trouvent par métier, langue et
     disponibilité.
- **Composant :** `StepFlow` — timeline horizontale desktop, verticale mobile, avec trait de liaison
  progressif révélé à l'entrée dans le viewport (`IntersectionObserver`, désactivé si
  `prefers-reduced-motion`).
- **Raison UX :** l'étape 2 est le vrai argument de vente de ce produit et la seule fonctionnalité
  candidat réellement connectée à l'API aujourd'hui. Elle mérite d'être nommée explicitement plutôt
  que noyée dans une liste de bénéfices.

## 2.6 Ce qui rend un dossier crédible (remplace « Pourquoi utiliser la plateforme »)

- **Objectif :** état 4 — projection. Et différenciation réelle vis-à-vis d'un envoi de CV par mail.
- **Titre :** `Un dossier qu'un employeur allemand peut vérifier`
- **Sous-titre :** `Un CV se lit. Un dossier se vérifie. C'est la différence entre une candidature
  ignorée et un entretien.`
- **Contenu :** 4 blocs, chacun un mécanisme concret, pas un adjectif :
  - **Vos diplômes attachés** — chaque document est joint au dossier et consultable par le
    recruteur.
  - **Votre niveau de langue argumenté** — le niveau est affiché avec ce qui le justifie (débit,
    clarté, durée), pas asserté.
  - **Un certificat prime toujours sur une estimation** — si vous fournissez un certificat, il fait
    foi.
  - **Votre disponibilité affichée** — immédiate, sous 1 mois, sous 2 mois : le recruteur filtre
    dessus.
- **Composant :** `FeatureSplit` — alternance texte / visuel d'interface (captures réelles, jamais
  de mockup inventé).
- **Raison UX :** chaque bloc est vérifiable dans le produit. Une page d'accueil qui décrit un
  mécanisme existant survit au premier contact avec l'application ; une page qui vend une sensation
  ne survit pas.

## 2.7 Preuve et conformité

- **Objectif :** état 1 résiduel, pour le visiteur méfiant qui a besoin de chiffres ou de cadre.
- **Titre :** `Ce que nous pouvons prouver`
- **Contenu :** 3 chiffres `{{placeholder}}` **ou**, tant qu'ils n'existent pas, 3 engagements
  vérifiables : traitement des données déclaré CNDP ; contact transmis à un employeur uniquement
  après action explicite de sa part, horodatée ; possibilité de retirer son dossier à tout moment.
- **Composant :** `ProofBand`.
- **Raison UX :** **un chiffre faux découvert coûte plus cher que l'absence de chiffre.** Voir §7.3.

## 2.8 Section recruteurs

- **Objectif :** capter le recruteur allemand sans jamais l'imposer au candidat.
- **Traitement :** rupture visuelle nette — fond sombre (`primary-dark`), typographie plus dense.
  Le changement d'interlocuteur doit être perceptible avant d'être lu.
- **Titre :** `Vous recrutez en Allemagne ?`
- **Sous-titre :** `Cherchez par métier, niveau d'allemand, expérience et disponibilité. Ouvrez le
  dossier complet. Contactez uniquement les profils que vous avez retenus.`
- **Contenu :** 3 arguments (recherche multicritère y compris niveau CEFR minimum ; dossier complet
  avec documents et évaluation ; suivi de pipeline `sauvegardé → contacté → entretien → placé` et
  export CSV) + capture de l'écran de recherche réel.
- **CTA :** `Accéder à l'espace recruteur` (principal ici) ; `Demander une démonstration`
  (secondaire, `mailto:` ou formulaire).
- **Responsive :** capture en dessous du texte en mobile, jamais rognée à l'illisible — préférer
  une capture recadrée sur la barre de filtres.
- **Raison UX :** les trois arguments sont exactement les trois choses que l'espace recruteur fait
  réellement aujourd'hui.

## 2.9 FAQ / objections (section ajoutée)

- **Objectif :** état 5. C'est la section qui débloque la conversion sur ce marché.
- **Titre :** `Les questions que tout le monde se pose`
- **Contenu :** 5 à 7 questions, réponses de 2 phrases maximum. Obligatoires :
  - Est-ce que l'inscription est payante ?
  - Est-ce que vous garantissez un emploi ? — **réponse honnête : non.** Voir §8.2.
  - Qui voit mon dossier ?
  - Que devient mon numéro de téléphone ?
  - Faut-il déjà parler allemand ?
  - Combien de temps ça prend ?
- **Composant :** `AccordionFAQ`, un seul panneau ouvert à la fois, premier ouvert par défaut,
  balisage `FAQPage` JSON-LD.
- **Raison UX :** ces questions se posent de toute façon. Non traitées ici, elles se traitent dans
  la tête du visiteur, contre vous.

## 2.10 CTA final

- **Objectif :** convertir l'état 5.
- **Titre :** `Votre métier vous attend ailleurs.`
- **Sous-titre :** `Créez votre dossier en quelques minutes. C'est gratuit, et vous décidez qui le
  voit.`
- **CTA :** `Créer mon dossier`, taille large, centré. Aucun lien concurrent dans ce bloc.
- **Raison UX :** un bloc mono-action. Tout lien secondaire y réduit mécaniquement le taux de clic.

## 2.11 Footer

- **Contenu :** logo + une phrase de positionnement ; colonnes `Candidats` / `Recruteurs` /
  `À propos` / `Légal` (CGU, politique de confidentialité, mentions CNDP, cookies) ; sélecteur de
  langue ; contact ; réseaux sociaux si les comptes existent réellement.
- **Raison UX :** sur ce type de plateforme, le footer légal complet **est** un signal de confiance.
  Un footer vide se lit comme une page éphémère.

## 2.12 Barre d'action mobile persistante

- Barre fixe en bas, visible dès que le Hero est sorti du viewport : `Créer mon dossier` pleine
  largeur, hauteur 56 px, `safe-area-inset-bottom` respecté.
- Masquée quand la section CTA final est visible (doublon).

---

# 3. Hero

## 3.1 Variantes de headline

| # | Proposition | Évaluation |
| --- | --- | --- |
| A | `Votre carrière n'a pas de frontière` | Belle, mais vide : ne dit ni le métier, ni le pays, ni l'action. Écartée. |
| B | `Trouvez un emploi en Allemagne` | Claire mais **fausse** : la plateforme ne distribue pas d'offres. Écartée pour cause de promesse non tenable. |
| C | `Travaillez en Allemagne. Nous préparons votre dossier avec vous.` | Dit le but et la méthode, assume l'accompagnement. **Retenue.** |
| D | `Le dossier qui vous ouvre l'Allemagne` | Concise et originale, mais « dossier » seul ne parle pas encore au visiteur à la seconde 1. |
| E | `De votre métier au marché allemand` | Élégante, trop abstraite pour un premier contact. Écartée. |

**Retenue : C.** Elle répond aux trois questions en une phrase : *quoi* (travailler en Allemagne),
*comment* (un dossier préparé), *avec qui* (« avec vous » — l'accompagnement, qui est le
positionnement). Elle ne promet pas un emploi, ce qui est à la fois honnête et juridiquement plus
sûr (§8.2).

- **Sous-headline :** `Votre CV, vos diplômes et votre niveau d'allemand réunis dans un dossier que
  les entreprises allemandes savent lire — et qu'elles consultent directement.`
- **Micro-ligne sous le CTA :** `Gratuit · Aucun mot de passe · Vous choisissez qui voit votre
  dossier`

## 3.2 Composition desktop (≥ 1280 px)

Grille 12 colonnes, contenu sur les colonnes 1–7, visuel sur 8–12. Hauteur ~ 78 vh, **jamais
100 vh** : laisser dépasser la section suivante amorce le défilement.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ▣ Logo        Candidats  Recruteurs  Comment ça marche      FR ▾   Connexion │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Travaillez en Allemagne.                    ╭─────────────────────────────╮ │
│  Nous préparons votre dossier                │                             │ │
│  avec vous.                                  │   Visuel : portrait métier  │ │
│                                              │   + carte « dossier »       │ │
│  Votre CV, vos diplômes et votre niveau      │   superposée (niveau B2,    │ │
│  d'allemand réunis dans un dossier que       │   disponibilité, documents) │ │
│  les entreprises allemandes savent lire.     │                             │ │
│                                              ╰─────────────────────────────╯ │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │ 🔍 Quel est votre métier ?          │  Rechercher  →   │                  │
│  └────────────────────────────────────────────────────────┘                  │
│   Suggestions : Infirmier · Électricien · Soudeur · Cuisinier                 │
│                                                                              │
│  [ Créer mon dossier ]   Voir ce que mon métier demande →                    │
│  Gratuit · Aucun mot de passe · Vous choisissez qui voit votre dossier        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  ✓ Inscription gratuite   ✓ Données protégées — CNDP   ✓ Vous contrôlez …    │  ← dépasse
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Composition mobile (360–430 px)

Ordre imposé, une colonne. Le visuel passe **après** le CTA : sur mobile, une image en tête repousse
l'action sous la ligne de flottaison.

```text
┌──────────────────────────────┐
│ ▣ Logo              FR ▾  ☰ │
├──────────────────────────────┤
│ Travaillez en Allemagne.     │
│ Nous préparons votre         │
│ dossier avec vous.           │
│                              │
│ Votre CV, vos diplômes et    │
│ votre niveau d'allemand…     │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔍 Quel est votre métier?│ │
│ └──────────────────────────┘ │
│ Infirmier · Électricien ›    │
│                              │
│ ┌──────────────────────────┐ │
│ │    Créer mon dossier     │ │
│ └──────────────────────────┘ │
│ Gratuit · Sans mot de passe  │
│                              │
│ ✓ Données protégées — CNDP   │  ← amorce
└──────────────────────────────┘
```

## 3.4 Traitement visuel

- **Fond :** dégradé sobre du blanc (`surface-lowest`) vers un vert très désaturé, plus un motif
  géométrique de très faible opacité (≤ 4 %) évoquant une trajectoire — jamais un drapeau, jamais
  une carte du monde, jamais une poignée de main. Ces trois clichés signalent « site
  d'intermédiaire » et détruisent le positionnement premium.
- **Visuel principal :** photographie d'un professionnel **en situation de travail** (blouse,
  atelier, cuisine), regard vers l'objectif, cadrage serré, lumière naturelle. Pas de bureau
  générique, pas de photo de banque d'images souriante devant un ordinateur.
- **Superposition :** une carte « dossier » en verre dépoli reprenant de **vrais** composants
  d'interface (badge CEFR, pastille de disponibilité, vignettes de documents). Elle démontre le
  produit au lieu de le décrire.
- **Animation :** apparition `fade-in` + `slide-up` décalée de 60 ms entre headline, sous-headline,
  recherche, CTA. Rien d'autre ne bouge. Respect strict de `prefers-reduced-motion`.
- **Interdits explicites :** ne pas reproduire l'identité, la grille ou les composants d'Atos/Eviden
  ni d'aucun concurrent. L'inspiration porte sur le **niveau d'exigence** (densité maîtrisée,
  typographie large, respiration), pas sur la forme.

---

# 4. Recherche

## 4.1 Champs

| Champ | Type | Obligatoire | Comportement |
| --- | --- | --- | --- |
| Métier / mot-clé | `combobox` avec autocomplétion | Oui | Suggestions dès 2 caractères, taxonomie locale |
| Secteur | `select` (facultatif, replié) | Non | Santé, Industrie, BTP, Hôtellerie-restauration, IT, Transport |
| Niveau d'allemand actuel | `select` (facultatif, replié) | Non | Aucun / A1-A2 / B1 / B2+ — sert à personnaliser la page métier |
| Bouton | `submit` | — | Libellé `Rechercher`, icône flèche |

Les deux champs facultatifs sont derrière un lien `Recherche avancée` : le Hero doit rester à un
seul champ visible.

> **Note :** aucune recherche par **localisation** n'est proposée, contrairement au brief. Sans
> offres, une ville allemande n'a rien à filtrer, et un champ « Où ? » qui ne change aucun résultat
> détruit la confiance dès la première interaction. Ce champ sera ajouté avec l'option B (§0).

## 4.2 Comportements

- **Focus :** bordure `primary`, halo 3 px `primary/15`, ouverture immédiate du panneau de
  suggestions avec les **6 métiers les plus recherchés** avant toute saisie — un champ vide qui
  propose déjà quelque chose divise le taux d'abandon.
- **Autocomplétion :** correspondance sur l'intitulé *et* les synonymes (`infirmier`, `infirmière`,
  `nurse`, `Krankenpfleger`, `ممرض`), insensible aux accents et à la casse, `debounce` 150 ms,
  terme saisi surligné dans la suggestion. Maximum 8 résultats.
- **Validation :** aucune contrainte bloquante. Soumission à vide = défilement doux vers la section
  Métiers en tension plutôt qu'un message d'erreur — le visiteur cherche à explorer, pas à remplir
  un formulaire.
- **Loading :** bouton en état occupé (libellé conservé + `spinner`), champ non désactivé,
  `aria-busy="true"`. Durée cible < 200 ms puisque la recherche est locale.
- **Erreur :** message sous le champ, `role="alert"` : `Recherche indisponible pour le moment.
  Parcourez les métiers ci-dessous.` + lien d'ancrage. Jamais de page d'erreur.
- **Vide (aucune correspondance) :** `Nous n'avons pas encore de parcours pour « {terme} ».` +
  3 métiers proches + CTA `Créer mon dossier quand même` — un métier absent de la taxonomie ne doit
  jamais devenir un cul-de-sac.

## 4.3 Mobile

- Champ pleine largeur, hauteur **56 px** minimum, `font-size: 16px` (en dessous, iOS zoome).
- Au focus, le panneau de suggestions s'affiche en feuille plein écran avec bouton `Annuler` : c'est
  le seul moyen d'éviter que le clavier virtuel ne recouvre les suggestions.
- `inputmode="search"`, `enterkeyhint="search"`, `autocomplete="off"`, `autocapitalize="words"`.

## 4.4 Accessibilité clavier

- Motif ARIA `combobox` complet : `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, liste `role="listbox"` / options `role="option"`.
- `↓` / `↑` parcourent, `Entrée` sélectionne, `Échap` referme sans vider, `Tab` referme et valide la
  saisie courante.
- Zone de statut `aria-live="polite"` : `8 métiers proposés`.
- Focus visible non supprimé, contraste ≥ 3:1 sur l'anneau de focus.
- Cible tactile ≥ 44 × 44 px pour chaque suggestion.

---

# 5. Système visuel

À construire **sur les jetons existants** (`user-app/tailwind.config.js`) — la page d'accueil doit
ressembler à l'application dans laquelle elle fait entrer.

| Rôle | Jeton | Valeur |
| --- | --- | --- |
| Primaire (marque, CTA) | `primary` | `#1B5E37` |
| Primaire foncé (fond section recruteur) | `primary-dark` | `#004523` |
| Accent (badges, soulignements) | `secondary` / `gold` | `#D4AF37` |
| Alerte / erreur | `error` | `#BA1A1A` |
| Fonds | `surface`, `surface-lowest`, `surface-container` | `#F9F9FF`, `#FFFFFF`, `#EDEEEF` |
| Texte | `onSurface`, `onSurface-variant` | `#191C1D`, `#43474E` |
| Rayons | `card` / `element` | 16 px / 8 px |
| Ombres | `soft`, `floating` | déjà définies |

- **Typographie :** Inter (déjà chargée). Échelle homepage : H1 `clamp(2.25rem, 5vw, 3.75rem)` /
  700 / interligne 1.08 ; H2 `clamp(1.75rem, 3vw, 2.5rem)` / 700 ; corps `1.0625rem` / 400 /
  interligne 1.65 ; longueur de ligne **≤ 68 caractères**.
- **Or : usage strict.** Réservé aux badges de niveau et aux soulignements ponctuels. Un CTA doré
  sur cette palette bascule immédiatement dans le registre « offre commerciale ».
- **Grille :** 12 colonnes, largeur maximale 1280 px, gouttière 24 px, marges latérales 24 px
  mobile / 48 px desktop.
- **Rythme vertical :** 96 px entre sections en desktop, 64 px en mobile. Constant, sans exception :
  c'est ce qui produit la sensation de sérieux.
- **Iconographie :** Material Symbols Outlined, déjà chargée, graisse 300, taille 20–24 px.

---

# 6. Composants à créer

À placer dans `user-app/src/components/home/`.

| Composant | Rôle | Props principales |
| --- | --- | --- |
| `SiteHeader` | En-tête public | `variant: 'transparent' \| 'solid'` |
| `HeroSection` | Hero complet | `headline`, `subheadline`, `media` |
| `TradeSearch` | Recherche métier (combobox) | `trades`, `onSubmit`, `defaultOpenSuggestions` |
| `TrustStrip` | Bandeau de confiance | `items[]` |
| `TradeCard` / `TradeGrid` | Métiers en tension | `trade`, `trades[]` |
| `StepFlow` | Comment ça marche | `steps[]`, `orientation` |
| `FeatureSplit` | Bloc texte + capture | `title`, `body`, `media`, `reverse` |
| `ProofBand` | Chiffres / engagements | `items[]` |
| `RecruiterSection` | Bloc recruteur (fond sombre) | `points[]`, `media` |
| `AccordionFAQ` | FAQ | `items[]` (JSON-LD inclus) |
| `FinalCta` | CTA final | `title`, `subtitle` |
| `SiteFooter` | Pied de page | `columns[]` |
| `MobileCtaBar` | Barre d'action mobile | `hideWhenVisible` (ref de section) |

**Contenu :** aucune chaîne codée en dur dans les composants. Tout dans
`src/content/home.{fr,ar,en,de}.json` et `src/content/trades.{lang}.json`.

**Intégration route :** `/` sert aujourd'hui de redirection selon le rôle. Le comportement cible :
**visiteur non authentifié → page d'accueil publique** ; session existante → redirection selon rôle
via `destinationForRole` (`src/lib/roleDestination.ts`, comportement déjà en place — ne pas le
réécrire). Le middleware ne doit pas protéger `/`.

---

# 7. Qualité

## 7.1 Accessibilité — WCAG 2.1 AA, non négociable

Contraste ≥ 4.5:1 (texte) et ≥ 3:1 (composants) ; navigation clavier complète avec lien
d'évitement ; un seul `h1` et hiérarchie de titres sans saut ; images de contenu avec `alt` utile et
visuels décoratifs en `alt=""` ; formulaires étiquetés ; `prefers-reduced-motion` respecté par
**toutes** les animations ; zoom 200 % sans perte de contenu.

## 7.2 Performance

Budget : LCP < 2,0 s en 4G simulée, CLS < 0,05, INP < 200 ms, JS initial < 150 kB gzip.

- Page rendue côté serveur, composants clients réduits à `TradeSearch`, `AccordionFAQ`,
  `SiteHeader`, `MobileCtaBar`.
- **Remplacer l'import Google Fonts de `globals.css` par `next/font`** : l'`@import` actuel bloque
  le rendu et pèsera directement sur le LCP de cette page.
- Visuel du Hero en AVIF/WebP, `priority`, dimensions explicites, `srcset` 480/768/1280/1920.
- Métiers en tension : données locales, aucun appel réseau au chargement.

## 7.3 Contenu et honnêteté

Trois règles opposables en revue :

1. **Aucun chiffre inventé.** Un `{{placeholder}}` non renseigné se remplace par un engagement
   vérifiable (§2.7), pas par une estimation.
2. **Aucun logo d'entreprise sans accord écrit.**
3. **Aucune promesse d'emploi.** Voir §8.2.

## 7.4 Internationalisation

4 langues déjà en place (`src/lib/i18n.ts`) : FR, AR, EN, DE. L'arabe impose **RTL** — le mécanisme
existe (`LanguageContext` expose `dir`, `Providers` le pose sur `<html>`). Conséquences de
conception : utiliser exclusivement les propriétés logiques (`padding-inline`, `margin-inline-start`),
prévoir le miroitement des flèches de CTA, et tester la longueur allemande (≈ +30 % vs français) sur
tous les boutons — `Créer mon dossier` devient `Bewerbungsmappe erstellen`.

## 7.5 Mesure

Événements minimum : `home_view`, `hero_search_focus`, `hero_search_submit` (+ terme),
`trade_card_click`, `cta_create_dossier_click` (+ emplacement : hero / final / barre mobile),
`recruiter_cta_click`, `faq_open` (+ question), `language_switch`.

---

# 8. Points à trancher avant la mise en ligne

1. **Option A ou B** de la recherche (§0) — bloquant pour le contenu du Hero.
2. **Formulation légale de la promesse.** La plateforme n'apporte pas d'emploi garanti : la
   headline, la FAQ et les CGU doivent dire la même chose. À faire valider.
3. **Modèle payant.** Le bandeau de confiance affiche `Inscription gratuite`. Si l'abonnement
   candidat (100 MAD/an) est mis en place, cette phrase et la FAQ devront être reprises **avant**,
   pas après.
4. **Chiffres de preuve** : disponibles ou non au lancement.
5. **Photographie** : shooting réel ou banque d'images. Le positionnement premium supporte mal la
   banque d'images générique.

---

# 9. Livraison

| Lot | Contenu | Prêt à démarrer |
| --- | --- | --- |
| **1** | Header, Hero, `TradeSearch` (taxonomie locale), `TrustStrip`, CTA final, Footer, barre mobile, FR uniquement | Oui |
| **2** | Métiers en tension, Comment ça marche, Dossier crédible, FAQ, section recruteur | Oui |
| **3** | Preuve chiffrée, 3 langues restantes + RTL, animations d'entrée, mesure analytique | Après §8 |

**Critères d'acceptation du lot 1**

- Un visiteur sur mobile 360 px voit headline, sous-headline, recherche et CTA sans défiler.
- La recherche fonctionne entièrement au clavier et est annoncée par un lecteur d'écran.
- Aucune chaîne de caractères codée en dur dans un composant.
- Lighthouse mobile : performance ≥ 90, accessibilité = 100.
- Aucun chiffre, logo ou témoignage non vérifié présent sur la page.
