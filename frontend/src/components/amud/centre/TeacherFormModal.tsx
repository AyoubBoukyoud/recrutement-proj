'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { Field, FormGrid, PhotoField, SelectField, TextField } from '@/components/amud/form';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed, CONTRACT_TYPES, type CenterTeacher } from '@/data/amud/centerTeachers';
import { GERMAN_LEVELS, type GermanLevel } from '@/data/amud/centerTypes';

/**
 * Modal unique création/édition enseignant. Champs du cahier des charges :
 * photo, nom, prénom, email, téléphone, spécialité, niveaux, expérience,
 * contrat, taux horaire, statut et date d'entrée.
 */
export function TeacherFormModal({
  open,
  onClose,
  centerId,
  teacher,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  teacher?: CenterTeacher;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const isEdit = !!teacher;

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [niveaux, setNiveaux] = useState<GermanLevel[]>(['A1']);
  const [experienceAnnees, setExperienceAnnees] = useState(0);
  const [typeContrat, setTypeContrat] = useState<CenterTeacher['typeContrat']>('CDI');
  const [tauxHoraire, setTauxHoraire] = useState(100);
  const [statut, setStatut] = useState<CenterTeacher['statut']>('Actif');
  const [dateEntree, setDateEntree] = useState('');
  const [errors, setErrors] = useState<{ prenom?: string; nom?: string; email?: string; niveaux?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (teacher) {
      setPhoto(teacher.photo);
      setNom(teacher.nom);
      setPrenom(teacher.prenom);
      setEmail(teacher.email);
      setTelephone(teacher.telephone);
      setSpecialite(teacher.specialite);
      setNiveaux(teacher.niveauxEnseignes);
      setExperienceAnnees(teacher.experienceAnnees);
      setTypeContrat(teacher.typeContrat);
      setTauxHoraire(teacher.tauxHoraire);
      setStatut(teacher.statut);
      setDateEntree(teacher.dateEntree);
    } else {
      setPhoto(undefined);
      setNom('');
      setPrenom('');
      setEmail('');
      setTelephone('');
      setSpecialite('');
      setNiveaux(['A1']);
      setExperienceAnnees(0);
      setTypeContrat('CDI');
      setTauxHoraire(100);
      setStatut('Actif');
      setDateEntree(new Date().toLocaleDateString('fr-FR'));
    }
  }, [open, teacher]);

  function toggleNiveau(l: GermanLevel) {
    setNiveaux((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  function validate() {
    const next: typeof errors = {};
    if (!prenom.trim()) next.prenom = 'Le prénom est obligatoire.';
    if (!nom.trim()) next.nom = 'Le nom est obligatoire.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Adresse email invalide.';
    if (niveaux.length === 0) next.niveaux = 'Sélectionnez au moins un niveau enseigné.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      notify('Merci de corriger les champs en erreur.', 'error');
      return;
    }
    const common = {
      photo,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      specialite: specialite.trim(),
      niveauxEnseignes: niveaux,
      experienceAnnees,
      typeContrat,
      tauxHoraire,
      statut,
      dateEntree: dateEntree.trim() || new Date().toLocaleDateString('fr-FR'),
    };

    if (isEdit && teacher) {
      update(teacher.id, common);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification enseignant ${prenom} ${nom}`, actionType: 'update', module: 'Centres de formation — Enseignants', reference: `${prenom} ${nom} (#${teacher.id})`, centerId });
      notify(`Enseignant « ${prenom} ${nom} » modifié avec succès.`);
    } else {
      const created: CenterTeacher = { id: generateId('teacher'), centerId, ...common };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Recrutement enseignant ${prenom} ${nom}`, actionType: 'create', module: 'Centres de formation — Enseignants', reference: `${prenom} ${nom} (#${created.id})`, centerId });
      logCenterActivity({ centerId, type: 'TEACHER_CREATED', message: `Enseignant « ${prenom} ${nom} » recruté.`, utilisateur: actor.utilisateur, role: actor.role });
      notify(`Enseignant « ${prenom} ${nom} » ajouté avec succès.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier l'enseignant" : 'Ajouter un enseignant'}
      subtitle={isEdit ? undefined : 'Les champs marqués d’une étoile sont obligatoires.'}
      footer={<ModalActions onCancel={onClose} form="teacher-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <FormGrid id="teacher-form" onSubmit={handleSubmit}>
        <Field label="Photo" htmlFor="teacher-photo" className="sm:col-span-2">
          <PhotoField
            value={photo}
            onChange={setPhoto}
            fallback={`${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()}
            onError={(m) => notify(m, 'error')}
          />
        </Field>
        <TextField label="Prénom" required autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} error={errors.prenom} />
        <TextField label="Nom" required value={nom} onChange={(e) => setNom(e.target.value)} error={errors.nom} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField label="Téléphone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        <TextField
          label="Spécialité"
          className="sm:col-span-2"
          value={specialite}
          onChange={(e) => setSpecialite(e.target.value)}
          placeholder="Grammaire & conversation"
        />
        <Field label="Niveaux enseignés" htmlFor="teacher-niveaux" required error={errors.niveaux} className="sm:col-span-2">
          <div id="teacher-niveaux" className="flex flex-wrap gap-sm" role="group" aria-label="Niveaux enseignés">
            {GERMAN_LEVELS.map((l) => {
              const active = niveaux.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleNiveau(l)}
                  className={`min-h-[44px] min-w-[56px] rounded-lg border px-3 text-label-md font-medium transition-colors ${
                    active ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </Field>
        <TextField
          label="Expérience (années)"
          type="number"
          min={0}
          value={experienceAnnees}
          onChange={(e) => setExperienceAnnees(Number(e.target.value) || 0)}
        />
        <SelectField
          label="Type de contrat"
          value={typeContrat}
          onChange={(e) => setTypeContrat(e.target.value as CenterTeacher['typeContrat'])}
          options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))}
        />
        <TextField label="Taux horaire (MAD)" type="number" min={0} value={tauxHoraire} onChange={(e) => setTauxHoraire(Number(e.target.value) || 0)} />
        <SelectField
          label="Statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value as CenterTeacher['statut'])}
          options={[
            { value: 'Actif', label: 'Actif' },
            { value: 'Inactif', label: 'Inactif' },
          ]}
        />
        <TextField label="Date d’entrée" className="sm:col-span-2" value={dateEntree} onChange={(e) => setDateEntree(e.target.value)} placeholder="JJ/MM/AAAA" />
      </FormGrid>
    </Modal>
  );
}
