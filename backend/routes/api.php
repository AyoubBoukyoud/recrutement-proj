<?php

use App\Http\Controllers\Api\AdminAccountRecoveryController;
use App\Http\Controllers\Api\AdminCandidateController;
use App\Http\Controllers\Api\AdminMarketplaceController;
use App\Http\Controllers\Api\AdminMetricsController;
use App\Http\Controllers\Api\AdminRecruiterController;
use App\Http\Controllers\Api\AdminReferralController;
use App\Http\Controllers\Api\AdminTaskController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateAccountController;
use App\Http\Controllers\Api\CandidateApplicationController;
use App\Http\Controllers\Api\CandidateFavoriteController;
use App\Http\Controllers\Api\CandidateLanguageController;
use App\Http\Controllers\Api\CandidateNotificationController;
use App\Http\Controllers\Api\CandidateProfileController;
use App\Http\Controllers\Api\CandidateReferralController;
use App\Http\Controllers\Api\CandidateSkillController;
use App\Http\Controllers\Api\CandidateTaskController;
use App\Http\Controllers\Api\CandidateVisibilityController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\DeviceSessionController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\JobOfferController;
use App\Http\Controllers\Api\LanguageAssessmentController;
use App\Http\Controllers\Api\PhoneChangeController;
use App\Http\Controllers\Api\RecruiterCandidateController;
use App\Http\Controllers\Api\RecruiterShortlistController;
use App\Http\Controllers\Api\ReferralAgentController;
use Illuminate\Support\Facades\Route;

// Throttles defined in AppServiceProvider. Both endpoints are unauthenticated
// and one of them costs money to serve, so neither may be left unbounded.
Route::post('/auth/otp/request', [AuthController::class, 'requestOtp'])->middleware('throttle:otp-request');
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp-verify');

