<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A prospect a commercial or an administrator has been in touch with — a
 * training/recruitment center, not a platform account. Created ad hoc by
 * whoever makes first contact; there is no signup flow behind it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruitment_centers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('contact_person')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitment_centers');
    }
};
