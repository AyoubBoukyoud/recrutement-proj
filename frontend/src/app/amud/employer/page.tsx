import { redirect } from 'next/navigation';

/**
 * `/amud/employer` était le tableau de bord employeur d'origine (1 page,
 * `EmployerShell`) — remplacé par l'espace entreprise complet
 * `/amud/entreprise/*` (`CompanyShell`, ~17 pages). Redirection plutôt que
 * suppression pour ne pas casser un lien externe déjà partagé.
 */
export default function AmudEmployerRedirect() {
  redirect('/amud/entreprise/dashboard');
}
