'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, CountUp, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit, auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_LABELS, PARTNERSHIP_CLASS, THEMES } from '@/data/amud/centres';
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
import { ATTENDANCE_CLASS, ATTENDANCE_LABELS } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { PAYMENT_STATUS_CLASS, PAYMENT_STATUS_LABELS } from '@/data/amud/centerStudentPayments';
import { computeCenterStats, computeAttendanceRates, computeTeacherRemuneration, todayIso } from '@/lib/amud/centerCalculations';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';

const TABS = [
  { id: 'general', label: 'Vue générale' },
  { id: 'etudiants', label: 'Étudiants' },
  { id: 'enseignants', label: 'Enseignants' },
  { id: 'formations', label: 'Formations' },
  { id: 'groupes', label: 'Groupes' },
  { id: 'planning', label: 'Planning' },
  { id: 'presences', label: 'Présences' },
  { id: 'finances', label: 'Finances' },
  { id: 'site', label: 'Site web' },
  { id: 'activite', label: 'Activité' },
  { id: 'parametres', label: 'Paramètres' },
];

export default function AmudAdminCenterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [active, setActive] = useState('general');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [centres, { update: updateCentre, remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [logs] = useCollection(auditLogs, auditLogSeed);

  const centre = centres.find((c) => c.id === params.id);

  const today = todayIso();
  const stats = useMemo(() => {
    if (!centre) return null;
    return computeCenterStats(centre.id, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, today });
  }, [centre, students, teachers, formations, groups, schedules, attendance, payments, today]);

  const scoped = useMemo(() => {
    if (!centre) return null;
    return {
      students: students.filter((s) => s.centerId === centre.id),
      teachers: teachers.filter((t) => t.centerId === centre.id),
      formations: formations.filter((f) => f.centerId === centre.id),
      groups: groups.filter((g) => g.centerId === centre.id),
      schedules: schedules.filter((s) => s.centerId === centre.id).sort((a, b) => a.date.localeCompare(b.date)),
      attendance: attendance.filter((a) => a.centerId === centre.id),
      payments: payments.filter((p) => p.centerId === centre.id),
      logs: logs.filter((l) => l.centerId === centre.id).sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`)),
    };
  }, [centre, students, teachers, formations, groups, schedules, attendance, payments, logs]);

  if (!centre || !stats || !scoped) {
    return (
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <p className="text-body-md text-amud-on-surface-variant">Centre introuvable.</p>
        <Link href="/amud/admin/centres" className="mt-md inline-block text-label-md text-amud-primary hover:underline">
          Retour à la liste des centres
        </Link>
      </div>
    );
  }

  function handleTheme(themeId: string) {
    if (!centre) return;
    updateCentre(centre.id, { theme: themeId as typeof centre.theme, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Changement de thème', actionType: 'update', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    notify('Thème mis à jour, visible immédiatement sur le site public.');
  }

  function handleSiteToggle(enabled: boolean) {
    if (!centre) return;
    updateCentre(centre.id, { site: { ...centre.site, enabled }, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: enabled ? 'Activation du site public' : 'Désactivation du site public', actionType: 'update', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    notify(enabled ? 'Site public activé.' : 'Site public désactivé.');
  }

  function handleDelete() {
    if (!centre) return;
    removeCentre(centre.id);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression centre', actionType: 'delete', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    notify('Centre supprimé.', 'info');
    router.push('/amud/admin/centres');
  }

  const presenceRates = computeAttendanceRates(scoped.attendance);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-label-sm text-amud-on-surface-variant">
        <Link href="/amud/admin/centres" className="hover:text-amud-primary hover:underline">
          Centres de formation
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-amud-on-surface">{centre.nom}</span>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amud-outline-variant bg-amud-surface">
            <span className="material-symbols-outlined text-[28px] text-amud-primary">{centre.logo}</span>
          </div>
          <div>
            <h2 className="text-headline-md text-amud-on-surface">{centre.nom}</h2>
            <p className="text-body-md text-amud-on-surface-variant">
              {centre.ville}, {centre.pays} · {centre.assignedCommercialNom || 'Aucun commercial affecté'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span>
          <button onClick={() => setEditOpen(true)} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Modifier
          </button>
          <button onClick={() => setConfirmDeleteOpen(true)} className="rounded-lg border border-amud-error px-md py-2 text-label-md text-amud-error hover:bg-amud-error-container/20">
            Supprimer
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <Tabs tabs={TABS} active={active} onChange={setActive} />
      </div>

      {active === 'general' ? (
        <div className="space-y-lg">
          <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
            {[
              { label: 'Étudiants actifs', value: stats.activeStudents, icon: 'group' },
              { label: 'Enseignants', value: stats.totalTeachers, icon: 'school' },
              { label: 'Formations actives', value: stats.activeFormations, icon: 'menu_book' },
              { label: 'Groupes actifs', value: stats.activeGroups, icon: 'diversity_3' },
              { label: 'Cours aujourd’hui', value: stats.coursAujourdhui, icon: 'event' },
              { label: 'Taux de présence', value: stats.tauxPresence, icon: 'fact_check', suffix: '%' },
              { label: 'Revenus étudiants', value: stats.revenus, icon: 'payments', suffix: ' MAD' },
              { label: 'Paiements en attente', value: stats.paiementsEnAttente, icon: 'hourglass_empty', suffix: ' MAD' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                <div className="mb-md flex items-start justify-between">
                  <span className="text-label-md text-amud-on-surface-variant">{kpi.label}</span>
                  <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
                </div>
                <div className="text-headline-lg text-amud-on-surface">
                  <CountUp value={kpi.value} formatter={(v) => `${Math.round(v).toLocaleString('fr-FR')}${kpi.suffix ?? ''}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Informations générales</h3>
              <p className="mb-md text-body-md text-amud-on-surface-variant">{centre.description}</p>
              <dl className="space-y-sm text-body-md">
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Téléphone</dt><dd className="text-amud-on-surface">{centre.telephone}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Email</dt><dd className="text-amud-on-surface">{centre.email}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Site web</dt><dd className="text-amud-on-surface">{centre.siteWeb || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Adresse</dt><dd className="text-right text-amud-on-surface">{centre.adresse}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Contact</dt><dd className="text-amud-on-surface">{centre.contactNom}</dd></div>
              </dl>
            </div>
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Partenariat</h3>
              <dl className="space-y-sm text-body-md">
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Statut</dt><dd><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span></dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Début</dt><dd className="text-amud-on-surface">{centre.partnershipDateDebut}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Fin</dt><dd className="text-amud-on-surface">{centre.partnershipDateFin || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Commercial</dt><dd className="text-amud-on-surface">{centre.assignedCommercialNom || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Créé le</dt><dd className="text-amud-on-surface">{new Date(centre.createdAt).toLocaleDateString('fr-FR')}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}

      {active === 'etudiants' ? (
        <SimpleTable
          empty="Aucun étudiant."
          columns={['Nom', 'Niveau', 'Ville', 'Statut']}
          rows={scoped.students.map((s) => [`${s.prenom} ${s.nom}`, `${s.niveau} → ${s.niveauCible}`, s.ville, s.statut])}
        />
      ) : null}

      {active === 'enseignants' ? (
        <SimpleTable
          empty="Aucun enseignant."
          columns={['Nom', 'Spécialité', 'Contrat', 'Taux horaire']}
          rows={scoped.teachers.map((t) => [`${t.prenom} ${t.nom}`, t.specialite, t.typeContrat, `${t.tauxHoraire} MAD/h`])}
        />
      ) : null}

      {active === 'formations' ? (
        <SimpleTable
          empty="Aucune formation."
          columns={['Formation', 'Niveau', 'Durée', 'Prix', 'Statut']}
          rows={scoped.formations.map((f) => [f.nom, f.niveau, `${f.dureeSemaines} sem. · ${f.nombreHeures}h`, `${f.prix.toLocaleString('fr-FR')} MAD`, f.statut])}
        />
      ) : null}

      {active === 'groupes' ? (
        <SimpleTable
          empty="Aucun groupe."
          columns={['Groupe', 'Enseignant', 'Salle', 'Étudiants', 'Statut']}
          rows={scoped.groups.map((g) => {
            const teacher = scoped.teachers.find((t) => t.id === g.enseignantId);
            return [g.nom, teacher ? `${teacher.prenom} ${teacher.nom}` : '—', g.salle, `${g.studentIds.length}/${g.capaciteMax}`, g.statut];
          })}
        />
      ) : null}

      {active === 'planning' ? (
        <SimpleTable
          empty="Aucun créneau planifié."
          columns={['Date', 'Jour', 'Horaire', 'Groupe', 'Salle']}
          rows={scoped.schedules.slice(0, 30).map((s) => {
            const group = scoped.groups.find((g) => g.id === s.groupId);
            return [s.date, s.jour, `${s.heureDebut} – ${s.heureFin}`, group?.nom ?? '—', s.salle];
          })}
        />
      ) : null}

      {active === 'presences' ? (
        <div className="space-y-lg">
          <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
            {[
              { label: 'Taux de présence', value: presenceRates.presenceRate },
              { label: 'Taux d’absence', value: presenceRates.absenceRate },
              { label: 'Taux de retard', value: presenceRates.retardRate },
              { label: 'Taux d’excuse', value: presenceRates.excuseRate },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
                <div className="text-headline-md text-amud-primary">{k.value}%</div>
                <div className="text-label-sm text-amud-on-surface-variant">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Étudiant</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amud-outline-variant">
                {scoped.attendance.slice(0, 30).map((a) => {
                  const student = scoped.students.find((s) => s.id === a.studentId);
                  return (
                    <tr key={a.id}>
                      <td className="px-6 py-3 text-body-md text-amud-on-surface-variant">{a.date}</td>
                      <td className="px-6 py-3 text-body-md text-amud-on-surface">{student ? `${student.prenom} ${student.nom}` : '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ATTENDANCE_CLASS[a.statut]}`}>{ATTENDANCE_LABELS[a.statut]}</span>
                      </td>
                    </tr>
                  );
                })}
                {scoped.attendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                      Aucune présence enregistrée.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {active === 'finances' ? (
        <div className="space-y-lg">
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
              <div className="text-headline-md text-amud-primary">{stats.revenus.toLocaleString('fr-FR')} MAD</div>
              <div className="text-label-sm text-amud-on-surface-variant">Revenus étudiants</div>
            </div>
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
              <div className="text-headline-md text-amud-secondary">{stats.paiementsEnAttente.toLocaleString('fr-FR')} MAD</div>
              <div className="text-label-sm text-amud-on-surface-variant">Paiements en attente</div>
            </div>
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
              <div className="text-headline-md text-amud-on-surface">{stats.remunerationsDues.toLocaleString('fr-FR')} MAD</div>
              <div className="text-label-sm text-amud-on-surface-variant">Rémunérations enseignants</div>
            </div>
          </div>
          <SimpleTable
            empty="Aucun paiement enregistré."
            columns={['Étudiant', 'Montant total', 'Payé', 'Reste', 'Statut']}
            rows={scoped.payments.map((p) => {
              const student = scoped.students.find((s) => s.id === p.studentId);
              return [
                student ? `${student.prenom} ${student.nom}` : '—',
                `${p.prixTotal.toLocaleString('fr-FR')} MAD`,
                `${p.montantPaye.toLocaleString('fr-FR')} MAD`,
                `${Math.max(0, p.prixTotal - p.montantPaye).toLocaleString('fr-FR')} MAD`,
                <span key="s" className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASS[p.statut]}`}>{PAYMENT_STATUS_LABELS[p.statut]}</span>,
              ];
            })}
          />
          <div>
            <h3 className="mb-md text-title-lg text-amud-on-surface">Rémunération des enseignants</h3>
            <SimpleTable
              empty="Aucun enseignant."
              columns={['Enseignant', 'Heures', 'Taux', 'Montant dû']}
              rows={scoped.teachers.map((t) => {
                const r = computeTeacherRemuneration(t, scoped.schedules, today);
                return [`${t.prenom} ${t.nom}`, `${r.heures}h`, `${t.tauxHoraire} MAD/h`, `${r.montant.toLocaleString('fr-FR')} MAD`];
              })}
            />
          </div>
        </div>
      ) : null}

      {active === 'site' ? (
        <div className="space-y-lg">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="mb-md flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">Site public</h3>
              <label className="flex items-center gap-sm text-label-md text-amud-on-surface">
                Activé
                <input type="checkbox" checked={centre.site.enabled} onChange={(e) => handleSiteToggle(e.target.checked)} className="h-5 w-5 accent-amud-primary" />
              </label>
            </div>
            <p className="mb-md text-body-md text-amud-on-surface-variant">{centre.site.tagline}</p>
            {centre.site.enabled ? (
              <Link href={`/amud/centres/${centre.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md text-amud-primary hover:bg-amud-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span> Voir le site public
              </Link>
            ) : (
              <p className="text-label-sm text-amud-on-surface-variant">Le site public est désactivé pour ce centre.</p>
            )}
          </div>
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Thème</h3>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTheme(t.id)}
                  className={`rounded-lg border p-md text-left transition-colors ${centre.theme === t.id ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant hover:bg-amud-surface-container-low'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-semibold text-amud-on-surface">{t.nom}</span>
                    {centre.theme === t.id ? <span className="material-symbols-outlined text-amud-primary">check_circle</span> : null}
                  </div>
                  <p className="mt-1 text-label-sm text-amud-on-surface-variant">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {active === 'activite' ? (
        <div className="space-y-sm">
          {scoped.logs.length === 0 ? (
            <p className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center text-body-md text-amud-on-surface-variant">Aucune activité enregistrée pour ce centre.</p>
          ) : (
            scoped.logs.map((l) => (
              <div key={l.id} className="flex items-start gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
                <span className="material-symbols-outlined mt-0.5 text-amud-primary">history</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-md text-amud-on-surface">{l.action}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {l.utilisateur} · {l.date} à {l.heure}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {active === 'parametres' ? (
        <div className="space-y-lg">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Paramètres du centre</h3>
            <p className="mb-md text-body-md text-amud-on-surface-variant">Modifiez les informations générales, la localisation, le partenariat ou le site public de ce centre.</p>
            <button onClick={() => setEditOpen(true)} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:bg-amud-primary-dark">
              Modifier le centre
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-amud-error/40 bg-amud-surface-container-lowest shadow-sm">
            <div className="border-b border-amud-error/40 bg-amud-error-container/20 p-lg">
              <h3 className="text-title-lg text-amud-on-surface">Zone de danger</h3>
            </div>
            <div className="flex items-center justify-between p-lg">
              <p className="text-body-md text-amud-on-surface-variant">Supprimer définitivement ce centre et son accès au site public.</p>
              <button onClick={() => setConfirmDeleteOpen(true)} className="shrink-0 rounded-lg border border-amud-error px-md py-2 text-label-md text-amud-error hover:bg-amud-error-container/20">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CenterFormModal open={editOpen} onClose={() => setEditOpen(false)} centre={centre} />
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce centre ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
            {columns.map((c) => (
              <th key={c} className="px-6 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amud-outline-variant">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-6 py-3 text-body-md text-amud-on-surface-variant">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
