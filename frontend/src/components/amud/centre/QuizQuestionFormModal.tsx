'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { addQuizQuestion, updateQuizQuestion } from '@/lib/amud/quizCascades';
import type { Quiz } from '@/data/amud/quizzes';
import type { QuizQuestion, QuizQuestionType } from '@/data/amud/quizQuestions';

/** Créer/modifier une question (QCM ou Vrai/Faux) d'un quiz. */
export function QuizQuestionFormModal({
  open,
  onClose,
  quiz,
  question,
  nextOrdre,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
  question?: QuizQuestion;
  nextOrdre: number;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const isEdit = !!question;

  const [type, setType] = useState<QuizQuestionType>('QCM');
  const [texte, setTexte] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [bonneReponseIndex, setBonneReponseIndex] = useState(0);
  const [points, setPoints] = useState(quiz.pointsParQuestion);

  useEffect(() => {
    if (!open) return;
    if (question) {
      setType(question.type);
      setTexte(question.texte);
      setOptions(question.options);
      setBonneReponseIndex(question.bonneReponseIndex);
      setPoints(question.points);
    } else {
      setType('QCM');
      setTexte('');
      setOptions(['', '']);
      setBonneReponseIndex(0);
      setPoints(quiz.pointsParQuestion);
    }
  }, [open, question, quiz.pointsParQuestion]);

  function handleTypeChange(next: QuizQuestionType) {
    setType(next);
    if (next === 'VRAI_FAUX') {
      setOptions(['Vrai', 'Faux']);
      setBonneReponseIndex(0);
    } else {
      setOptions(['', '']);
      setBonneReponseIndex(0);
    }
  }

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOption() {
    if (options.length >= 4) return;
    setOptions((prev) => [...prev, '']);
  }
  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    if (bonneReponseIndex === i) setBonneReponseIndex(0);
    else if (bonneReponseIndex > i) setBonneReponseIndex((v) => v - 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = options.map((o) => o.trim());
    if (!texte.trim() || trimmed.some((o) => !o)) return;
    if (isEdit && question) {
      updateQuizQuestion(question, { type, texte: texte.trim(), options: trimmed, bonneReponseIndex, points }, actor);
      notify('Question mise à jour.');
    } else {
      addQuizQuestion({ quizId: quiz.id, centerId: quiz.centerId, type, texte: texte.trim(), options: trimmed, bonneReponseIndex, points, ordre: nextOrdre }, actor);
      notify('Question ajoutée.');
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifier la question' : 'Ajouter une question'} footer={<ModalActions onCancel={onClose} form="quiz-question-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}>
      <form id="quiz-question-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type de question</label>
          <div className="flex gap-sm">
            <button type="button" onClick={() => handleTypeChange('QCM')} className={`min-h-[44px] flex-1 rounded-lg border px-3 text-label-md font-medium transition-colors ${type === 'QCM' ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface-variant'}`}>
              QCM
            </button>
            <button type="button" onClick={() => handleTypeChange('VRAI_FAUX')} className={`min-h-[44px] flex-1 rounded-lg border px-3 text-label-md font-medium transition-colors ${type === 'VRAI_FAUX' ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface-variant'}`}>
              Vrai / Faux
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Question *</label>
          <textarea autoFocus required value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Options — sélectionnez la bonne réponse *</label>
          <div className="flex flex-col gap-sm">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="bonne-reponse"
                  checked={bonneReponseIndex === i}
                  onChange={() => setBonneReponseIndex(i)}
                  aria-label={`Option ${i + 1} correcte`}
                  className="h-5 w-5 shrink-0 accent-amud-primary"
                />
                <input
                  required
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  disabled={type === 'VRAI_FAUX'}
                  placeholder={`Option ${i + 1}`}
                  className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-70"
                  type="text"
                />
                {type === 'QCM' && options.length > 2 ? (
                  <button type="button" onClick={() => removeOption(i)} aria-label="Retirer l’option" className="rounded-lg p-2 text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-error">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                ) : null}
              </div>
            ))}
            {type === 'QCM' && options.length < 4 ? (
              <button type="button" onClick={addOption} className="self-start text-label-md font-medium text-amud-primary hover:underline">
                + Ajouter une option
              </button>
            ) : null}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Points</label>
          <input value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} className="min-h-[44px] w-full max-w-[140px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={1} />
        </div>
      </form>
    </Modal>
  );
}
