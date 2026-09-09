<?php

namespace Database\Factories;

use App\Models\RecruiterShortlist;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RecruiterShortlist> */
class RecruiterShortlistFactory extends Factory
{
    protected $model = RecruiterShortlist::class;

    public function definition(): array
    {
        return [
            'stage' => fake()->randomElement(RecruiterShortlist::STAGES),
            'notes' => fake()->boolean(40) ? fake()->sentence() : null,
            'contact_revealed_at' => fake()->boolean(50) ? fake()->dateTimeBetween('-2 months', 'now') : null,
        ];
    }
}
