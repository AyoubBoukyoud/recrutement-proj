'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState, LoadingState, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { StudentFormModal } from '@/components/amud/centre/StudentFormModal';
import { TeacherFormModal } from '@/components/amud/centre/TeacherFormModal';
import { FormationFormModal } from '@/components/amud/centre/FormationFormModal';
import { GroupFormModal } from '@/components/amud/centre/GroupFormModal';
import { StudentPaymentFormModal } from '@/components/amud/centre/StudentPaymentFormModal';
import { ScheduleFormModal } from '@/components/amud/centre/ScheduleFormModal';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed } from '@/data/amud/centerLeads';
import { computeCenterStats, todayIso } from '@/lib/amud/centerCalculations';

const KPI_LINKS: Record<string, string> = {
  'Étudiants actifs': '/amud/centre/etudiants',
  Enseignants: '/amud/centre/enseignants',
  'Formations actives': '/amud/centre/formations',
  'Groupes actifs': '/amud/centre/groupes',
  'Cours aujourd’hui': '/amud/centre/planning',
  'Taux de présence': '/amud/centre/presences',
  'Revenus étudiants': '/amud/centre/paiements-etudiants',
  'Paiements en attente': '/amud/centre/paiements-etudiants',
};

/**
 * Actions rapides du tableau de bord : chacune ouvre directement la modal
 * correspondante (cahier des charges — « les actions rapides doivent ouvrir
 * directement les Modals »), sans passer par la page de liste. Les modals
 * réutilisées sont exactement celles des pages `/amud/centre/*`, donc la
 * création faite ici produit la même écriture localStorage, la même
 * notification et la même entrée d'activité.
 */
type QuickAction = 'student' | 'teacher' | 'formation' | 'group' | 'payment' | 'schedule';
type CenterPermission = Parameters<typeof canPerform>[1];

const QUICK_ACTIONS: { id: QuickAction; label: string; icon: string; permission: CenterPermission }[] = [
  { id: 'student', label: 'Ajouter étudiant', icon: 'person_add', permission: 'manage-students' },
  { id: 'teacher', label: 'Ajouter enseignant', icon: 'school', permission: 'manage-teachers' },
  { id: 'formation', label: 'Ajouter formation', icon: 'menu_book', permission: 'manage-formations' },
  { id: 'group', label: 'Ajouter groupe', icon: 'diversity_3', permission: 'manage-groups' },
  { id: 'payment', label: 'Ajouter paiement', icon: 'payments', permission: 'manage-student-payments' },
  { id: 'schedule', label: 'Ajouter cours', icon: 'event', permission: 'manage-schedule' },
];

