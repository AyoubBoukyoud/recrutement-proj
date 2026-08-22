import Link from 'next/link';

const ESPACES = [
  {
    href: '/amud/admin',
    icon: 'admin_panel_settings',
    titre: 'Administration',
    description: 'Utilisateurs, entreprises, offres, candidatures, commerciaux, rôles & permissions, journal système.',
  },
  {
    href: '/amud/commercial',
    icon: 'support_agent',
    titre: 'Espace Commercial',
    description: 'Tableau de bord quotidien, calendrier de rendez-vous, portefeuille de contacts.',
  },
  {
    href: '/amud/entreprise/dashboard',
    icon: 'business_center',
    titre: 'Espace Entreprise',
    description: 'Profil entreprise, offres, candidatures, candidats, entretiens, messages, statistiques — l’espace recruteur complet.',
  },
];

const MARKETING = [
  {
    href: '/amud/marketing/home',
    icon: 'home',
    titre: 'Accueil',
    description: 'Page publique générique : « Le pont professionnel » entre talent marocain et besoins allemands.',
  },
  {
    href: '/amud/marketing/employers',
    icon: 'verified_user',
    titre: 'Employeurs',
    description: 'Confiance & conformité : coût de la vacance de poste, standards RGPD/CECR, calculateur de ROI.',
  },
  {
    href: '/amud/marketing/product',
    icon: 'bolt',
    titre: 'Produit',
    description: 'Matching en temps réel : pitch vidéo de 45 secondes, OCR intelligent, suivi en direct.',
  },
];

/**
 * Raccourcis vers le vrai parcours d'authentification (hors maquettes
 * `/amud/*`) — mêmes cibles que le menu dev de `/auth-phone`
 * (`DEV_CANDIDATE_OTP_LINK`, `DEV_REAL_APP_LINKS.public`), dupliquées ici en
 * lecture seule pour ne pas toucher à l'état interactif de cette page.
 */
const ACCES_DIRECT = [
  {
    href: '/accueil-public',
    icon: 'public',
    titre: 'Site public (sans connexion)',
    description: 'La vraie page d’accueil de l’app (marketing + produit), accessible sans authentification.',
  },
  {
    href: '/auth-phone',
    icon: 'smartphone',
    titre: 'Authentification par téléphone',
    description: 'Écran de connexion réel : saisie du numéro, puis code envoyé par OTP.',
  },
  {
    href: '/otp?phone=%2B212600000001&intent=job_seeker',
    icon: 'password',
    titre: 'Candidat — écran OTP → /dashboard',
    description: 'Numéro de démo pré-rempli ; code 000000 pour atteindre le vrai tableau de bord candidat.',
  },
];

type EspaceReelGroupe = { titre: string; items: { href: string; label: string }[] };

/**
 * Toutes les pages réelles de l'app (hors maquettes `/amud`), groupées comme
 * dans le menu dev de `/auth-phone` (`DEV_REAL_APP_LINKS`). Simples liens :
 * les groupes protégés (candidat/admin/agent/recruteur) renvoient vers
 * `/auth-phone` sans session, via `middleware.ts`.
 */
