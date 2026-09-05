'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { Card, Notice } from '@/components/ui';

/*
 * L'écran d'atterrissage de l'administrateur, qui n'en avait aucun : après
 * connexion, `destinationForRole('admin')` renvoyait sur l'accueil public.
 *
 * `/admin/metrics` renvoie beaucoup plus que ce qui est affiché ici. On ne
 * reprend que les chiffres sur lesquels un administrateur agit — chacun est
 * un lien vers l'écran où l'action se fait.
 */
type Metrics = {
  candidates: { total: number; submitted: number; verified: number; new_this_week: number };
  recruiters: { total: number; pending_verification: number };
  documents: { awaiting_approval: number; unreadable: number };
  complaints: { open: number; in_review: number };
  marketplace: { offers_draft: number; offers_published: number; applications_pending: number };
  growth: { users: number };
};

function Tile({ label, value, href, hint }: { label: string; value: number; href: string; hint?: string }) {
  return (
    <Link href={href} className="block rounded-card outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary">
      <Card>
        <p className="text-[13px] font-medium text-on-surface-variant">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        {hint && <p className="helper-text mt-1">{hint}</p>}
      </Card>
    </Link>
  );
}

export default function AdminOverview() {
  const q = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Console d’administration</h1>
        <p className="helper-text mt-1">
          Les rôles se distribuent depuis{' '}
          <Link href="/admin/utilisateurs" className="font-bold text-primary underline">
            Utilisateurs
          </Link>{' '}
          : un recruteur ou un agent se connecte avec son téléphone, puis reçoit son rôle ici.
        </p>
      </header>

      {q.isError && <Notice>Impossible de charger les indicateurs. Rechargez la page.</Notice>}

      {q.data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Comptes"
              value={q.data.growth.users}
              href="/admin/utilisateurs"
              hint="Tous rôles confondus"
            />
            <Tile
              label="Dossiers à vérifier"
              value={q.data.candidates.submitted - q.data.candidates.verified}
              href="/admin/candidatures"
              hint={`${q.data.candidates.total} candidats`}
            />
            <Tile
              label="Documents en attente"
              value={q.data.documents.awaiting_approval}
              href="/admin/candidatures"
              hint={q.data.documents.unreadable > 0 ? `${q.data.documents.unreadable} illisibles` : undefined}
            />
            <Tile
              label="Réclamations ouvertes"
              value={q.data.complaints.open + q.data.complaints.in_review}
              href="/admin/reclamations"
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Recruteurs à vérifier"
              value={q.data.recruiters.pending_verification}
              href="/admin/utilisateurs?role=Company"
              hint={`${q.data.recruiters.total} recruteurs`}
            />
            <Tile label="Offres en brouillon" value={q.data.marketplace.offers_draft} href="/admin/offres" />
            <Tile label="Offres publiées" value={q.data.marketplace.offers_published} href="/admin/offres" />
            <Tile
              label="Candidatures sans réponse"
              value={q.data.marketplace.applications_pending}
              href="/admin/candidatures"
            />
          </section>
        </>
      )}
    </main>
  );
}
