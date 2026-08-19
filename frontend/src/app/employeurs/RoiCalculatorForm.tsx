'use client';

import { MarketingToast, useMarketingToast } from '@/components/amud/MarketingShell';

/** Îlot client de `/employeurs` : seule la section qui a besoin d'un handler et d'un toast. */
export function RoiCalculatorForm() {
  const { notice, notify } = useMarketingToast();

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          notify('Estimation calculée — un conseiller vous recontacte pour l’affiner.');
        }}
      >
        <div>
          <label htmlFor="roi-open-positions" className="mb-1 block text-label-md text-amud-on-surface-variant">
            Open Positions
          </label>
          <input
            id="roi-open-positions"
            className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
            placeholder="e.g., 3"
            type="number"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="roi-industry" className="mb-1 block text-label-md text-amud-on-surface-variant">
            Industry
          </label>
          <select
            id="roi-industry"
            className="w-full rounded border-amud-outline-variant bg-amud-surface-container-lowest focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
          >
            <option>Healthcare (Avg 212 days)</option>
            <option>Logistics (Avg 145 days)</option>
            <option>IT (Avg 160 days)</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 w-full rounded bg-amud-inverse-surface py-3 text-label-md text-white transition-colors hover:bg-amud-primary"
        >
          Calculate Savings
        </button>
      </form>
      <MarketingToast notice={notice} />
    </>
  );
}
