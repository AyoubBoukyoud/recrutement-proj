'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal, useDropdown } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { recruitersCollection } from '@/lib/amud/localRecruiters';
import { recruitersSeed, ROLE_LABEL, ROLE_CLASS, STATUT_CLASS, type Recruiter, type RecruiterRole } from '@/data/amud/recruiters';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { isValidEmail, isValidPhone, isRequired } from '@/lib/amud/validators';

const ROLES: RecruiterRole[] = ['ADMIN_ENTREPRISE', 'RECRUTEUR', 'ASSISTANT_RECRUTEUR'];

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

type FormState = { nom: string; email: string; telephone: string; poste: string; role: RecruiterRole };
const EMPTY_FORM: FormState = { nom: '', email: '', telephone: '', poste: '', role: 'RECRUTEUR' };

function RowMenu({ member, onEdit, onToggle, onDelete }: { member: Recruiter; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const menu = useDropdown<HTMLDivElement>();
  const isSelf = member.id === CURRENT_EMPLOYER.userId;
  return (
    <div ref={menu.ref} className="relative">
      <button onClick={() => menu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-primary" aria-label="Actions">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {menu.open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface py-1 shadow-lg animate-amud-fade-in">
          <button
            onClick={() => {
              onEdit();
              menu.setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
          >
            Modifier
          </button>
          {!isSelf ? (
            <button
              onClick={() => {
                onToggle();
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              {member.statut === 'Actif' ? 'Désactiver' : 'Activer'}
            </button>
          ) : null}
          {!isSelf ? (
            <button
              onClick={() => {
                onDelete();
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
            >
              Retirer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AmudEntrepriseEquipePage() {
  const notify = useToast();
  const [recruiters, { add: addRecruiter, update: updateRecruiter, remove: removeRecruiter }] = useCollection(recruitersCollection, recruitersSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const myTeam = useMemo(
    () => recruiters.filter((r) => r.entrepriseId === CURRENT_EMPLOYER.entrepriseId).sort((a, b) => a.nom.localeCompare(b.nom)),
    [recruiters],
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(member: Recruiter) {
    setEditingId(member.id);
    setForm({ nom: member.nom, email: member.email, telephone: member.telephone, poste: member.poste, role: member.role ?? 'RECRUTEUR' });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!isRequired(form.nom)) next.nom = 'Le nom est requis.';
    if (!isValidEmail(form.email)) next.email = 'Adresse email invalide.';
    if (form.telephone && !isValidPhone(form.telephone)) next.telephone = 'Numéro de téléphone invalide.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (editingId) {
      updateRecruiter(editingId, { nom: form.nom.trim(), email: form.email.trim(), telephone: form.telephone.trim(), poste: form.poste.trim(), role: form.role });
      logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Membre de l’équipe modifié', actionType: 'update', module: 'Équipe', reference: form.nom.trim() });
      notify(`${form.nom} mis(e) à jour.`);
    } else {
      const member: Recruiter = {
        id: generateId('recruiter'),
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        poste: form.poste.trim() || ROLE_LABEL[form.role],
        entrepriseId: CURRENT_EMPLOYER.entrepriseId,
        entrepriseNom: CURRENT_EMPLOYER.entrepriseNom,
        ville: '—',
        statut: 'Actif',
        verifie: false,
        creeLe: new Date().toLocaleDateString('fr-FR'),
        dernierAcces: '—',
        role: form.role,
      };
      addRecruiter(member);
      logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Membre ajouté à l’équipe', actionType: 'create', module: 'Équipe', reference: member.nom });
      notify(`${member.nom} ajouté(e) à l’équipe.`);
    }
    setModalOpen(false);
  }

  function toggleStatus(member: Recruiter) {
    const next = member.statut === 'Actif' ? 'Inactif' : 'Actif';
    updateRecruiter(member.id, { statut: next });
    logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: next === 'Inactif' ? 'Membre désactivé' : 'Membre réactivé', actionType: 'update', module: 'Équipe', reference: member.nom });
    notify(next === 'Inactif' ? `${member.nom} désactivé(e).` : `${member.nom} réactivé(e).`);
  }

  function removeMember(id: string) {
    const member = myTeam.find((m) => m.id === id);
    removeRecruiter(id);
    if (member) logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Membre retiré de l’équipe', actionType: 'delete', module: 'Équipe', reference: member.nom });
    notify('Membre retiré de l’équipe.', 'info');
  }

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Équipe</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les membres de l’équipe recrutement de {CURRENT_EMPLOYER.entrepriseNom}.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-amud-primary px-lg py-3 text-label-md font-medium text-white shadow-sm hover:brightness-110">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Ajouter un membre
        </button>
      </div>

      {myTeam.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <p className="text-body-md font-medium text-amud-on-surface">Aucun membre dans l’équipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
          {myTeam.map((member) => (
            <div key={member.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
              <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(member.nom)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-amud-on-surface">
                      {member.nom} {member.id === CURRENT_EMPLOYER.userId ? <span className="text-label-sm font-normal text-amud-on-surface-variant">(vous)</span> : null}
                    </p>
                    <p className="truncate text-label-sm text-amud-on-surface-variant">{member.poste}</p>
                  </div>
                </div>
                <RowMenu member={member} onEdit={() => openEdit(member)} onToggle={() => toggleStatus(member)} onDelete={() => setConfirmDeleteId(member.id)} />
              </div>
              <div className="flex flex-wrap gap-1">
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ROLE_CLASS[member.role ?? 'RECRUTEUR']}`}>{ROLE_LABEL[member.role ?? 'RECRUTEUR']}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${STATUT_CLASS[member.statut]}`}>{member.statut}</span>
              </div>
              <div className="mt-1 flex flex-col gap-0.5 border-t border-amud-outline-variant pt-sm text-label-sm text-amud-on-surface-variant">
                <span className="flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[16px]">mail</span> {member.email}
                </span>
                {member.telephone ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">call</span> {member.telephone}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">history</span> Dernier accès : {member.dernierAcces}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier le membre' : 'Ajouter un membre'}>
        <form id="equipe-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet *</label>
            <input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            {errors.nom ? <p className="mt-1 text-label-sm text-amud-error">{errors.nom}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email *</label>
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
            {errors.email ? <p className="mt-1 text-label-sm text-amud-error">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
            {errors.telephone ? <p className="mt-1 text-label-sm text-amud-error">{errors.telephone}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
            <input value={form.poste} onChange={(e) => setForm((p) => ({ ...p, poste: e.target.value }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="Recruteur Tech" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Rôle</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as RecruiterRole }))} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </form>
        <div className="mt-lg flex justify-end gap-sm">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="equipe-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110">
            {editingId ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeMember(confirmDeleteId)}
        title="Retirer ce membre de l’équipe ?"
        description="Cette action est irréversible."
        confirmLabel="Retirer"
      />
    </div>
  );
}
