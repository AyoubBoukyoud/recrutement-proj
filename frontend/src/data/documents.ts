/**
 * Accès aux documents du candidat, en maquette ou via l'API Laravel.
 *
 * L'implémentation HTTP délègue telle quelle aux fonctions de `lib/documents`,
 * qui restent la description du contrat réel du back. Seule la maquette est
 * nouvelle ici.
 *
 * Elle tient un état en mémoire plutôt que de renvoyer un tableau figé :
 * l'écran documents ajoute, relance, corrige et remplace, et il faut que ces
 * gestes se voient d'un appel à l'autre. L'état se réinitialise au
 * rechargement de la page — les maquettes ne persistent rien.
 */
import {
  listDocuments,
  getDocument,
  uploadDocument,
  reviewDocument,
  retryDocument,
  rescanDocument,
  type BackendDocumentType,
  type CandidateDocument,
  type ExtractedFields,
  type ReviewResponse,
} from '@/lib/documents';
import { ApiError } from '@/lib/api';
import { fakeLatency, fakeFailure } from './config';
import { MOCK_DOCUMENTS } from './fixtures/documents';

export interface DocumentsRepository {
  list(token: string): Promise<CandidateDocument[]>;
  get(id: number, token: string): Promise<CandidateDocument>;
  upload(file: File, type: BackendDocumentType, token: string): Promise<CandidateDocument>;
  review(id: number, fields: ExtractedFields, token: string, overwrite?: boolean): Promise<ReviewResponse>;
  retry(id: number, token: string): Promise<CandidateDocument>;
  rescan(id: number, file: File, token: string): Promise<CandidateDocument>;
}

const httpDocuments: DocumentsRepository = {
  list: listDocuments,
  get: getDocument,
  upload: uploadDocument,
  review: (id, fields, token, overwrite = false) => reviewDocument(id, fields, token, overwrite),
  retry: retryDocument,
  rescan: rescanDocument,
};

/* ------------------------------------------------------------------ *
 * Maquette
 * ------------------------------------------------------------------ */

/*
 * L'état est initialisé au premier appel, pas au chargement du module.
 *
 * Ce détail décide de ce qui part en production : une initialisation au niveau
 * du module est un effet de bord que webpack ne peut pas supprimer, et les
 * fausses données se retrouvent dans le bundle livré même quand le drapeau est
 * éteint. Sous forme paresseuse, la seule référence aux fixtures se trouve
 * dans `mockDocuments`, que la condition constante élimine avec elles.
 */
let store: CandidateDocument[] | null = null;
let nextId = 0;

function documents(): CandidateDocument[] {
  if (store === null) {
    store = MOCK_DOCUMENTS.map((d) => ({ ...d }));
    nextId = Math.max(...MOCK_DOCUMENTS.map((d) => d.id)) + 1;
  }
  return store;
}

const find = (id: number): CandidateDocument | undefined => documents().find((d) => d.id === id);

const notFound = (id: number) =>
  fakeFailure(new ApiError(404, `Document ${id} introuvable`, { reason: 'not_found' }));

const replace = (next: CandidateDocument) => {
  store = documents().map((d) => (d.id === next.id ? next : d));
  return next;
};

/**
 * Une lecture n'aboutit jamais dans la même milliseconde que l'envoi. Le
 * document part donc en `processing` et bascule un peu plus tard, ce qui rend
 * visible — et donc dessinable — l'état d'attente de l'écran.
 */
function settleLater(id: number, result: Pick<CandidateDocument, 'ocr_status' | 'extraction'>) {
  setTimeout(() => {
    const current = find(id);
    if (current) replace({ ...current, ...result });
  }, 2500);
}

const mockDocuments: DocumentsRepository = {
  list: () => fakeLatency(documents().map((d) => ({ ...d }))),

  get: (id) => {
    const document = find(id);
    return document ? fakeLatency({ ...document }) : notFound(id);
  },

  upload: (file, type) => {
    const current = documents();
    const id = nextId++;
    const created: CandidateDocument = {
      id,
      type,
      file_path: `documents/${file.name}`,
      url: URL.createObjectURL(file),
      ocr_status: 'processing',
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      extraction: null,
    };
    store = [created, ...current];

    settleLater(id, {
      ocr_status: 'needs_review',
      extraction: {
        id: 900 + id,
        confidence: 58,
        reviewed_at: null,
        extracted_fields: {
          extracted_by: 'gemini',
          full_name: 'Youssef Amrani',
          profession: 'Développeur Full-Stack',
          years_of_experience: 4,
          languages: [{ language: 'Allemand', cefr_level: 'B1' }],
        },
      },
    });

    return fakeLatency({ ...created }, 700);
  },

  review: (id, fields) => {
    const document = find(id);
    if (!document) return notFound(id);

    const reviewed = replace({
      ...document,
      ocr_status: 'completed',
      extraction: document.extraction
        ? { ...document.extraction, extracted_fields: fields, reviewed_at: new Date().toISOString() }
        : null,
    });

    // `applied` reflète ce que le back écrirait : les champs non vides confirmés.
    const applied = Object.entries(fields)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key]) => key);

    return fakeLatency<ReviewResponse>({
      ...reviewed,
      profile_update: { applied, skipped: [] },
    });
  },

  retry: (id) => {
    const document = find(id);
    if (!document) return notFound(id);

    const queued = replace({ ...document, ocr_status: 'processing', extraction: null });
    settleLater(id, {
      ocr_status: 'completed',
      extraction: {
        id: 950 + id,
        confidence: 88,
        reviewed_at: null,
        extracted_fields: { extracted_by: 'gemini', full_name: 'Youssef Amrani' },
      },
    });

    return fakeLatency({ ...queued });
  },

  rescan: (id, file) => {
    const document = find(id);
    if (!document) return notFound(id);

    const queued = replace({
      ...document,
      file_path: `documents/${file.name}`,
      url: URL.createObjectURL(file),
      ocr_status: 'processing',
      extraction: null,
    });
    settleLater(id, {
      ocr_status: 'needs_review',
      extraction: {
        id: 970 + id,
        confidence: 63,
        reviewed_at: null,
        extracted_fields: { extracted_by: 'tesseract', probable_name: 'Y. AMRANI' },
      },
    });

    return fakeLatency({ ...queued }, 700);
  },
};

export const documentsRepository: DocumentsRepository = process.env.NEXT_PUBLIC_USE_MOCKS === '1' ? mockDocuments : httpDocuments;
