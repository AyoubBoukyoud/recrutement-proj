'use client';

import { useMemo, useState } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { teacherResourcesCollection } from '@/lib/amud/localTeacherResources';
import { teacherResourcesSeed } from '@/data/amud/teacherResources';
import { RESOURCE_CATEGORIES, type ResourceCategory } from '@/data/amud/centerTypes';

const CATEGORY_ICONS: Record<ResourceCategory, string> = {
  'PDF': 'picture_as_pdf',
  'Document': 'description',
  'Lien': 'link',
  'Exercice': 'assignment',
  'Vidéo': 'play_circle',
  'Support': 'slideshow',
};

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  'PDF': 'bg-amud-error-container text-amud-on-error-container',
  'Document': 'bg-amud-primary-container text-white',
  'Lien': 'bg-amud-secondary-container text-amud-on-secondary-container',
  'Exercice': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant',
  'Vidéo': 'bg-amud-surface-container-high text-amud-on-surface',
  'Support': 'bg-amud-surface-container-high text-amud-on-surface',
};

export default function TeacherResourcesPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [resources] = useCollection(teacherResourcesCollection, teacherResourcesSeed);

  const [filterCategory, setFilterCategory] = useState<ResourceCategory | ''>('');
  const [search, setSearch] = useState('');

  const teacher = teachers.find((t) => t.id === teacherId);

  // Ressources disponibles pour cet enseignant (globales ou ciblées)
  const myResources = useMemo(
    () => resources.filter((r) => !r.teacherId || r.teacherId === teacherId),
    [resources, teacherId],
  );

  const filtered = useMemo(() => {
    return myResources.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.titre.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q);
      const matchCat = !filterCategory || r.categorie === filterCategory;
      return matchSearch && matchCat;
    });
  }, [myResources, search, filterCategory]);

  // Comptage par catégorie
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    myResources.forEach((r) => { c[r.categorie] = (c[r.categorie] ?? 0) + 1; });
    return c;
  }, [myResources]);

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Ressources pédagogiques</h1>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-sm">
        <button
          onClick={() => setFilterCategory('')}
          className={`rounded-full border px-md py-1 text-label-md font-medium transition-colors ${!filterCategory ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface-variant hover:border-amud-primary hover:text-amud-primary'}`}
        >
          Tout ({myResources.length})
        </button>
        {RESOURCE_CATEGORIES.filter((c) => counts[c]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
            className={`flex items-center gap-1 rounded-full border px-md py-1 text-label-md font-medium transition-colors ${filterCategory === cat ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface-variant hover:border-amud-primary hover:text-amud-primary'}`}
          >
            <span className="material-symbols-outlined text-[16px]">{CATEGORY_ICONS[cat]}</span>
            {cat} ({counts[cat]})
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="search"
        placeholder="Rechercher une ressource…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-md py-sm text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
      />

      {/* Grille des ressources */}
      {filtered.length === 0 ? (
        <EmptyState icon="library_books" title="Aucune ressource" description="Aucune ressource ne correspond à votre recherche." />
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <div key={resource.id} className="flex flex-col rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-md flex items-start gap-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${CATEGORY_COLORS[resource.categorie]}`}>
                  <span className="material-symbols-outlined text-[20px]">{CATEGORY_ICONS[resource.categorie]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-label-sm text-amud-on-surface-variant">{resource.categorie}</span>
                  <p className="text-body-md font-semibold text-amud-on-surface leading-tight">{resource.titre}</p>
                </div>
              </div>
              {resource.description && (
                <p className="mb-md flex-1 text-label-sm text-amud-on-surface-variant">{resource.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <p className="text-label-sm text-amud-on-surface-variant">
                  {new Date(resource.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-amud-primary px-md py-1 text-label-sm font-medium text-amud-primary transition-colors hover:bg-amud-primary/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Ouvrir
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
