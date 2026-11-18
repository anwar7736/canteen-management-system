<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payments')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('users')
                    ->whereColumn('users.token_no', 'payments.token_no');
            })
            ->delete();

        DB::table('monthly_statements')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('users')
                    ->whereColumn('users.token_no', 'monthly_statements.token_no');
            })
            ->delete();
    }

    public function down(): void
    {
        // Deleted demo snapshots cannot be reconstructed.
    }
};
