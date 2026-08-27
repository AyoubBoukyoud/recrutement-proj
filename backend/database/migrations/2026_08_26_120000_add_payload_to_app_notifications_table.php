<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Notifications are rendered in the candidate's current language. The legacy
 * title/body columns stay in place as a fallback for rows created before this
 * migration and for clients that do not understand a new notification type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_notifications', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('app_notifications', function (Blueprint $table) {
            $table->dropColumn('payload');
        });
    }
};