// `throttle:api` is a generous per-user catch-all (AppServiceProvider) so
// every authenticated route has *some* bound, even the ones with no
// endpoint-specific limiter below. `account.active` refuses a blocked account.
Route::middleware(['auth:sanctum', 'throttle:api', 'account.active'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Devices this account is signed in on.
    Route::get('/auth/sessions', [DeviceSessionController::class, 'index']);
    Route::delete('/auth/sessions/others', [DeviceSessionController::class, 'revokeOthers']);
    Route::delete('/auth/sessions/{session}', [DeviceSessionController::class, 'destroy']);

    // Account recovery: move the account to a new number from a signed-in device.
    Route::post('/auth/phone/change', [PhoneChangeController::class, 'request'])->middleware('throttle:otp-request');
    Route::post('/auth/phone/change/confirm', [PhoneChangeController::class, 'confirm'])->middleware('throttle:otp-verify');

    Route::get('/candidate/profile', [CandidateProfileController::class, 'show']);
    Route::put('/candidate/profile', [CandidateProfileController::class, 'update']);
    Route::post('/candidate/profile/video', [CandidateProfileController::class, 'uploadVideo']);
    // What a recruiter will see, and the declaration that the dossier is done.
    Route::get('/candidate/profile/preview', [CandidateProfileController::class, 'preview']);
    Route::post('/candidate/profile/submit', [CandidateProfileController::class, 'submit']);
    Route::get('/candidate/profile/timeline', [CandidateProfileController::class, 'timeline']);
    Route::get('/candidate/visibility', [CandidateVisibilityController::class, 'show']);
    Route::post('/candidate/visibility/pause', [CandidateVisibilityController::class, 'pause']);
    Route::post('/candidate/visibility/resume', [CandidateVisibilityController::class, 'resume']);
    Route::post('/candidate/consent/withdraw', [CandidateVisibilityController::class, 'withdraw']);
    Route::post('/candidate/consent/grant', [CandidateVisibilityController::class, 'grant']);
    Route::get('/referrals/me', [CandidateReferralController::class, 'show']);

    Route::get('/offers', [JobOfferController::class, 'index']);
    Route::get('/offers/{offer}', [JobOfferController::class, 'show']);
    Route::post('/offers/{offer}/apply', [CandidateApplicationController::class, 'apply']);
    Route::get('/candidate/applications', [CandidateApplicationController::class, 'index']);
    Route::delete('/candidate/applications/{application}', [CandidateApplicationController::class, 'withdraw']);
    Route::get('/candidate/favorites', [CandidateFavoriteController::class, 'index']);
    Route::post('/offers/{offer}/favorite', [CandidateFavoriteController::class, 'store']);
    Route::delete('/offers/{offer}/favorite', [CandidateFavoriteController::class, 'destroy']);
    Route::get('/candidate/notifications', [CandidateNotificationController::class, 'index']);
    Route::patch('/candidate/notifications/read-all', [CandidateNotificationController::class, 'readAll']);
    Route::patch('/candidate/notifications/{notification}/read', [CandidateNotificationController::class, 'read']);
    Route::get('/candidate/account', [CandidateAccountController::class, 'show'])->name('candidate.account.show');
    Route::get('/candidate/account/export', [CandidateAccountController::class, 'export']);
    Route::post('/candidate/account/cancel-deletion', [CandidateAccountController::class, 'cancel'])->name('candidate.account.cancel');
    Route::delete('/candidate/account', [CandidateAccountController::class, 'destroy']);

    Route::get('/candidate/educations', [EducationController::class, 'index']);
    Route::post('/candidate/educations', [EducationController::class, 'store']);
    Route::put('/candidate/educations/{education}', [EducationController::class, 'update']);
    Route::delete('/candidate/educations/{education}', [EducationController::class, 'destroy']);

    Route::get('/candidate/languages', [CandidateLanguageController::class, 'index']);
    Route::put('/candidate/languages', [CandidateLanguageController::class, 'upsert']);
    Route::post('/candidate/languages/{language}/certificate', [CandidateLanguageController::class, 'attachCertificate']);
    Route::delete('/candidate/languages/{language}/certificate', [CandidateLanguageController::class, 'detachCertificate']);

    Route::get('/candidate/skills', [CandidateSkillController::class, 'index']);
    Route::post('/candidate/skills', [CandidateSkillController::class, 'store']);
    Route::patch('/candidate/skills/{skill}', [CandidateSkillController::class, 'update']);
    Route::delete('/candidate/skills/{skill}', [CandidateSkillController::class, 'destroy']);

    Route::get('/candidate/documents', [DocumentController::class, 'index']);
    Route::post('/candidate/documents', [DocumentController::class, 'store'])->middleware('throttle:document-upload');
    Route::get('/candidate/documents/{document}', [DocumentController::class, 'show']);
    Route::patch('/candidate/documents/{document}/review', [DocumentController::class, 'review']);
    // Same file again (a transient API failure) vs. a replacement page (an
    // unreadable scan) — the two failure modes need different remedies. Both
    // dispatch a fresh OCR job, so both share the upload limiter.
    Route::post('/candidate/documents/{document}/retry', [DocumentController::class, 'retry'])->middleware('throttle:document-upload');
    Route::post('/candidate/documents/{document}/rescan', [DocumentController::class, 'rescan'])->middleware('throttle:document-upload');

    Route::get('/candidate/language-assessments', [LanguageAssessmentController::class, 'index']);
    Route::post('/candidate/language-assessments', [LanguageAssessmentController::class, 'store'])->middleware('throttle:language-assessment');
    Route::get('/candidate/language-assessments/{languageAssessment}', [LanguageAssessmentController::class, 'show']);

    // The candidate's side of the daily internship.
    Route::get('/candidate/tasks', [CandidateTaskController::class, 'index']);
    Route::patch('/candidate/tasks/{assignment}', [CandidateTaskController::class, 'update']);

    Route::post('/complaints', [ComplaintController::class, 'store'])->middleware('throttle:complaint-create');
    // The candidate's side of the conversation: their own reports, and the
    // replies administrators have written on them.
    Route::get('/complaints', [ComplaintController::class, 'mine']);
    Route::post('/complaints/{complaint}/seen', [ComplaintController::class, 'markResponseSeen']);

    Route::middleware('role:Commercial Agent')->group(function () {
        Route::get('/referrals/agent', [ReferralAgentController::class, 'show']);
        Route::get('/referrals/agent/registrations', [ReferralAgentController::class, 'registrations']);
        Route::post('/referrals/agent/rotate', [ReferralAgentController::class, 'rotate']);
    });

    Route::middleware('role:Administrator')->group(function () {
        Route::get('/admin/ping', fn () => response()->json(['message' => 'pong', 'role' => 'Administrator']));
        Route::get('/admin/metrics', [AdminMetricsController::class, 'index']);
        Route::get('/admin/offers', [AdminMarketplaceController::class, 'offers']);
        Route::patch('/admin/offers/{offer}', [AdminMarketplaceController::class, 'updateOffer']);
        Route::get('/admin/applications', [AdminMarketplaceController::class, 'applications']);
        Route::get('/admin/activity', [AdminMarketplaceController::class, 'activity']);

        Route::get('/admin/candidates', [AdminCandidateController::class, 'index']);
        Route::post('/admin/candidates/bulk', [AdminCandidateController::class, 'bulk']);
        Route::get('/admin/candidates/{candidateProfile}', [AdminCandidateController::class, 'show']);
        Route::get('/admin/candidates/{candidateProfile}/activity', [AdminCandidateController::class, 'activity']);
        // The administrator's own judgement on a dossier, and on the documents
        // in it — neither of which the completeness checklist can express.
        Route::patch('/admin/candidates/{candidateProfile}', [AdminCandidateController::class, 'update']);
        // Platform access, distinct from that judgement — enforced server-side
        // by EnsureAccountIsActive, not just reflected in a table.
        Route::patch('/admin/candidates/{candidateProfile}/status', [AdminCandidateController::class, 'updateStatus']);
        Route::delete('/admin/candidates/{candidateProfile}', [AdminCandidateController::class, 'destroy']);
        Route::patch('/admin/documents/{document}/approval', [AdminCandidateController::class, 'reviewDocument']);

        // Recruiters: a User with the "Company" role plus its CompanyProfile —
        // there is no separate Recruiter model (see AdminRecruiterController).
        Route::get('/admin/recruiters', [AdminRecruiterController::class, 'index']);
        Route::post('/admin/recruiters/bulk', [AdminRecruiterController::class, 'bulk']);
        Route::get('/admin/recruiters/{recruiter}', [AdminRecruiterController::class, 'show']);
        Route::get('/admin/recruiters/{recruiter}/activity', [AdminRecruiterController::class, 'activity']);
        Route::patch('/admin/recruiters/{recruiter}', [AdminRecruiterController::class, 'update']);
        Route::patch('/admin/recruiters/{recruiter}/status', [AdminRecruiterController::class, 'updateStatus']);
        Route::patch('/admin/recruiters/{recruiter}/verify', [AdminRecruiterController::class, 'verify']);
        Route::delete('/admin/recruiters/{recruiter}', [AdminRecruiterController::class, 'destroy']);

        // The daily remote internship (spec §4): the catalogue, and what each
        // candidate has been given out of it.
        Route::get('/admin/tasks', [AdminTaskController::class, 'index']);
        Route::post('/admin/tasks', [AdminTaskController::class, 'store']);
        Route::patch('/admin/tasks/{task}', [AdminTaskController::class, 'update']);
        Route::delete('/admin/tasks/{task}', [AdminTaskController::class, 'destroy']);
        Route::get('/admin/candidates/{candidateProfile}/assignments', [AdminTaskController::class, 'assignments']);
        Route::post('/admin/candidates/{candidateProfile}/assignments', [AdminTaskController::class, 'assign']);
        Route::patch('/admin/assignments/{assignment}', [AdminTaskController::class, 'updateAssignment']);
        Route::delete('/admin/assignments/{assignment}', [AdminTaskController::class, 'destroyAssignment']);

        Route::get('/admin/complaints', [ComplaintController::class, 'index']);
        Route::patch('/admin/complaints/{complaint}', [ComplaintController::class, 'update']);

        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::get('/admin/roles', [AdminUserController::class, 'roles']);
        Route::patch('/admin/users/{user}', [AdminUserController::class, 'update']);
        Route::patch('/admin/users/{user}/roles', [AdminUserController::class, 'updateRoles']);
        Route::patch('/admin/users/{user}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
        Route::post('/admin/users/{user}/impersonate', [AdminUserController::class, 'impersonate']);
        // Recovery for a candidate who lost both the number and every session.
        Route::patch('/admin/users/{user}/phone', [AdminAccountRecoveryController::class, 'reassignPhone']);
        // Referral commissions: qualified automatically, approved and paid by hand.
        Route::get('/admin/referrals', [AdminReferralController::class, 'index']);
        Route::patch('/admin/referrals/{registration}', [AdminReferralController::class, 'update']);

        // The 501 catch-all that used to sit here is gone: with the admin
        // surface actually built, it turned a typo'd path into "not
        // implemented yet" instead of an honest 404.
    });

    Route::middleware('role:Company')->group(function () {
        Route::get('/recruiter/ping', fn () => response()->json(['message' => 'pong', 'role' => 'Company']));
        Route::get('/recruiter/candidates', [RecruiterCandidateController::class, 'index'])->middleware('throttle:recruiter-search');
        Route::get('/recruiter/offers', [JobOfferController::class, 'mine']);
        Route::get('/recruiter/applications', [CandidateApplicationController::class, 'recruiterIndex']);
        Route::get('/recruiter/candidates/{candidateProfile}', [RecruiterCandidateController::class, 'show']);
        Route::post('/recruiter/offers', [JobOfferController::class, 'store']);
        Route::patch('/recruiter/offers/{offer}', [JobOfferController::class, 'update']);
        Route::delete('/recruiter/offers/{offer}', [JobOfferController::class, 'destroy']);
        Route::patch('/recruiter/applications/{application}', [CandidateApplicationController::class, 'updateStatus']);

        // What a recruiter does with a candidate once they have found them.
        // `export` sits above the parameterised routes so "export" is never
        // read as a candidate id.
        Route::get('/recruiter/shortlist/export', [RecruiterShortlistController::class, 'export']);
        Route::get('/recruiter/shortlist', [RecruiterShortlistController::class, 'index']);
        Route::put('/recruiter/candidates/{candidateProfile}/shortlist', [RecruiterShortlistController::class, 'upsert']);
        Route::delete('/recruiter/candidates/{candidateProfile}/shortlist', [RecruiterShortlistController::class, 'destroy']);
        // Discloses phone/email — an attributable disclosure, and the
        // tightest limiter in the file (see AppServiceProvider).
        Route::post('/recruiter/candidates/{candidateProfile}/contact', [RecruiterShortlistController::class, 'revealContact'])->middleware('throttle:recruiter-contact-reveal');
    });
});
