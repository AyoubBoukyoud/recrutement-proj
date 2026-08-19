import Link from 'next/link';
import { commerciaux } from '@/data/amud/commerciaux';

/** `/amud/admin` — tableau de bord (doc5: tableau_de_bord_administrateur_amud_skills.html). */
export default function AmudAdminDashboardPage() {
  const leaderboard = [...commerciaux]
    .sort((a, b) => b.realiseMensuel / b.objectifMensuel - a.realiseMensuel / a.objectifMensuel)
    .slice(0, 4);

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="mb-sm text-headline-lg font-semibold text-amud-on-surface">Bonjour, Administrateur 👋</h2>
          <p className="text-body-lg text-amud-on-surface-variant">Voici un aperçu de l&apos;activité de votre plateforme.</p>
        </div>
        <div className="flex gap-sm">
          <Link
            href="/amud/admin/candidatures"
            className="rounded-lg bg-amud-primary px-lg py-sm text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
          >
            Ajouter un candidat
          </Link>
          <Link
            href="/amud/admin/offres"
            className="rounded-lg border border-amud-primary px-lg py-sm text-label-md font-medium text-amud-primary shadow-sm transition-colors hover:bg-amud-surface-container-low"
          >
            Ajouter une offre
          </Link>
        </div>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-lg lg:grid-cols-4">
        {[
          { label: 'Total candidats', value: '12,450', delta: '+5%', icon: 'group', accent: 'bg-amud-primary' },
          { label: 'Total recruteurs', value: '840', delta: '+2%', icon: 'badge', accent: 'bg-amud-primary' },
          { label: 'Total commerciaux', value: String(commerciaux.length * 8), delta: null, icon: 'support_agent', accent: 'bg-amud-tertiary-container' },
          { label: 'Offres actives', value: '156', delta: null, icon: 'work', accent: 'bg-amud-tertiary-container' },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className={`absolute bottom-0 left-0 top-0 w-1 ${kpi.accent}`} />
            <div className="mb-md flex items-start justify-between">
              <div className="text-label-md text-amud-on-surface-variant">{kpi.label}</div>
              <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
            </div>
            <div className="flex items-baseline gap-sm">
              <div className="text-headline-lg text-amud-on-surface">{kpi.value}</div>
              {kpi.delta ? (
                <div className="rounded bg-amud-primary-fixed px-xs py-[2px] text-label-sm text-amud-on-primary-fixed">{kpi.delta}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="space-y-xl lg:col-span-2">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-lg text-title-lg text-amud-on-surface">Performance Commerciale (Aujourd&apos;hui)</h3>
            <div className="mb-lg grid grid-cols-3 gap-md">
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Appels</div>
                <div className="text-headline-md text-amud-primary">142</div>
              </div>
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Taux de réponse</div>
                <div className="text-headline-md text-amud-primary">68%</div>
              </div>
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Rendez-vous</div>
                <div className="text-headline-md text-amud-primary">18</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-amud-outline-variant">
              <table className="w-full border-collapse text-left">
                <thead className="bg-amud-surface-container-low text-label-sm uppercase text-amud-on-surface-variant">
                  <tr>
                    <th className="border-b border-amud-outline-variant px-md py-sm font-medium">Rang</th>
                    <th className="border-b border-amud-outline-variant px-md py-sm font-medium">Commercial</th>
                    <th className="border-b border-amud-outline-variant px-md py-sm text-right font-medium">Objectif Atteint</th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {leaderboard.map((c, i) => {
                    const pct = Math.round((c.realiseMensuel / c.objectifMensuel) * 100);
                    return (
                      <tr key={c.id} className="border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-lowest">
                        <td className="px-md py-sm">{i + 1}</td>
                        <td className="px-md py-sm font-medium">
                          <Link href={`/amud/admin/commerciaux/${c.id}`} className="hover:underline">
                            {c.prenom} {c.nom}
                          </Link>
                        </td>
                        <td className="px-md py-sm text-right font-bold text-amud-primary">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-xl lg:col-span-1">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-lg flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-secondary">warning</span>
              Alertes Requises
            </h3>
            <div className="space-y-sm">
              <Link
                href="/amud/admin/offres"
                className="flex items-center justify-between rounded p-sm transition-colors hover:bg-amud-surface-container-low"
              >
                <div className="flex items-center gap-sm text-body-md text-amud-on-surface">
                  <div className="h-2 w-2 rounded-full bg-amud-secondary" />
                  Offres en attente
                </div>
                <span className="rounded-full bg-amud-error-container px-2 py-1 text-label-sm text-amud-on-error-container">12</span>
              </Link>
              <Link
                href="/amud/admin/utilisateurs"
                className="flex items-center justify-between rounded p-sm transition-colors hover:bg-amud-surface-container-low"
              >
                <div className="flex items-center gap-sm text-body-md text-amud-on-surface">
                  <div className="h-2 w-2 rounded-full bg-amud-tertiary-container" />
                  Recruteurs à valider
                </div>
                <span className="rounded-full bg-amud-tertiary-fixed px-2 py-1 text-label-sm text-amud-on-tertiary-container">7</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
