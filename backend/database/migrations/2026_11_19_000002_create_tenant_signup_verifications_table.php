<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_signup_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('otp_hash');
            $table->char('signup_token_hash', 64)->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->dateTime('expires_at')->index();
            $table->dateTime('verified_at')->nullable();
            $table->dateTime('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'consumed_at', 'id'], 'signup_verifications_email_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_signup_verifications');
    }
};
