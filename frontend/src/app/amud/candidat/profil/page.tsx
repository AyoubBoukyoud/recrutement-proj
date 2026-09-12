'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Tabs, Button, Modal, ModalActions, EmptyState, Badge } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidateDocumentsCollection } from '@/lib/amud/localCandidateDocuments';
import { updateCandidateProfile, computeProfileCompletion, SECTION_LABELS, type ProfileSection } from '@/lib/amud/candidateProfileService';
import { generateId } from '@/lib/amud/storage/ids';
import type { CandidateExperience, CandidateFormation, CandidateLangue } from '@/data/amud/candidateAccount';

const TABS = [
  { id: 'info', label: 'Informations' },
  { id: 'competences', label: 'Compétences' },
  { id: 'experiences', label: 'Expériences' },
  { id: 'formation', label: 'Formation' },
  { id: 'langues', label: 'Langues' },
  { id: 'disponibilite', label: 'Disponibilité' },
  { id: 'preferences', label: 'Préférences' },
];

export default function ProfilPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [documents] = useCollection(candidateDocumentsCollection, []);
  const [tab, setTab] = useState('info');

  const hasCV = candidate ? documents.some((d) => d.candidateAccountId === candidate.id && d.type === 'CV') : false;
  const completion = useMemo(() => (candidate ? computeProfileCompletion(candidate, hasCV) : null), [candidate, hasCV]);

  if (loading || !candidate || !completion) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="mb-md flex items-center justify-between">
          <h1 className="text-title-lg text-amud-on-surface">Profil complété à {completion.percent}%</h1>
          <span className="text-headline-md font-bold text-amud-primary">{completion.percent}%</span>
        </div>
        <div className="mb-md h-2 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
          <div className="h-full rounded-full bg-amud-primary transition-all duration-300" style={{ width: `${completion.percent}%` }} />
        </div>
        <div className="flex flex-wrap gap-sm">
          {(Object.keys(completion.sections) as ProfileSection[]).map((key) => {
            const done = completion.sections[key];
            return done ? (
              <Badge key={key} tone="success">
                ✓ {SECTION_LABELS[key].label.replace(/^(Compléter|Ajouter)\s(vos|votre|une)?\s?/i, '')}
              </Badge>
            ) : (
              <Link key={key} href={SECTION_LABELS[key].href}>
                <Badge tone="warning">⚠ {SECTION_LABELS[key].label}</Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-lg">
        {tab === 'info' ? <InfoTab /> : null}
        {tab === 'competences' ? <CompetencesTab /> : null}
        {tab === 'experiences' ? <ExperiencesTab /> : null}
        {tab === 'formation' ? <FormationTab /> : null}
        {tab === 'langues' ? <LanguesTab /> : null}
        {tab === 'disponibilite' ? <DisponibiliteTab /> : null}
        {tab === 'preferences' ? <PreferencesTab /> : null}
      </div>
    </div>
  );
}

function InfoTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [form, setForm] = useState(() => ({
    prenom: candidate?.prenom ?? '',
    nom: candidate?.nom ?? '',
    email: candidate?.email ?? '',
    telephone: candidate?.telephone ?? '',
    ville: candidate?.ville ?? '',
    posteRecherche: candidate?.posteRecherche ?? '',
  }));
  if (!candidate) return null;

  function save() {
    updateCandidateProfile(candidate!.id, form, { label: 'Informations personnelles mises à jour' });
    notify('Profil mis à jour', 'success');
  }

  return (
    <div className="flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <TextField label="Prénom" value={form.prenom} onChange={(v) => setForm((f) => ({ ...f, prenom: v }))} />
        <TextField label="Nom" value={form.nom} onChange={(v) => setForm((f) => ({ ...f, nom: v }))} />
        <TextField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <TextField label="Téléphone" value={form.telephone} onChange={(v) => setForm((f) => ({ ...f, telephone: v }))} />
        <TextField label="Ville" value={form.ville} onChange={(v) => setForm((f) => ({ ...f, ville: v }))} />
        <TextField label="Poste recherché" value={form.posteRecherche} onChange={(v) => setForm((f) => ({ ...f, posteRecherche: v }))} />
      </div>
      <Button onClick={save} className="self-start">
        Enregistrer
      </Button>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-amud-on-surface-variant">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
      />
    </label>
  );
}

function CompetencesTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [input, setInput] = useState('');
  if (!candidate) return null;

  function addSkill() {
    const value = input.trim();
    if (!value || candidate!.competences.includes(value)) return;
    updateCandidateProfile(candidate!.id, { competences: [...candidate!.competences, value] }, { label: `Compétence ajoutée : ${value}` });
    setInput('');
    notify('Compétence ajoutée', 'success');
  }

  function removeSkill(skill: string) {
    updateCandidateProfile(candidate!.id, { competences: candidate!.competences.filter((c) => c !== skill) });
  }

  return (
    <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <div className="mb-md flex gap-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder="Ex. React, Soins infirmiers, Soudure…"
          className="min-h-[44px] flex-1 rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
        />
        <Button onClick={addSkill} icon="add">
          Ajouter
        </Button>
      </div>
      {candidate.competences.length === 0 ? (
        <EmptyState icon="psychology" title="Aucune compétence ajoutée" compact />
      ) : (
        <div className="flex flex-wrap gap-sm">
          {candidate.competences.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full border border-amud-outline-variant bg-amud-surface px-3 py-1.5 text-label-md text-amud-on-surface">
              {c}
              <button type="button" onClick={() => removeSkill(c)} aria-label={`Retirer ${c}`} className="text-amud-on-surface-variant hover:text-amud-error">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperiencesTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateExperience | null>(null);
  if (!candidate) return null;

  function upsert(exp: CandidateExperience) {
    const exists = candidate!.experiences.some((e) => e.id === exp.id);
    const next = exists ? candidate!.experiences.map((e) => (e.id === exp.id ? exp : e)) : [...candidate!.experiences, exp];
    updateCandidateProfile(candidate!.id, { experiences: next }, { label: exists ? `Expérience modifiée : ${exp.poste}` : `Expérience ajoutée : ${exp.poste}` });
    notify('Expérience enregistrée', 'success');
    setModalOpen(false);
    setEditing(null);
  }

  function remove(id: string) {
    updateCandidateProfile(candidate!.id, { experiences: candidate!.experiences.filter((e) => e.id !== id) });
  }

  return (
    <div>
      <div className="mb-md flex justify-end">
        <Button
          icon="add"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Ajouter une expérience
        </Button>
      </div>
      {candidate.experiences.length === 0 ? (
        <EmptyState icon="work_history" title="Aucune expérience ajoutée" description="Ajoutez vos expériences professionnelles pour renforcer votre profil." />
      ) : (
        <div className="flex flex-col gap-md">
          {candidate.experiences.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
              <div className="flex items-start justify-between gap-sm">
                <div>
                  <p className="text-body-md font-semibold text-amud-on-surface">{exp.poste}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {exp.entreprise} {exp.ville ? `· ${exp.ville}` : ''} · {exp.dateDebut} — {exp.enCours ? 'En cours' : exp.dateFin || '—'}
                  </p>
                  {exp.description ? <p className="mt-1 text-body-md text-amud-on-surface-variant">{exp.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(exp);
                      setModalOpen(true);
                    }}
                    aria-label="Modifier"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button type="button" onClick={() => remove(exp.id)} aria-label="Supprimer" className="flex h-9 w-9 items-center justify-center rounded-full text-amud-error hover:bg-amud-error-container">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExperienceModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSave={upsert} />
    </div>
  );
}

function ExperienceModal({ open, initial, onClose, onSave }: { open: boolean; initial: CandidateExperience | null; onClose: () => void; onSave: (e: CandidateExperience) => void }) {
  const [form, setForm] = useState<CandidateExperience>(
    initial ?? { id: generateId('experience'), poste: '', entreprise: '', ville: '', dateDebut: '', dateFin: '', enCours: false, description: '' },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Modifier l'expérience" : 'Ajouter une expérience'}
      footer={<ModalActions onCancel={onClose} submitLabel="Enregistrer" form="experience-form" />}
    >
      <form
        id="experience-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, id: initial?.id ?? form.id });
        }}
        className="flex flex-col gap-md"
      >
        <TextField label="Poste" value={form.poste} onChange={(v) => setForm((f) => ({ ...f, poste: v }))} />
        <TextField label="Entreprise" value={form.entreprise} onChange={(v) => setForm((f) => ({ ...f, entreprise: v }))} />
        <TextField label="Ville" value={form.ville ?? ''} onChange={(v) => setForm((f) => ({ ...f, ville: v }))} />
        <div className="grid grid-cols-2 gap-md">
          <TextField label="Début (AAAA-MM)" value={form.dateDebut} onChange={(v) => setForm((f) => ({ ...f, dateDebut: v }))} />
          <TextField label="Fin (AAAA-MM)" value={form.dateFin ?? ''} onChange={(v) => setForm((f) => ({ ...f, dateFin: v }))} />
        </div>
        <label className="flex items-center gap-2 text-label-md text-amud-on-surface">
          <input type="checkbox" checked={form.enCours ?? false} onChange={(e) => setForm((f) => ({ ...f, enCours: e.target.checked }))} />
          Poste actuel
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Description</span>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
          />
        </label>
      </form>
    </Modal>
  );
}

function FormationTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  if (!candidate) return null;

  function add(f: CandidateFormation) {
    updateCandidateProfile(candidate!.id, { formations: [...candidate!.formations, f] }, { label: `Formation ajoutée : ${f.diplome}` });
    notify('Formation enregistrée', 'success');
    setModalOpen(false);
  }
  function remove(id: string) {
    updateCandidateProfile(candidate!.id, { formations: candidate!.formations.filter((f) => f.id !== id) });
  }

  return (
    <div>
      <div className="mb-md flex justify-end">
        <Button icon="add" onClick={() => setModalOpen(true)}>
          Ajouter une formation
        </Button>
      </div>
      {candidate.formations.length === 0 ? (
        <EmptyState icon="school" title="Aucune formation ajoutée" />
      ) : (
        <div className="flex flex-col gap-md">
          {candidate.formations.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
              <div>
                <p className="text-body-md font-semibold text-amud-on-surface">{f.diplome}</p>
                <p className="text-label-sm text-amud-on-surface-variant">{f.etablissement} · {f.annee}</p>
              </div>
              <button type="button" onClick={() => remove(f.id)} aria-label="Supprimer" className="flex h-9 w-9 items-center justify-center rounded-full text-amud-error hover:bg-amud-error-container">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <FormationModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={add} />
    </div>
  );
}

function FormationModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (f: CandidateFormation) => void }) {
  const [form, setForm] = useState({ diplome: '', etablissement: '', annee: '' });
  return (
    <Modal open={open} onClose={onClose} title="Ajouter une formation" footer={<ModalActions onCancel={onClose} submitLabel="Enregistrer" form="formation-form" />}>
      <form
        id="formation-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: generateId('formation'), ...form });
          setForm({ diplome: '', etablissement: '', annee: '' });
        }}
        className="flex flex-col gap-md"
      >
        <TextField label="Diplôme" value={form.diplome} onChange={(v) => setForm((f) => ({ ...f, diplome: v }))} />
        <TextField label="Établissement" value={form.etablissement} onChange={(v) => setForm((f) => ({ ...f, etablissement: v }))} />
        <TextField label="Année" value={form.annee} onChange={(v) => setForm((f) => ({ ...f, annee: v }))} />
      </form>
    </Modal>
  );
}

function LanguesTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [input, setInput] = useState('');
  const [niveau, setNiveau] = useState('Intermédiaire');
  if (!candidate) return null;

  function add() {
    const value = input.trim();
    if (!value) return;
    const next: CandidateLangue[] = [...candidate!.langues, { id: generateId('langue'), langue: value, niveau }];
    updateCandidateProfile(candidate!.id, { langues: next }, { label: `Langue ajoutée : ${value}` });
    setInput('');
    notify('Langue ajoutée', 'success');
  }
  function remove(id: string) {
    updateCandidateProfile(candidate!.id, { langues: candidate!.langues.filter((l) => l.id !== id) });
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="mb-md flex flex-col gap-sm sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Langue (ex. Français)"
            className="min-h-[44px] flex-1 rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          />
          <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option>Notions</option>
            <option>Intermédiaire</option>
            <option>Courant</option>
            <option>Bilingue</option>
          </select>
          <Button onClick={add} icon="add">
            Ajouter
          </Button>
        </div>
        {candidate.langues.length === 0 ? (
          <EmptyState icon="translate" title="Aucune langue ajoutée" compact />
        ) : (
          <div className="flex flex-col gap-sm">
            {candidate.langues.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant px-md py-2">
                <span className="text-body-md text-amud-on-surface">
                  {l.langue} — <span className="text-amud-on-surface-variant">{l.niveau}</span>
                </span>
                <button type="button" onClick={() => remove(l.id)} aria-label="Supprimer" className="text-amud-on-surface-variant hover:text-amud-error">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/amud/candidat/profil/allemagne"
        className="flex items-center gap-md rounded-xl border border-amud-primary/30 bg-amud-primary/5 p-lg transition-colors hover:border-amud-primary"
      >
        <span className="material-symbols-outlined text-[28px] text-amud-primary">flag</span>
        <div className="flex-1">
          <p className="text-title-lg text-amud-on-surface">Profil Allemagne</p>
          <p className="text-body-md text-amud-on-surface-variant">
            {candidate.allemagne.niveau ? `Niveau actuel : ${candidate.allemagne.niveau}` : 'Renseignez votre niveau d’allemand et vos préférences pour l’Allemagne'}
          </p>
        </div>
        <span className="material-symbols-outlined text-amud-primary">arrow_forward</span>
      </Link>
    </div>
  );
}

function DisponibiliteTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [value, setValue] = useState(candidate?.disponibilite ?? '');
  if (!candidate) return null;

  const OPTIONS = ['Immédiate', 'Sous 1 mois', 'Sous 2 mois', 'Sous 3 mois'];

  return (
    <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <p className="mb-md text-body-md text-amud-on-surface-variant">Quand êtes-vous disponible pour commencer ?</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setValue(o)}
            className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium transition-colors ${
              value === o ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <Button
        onClick={() => {
          updateCandidateProfile(candidate.id, { disponibilite: value }, { label: 'Disponibilité mise à jour' });
          notify('Disponibilité mise à jour', 'success');
        }}
      >
        Enregistrer
      </Button>
    </div>
  );
}

function PreferencesTab() {
  const { candidate } = useCurrentCandidate();
  const notify = useToast();
  const [contrat, setContrat] = useState(candidate?.preferencesPro.contrat ?? '');
  const [teletravail, setTeletravail] = useState(candidate?.preferencesPro.teletravail ?? '');
  const [salaireMin, setSalaireMin] = useState(candidate?.preferencesPro.salaireMin ?? '');
  if (!candidate) return null;

  const CONTRATS = ['CDI', 'CDD', 'Alternance', 'Stage', 'Intérim'];
  const TELETRAVAIL = ['Présentiel', 'Hybride', 'Télétravail complet'];

  return (
    <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Type de contrat</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {CONTRATS.map((c) => (
          <button key={c} type="button" onClick={() => setContrat(c)} className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium ${contrat === c ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'}`}>
            {c}
          </button>
        ))}
      </div>
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Télétravail</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {TELETRAVAIL.map((t) => (
          <button key={t} type="button" onClick={() => setTeletravail(t)} className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium ${teletravail === t ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'}`}>
            {t}
          </button>
        ))}
      </div>
      <TextField label="Salaire minimum (MAD/mois)" value={String(salaireMin)} onChange={(v) => setSalaireMin(v)} />
      <Button
        className="mt-md"
        onClick={() => {
          updateCandidateProfile(
            candidate.id,
            { preferencesPro: { ...candidate.preferencesPro, contrat, teletravail, salaireMin: salaireMin ? Number(salaireMin) : undefined } },
            { label: 'Préférences mises à jour' },
          );
          notify('Préférences mises à jour', 'success');
        }}
      >
        Enregistrer
      </Button>
    </div>
  );
}
