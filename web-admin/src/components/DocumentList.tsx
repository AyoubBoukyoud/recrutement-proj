import { useState } from 'react'
import { Badge, Button, Eyebrow } from './ui'
import type { CandidateDocument } from '../types/candidate'

const GROUPS: { type: CandidateDocument['type']; label: string; blurb: string }[] = [
  { type: 'cv', label: 'CV', blurb: 'Le curriculum rédigé par le candidat.' },
  {
    type: 'certificate',
    label: 'Certificats de langue',
    blurb: 'Marqués vérifiés lorsqu’ils sont joints comme preuve d’un niveau CECRL précis.',
  },
  { type: 'diploma', label: 'Diplômes', blurb: 'Les qualifications, telles que téléversées.' },
]

const isImage = (path: string) => /\.(jpe?g|png|webp|gif)$/i.test(path)
const isPdf = (path: string) => /\.pdf$/i.test(path)

/**
 * Les pièces justificatives, groupées par nature.
 *
 * Auparavant une boucle générique imprimait « Télécharger le certificat
 * (échec) » — le statut du scanner, qui se lit comme un jugement sur le
 * candidat — et rendait un diplôme indiscernable d'une preuve de langue
 * certifiée. Le groupement, la marque de vérification et l'aperçu en ligne
 * sont ce qui permet à un recruteur d'apprécier réellement le dossier au lieu
 * de télécharger trois fichiers pour le découvrir.
 */
export function DocumentList({ documents }: { documents: CandidateDocument[] }) {
  if (documents.length === 0) return <p className="helper-text">Aucun document téléversé.</p>

  const present = GROUPS.filter((group) => documents.some((d) => d.type === group.type))

  return (
    <div className="grid gap-4">
      {present.map((group) => (
        <div key={group.type} className="grid gap-2">
          <div className="grid gap-0.5">
            <Eyebrow>{group.label}</Eyebrow>
            <span className="helper-text">{group.blurb}</span>
          </div>
          {documents
            .filter((d) => d.type === group.type)
            .map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
        </div>
      ))}
    </div>
  )
}

function DocumentRow({ document }: { document: CandidateDocument }) {
  const [open, setOpen] = useState(false)
  const url = document.url
  const previewable = url != null && (isImage(document.file_path) || isPdf(document.file_path))

  return (
    <div className="grid gap-2 rounded-element border border-outline-variant p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-on-surface">{document.file_path.split('/').pop()}</span>
        {document.verified && <Badge tone="done">preuve vérifiée</Badge>}
        <span className="helper-text">
          téléversé le {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
        </span>

        <div className="ml-auto flex gap-2">
          {previewable && (
            <Button variant="ghost" size="compact" onClick={() => setOpen((v) => !v)}>
              {open ? 'Masquer' : 'Aperçu'}
            </Button>
          )}
          {url && (
            <a
              className="inline-flex h-9 items-center justify-center rounded-element border border-outline-variant bg-surface-lowest px-3 text-[13px] font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir
            </a>
          )}
        </div>
      </div>

      {open && url && (
        <div className="overflow-hidden rounded-element border border-outline-variant">
          {isImage(document.file_path) ? (
            <img src={url} alt="" className="block max-h-[520px] w-full object-contain" />
          ) : (
            // Un PDF dans un cadre plutôt que dans un nouvel onglet : comparer
            // un certificat au niveau déclaré est un travail côte à côte.
            <iframe src={url} title="Aperçu du document" className="block h-[520px] w-full border-0" />
          )}
        </div>
      )}
    </div>
  )
}
