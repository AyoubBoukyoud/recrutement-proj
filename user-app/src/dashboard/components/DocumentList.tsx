import { useState } from 'react'
import { Badge, Button, Eyebrow } from './ui'
import type { CandidateDocument } from '../types/candidate'

const GROUPS: { type: CandidateDocument['type']; label: string; blurb: string }[] = [
  { type: 'cv', label: 'CV', blurb: 'The candidate’s own résumé.' },
  {
    type: 'certificate',
    label: 'Language certificates',
    blurb: 'Marked verified when attached as proof of a specific CEFR level.',
  },
  { type: 'diploma', label: 'Diplomas', blurb: 'Qualifications, as uploaded.' },
]

const isImage = (path: string) => /\.(jpe?g|png|webp|gif)$/i.test(path)
const isPdf = (path: string) => /\.pdf$/i.test(path)

/**
 * Evidence, grouped by what it is.
 *
 * Previously one generic loop printed "Download certificate (failed)" — the
 * scanner's status, which reads as a judgement on the candidate — and made a
 * diploma indistinguishable from a certified language proof. Grouping,
 * a verified marker and an inline preview are what let a recruiter actually
 * assess the paperwork instead of downloading three files to find out.
 */
export function DocumentList({ documents }: { documents: CandidateDocument[] }) {
  if (documents.length === 0) return <p className="helper-text">No documents uploaded.</p>

  const present = GROUPS.filter((group) => documents.some((d) => d.type === group.type))

  return (
    <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
      {present.map((group) => (
        <div key={group.type} style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
          <div style={{ display: 'grid', gap: 2 }}>
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
    <div
      style={{
        display: 'grid',
        gap: 'var(--sp-sm)',
        padding: 'var(--sp-sm)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14 }}>{document.file_path.split('/').pop()}</span>
        {document.verified && <Badge tone="done">verified proof</Badge>}
        <span className="helper-text">
          uploaded {new Date(document.uploaded_at).toLocaleDateString()}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--sp-sm)' }}>
          {previewable && (
            <Button variant="ghost" size="compact" onClick={() => setOpen((v) => !v)}>
              {open ? 'Hide' : 'Preview'}
            </Button>
          )}
          {url && (
            <a className="btn btn-ghost btn-compact" href={url} target="_blank" rel="noreferrer">
              Open
            </a>
          )}
        </div>
      </div>

      {open && url && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {isImage(document.file_path) ? (
            <img src={url} alt="" style={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'contain' }} />
          ) : (
            // A PDF in an iframe rather than a new tab: comparing a certificate
            // against the declared level is a side-by-side job.
            <iframe src={url} title="Document preview" style={{ display: 'block', width: '100%', height: 520, border: 0 }} />
          )}
        </div>
      )}
    </div>
  )
}
