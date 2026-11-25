'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, SelectField, Tabs, TextareaField } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import type { PaginatedResponse } from '@/types/candidate';
import {
  CEFR_LEVELS,
  EXAM_SKILLS,
  SECTORS,
  SECTOR_LABELS,
  SKILL_LABELS,
  TASK_TYPE_LABELS,
  type BankItem,
  type CoverageTask,
  type ItemStatus,
  type LevelCoverage,
} from '@/lib/languageTestBank';

const STATUS_TABS: { key: ItemStatus; label: string }[] = [
  { key: 'draft', label: 'À relire' },
  { key: 'approved', label: 'Approuvés' },
  { key: 'retired', label: 'Retirés' },
];

const STATUS_BADGE: Record<ItemStatus, { tone: 'pending' | 'done' | 'neutral'; label: string }> = {
  draft: { tone: 'pending', label: 'Brouillon' },
  approved: { tone: 'done', label: 'Approuvé' },
  retired: { tone: 'neutral', label: 'Retiré' },
};

/**
 * Banque d'items du test de langue AMUD. Un examen par niveau : l'IA rédige
 * des brouillons pour chaque tâche du gabarit d'un niveau, un administrateur
 * les relit et les approuve — seul un item approuvé peut être présenté à un
 * candidat. Le tableau de couverture dit combien d'examens complets chaque
 * niveau peut déjà assembler.
 */
export default function AdminLanguageTestBank() {
  const [level, setLevel] = useState<string>('B1');
  const [status, setStatus] = useState<ItemStatus>('draft');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);

  const coverage = useQuery({
    queryKey: ['admin-language-test-coverage'],
    queryFn: () =>
      api.get('/admin/language-test-items/coverage').then((r) => r.data.levels as LevelCoverage[]),
  });

  const items = useQuery({
    queryKey: ['admin-language-test-items', level, status, skill, page],
    queryFn: () =>
      api
        .get('/admin/language-test-items', {
          params: { level: level || undefined, status, skill: skill || undefined, page },
        })
        .then((r) => r.data as PaginatedResponse<BankItem>),
  });

  const levelCoverage = coverage.data?.find((c) => c.level === level);

  return (
    <div className="mx-auto grid grid-cols-1 max-w-5xl gap-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Test de langue — banque d’items</h1>
        <p className="helper-text mt-1">
          Un examen différent par niveau (A1 à C2). L’IA rédige des brouillons, vous les relisez : seuls les items
          approuvés sont présentés aux candidats.
        </p>
      </header>

      <Tabs
        tabs={CEFR_LEVELS.map((l) => {
          const c = coverage.data?.find((x) => x.level === l);
          return { key: l, label: c ? `${l} · ${c.exams_possible}/${c.target_exams}` : l };
        })}
        active={level}
        onChange={(key) => {
          setLevel(key);
          setPage(1);
        }}
      />

      {coverage.isError && <Notice>{apiErrorMessage(coverage.error, 'Couverture indisponible.')}</Notice>}
      {levelCoverage && <CoverageCard coverage={levelCoverage} />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              size="compact"
              variant={status === tab.key ? 'primary' : 'ghost'}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-60">
          <SelectField
            label="Section"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes</option>
            {EXAM_SKILLS.map((s) => (
              <option key={s} value={s}>
                {SKILL_LABELS[s]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {items.isError && <Notice>{apiErrorMessage(items.error, 'Impossible de charger les items.')}</Notice>}
      {items.isSuccess && items.data.data.length === 0 && (
        <p className="helper-text">Aucun item ici. Générez des brouillons depuis le tableau ci-dessus.</p>
      )}

      <div className="grid gap-3">
        {items.data?.data.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>

      <Pagination page={page} data={items.data} onPage={setPage} noun="item" language="fr" />
    </div>
  );
}

function CoverageCard({ coverage }: { coverage: LevelCoverage }) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Examen {coverage.level}</h2>
        <span className="helper-text">
          {coverage.exams_possible} examen(s) complet(s) possible(s) — objectif {coverage.target_exams}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-left text-on-surface-variant">
              <th className="py-1.5 pr-3 font-medium">Section</th>
              <th className="py-1.5 pr-3 font-medium">Tâche</th>
              <th className="py-1.5 pr-3 font-medium">Approuvés</th>
              <th className="py-1.5 pr-3 font-medium">À relire</th>
              <th className="py-1.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {coverage.tasks.map((task) => (
              <CoverageRow key={`${task.skill}-${task.task_type}`} level={coverage.level} task={task} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CoverageRow({ level, task }: { level: string; task: CoverageTask }) {
  const [sector, setSector] = useState('general');
  const [message, setMessage] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: () =>
      api.post('/admin/language-test-items/generate', {
        level,
        skill: task.skill,
        task_type: task.task_type,
        sector,
        count: 1,
      }),
    onSuccess: () => setMessage('Brouillon en cours de rédaction — rechargez dans une minute.'),
    onError: (e) => setMessage(apiErrorMessage(e, 'Génération impossible.')),
  });

  const short = task.approved < task.target;

  return (
    <tr className="border-t border-outline-variant align-top">
      <td className="py-2 pr-3">{SKILL_LABELS[task.skill]}</td>
      <td className="py-2 pr-3">{TASK_TYPE_LABELS[task.task_type] ?? task.task_type}</td>
      <td className="py-2 pr-3">
        <Badge tone={short ? 'pending' : 'done'}>
          {task.approved}/{task.target}
        </Badge>
      </td>
      <td className="py-2 pr-3">{task.draft}</td>
      <td className="py-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            aria-label="Thème"
            className="h-9 rounded-element border border-outline-variant bg-surface-lowest px-2 text-[13px]"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABELS[s]}
              </option>
            ))}
          </select>
          <Button size="compact" variant="ghost" disabled={generate.isPending} onClick={() => generate.mutate()}>
            Générer
          </Button>
        </div>
        {message && <p className="helper-text mt-1 text-right">{message}</p>}
      </td>
    </tr>
  );
}

