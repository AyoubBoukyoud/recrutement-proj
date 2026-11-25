<?php

namespace App\Services\LanguageTest;

use App\Models\CandidateProfile;
use App\Models\LanguageTest;
use App\Models\LanguageTestItem;
use App\Models\LanguageTestResponse;
use Illuminate\Support\Collection;

/**
 * Decides which level's exam a candidate sits, and draws its items.
 *
 * The level comes from the evidence on file, strongest first: the level on
 * an attached certificate, else the level the candidate declared, else the
 * candidate picks one. The exam then checks that level.
 */
class ExamAssembler
{
    public function __construct(private readonly ExamBlueprint $blueprint) {}

    /**
     * @return array{level: string|null, source: 'certificate'|'declared'|'chosen'}
     */
    public function examLevel(CandidateProfile $profile, string $language): array
    {
        $last = $profile->languageTests()->where('language', $language)->where('status', 'validated')
            ->orderByDesc('completed_at')->orderByDesc('id')->first();
        if ($last?->outcome === 'not_demonstrated') {
            // A lower level needs its own complete exam; leave the certificate intact.
            return ['level' => null, 'source' => 'chosen'];
        }
        $row = $profile->languages()->where('language', $language)->first();

        if ($row && $row->certificate_document_id && $row->cefr_level) {
            return ['level' => $row->cefr_level, 'source' => 'certificate'];
        }

        $declared = $row?->self_declared_cefr ?? ($row && $row->source === 'self_declared' ? $row->cefr_level : null);
        if ($declared) {
            return ['level' => $declared, 'source' => 'declared'];
        }

        return ['level' => null, 'source' => 'chosen'];
    }

    /** Every section of the level's exam has at least one approved, usable item. */
    public function isAvailable(string $language, string $level): bool
    {
        foreach ($this->blueprint->requirements($level) as $req) {
            if ($this->candidates($language, $level, $req['skill'], $req['task_type'])->count() < $req['per_exam']) {
                return false;
            }
        }

        return true;
    }

    /**
     * The oral must match the provisional level. Missing bank coverage is an
     * availability issue, not a reason to examine someone at another level.
     */
    public function oralLevel(string $language, string $provisional): ?string
    {
        return $this->hasSection($language, $provisional, 'oral') ? $provisional : null;
    }

    public function hasSection(string $language, string $level, string $section): bool
    {
        foreach ($this->blueprint->requirements($level) as $req) {
            if ($req['skill'] === $section && $this->candidates($language, $level, $section, $req['task_type'])->count() < $req['per_exam']) {
                return false;
            }
        }

        return true;
    }

    /** @return list<string> */
    public function availableLevels(string $language): array
    {
        return array_values(array_filter($this->blueprint->levels(), fn ($l) => $this->isAvailable($language, $l)));
    }

    /**
     * Create the response rows for the given sections, one per task of the
     * blueprint, picking items the candidate has not seen in an earlier exam
     * whenever the bank allows.
     *
     * @param  list<string>  $sections
     */
    public function draw(LanguageTest $test, array $sections, ?string $level = null): void
    {
        $level ??= $test->exam_level;
        $seen = LanguageTestResponse::query()
            ->whereHas('languageTest', fn ($q) => $q->where('candidate_profile_id', $test->candidate_profile_id))
            ->pluck('item_id')
            ->all();

        $position = (int) $test->responses()->max('position');
        $blueprint = $this->blueprint->forLevel($level);

        foreach ($sections as $section) {
            $taken = [];
            foreach ($blueprint[$section]['tasks'] ?? [] as $task) {
                $pool = $this->candidates($test->language, $level, $section, $task['task_type'])
                    ->reject(fn (LanguageTestItem $i) => in_array($i->id, $taken, true));

                $fresh = $pool->reject(fn (LanguageTestItem $i) => in_array($i->id, $seen, true));
                $item = ($fresh->isNotEmpty() ? $fresh : $pool)->shuffle()->first();

                if (! $item) {
                    throw new ExamRefusal("The {$level} exam is not available yet.", 409, 'exam_unavailable');
                }

                $taken[] = $item->id;
                $test->responses()->create([
                    'item_id' => $item->id,
                    'section' => $section,
                    'position' => ++$position,
                    'status' => 'pending',
                ]);
            }
        }
    }

    /** @return Collection<int, LanguageTestItem> */
    private function candidates(string $language, string $level, string $skill, string $taskType): Collection
    {
        return LanguageTestItem::query()
            ->approved()
            ->where(['language' => $language, 'cefr_level' => $level, 'skill' => $skill, 'task_type' => $taskType])
            ->when($skill === 'listening', fn ($q) => $q->whereNotNull('audio_path'))
            ->get();
    }
}
