import type {
  Centre,
  CenterStudent,
  CenterTeacher,
  CenterFormation,
  CenterGroup,
  CenterSchedule,
  CenterAttendanceRecord,
  CenterStudentPayment,
  CenterTeacherPayment,
  CenterTarif,
  CenterLead,
  CenterModificationRequest,
  CenterUser,
  CenterEnrollment,
  CenterTeacherHoursRecord,
  GermanLevel,
  PartnershipStatus,
  ThemeId,
  AttendanceStatus,
  PaymentStatus,
} from './centerTypes';
import { GERMAN_LEVELS } from './centerTypes';

/**
 * Générateur du jeu de données démo des 4 centres fictifs (cahier des
 * charges §59) — un seul générateur plutôt qu'un fichier par entité écrit à
 * la main, pour que les ids se recoupent correctement entre
 * étudiants/groupes/plannings/présences/paiements (même principe que
 * `buildSeedRdvs()` dans `commercialRdv.ts`). Chaque `data/amud/center*.ts`
 * réexporte juste la tranche correspondante de `CENTER_DEMO`.
 */

const TODAY = new Date(2026, 7, 23);

function mondayOf(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1) - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}
const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function frDay(d: Date): string {
  return FR_DAYS[d.getDay()];
}
function fmtFr(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}
function paymentStatus(prixTotal: number, montantPaye: number, late: boolean): PaymentStatus {
  if (montantPaye >= prixTotal) return 'PAYE';
  if (montantPaye > 0) return 'PARTIEL';
  return late ? 'EN_RETARD' : 'IMPAYE';
}

type CenterBlueprint = {
  nom: string;
  slug: string;
  ville: string;
  adresse: string;
  logo: string;
  partnershipStatus: PartnershipStatus;
  statut: Centre['statut'];
  theme: ThemeId;
  siteEnabled: boolean;
  commercialId: string;
  commercialNom: string;
  teachers: { prenom: string; nom: string; specialite: string; niveaux: GermanLevel[]; taux: number; contrat: CenterTeacher['typeContrat']; exp: number }[];
  formations: { nom: string; niveau: GermanLevel; prix: number }[];
};

