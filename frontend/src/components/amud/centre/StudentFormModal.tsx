'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { Field, FormGrid, PhotoField, SelectField, TextField, TextareaField } from '@/components/amud/form';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed, STUDENT_STATUSES, GERMAN_LEVELS, type CenterStudent } from '@/data/amud/centerStudents';

/**
 * Modal unique création/édition étudiant (jamais de page `/nouveau` ni
 * `/edit` séparée). Champs du cahier des charges : photo, nom, prénom,
 * téléphone, email, ville, niveau, niveau cible, date d'inscription, statut
 * et notes — tous rendus avec les primitives partagées de `form.tsx`, donc
 * identiques à ceux des autres modals du module.
 */
export function StudentFormModal({
  open,
  onClose,
  centerId,
  student,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  student?: CenterStudent;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const isEdit = !!student;

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [niveau, setNiveau] = useState<CenterStudent['niveau']>('A1');
  const [niveauCible, setNiveauCible] = useState<CenterStudent['niveauCible']>('A2');
  const [dateInscription, setDateInscription] = useState('');
  const [statut, setStatut] = useState<CenterStudent['statut']>('Actif');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ prenom?: string; nom?: string; email?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (student) {
      setPhoto(student.photo);
      setNom(student.nom);
      setPrenom(student.prenom);
      setTelephone(student.telephone);
      setEmail(student.email);
      setVille(student.ville);
      setNiveau(student.niveau);
      setNiveauCible(student.niveauCible);
      setDateInscription(student.dateInscription);
      setStatut(student.statut);
      setNotes(student.notes ?? '');
    } else {
      setPhoto(undefined);
      setNom('');
      setPrenom('');
      setTelephone('');
      setEmail('');
      setVille('');
      setNiveau('A1');
      setNiveauCible('A2');
      setDateInscription(new Date().toLocaleDateString('fr-FR'));
      setStatut('Actif');
      setNotes('');
    }
  }, [open, student]);

  function validate() {
    const next: typeof errors = {};
    if (!prenom.trim()) next.prenom = 'Le prénom est obligatoire.';
    if (!nom.trim()) next.nom = 'Le nom est obligatoire.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Adresse email invalide.';
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
      telephone: telephone.trim(),
      email: email.trim(),
      ville: ville.trim(),
      niveau,
      niveauCible,
      dateInscription: dateInscription.trim() || new Date().toLocaleDateString('fr-FR'),
      statut,
      notes: notes.trim() || undefined,
    };

    if (isEdit && student) {
      update(student.id, common);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification étudiant ${prenom} ${nom}`, actionType: 'update', module: 'Centres de formation — Étudiants', reference: `${prenom} ${nom} (#${student.id})`, centerId });
      notify(`Étudiant « ${prenom} ${nom} » modifié avec succès.`);
    } else {
      const created: CenterStudent = { id: generateId('student'), centerId, ...common };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Inscription étudiant ${prenom} ${nom}`, actionType: 'create', module: 'Centres de formation — Étudiants', reference: `${prenom} ${nom} (#${created.id})`, centerId });
      logCenterActivity({ centerId, type: 'STUDENT_CREATED', message: `Étudiant « ${prenom} ${nom} » inscrit.`, utilisateur: actor.utilisateur, role: actor.role });
      notify(`Étudiant « ${prenom} ${nom} » ajouté avec succès.`);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier l'étudiant" : 'Ajouter un étudiant'}
      subtitle={isEdit ? undefined : 'Les champs marqués d’une étoile sont obligatoires.'}
      footer={<ModalActions onCancel={onClose} form="student-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <FormGrid id="student-form" onSubmit={handleSubmit}>
        <Field label="Photo" htmlFor="student-photo" className="sm:col-span-2">
          <PhotoField
            value={photo}
            onChange={setPhoto}
            fallback={`${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()}
            onError={(m) => notify(m, 'error')}
          />
        </Field>
        <TextField label="Prénom" required autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} error={errors.prenom} />
        <TextField label="Nom" required value={nom} onChange={(e) => setNom(e.target.value)} error={errors.nom} />
        <TextField label="Téléphone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+212 6 00 00 00 00" />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} />
        <TextField label="Date d’inscription" value={dateInscription} onChange={(e) => setDateInscription(e.target.value)} placeholder="JJ/MM/AAAA" />
        <SelectField
          label="Niveau actuel"
          value={niveau}
          onChange={(e) => setNiveau(e.target.value as CenterStudent['niveau'])}
          options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))}
        />
        <SelectField
          label="Niveau cible"
          value={niveauCible}
          onChange={(e) => setNiveauCible(e.target.value as CenterStudent['niveauCible'])}
          options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))}
        />
        <SelectField
          label="Statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value as CenterStudent['statut'])}
          options={STUDENT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <TextareaField label="Notes" className="sm:col-span-2" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormGrid>
    </Modal>
  );
}
