<?php

namespace Database\Factories;

use App\Models\CandidateProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CandidateProfile>
 *
 * Dev/demo data only — the real database seeds zero candidates today, so the
 * new admin screens (KPIs, filters, pagination) have nothing to show without
 * this. See DatabaseSeeder for how many and in what states.
 */
class CandidateProfileFactory extends Factory
{
    protected $model = CandidateProfile::class;

    private const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Oujda', 'Meknès', 'Kénitra'];

    private const PROFESSIONS = [
        'Infirmier' => 'Soins intensifs',
        'Aide-soignant' => 'Gériatrie',
        'Soudeur' => 'Soudure TIG',
        'Électricien' => 'Industriel',
        'Mécanicien' => 'Poids lourds',
        'Développeur' => 'Web full-stack',
        'Cuisinier' => 'Restauration collective',
        'Plombier' => 'Chauffage',
    ];

    public function definition(): array
    {
        $profession = fake()->randomElement(array_keys(self::PROFESSIONS));

        return [
            'user_id' => User::factory()->state(['status' => 'active']),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'profession' => $profession,
            'specialization' => self::PROFESSIONS[$profession],
            'years_of_experience' => fake()->numberBetween(0, 20),
            'city' => fake()->randomElement(self::CITIES),
            'date_of_birth' => fake()->dateTimeBetween('-55 years', '-18 years'),
            'availability_status' => fake()->randomElement(['immediate', 'within_1_month', 'within_2_months']),
            'terms_consent_at' => now(),
            'cndp_consent_at' => now(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (CandidateProfile $profile) {
            $profile->user->assignRole('User');
        });
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'submitted_at' => null,
            'verified_at' => null,
            'terms_consent_at' => fake()->boolean(50) ? now() : null,
            'cndp_consent_at' => fake()->boolean(50) ? now() : null,
        ]);
    }

    public function submitted(): static
    {
        return $this->state(fn () => [
            'submitted_at' => fake()->dateTimeBetween('-2 months', 'now'),
            'verified_at' => null,
        ]);
    }

    public function verified(): static
    {
        return $this->state(function (array $attributes) {
            $submittedAt = fake()->dateTimeBetween('-3 months', '-1 week');

            return [
                'submitted_at' => $submittedAt,
                'verified_at' => fake()->dateTimeBetween($submittedAt, 'now'),
            ];
        });
    }
}
