'use client';

import { MarketingToast, useMarketingToast } from '@/components/amud/MarketingShell';
import { useEmployeursContent } from '@/lib/useLocalizedContent';

/** Îlot client de `/employeurs` : seule la section qui a besoin d'un handler et d'un toast. */
export function RoiCalculatorForm() {
  const { notice, notify } = useMarketingToast();
  const { roi } = useEmployeursContent();

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          notify(roi.toast);
        }}
      >
        <div>
          <label htmlFor="roi-open-positions" className="mb-1 block text-label-md text-amud-on-surface-variant">
            {roi.openPositionsLabel}
          </label>
          <input
            id="roi-open-positions"
            className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
            placeholder={roi.openPositionsPlaceholder}
            type="number"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="roi-industry" className="mb-1 block text-label-md text-amud-on-surface-variant">
            {roi.industryLabel}
          </label>
          <select
            id="roi-industry"
            className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
          >
            {roi.industries.map((industry) => (
              <option key={industry}>{industry}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 w-full rounded bg-amud-inverse-surface py-3 text-label-md text-white transition-colors hover:bg-amud-primary"
        >
          {roi.submit}
        </button>
      </form>
      <MarketingToast notice={notice} />
    </>
  );
}
