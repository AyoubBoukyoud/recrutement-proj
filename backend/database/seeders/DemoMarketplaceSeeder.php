<?php

namespace Database\Seeders;

use App\Models\CandidateProfile;
use App\Models\CompanyProfile;
use App\Models\JobOffer;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Fictional marketplace content for local development and demos: 20 recruiters
 * (with their company profile), 20 candidates and 20 published job offers.
 *
 * Everything here is invented. Each account uses the `@demo.amudskills.test`
 * domain and each company says so in its description, so demo rows can be
 * told apart from real ones and removed with
 * `User::where('email', 'like', '%@demo.amudskills.test')->delete()`.
 *
 * It refuses to run in production: real candidates would be shown job offers
 * from employers that do not exist.
 *
 *   php artisan db:seed --class=DemoMarketplaceSeeder
 *
 * Re-running is safe: rows are keyed on the demo email address.
 */
class DemoMarketplaceSeeder extends Seeder
{
    private const DOMAIN = 'demo.amudskills.test';

    /** [company, sector, city, employees, offer title, CEFR, salary min, salary max, contract, experience, education] */
    private const EMPLOYERS = [
        ['Klinikum Lindenhof GmbH', 'Santé', 'Hamburg', 850, 'Infirmier(ère) diplômé(e) — médecine interne', 'B1', 2900, 3500, 'permanent', 'one_to_three', 'vocational'],
        ['Pflegeverbund Nordlicht', 'Santé', 'Kiel', 240, 'Infirmier(ère) en soins intensifs', 'B2', 3100, 3800, 'permanent', 'three_to_five', 'bachelor'],
        ['Seniorenresidenz Am Rosengarten', 'Santé', 'Köln', 120, 'Aide-soignant(e) en gériatrie', 'B1', 2500, 2900, 'permanent', 'less_than_one', 'vocational'],
        ['Altenpflege Elbblick', 'Santé', 'Dresden', 95, 'Aide-soignant(e) — résidence seniors', 'A2', 2400, 2800, 'fixed_term', 'none', 'high_school'],
        ['Bauwerk Südstern GmbH', 'BTP', 'München', 310, 'Maçon coffreur', 'A2', 2700, 3300, 'permanent', 'one_to_three', 'vocational'],
        ['Hochbau Rheintal AG', 'BTP', 'Mannheim', 460, 'Électricien du bâtiment', 'B1', 2800, 3400, 'permanent', 'one_to_three', 'vocational'],
        ['Stahlbau Weserwerk', 'Industrie', 'Bremen', 180, 'Soudeur TIG/MIG', 'A2', 2900, 3600, 'permanent', 'three_to_five', 'vocational'],
        ['Maschinenbau Falkenberg', 'Industrie', 'Stuttgart', 520, 'Mécanicien industriel', 'B1', 3000, 3700, 'permanent', 'three_to_five', 'vocational'],
        ['Elektro Brandt & Söhne', 'Industrie', 'Hannover', 60, 'Électricien industriel', 'B1', 2800, 3400, 'permanent', 'one_to_three', 'vocational'],
        ['Kfz-Meisterbetrieb Gerber', 'Industrie', 'Nürnberg', 35, 'Mécanicien poids lourds', 'A2', 2700, 3200, 'apprenticeship', 'none', 'high_school'],
        ['Logistik Hanse Cargo', 'Logistique', 'Hamburg', 700, 'Préparateur(trice) de commandes — cariste', 'A1', 2300, 2700, 'permanent', 'none', 'none'],
        ['Spedition Mittelland', 'Logistique', 'Kassel', 150, 'Chauffeur-livreur', 'A2', 2500, 3000, 'fixed_term', 'less_than_one', 'high_school'],
        ['Gasthaus Zur Linde', 'Restauration', 'Freiburg', 28, 'Cuisinier(ère) en restauration', 'A2', 2400, 2900, 'permanent', 'one_to_three', 'vocational'],
        ['Catering Frischküche Berlin', 'Restauration', 'Berlin', 90, 'Cuisinier(ère) en restauration collective', 'A2', 2500, 3000, 'permanent', 'one_to_three', 'vocational'],
        ['Hotel Seeblick', 'Restauration', 'Konstanz', 70, 'Réceptionniste d’hôtel', 'B2', 2400, 2800, 'permanent', 'less_than_one', 'high_school'],
        ['Digitalwerk Pixelhain', 'IT', 'Berlin', 45, 'Développeur(se) web full-stack', 'B1', 3600, 4600, 'permanent', 'three_to_five', 'bachelor'],
        ['Cloudschmiede GmbH', 'IT', 'Leipzig', 80, 'Technicien(ne) support informatique', 'B1', 2800, 3300, 'permanent', 'less_than_one', 'bachelor'],
        ['Netzwerk Technik Kraft', 'IT', 'Düsseldorf', 130, 'Administrateur(trice) systèmes et réseaux', 'B2', 3500, 4300, 'permanent', 'three_to_five', 'bachelor'],
        ['Sanitär Wasserburg', 'BTP', 'Augsburg', 22, 'Plombier chauffagiste', 'A2', 2700, 3200, 'permanent', 'one_to_three', 'vocational'],
        ['Heizung & Klima Wiesental', 'BTP', 'Karlsruhe', 38, 'Installateur(trice) climatisation', 'B1', 2800, 3400, 'permanent', 'one_to_three', 'vocational'],
    ];

