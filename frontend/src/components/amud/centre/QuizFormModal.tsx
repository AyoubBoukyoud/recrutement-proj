'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { createQuiz, updateQuiz } from '@/lib/amud/quizCascades';
import type { Quiz, QuizLevel, QuizStatus } from '@/data/amud/quizzes';
import { QUIZ_STATUSES } from '@/data/amud/quizzes';
import { GERMAN_LEVELS } from '@/data/amud/centerTypes';
import type { CenterFormation } from '@/data/amud/centerFormations';
import type { CenterGroup } from '@/data/amud/centerGroups';

const NIVEAUX: QuizLevel[] = [...GERMAN_LEVELS, 'Tous niveaux'];

/** Créer/modifier un quiz — même gabarit que `FormationFormModal.tsx`. */
export function QuizFormModal({
  open,
  onClose,
  centerId,
  teacherId,
  formations,
  groups,
  quiz,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  teacherId: string;
  formations: CenterFormation[];
  groups: CenterGroup[];
  quiz?: Quiz;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const isEdit = !!quiz;

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [formationId, setFormationId] = useState(formations[0]?.id ?? '');
  const [groupId, setGroupId] = useState('');
  const [niveau, setNiveau] = useState<QuizLevel>('Tous niveaux');
  const [pointsParQuestion, setPointsParQuestion] = useState(1);
  const [dureeMinutes, setDureeMinutes] = useState(5);
  const [statut, setStatut] = useState<QuizStatus>('BROUILLON');

  const groupsForFormation = groups.filter((g) => g.formationId === formationId);

  useEffect(() => {
    if (!open) return;
    if (quiz) {
      setTitre(quiz.titre);
      setDescription(quiz.description ?? '');
      setFormationId(quiz.formationId);
      setGroupId(quiz.groupId ?? '');
      setNiveau(quiz.niveau);
      setPointsParQuestion(quiz.pointsParQuestion);
      setDureeMinutes(quiz.dureeMinutes);
      setStatut(quiz.statut);
    } else {
      setTitre('');
      setDescription('');
      setFormationId(formations[0]?.id ?? '');
      setGroupId(groups.find((g) => g.formationId === formations[0]?.id)?.id ?? '');
      setNiveau('Tous niveaux');
      setPointsParQuestion(1);
      setDureeMinutes(5);
      setStatut('BROUILLON');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quiz]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim() || !formationId) return;
    if (isEdit && quiz) {
      updateQuiz(quiz, { titre: titre.trim(), description: description.trim(), formationId, groupId: groupId || undefined, niveau, pointsParQuestion, dureeMinutes, statut }, actor);
      notify(`Quiz « ${titre} » mis à jour.`);
    } else {
      createQuiz({ centerId, formationId, groupId: groupId || undefined, titre: titre.trim(), description: description.trim(), niveau, pointsParQuestion, dureeMinutes, statut, createdBy: teacherId }, actor);
      notify(`Quiz « ${titre} » créé.`);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifier le quiz' : 'Créer un quiz'} footer={<ModalActions onCancel={onClose} form="quiz-form" submitLabel={isEdit ? 'Enregistrer' : 'Créer'} />}>
      <form id="quiz-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Titre *</label>
          <input autoFocus required value={titre} onChange={(e) => setTitre(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Formation *</label>
          <select
            required
            value={formationId}
            onChange={(e) => {
              setFormationId(e.target.value);
              setGroupId(groups.find((g) => g.formationId === e.target.value)?.id ?? '');
            }}
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          >
            {formations.length === 0 ? <option value="">Aucune formation</option> : null}
            {formations.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Groupe</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="">Tous mes groupes de cette formation</option>
            {groupsForFormation.map((g) => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Niveau</label>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value as QuizLevel)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as QuizStatus)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {QUIZ_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Points par question</label>
          <input value={pointsParQuestion} onChange={(e) => setPointsParQuestion(Number(e.target.value) || 1)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Durée (minutes)</label>
          <input value={dureeMinutes} onChange={(e) => setDureeMinutes(Number(e.target.value) || 1)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
      </form>
    </Modal>
  );
}
