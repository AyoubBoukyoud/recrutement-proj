<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\JobOffer;
use Illuminate\Support\Str;

/** Calculate an explainable offer/profile match from explicit preferences. */
class JobOfferMatching
{
    /**
     * Return null when the candidate has not configured any preference. The
     * score is normalized over configured criteria, so an omitted preference
     * neither rewards nor penalizes the offer.
     */
    public function score(CandidateProfile $profile, JobOffer $offer): ?int
    {
        $preferences = $profile->matching_preferences ?? [];
        $checks = [];

        $sectors = collect($preferences['sectors'] ?? [])
            ->flatMap(fn (mixed $sector) => is_string($sector) ? $this->sectorTerms($sector) : [])
            ->unique()->values()->all();
        if ($sectors !== []) {
            $checks[] = in_array($this->normalize($offer->sector), $sectors, true);
        }

        $regions = collect($preferences['regions'] ?? [])
            ->flatMap(fn (mixed $region) => is_string($region) ? $this->regionTerms($region) : [])
            ->unique()->values()->all();
        if ($regions !== []) {
            $checks[] = in_array($this->normalize($offer->city), $regions, true)
                || in_array($this->normalize($offer->country), $regions, true);
        }

        $minimumSalary = $preferences['min_salary'] ?? null;
        if (is_numeric($minimumSalary) && (int) $minimumSalary > 0) {
            $highestSalary = $offer->salary_max ?? $offer->salary_min;
            // Preferences are annual while offer cards display monthly pay.
            $monthlyMinimum = (int) $minimumSalary > 15_000
                ? (int) ceil((int) $minimumSalary / 12)
                : (int) $minimumSalary;
            $checks[] = $highestSalary !== null && $highestSalary >= $monthlyMinimum;
        }

        if ($checks === []) {
            return null;
        }

        return (int) round((count(array_filter($checks)) / count($checks)) * 100);
    }

    /** @return list<string> */
    public function sectorTerms(string $value): array
    {
        $normalized = $this->normalize($value);
        $aliases = [
            'sante' => ['sante', 'health', 'healthcare', 'pflege', 'gesundheit'],
            'logistique' => ['logistique', 'logistics', 'logistik'],
            'electricite' => ['electricite', 'electrical', 'electricity', 'elektro'],
            'hotellerie' => ['hotellerie', 'hospitality', 'hotel', 'gastgewerbe'],
            'construction' => ['construction', 'building', 'bau'],
        ];

        foreach ($aliases as $terms) {
            if (in_array($normalized, $terms, true)) {
                return array_values(array_unique([$value, ...$terms]));
            }
        }

        return [$normalized];
    }

    /** @return list<string> */
    public function regionTerms(string $value): array
    {
        $normalized = $this->normalize($value);
        $aliases = [
            'berlin' => ['berlin'],
            'baviere' => ['baviere', 'bavaria', 'bayern', 'munich', 'munchen'],
            'hambourg' => ['hambourg', 'hamburg'],
            'saxe' => ['saxe', 'saxony', 'sachsen', 'dresden', 'leipzig'],
            'bade-wurtemberg' => ['bade-wurtemberg', 'baden-wurttemberg', 'stuttgart'],
            'hesse' => ['hesse', 'hessen', 'frankfurt'],
        ];

        foreach ($aliases as $terms) {
            if (in_array($normalized, $terms, true)) {
                return array_values(array_unique([$value, ...$terms]));
            }
        }

        return [$normalized];
    }

    private function normalize(string $value): string
    {
        return mb_strtolower(Str::ascii(trim($value)));
    }
}