function ItemCard({ item }: { item: BankItem }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioInput = useRef<HTMLInputElement>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-language-test-items'] });
    qc.invalidateQueries({ queryKey: ['admin-language-test-coverage'] });
  };

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/language-test-items/${item.id}`, body),
    onSuccess: () => {
      setError(null);
      setEditing(false);
      refresh();
    },
    onError: (e) => setError(apiErrorMessage(e, 'Enregistrement impossible.')),
  });

  const synthesize = useMutation({
    mutationFn: () => api.post(`/admin/language-test-items/${item.id}/audio/synthesize`),
    onSuccess: refresh,
    onError: (e) => setError(apiErrorMessage(e, 'Synthèse vocale indisponible.')),
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('audio', file);
      return api.post(`/admin/language-test-items/${item.id}/audio`, form);
    },
    onSuccess: refresh,
    onError: (e) => setError(apiErrorMessage(e, 'Envoi du fichier impossible.')),
  });

  const badge = STATUS_BADGE[item.status];
  const busy = update.isPending || synthesize.isPending || upload.isPending;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{item.cefr_level}</Badge>
            <Badge tone="neutral">{SKILL_LABELS[item.skill]}</Badge>
            <Badge tone="neutral">{TASK_TYPE_LABELS[item.task_type] ?? item.task_type}</Badge>
            {item.sector !== 'general' && <Badge tone="neutral">{SECTOR_LABELS[item.sector] ?? item.sector}</Badge>}
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <span className="font-bold">
            #{item.id} {item.title}
          </span>
          {item.reviewer && (
            <span className="helper-text">
              Relu par {item.reviewer.name}
              {item.reviewed_at ? ` le ${new Date(item.reviewed_at).toLocaleDateString('fr-FR')}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="compact" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Masquer' : 'Relire'}
          </Button>
          {item.status !== 'approved' && (
            <Button
              size="compact"
              disabled={busy || item.problems.length > 0}
              onClick={() => update.mutate({ status: 'approved' })}
            >
              Approuver
            </Button>
          )}
          {item.status !== 'retired' && (
            <Button size="compact" variant="danger" disabled={busy} onClick={() => update.mutate({ status: 'retired' })}>
              Retirer
            </Button>
          )}
          {item.status === 'retired' && (
            <Button size="compact" variant="ghost" disabled={busy} onClick={() => update.mutate({ status: 'draft' })}>
              Remettre en brouillon
            </Button>
          )}
        </div>
      </div>

      {item.problems.length > 0 && (
        <div className="mt-3">
          <Notice tone="pending">
            <ul className="list-disc pl-5">
              {item.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Notice>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Notice>{error}</Notice>
        </div>
      )}

      {open && (
        <div className="mt-4 grid gap-4">
          {item.skill === 'listening' && (
            <div className="grid gap-2 rounded-element border border-outline-variant p-3">
              <span className="text-[13px] font-semibold">Audio ({item.content.plays ?? 1} écoute(s) autorisée(s))</span>
              {item.audio_url ? (
                <audio controls preload="none" src={item.audio_url} className="w-full" />
              ) : (
                <p className="helper-text">Pas encore d’audio — obligatoire avant approbation.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="compact" variant="ghost" disabled={busy} onClick={() => synthesize.mutate()}>
                  {item.has_audio ? 'Regénérer la voix' : 'Générer la voix'}
                </Button>
                <Button size="compact" variant="ghost" disabled={busy} onClick={() => audioInput.current?.click()}>
                  Téléverser un enregistrement
                </Button>
                <input
                  ref={audioInput}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          )}

          {editing ? (
            <ItemEditor item={item} busy={update.isPending} onSave={(body) => update.mutate(body)} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <ItemPreview item={item} />
              <div>
                <Button size="compact" variant="ghost" onClick={() => setEditing(true)}>
                  Corriger le contenu
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/** L'item tel qu'un relecteur doit le voir : texte, questions, bonne réponse et justification. */
function ItemPreview({ item }: { item: BankItem }) {
  const c = item.content;
  const key = item.answer_key ?? {};

  return (
    <div className="grid gap-3 text-[14px] leading-6">
      {c.stimulus && <p className="whitespace-pre-line rounded-element bg-surface-container p-3">{c.stimulus}</p>}
      {c.script && (
        <div className="grid gap-1 rounded-element bg-surface-container p-3">
          <span className="eyebrow">Script (jamais montré au candidat)</span>
          {c.script.map((line, i) => (
            <p key={i}>
              <strong>{line.speaker} :</strong> {line.text}
            </p>
          ))}
        </div>
      )}
      {c.text && <p className="whitespace-pre-line rounded-element bg-surface-container p-3">{c.text}</p>}
      {c.situation && (
        <div className="grid gap-1 rounded-element bg-surface-container p-3">
          <p>{c.situation}</p>
          {c.instructions && <p className="font-semibold">{c.instructions}</p>}
          {c.points && (
            <ul className="list-disc pl-5">
              {c.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <p className="helper-text">
            {c.min_words ? `${c.min_words}–${c.max_words} mots attendus` : null}
            {c.answer_seconds ? `${c.prep_seconds}s de préparation, ${c.answer_seconds}s de réponse` : null}
          </p>
        </div>
      )}
      {c.options && c.options.length > 0 && (
        <div>
          <span className="eyebrow">Options communes</span>
          <ul className="mt-1 grid gap-1">
            {c.options.map((o) => (
              <li key={o.id}>
                <strong>{o.id})</strong> {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {c.questions && (
        <ol className="grid gap-2">
          {c.questions.map((q) => (
            <li key={q.id} className="rounded-element border border-outline-variant p-3">
              <p className="font-semibold">
                {q.id}. {q.prompt}
              </p>
              {q.options && (
                <ul className="mt-1 grid gap-0.5">
                  {q.options.map((o) => (
                    <li key={o.id} className={key[q.id] === o.id ? 'font-semibold text-primary' : undefined}>
                      {key[q.id] === o.id ? '✓ ' : ''}
                      {o.id}) {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {!q.options && <p className="text-primary">Réponse : {String(key[q.id] ?? '—')}</p>}
              {c.explanations?.[q.id] && <p className="helper-text mt-1">{c.explanations[q.id]}</p>}
            </li>
          ))}
        </ol>
      )}
      {c.fields && (
        <ul className="grid gap-1">
          {c.fields.map((f) => (
            <li key={f.id}>
              <strong>{f.label} :</strong> {([] as string[]).concat(key[f.id] ?? []).join(' / ') || '—'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Correction directe du JSON — pour une faute de frappe ou une mauvaise réponse, pas pour réécrire l'item. */
function ItemEditor({
  item,
  busy,
  onSave,
  onCancel,
}: {
  item: BankItem;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title ?? '');
  const [content, setContent] = useState(JSON.stringify(item.content, null, 2));
  const [answerKey, setAnswerKey] = useState(JSON.stringify(item.answer_key, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const save = () => {
    try {
      onSave({ title, content: JSON.parse(content), answer_key: JSON.parse(answerKey) });
      setParseError(null);
    } catch {
      setParseError('JSON invalide — vérifiez les guillemets et les virgules.');
    }
  };

  return (
    <div className="grid gap-3">
      <TextareaField label="Titre" rows={1} value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextareaField
        label="Contenu (JSON)"
        rows={14}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <TextareaField
        label="Corrigé (JSON)"
        rows={6}
        value={answerKey}
        onChange={(e) => setAnswerKey(e.target.value)}
      />
      {parseError && <Notice>{parseError}</Notice>}
      <div className="flex gap-2">
        <Button size="compact" disabled={busy} onClick={save}>
          Enregistrer
        </Button>
        <Button size="compact" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
