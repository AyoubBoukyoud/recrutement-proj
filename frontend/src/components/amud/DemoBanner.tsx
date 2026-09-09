/**
 * Bandeau permanent sur chaque page de `/amud/*` : ce module est une
 * maquette portée depuis les gabarits Amud Skills, sans backend derrière —
 * les données sont des tableaux seedés + `localStorage`, jamais un appel
 * réseau. Sans ce rappel, un visiteur externe (ou un testeur pressé) peut
 * facilement le confondre avec le produit réel, surtout dans les pages qui
 * ressemblent le plus à une console fonctionnelle (voir `/amud/admin/*`).
 */
export function DemoBanner() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16 }}>
        science
      </span>
      <p className="leading-relaxed">
        <span className="font-bold">Maquette de démonstration</span> — données fictives, rien n&apos;est
        envoyé à un serveur. L&apos;espace réel équivalent est accessible via la connexion habituelle.
      </p>
    </div>
  );
}
