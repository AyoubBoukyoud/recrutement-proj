import { notFound } from 'next/navigation';
import Link from 'next/link';

/**
 * Page de navigation interne, jamais un point d'entrée produit. Suit la
 * même logique que le durcissement de `middleware.ts` (`SHOW_PROTOTYPES`) :
 * un `next dev` local reste toujours ouvert, mais un build de production ne
 * doit exposer ce sitemap que si l'opt-in explicite est activé.
 */
const DEV_PAGE_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_PROTOTYPES === '1';

type Groupe = { titre: string; note?: string; items: { href: string; label: string }[] };

const GROUPES: Groupe[] = [
  {
    titre: 'Public / avant connexion',
    items: [
      { href: '/accueil-public', label: 'Accueil public' },
      { href: '/employeurs', label: 'Employeurs' },
      { href: '/metiers/infirmier', label: 'Fiche métier (exemple : infirmier)' },
      { href: '/language', label: 'Choix de la langue' },
      { href: '/splash', label: 'Splash screen' },
      { href: '/offline', label: 'Page hors-ligne' },
    ],
  },
  {
    titre: 'Onboarding / authentification',
    items: [
      { href: '/auth-phone', label: 'Connexion par téléphone' },
      { href: '/otp', label: 'Vérification OTP' },
      { href: '/profile-creation', label: 'Création de profil (5 étapes)' },
    ],
  },
  {
    titre: 'Espace candidat',
    note: 'Nécessite une session candidat — redirige vers /auth-phone sinon.',
    items: [
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/offres', label: "Offres d'emploi" },
      { href: '/candidatures', label: 'Mes candidatures' },
      { href: '/favoris', label: 'Favoris' },
      { href: '/documents', label: 'Documents & extraction CV' },
      { href: '/profil', label: 'Profil public' },
      { href: '/verification-identite', label: 'Vérification d’identité' },
      { href: '/video', label: 'Vidéo de présentation' },
      { href: '/test-langue', label: 'Test de langue IA' },
      { href: '/quiz-metier', label: 'Quiz métier' },
      { href: '/matching-preferences', label: 'Préférences de matching' },
      { href: '/salaire', label: 'Simulateur de salaire' },
      { href: '/lecon-jour', label: 'Leçon du jour' },
      { href: '/visibilite', label: 'Score de visibilité' },
      { href: '/parrainage', label: 'Programme de parrainage' },
      { href: '/taches', label: 'Tâches' },
      { href: '/reclamation', label: 'Réclamation' },
      { href: '/notifications', label: 'Notifications' },
      { href: '/compte', label: 'Compte' },
      { href: '/faq', label: 'FAQ / Centre d’aide' },
    ],
  },
  {
    titre: 'Espace recruteur',
    note: 'Nécessite une session employeur — redirige vers /auth-phone sinon.',
    items: [
      { href: '/recruiter', label: 'Recherche de candidats' },
      { href: '/recruiter/candidatures', label: 'Candidatures reçues' },
      { href: '/recruiter/offres', label: 'Mes offres' },
      { href: '/recruiter/notifications', label: 'Notifications' },
    ],
  },
  {
    titre: 'Back-office admin',
    note: 'Pages autonomes (le rôle admin n’a plus de tableau de bord dédié — voir roleDestination.ts).',
    items: [
      { href: '/admin/candidatures', label: 'Candidatures' },
      { href: '/admin/offres', label: 'Offres' },
      { href: '/admin/notifications', label: 'Notifications' },
      { href: '/admin/journal', label: 'Journal système' },
    ],
  },
  {
    titre: 'Espace agent commercial',
    note: 'Nécessite une session agent — redirige vers /auth-phone sinon.',
    items: [{ href: '/agent', label: 'Tableau de bord agent' }],
  },
  {
    titre: 'Maquette — Espace candidat (/amud/candidat)',
    note: 'Prototype localStorage sans backend, distinct du vrai espace candidat ci-dessus. Aucune redirection : la maquette se charge normalement.',
    items: [
      { href: '/amud/candidat', label: "Accueil / tableau de bord" },
      { href: '/amud/candidat/inscription', label: 'Inscription' },
      { href: '/amud/candidat/onboarding', label: 'Onboarding' },
      { href: '/amud/candidat/parcours', label: 'Mon parcours' },
      { href: '/amud/candidat/profil', label: 'Profil' },
      { href: '/amud/candidat/profil/allemagne', label: 'Profil Allemagne' },
      { href: '/amud/candidat/documents', label: 'Documents' },
      { href: '/amud/candidat/opportunites', label: 'Opportunités' },
      { href: '/amud/candidat/candidatures', label: 'Mes candidatures' },
      { href: '/amud/candidat/entretiens', label: 'Mes entretiens' },
      { href: '/amud/candidat/messages', label: 'Messages' },
      { href: '/amud/candidat/favoris', label: 'Favoris' },
      { href: '/amud/candidat/notifications', label: 'Notifications' },
      { href: '/amud/candidat/parametres', label: 'Paramètres' },
    ],
  },
  {
    titre: 'Maquette — Espace étudiant (/amud/student)',
    note: 'Prototype localStorage sans backend. Aucune redirection : la maquette se charge normalement.',
    items: [
      { href: '/amud/student/dashboard', label: 'Tableau de bord' },
      { href: '/amud/student/formation', label: 'Ma formation' },
      { href: '/amud/student/group', label: 'Mon groupe' },
      { href: '/amud/student/planning', label: 'Planning' },
      { href: '/amud/student/presences', label: 'Présences' },
      { href: '/amud/student/quiz', label: 'Quiz' },
      { href: '/amud/student/results', label: 'Résultats' },
      { href: '/amud/student/payments', label: 'Paiements' },
      { href: '/amud/student/teachers', label: 'Mes enseignants' },
      { href: '/amud/student/notifications', label: 'Notifications' },
      { href: '/amud/student/profile', label: 'Profil' },
      { href: '/amud/student/settings', label: 'Paramètres' },
    ],
  },
  {
    titre: 'Maquette — Espace enseignant (/amud/teacher)',
    note: 'Prototype localStorage sans backend. Aucune redirection : la maquette se charge normalement.',
    items: [
      { href: '/amud/teacher/dashboard', label: 'Tableau de bord' },
      { href: '/amud/teacher/groups', label: 'Mes groupes' },
      { href: '/amud/teacher/students', label: 'Mes étudiants' },
      { href: '/amud/teacher/planning', label: 'Planning' },
      { href: '/amud/teacher/attendance', label: 'Présences' },
      { href: '/amud/teacher/quizzes', label: 'Quiz' },
      { href: '/amud/teacher/hours', label: 'Mes heures' },
      { href: '/amud/teacher/remuneration', label: 'Rémunération' },
      { href: '/amud/teacher/resources', label: 'Ressources pédagogiques' },
      { href: '/amud/teacher/notifications', label: 'Notifications' },
      { href: '/amud/teacher/profile', label: 'Profil' },
      { href: '/amud/teacher/settings', label: 'Paramètres' },
    ],
  },
  {
    titre: 'Maquette — Espace centre de formation (/amud/centre)',
    note: 'Prototype localStorage sans backend. Redirigée vers /accueil-public sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1.',
    items: [
      { href: '/amud/centre/dashboard', label: 'Tableau de bord' },
      { href: '/amud/centre/etudiants', label: 'Étudiants' },
      { href: '/amud/centre/enseignants', label: 'Enseignants' },
      { href: '/amud/centre/formations', label: 'Formations' },
      { href: '/amud/centre/groupes', label: 'Groupes' },
      { href: '/amud/centre/planning', label: 'Planning' },
      { href: '/amud/centre/presences', label: 'Présences (saisie manuelle + séances QR)' },
      { href: '/amud/centre/paiements-etudiants', label: 'Paiements étudiants' },
      { href: '/amud/centre/remuneration', label: 'Rémunération enseignants' },
      { href: '/amud/centre/tarifs', label: 'Tarifs' },
      { href: '/amud/centre/leads', label: 'Leads' },
      { href: '/amud/centre/statistiques', label: 'Statistiques' },
      { href: '/amud/centre/site', label: 'Site public — contenu' },
      { href: '/amud/centre/site/themes', label: 'Site public — thèmes' },
      { href: '/amud/centre/profil', label: 'Profil du centre' },
      { href: '/amud/centre/parametres', label: 'Paramètres — équipe' },
      { href: '/amud/centres/deutsch-akademie-casablanca', label: 'Site public du centre (exemple)' },
    ],
  },
  {
    titre: 'Maquette — Admin Amud Skills (/amud/admin)',
    note: 'Prototype localStorage sans backend. Redirigée vers / (donc /accueil-public) sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1.',
    items: [
      { href: '/amud/admin', label: 'Accueil / tableau de bord' },
      { href: '/amud/admin/centres', label: 'Centres' },
      { href: '/amud/admin/commerciaux', label: 'Commerciaux' },
      { href: '/amud/admin/candidats', label: 'Candidats' },
      { href: '/amud/admin/candidatures', label: 'Candidatures' },
      { href: '/amud/admin/entreprises', label: 'Entreprises' },
      { href: '/amud/admin/recruteurs', label: 'Recruteurs' },
      { href: '/amud/admin/offres', label: 'Offres' },
      { href: '/amud/admin/objectifs', label: 'Objectifs' },
      { href: '/amud/admin/activites', label: 'Activités' },
      { href: '/amud/admin/journal-activite', label: 'Journal d’activité' },
      { href: '/amud/admin/roles-permissions', label: 'Rôles & permissions' },
      { href: '/amud/admin/utilisateurs', label: 'Utilisateurs' },
      { href: '/amud/admin/analytics', label: 'Analytics' },
      { href: '/amud/admin/parametres', label: 'Paramètres' },
    ],
  },
  {
    titre: 'Maquette — Commercial (/amud/commercial)',
    note: 'Prototype localStorage sans backend. Redirigée vers /agent sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1.',
    items: [
      { href: '/amud/commercial', label: 'Accueil / tableau de bord' },
      { href: '/amud/commercial/centres', label: 'Centres partenaires' },
      { href: '/amud/commercial/candidats', label: 'Candidats' },
      { href: '/amud/commercial/entreprises', label: 'Entreprises' },
      { href: '/amud/commercial/contacts', label: 'Contacts' },
      { href: '/amud/commercial/rendez-vous', label: 'Rendez-vous' },
      { href: '/amud/commercial/taches', label: 'Tâches' },
      { href: '/amud/commercial/activites', label: 'Activités' },
      { href: '/amud/commercial/performance', label: 'Performance' },
      { href: '/amud/commercial/notifications', label: 'Notifications' },
      { href: '/amud/commercial/profile', label: 'Profil' },
    ],
  },
  {
    titre: 'Maquette — Espace entreprise (/amud/entreprise)',
    note: 'Prototype localStorage sans backend. Redirigée vers /recruiter sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1. « Recherche de candidats » ci-dessus (espace recruteur réel) est distinct de ce prototype.',
    items: [
      { href: '/amud/entreprise/dashboard', label: 'Tableau de bord' },
      { href: '/amud/entreprise/offres', label: 'Offres' },
      { href: '/amud/entreprise/offres/nouveau', label: 'Nouvelle offre' },
      { href: '/amud/entreprise/candidats', label: 'Candidats' },
      { href: '/amud/entreprise/candidatures', label: 'Candidatures' },
      { href: '/amud/entreprise/entretiens', label: 'Entretiens' },
      { href: '/amud/entreprise/favoris', label: 'Favoris' },
      { href: '/amud/entreprise/messages', label: 'Messages' },
      { href: '/amud/entreprise/equipe', label: 'Équipe' },
      { href: '/amud/entreprise/statistiques', label: 'Statistiques' },
      { href: '/amud/entreprise/notifications', label: 'Notifications' },
      { href: '/amud/entreprise/profil', label: 'Profil' },
      { href: '/amud/entreprise/parametres', label: 'Paramètres' },
      { href: '/amud/employer', label: 'Ancienne maquette 1 page (remplacée par les pages ci-dessus)' },
    ],
  },
  {
    titre: 'Maquette — Marketing (/amud/marketing)',
    note: 'Maquette figée, copie historique de l’ancien accueil. Redirigée vers /accueil-public ou /employeurs sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1.',
    items: [
      { href: '/amud/marketing/home', label: 'Accueil' },
      { href: '/amud/marketing/employers', label: 'Employeurs' },
      { href: '/amud/marketing/product', label: 'Produit' },
    ],
  },
];

export default function DevPage() {
  if (!DEV_PAGE_ENABLED) notFound();

  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-on-surface">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-on-surface">Espaces — navigation dev</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Sitemap interne, non indexé, uniquement pour la navigation en développement. Accessible ici :{' '}
          <code>/dev</code>.
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          <Link href="/amud" className="text-primary hover:underline">
            /amud
          </Link>{' '}
          — sélecteur d’espace des maquettes (mêmes liens que « Changer d’espace » dans chaque coquille). Redirigé vers /accueil-public sauf si NEXT_PUBLIC_ENABLE_PROTOTYPES=1.
        </p>

        <div className="mt-10 space-y-4">
          {GROUPES.map((groupe) => (
            <section key={groupe.titre} className="rounded-card border border-outline-variant bg-surface-lowest p-6">
              <h2 className="text-lg font-semibold text-on-surface">{groupe.titre}</h2>
              {groupe.note ? <p className="mt-1 text-xs text-on-surface-variant">{groupe.note}</p> : null}
              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {groupe.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-primary hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
