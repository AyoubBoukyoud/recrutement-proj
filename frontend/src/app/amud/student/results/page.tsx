'use client';

import { useMemo } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { studentResultsCollection } from '@/lib/amud/localStudentResults';
import { centerStudentResultsSeed } from '@/data/amud/centerStudentResults';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';

export default function StudentResultsPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [results] = useCollection(studentResultsCollection, centerStudentResultsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);

  const student = students.find((s) => s.id === studentId);
  const myResults = useMemo(
    () => results.filter((r) => r.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)),
    [results, studentId],
  );

  const avg = useMemo(() => {
    if (myResults.length === 0) return null;
    const sum = myResults.reduce((s, r) => s + (r.note / r.noteMax) * 20, 0);
    return Math.round((sum / myResults.length) * 10) / 10;
  }, [myResults]);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;

  function noteColor(note: number, max: number) {
    const pct = (note / max) * 100;
    if (pct >= 80) return 'text-amud-primary';
    if (pct >= 60) return 'text-amud-on-tertiary-fixed-variant';
    return 'text-amud-error';
  }

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mes résultats</h1>

      {myResults.length === 0 ? (
        <EmptyState
          icon="grade"
          title="Aucun résultat disponible pour le moment."
          description="Vos évaluations et notes apparaîtront ici dès qu'elles sont saisies par votre centre."
        />
      ) : (
        <>
          {/* Moyenne générale */}
          {avg !== null && (
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm text-center">
              <p className="text-label-md text-amud-on-surface-variant">Moyenne générale</p>
              <p className={`text-display-sm font-bold ${noteColor(avg, 20)}`}>{avg}<span className="text-title-lg text-amud-on-surface-variant">/20</span></p>
              <p className="text-label-sm text-amud-on-surface-variant">{myResults.length} évaluation{myResults.length > 1 ? 's' : ''}</p>
            </div>
          )}

          {/* Liste des résultats */}
          <div className="space-y-sm">
            {myResults.map((r) => {
              const formation = formations.find((f) => f.id === r.formationId);
              const pct = Math.round((r.note / r.noteMax) * 100);
              return (
                <div key={r.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div>
                      <p className="text-body-md font-semibold text-amud-on-surface">{r.module}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">
                        {formation?.nom ?? '—'} · {new Date(r.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-title-lg font-bold ${noteColor(r.note, r.noteMax)}`}>{r.note}<span className="text-label-md text-amud-on-surface-variant">/{r.noteMax}</span></p>
                      <p className="text-label-sm text-amud-on-surface-variant">{pct}%</p>
                    </div>
                  </div>
                  {/* Barre de note */}
                  <div className="mt-sm h-2 overflow-hidden rounded-full bg-amud-surface-container-high">
                    <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-amud-primary' : pct >= 60 ? 'bg-amud-tertiary-fixed' : 'bg-amud-error'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {r.observation && (
                    <p className="mt-sm text-label-sm text-amud-on-surface-variant italic">{r.observation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
