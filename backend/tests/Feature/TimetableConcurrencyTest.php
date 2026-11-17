<?php

namespace Tests\Feature;

use App\Models\RecruitmentCenter;
use App\Models\User;
use App\Services\Timetable\SchedulingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Separate PHP workers and real InnoDB transactions; in-memory SQLite cannot
 * share state between processes, so this integration check is MySQL/MariaDB only. */
class TimetableConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_simultaneous_administrators_cannot_double_book_an_empty_calendar(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true) || ! function_exists('pcntl_fork')) {
            $this->markTestSkipped('Requires MySQL/MariaDB and pcntl.');
        }
        $this->seed(RoleSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('Administrator');
        $center = RecruitmentCenter::create(['name' => 'Concurrent centre', 'category' => 'training_center', 'created_by' => $admin->id]);
        $draft = ['date' => '2026-11-16', 'start_time' => '08:30', 'end_time' => '10:30'];
        foreach (['teacher_id' => 'teachers', 'module_id' => 'modules', 'group_id' => 'groups', 'room_id' => 'rooms'] as $field => $table) {
            $draft[$field] = DB::table('training_'.$table)->insertGetId(['center_id' => $center->id, 'name' => $table, 'name_key' => $table, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::disconnect();
        $workers = [];
        for ($worker = 0; $worker < 2; $worker++) {
            [$parent, $child] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
            $pid = pcntl_fork();
            if ($pid === 0) {
                fclose($parent);
                DB::purge();
                fread($child, 1);
                try {
                    $service = new class extends SchedulingService
                    {
                        public function conflicts(int $centerId, array $data, ?int $exclude = null): array
                        {
                            $result = parent::conflicts($centerId, $data, $exclude);
                            // Widen the race window after checking availability. Without
                            // the parent's write lock both workers would see a free slot.
                            if (! $result) {
                                usleep(300000);
                            }

                            return $result;
                        }
                    };
                    $service->save($admin, $center, [...$draft, 'request_key' => (string) Str::uuid()]);
                    fwrite($child, 'saved');
                } catch (HttpResponseException $error) {
                    fwrite($child, $error->getResponse()->getStatusCode() === 422 ? 'conflict' : 'unexpected');
                } catch (\Throwable $error) {
                    fwrite($child, 'error: '.$error->getMessage());
                }
                fclose($child);
                exit(0);
            }
            $this->assertGreaterThan(0, $pid);
            fclose($child);
            $workers[] = [$pid, $parent];
        }
        foreach ($workers as [, $socket]) {
            fwrite($socket, 'g');
        }
        $results = [];
        foreach ($workers as [$pid, $socket]) {
            $results[] = stream_get_contents($socket);
            fclose($socket);
            pcntl_waitpid($pid, $status);
            $this->assertSame(0, pcntl_wexitstatus($status));
        }
        DB::purge();
        $this->assertEqualsCanonicalizing(['saved', 'conflict'], $results);
        $this->assertDatabaseCount('training_sessions', 1);
        $this->assertDatabaseCount('training_schedule_events', 1);
    }
}