export default function CentreDashboardPage() {
  const notify = useToast();
  const { centerId, role } = useCurrentCenter();
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
  const [centres] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [leads] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const [logs] = useCollection(auditLogs, auditLogSeed);

  const centre = centres.find((c) => c.id === centerId);
  const today = todayIso();

  const stats = useMemo(() => {
    if (!centre) return null;
    return computeCenterStats(centre.id, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, today });
  }, [centre, students, teachers, formations, groups, schedules, attendance, payments, today]);

  const recentLogs = useMemo(
    () => logs.filter((l) => l.centerId === centerId).sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`)).slice(0, 8),
    [logs, centerId],
  );
  const newLeads = leads.filter((l) => l.centerId === centerId && l.statut === 'NOUVEAU').length;
  const todaySchedules = schedules.filter((s) => s.centerId === centerId && s.date === today);
  const groupById = (id: string) => groups.find((g) => g.id === id);

  if (!centre || !stats) {
    return <LoadingState label="Chargement du centre…" rows={4} />;
  }

  const actor = { utilisateur: 'Centre (self-service)', role };

  function openQuickAction(action: QuickAction, permission: CenterPermission) {
    if (!canPerform(role, permission)) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    setQuickAction(action);
  }

  const kpis = [
    { label: 'Étudiants actifs', value: stats.activeStudents, icon: 'group' },
    { label: 'Enseignants', value: stats.totalTeachers, icon: 'school' },
    { label: 'Formations actives', value: stats.activeFormations, icon: 'menu_book' },
    { label: 'Groupes actifs', value: stats.activeGroups, icon: 'diversity_3' },
    { label: 'Cours aujourd’hui', value: stats.coursAujourdhui, icon: 'event' },
    { label: 'Taux de présence', value: stats.tauxPresence, icon: 'fact_check', suffix: '%' },
    { label: 'Revenus étudiants', value: stats.revenus, icon: 'payments', suffix: ' MAD' },
    { label: 'Paiements en attente', value: stats.paiementsEnAttente, icon: 'hourglass_empty', suffix: ' MAD' },
  ];

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-md text-amud-on-surface">{centre.nom}</h1>
        <p className="text-body-md text-amud-on-surface-variant">
          {centre.ville}, {centre.pays} · Tableau de bord du centre
        </p>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm sm:p-lg">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => openQuickAction(a.id, a.permission)}
              className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-lg border border-amud-outline-variant px-2 py-3 text-center text-label-sm font-medium text-amud-on-surface transition-colors hover:border-amud-primary hover:bg-amud-primary/5 hover:text-amud-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
            >
              <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">
                {a.icon}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            suffix={kpi.suffix}
            href={KPI_LINKS[kpi.label] ?? '/amud/centre/dashboard'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm lg:col-span-2">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Cours d’aujourd’hui</h3>
          {todaySchedules.length === 0 ? (
            <EmptyState
              compact
              icon="event_available"
              title="Aucun cours aujourd’hui"
              description="Programmez un cours pour le voir apparaître ici."
              actionLabel={canPerform(role, 'manage-schedule') ? 'Ajouter un cours' : undefined}
              onAction={canPerform(role, 'manage-schedule') ? () => setQuickAction('schedule') : undefined}
            />
          ) : (
            <div className="space-y-sm">
              {todaySchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant px-md py-sm">
                  <div>
                    <p className="text-body-md text-amud-on-surface">{groupById(s.groupId)?.nom ?? 'Groupe'}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{s.salle}</p>
                  </div>
                  <span className="text-label-md font-medium text-amud-primary">{s.heureDebut} – {s.heureFin}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Rémunérations dues</h3>
          <div className="text-headline-md text-amud-on-surface">{stats.remunerationsDues.toLocaleString('fr-FR')} MAD</div>
          <Link href="/amud/centre/remuneration" className="mt-sm inline-block text-label-md text-amud-primary hover:underline">
            Voir le détail
          </Link>
          <div className="mt-lg border-t border-amud-outline-variant pt-md">
            <h4 className="mb-1 text-label-md font-semibold text-amud-on-surface">Nouveaux leads</h4>
            <div className="text-headline-md text-amud-secondary">{newLeads}</div>
            <Link href="/amud/centre/leads" className="text-label-md text-amud-primary hover:underline">
              Voir les leads
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Activité récente</h3>
        {recentLogs.length === 0 ? (
          <EmptyState compact icon="history" title="Aucune activité" description="Les créations, modifications et suppressions apparaîtront ici." />
        ) : (
          <div className="space-y-sm">
            {recentLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-md">
                <span className="material-symbols-outlined mt-0.5 text-amud-primary">history</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-md text-amud-on-surface">{l.action}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">{l.utilisateur} · {l.date} à {l.heure}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StudentFormModal open={quickAction === 'student'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <TeacherFormModal open={quickAction === 'teacher'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <FormationFormModal open={quickAction === 'formation'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <GroupFormModal open={quickAction === 'group'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <StudentPaymentFormModal open={quickAction === 'payment'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
      <ScheduleFormModal open={quickAction === 'schedule'} onClose={() => setQuickAction(null)} centerId={centre.id} actor={actor} />
    </div>
  );
}
