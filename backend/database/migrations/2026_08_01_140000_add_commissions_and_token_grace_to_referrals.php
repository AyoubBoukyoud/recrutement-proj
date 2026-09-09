<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_agents', function (Blueprint $table) {
            // Null means "use the configured default" — most agents are on it,
            // and a column full of the same number invites drift.
            $table->decimal('commission_rate', 10, 2)->nullable()->after('qr_code_token');
            // The token rotation replaced, still honoured until it expires so
            // printed QR codes already in the field keep working.
            $table->string('previous_qr_code_token')->nullable()->after('commission_rate');
            $table->timestamp('previous_token_expires_at')->nullable()->after('previous_qr_code_token');

            $table->index('previous_qr_code_token');
        });

        Schema::table('referral_registrations', function (Blueprint $table) {
            // pending → qualified → approved → paid, or rejected at any point.
            // A registration is not money until the candidate does something
            // worth paying for; see ReferralCommissions.
            $table->enum('commission_status', ['pending', 'qualified', 'approved', 'paid', 'rejected'])
                ->default('pending')
                ->after('registered_at');
            $table->decimal('commission_amount', 10, 2)->nullable()->after('commission_status');
            $table->string('commission_currency', 3)->nullable()->after('commission_amount');
            // When the referred candidate submitted their dossier — the point
            // the referral became worth something.
            $table->timestamp('qualified_at')->nullable()->after('commission_currency');
            $table->timestamp('approved_at')->nullable()->after('qualified_at');
            $table->timestamp('paid_at')->nullable()->after('approved_at');
            // Bank transfer reference, cash receipt number — whatever the
            // finance side used, so a dispute can be traced off-platform.
            $table->string('payout_reference')->nullable()->after('paid_at');
            $table->text('payout_note')->nullable()->after('payout_reference');

            $table->index('commission_status');
        });
    }

    public function down(): void
    {
        Schema::table('referral_agents', function (Blueprint $table) {
            $table->dropIndex(['previous_qr_code_token']);
            $table->dropColumn(['commission_rate', 'previous_qr_code_token', 'previous_token_expires_at']);
        });

        Schema::table('referral_registrations', function (Blueprint $table) {
            $table->dropIndex(['commission_status']);
            $table->dropColumn([
                'commission_status', 'commission_amount', 'commission_currency',
                'qualified_at', 'approved_at', 'paid_at', 'payout_reference', 'payout_note',
            ]);
        });
    }
};
