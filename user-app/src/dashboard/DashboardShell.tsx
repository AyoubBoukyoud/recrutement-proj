'use client';

// Racine visuelle des écrans portés depuis web-admin (recruteur, admin,
// agent) : leurs styles vivent sous .opsdash pour ne jamais déborder sur les
// classes Tailwind de l'espace candidat. Voir index.css pour le pourquoi.

import './index.css';
import './components/ui.css';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="opsdash">{children}</div>;
}
