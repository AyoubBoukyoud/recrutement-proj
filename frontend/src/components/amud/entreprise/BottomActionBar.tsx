'use client';

/**
 * Barre d'actions sticky mobile (Contacter/Planifier/Favoris — cahier des
 * charges §43), utilisée sur les fiches candidat/candidature. Se place
 * au-dessus de la barre de navigation du bas (`bottom-16`) sur mobile ; sur
 * desktop, redevient un simple bloc sticky en bas du contenu.
 */
export function BottomActionBar({
  onContacter,
  onPlanifier,
  onFavori,
  isFavori = false,
}: {
  onContacter: () => void;
  onPlanifier: () => void;
  onFavori: () => void;
  isFavori?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-20 border-t border-amud-outline-variant bg-amud-surface p-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:sticky md:bottom-0">
      <div className="mx-auto flex max-w-3xl items-center gap-sm">
        <button
          onClick={onContacter}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant px-sm py-2.5 text-label-md font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Contacter
        </button>
        <button
          onClick={onPlanifier}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amud-primary px-sm py-2.5 text-label-md font-medium text-white shadow-sm transition-colors hover:brightness-110"
        >
          <span className="material-symbols-outlined text-[18px]">event</span>
          Planifier
        </button>
        <button
          onClick={onFavori}
          aria-pressed={isFavori}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isFavori ? 'border-amud-secondary bg-amud-secondary-container text-amud-on-secondary-container' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
          }`}
          aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <span className="material-symbols-outlined text-[20px]" style={isFavori ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            star
          </span>
        </button>
      </div>
    </div>
  );
}
