<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_meals', function (Blueprint $table) {
            $table->date('meal_given_date')->change();
            $table->decimal('delivery_charge', 12, 2)->change();
            $table->index(['meal_given_date', 'deleted_at'], 'orders_meal_date_deleted_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->integer('token_no')->change();
            $table->date('payment_date')->change();
            $table->decimal('amount', 12, 2)->change();
        });

        Schema::table('daily_bazar_costs', function (Blueprint $table) {
            $table->date('date')->change();
            $table->decimal('amount', 12, 2)->change();
            $table->unique('date', 'daily_bazar_costs_date_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username', 'users_username_unique');
            $table->dropIndex('users_token_no_index');
            $table->unique('token_no', 'users_token_no_unique');
            $table->index(['role', 'id'], 'users_role_id_index');
        });

        Schema::table('daily_meal_items', function (Blueprint $table) {
            $table->unique('day', 'daily_meal_items_day_unique');
        });

        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->dropIndex('statements_token_period_index');
            $table->decimal('total_payment', 12, 2)->change();
            $table->decimal('give', 12, 2)->change();
            $table->decimal('take', 12, 2)->change();
            $table->unique(['token_no', 'year', 'month'], 'statements_token_period_unique');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unique('transaction_id', 'payments_transaction_id_unique');
            $table->index(['payment_date', 'id'], 'payments_date_id_index');
            $table->index(['token_no', 'year', 'month', 'amount'], 'payments_token_period_amount_index');
            $table->index(['payment_date', 'token_no', 'amount'], 'payments_date_token_amount_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['author_id', 'id'], 'notifications_author_id_id_index');
        });

        Schema::table('notification_details', function (Blueprint $table) {
            $table->unsignedBigInteger('notification_id')->change();
            $table->unsignedBigInteger('user_id')->change();
            $table->unique(['notification_id', 'user_id'], 'notification_recipients_unique');
            $table->index(['user_id', 'status'], 'notification_user_status_index');
            $table->index(['user_id', 'id', 'notification_id'], 'notification_user_recent_index');
            $table->foreign('notification_id', 'notification_details_notification_fk')
                ->references('id')
                ->on('notifications')
                ->cascadeOnDelete();
            $table->foreign('user_id', 'notification_details_user_fk')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notification_details', function (Blueprint $table) {
            $table->dropForeign('notification_details_notification_fk');
            $table->dropForeign('notification_details_user_fk');
            $table->dropIndex('notification_user_recent_index');
            $table->dropIndex('notification_user_status_index');
            $table->dropUnique('notification_recipients_unique');
            $table->integer('notification_id')->change();
            $table->integer('user_id')->change();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_author_id_id_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_date_token_amount_index');
            $table->dropIndex('payments_token_period_amount_index');
            $table->dropIndex('payments_date_id_index');
            $table->dropUnique('payments_transaction_id_unique');
        });

        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->dropUnique('statements_token_period_unique');
            $table->double('total_payment', 8, 2)->change();
            $table->double('give', 8, 2)->change();
            $table->double('take', 8, 2)->change();
            $table->index(['token_no', 'year', 'month'], 'statements_token_period_index');
        });

        Schema::table('daily_meal_items', function (Blueprint $table) {
            $table->dropUnique('daily_meal_items_day_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_id_index');
            $table->dropUnique('users_token_no_unique');
            $table->index('token_no', 'users_token_no_index');
            $table->dropUnique('users_username_unique');
        });

        Schema::table('daily_bazar_costs', function (Blueprint $table) {
            $table->dropUnique('daily_bazar_costs_date_unique');
            $table->string('date')->change();
            $table->double('amount', 8, 2)->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('token_no')->change();
            $table->string('payment_date')->change();
            $table->double('amount', 8, 2)->change();
        });

        Schema::table('order_meals', function (Blueprint $table) {
            $table->dropIndex('orders_meal_date_deleted_index');
            $table->string('meal_given_date')->change();
            $table->float('delivery_charge', 8, 2)->change();
        });
    }
};
