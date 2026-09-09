<?php

namespace App\Services;

use App\Models\CandidateProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Turns a recruiter's filter form into a query.
 *
 * Kept out of the controller because the search *is* the product for a
 * recruiter — it has more rules than the endpoint around it, and each one
 * needs to be testable on its own.
 */
class RecruiterCandidateSearch
{
    public const SORTS = ['recent', 'experience', 'name'];

    public const EDUCATION_LEVELS = [
        'general_school', 'vocational', 'professional_training', 'bachelor', 'master', 'other',
    ];

    /** Ascending, so "at least B1" can be expressed as a set rather than a comparison. */
    public const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    /**
     * @param  array<string, mixed>  $filters
     * @param  int|null  $recruiterId  whose shortlist marks to load onto the results
     */
    public function paginate(array $filters, ?int $recruiterId = null): LengthAwarePaginator
    {
        $query = CandidateProfile::query()
            ->with(['languages', 'languageAssessments'])
            // Only candidates who've completed the compliance step are discoverable.
            ->whereNotNull('terms_consent_at')
            ->whereNotNull('cndp_consent_at');
        $query->whereNull('cndp_withdrawn_at')->whereNull('visibility_paused_at');

        if ($recruiterId) {
            $query->with(['shortlistEntries' => fn ($q) => $q->where('user_id', $recruiterId)]);
        }

        $this->applyText($query, $filters);
        $this->applyAttributes($query, $filters);
        $this->applyLanguage($query, $filters);
        $this->applyFlags($query, $filters, $recruiterId);
        $this->applySort($query, $filters['sort'] ?? 'recent');

        $perPage = (int) ($filters['per_page'] ?? 20);

        return $query->paginate($perPage)->withQueryString();
    }

    /** @param  array<string, mixed>  $filters */
    private function applyText(Builder $query, array $filters): void
    {
        if (! empty($filters['profession'])) {
            $query->where('profession', 'like', '%'.$filters['profession'].'%');
        }

        if (! empty($filters['specialization'])) {
            $query->where('specialization', 'like', '%'.$filters['specialization'].'%');
        }

        if (empty($filters['q'])) {
            return;
        }

        // Every word has to land somewhere, so "nurse casablanca" narrows
        // rather than widens. Matching on tokens instead of the whole string
        // also means "Yassin Benali" finds a first name and a surname without
        // a database-specific CONCAT.
        foreach (preg_split('/\s+/u', trim($filters['q'])) ?: [] as $token) {
            if ($token === '') {
                continue;
            }

            $query->where(function (Builder $sub) use ($token) {
                foreach (['first_name', 'last_name', 'profession', 'specialization'] as $column) {
                    $sub->orWhere($column, 'like', '%'.$token.'%');
                }
            });
        }
    }

    /** @param  array<string, mixed>  $filters */
    private function applyAttributes(Builder $query, array $filters): void
    {
        if (! empty($filters['min_experience'])) {
            $query->where('years_of_experience', '>=', $filters['min_experience']);
        }

        if (! empty($filters['availability_status'])) {
            $query->where('availability_status', $filters['availability_status']);
        }

        if (! empty($filters['education_level'])) {
            $query->whereHas('educations', fn (Builder $q) => $q->where('level', $filters['education_level']));
        }
    }

    /** @param  array<string, mixed>  $filters */
    private function applyLanguage(Builder $query, array $filters): void
    {
        if (empty($filters['language'])) {
            return;
        }

        $query->whereHas('languages', function (Builder $q) use ($filters) {
            $q->where('language', $filters['language']);

            if (! empty($filters['cefr_level'])) {
                // An enum column compared with `>=` only sorted correctly by
                // coincidence — MySQL by ordinal, SQLite lexicographically.
                // Spelling out the acceptable levels makes it deliberate, and
                // survives any reordering of the enum.
                $q->whereIn('cefr_level', self::levelsAtLeast($filters['cefr_level']));
            }
        });
    }

    /** @param  array<string, mixed>  $filters */
    private function applyFlags(Builder $query, array $filters, ?int $recruiterId): void
    {
        if (filter_var($filters['has_video'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('presentation_video_path');
        }

        if (filter_var($filters['submitted_only'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('submitted_at');
        }

        if (filter_var($filters['verified_assessment'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereHas('languageAssessments', function (Builder $q) use ($filters) {
                $q->where('status', 'completed')->whereNotNull('predicted_cefr');

                // Scoped to the language being searched for when there is one:
                // a German vacancy is not served by a candidate whose only
                // assessment is in French.
                if (! empty($filters['language'])) {
                    $q->where('language', $filters['language']);
                }
            });
        }

        if ($recruiterId && filter_var($filters['shortlisted_only'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereHas('shortlistEntries', fn (Builder $q) => $q->where('user_id', $recruiterId));
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            // NULLs last either way: a candidate who never filled the field in
            // does not belong at the top of a most-experienced-first list.
            'experience' => $query
                ->orderByRaw('years_of_experience IS NULL')
                ->orderByDesc('years_of_experience')
                ->orderByDesc('updated_at'),
            'name' => $query
                ->orderByRaw('first_name IS NULL')
                ->orderBy('first_name')
                ->orderBy('last_name'),
            default => $query->latest('updated_at'),
        };
    }

    /** @return list<string> every CEFR level at or above the given one */
    public static function levelsAtLeast(string $level): array
    {
        $index = array_search($level, self::CEFR_ORDER, true);

        return $index === false ? self::CEFR_ORDER : array_slice(self::CEFR_ORDER, $index);
    }
}
