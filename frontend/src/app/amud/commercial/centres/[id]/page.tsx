'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CountUp } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_LABELS, PARTNERSHIP_CLASS } from '@/data/amud/centres';
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
import { computeAttendanceRates } from '@/lib/amud/centerCalculations';
import { CenterModificationRequestModal } from '@/components/amud/centre/CenterModificationRequestModal';

/**
 * Fiche centre côté Commercial : lecture seule, jamais de bouton Modifier
 * (cahier des charges §18-21). N'affiche que les données autorisées — pas
 * de salaires enseignants, pas de notes privées, pas d'informations
 * financières sensibles (§19).
 */
export default function AmudCommercialCenterDetailPage() {
  const params = useParams<{ id: string }>();
  const [requestOpen, setRequestOpen] = useState(false);

  const [centres] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);

  const centre = centres.find((c) => c.id === params.id);

  const scoped = useMemo(() => {
    if (!centre) return null;
    const monthPrefix = new Date().toISOString().slice(0, 7);
    return {
      students: students.filter((s) => s.centerId === centre.id),
      teachers: teachers.filter((t) => t.centerId === centre.id),
      formations: formations.filter((f) => f.centerId === centre.id),
      groups: groups.filter((g) => g.centerId === centre.id),
      coursDuMois: schedules.filter((s) => s.centerId === centre.id && s.date.startsWith(monthPrefix)).length,
      attendance: attendance.filter((a) => a.centerId === centre.id),
    };
  }, [centre, students, teachers, formations, groups, schedules, attendance]);

  if (!centre || !scoped) {
    return (
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <p className="text-body-md text-amud-on-surface-variant">Centre introuvable.</p>
        <Link href="/amud/commercial/centres" className="mt-md inline-block text-label-md text-amud-primary hover:underline">
          Retour à la liste des centres
        </Link>
      </div>
    );
  }

  const { presenceRate } = computeAttendanceRates(scoped.attendance);

  const stats = [
    { label: 'Total étudiants', value: scoped.students.length, icon: 'group' },
    { label: 'Étudiants actifs', value: scoped.students.filter((s) => s.statut === 'Actif').length, icon: 'person_check' },
    { label: 'Total enseignants', value: scoped.teachers.length, icon: 'school' },
    { label: 'Formations actives', value: scoped.formations.filter((f) => f.statut === 'Active').length, icon: 'menu_book' },
    { label: 'Groupes actifs', value: scoped.groups.filter((g) => g.statut === 'Actif').length, icon: 'diversity_3' },
    { label: 'Cours ce mois-ci', value: scoped.coursDuMois, icon: 'event' },
    { label: 'Taux de présence', value: presenceRate, icon: 'fact_check', suffix: '%' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-label-sm text-amud-on-surface-variant">
        <Link href="/amud/commercial/centres" className="hover:text-amud-primary hover:underline">
          Centres partenaires
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
              {centre.ville}, {centre.pays}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span>
          <button onClick={() => setRequestOpen(true)} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Demander une modification
          </button>
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-lg lg:grid-cols-4">
        {stats.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="mb-md flex items-start justify-between">
              <span className="text-label-md text-amud-on-surface-variant">{kpi.label}</span>
              <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
            </div>
            <div className="text-headline-lg text-amud-on-surface">
              <CountUp value={kpi.value} formatter={(v) => `${Math.round(v)}${kpi.suffix ?? ''}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h3 className="mb-md text-title-lg text-amud-on-surface">À propos</h3>
          <p className="mb-md text-body-md text-amud-on-surface-variant">{centre.description}</p>
          <dl className="space-y-sm text-body-md">
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Téléphone</dt><dd className="text-amud-on-surface">{centre.telephone}</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Email</dt><dd className="text-amud-on-surface">{centre.email}</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Site web</dt><dd className="text-amud-on-surface">{centre.siteWeb || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Contact</dt><dd className="text-amud-on-surface">{centre.contactNom}</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Téléphone contact</dt><dd className="text-amud-on-surface">{centre.contactTelephone}</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Email contact</dt><dd className="text-amud-on-surface">{centre.contactEmail}</dd></div>
          </dl>
        </div>
        <div className="space-y-lg">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Localisation</h3>
            <p className="mb-md text-body-md text-amud-on-surface">{centre.adresse}</p>
            {centre.googleMapsUrl ? (
              <a href={centre.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md text-amud-primary hover:bg-amud-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">map</span> Voir sur la carte
              </a>
            ) : null}
          </div>
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Partenariat</h3>
            <dl className="space-y-sm text-body-md">
              <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Statut</dt><dd><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span></dd></div>
              <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Début</dt><dd className="text-amud-on-surface">{centre.partnershipDateDebut}</dd></div>
              <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Commercial affecté</dt><dd className="text-amud-on-surface">{centre.assignedCommercialNom || '—'}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <CenterModificationRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} centre={centre} />
    </div>
  );
}
