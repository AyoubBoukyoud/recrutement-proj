'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  FileWarning,
  MessageSquareWarning,
  FileCheck,
  ClipboardList,
  LifeBuoy,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/opsApi';
import { Card, Eyebrow, ProgressBar, SectionHeader } from '@/components/ui';
import type { Metrics } from '@/types/admin';

/**
 * Un chiffre, et ce qu'il veut dire. Le ton est réservé aux valeurs qui
 * réclament une action — un arriéré de documents que personne n'a approuvés
 * n'est pas un fait de même nature que le nombre de candidats existants.
 * Sous ce ton, le chiffre se pose sur une puce or : on doit le voir avant de
 * lire le libellé, pas après.
 *
 * `to`, quand il est fourni, rend le chiffre cliquable vers la section
 * concernée. Le filtre n'est mis dans l'URL que lorsque la destination le
 * comprend déjà (`?status=…` sur les candidats ou les réclamations) ; les
 * autres chiffres actionnables mènent à leur section sans filtre inventé —
 * aucun changement d'adaptateur ni de contrat d'API n'accompagne ce lien.
 */
function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  to,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'neutral' | 'attention';
  to?: string;
}) {
  const flagged = tone === 'attention' && Number(value) > 0;
  const valueEl = (
    <span
      className={`inline-flex items-center rounded-element font-mono text-2xl leading-none tabular-nums ${
        flagged ? '-mx-1.5 -my-0.5 bg-attention-light px-1.5 py-0.5 text-attention' : 'text-on-surface'
      }`}
    >
      {value}
    </span>
  );

  const content = (
    <>
      <Eyebrow>{label}</Eyebrow>
      {valueEl}
      {hint && <span className="helper-text">{hint}</span>}
    </>
  );

  if (to) {
    return (
      <Link href={to} className="group grid min-w-0 gap-1 rounded-sm">
        {content}
        <span className="sr-only"> — voir</span>
      </Link>
    );
  }

  return <div className="grid min-w-0 gap-1">{content}</div>;
}

