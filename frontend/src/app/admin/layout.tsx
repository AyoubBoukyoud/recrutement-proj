import { AdminShell } from '@/components/AdminShell';

/**
 * Coquille de la console d'administration — portée depuis le style visuel de
 * la maquette `/amud/admin` (AdminShell : sidebar + header, thème et langue),
 * branchée sur les vraies données. Remplace l'ancienne barre d'onglets +
 * `TopBar`, qui était la seule coquille ops sans bascule de thème/langue ni
 * moyen de se déconnecter autrement qu'en vidant le stockage du navigateur.
 * La liste de navigation (dont « Parrainages ») vit maintenant dans
 * `AdminShell`.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-amud-background outline-none">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
