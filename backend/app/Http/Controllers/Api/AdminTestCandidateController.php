<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateProfile;
use App\Models\User;
use App\Services\CandidateProfileResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Two real candidate accounts an administrator can open from the role
 * switcher, to try the candidate space against the live API (the level exam
 * above all), which the presentation's fictional candidate cannot do.
 *
 *  - `complete`: a submitted dossier with a declared German B1, so the exam
 *    starts straight away. Missing pieces are filled in again on each switch,
 *    edits made while testing are kept.
 *  - `incomplete`: reset to an empty dossier on each switch, so the profile
 *    builder can be walked through from the first step every time.
 *
 * Both are hidden from recruiters (visibility paused) and use addresses under
 * the reserved `.invalid` domain, so nothing is ever sent to them. Opening one
 * goes through the ordinary impersonation endpoint: same short-lived token,
 * same audit entry.
 */
class AdminTestCandidateController extends Controller
{
    public const ACCOUNTS = [
        'complete' => ['email' => 'candidat.complet@test.amudskills.invalid', 'name' => 'Candidat test (profil complet)'],
        'incomplete' => ['email' => 'candidat.incomplet@test.amudskills.invalid', 'name' => 'Candidat test (profil incomplet)'],
    ];

    public function open(Request $request, string $variant, AdminUserController $users): JsonResponse
    {
        $account = self::ACCOUNTS[$variant];

        $user = DB::transaction(function () use ($variant, $account) {
            $user = User::firstOrCreate(['email' => $account['email']], ['name' => $account['name'], 'status' => 'active']);
            if (! $user->hasRole('User')) {
                $user->assignRole('User');
            }
            if (! $user->isActive()) {
                $user->forceFill(['status' => 'active', 'status_reason' => null])->save();
            }

            $profile = CandidateProfileResolver::resolve($user);
            $variant === 'complete' ? $this->complete($profile) : $this->reset($profile);

            return $user;
        });

        return $users->impersonate($request, $user->fresh());
    }

    private function complete(CandidateProfile $profile): void
    {
        $now = now();
        $profile->update([
            'first_name' => $profile->first_name ?: 'Candidat',
            'last_name' => $profile->last_name ?: 'Test',
            'date_of_birth' => $profile->date_of_birth ?: '1996-04-12',
            'profession' => $profile->profession ?: 'Aide-soignant',
            'specialization' => $profile->specialization ?: 'Gériatrie',
            'years_of_experience' => $profile->years_of_experience ?? 3,
            'city' => $profile->city ?: 'Casablanca',
            'availability_status' => $profile->availability_status ?: 'immediate',
            'terms_consent_at' => $profile->terms_consent_at ?: $now,
            'cndp_consent_at' => $profile->cndp_consent_at ?: $now,
            'visibility_paused_at' => $profile->visibility_paused_at ?: $now,
        ]);

        if (! $profile->educations()->exists()) {
            $profile->educations()->create([
                'level' => 'vocational', 'field' => 'Soins infirmiers', 'institution' => 'Institut de formation (test)',
                'started_at' => '2014-09-01', 'ended_at' => '2016-06-30',
            ]);
        }
        if (! $profile->languages()->whereNotNull('cefr_level')->exists()) {
            $profile->languages()->updateOrCreate(['language' => 'de'], [
                'cefr_level' => 'B1', 'self_declared_cefr' => 'B1', 'source' => 'self_declared',
            ]);
        }
        if (! $profile->submitted_at) {
            $profile->update(['submitted_at' => $now]);
        }
    }

    private function reset(CandidateProfile $profile): void
    {
        $profile->educations()->delete();
        $profile->languages()->delete();
        $profile->skills()->delete();
        $profile->update([
            'first_name' => null, 'last_name' => null, 'date_of_birth' => null,
            'profession' => null, 'specialization' => null, 'years_of_experience' => null, 'city' => null,
            'availability_status' => null, 'matching_preferences' => null,
            'terms_consent_at' => null, 'cndp_consent_at' => null,
            'submitted_at' => null,
            'visibility_paused_at' => now(),
        ]);
    }
}