    /** [first name, last name, profession, specialization, city, years of experience, CEFR] */
    private const CANDIDATES = [
        ['Youssef', 'Benali', 'Infirmier', 'Soins intensifs', 'Casablanca', 6, 'B1'],
        ['Salma', 'El Idrissi', 'Infirmier', 'Médecine interne', 'Rabat', 4, 'B2'],
        ['Hamza', 'Tahiri', 'Aide-soignant', 'Gériatrie', 'Fès', 2, 'A2'],
        ['Imane', 'Alaoui', 'Aide-soignant', 'Gériatrie', 'Marrakech', 5, 'B1'],
        ['Anas', 'Berrada', 'Soudeur', 'Soudure TIG', 'Tanger', 8, 'A2'],
        ['Khadija', 'Lahlou', 'Cuisinier', 'Restauration collective', 'Agadir', 3, 'A2'],
        ['Omar', 'Chraibi', 'Électricien', 'Industriel', 'Casablanca', 7, 'B1'],
        ['Sara', 'Bennani', 'Développeur', 'Web full-stack', 'Rabat', 4, 'B2'],
        ['Mehdi', 'Fassi', 'Mécanicien', 'Poids lourds', 'Meknès', 9, 'A2'],
        ['Nadia', 'Ouazzani', 'Plombier', 'Chauffage', 'Oujda', 5, 'A1'],
        ['Yassine', 'Zniber', 'Électricien', 'Industriel', 'Kénitra', 3, 'A2'],
        ['Lamia', 'Kettani', 'Infirmier', 'Soins intensifs', 'Casablanca', 10, 'B2'],
        ['Reda', 'Sebti', 'Développeur', 'Web full-stack', 'Marrakech', 2, 'B1'],
        ['Hajar', 'Amrani', 'Cuisinier', 'Restauration collective', 'Fès', 6, 'B1'],
        ['Soufiane', 'Filali', 'Soudeur', 'Soudure TIG', 'Tanger', 11, 'A2'],
        ['Meryem', 'Naciri', 'Aide-soignant', 'Gériatrie', 'Rabat', 1, 'A1'],
        ['Ilyas', 'Guessous', 'Mécanicien', 'Poids lourds', 'Agadir', 4, 'A2'],
        ['Zineb', 'Tazi', 'Infirmier', 'Médecine interne', 'Meknès', 3, 'B1'],
        ['Amine', 'Cherkaoui', 'Plombier', 'Chauffage', 'Casablanca', 8, 'A2'],
        ['Asmae', 'Benjelloun', 'Développeur', 'Web full-stack', 'Fès', 5, 'B2'],
    ];

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('DemoMarketplaceSeeder never runs in production.');

