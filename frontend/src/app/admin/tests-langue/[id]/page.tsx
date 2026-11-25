'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, SelectField, TextareaField } from '@/components/ui';
import { CEFR_LEVELS, SKILL_LABELS, TASK_TYPE_LABELS } from '@/lib/languageTestBank';
import {
  CRITERION_LABELS,
  FLAG_LABELS,
  GUARD_LABELS,
  OUTCOME_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type ReviewDetail,
  type ReviewResponse,
} from '@/lib/languageTestReview';

const SKILLS = ['reading', 'listening', 'writing', 'speaking'] as const;
const SKILL_NAMES: Record<(typeof SKILLS)[number], string> = {
  reading: 'Lecture',
  listening: 'Écoute',
  writing: 'Écriture',
  speaking: 'Expression orale',
};

/**
 * Un examen de langue en détail : chaque réponse, chaque enregistrement, les
 * preuves citées par l'IA et le journal d'intégrité — puis la décision.
 * Les résultats sont publiés automatiquement ; les corrections mettent à jour
 * le profil et la confirmation du certificat.
 */
export default function AdminLanguageTestDetail() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['admin-language-test', id],
    queryFn: () => api.get(`/admin/language-tests/${id}`).then((r) => r.data as ReviewDetail),
  });

  if (q.isError) return <Notice>{apiErrorMessage(q.error, 'Examen introuvable.')}</Notice>;
  if (!q.data) return <div className="mx-auto h-40 max-w-5xl animate-pulse rounded-card bg-surface-container sm:m-6" />;

  const t = q.data;
  const bySection = (s: ReviewResponse['section']) => t.responses.filter((r) => r.section === s);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:p-6">
      <Link href="/admin/tests-langue" className="text-sm font-semibold text-primary hover:underline">
        ← Examens de langue
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h1 className="text-2xl font-bold">{t.candidate.name ?? 'Candidat'}</h1>
            <span className="helper-text">
              {t.candidate.profession ?? '—'} · {t.candidate.phone}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone="neutral">
                Examen {t.exam_level} — niveau {SOURCE_LABELS[t.level_source]}
              </Badge>
              {t.oral_level && t.oral_level !== t.exam_level && <Badge tone="pending">Oral passé au niveau {t.oral_level}</Badge>}
              <Badge tone={t.status === 'validated' ? 'done' : 'pending'}>{STATUS_LABELS[t.status]}</Badge>
              {t.candidate_language?.certificate_document_id && (
                <Badge tone="neutral">Certificat {t.candidate_language.cefr_level} sur le profil</Badge>
              )}
            </div>
          </div>
          <div className="grid justify-items-end gap-0.5 text-end">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {t.final_cefr ? 'Résultat publié' : 'Estimation IA'}
            </span>
            <span className="text-4xl font-bold text-primary">{t.final_cefr ?? t.ai_cefr ?? '—'}</span>
            {t.outcome && <span className="helper-text">{OUTCOME_LABELS[t.outcome]}</span>}
          </div>
        </div>

        {t.skill_scores && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SKILLS.map((s) => {
              const score = t.skill_scores?.[s];
              return (
                <div key={s} className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{SKILL_NAMES[s]}</span>
                    <span className="font-bold">
                      {score === null || score === undefined ? 'non noté' : `${t.skill_results?.[s] ?? ''} · ${score}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${score ?? 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {t.summary?.speaking_parts && (
          <p className="helper-text mt-2">
            Oral : lecture à voix haute {t.summary.speaking_parts.read_aloud ?? '—'}% · oral caméra {t.summary.speaking_parts.oral ?? '—'}% (niveau{' '}
            {t.summary.speaking_parts.oral_level})
          </p>
        )}
      </Card>

      {(t.needs_attention || (t.integrity?.flags?.length ?? 0) > 0) && (
        <Notice tone="pending">
          <p className="font-semibold">Signaux de l’examen</p>
          <ul className="mt-1 list-disc pl-5">
            {(t.integrity?.flags ?? []).map((f) => (
              <li key={f}>{FLAG_LABELS[f] ?? f}</li>
            ))}
            {(t.integrity?.tab_hidden ?? 0) > 0 && <li>{t.integrity?.tab_hidden} changement(s) d’onglet pendant l’examen</li>}
            {(t.integrity?.paste_blocked ?? 0) > 0 && <li>{t.integrity?.paste_blocked} tentative(s) de collage</li>}
            {(t.integrity?.too_fast ?? []).map((s) => (
              <li key={s}>Section {SKILL_LABELS[s as keyof typeof SKILL_LABELS] ?? s} terminée très vite avec un bon score</li>
            ))}
          </ul>
        </Notice>
      )}

      <Decision test={t} />

      <Section title="Oral face caméra" responses={bySection('oral')} />
      <Section title="Écriture" responses={bySection('writing')} />
      <Section title="Lecture à voix haute" responses={bySection('read_aloud')} />
      <Section title="Lecture" responses={bySection('reading')} />
      <Section title="Écoute" responses={bySection('listening')} />
    </div>
  );
}

function Decision({ test }: { test: ReviewDetail }) {
  const qc = useQueryClient();
  const [level, setLevel] = useState<string>(test.final_cefr ?? test.ai_cefr ?? '');
  const [skills, setSkills] = useState<Record<string, string>>(() => Object.fromEntries(SKILLS.map((s) => [s, test.skill_results?.[s] ?? ''])));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-language-test', String(test.id)] });
    qc.invalidateQueries({ queryKey: ['admin-language-tests'] });
  };
  const correct = useMutation({
    mutationFn: () => api.patch(`/admin/language-tests/${test.id}/result`, { final_cefr: level || null, skill_results: Object.fromEntries(Object.entries(skills).map(([s, l]) => [s, l || null])), note }),
    onSuccess: () => {
      setError(null);
      setDone(`Résultat corrigé : ${level || 'niveau non démontré'}. Le profil a été mis à jour.`);
      setNote('');
      refresh();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Correction impossible.')),
  });
  const approve = useMutation({
    mutationFn: () => api.post(`/admin/language-tests/${test.id}/approve`, { note: note.trim() || null }),
    onSuccess: () => {
      setError(null);
      setDone(`Résultat publié : ${test.ai_cefr ?? 'niveau non démontré'}. Le profil a été mis à jour.`);
      setNote('');
      refresh();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Validation impossible.')),
  });
  const annul = useMutation({
    mutationFn: () => api.post(`/admin/language-tests/${test.id}/annul`, { note }),
    onSuccess: () => {
      setError(null);
      setDone('Examen annulé et résultat retiré du profil.');
      refresh();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Annulation impossible.')),
  });

  if (!['validated', 'failed', 'awaiting_review'].includes(test.status)) {
    return <Card><p className="helper-text">{test.status === 'abandoned' ? `Examen annulé : ${test.review_note ?? ''}` : 'L’examen n’est pas encore terminé.'}</p></Card>;
  }
  const busy = correct.isPending || annul.isPending || approve.isPending;
  const reviewing = test.status === 'awaiting_review';
  return (
    <Card>
      <h2 className="mb-2 text-lg font-bold">{reviewing ? 'Valider le résultat' : 'Corriger le résultat'}</h2>
      {reviewing ? (
        <p className="helper-text mb-4">
          Les résultats B2 et plus ne sont pas publiés sans validation : l’IA sous-estime souvent ces niveaux à l’écrit. Lisez les productions écrites et
          écoutez l’oral, puis validez l’estimation de l’IA ({test.ai_cefr ?? 'niveau non démontré'}) ou corrigez-la. Le candidat et les recruteurs ne
          voient rien avant votre décision.
        </p>
      ) : (
        <p className="helper-text mb-4">Les résultats complets sont publiés automatiquement. Intervenez uniquement si une correction est nécessaire.</p>
      )}
      <p className="helper-text mb-4">Le niveau final correspond à la compétence la plus faible. Corrigez aussi les compétences concernées.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Niveau final" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
          <option value="">Niveau non démontré</option>
          {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}{l === test.ai_cefr ? ' (IA)' : ''}</option>)}
        </SelectField>
        {SKILLS.map((s) => (
          <SelectField key={s} label={SKILL_NAMES[s]} value={skills[s]} onChange={(e) => setSkills((prev) => ({ ...prev, [s]: e.target.value }))}>
            <option value="">Non démontré / non évalué</option>
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </SelectField>
        ))}
      </div>
      <div className="mt-3"><TextareaField label={reviewing ? 'Note (facultative pour valider, obligatoire pour corriger ou annuler)' : 'Motif de la correction ou de l’annulation (obligatoire)'} rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
      {test.review_note && <p className="helper-text mt-2">Dernière intervention : {test.review_note}</p>}
      {error && <div className="mt-3"><Notice>{error}</Notice></div>}
      {done && <p className="mt-3 text-sm font-semibold text-primary">{done}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {reviewing && (
          <Button disabled={busy} onClick={() => approve.mutate()}>
            Valider l’estimation de l’IA ({test.ai_cefr ?? 'non démontré'})
          </Button>
        )}
        <Button variant={reviewing ? 'ghost' : undefined} disabled={busy || !note.trim() || (level ? SKILLS.some((s) => !skills[s]) : SKILLS.every((s) => !!skills[s]))} onClick={() => correct.mutate()}>{reviewing ? 'Publier le niveau corrigé' : 'Enregistrer la correction'}</Button>
        <Button variant="danger" disabled={busy || !note.trim()} onClick={() => annul.mutate()}>Annuler l’examen</Button>
      </div>
    </Card>
  );
}

function Section({ title, responses }: { title: string; responses: ReviewResponse[] }) {
  if (responses.length === 0) return null;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="grid gap-4">
        {responses.map((r) => (
          <ResponseView key={r.id} r={r} />
        ))}
      </div>
    </Card>
  );
}

function ResponseView({ r }: { r: ReviewResponse }) {
  const e = r.evaluation ?? {};
  const c = r.item.content;
  const key = r.item.answer_key ?? {};

  return (
    <div className="grid gap-3 rounded-element border border-outline-variant p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">
          {TASK_TYPE_LABELS[r.item.task_type] ?? r.item.task_type} — {r.item.title}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {e.guard && <Badge tone="error">{GUARD_LABELS[e.guard] ?? e.guard}</Badge>}
          {e.error && <Badge tone="error">Correction impossible ({e.error})</Badge>}
          {e.disagreement && <Badge tone="pending">IA : {e.run_scores?.join(' / ')}</Badge>}
          <Badge tone={r.score === null ? 'neutral' : r.score >= 60 ? 'done' : 'pending'}>
            {r.score === null ? 'non noté' : `${r.score}%`}
            {e.total ? ` (${e.correct}/${e.total})` : ''}
          </Badge>
        </div>
      </div>

      {(c.situation || c.text || c.stimulus || c.script?.length) && (
        <div className="rounded-element bg-surface-container p-3 text-sm" dir="ltr" lang="de">
          {c.stimulus && <p className="whitespace-pre-line">{c.stimulus}</p>}
          {c.script?.map((line, i) => <p key={i}><strong>{line.speaker} :</strong> {line.text}</p>)}
          {c.situation && <p>{c.situation}</p>}
          {c.instructions && <p className="mt-1 font-semibold">{c.instructions}</p>}
          {c.points && <p className="mt-1 helper-text">{c.points.join(' · ')}</p>}
          {c.text && <p className="whitespace-pre-line">{c.text}</p>}
        </div>
      )}

      {r.item.audio_url && <audio aria-label="Énoncé de l’écoute" controls preload="none" src={r.item.audio_url} className="w-full" />}
      {r.video_url && <video controls preload="metadata" src={r.video_url} className="w-full max-w-md rounded-element bg-black" />}
      {r.audio_url && <audio controls preload="none" src={r.audio_url} className="w-full" />}
      {r.revealed_at && r.time_ms !== null && (
        <span className="helper-text">Réponse envoyée {Math.round(r.time_ms / 1000)} s après l’apparition de la situation.</span>
      )}

      {r.answer?.text && (
        <p className="whitespace-pre-line rounded-element border border-outline-variant p-3 text-sm" dir="ltr" lang="de">
          {r.answer.text}
        </p>
      )}
      {e.transcript && !e.runs?.length && (
        <div className="text-sm">
          <span className="eyebrow">Transcription</span>
          <p className="mt-1" dir="ltr" lang="de">
            {e.transcript}
          </p>
        </div>
      )}
      {e.accuracy !== undefined && (
        <p className="helper-text">
          Mots lus correctement : {e.accuracy}% · clarté : {e.clarity ?? '—'}%
          {e.missed_words?.length ? ` · manqués : ${e.missed_words.slice(0, 10).join(', ')}` : ''}
        </p>
      )}

      {e.runs?.length ? e.runs.map((run, i) => (
        <details key={i} open={e.disagreement} className="rounded-element border border-outline-variant p-3">
          <summary className="cursor-pointer text-sm font-semibold">Correction IA {i + 1} · {run.score}%</summary>
          {run.transcript && <p className="my-2 whitespace-pre-line text-sm" dir="ltr" lang="de">{run.transcript}</p>}
          {(run.on_topic === false || run.language_ok === false || run.speech_present === false) && <p className="text-sm text-error">{run.on_topic === false ? 'Hors sujet. ' : ''}{run.language_ok === false ? 'Langue incorrecte. ' : ''}{run.speech_present === false ? 'Parole insuffisante.' : ''}</p>}
          <GradeEvidence criteria={run.criteria} />
        </details>
      )) : e.criteria && <GradeEvidence criteria={e.criteria} />}
      {c.options && c.options.length > 0 && <ul className="grid gap-1 text-sm" dir="ltr" lang="de">{c.options.map((o) => <li key={o.id}><strong>{o.id}.</strong> {o.label}</li>)}</ul>}

      {c.questions && (
        <ol className="grid gap-1 text-sm" dir="ltr" lang="de">
          {c.questions.map((q) => {
            const given = r.answer?.answers?.[q.id];
            const right = e.detail?.[q.id];
            const options = q.options?.length ? q.options : c.options ?? [];
            const label = (id?: string) => options.find((o) => o.id === id)?.label ?? id ?? '—';
            return (
              <li key={q.id} className={right ? 'text-on-surface' : 'text-error'}>
                {right ? '✓' : '✗'} {q.prompt} — réponse : {label(given)}
                <span className="helper-text"> (attendu : {label(key[q.id] as string)})</span>
                {q.options?.length ? <ul className="ms-4">{q.options.map((o) => <li key={o.id}>{o.id}. {o.label}</li>)}</ul> : null}
                {c.explanations?.[q.id] && <p className="helper-text">{c.explanations[q.id]}</p>}
              </li>
            );
          })}
        </ol>
      )}
      {c.fields && (
        <ul className="grid gap-1 text-sm">
          {c.fields.map((f) => (
            <li key={f.id} className={e.detail?.[f.id] ? '' : 'text-error'}>
              {e.detail?.[f.id] ? '✓' : '✗'} {f.label} : {r.answer?.fields?.[f.id] || '—'}
              {!e.detail?.[f.id] && <span className="helper-text"> (attendu : {([] as string[]).concat(key[f.id] ?? []).join(' / ')})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GradeEvidence({ criteria }: { criteria: NonNullable<NonNullable<ReviewResponse['evaluation']>['criteria']> }) {
  return <div className="grid gap-2">{Object.entries(criteria).map(([name, g]) => (
    <div key={name} className="text-sm">
      <div className="flex justify-between"><span className="font-medium">{CRITERION_LABELS[name] ?? name}</span><span className="font-bold">{g.level && <span className="me-2 font-medium text-on-surface-variant">{g.level === 'below_A1' ? '< A1' : g.level}</span>}{g.score}%</span></div>
      {g.comment && <p className="helper-text">{g.comment}</p>}
      {g.evidence.length > 0 && <p className="helper-text italic" dir="ltr" lang="de">« {g.evidence.join(' » · « ')} »</p>}
    </div>
  ))}</div>;
}
