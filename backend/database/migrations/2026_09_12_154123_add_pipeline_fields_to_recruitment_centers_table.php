<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A center starts life as a lead — nothing is promoted or copied, the same
 * row just carries a call status and an offer status that move forward as
 * someone works it. `category` distinguishes the two kinds of prospect this
 * programme deals with: a Moroccan training center, or a German business
 * that would take on candidates directly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_centers', function (Blueprint $table) {
            $table->enum('category', ['training_center', 'business_germany'])->after('name');
            $table->enum('call_status', ['not_called', 'no_answer', 'called', 'call_back'])
                ->default('not_called')->after('contact_person');
            $table->enum('offer_status', ['pending', 'negotiating', 'accepted', 'refused'])
                ->default('pending')->after('call_status');
        });
    }

    public function down(): void
    {
        Schema::table('recruitment_centers', function (Blueprint $table) {
            $table->dropColumn(['category', 'call_status', 'offer_status']);
        });
    }
};
