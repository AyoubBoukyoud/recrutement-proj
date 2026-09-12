/**
 * Jeux de documents couvrant les quatre états que l'écran doit savoir peindre :
 * lecture réussie et sûre, lecture réussie mais douteuse, lecture en cours,
 * lecture impossible. Un seul document « heureux » laisserait trois branches
 * de l'interface jamais vues pendant le développement.
 */
import type { CandidateDocument } from '@/lib/documents';

export const MOCK_DOCUMENTS: CandidateDocument[] = [
  {
    id: 1,
    type: 'cv',
    file_path: 'documents/cv-youssef-amrani.pdf',
    url: '/assets/mock/cv-youssef-amrani.pdf',
    ocr_status: 'completed',
    created_at: '2026-08-04T09:12:00.000Z',
    extraction: {
      id: 11,
      confidence: 92,
      reviewed_at: '2026-08-04T09:14:30.000Z',
      extracted_fields: {
        extracted_by: 'gemini',
        escalated_to_cloud: false,
        full_name: 'Youssef Amrani',
        first_name: 'Youssef',
        last_name: 'Amrani',
        email: 'youssef.amrani@example.ma',
        phone: '+212 6 61 23 45 67',
        date_of_birth: '1996-03-18',
        profession: 'Développeur Full-Stack',
        specialization: 'React / Laravel',
        years_of_experience: 4,
        educations: [
          {
            level: 'Master',
            field: 'Génie logiciel',
            institution: 'ENSIAS, Rabat',
            started_at: '2017-09',
            ended_at: '2019-07',
          },
        ],
        languages: [
          { language: 'Arabe', cefr_level: 'C2' },
          { language: 'Français', cefr_level: 'C1' },
          { language: 'Allemand', cefr_level: 'B1' },
        ],
      },
    },
  },
  {
    id: 2,
    type: 'diploma',
    file_path: 'documents/diplome-ensias.jpg',
    url: '/assets/mock/diplome-ensias.jpg',
    // Lecture incertaine : le formulaire s'ouvre pré-rempli, à corriger.
    ocr_status: 'needs_review',
    created_at: '2026-08-06T14:02:00.000Z',
    extraction: {
      id: 12,
      confidence: 41,
      reviewed_at: null,
      extracted_fields: {
        extracted_by: 'tesseract',
        escalated_to_cloud: true,
        probable_name: 'Y. AMRANI',
        educations: [
          { level: 'Master', field: 'Génie logiciel', institution: 'ENSIAS', ended_at: '2019' },
        ],
      },
    },
  },
  {
    id: 3,
    type: 'certificate',
    file_path: 'documents/goethe-b1.jpg',
    url: null,
    // Toujours en machine : l'écran doit montrer sa progression, pas un vide.
    ocr_status: 'processing',
    created_at: '2026-08-12T08:45:00.000Z',
    extraction: null,
  },
  {
    id: 4,
    type: 'certificate',
    file_path: 'documents/attestation-floue.jpg',
    url: '/assets/mock/attestation-floue.jpg',
    // Illisible : l'écran doit proposer une reprise de photo, pas un formulaire.
    ocr_status: 'failed',
    created_at: '2026-08-11T19:30:00.000Z',
    extraction: null,
  },
];
