'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { quizzesCollection } from '@/lib/amud/localQuizzes';
import { quizzesSeed, QUIZ_STATUS_LABELS, type Quiz } from '@/data/amud/quizzes';
import { quizQuestionsCollection } from '@/lib/amud/localQuizQuestions';
import { quizQuestionsSeed } from '@/data/amud/quizQuestions';
import { deleteQuiz } from '@/lib/amud/quizCascades';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { QuizFormModal } from '@/components/amud/centre/QuizFormModal';

export default function TeacherQuizzesPage() {
  const notify = useToast();
  const router = useRouter();
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [quizzes] = useCollection(quizzesCollection, quizzesSeed);
  const [questions] = useCollection(quizQuestionsCollection, quizQuestionsSeed);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | undefined>(undefined);
  const [deleting, setDeleting] = useState<Quiz | null>(null);

  const teacher = teachers.find((t) => t.id === teacherId);
  const actor = { utilisateur: teacher ? `${teacher.prenom} ${teacher.nom}` : 'Enseignant', role: 'TEACHER' };

  const myGroups = useMemo(() => groups.filter((g) => g.enseignantId === teacherId), [groups, teacherId]);
  const myFormations = useMemo(() => {
    const ids = new Set(myGroups.map((g) => g.formationId));
    return formations.filter((f) => ids.has(f.id));
  }, [formations, myGroups]);
  const myQuizzes = useMemo(() => quizzes.filter((q) => q.createdBy === teacherId), [quizzes, teacherId]);

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(q: Quiz) {
    setEditing(q);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    deleteQuiz(deleting, actor);
    notify('Quiz supprimé.', 'info');
    setDeleting(null);
  }

  if (!teacher) return null;

  return (
    <>
      <CenterCrudTable
        title="Quiz"
        subtitle={`${myQuizzes.length} quiz`}
        addLabel="Créer un quiz"
        onAdd={openAdd}
        allowed
        columns={['Titre', 'Formation', 'Groupe', 'Questions', 'Durée', 'Statut']}
        empty="Aucun quiz"
        emptyIcon="quiz"
        emptyDescription="Créez un Quick Quiz pour évaluer vos étudiants en direct."
        rows={myQuizzes.map((q) => {
          const formation = formations.find((f) => f.id === q.formationId);
          const group = groups.find((g) => g.id === q.groupId);
          const nbQuestions = questions.filter((qq) => qq.quizId === q.id).length;
          return {
            id: q.id,
            cardSubtitle: formation?.nom,
            badge: { label: QUIZ_STATUS_LABELS[q.statut], tone: statusTone(q.statut) },
            cells: [q.titre, formation?.nom ?? '—', group?.nom ?? 'Tous les groupes', `${nbQuestions} question(s)`, `${q.dureeMinutes} min`, QUIZ_STATUS_LABELS[q.statut]],
            onOpen: () => router.push(`/amud/teacher/quizzes/${q.id}`),
            onEdit: () => openEdit(q),
            onDelete: () => setDeleting(q),
          };
        })}
        cardHiddenColumns={[0, 5]}
      />
      <QuizFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={teacher.centerId} teacherId={teacherId} formations={myFormations} groups={myGroups} quiz={editing} actor={actor} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce quiz ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.titre} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
