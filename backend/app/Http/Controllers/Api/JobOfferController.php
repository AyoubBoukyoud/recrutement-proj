<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOffer;
use App\Services\JobOfferMatching;
use App\Services\Notifications;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Published offer discovery plus the recruiter's offer CRUD. */
class JobOfferController extends Controller
{
    public function __construct(
        private readonly JobOfferMatching $matching,
        private readonly Notifications $notifications,
    ) {}

    public function mine(Request $request): JsonResponse
    {
        $this->company($request);
        $data = $request->validate([
            'status' => 'sometimes|in:draft,published,closed',
            'per_page' => 'sometimes|integer|min:5|max:100',
        ]);
        $query = JobOffer::where('user_id', $request->user()->id)->withCount('applications');
        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }

        return response()->json($query->latest()->paginate($data['per_page'] ?? 20));
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sector' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'contract_type' => ['sometimes', 'in:permanent,fixed_term,apprenticeship,temporary,internship'],
            'required_cefr_level' => ['sometimes', 'in:A1,A2,B1,B2,C1,C2'],
            'q' => ['sometimes', 'string', 'max:150'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $query = JobOffer::with('employer.companyProfile')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());

        foreach (['contract_type', 'required_cefr_level'] as $field) {
            if (! empty($data[$field])) {
                $query->where($field, $data[$field]);
            }
        }
        if (! empty($data['sector'])) {
            $terms = $this->matching->sectorTerms($data['sector']);
            $query->where(fn (Builder $builder) => collect($terms)->each(
                fn (string $term) => $builder->orWhere('sector', 'like', "%{$term}%")
            ));
        }
        if (! empty($data['city'])) {
            $terms = $this->matching->regionTerms($data['city']);
            $query->where(fn (Builder $builder) => collect($terms)->each(
                fn (string $term) => $builder->orWhere('city', 'like', "%{$term}%")
            ));
        }
        if (! empty($data['q'])) {
            $search = $data['q'];
            $query->where(fn (Builder $builder) => $builder
                ->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhere('sector', 'like', "%{$search}%"));
        }

        $offers = $query->latest('published_at')->paginate($data['per_page'] ?? 20);
        $profile = $request->user()->candidateProfile;
        if ($profile) {
            $offers->getCollection()->each(function (JobOffer $offer) use ($profile) {
                $offer->setAttribute('match_score', $this->matching->score($profile, $offer));
            });
        }

        return response()->json($offers);
    }

    public function show(Request $request, JobOffer $offer): JsonResponse
    {
        abort_unless($offer->status === 'published' && $offer->published_at?->isPast(), 404);
        $offer->load('employer.companyProfile');
        if ($request->user()->candidateProfile) {
            $offer->setAttribute('match_score', $this->matching->score($request->user()->candidateProfile, $offer));
        }

        return response()->json($offer);
    }

    public function store(Request $request): JsonResponse
    {
        $this->company($request);
        $data = $this->validated($request);
        $data['user_id'] = $request->user()->id;
        if (($data['status'] ?? 'draft') === 'published') {
            $data['published_at'] ??= now();
        }
        $offer = JobOffer::create($data);
        if ($offer->status === 'published') {
            $this->notifications->matchingOfferPublished($offer);
        }

        return response()->json($offer, 201);
    }

    public function update(Request $request, JobOffer $offer): JsonResponse
    {
        $this->owns($request, $offer);
        $wasPublished = $offer->status === 'published';
        $data = $this->validated($request, true);
        if (($data['status'] ?? null) === 'published' && ! $offer->published_at) {
            $data['published_at'] = now();
        }
        $offer->update($data);
        if (! $wasPublished && $offer->status === 'published') {
            $this->notifications->matchingOfferPublished($offer);
        }

        return response()->json($offer->fresh());
    }

    public function destroy(Request $request, JobOffer $offer): JsonResponse
    {
        $this->owns($request, $offer);
        abort_if($offer->applications()->exists(), 409, 'An offer with applications cannot be deleted.');
        $offer->delete();

        return response()->json([], 204);
    }

    private function company(Request $request): void
    {
        abort_unless($request->user()->hasRole('Company'), 403);
    }

    private function owns(Request $request, JobOffer $offer): void
    {
        $this->company($request);
        abort_unless($offer->user_id === $request->user()->id, 403);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $partial = false): array
    {
        $presence = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$presence, 'string', 'max:255'],
            'description' => [$presence, 'string'],
            'sector' => [$presence, 'string', 'max:100'],
            'city' => [$presence, 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'required_cefr_level' => ['nullable', 'in:A1,A2,B1,B2,C1,C2'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'gte:salary_min'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'contract_type' => [$presence, 'in:permanent,fixed_term,apprenticeship,temporary,internship'],
            'status' => ['sometimes', 'in:draft,published,closed'],
            'published_at' => ['nullable', 'date'],
        ]);
    }
}
