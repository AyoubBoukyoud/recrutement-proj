import { useState } from 'react'
import { Badge, Eyebrow, Notice } from './ui'
import type { LanguageAssessmentResult } from '../types/candidate'

const FAILURE_COPY: Record<string, string> = {
  too_short: 'Recording was too short to assess.',
  unintelligible: 'Too little intelligible speech in the recording.',
  transcription_unavailable: 'The speech engine was unavailable when this was processed.',
}

function Meter({ value, max }: { value: number; max: number }) {
  const filled = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))

  return (
    <div style={{ height: 4, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${filled * 100}%`,
          background: value < 0 ? 'var(--error, #a03427)' : 'var(--accent)',
        }}
      />
    </div>
  )
}

/**
 * The numbers behind a CEFR badge.
 *
 * Words per minute and filler ratio were being computed and stored on every
 * assessment and shown to nobody; the spec promises recruiters can review the
 * metrics, and one letter is not a metric. Clarity and the component
 * breakdown are here for the same reason — a recruiter deciding on an
 * interview should be able to see whether a B2 came from confident speech or
 * from a fast talker with a small vocabulary.
 */
export function AssessmentMetrics({ assessments }: { assessments: LanguageAssessmentResult[] }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-md)' }}>
      {assessments.map((assessment) => (
        <AssessmentRow key={assessment.id} assessment={assessment} />
      ))}
    </div>
  )
}

function AssessmentRow({ assessment }: { assessment: LanguageAssessmentResult }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const breakdown = assessment.score_breakdown

  if (assessment.status !== 'completed') {
    return (
      <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge tone="pending">
          {assessment.language.toUpperCase()} {assessment.status}
        </Badge>
        {assessment.failure_reason && (
          <span className="helper-text">
            {FAILURE_COPY[assessment.failure_reason] ?? assessment.failure_reason}
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)', paddingBottom: 'var(--sp-sm)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge tone="done">
          {assessment.language.toUpperCase()} {assessment.predicted_cefr}
        </Badge>
        {assessment.words_per_minute !== null && <Badge>{assessment.words_per_minute} wpm</Badge>}
        {assessment.pronunciation_score !== null && (
          <Badge>clarity {assessment.pronunciation_score}/100</Badge>
        )}
        {assessment.filler_word_ratio !== null && (
          <Badge>fillers {(assessment.filler_word_ratio * 100).toFixed(1)}%</Badge>
        )}
        {assessment.duration_seconds !== null && (
          <span className="helper-text">{Math.round(assessment.duration_seconds)}s recorded</span>
        )}
      </div>

      {breakdown && (
        <div style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
          {[...breakdown.components, breakdown.penalty].map((component) => (
            <div key={component.key} style={{ display: 'grid', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{component.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                  {component.contribution > 0 ? '+' : ''}
                  {component.contribution.toFixed(2)}
                </span>
              </div>
              <Meter value={Math.abs(component.contribution)} max={Math.abs(component.max)} />
              <span className="helper-text">{component.detail}</span>
            </div>
          ))}
          {!breakdown.estimated_from_clarity && (
            <span className="helper-text">
              Clarity could not be measured for this recording — the level rests on pace and vocabulary alone.
            </span>
          )}
          {breakdown.pronunciation && breakdown.pronunciation.unclear_words.length > 0 && (
            <div style={{ display: 'grid', gap: 3 }}>
              <Eyebrow>Words the engine could not place</Eyebrow>
              <span style={{ fontSize: 13 }}>
                {breakdown.pronunciation.unclear_words.map((w) => w.word).join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}

      {assessment.transcript && (
        <div style={{ display: 'grid', gap: 4 }}>
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            style={{
              justifySelf: 'start',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--accent-dim)',
              fontSize: 13,
            }}
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showTranscript && (
            <p className="helper-text" style={{ maxWidth: 640 }}>
              {assessment.transcript}
            </p>
          )}
        </div>
      )}

      {/* Stated plainly, because the metric is easy to over-read: it is an
          intelligibility proxy, not a phonetic exam. */}
      {assessment.pronunciation_score !== null && breakdown?.estimated_from_clarity && (
        <Notice tone="pending">
          Clarity reflects how confidently the speech engine recognised each word. Treat it as a screening signal,
          not a certified pronunciation score.
        </Notice>
      )}
    </div>
  )
}
