<?php

use App\Http\Controllers\Api\AdminCandidateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateLanguageController;
use App\Http\Controllers\Api\CandidateProfileController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\LanguageAssessmentController;
use App\Http\Controllers\Api\RecruiterCandidateController;
use App\Http\Controllers\Api\ReferralAgentController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/otp/request', [AuthController::class, 'requestOtp']);
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/candidate/profile', [CandidateProfileController::class, 'show']);
    Route::put('/candidate/profile', [CandidateProfileController::class, 'update']);
    Route::post('/candidate/profile/video', [CandidateProfileController::class, 'uploadVideo']);

    Route::get('/candidate/educations', [EducationController::class, 'index']);
    Route::post('/candidate/educations', [EducationController::class, 'store']);
    Route::put('/candidate/educations/{education}', [EducationController::class, 'update']);
    Route::delete('/candidate/educations/{education}', [EducationController::class, 'destroy']);

    Route::get('/candidate/languages', [CandidateLanguageController::class, 'index']);
    Route::put('/candidate/languages', [CandidateLanguageController::class, 'upsert']);

    Route::get('/candidate/documents', [DocumentController::class, 'index']);
    Route::post('/candidate/documents', [DocumentController::class, 'store']);
    Route::get('/candidate/documents/{document}', [DocumentController::class, 'show']);
    Route::patch('/candidate/documents/{document}/review', [DocumentController::class, 'review']);

    Route::get('/candidate/language-assessments', [LanguageAssessmentController::class, 'index']);
    Route::post('/candidate/language-assessments', [LanguageAssessmentController::class, 'store']);
    Route::get('/candidate/language-assessments/{languageAssessment}', [LanguageAssessmentController::class, 'show']);

    Route::post('/complaints', [ComplaintController::class, 'store']);

    Route::middleware('role:Commercial Agent')->group(function () {
        Route::get('/referrals/agent', [ReferralAgentController::class, 'show']);
        Route::post('/referrals/agent/rotate', [ReferralAgentController::class, 'rotate']);
    });

    Route::middleware('role:Administrator')->group(function () {
        Route::get('/admin/ping', fn () => response()->json(['message' => 'pong', 'role' => 'Administrator']));
        Route::get('/admin/candidates', [AdminCandidateController::class, 'index']);
        Route::get('/admin/complaints', [ComplaintController::class, 'index']);
        Route::patch('/admin/complaints/{complaint}', [ComplaintController::class, 'update']);
        Route::any('/admin/{any?}', fn () => response()->json(['message' => 'Not implemented yet.'], 501))
            ->where('any', '.*');
    });

    Route::middleware('role:Company')->group(function () {
        Route::get('/recruiter/ping', fn () => response()->json(['message' => 'pong', 'role' => 'Company']));
        Route::get('/recruiter/candidates', [RecruiterCandidateController::class, 'index']);
        Route::get('/recruiter/candidates/{candidateProfile}', [RecruiterCandidateController::class, 'show']);
    });
});
