<?php

namespace Database\Factories;

use App\Models\CompanyProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CompanyProfile> */
class CompanyProfileFactory extends Factory
{
    protected $model = CompanyProfile::class;

    private const SECTORS = ['Santé', 'BTP', 'Industrie', 'Restauration', 'IT', 'Logistique'];

    private const CITIES = ['Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès'];

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['status' => 'active']),
            'company_name' => fake()->company(),
            'sector' => fake()->randomElement(self::SECTORS),
            'city' => fake()->randomElement(self::CITIES),
            'phone' => fake()->numerify('+2125#######'),
            'website' => fake()->domainName(),
            'employees_count' => fake()->numberBetween(5, 500),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (CompanyProfile $profile) {
            $profile->user->assignRole('Company');
        });
    }

    public function verified(): static
    {
        return $this->state(fn () => ['verified_at' => fake()->dateTimeBetween('-2 months', 'now')]);
    }
}
