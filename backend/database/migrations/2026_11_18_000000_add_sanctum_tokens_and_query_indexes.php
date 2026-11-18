<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        } elseif (!Schema::hasColumn('personal_access_tokens', 'expires_at')) {
            Schema::table('personal_access_tokens', function (Blueprint $table) {
                $table->timestamp('expires_at')->nullable();
            });
        }

        Schema::table('email_otp_verification', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->char('reset_token_hash', 64)->nullable()->index('otp_reset_token_hash_index');
            $table->index(['email', 'expires_at'], 'otp_email_expiry_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'status'], 'users_role_status_index');
            $table->index('token_no', 'users_token_no_index');
        });

        Schema::table('order_meals', function (Blueprint $table) {
            $table->index(['user_id', 'meal_given_date'], 'orders_user_date_index');
            $table->index(['token_no', 'meal_given_date'], 'orders_token_date_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['token_no', 'payment_date'], 'payments_token_date_index');
        });

        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->index(['token_no', 'year', 'month'], 'statements_token_period_index');
        });

        Schema::table('notification_details', function (Blueprint $table) {
            $table->index(['user_id', 'notification_id'], 'notification_user_item_index');
        });
    }

    public function down(): void
    {
        Schema::table('notification_details', function (Blueprint $table) {
            $table->dropIndex('notification_user_item_index');
        });

        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->dropIndex('statements_token_period_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_token_date_index');
        });

        Schema::table('order_meals', function (Blueprint $table) {
            $table->dropIndex('orders_user_date_index');
            $table->dropIndex('orders_token_date_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_status_index');
            $table->dropIndex('users_token_no_index');
        });

        Schema::table('email_otp_verification', function (Blueprint $table) {
            $table->dropIndex('otp_reset_token_hash_index');
            $table->dropIndex('otp_email_expiry_index');
            $table->dropColumn(['expires_at', 'verified_at', 'reset_token_hash']);
        });

        if (Schema::hasColumn('personal_access_tokens', 'expires_at')) {
            Schema::table('personal_access_tokens', function (Blueprint $table) {
                $table->dropColumn('expires_at');
            });
        }
    }
};
