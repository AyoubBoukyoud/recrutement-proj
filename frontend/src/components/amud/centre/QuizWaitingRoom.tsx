'use client';

/** Salle d'attente avant de commencer à répondre (cahier des charges §29) — plein écran, mobile first. */
export function QuizWaitingRoom({
  quizTitle,
  formationName,
  groupName,
  teacherName,
  participantsCount,
  onStart,
}: {
  quizTitle: string;
  formationName?: string;
  groupName?: string;
  teacherName?: string;
  participantsCount: number;
  onStart: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-lg bg-amud-surface p-lg text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amud-primary/10 text-amud-primary">
        <span className="material-symbols-outlined text-[32px]">quiz</span>
      </span>
      <div>
        <p className="text-title-lg text-amud-on-surface-variant">Quiz prêt</p>
        <h1 className="text-headline-md font-semibold text-amud-on-surface">{quizTitle}</h1>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">{[formationName, groupName, teacherName].filter(Boolean).join(' · ')}</p>
      </div>
      <p className="text-label-lg text-amud-on-surface-variant">{participantsCount} participant(s) ont rejoint</p>
      <button onClick={onStart} className="min-h-[52px] w-full max-w-xs rounded-lg bg-amud-primary text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
        Commencer
      </button>
    </div>
  );
}