            return;
        }

        $this->call(RoleSeeder::class);

        $recruiters = $this->seedRecruiters();
        $this->seedCandidates();
        $this->seedOffers($recruiters);

        $this->command?->info('Demo marketplace ready: 20 recruiters, 20 candidates, 20 job offers.');
    }

    /** @return array<int, User> keyed by position in self::EMPLOYERS */
    private function seedRecruiters(): array
    {
        $users = [];

        foreach (self::EMPLOYERS as $i => [$company, $sector, $city, $employees]) {
            $email = sprintf('demo.recruteur%02d@%s', $i + 1, self::DOMAIN);
            $user = User::where('email', $email)->first();

            if (! $user) {
                $user = User::factory()->create([
                    'name' => 'Recrutement '.$company,
                    'email' => $email,
                    'phone' => sprintf('+2126000%05d', 10001 + $i),
                ]);

                CompanyProfile::factory()->verified()->create([
                    'user_id' => $user->id,
                    'company_name' => $company,
                    'sector' => $sector,
                    'city' => $city,
                    'country' => 'Allemagne',
                    'employees_count' => $employees,
                    'website' => null,
                    'description' => 'Entreprise fictive — données de démonstration.',
                ]);
            }

            $users[$i] = $user;
        }

        return $users;
    }

    private function seedCandidates(): void
    {
        foreach (self::CANDIDATES as $i => [$first, $last, $profession, $specialization, $city, $years, $cefr]) {
            $email = sprintf('demo.candidat%02d@%s', $i + 1, self::DOMAIN);

            if (User::where('email', $email)->exists()) {
                continue;
            }

            $user = User::factory()->create([
                'name' => $first.' '.$last,
                'email' => $email,
                'phone' => sprintf('+2126000%05d', 20001 + $i),
            ]);

            $profile = CandidateProfile::factory()->verified()->create([
                'user_id' => $user->id,
                'first_name' => $first,
                'last_name' => $last,
                'profession' => $profession,
                'specialization' => $specialization,
                'city' => $city,
                'years_of_experience' => $years,
                'availability_status' => 'immediate',
            ]);

            // Same minimum as the documented demo candidate in DatabaseSeeder:
            // one education row and one assessed language, otherwise the
            // candidate layout keeps redirecting to profile-creation.
            $profile->educations()->create([
                'level' => 'vocational',
                'field' => $profession,
                'institution' => 'Institut de formation — '.$city,
                'started_at' => now()->subYears($years + 3)->startOfYear()->toDateString(),
                'ended_at' => now()->subYears($years + 1)->startOfYear()->toDateString(),
            ]);
            $profile->languages()->create([
                'language' => 'de',
                'cefr_level' => $cefr,
                'source' => 'self_declared',
            ]);
        }
    }

    /** @param array<int, User> $recruiters */
    private function seedOffers(array $recruiters): void
    {
        foreach (self::EMPLOYERS as $i => [$company, $sector, $city, , $title, $cefr, $min, $max, $contract, $experience, $education]) {
            $employer = $recruiters[$i];

            if (JobOffer::where('user_id', $employer->id)->where('title', $title)->exists()) {
                continue;
            }

            JobOffer::create([
                'user_id' => $employer->id,
                'title' => $title,
                'description' => "{$company} recrute à {$city}. Offre fictive — données de démonstration.",
                'responsibilities' => "Participer à l'activité quotidienne de l'équipe, dans le respect des consignes de sécurité et de qualité.",
                'requirements' => "Diplôme ou expérience dans le métier, niveau d'allemand {$cefr} minimum, envie de s'installer en Allemagne.",
                'benefits' => 'Contrat encadré, accompagnement administratif à l’arrivée, formation continue.',
                'sector' => $sector,
                'city' => $city,
                'country' => 'Germany',
                'workplace_type' => 'onsite',
                'weekly_hours' => 38,
                'experience_level' => $experience,
                'education_level' => $education,
                'required_cefr_level' => $cefr,
                'salary_min' => $min,
                'salary_max' => $max,
                'currency' => 'EUR',
                'contract_type' => $contract,
                'start_date' => now()->addMonths(2)->startOfMonth()->toDateString(),
                'application_deadline' => now()->addMonth()->toDateString(),
                'positions_count' => 1 + ($i % 3),
                'status' => 'published',
                'published_at' => now()->subDays(($i * 3) % 28),
            ]);
        }
    }
}
