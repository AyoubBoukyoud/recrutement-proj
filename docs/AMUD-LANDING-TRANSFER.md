# Page publique AMUD Skills — intégration Next.js

Projet : `C:\Users\Yacine\Desktop\Amud Skills\recrutement-proj`.

La page est intégrée à l'application Next.js existante dans `frontend`, avec son authentification et son sélecteur de langue. Il n'est pas nécessaire de lancer un deuxième site.

## Ouvrir la page

```powershell
cd 'C:\Users\Yacine\Desktop\Amud Skills\recrutement-proj\frontend'
npm run dev
```

- Accueil : `http://localhost:3000/accueil-public` ; `/` redirige vers cette page.
- Présentation du CRM : `http://localhost:3000/crm-centre-formation`.
- Français, arabe, allemand et anglais : sélecteur de langue intégré ; direction RTL en arabe.
- Les boutons candidat et entreprise utilisent l'authentification locale `/auth-phone`.

## Fichiers à modifier dans Codex

- `frontend/src/components/landing/` : sections, traductions, animations, vidéos et styles.
- `frontend/src/components/landing/landing.css` : styles isolés avec `.amud-site` ; arrière-plans unis de la dernière version.
- `frontend/src/components/home/PublicHome.tsx` : liaison avec la langue de l'application.
- `frontend/src/app/accueil-public/page.tsx` et `frontend/src/app/crm-centre-formation/page.tsx` : routes publiques.
- `frontend/public/landing-assets/` : médias de la page, dont les démonstrations vidéo dans les quatre langues.

## Vérification du transfert — 13 septembre 2026

La comparaison avec la source `amud-skills` du projet ChatGPT confirme les dix composants, les styles adaptés et les 47 médias nécessaires. Les différences conservées concernent les routes locales, la sélection de langue, l'isolation des styles et les icônes compatibles avec la version installée de Lucide. Le contrôle TypeScript de l'application entière réussit (`node node_modules/typescript/bin/tsc --noEmit --incremental false`).

Les démonstrations vidéo sont des interfaces illustratives reconstruites à partir des écrans fournis, et les photographies de métiers générées sont des illustrations. Elles ne constituent pas des témoignages ni une preuve de fonctionnement du backend.
