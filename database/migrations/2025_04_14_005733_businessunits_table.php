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
        //
        Schema::create('business_units', function (Blueprint $table) {
            $table->id('businessunit_id');
            $table->string('businessunit_name');
            $table->string('businessunit_image_path')->nullable();
            $table->string('businessunit_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('business_units');
        Schema::enableForeignKeyConstraints();
    }
};