/** Une tuile d'en-tête : le chiffre que quelqu'un cherche avant tout le reste. */
function HeroStat({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: 'neutral' | 'attention';
  to?: string;
}) {
  const body = (
    <div className="flex items-center gap-3 rounded-card border border-outline-variant bg-surface-lowest p-4 transition-colors hover:border-primary/40">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          tone === 'attention' && value > 0 ? 'bg-attention-light text-attention' : 'bg-primary-light text-primary-dark'
        }`}
      >
        <Icon size={20} />
      </span>
      <div className="grid min-w-0">
        <span className="font-mono text-2xl leading-none tabular-nums text-on-surface">{value}</span>
        <span className="text-[13px] leading-tight text-on-surface-variant">{label}</span>
      </div>
    </div>
  );

  return to ? <Link href={to}>{body}</Link> : body;
}

/** Un groupe de statistiques apparentées, dans sa propre carte plutôt que sous une simple ligne. */
function SectionCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-element bg-primary-light text-primary-dark">
          <Icon size={16} />
        </span>
        <Eyebrow tone="accent">{title}</Eyebrow>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">{children}</div>
    </Card>
  );
}

export function MetricsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
    refetchInterval: 30_000,
  });

  const completionPercent = data
    ? data.internship.assigned_today > 0
      ? Math.round((data.internship.completed_today / data.internship.assigned_today) * 100)
      : 0
    : 0;

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Vue d’ensemble"
        title="Plateforme"
        subtitle={isLoading ? 'Chargement…' : 'Actualisé toutes les 30 secondes'}
      />

      {data && (
        <>
          {/* Les quatre chiffres qu'on cherche en arrivant : combien de monde,
              combien de vérifié, et ce qui attend une décision aujourd'hui. */}
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <HeroStat icon={Users} label="Candidats au total" value={data.candidates.total} />
            <HeroStat
              icon={ShieldCheck}
              label="Dossiers vérifiés"
              value={data.candidates.verified}
              to="/admin/candidats?status=verified"
            />
            <HeroStat
              icon={FileWarning}
              label="Documents à approuver"
              value={data.documents.awaiting_approval}
              tone="attention"
              to="/admin/candidats"
            />
            <HeroStat
              icon={MessageSquareWarning}
              label="Réclamations ouvertes"
              value={data.complaints.open}
              tone="attention"
              to="/admin/reclamations?status=open"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard icon={Users} title="Candidats">
              <Stat label="Total" value={data.candidates.total} />
              <Stat
                label="Soumis"
                value={data.candidates.submitted}
                hint="déclarés terminés"
                to="/admin/candidats?status=submitted"
              />
              <Stat
                label="Vérifiés"
                value={data.candidates.verified}
                hint="contrôlés par nous"
                to="/admin/candidats?status=verified"
              />
              <Stat label="Visibles" value={data.candidates.discoverable} hint="consentements enregistrés" />
              <Stat label="Nouveaux cette semaine" value={data.candidates.new_this_week} />
              <Stat label="Profils complets" value={data.candidates.profiles_complete} to="/admin/candidats" />
              <Stat
                label="En entretien"
                value={data.candidates.interviewing}
                hint="pipeline recruteur"
                to="/admin/candidats"
              />
            </SectionCard>

            <SectionCard icon={Briefcase} title="Recruteurs">
              <Stat label="Total" value={data.recruiters.total} to="/admin/recruteurs" />
              <Stat label="Actifs" value={data.recruiters.active} />
              <Stat
                label="En attente de vérification"
                value={data.recruiters.pending_verification}
                tone="attention"
                to="/admin/recruteurs"
              />
              <Stat label="Vérifiés" value={data.recruiters.verified} to="/admin/recruteurs" />
              <Stat label="Candidatures reçues" value={data.recruiters.shortlisted_candidates} hint="tous recruteurs confondus" />
            </SectionCard>

            <SectionCard icon={FileCheck} title="Pièces justificatives">
              <Stat
                label="À approuver"
                value={data.documents.awaiting_approval}
                tone="attention"
                hint="en attente de notre côté"
                to="/admin/candidats"
              />
              <Stat label="Approuvés" value={data.documents.approved} />
              <Stat label="Rejetés" value={data.documents.rejected} />
              <Stat
                label="Illisibles"
                value={data.documents.unreadable}
                tone="attention"
                hint="le scanner n'a rien lu"
                to="/admin/candidats"
              />
            </SectionCard>

            <SectionCard icon={ClipboardList} title="Stage quotidien">
              <Stat label="Actifs aujourd'hui" value={data.internship.active_candidates_today} />
              <div className="grid min-w-0 gap-1.5">
                <Eyebrow>Faits aujourd&apos;hui</Eyebrow>
                <span className="font-mono text-2xl leading-none tabular-nums text-on-surface">
                  {data.internship.completed_today}/{data.internship.assigned_today}
                </span>
                <ProgressBar percent={completionPercent} />
              </div>
              <Stat label="En retard" value={data.internship.overdue} tone="attention" to="/admin/stage" />
              <Stat
                label="Inscrits"
                value={data.internship.candidates_with_assignments}
                hint="ont déjà reçu du travail"
              />
            </SectionCard>

            <SectionCard icon={LifeBuoy} title="Support et croissance">
              <Stat
                label="Réclamations ouvertes"
                value={data.complaints.open}
                tone="attention"
                to="/admin/reclamations?status=open"
              />
              <Stat label="En cours" value={data.complaints.in_review} to="/admin/reclamations?status=in_review" />
              {/* Personne n'était joignable à leur arrivée — une erreur de
                  configuration autrement complètement invisible. */}
              <Stat
                label="Non signalées"
                value={data.complaints.unannounced}
                tone="attention"
                hint="aucune alerte n'a atteint personne"
                to="/admin/reclamations"
              />
              <Stat label="Parrainés" value={data.growth.referred_registrations} />
              <Stat label="Utilisateurs" value={data.growth.users} />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
