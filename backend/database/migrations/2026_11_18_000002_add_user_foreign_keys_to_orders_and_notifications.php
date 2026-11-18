<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('order_meals')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('users')
                    ->whereColumn('users.id', 'order_meals.user_id');
            })
            ->delete();

        DB::table('notifications')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('users')
                    ->whereColumn('users.id', 'notifications.author_id');
            })
            ->delete();

        Schema::table('order_meals', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->change();
            $table->foreign('user_id', 'order_meals_user_fk')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('author_id')->change();
            $table->foreign('author_id', 'notifications_author_fk')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign('notifications_author_fk');
            $table->integer('author_id')->change();
        });

        Schema::table('order_meals', function (Blueprint $table) {
            $table->dropForeign('order_meals_user_fk');
            $table->integer('user_id')->change();
        });
    }
};
