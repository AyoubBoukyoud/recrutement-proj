<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $t) {
            $t->timestamp('visibility_paused_at')->nullable();
            $t->timestamp('cndp_withdrawn_at')->nullable();
            $t->string('orientation_result')->nullable();
            $t->unsignedTinyInteger('orientation_score')->nullable();
        });
        Schema::table('users', function (Blueprint $t) {
            $t->timestamp('deletion_requested_at')->nullable();
        });
        Schema::create('job_offers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('title');
            $t->text('description');
            $t->string('sector');
            $t->string('city');
            $t->string('country')->default('Germany');
            $t->string('required_cefr_level')->nullable();
            $t->unsignedInteger('salary_min')->nullable();
            $t->unsignedInteger('salary_max')->nullable();
            $t->string('currency', 3)->default('EUR');
            $t->string('contract_type');
            $t->string('status')->default('draft');
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
            $t->index(['status', 'published_at']);
        });
        Schema::create('job_applications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $t->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $t->string('status')->default('submitted');
            $t->timestamp('applied_at');
            $t->timestamp('status_changed_at');
            $t->timestamp('withdrawn_at')->nullable();
            $t->timestamps();
            $t->unique(['candidate_profile_id', 'job_offer_id']);
        });
        Schema::create('job_offer_favorites', function (Blueprint $t) {
            $t->id();
            $t->foreignId('candidate_profile_id')->constrained()->cascadeOnDelete();
            $t->foreignId('job_offer_id')->constrained()->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['candidate_profile_id', 'job_offer_id']);
        });
        Schema::create('app_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type');
            $t->string('title');
            $t->text('body');
            $t->string('link')->nullable();
            $t->timestamp('read_at')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('job_offer_favorites');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_offers');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('deletion_requested_at'));
        Schema::table('candidate_profiles', fn (Blueprint $t) => $t->dropColumn(['visibility_paused_at', 'cndp_withdrawn_at', 'orientation_result', 'orientation_score']));
    }
};
