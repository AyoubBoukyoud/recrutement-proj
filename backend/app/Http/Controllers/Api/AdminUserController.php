<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Four roles have been defined since the first migration and there has never
 * been a way to see who holds them, let alone change one. Granting an agent or
 * a recruiter their access meant editing the database by hand.
 */
class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:100'],
            'role' => ['sometimes', 'string', 'max:50'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ]);

        $query = User::query()->with('roles:id,name')->latest();

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('phone', 'like', $term)
                ->orWhere('email', 'like', $term));
        }

        if (! empty($filters['role'])) {
            $query->role($filters['role']);
        }

        $users = $query->paginate($filters['per_page'] ?? 20)->withQueryString();

        $users->getCollection()->transform(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->values(),
            'has_candidate_profile' => $user->candidateProfile()->exists(),
            'created_at' => $user->created_at,
        ]);

        return response()->json($users);
    }

    /**
     * Create an account the person has not signed up for themselves.
     *
     * There is no password to set: this only reserves the phone number and its
     * roles, and the recruiter or agent still signs in by OTP like everybody
     * else. Without it the only way to onboard staff is to ask them to log in
     * as a candidate first so an administrator can find them and promote them,
     * which puts them through the candidate profile wizard for nothing.
     */
    public function store(Request $request): JsonResponse
    {
        $request->merge(['phone' => PhoneNumber::normalize((string) $request->input('phone', ''))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            // Unique against the whole table, not just staff: the phone number
            // IS the credential here, so a duplicate would be two accounts
            // racing for the same sign-in.
            'phone' => ['required', 'string', 'max:20', PhoneNumber::E164_RULE, 'unique:users,phone'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', 'unique:users,email'],
            'roles' => ['present', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
        ], [
            'phone.regex' => 'Enter the number in international format, for example +212600000000.',
            'phone.unique' => 'An account already exists for this number — change its roles instead.',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'status' => 'active',
        ]);

        $user->syncRoles($data['roles']);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->values(),
            'has_candidate_profile' => false,
            'created_at' => $user->created_at,
        ], 201);
    }

    /** The roles a user can be given, so the UI does not hardcode them. */
    public function roles(): JsonResponse
    {
        return response()->json(Role::orderBy('name')->pluck('name'));
    }

    /**
     * Replace a user's roles wholesale — the UI presents them as a set of
     * checkboxes, so a diff-based API would just be reconstructed on the
     * client from the same information.
     */
    public function updateRoles(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'roles' => ['present', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $this->guardAgainstSelfLockout($request, $user, $data['roles']);

        $user->syncRoles($data['roles']);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'roles' => $user->fresh()->roles->pluck('name')->values(),
        ]);
    }

    /**
     * Two ways to lock everyone out of the admin surface, both a single
     * mis-click: dropping your own Administrator role, or removing the last
     * one on the platform. Neither is recoverable from inside the product.
     *
     * @param  array<int, string>  $roles
     */
    private function guardAgainstSelfLockout(Request $request, User $user, array $roles): void
    {
        if (in_array('Administrator', $roles, true) || ! $user->hasRole('Administrator')) {
            return;
        }

        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'roles' => 'You cannot remove your own Administrator role. Ask another administrator to do it.',
            ]);
        }

        if (User::role('Administrator')->count() <= 1) {
            throw ValidationException::withMessages([
                'roles' => 'This is the last administrator. Promote somebody else first.',
            ]);
        }
    }
}