const BLUEPRINTS: CenterBlueprint[] = [
  {
    nom: 'Deutsch Akademie Casablanca',
    slug: 'deutsch-akademie-casablanca',
    ville: 'Casablanca',
    adresse: '12 Rue Ibn Battouta, Casablanca',
    logo: 'school',
    partnershipStatus: 'ACTIF',
    statut: 'Actif',
    theme: 'german-excellence',
    siteEnabled: true,
    commercialId: 'ahmed-benali',
    commercialNom: 'Ahmed Benali',
    teachers: [
      { prenom: 'Klaus', nom: 'Weber', specialite: 'Grammaire & conversation', niveaux: ['A1', 'A2'], taux: 130, contrat: 'CDI', exp: 9 },
      { prenom: 'Amina', nom: 'El Fassi', specialite: 'Préparation Goethe-Zertifikat', niveaux: ['B1', 'B2'], taux: 150, contrat: 'CDI', exp: 6 },
      { prenom: 'Stefan', nom: 'Braun', specialite: 'Allemand des affaires', niveaux: ['B2', 'C1'], taux: 160, contrat: 'Freelance', exp: 12 },
    ],
    formations: [
      { nom: 'Allemand Général A1', niveau: 'A1', prix: 3200 },
      { nom: 'Allemand Général A2', niveau: 'A2', prix: 3500 },
      { nom: 'Préparation Goethe B1', niveau: 'B1', prix: 4200 },
    ],
  },
  {
    nom: 'Deutsch Zentrum Rabat',
    slug: 'deutsch-zentrum-rabat',
    ville: 'Rabat',
    adresse: '45 Avenue Al Fida, Rabat',
    logo: 'auto_stories',
    partnershipStatus: 'NEGOCIATION',
    statut: 'Actif',
    theme: 'modern-education',
    siteEnabled: true,
    commercialId: 'marie-lambert',
    commercialNom: 'Marie Lambert',
    teachers: [
      { prenom: 'Julia', nom: 'Hoffmann', specialite: 'Grammaire & conversation', niveaux: ['A1', 'A2'], taux: 120, contrat: 'CDD', exp: 4 },
      { prenom: 'Youssef', nom: 'Bennani', specialite: 'Allemand académique', niveaux: ['B1', 'B2'], taux: 140, contrat: 'CDI', exp: 7 },
      { prenom: 'Markus', nom: 'Fischer', specialite: 'Préparation TestDaF', niveaux: ['B2', 'C1'], taux: 155, contrat: 'Vacataire', exp: 10 },
    ],
    formations: [
      { nom: 'Allemand Débutant A1', niveau: 'A1', prix: 3000 },
      { nom: 'Allemand Intermédiaire A2', niveau: 'A2', prix: 3300 },
      { nom: 'Allemand Avancé B1', niveau: 'B1', prix: 4000 },
    ],
  },
  {
    nom: 'Deutsch Institut Tanger',
    slug: 'deutsch-institut-tanger',
    ville: 'Tanger',
    adresse: '8 Boulevard Mohammed VI, Tanger',
    logo: 'translate',
    partnershipStatus: 'ESSAI',
    statut: 'Actif',
    theme: 'minimal-learning',
    siteEnabled: true,
    commercialId: 'ahmed-benali',
    commercialNom: 'Ahmed Benali',
    teachers: [
      { prenom: 'Laura', nom: 'Schmidt', specialite: 'Grammaire & conversation', niveaux: ['A1', 'A2'], taux: 125, contrat: 'CDI', exp: 5 },
      { prenom: 'Karim', nom: 'Idrissi', specialite: 'Allemand des affaires', niveaux: ['B1', 'B2'], taux: 145, contrat: 'CDD', exp: 8 },
      { prenom: 'Peter', nom: 'Wagner', specialite: 'Préparation Goethe-Zertifikat', niveaux: ['B2', 'C1'], taux: 150, contrat: 'Freelance', exp: 11 },
    ],
    formations: [
      { nom: 'Allemand Général A1', niveau: 'A1', prix: 2900 },
      { nom: 'Allemand Général A2', niveau: 'A2', prix: 3200 },
      { nom: 'Allemand des Affaires B1', niveau: 'B1', prix: 4100 },
    ],
  },
  {
    nom: 'Deutsch Campus Marrakech',
    slug: 'deutsch-campus-marrakech',
    ville: 'Marrakech',
    adresse: '23 Avenue Mohammed V, Marrakech',
    logo: 'menu_book',
    partnershipStatus: 'SUSPENDU',
    statut: 'Inactif',
    theme: 'premium-training',
    siteEnabled: false,
    commercialId: 'thomas-dubois',
    commercialNom: 'Thomas Dubois',
    teachers: [
      { prenom: 'Anna', nom: 'Keller', specialite: 'Grammaire & conversation', niveaux: ['A1', 'A2'], taux: 115, contrat: 'CDD', exp: 3 },
      { prenom: 'Hicham', nom: 'Ouazzani', specialite: 'Allemand académique', niveaux: ['B1', 'B2'], taux: 135, contrat: 'CDI', exp: 6 },
      { prenom: 'Thomas', nom: 'Richter', specialite: 'Préparation TestDaF', niveaux: ['B2', 'C1'], taux: 150, contrat: 'Vacataire', exp: 9 },
    ],
    formations: [
      { nom: 'Allemand Général A1', niveau: 'A1', prix: 2800 },
      { nom: 'Allemand Général A2', niveau: 'A2', prix: 3100 },
      { nom: 'Allemand Intensif B1', niveau: 'B1', prix: 3900 },
    ],
  },
];

const STUDENT_FIRST = ['Yasmine', 'Omar', 'Salma', 'Rayan', 'Nour', 'Ilyas', 'Lina', 'Adam', 'Zineb', 'Bilal', 'Hafsa', 'Nassim'];
const STUDENT_LAST = ['Alaoui', 'Bouzid', 'Chraibi', 'Daoudi', 'El Amrani', 'Fassi', 'Guerraoui', 'Haddad', 'Idrissi', 'Jabri', 'Kabbaj', 'Lahlou'];
const WEEKDAY_PAIRS: [number, number][] = [
  [1, 4],
  [2, 5],
  [3, 6],
];
const HOURS: [string, string][] = [
  ['17:00', '19:00'],
  ['18:00', '20:00'],
  ['10:00', '12:00'],
];
const ROOMS = ['Salle A1', 'Salle B2', 'Salle C1'];

