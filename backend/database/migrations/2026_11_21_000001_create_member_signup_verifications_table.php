<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_signup_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('otp_hash');
            $table->char('signup_token_hash', 64)->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->dateTime('expires_at')->index();
            $table->dateTime('verified_at')->nullable();
            $table->dateTime('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'email', 'consumed_at', 'id'], 'member_signup_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_signup_verifications');
    }
};
