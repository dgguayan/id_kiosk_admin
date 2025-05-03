<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Check if the column doesn't already exist
            if (!Schema::hasColumn('employees', 'id_last_exported_at')) {
                $table->timestamp('id_last_exported_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Only drop if the column exists
            if (Schema::hasColumn('employees', 'id_last_exported_at')) {
                $table->dropColumn('id_last_exported_at');
            }
        });
    }
};
