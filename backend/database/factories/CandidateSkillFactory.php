<?php

namespace Database\Factories;

use App\Models\CandidateSkill;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CandidateSkill> */
class CandidateSkillFactory extends Factory
{
    protected $model = CandidateSkill::class;

    /** Public so DemoDataSeeder can draw a per-candidate subset without colliding on the unique(candidate_profile_id, skill) constraint. */
    public const SKILLS = [
        'Soudure TIG', 'Lecture de plans', 'Sécurité chantier', 'Pose de câblage',
        'JavaScript', 'PHP', 'Docker', 'Gestion de stock', 'Prise en charge patient',
        'Hygiène HACCP', 'Conduite CACES', 'Diagnostic panne', 'Relation client',
    ];

    public function definition(): array
    {
        return [
            'skill' => fake()->randomElement(self::SKILLS),
            'level' => fake()->randomElement(['debutant', 'intermediaire', 'avance', 'expert']),
            'years_of_experience' => fake()->numberBetween(0, 15),
        ];
    }
}
