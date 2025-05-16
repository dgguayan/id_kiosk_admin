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
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid()->primary();
            $table->string('id_no')->nullable();
            $table->date('date_hired');
            $table->string('employee_firstname');
            $table->string('employee_middlename')->nullable();
            $table->string('employee_lastname');
            $table->string('employee_name_extension')->nullable();
            $table->string('address');
            $table->date('birthday');
            $table->string('position');
            $table->string('tin_no')->nullable();
            $table->string('sss_no')->nullable();
            $table->string('hdmf_no')->nullable();
            $table->string('phic_no')->nullable();
            $table->string('emergency_name');
            $table->string('emergency_contact_number');
            $table->string('emergency_address');
            $table->unsignedBigInteger('businessunit_id');
            $table->enum('id_status', ['printed', 'pending'])->default('pending');
            $table->text('reason')->nullable();
            $table->enum('employment_status', ['active', 'inactive', 'resigned', 'terminated'])->default('inactive');
            $table->integer('employee_id_counter')->default(0);

            // upload files ni siya
            $table->string('image_person')->nullable();
            $table->string('image_signature')->nullable();
            $table->string('image_qrcode')->nullable();
            
            $table->timestamps(); // Add timestamps for created_at and updated_at

            // Foreign key sa business unit
            $table->foreign('businessunit_id')->references('businessunit_id')->on('business_units')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