const ESPACES_REELS: EspaceReelGroupe[] = [
  {
    titre: 'Public / avant connexion',
    items: [
      { href: '/employeurs', label: 'Employeurs' },
      { href: '/language', label: 'Choix de la langue' },
      { href: '/splash', label: 'Splash screen' },
      { href: '/profile-creation', label: 'Création de profil (5 étapes)' },
      { href: '/metiers/infirmier', label: 'Fiche métier (exemple : infirmier)' },
      { href: '/offline', label: 'Page hors-ligne' },
    ],
  },
  {
    titre: 'Espace candidat (réel)',
    items: [
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/offres', label: "Offres d'emploi" },
      { href: '/documents', label: 'Documents & extraction CV' },
      { href: '/profil', label: 'Profil public' },
      { href: '/reclamation', label: 'Réclamation' },
      { href: '/faq', label: 'FAQ / Centre d’aide' },
      { href: '/matching-preferences', label: 'Préférences de matching' },
      { href: '/quiz-metier', label: 'Quiz métier' },
      { href: '/simulateur-salaire', label: 'Simulateur de salaire' },
      { href: '/salaire', label: 'Simuler mon salaire' },
      { href: '/parrainage', label: 'Programme de parrainage' },
      { href: '/verification-identite', label: 'Vérification d’identité' },
      { href: '/video', label: 'Vidéo de présentation' },
      { href: '/visibilite', label: 'Score de visibilité' },
      { href: '/test-langue', label: 'Test de langue IA' },
      { href: '/cours-allemand', label: 'Cours d’allemand' },
      { href: '/lecon-jour', label: 'Leçon du jour' },
    ],
  },
  {
    titre: 'Back-office admin (réel)',
    items: [
      { href: '/admin/apercu', label: 'Aperçu (métriques)' },
      { href: '/admin/candidats', label: 'Candidats' },
      { href: '/admin/recruteurs', label: 'Recruteurs' },
      { href: '/admin/parrainage', label: 'Commissions de parrainage' },
      { href: '/admin/reclamations', label: 'Réclamations' },
      { href: '/admin/stage', label: 'Catalogue du stage' },
      { href: '/admin/utilisateurs', label: 'Utilisateurs' },
    ],
  },
];

/**
 * Portail d'entrée du module `/amud`, promu page d'accueil de l'app
 * (`/` y redirige, cf. `app/page.tsx`) — relie les espaces maquette restants
 * (admin, commercial, employeur), le mini-site marketing figé, le vrai
 * parcours d'authentification et toutes les pages réelles de l'application.
 */
export default function AmudHubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-amud-background px-6 py-16 text-amud-on-surface">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-transparent">
          <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-headline-lg text-amud-on-surface">Amud Skills</h1>
        <p className="mt-2 max-w-md text-body-md text-amud-on-surface-variant">Choisissez l&apos;espace que vous souhaitez ouvrir.</p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-lg sm:grid-cols-2">
        {ESPACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="group flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm transition-all hover:-translate-y-1 hover:border-amud-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amud-primary-container text-white transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined">{e.icon}</span>
            </div>
            <div>
              <h2 className="text-title-lg text-amud-on-surface">{e.titre}</h2>
              <p className="mt-1 text-body-md text-amud-on-surface-variant">{e.description}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-label-md font-medium text-amud-primary">
              Ouvrir
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16 w-full max-w-4xl">
        <h2 className="mb-4 text-center text-title-lg text-amud-on-surface">Site public (marketing)</h2>
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
          {MARKETING.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm transition-all hover:-translate-y-1 hover:border-amud-primary hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amud-surface-container-high text-amud-primary transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <div>
                <h3 className="text-body-md font-bold text-amud-on-surface">{m.titre}</h3>
                <p className="mt-1 text-label-sm text-amud-on-surface-variant">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 w-full max-w-4xl">
        <h2 className="mb-4 text-center text-title-lg text-amud-on-surface">Accès direct (application réelle)</h2>
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
          {ACCES_DIRECT.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm transition-all hover:-translate-y-1 hover:border-amud-primary hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amud-surface-container-high text-amud-primary transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined">{a.icon}</span>
              </div>
              <div>
                <h3 className="text-body-md font-bold text-amud-on-surface">{a.titre}</h3>
                <p className="mt-1 text-label-sm text-amud-on-surface-variant">{a.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 w-full max-w-4xl">
        <h2 className="mb-4 text-center text-title-lg text-amud-on-surface">Toutes les pages réelles de l&apos;application</h2>
        <p className="mb-4 text-center text-label-sm text-amud-on-surface-variant">
          Les espaces candidat / admin / agent / recruteur nécessitent une session (redirection vers <code>/auth-phone</code> sinon).
        </p>
        <div className="space-y-3">
          {ESPACES_REELS.map((groupe) => (
            <details key={groupe.titre} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <summary className="cursor-pointer text-title-lg text-amud-on-surface">{groupe.titre}</summary>
              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {groupe.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-body-md text-amud-primary hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