function buildCenter(bp: CenterBlueprint, index: number) {
  const centerId = `center_${bp.slug.replace(/-/g, '_')}`;
  const monday = mondayOf(TODAY);
  let studentSeq = 0;

  const teachers: CenterTeacher[] = bp.teachers.map((t, ti) => ({
    id: `${centerId}_teacher_${ti + 1}`,
    centerId,
    nom: t.nom,
    prenom: t.prenom,
    email: `${t.prenom.toLowerCase()}.${t.nom.toLowerCase().replace(/\s+/g, '')}@${bp.slug.split('-')[0]}.example`,
    telephone: `+212 6 ${60 + index}${10 + ti} ${20 + ti}${30 + ti} ${40 + ti}${50 + ti}`,
    specialite: t.specialite,
    niveauxEnseignes: t.niveaux,
    experienceAnnees: t.exp,
    typeContrat: t.contrat,
    tauxHoraire: t.taux,
    statut: 'Actif',
    dateEntree: fmtFr(addDays(TODAY, -365 * (1 + ti))),
  }));

  const formations: CenterFormation[] = bp.formations.map((f, fi) => ({
    id: `${centerId}_formation_${fi + 1}`,
    centerId,
    nom: f.nom,
    niveau: f.niveau,
    description: `Formation d'allemand niveau ${f.niveau}, groupes restreints, préparation aux certifications Goethe-Institut.`,
    dureeSemaines: 10 + fi * 2,
    nombreHeures: 60 + fi * 20,
    nombreSeances: 20 + fi * 4,
    prix: f.prix,
    dateDebut: fmtFr(addDays(monday, -70)),
    dateFin: fmtFr(addDays(monday, 30 + fi * 14)),
    statut: 'Active',
  }));

  const tarifs: CenterTarif[] = formations.map((f, fi) => ({
    id: `${centerId}_tarif_${fi + 1}`,
    centerId,
    formationId: f.id,
    niveau: f.niveau,
    dureeSemaines: f.dureeSemaines,
    nombreHeures: f.nombreHeures,
    prix: f.prix,
    fraisInscription: 500,
    mensualite: Math.round((f.prix / f.dureeSemaines) * 4),
    reduction: fi === 0 ? 10 : undefined,
    promotion: fi === 0 ? 'Inscription anticipée -10%' : undefined,
    dateValidite: fmtFr(addDays(monday, 90)),
  }));

  // `studentIds` n'existe plus sur `CenterGroup` (rattachement devenu
  // l'entité `CenterEnrollment` de première classe, amud_enrollments) — ce
  // type élargi reste local au générateur pour suivre "quel étudiant va
  // dans quel groupe" pendant la construction des présences/paiements,
  // avant d'être dépouillé à la sortie de `buildCenter`.
  const groups: (CenterGroup & { studentIds: string[] })[] = formations.map((f, gi) => ({
    id: `${centerId}_group_${gi + 1}`,
    centerId,
    nom: `Groupe ${f.niveau}-${gi + 1}`,
    formationId: f.id,
    niveau: f.niveau as GermanLevel,
    enseignantId: teachers[gi % teachers.length].id,
    salle: ROOMS[gi % ROOMS.length],
    studentIds: [] as string[],
    capaciteMax: 12,
    dateDebut: f.dateDebut,
    dateFin: f.dateFin,
    statut: 'Actif',
  }));

  const students: CenterStudent[] = [];
  groups.forEach((g, gi) => {
    for (let s = 0; s < 2; s++) {
      const prenom = STUDENT_FIRST[(index * 6 + studentSeq) % STUDENT_FIRST.length];
      const nom = STUDENT_LAST[(index * 6 + studentSeq + s) % STUDENT_LAST.length];
      const niveauIdx = GERMAN_LEVELS.indexOf(groups[gi].niveau);
      const student: CenterStudent = {
        id: `${centerId}_student_${studentSeq + 1}`,
        centerId,
        nom,
        prenom,
        telephone: `+212 6 ${70 + index}${10 + studentSeq} ${20 + studentSeq}${30 + studentSeq} ${40 + studentSeq}${50 + studentSeq}`,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase().replace(/\s+/g, '')}@example.com`,
        ville: bp.ville,
        niveau: groups[gi].niveau,
        niveauCible: GERMAN_LEVELS[Math.min(niveauIdx + 1, GERMAN_LEVELS.length - 1)],
        dateInscription: fmtFr(addDays(monday, -60)),
        statut: 'Actif',
      };
      students.push(student);
      g.studentIds.push(student.id);
      studentSeq++;
    }
  });

  const schedules: CenterSchedule[] = [];
  const attendance: CenterAttendanceRecord[] = [];
  groups.forEach((g, gi) => {
    const [d1, d2] = WEEKDAY_PAIRS[gi % WEEKDAY_PAIRS.length];
    const [start, end] = HOURS[gi % HOURS.length];
    for (let week = -2; week <= 1; week++) {
      for (const weekday of [d1, d2]) {
        const date = addDays(monday, week * 7 + weekday);
        const schedule: CenterSchedule = {
          id: `${centerId}_sch_${gi + 1}_${schedules.length + 1}`,
          centerId,
          formationId: g.formationId,
          groupId: g.id,
          enseignantId: g.enseignantId,
          salle: g.salle,
          date: iso(date),
          jour: frDay(date),
          heureDebut: start,
          heureFin: end,
        };
        schedules.push(schedule);
        if (date <= TODAY) {
          g.studentIds.forEach((studentId, si) => {
            const roll = (gi + si + week + 10) % 5;
            const statut: AttendanceStatus = roll === 0 ? 'ABSENT' : roll === 1 ? 'RETARD' : roll === 2 ? 'EXCUSE' : 'PRESENT';
            attendance.push({
              id: `${centerId}_att_${attendance.length + 1}`,
              centerId,
              scheduleId: schedule.id,
              groupId: g.id,
              studentId,
              date: iso(date),
              statut,
            });
          });
        }
      }
    }
  });

  const studentPayments: CenterStudentPayment[] = [];
  groups.forEach((g, gi) => {
    const formation = formations.find((f) => f.id === g.formationId)!;
    g.studentIds.forEach((studentId, si) => {
      const ratioIdx = (gi + si) % 3;
      const ratio = [1, 0.5, 0][ratioIdx];
      const montantPaye = Math.round(formation.prix * ratio);
      studentPayments.push({
        id: `${centerId}_pay_${studentPayments.length + 1}`,
        centerId,
        studentId,
        formationId: formation.id,
        prixTotal: formation.prix,
        montantPaye,
        date: fmtFr(addDays(monday, -50 + si * 5)),
        mode: si % 2 === 0 ? 'Virement' : 'Espèces',
        reference: `PAY-${centerId.toUpperCase()}-${studentPayments.length + 1}`,
        statut: paymentStatus(formation.prix, montantPaye, ratioIdx === 2 && gi % 2 === 0),
      });
    });
  });

  const teacherPayments: CenterTeacherPayment[] = teachers.map((t, ti) => {
    const heuresEnseignees = schedules.filter((s) => s.enseignantId === t.id && s.date <= iso(TODAY)).length * 2;
    return {
      id: `${centerId}_tpay_${ti + 1}`,
      centerId,
      enseignantId: t.id,
      periode: TODAY.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      nombreHeures: heuresEnseignees,
      tauxHoraire: t.tauxHoraire,
      montant: heuresEnseignees * t.tauxHoraire,
      date: fmtFr(addDays(monday, -3)),
      statut: ti % 2 === 0 ? 'PAYE' : 'EN_ATTENTE',
    };
  });

  const leads: CenterLead[] = [
    {
      id: `${centerId}_lead_1`,
      centerId,
      nom: 'Sara Alami',
      telephone: '+212 6 61 22 33 44',
      email: 'sara.alami@example.com',
      niveauSouhaite: 'A1',
      horairePrefere: 'Soir',
      message: 'Je cherche un cours du soir pour débutants.',
      statut: 'NOUVEAU',
      createdAt: addDays(TODAY, -1).toISOString(),
    },
    {
      id: `${centerId}_lead_2`,
      centerId,
      nom: 'Mehdi Kabbaj',
      telephone: '+212 6 62 33 44 55',
      email: 'mehdi.kabbaj@example.com',
      niveauSouhaite: 'B1',
      horairePrefere: 'Week-end',
      message: 'Intéressé par la préparation Goethe-Zertifikat.',
      statut: 'CONTACTE',
      createdAt: addDays(TODAY, -4).toISOString(),
    },
    {
      id: `${centerId}_lead_3`,
      centerId,
      nom: 'Imane Rachidi',
      telephone: '+212 6 63 44 55 66',
      email: 'imane.rachidi@example.com',
      niveauSouhaite: 'A2',
      statut: 'INSCRIT',
      createdAt: addDays(TODAY, -9).toISOString(),
    },
  ];

  const centre: Centre = {
    id: centerId,
    slug: bp.slug,
    nom: bp.nom,
    logo: bp.logo,
    description: `${bp.nom} est un centre spécialisé dans l'enseignement de l'allemand (A1 à C1), préparation aux certifications Goethe-Institut et accompagnement vers la mobilité professionnelle en Allemagne.`,
    telephone: `+212 5 22 ${10 + index}${20 + index} ${30 + index}${40 + index}`,
    email: `contact@${bp.slug.split('-')[0]}-${bp.ville.toLowerCase()}.example`,
    siteWeb: `www.${bp.slug}.example`,
    contactNom: `${teachers[0].prenom} ${teachers[0].nom}`,
    contactTelephone: teachers[0].telephone,
    contactEmail: teachers[0].email,
    pays: 'Maroc',
    ville: bp.ville,
    adresse: bp.adresse,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(bp.adresse)}`,
    statut: bp.statut,
    partnershipStatus: bp.partnershipStatus,
    partnershipDateDebut: fmtFr(addDays(monday, -400 + index * 40)),
    assignedCommercialId: bp.commercialId,
    assignedCommercialNom: bp.commercialNom,
    theme: bp.theme,
    socialLinks: { linkedin: `linkedin.com/company/${bp.slug}`, instagram: `instagram.com/${bp.slug}` },
    horaires: [
      { jour: 'Lundi', ouverture: '09:00', fermeture: '20:00' },
      { jour: 'Mardi', ouverture: '09:00', fermeture: '20:00' },
      { jour: 'Mercredi', ouverture: '09:00', fermeture: '20:00' },
      { jour: 'Jeudi', ouverture: '09:00', fermeture: '20:00' },
      { jour: 'Vendredi', ouverture: '09:00', fermeture: '18:00' },
      { jour: 'Samedi', ouverture: '10:00', fermeture: '14:00' },
      { jour: 'Dimanche', ouverture: '', fermeture: '', ferme: true },
    ],
    site: {
      enabled: bp.siteEnabled,
      tagline: `Apprenez l'allemand à ${bp.ville} avec des enseignants natifs et certifiés.`,
      avantages: [
        'Groupes de 10 à 12 étudiants maximum',
        'Enseignants natifs et certifiés Goethe-Institut',
        'Préparation aux examens officiels',
        'Suivi personnalisé de la progression',
      ],
      temoignages: [
        {
          nom: students[0]?.prenom ?? 'Étudiant',
          role: `Niveau ${students[0]?.niveau ?? 'A1'}`,
          texte: "Une pédagogie exigeante mais très humaine, j'ai progressé bien plus vite qu'en autodidacte.",
          note: 5,
        },
        {
          nom: students[2]?.prenom ?? 'Étudiant',
          role: `Niveau ${students[2]?.niveau ?? 'A2'}`,
          texte: 'Les enseignants sont disponibles et le suivi est vraiment personnalisé.',
          note: 5,
        },
      ],
      faq: [
        { question: 'Quel est le rythme des cours ?', reponse: '2 séances de 2 heures par semaine, en présentiel.' },
        { question: 'Les certifications sont-elles reconnues ?', reponse: 'Oui, nous préparons aux certifications officielles du Goethe-Institut.' },
        { question: 'Puis-je rejoindre un groupe en cours d’année ?', reponse: 'Sous réserve de place disponible et d’un test de niveau.' },
      ],
      ctaLabel: 'Demander une inscription',
    },
    createdAt: addDays(TODAY, -400 + index * 40).toISOString(),
    updatedAt: addDays(TODAY, -2).toISOString(),
  };

  const users: CenterUser[] = [
    {
      id: `${centerId}_user_owner`,
      centerId,
      nom: centre.contactNom,
      email: centre.contactEmail,
      telephone: centre.contactTelephone,
      role: 'CENTER_OWNER',
      actif: true,
      createdAt: centre.createdAt,
    },
    {
      id: `${centerId}_user_admin`,
      centerId,
      nom: `${teachers[1]?.prenom ?? 'Fatima'} Zahra`,
      email: `admin@${bp.slug.split('-')[0]}-${bp.ville.toLowerCase()}.example`,
      telephone: `+212 6 ${65 + index}${11} ${21}${31} ${41}${51}`,
      role: 'CENTER_ADMIN',
      actif: true,
      createdAt: centre.createdAt,
    },
    {
      id: `${centerId}_user_accountant`,
      centerId,
      nom: 'Rachid Alaoui',
      email: `compta@${bp.slug.split('-')[0]}-${bp.ville.toLowerCase()}.example`,
      telephone: `+212 6 ${66 + index}${12} ${22}${32} ${42}${52}`,
      role: 'ACCOUNTANT',
      actif: true,
      createdAt: centre.createdAt,
    },
  ];

  const enrollments: CenterEnrollment[] = groups.flatMap((g) =>
    g.studentIds.map((studentId) => ({
      id: `${g.id}_enr_${studentId}`,
      centerId,
      groupId: g.id,
      studentId,
      enrolledAt: students.find((s) => s.id === studentId)?.dateInscription ?? fmtFr(addDays(monday, -60)),
      statut: 'ACTIF' as const,
    })),
  );
  const cleanGroups: CenterGroup[] = groups.map(({ studentIds: _studentIds, ...rest }) => rest);

  // Historique "heures comptées au moment du versement" (amud_teacher_hours,
  // cf. docblock de `CenterTeacherHoursRecord`) — un instantané par
  // enseignant payé dans ce jeu de démo, pas une nouvelle source de vérité.
  const teacherHoursRecords: CenterTeacherHoursRecord[] = teacherPayments
    .filter((p) => p.statut === 'PAYE')
    .map((p) => ({
      id: `${p.id}_hours`,
      centerId,
      enseignantId: p.enseignantId,
      periode: p.periode,
      heures: p.nombreHeures,
      recordedAt: new Date(`${p.date.split('/').reverse().join('-')}`).toISOString(),
    }));

  return { centre, teachers, formations, tarifs, groups: cleanGroups, students, schedules, attendance, studentPayments, teacherPayments, teacherHoursRecords, leads, users, enrollments };
}

function buildDemoData() {
  const built = BLUEPRINTS.map((bp, i) => buildCenter(bp, i));
  const monday = mondayOf(TODAY);

  const modificationRequests: CenterModificationRequest[] = [
    {
      id: 'center_modreq_1',
      centerId: built[1].centre.id,
      centerNom: built[1].centre.nom,
      commercialId: built[1].centre.assignedCommercialId,
      commercialNom: built[1].centre.assignedCommercialNom,
      message: 'Le numéro de téléphone du centre semble incorrect, à vérifier avec le contact principal.',
      date: fmtFr(addDays(monday, -5)),
      statut: 'PENDING',
    },
    {
      id: 'center_modreq_2',
      centerId: built[3].centre.id,
      centerNom: built[3].centre.nom,
      commercialId: built[3].centre.assignedCommercialId,
      commercialNom: built[3].centre.assignedCommercialNom,
      message: 'Le partenariat est suspendu depuis plusieurs semaines, pourriez-vous confirmer si une relance est prévue ?',
      date: fmtFr(addDays(monday, -12)),
      statut: 'REVIEWED',
    },
  ];

  return {
    centres: built.map((b) => b.centre),
    teachers: built.flatMap((b) => b.teachers),
    formations: built.flatMap((b) => b.formations),
    tarifs: built.flatMap((b) => b.tarifs),
    groups: built.flatMap((b) => b.groups),
    students: built.flatMap((b) => b.students),
    schedules: built.flatMap((b) => b.schedules),
    attendance: built.flatMap((b) => b.attendance),
    studentPayments: built.flatMap((b) => b.studentPayments),
    teacherPayments: built.flatMap((b) => b.teacherPayments),
    teacherHoursRecords: built.flatMap((b) => b.teacherHoursRecords),
    leads: built.flatMap((b) => b.leads),
    users: built.flatMap((b) => b.users),
    enrollments: built.flatMap((b) => b.enrollments),
    modificationRequests,
  };
}

export const CENTER_DEMO = buildDemoData();
