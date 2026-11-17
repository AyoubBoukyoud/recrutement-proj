<?php

namespace Database\Seeders;

use App\Models\RecruitmentCenter;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\Timetable\SchedulingService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use RuntimeException;

/** Explicit local-only fixtures; never included in DatabaseSeeder or migrations.
 * Repeat runs preserve edited sessions and do not duplicate the current week. */
class TimetableDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Timetable demo data is only available in local/testing environments.');
        }
        $actor = User::role('Administrator')->where('status', 'active')->orderBy('id')->first();
        if (! $actor) {
            throw new RuntimeException('An existing active Administrator account is required.');
        }
        $week = CarbonImmutable::today(SchedulingService::TIMEZONE)->startOfWeek();
        $service = app(SchedulingService::class);
        $created = 0;
        $center = DB::transaction(function () use ($actor, $week, $service, &$created) {
            $created = 0;
            $center = RecruitmentCenter::firstOrCreate(
                ['email' => 'timetable@demo.amudskills.test'],
                ['name' => 'AmudSkills — Centre de démonstration', 'category' => 'training_center', 'city' => 'Casablanca', 'address' => 'Centre fictif pour essais locaux', 'created_by' => $actor->id],
            );
            $service->lock($center);
            $service->authorize($actor, $center, true);
            $names = [
                'teachers' => ['Amina Idrissi', 'Youssef El Amrani', 'Salma Bennani', 'Karim Alaoui'],
                'modules' => ['Comptabilité générale', 'Fiscalité', 'Contrôle de gestion', 'Économie', 'Droit des affaires', 'Informatique de gestion'],
                'groups' => ['GEOCF201', 'GEOCF301', 'GEOCF401'],
                'rooms' => ['Salle 01', 'Salle 04', 'Salle Info', 'Salle TP'],
            ];
            $ids = [];
            foreach ($names as $kind => $labels) {
                foreach ($labels as $label) {
                    $table = DB::table('training_'.$kind);
                    $existing = (clone $table)->where('center_id', $center->id)->where('name_key', mb_strtolower($label))->value('id');
                    $ids[$kind][] = $existing ?? $table->insertGetId(['center_id' => $center->id, 'name' => $label, 'name_key' => mb_strtolower($label), 'created_at' => now(), 'updated_at' => now()]);
                }
            }
            // Parallel classes use distinct professors, groups and rooms. The
            // afternoon rotates groups; breaks remain available for drag tests.
            for ($weekOffset = 0; $weekOffset < 2; $weekOffset++) {
                for ($day = 0; $day < 6; $day++) {
                    $date = $week->addWeeks($weekOffset)->addDays($day)->toDateString();
                    $slots = [
                        [0, 0, 0, '08:30', '10:30'],
                        [1, 1, 1, '08:30', '10:30'],
                        [2, 2, 2, '10:30', '12:30'],
                        [$day % 3, 3, 3, '14:00', '16:00'],
                    ];
                    foreach ($slots as $slot => [$group, $teacher, $room, $start, $end]) {
                        $requestKey = Uuid::uuid5(Uuid::NAMESPACE_URL, "amudskills:local-timetable:v1:{$center->id}:{$date}:{$slot}")->toString();
                        if (TrainingSession::where('center_id', $center->id)->where('request_key', $requestKey)->exists()) {
                            continue;
                        }
                        $service->save($actor, $center, [
                            'teacher_id' => $ids['teachers'][$teacher],
                            'module_id' => $ids['modules'][($day + $slot + $weekOffset) % count($ids['modules'])],
                            'group_id' => $ids['groups'][$group],
                            'room_id' => $ids['rooms'][$room],
                            'date' => $date,
                            'start_time' => $start,
                            'end_time' => $end,
                            'request_key' => $requestKey,
                        ]);
                        $created++;
                    }
                }
            }

            return $center;
        }, 5);
        $this->command?->info("{$center->name} (#{$center->id}) : {$created} cours ajoutés du ".$week->toDateString().' au '.$week->addDays(12)->toDateString().'.');
        $this->command?->line('3 groupes · 4 professeurs · 6 modules · 4 salles. Actualisez /amud/centre/planning.');
    }
}
