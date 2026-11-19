<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const TENANT_TABLES = [
        'admin_profile',
        'daily_meal_items',
        'notifications',
        'notification_details',
        'meal_rates',
        'order_meals',
        'payments',
        'monthly_statements',
        'daily_bazar_costs',
        'email_otp_verification',
    ];

    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price', 12, 2)->default(0);
            $table->char('currency', 3)->default('BDT');
            $table->string('interval')->default('monthly');
            $table->unsignedSmallInteger('trial_days')->default(0);
            $table->unsignedInteger('max_members')->nullable();
            $table->json('features')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->string('status')->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->string('gateway')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'current_period_end'], 'tenant_subscriptions_status_period_index');
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained('tenant_subscriptions')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3);
            $table->string('transaction_id', 64)->unique();
            $table->string('status')->default('Pending')->index();
            $table->string('gateway')->default('sslcommerz');
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'created_at'], 'subscription_payments_tenant_created_index');
        });

        DB::table('subscription_plans')->insert([
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'price' => 0,
                'currency' => 'BDT',
                'interval' => 'monthly',
                'trial_days' => 14,
                'max_members' => null,
                'features' => json_encode(['member_management', 'meal_orders', 'reports']),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Legacy',
                'slug' => 'legacy',
                'price' => 0,
                'currency' => 'BDT',
                'interval' => 'monthly',
                'trial_days' => 0,
                'max_members' => null,
                'features' => json_encode(['member_management', 'meal_orders', 'reports']),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Canteen Pro',
                'slug' => 'canteen-pro',
                'price' => config('saas.default_monthly_price', 1000),
                'currency' => 'BDT',
                'interval' => 'monthly',
                'trial_days' => 14,
                'max_members' => null,
                'features' => json_encode(['member_management', 'meal_orders', 'reports', 'priority_support']),
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $profileName = DB::table('admin_profile')->value('shop_name');
        $tenantName = is_string($profileName) && trim($profileName) !== ''
            ? trim($profileName)
            : config('app.name', 'Canteen');
        $slug = Str::slug($tenantName) ?: 'canteen';
        $baseSlug = $slug;
        $suffix = 2;
        while (DB::table('tenants')->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix++;
        }

        $tenantId = DB::table('tenants')->insertGetId([
            'name' => $tenantName,
            'slug' => $slug,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
            $table->foreign('tenant_id', 'users_tenant_fk')->references('id')->on('tenants')->restrictOnDelete();
        });

        foreach (self::TENANT_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->unsignedBigInteger('tenant_id')->nullable()->index($tableName.'_tenant_id_index');
                $table->foreign('tenant_id', $tableName.'_tenant_fk')
                    ->references('id')
                    ->on('tenants')
                    ->cascadeOnDelete();
            });
        }

        DB::table('users')->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
        foreach (self::TENANT_TABLES as $tableName) {
            DB::table($tableName)->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
            $table->dropUnique('users_phone_unique');
            $table->dropUnique('users_username_unique');
            $table->dropUnique('users_token_no_unique');
            $table->unique(['tenant_id', 'email'], 'users_tenant_email_unique');
            $table->unique(['tenant_id', 'phone'], 'users_tenant_phone_unique');
            $table->unique(['tenant_id', 'username'], 'users_tenant_username_unique');
            $table->unique(['tenant_id', 'token_no'], 'users_tenant_token_unique');
            $table->index(['tenant_id', 'role', 'status'], 'users_tenant_role_status_index');
        });

        Schema::table('daily_meal_items', function (Blueprint $table) {
            $table->dropUnique('daily_meal_items_day_unique');
            $table->unique(['tenant_id', 'day'], 'daily_meals_tenant_day_unique');
        });

        Schema::table('daily_bazar_costs', function (Blueprint $table) {
            $table->dropUnique('daily_bazar_costs_date_unique');
            $table->unique(['tenant_id', 'date'], 'bazar_tenant_date_unique');
        });

        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->dropUnique('statements_token_period_unique');
            $table->unique(['tenant_id', 'token_no', 'year', 'month'], 'statements_tenant_period_unique');
        });

        $legacyPlanId = DB::table('subscription_plans')->where('slug', 'legacy')->value('id');
        DB::table('tenant_subscriptions')->insert([
            'tenant_id' => $tenantId,
            'plan_id' => $legacyPlanId,
            'status' => 'active',
            'starts_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('monthly_statements', function (Blueprint $table) {
            $table->dropUnique('statements_tenant_period_unique');
            $table->unique(['token_no', 'year', 'month'], 'statements_token_period_unique');
        });

        Schema::table('daily_bazar_costs', function (Blueprint $table) {
            $table->dropUnique('bazar_tenant_date_unique');
            $table->unique('date', 'daily_bazar_costs_date_unique');
        });

        Schema::table('daily_meal_items', function (Blueprint $table) {
            $table->dropUnique('daily_meals_tenant_day_unique');
            $table->unique('day', 'daily_meal_items_day_unique');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_tenant_role_status_index');
            $table->dropUnique('users_tenant_email_unique');
            $table->dropUnique('users_tenant_phone_unique');
            $table->dropUnique('users_tenant_username_unique');
            $table->dropUnique('users_tenant_token_unique');
            $table->unique('email', 'users_email_unique');
            $table->unique('phone', 'users_phone_unique');
            $table->unique('username', 'users_username_unique');
            $table->unique('token_no', 'users_token_no_unique');
            $table->dropForeign('users_tenant_fk');
            $table->dropColumn('tenant_id');
        });

        foreach (array_reverse(self::TENANT_TABLES) as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropForeign($tableName.'_tenant_fk');
                $table->dropIndex($tableName.'_tenant_id_index');
                $table->dropColumn('tenant_id');
            });
        }

        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('tenants');
    }
};
