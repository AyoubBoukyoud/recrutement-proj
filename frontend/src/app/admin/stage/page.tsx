'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { Button, Card, Notice } from '@/components/ui';
import type { PaginatedResponse } from '@/types/candidate';

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: 'language' | 'documents' | 'culture' | 'admin' | 'other';
  estimated_minutes: number;
  is_active: boolean;
  assignments_count: number;
};

const CATEGORY_LABEL: Record<Task['category'], string> = {
  language: 'Langue',
  documents: 'Documents',
  culture: 'Culture',
  admin: 'Administratif',
  other: 'Autre',
};

const EMPTY_FORM = { title: '', description: '', category: 'other' as Task['category'], estimated_minutes: '30' };

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? 'Action impossible.';
  }
  return 'Action impossible.';
}

export default function AdminStagePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Task | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tasks = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => api.get('/admin/tasks', { params: { include_inactive: true, per_page: 100 } }).then((response) => response.data as PaginatedResponse<Task>),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        estimated_minutes: Number(form.estimated_minutes),
      };
      return editing ? api.patch(`/admin/tasks/${editing.id}`, payload) : api.post('/admin/tasks', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      setForm(EMPTY_FORM);
      setEditing(null);
      setError(null);
      setMessage('Activité enregistrée.');
    },
    onError: (reason) => setError(errorMessage(reason)),
  });

  const changeStatus = useMutation({
    mutationFn: ({ task, is_active }: { task: Task; is_active: boolean }) => api.patch(`/admin/tasks/${task.id}`, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      setMessage('Statut de l’activité mis à jour.');
    },
    onError: (reason) => setError(errorMessage(reason)),
  });

  function edit(task: Task) {
    setEditing(task);
    setForm({ title: task.title, description: task.description ?? '', category: task.category, estimated_minutes: String(task.estimated_minutes) });
    setMessage(null);
    setError(null);
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Stage quotidien</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Catalogue des activités</h1>
          <p className="helper-text mt-1">Créez les activités puis assignez-les depuis la fiche d’un candidat.</p>
        </div>
        <Link href="/admin/candidats" className="text-sm font-bold text-primary hover:underline">Voir les candidats à accompagner →</Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-bold">{editing ? 'Modifier l’activité' : 'Nouvelle activité'}</h2>
            <p className="helper-text mt-1">Une activité peut être réutilisée pour plusieurs candidats.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="grid gap-4">
            <label className="grid gap-1.5"><span className="text-sm font-semibold text-on-surface-variant">Titre</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-11 rounded-lg border border-outline bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" /></label>
            <label className="grid gap-1.5"><span className="text-sm font-semibold text-on-surface-variant">Description</span><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="resize-y rounded-lg border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-on-surface-variant">Catégorie</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Task['category'] })} className="h-11 rounded-lg border border-outline bg-surface px-2 text-sm text-on-surface outline-none focus:border-primary">{Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-on-surface-variant">Durée (min)</span><input required min={5} max={480} type="number" value={form.estimated_minutes} onChange={(event) => setForm({ ...form, estimated_minutes: event.target.value })} className="h-11 rounded-lg border border-outline bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" /></label>
            </div>
            {error && <Notice>{error}</Notice>}
            {message && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
            <div className="flex gap-2"><Button type="submit" disabled={save.isPending || !form.title.trim()}>{save.isPending ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer l’activité'}</Button>{editing && <Button type="button" variant="ghost" onClick={reset}>Annuler</Button>}</div>
          </form>
        </Card>

        <section className="grid content-start gap-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Activités existantes</h2><span className="text-sm text-on-surface-variant">{tasks.data?.total ?? 0} activité(s)</span></div>
          {tasks.isError && <Notice>Impossible de charger le catalogue.</Notice>}
          {tasks.isLoading && <p className="helper-text">Chargement…</p>}
          {!tasks.isLoading && tasks.data?.data.length === 0 && <Card><p className="text-sm text-on-surface-variant">Aucune activité. Créez la première à gauche.</p></Card>}
          {tasks.data?.data.map((task) => (
            <Card key={task.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-on-surface">{task.title}</h3><span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">{CATEGORY_LABEL[task.category]}</span>{!task.is_active && <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">Retirée</span>}</div>{task.description && <p className="mt-2 text-sm leading-6 text-on-surface-variant">{task.description}</p>}<p className="mt-2 text-xs text-outline">{task.estimated_minutes} min · {task.assignments_count} assignation(s)</p></div>
                <div className="flex shrink-0 gap-2"><Button variant="ghost" size="compact" onClick={() => edit(task)}>Modifier</Button><Button variant={task.is_active ? 'ghost' : 'primary'} size="compact" onClick={() => changeStatus.mutate({ task, is_active: !task.is_active })} disabled={changeStatus.isPending}>{task.is_active ? 'Retirer' : 'Réactiver'}</Button></div>
              </div>
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
}
