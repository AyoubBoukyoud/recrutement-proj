import RecruiterSearch from '@/components/RecruiterSearch';

/** Route `/recruiter` — recherche de candidats et sélection, portées depuis
 *  web-admin. Onglets « Recherche » / « Ma sélection » gérés en interne par
 *  le composant, sans URL distincte. */
export default function RecruiterPage() {
  return <RecruiterSearch />;
}
