<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_centers', function (Blueprint $table) {
            $table->unsignedBigInteger('timetable_revision')->default(0);
        });
        Schema::create('training_center_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 30);
            $table->unique(['center_id', 'user_id']);
            $table->timestamps();
        });
        foreach (['teachers', 'modules', 'groups', 'rooms'] as $resource) {
            Schema::create('training_'.$resource, function (Blueprint $table) {
                $table->id();
                $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
                $table->string('name', 150);
                $table->string('name_key', 150);
                $table->unique(['center_id', 'name_key']);
                $table->timestamps();
            });
        }
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('training_teachers')->restrictOnDelete();
            $table->foreignId('module_id')->constrained('training_modules')->restrictOnDelete();
            $table->foreignId('group_id')->constrained('training_groups')->restrictOnDelete();
            $table->foreignId('room_id')->constrained('training_rooms')->restrictOnDelete();
            // Academic wall-clock values, always Africa/Casablanca; never UTC dates.
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('version')->default(1);
            $table->uuid('request_key');
            $table->unique(['center_id', 'request_key']);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            foreach (['teacher_id', 'group_id', 'room_id'] as $resource) {
                $table->index(['center_id', 'date', $resource, 'start_time'], 'training_sessions_'.$resource.'_lookup');
            }
        });
        Schema::create('training_schedule_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('session_id');
            $table->string('action', 15);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_schedule_events');
        Schema::dropIfExists('training_sessions');
        foreach (['rooms', 'groups', 'modules', 'teachers'] as $resource) {
            Schema::dropIfExists('training_'.$resource);
        }
        Schema::dropIfExists('training_center_members');
        Schema::table('recruitment_centers', fn (Blueprint $table) => $table->dropColumn('timetable_revision'));
    }
};
