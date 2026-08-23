'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, CountUp, useDropdown } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed, STATUT_CLASS } from '@/data/amud/offres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, KANBAN_COLUMNS, colonneForStatus, type ColonneId, type Application } from '@/data/amud/applications';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { publishOffer, pauseOffer, reactivateOffer, archiveOffer, deleteOffer, duplicateOffer } from '@/lib/amud/offerCascades';
import { changeApplicationStatus } from '@/lib/amud/applicationCascades';

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseOffreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const menu = useDropdown<HTMLDivElement>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragCard, setDragCard] = useState<{ id: string; from: ColonneId } | null>(null);
  const viewCounted = useRef(false);

  const offre = offres.find((o) => o.id === params.id && o.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
  const offerApplications = useMemo(() => applications.filter((a) => a.offerId === params.id), [applications, params.id]);

  useEffect(() => {
    if (viewCounted.current || !offre) return;
    viewCounted.current = true;
    offresCollection.update(offre.id, { vues: (offre.vues ?? 0) + 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offre?.id]);

  const colonnes = useMemo(() => {
    const out = {} as Record<ColonneId, Application[]>;
    for (const col of KANBAN_COLUMNS) out[col.id] = offerApplications.filter((a) => colonneForStatus(a.status) === col.id);
    return out;
  }, [offerApplications]);

  function moveCard(app: Application, to: ColonneId) {
    if (app.status === to) return;
    changeApplicationStatus(app, to);
  }

  if (!offre) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Offre introuvable.</p>
        <Link href="/amud/entreprise/offres" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux offres
        </Link>
      </div>
    );
  }

  const accepted = offerApplications.filter((a) => a.status === 'ACCEPTED').length;
  const conversion = offerApplications.length > 0 ? Math.round((accepted / offerApplications.length) * 100) : 0;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-start justify-between gap-md">
        <div>
          <Link href="/amud/entreprise/offres" className="mb-2 flex items-center gap-1 text-label-sm text-amud-on-surface-variant hover:text-amud-primary">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Offres
          </Link>
          <h2 className="text-headline-lg text-amud-on-surface">{offre.titre}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-sm text-label-sm text-amud-on-surface-variant">
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUT_CLASS[offre.statut]}`}>{offre.statut}</span>
            <span>{offre.localisation ?? offre.ville}</span>
            <span>·</span>
            <span>{offre.contrat}</span>
          </div>
        </div>
        <div ref={menu.ref} className="relative">
          <button onClick={() => menu.setOpen((v) => !v)} className="flex items-center gap-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
            Actions <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          {menu.open ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface py-1 shadow-lg animate-amud-fade-in">
              <Link href={`/amud/entreprise/offres/${offre.id}/modifier`} onClick={() => menu.setOpen(false)} className="block px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                Modifier
              </Link>
              <button
                onClick={() => {
                  const copie = duplicateOffer(offre);
                  notify(`« ${offre.titre} » dupliquée.`);
                  menu.setOpen(false);
                  router.push(`/amud/entreprise/offres/${copie.id}/modifier`);
                }}
                className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
              >
                Dupliquer
              </button>
              {offre.statut !== 'Publiée' ? (
                <button
                  onClick={() => {
                    publishOffer(offre);
                    notify('Offre publiée.');
                    menu.setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                >
                  Publier
                </button>
              ) : (
                <button
                  onClick={() => {
                    pauseOffer(offre);
                    notify('Offre mise en pause.');
                    menu.setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                >
                  Mettre en pause
                </button>
              )}
              {offre.statut === 'En pause' || offre.statut === 'Expirée' ? (
                <button
                  onClick={() => {
                    reactivateOffer(offre);
                    notify('Offre réactivée.');
                    menu.setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                >
                  Réactiver
                </button>
              ) : null}
              {offre.statut !== 'Archivée' ? (
                <button
                  onClick={() => {
                    archiveOffer(offre);
                    notify('Offre archivée.');
                    menu.setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                >
                  Archiver
                </button>
              ) : null}
              <button
                onClick={() => {
                  setConfirmDelete(true);
                  menu.setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
              >
                Supprimer
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {[
          { label: 'Vues', value: offre.vues ?? 0, icon: 'visibility' },
          { label: 'Candidatures', value: offerApplications.length, icon: 'group' },
          { label: 'Acceptées', value: accepted, icon: 'check_circle' },
          { label: 'Conversion', value: conversion, icon: 'trending_up', suffix: '%' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
            <span className="material-symbols-outlined text-amud-primary">{k.icon}</span>
            <div className="mt-1 text-headline-md font-bold text-amud-on-surface">
              <CountUp value={k.value} />
              {k.suffix ?? ''}
            </div>
            <div className="text-label-sm text-amud-on-surface-variant">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Informations</h3>
        <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Département</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.departement ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Secteur</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.secteur ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Niveau d’études</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.niveauEtudes ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Expérience</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.niveauExperience ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Salaire</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.salaireMin || offre.salaireMax ? `${offre.salaireMin ?? '?'} – ${offre.salaireMax ?? '?'} MAD` : '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Télétravail</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.teletravail ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Publication</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.publication}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Expiration</dt>
            <dd className="text-body-md text-amud-on-surface">{offre.dateExpiration ?? '—'}</dd>
          </div>
        </dl>
        {offre.description ? (
          <div className="mt-md border-t border-amud-outline-variant pt-md">
            <dt className="text-label-sm text-amud-on-surface-variant">Description</dt>
            <p className="mt-1 whitespace-pre-line text-body-md text-amud-on-surface">{offre.description}</p>
          </div>
        ) : null}
        {(offre.competences?.length || offre.langues?.length || offre.softSkills?.length) ? (
          <div className="mt-md flex flex-wrap gap-xs border-t border-amud-outline-variant pt-md">
            {[...(offre.competences ?? []), ...(offre.langues ?? []), ...(offre.softSkills ?? [])].map((tag) => (
              <span key={tag} className="rounded-full bg-amud-surface-container-highest px-sm py-1 text-[11px] font-medium text-amud-on-surface-variant">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mb-md text-title-lg text-amud-on-surface">Pipeline de recrutement</h3>
        {offerApplications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-amud-outline-variant p-lg text-center text-label-md text-amud-on-surface-variant">Aucune candidature pour cette offre pour le moment.</p>
        ) : (
          <div className="-mx-1 flex snap-x gap-md overflow-x-auto px-1 pb-2 md:grid md:grid-cols-4 md:overflow-visible">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragCard) moveCard(offerApplications.find((a) => a.id === dragCard.id)!, col.id);
                  setDragCard(null);
                }}
                className="min-w-[240px] shrink-0 snap-start rounded-xl border border-amud-outline-variant bg-amud-surface-container-low p-sm md:min-w-0"
              >
                <div className="mb-sm flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-label-md font-semibold text-amud-on-surface">{col.label}</span>
                  <span className="ml-auto text-label-sm text-amud-on-surface-variant">{colonnes[col.id].length}</span>
                </div>
                <div className="flex flex-col gap-sm">
                  {colonnes[col.id].map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDragCard({ id: a.id, from: col.id })}
                      className="cursor-grab rounded-lg border border-amud-outline-variant bg-amud-surface p-sm shadow-sm active:cursor-grabbing"
                    >
                      <Link href={`/amud/entreprise/candidatures/${a.id}`} className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[11px] font-bold text-amud-on-primary-fixed">{initialsOf(a.candidateNom)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label-md font-medium text-amud-on-surface">{a.candidateNom}</span>
                          <span className="block text-[11px] text-amud-on-surface-variant">{a.score}% match</span>
                        </span>
                      </Link>
                    </div>
                  ))}
                  {colonnes[col.id].length === 0 ? <p className="px-1 text-[11px] text-amud-on-surface-variant">Aucune candidature.</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteOffer(offre);
          notify(`« ${offre.titre} » supprimée.`, 'info');
          router.push('/amud/entreprise/offres');
        }}
        title="Supprimer cette offre ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
