# Amud Skills — mise à jour UI/UX

Implémentation réalisée les 11–12 octobre 2026 dans le projet actuel :
`C:/Users/Yacine/Desktop/Amud Skills/recrutement-proj/frontend`.

## Résultat

- Footer noir (#141519), quatre colonnes et liens sociaux/légaux conservés. Jusqu’à 1100 px, quatre disclosures natifs fermés au chargement, accessibles au clavier, chevrons animés, ouverture fluide dans les navigateurs compatibles et respect de la réduction des animations. Au-delà, colonnes visibles.
- Les cinq pages liées par le footer ont un nouveau hero photographique, repères, missions, profil, compétences, conditions, parcours, FAQ et CTA. Le contenu utile existant, les métadonnées, URL canoniques, données structurées et liens sont conservés.
- Startup : hero, illustration des objectifs, six cartes de services liés aux pages existantes, avantages, processus en cinq étapes et CTA. Date de création et portraits/liens des fondateurs conservés. Aucun témoignage, logo client ou résultat de recrutement inventé.
- Système visuel partagé avec rouge #ba303e, fonds ivoire, encre et accents or ; dimensions réservées aux images, chargement différé hors hero, WebP responsive et focus visibles.

## Pages

- http://localhost:3011/chauffeur-allemagne
- http://localhost:3011/logistique-allemagne
- http://localhost:3011/hotellerie-allemagne
- http://localhost:3011/sante-allemagne
- http://localhost:3011/btp-allemagne
- http://localhost:3011/notre-entreprise/startup
- Footer partagé également vérifié sur /accueil-public.

## Fichiers modifiés

| Fichier | Changement |
| --- | --- |
| src/components/reference-landing/PublicSiteChrome.tsx | Nouveau footer, conservation de tous les anciens liens. |
| src/components/reference-landing/StartupProfilePage.tsx | Intégration du hero, des objectifs illustrés et des nouvelles sections ; maintien du contenu et des fondateurs. |
| src/components/seo/SeoLandingPage.tsx | Aiguillage des cinq secteurs vers leur nouveau template et ajout de la navigation publique partagée. Les autres guides conservent leur template. |

## Nouveaux fichiers

| Fichier | Rôle |
| --- | --- |
| src/components/reference-landing/AccordionFooterColumn.tsx | AccordionFooterColumn accessible, présentation mobile/tablette et desktop. |
| src/components/reference-landing/SectorComponents.tsx | SectorHero, ImageFeatureSection, CTASection, StatCard, StepCard et EditorialImage. |
| src/components/reference-landing/StartupSections.tsx | Services, visuel des objectifs, avantages, processus et CTA, en FR/AR/DE/EN. |
| src/components/reference-landing/premium-footer.css | Styles et transitions du footer. |
| src/components/reference-landing/sector-design.css | Design commun responsive, RTL et thème sombre. |
| src/components/seo/SectorLandingPage.tsx | Contenu spécifique aux cinq métiers et template SEO partagé. |
| scripts/prepare-sector-assets.cjs | Optimisation reproductible des images avec sharp. |
| scripts/verify-sector-refresh.cjs | Contrôles navigateur, captures et liens ; Playwright installé ou fourni via AMUD_PLAYWRIGHT_PATH. |
| docs/UI-REFRESH-IMAGE-PROMPTS.md | Prompts complets, provenance et chemins des images. |

## Assets

Sept visuels finaux : chauffeur, logistique, hotellerie, sante, btp, startup et growth.

21 fichiers WebP dans `public/landing-assets/sectors/`, chacun en 640, 960 et 1440 px. Total : 1 532 300 octets (~1,46 Mio). Le plus grand fichier fait 137 300 octets. Les sept originaux PNG sont conservés dans `artifacts/ui-refresh/originals/`. Les illustrations des services et les portraits existants sont réutilisés.

Génération : outil ImageGen intégré. Les visuels générés sont identifiés comme illustrations dans les pages ; ils ne sont pas présentés comme de vrais employés ou partenaires.

## Vérification

- TypeScript : `tsc --noEmit --incremental false` réussi après les modifications de composants.
- Six pages × quatre largeurs (320, 390, 820, 1440 px) : 24 cas réussis, HTTP 200, un seul H1, aucun débordement horizontal, aucune image cassée et aucun alt manquant.
- Footer : ouverture/fermeture par Entrée/Espace à 390, 820 et 1024 px ; colonnes visibles à 1440 px ; sections fermées par défaut.
- 31 liens internes contrôlés, aucun statut d’erreur. Les liens sociaux externes sont conservés ; leur disponibilité externe n’est pas certifiée par ce contrôle.
- Aucun événement JavaScript pageerror dans le parcours contrôlé.
- Startup en arabe, allemand et anglais : aucune rupture de mise en page. Contrôles supplémentaires en RTL/tablette/desktop et en thème sombre : aucun débordement du contenu ou des textes.
- Contrastes calculés : blanc sur rouge 5,87:1 ; texte secondaire clair 6,80:1 ; texte du footer 10,37:1 ; texte secondaire sombre 8,22:1.
- Captures et rapports : `artifacts/ui-refresh/verification.json`, `final-layout-checks.json` et PNG du même dossier.
- `git diff --check` réussi.

## Portée et état

Les guides SEO sectoriels restent en français, comme avant ; leur contenu est explicitement balisé `lang="fr" dir="ltr"` pour rester correct lorsque la navigation utilise l’arabe. Le footer et Startup conservent leurs quatre langues. Les autres fiches /metiers/[slug] ne sont pas les destinations des cinq liens sectoriels du footer et n’ont pas été réécrites.

La mise à jour est dans le projet local, avec aperçu sur le port 3011. Aucun déploiement sur amudskills.com n’a été effectué, aucun changement poussé vers un dépôt distant, et aucun build de production n’a été remplacé. Le serveur existant sur le port 3000 a été laissé en place. Le contrôle visuel porte sur Chromium ; il ne constitue pas une mesure Lighthouse de production des LCP/CLS.

Les fichiers synchronisés sous sources/ et les modifications préexistantes (notamment next-env.d.ts) n’ont pas été volontairement remplacés.
