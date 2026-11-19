<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_impersonations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('platform_admin_id')->index();
            $table->string('platform_admin_username');
            $table->unsignedBigInteger('target_user_id')->index();
            $table->string('target_username');
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('tenant_name');
            $table->string('tenant_slug');
            $table->unsignedBigInteger('access_token_id')->nullable()->index();
            $table->string('reason', 500);
            $table->dateTime('started_at');
            $table->dateTime('expires_at')->index();
            $table->dateTime('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_impersonations');
    }
};
