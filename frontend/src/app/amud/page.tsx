import Link from 'next/link';
import { DemoBanner } from '@/components/amud/DemoBanner';

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
    href: '/amud/employer',
    icon: 'business_center',
    titre: 'Espace Employeur',
    description: 'Suivi du pipeline de recrutement, derniers candidats, matchings récents.',
  },
  {
    href: '/amud/candidate',
    icon: 'person',
    titre: 'Espace Candidat',
    description: 'Suivi des candidatures, complétion du profil, recommandations d’offres.',
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

/** Portail d'entrée du module `/amud` — relie les 4 espaces + le mini-site marketing portés depuis les maquettes Amud Skills. */
export default function AmudHubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-amud-background px-6 py-16 text-amud-on-surface">
      <div className="mb-8 w-full max-w-4xl">
        <DemoBanner />
      </div>
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-amud-primary-container shadow-sm">
          <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-cover" />
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
    </div>
  );
}
