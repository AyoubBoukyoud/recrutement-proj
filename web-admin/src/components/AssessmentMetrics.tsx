import { useState } from 'react'
import { Badge, Eyebrow, Notice } from './ui'
import type { LanguageAssessmentResult } from '../types/candidate'

const FAILURE_COPY: Record<string, string> = {
  too_short: "L'enregistrement était trop court pour être évalué.",
  unintelligible: "Trop peu de parole intelligible dans l'enregistrement.",
  transcription_unavailable: "Le moteur de reconnaissance était indisponible au moment du traitement.",
}

function Meter({ value, max }: { value: number; max: number }) {
  const filled = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))

  return (
    <div className="h-1 overflow-hidden rounded-sm bg-outline-variant">
      <div
        className={`h-full ${value < 0 ? 'bg-error' : 'bg-primary'}`}
        style={{ width: `${filled * 100}%` }}
      />
    </div>
  )
}

/**
 * Les chiffres derrière une pastille CECRL.
 *
 * Les mots par minute et le taux de mots de remplissage étaient calculés et
 * stockés à chaque évaluation sans être montrés à personne ; la spécification
 * promet aux recruteurs de pouvoir examiner les mesures, et une lettre n'est
 * pas une mesure. La clarté et le détail des composantes sont là pour la même
 * raison — un recruteur qui décide d'un entretien doit pouvoir voir si un B2
 * vient d'une parole assurée ou d'un débit rapide au vocabulaire réduit.
 */
export function AssessmentMetrics({ assessments }: { assessments: LanguageAssessmentResult[] }) {
  return (
    <div className="grid gap-4">
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
      <div className="flex flex-wrap items-center gap-2">
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
    <div className="grid gap-2 border-b border-outline-variant pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="done">
          {assessment.language.toUpperCase()} {assessment.predicted_cefr}
        </Badge>
        {assessment.words_per_minute !== null && <Badge>{assessment.words_per_minute} mots/min</Badge>}
        {assessment.pronunciation_score !== null && (
          <Badge>clarté {assessment.pronunciation_score}/100</Badge>
        )}
        {assessment.filler_word_ratio !== null && (
          <Badge>hésitations {(assessment.filler_word_ratio * 100).toFixed(1)} %</Badge>
        )}
        {assessment.duration_seconds !== null && (
          <span className="helper-text">{Math.round(assessment.duration_seconds)} s enregistrées</span>
        )}
      </div>

      {breakdown && (
        <div className="grid max-w-[420px] gap-1.5">
          {[...breakdown.components, breakdown.penalty].map((component) => (
            <div key={component.key} className="grid gap-[3px]">
              <div className="flex justify-between text-[13px] text-on-surface">
                <span>{component.label}</span>
                <span className="font-mono tabular-nums text-on-surface-variant">
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
              La clarté n&apos;a pas pu être mesurée sur cet enregistrement — le niveau ne repose que sur le débit
              et le vocabulaire.
            </span>
          )}
          {breakdown.pronunciation && breakdown.pronunciation.unclear_words.length > 0 && (
            <div className="grid gap-[3px]">
              <Eyebrow>Mots que le moteur n&apos;a pas su situer</Eyebrow>
              <span className="text-[13px] text-on-surface">
                {breakdown.pronunciation.unclear_words.map((w) => w.word).join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}

      {assessment.transcript && (
        <div className="grid gap-1">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="cursor-pointer justify-self-start border-none bg-transparent p-0 text-[13px] text-primary hover:underline"
          >
            {showTranscript ? 'Masquer la transcription' : 'Afficher la transcription'}
          </button>
          {showTranscript && <p className="helper-text max-w-[640px]">{assessment.transcript}</p>}
        </div>
      )}

      {/* Dit franchement, parce que la mesure est facile à surinterpréter : c'est
          un indicateur d'intelligibilité, pas un examen de phonétique. */}
      {assessment.pronunciation_score !== null && breakdown?.estimated_from_clarity && (
        <Notice tone="pending">
          La clarté reflète la confiance avec laquelle le moteur a reconnu chaque mot. À prendre comme un signal
          de présélection, pas comme une note de prononciation certifiée.
        </Notice>
      )}
    </div>
  )
}
