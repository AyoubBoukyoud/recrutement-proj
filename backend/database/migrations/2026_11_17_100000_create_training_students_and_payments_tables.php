<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Students, group memberships and monthly payments for training centres.
 * Builds on the timetable tables: a "formation" is a training_modules row and a
 * group is a training_groups row, so planning, rosters and finance share ids.
 *
 * Financial history is effective-dated, never overwritten: fees by month,
 * memberships and activity as date periods, each membership keeping the
 * formation it was billed under. Reports read these records, not today's settings.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->string('level', 20)->nullable();
        });
        Schema::create('training_formation_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->char('effective_from', 7); // first month (YYYY-MM) this fee applies to
            $table->decimal('amount', 10, 2)->nullable(); // null = no fee from that month
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['module_id', 'effective_from']);
        });
        Schema::table('training_groups', function (Blueprint $table) {
            // Defaults used to pre-fill the session form; sessions keep their own values.
            $table->foreignId('module_id')->nullable()->constrained('training_modules')->restrictOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('training_teachers')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('training_rooms')->nullOnDelete();
            $table->unsignedSmallInteger('capacity')->nullable();
        });
        Schema::create('training_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('level', 20)->nullable();
            $table->string('status', 10)->default('active');
            $table->text('notes')->nullable();
            $table->date('registered_on');
            $table->date('deactivated_on')->nullable();
            $table->timestamps();
            $table->index(['center_id', 'status']);
            $table->index(['center_id', 'last_name']);
        });
        // Activity periods; ended_on is the last active day (inclusive), null while active.
        Schema::create('training_student_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('training_students')->cascadeOnDelete();
            $table->date('started_on');
            $table->date('ended_on')->nullable();
            $table->timestamps();
            $table->index(['student_id', 'started_on']);
            $table->index(['center_id', 'started_on']);
        });
        // Membership periods. A reassignment closes one row and opens another;
        // module_id snapshots the group's formation for that period.
        Schema::create('training_group_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('training_groups')->restrictOnDelete();
            $table->foreignId('student_id')->constrained('training_students')->cascadeOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('training_modules')->restrictOnDelete();
            $table->date('joined_on');
            $table->date('ended_on')->nullable(); // last day in the group (inclusive)
            $table->timestamps();
            $table->index(['group_id', 'ended_on']);
            $table->index(['student_id', 'joined_on']);
            $table->index(['center_id', 'joined_on']);
        });
        Schema::create('training_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('recruitment_centers')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('training_students')->restrictOnDelete();
            $table->char('period', 7); // YYYY-MM the payment covers
            $table->decimal('amount', 10, 2);
            $table->date('paid_on');
            $table->string('method', 20);
            $table->string('reference', 100)->nullable();
            $table->string('note', 255)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['center_id', 'period']);
            $table->index(['student_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_payments');
        Schema::dropIfExists('training_group_students');
        Schema::dropIfExists('training_student_periods');
        Schema::dropIfExists('training_students');
        Schema::table('training_groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('module_id');
            $table->dropConstrainedForeignId('teacher_id');
            $table->dropConstrainedForeignId('room_id');
            $table->dropColumn('capacity');
        });
        Schema::dropIfExists('training_formation_fees');
        Schema::table('training_modules', fn (Blueprint $table) => $table->dropColumn('level'));
    }
};
