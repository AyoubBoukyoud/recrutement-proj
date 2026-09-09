import { RecruiterShell } from '@/components/RecruiterShell';

/**
 * Coquille de l'espace recruteur — portée depuis le style visuel de la
 * maquette `/amud/entreprise` (RecruiterShell : sidebar + header, thème et
 * langue), branchée sur les vraies données. Remplace l'ancienne barre
 * d'onglets, où chaque page posait elle-même sa propre `TopBar`.
 */
export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-amud-background outline-none">
      <RecruiterShell>{children}</RecruiterShell>
    </div>
  );
}
