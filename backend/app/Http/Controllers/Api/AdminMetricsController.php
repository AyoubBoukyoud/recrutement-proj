<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\Complaint;
use App\Models\Document;
use App\Models\LanguageAssessment;
use App\Models\RecruiterShortlist;
use App\Models\ReferralRegistration;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Models\JobOffer;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * The "system metrics" half of the Administrator role (spec §4), which had no
 * representation at all: the dashboard could show one page of candidates and
 * nothing about the platform as a whole.
 *
 * Every figure is a count over an indexed column — this is a dashboard header
 * that reloads on a timer, not a reporting warehouse, so it must stay cheap.
 */
class AdminMetricsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'candidates' => $this->candidates(),
            'recruiters' => $this->recruiters(),
            'documents' => $this->documents(),
            'complaints' => $this->complaints(),
            'assessments' => $this->assessments(),
            'internship' => $this->internship(),
            'growth' => $this->growth(),
            'marketplace' => [
                'offers_total' => JobOffer::count(),
                'offers_published' => JobOffer::where('status', 'published')->count(),
                'offers_draft' => JobOffer::where('status', 'draft')->count(),
                'applications_total' => JobApplication::count(),
                'applications_pending' => JobApplication::whereIn('status', ['submitted', 'viewed'])->count(),
                'interviews' => JobApplication::where('status', 'interview')->count(),
                'accepted' => JobApplication::where('status', 'accepted')->count(),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function candidates(): array
    {
        $total = CandidateProfile::count();
        $submitted = CandidateProfile::whereNotNull('submitted_at')->count();
        $complete = CandidateProfile::whereNotNull('first_name')->whereNotNull('last_name')
            ->whereNotNull('date_of_birth')->whereNotNull('availability_status')
            ->whereNotNull('terms_consent_at')->whereNotNull('cndp_consent_at')
            ->whereHas('educations')
            ->whereHas('languages', fn ($q) => $q->whereNotNull('cefr_level'))
            ->count();

        return [
            'total' => $total,
            'submitted' => $submitted,
            'verified' => CandidateProfile::whereNotNull('verified_at')->count(),
            // Discoverable by recruiters — both consents on record.
            'discoverable' => CandidateProfile::whereNotNull('terms_consent_at')
                ->whereNotNull('cndp_consent_at')->count(),
            'drafts' => $total - $submitted,
            'new_this_week' => CandidateProfile::where('created_at', '>=', now()->subWeek())->count(),
            'active' => CandidateProfile::whereHas('user', fn ($q) => $q->where('status', 'active'))->count(),
            'profiles_complete' => $complete,
            'profiles_incomplete' => $total - $complete,
            // Both keyed off the same recruiter shortlist pipeline everyone
            // else in this admin surface uses — see App\Services\ActivityFeed
            // and the plan this feature was built from for why: there is no
            // separate job-application/interview entity in this product.
            'in_shortlist' => RecruiterShortlist::distinct('candidate_profile_id')->count('candidate_profile_id'),
            'interviewing' => RecruiterShortlist::where('stage', 'interviewing')
                ->distinct('candidate_profile_id')->count('candidate_profile_id'),
            'placed' => RecruiterShortlist::where('stage', 'placed')
                ->distinct('candidate_profile_id')->count('candidate_profile_id'),
        ];
    }

    /** @return array<string, mixed> */
    private function recruiters(): array
    {
        $recruiters = User::role('Company');

        return [
            'total' => (clone $recruiters)->count(),
            'active' => (clone $recruiters)->where('status', 'active')->count(),
            'pending_verification' => (clone $recruiters)
                ->whereDoesntHave('companyProfile', fn ($q) => $q->whereNotNull('verified_at'))
                ->count(),
            'verified' => (clone $recruiters)
                ->whereHas('companyProfile', fn ($q) => $q->whereNotNull('verified_at'))
                ->count(),
            'blocked' => (clone $recruiters)->where('status', 'blocked')->count(),
            'shortlisted_candidates' => RecruiterShortlist::count(),
            'interviews_scheduled' => RecruiterShortlist::where('stage', 'interviewing')->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function documents(): array
    {
        $byApproval = Document::query()
            ->select('approval_status', DB::raw('count(*) as total'))
            ->groupBy('approval_status')
            ->pluck('total', 'approval_status');

        return [
            'total' => (int) $byApproval->sum(),
            'awaiting_approval' => (int) ($byApproval['pending'] ?? 0),
            'approved' => (int) ($byApproval['approved'] ?? 0),
            'rejected' => (int) ($byApproval['rejected'] ?? 0),
            // Our scanner could not read these — an operational problem for us
            // rather than a judgement on the candidate.
            'unreadable' => Document::where('ocr_status', 'failed')->count(),
            'needs_candidate_review' => Document::where('ocr_status', 'needs_review')->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function complaints(): array
    {
        $byStatus = Complaint::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'open' => (int) ($byStatus['open'] ?? 0),
            'in_review' => (int) ($byStatus['in_review'] ?? 0),
            'resolved' => (int) ($byStatus['resolved'] ?? 0),
            // Nobody was reachable when these came in — a configuration fault
            // that is otherwise invisible.
            'unannounced' => Complaint::whereNull('admin_notified_at')
                ->where('status', '!=', 'resolved')->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function assessments(): array
    {
        $byStatus = LanguageAssessment::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'total' => (int) $byStatus->sum(),
            'completed' => (int) ($byStatus['completed'] ?? 0),
            'failed' => (int) ($byStatus['failed'] ?? 0),
            'in_flight' => (int) ($byStatus['pending'] ?? 0) + (int) ($byStatus['processing'] ?? 0),
        ];
    }

    /** @return array<string, mixed> */
    private function internship(): array
    {
        $assignedToday = TaskAssignment::whereDate('assigned_for', today())->count();
        $completedToday = TaskAssignment::whereDate('completed_at', today())->count();

        return [
            'assigned_today' => $assignedToday,
            'completed_today' => $completedToday,
            'overdue' => TaskAssignment::where('status', 'assigned')
                ->whereDate('assigned_for', '<', today())->count(),
            // Distinct candidates who did something today, which is the
            // engagement number the spec is actually asking about.
            'active_candidates_today' => TaskAssignment::whereDate('completed_at', today())
                ->distinct('candidate_profile_id')->count('candidate_profile_id'),
            'candidates_with_assignments' => TaskAssignment::distinct('candidate_profile_id')
                ->count('candidate_profile_id'),
        ];
    }

    /** @return array<string, mixed> */
    private function growth(): array
    {
        return [
            'users' => User::count(),
            'referred_registrations' => ReferralRegistration::count(),
            'referred_this_week' => ReferralRegistration::where('registered_at', '>=', now()->subWeek())->count(),
        ];
    }
}
